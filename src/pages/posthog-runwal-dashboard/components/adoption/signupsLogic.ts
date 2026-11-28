/**
 * Sign-ups: the numbers behind the tiles, the named list and every people panel, all from Hi Society's
 * Manage Users accounts (GET /crm/admin/user_societies.json).
 *
 *   Registered Customers         every account created up to the end of the selected dates
 *   New Registrations            accounts created within the selected dates
 *   Registered, Never Logged In  accounts up to the end date with no phone registered for the app
 *                                (Manage Users' app_downloaded; a phone is registered at the first login)
 *   By project                   those accounts per society (in Hi Society each Runwal project is a society)
 *   Logged-in Rate               logged in ÷ registered (up to the end date)
 *   Over time                    accounts created per day / week / month, and the period before
 *   Funnel                       registered within the dates -> of them, logged in
 *   By store                     of those registered within the dates, who has the app on iOS / Android
 *   Gap                          registered and never logged in, per day / week / month of registration
 *
 * Platform: Manage Users says, for each account, whether its app is on an iPhone and / or an Android phone
 * (app_downloaded.ios / .android). iOS or Android keeps the accounts with the app on that platform, so
 * people who never logged in, who have no phone yet, have no platform.
 *
 * Phase: Hi Society's display_view, where 'Pre Sales' is Post Sales and 'Post Sales' is Post Possession.
 */
import type { HiSocietyAccount, SiteLookupItem } from '../../api/types';
import { maskContact } from '../../data/mask';

export type Phase = 'Post Sales' | 'Post Possession';

export interface AccountRow {
  key: string;
  userId: string;
  name: string;
  email: string;
  mobile: string;
  societyId: string;
  society: string;
  flat: string;
  phase: Phase | null;
  /** ISO time the account was created. */
  registered: string | null;
  /** The IST day it was created, YYYY-MM-DD. */
  registeredDay: string | null;
  loggedIn: boolean;
  /** 'iOS', 'Android', 'iOS, Android' or '—' (no phone registered). */
  platform: string;
  ios: boolean;
  android: boolean;
  approval: 'Approved' | 'Pending' | 'Rejected';
  residentType: string;
  /** Whole days since the account was created. */
  waiting: number | null;
}

/** Hi Society's display_view -> the dashboard's phase. */
export function phaseOf(displayView: string | null | undefined): Phase | null {
  const v = (displayView || '').trim().toLowerCase();
  if (v === 'pre sales') return 'Post Sales';
  if (v === 'post sales') return 'Post Possession';
  return null;
}

/** The dashboard's display_view ("0" Post Sales, "1" Post Possession, "0,1" both) -> Hi Society's name. */
export function hiSocietyDisplayView(displayView: string | undefined): 'Pre Sales' | 'Post Sales' | undefined {
  if (displayView === '0') return 'Pre Sales';
  if (displayView === '1') return 'Post Sales';
  return undefined;
}

const DAY = 86_400_000;

export function toRows(accounts: HiSocietyAccount[], societies: SiteLookupItem[], now = new Date()): AccountRow[] {
  const names = new Map(societies.map((s) => [s.id, s.name]));
  const seen = new Set<string>();
  const rows: AccountRow[] = [];
  for (const a of accounts) {
    const key = String(a.id);
    if (seen.has(key)) continue; // a row can come twice if the list moves between pages
    seen.add(key);
    const app = a.app_downloaded || {};
    const platform = [app.ios ? 'iOS' : '', app.android ? 'Android' : ''].filter(Boolean).join(', ');
    const created = a.created_at ? new Date(a.created_at) : null;
    const societyId = a.id_society != null ? String(a.id_society) : '';
    rows.push({
      key,
      userId: a.id_user != null ? String(a.id_user) : '',
      name: (a.full_name || '').trim() || '—',
      // Never shown in full: first 2 and last 2 characters (../../data/mask).
      email: maskContact(a.email),
      mobile: maskContact(a.mobile),
      societyId,
      society: names.get(societyId) || (societyId ? `Society ${societyId}` : '—'),
      flat: [a.block_no, a.flat_no].filter(Boolean).join(' / '),
      phase: phaseOf(a.display_view),
      registered: created && !isNaN(created.getTime()) ? created.toISOString() : null,
      registeredDay: istDay(a.created_at),
      loggedIn: !!(app.any_app_downloaded || app.ios || app.android),
      platform: platform || '—',
      ios: !!app.ios,
      android: !!app.android,
      approval: a.approve === true ? 'Approved' : a.approve === false ? 'Rejected' : 'Pending',
      residentType: a.resident_type || '',
      waiting: created && !isNaN(created.getTime()) ? Math.max(0, Math.floor((now.getTime() - created.getTime()) / DAY)) : null,
    });
  }
  return rows;
}

export type Platform = 'all' | 'ios' | 'android';

/** The accounts with the app on that platform ('all' keeps every account). */
export function onPlatform(rows: AccountRow[], platform: Platform): AccountRow[] {
  if (platform === 'ios') return rows.filter((r) => r.ios);
  if (platform === 'android') return rows.filter((r) => r.android);
  return rows;
}

export interface ProjectRow {
  societyId: string;
  /** The society's name: in Hi Society each Runwal project is a society. */
  project: string;
  registered: number;
  loggedIn: number;
  never: number;
  /** One phase, or 'Both' when the project has accounts in each. null when none has a phase. */
  phase: Phase | 'Both' | null;
  rows: AccountRow[];
  /** Why this society could not be read; null when it was. */
  error: string | null;
}

/** Accounts per project (society), most registered first; every chosen society has a row, even with none. */
export function byProject(
  rows: AccountRow[],
  chosen: { id: string; name: string; error?: string | null }[]
): ProjectRow[] {
  const m = new Map<string, ProjectRow>();
  chosen.forEach((c) =>
    m.set(c.id, { societyId: c.id, project: c.name, registered: 0, loggedIn: 0, never: 0, phase: null, rows: [], error: c.error ?? null })
  );
  rows.forEach((r) => {
    const p = m.get(r.societyId) || { societyId: r.societyId, project: r.society, registered: 0, loggedIn: 0, never: 0, phase: null, rows: [], error: null };
    p.registered += 1;
    if (r.loggedIn) p.loggedIn += 1;
    else p.never += 1;
    if (r.phase) p.phase = p.phase && p.phase !== r.phase ? 'Both' : p.phase || r.phase;
    p.rows.push(r);
    m.set(r.societyId, p);
  });
  return [...m.values()].sort((a, b) => b.registered - a.registered || a.project.localeCompare(b.project));
}

/** Never logged in, longest waiting first (oldest account first). */
export function neverLoggedIn(rows: AccountRow[]): AccountRow[] {
  return rows
    .filter((r) => !r.loggedIn)
    .sort((a, b) => (a.registered || '').localeCompare(b.registered || '') || a.name.localeCompare(b.name));
}

/** How many of the rows are in each phase (accounts with no phase are counted in neither). */
export function phaseSplit(rows: AccountRow[]): Record<Phase, number> {
  const out: Record<Phase, number> = { 'Post Sales': 0, 'Post Possession': 0 };
  rows.forEach((r) => {
    if (r.phase) out[r.phase] += 1;
  });
  return out;
}

// Unrounded: shown cut to two decimals with pct2, never rounded.
export const pctOf = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "Nov 20, 2026" (IST). */
export function fmtDayYear(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(new Date(iso).getTime() + 330 * 60_000);
  if (isNaN(d.getTime())) return '—';
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
/** "Nov 20, 2026" from YYYY-MM-DD. */
export const fmtYmd = (ymd: string) => fmtDayYear(`${ymd}T12:00:00+05:30`);

/* ---------- days (YYYY-MM-DD, IST) and chart buckets ---------- */

const IST_MS = 330 * 60_000;
/** The IST calendar day of a timestamp, YYYY-MM-DD; null when it does not parse. */
export function istDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t + IST_MS).toISOString().slice(0, 10);
}
const dayMs = (day: string) => Date.parse(`${day}T00:00:00Z`);
export const addDays = (day: string, n: number) => new Date(dayMs(day) + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((dayMs(b) - dayMs(a)) / DAY);
/** "Jul 2" */
export const fmtDay = (day: string) => `${MON[Number(day.slice(5, 7)) - 1]} ${Number(day.slice(8, 10))}`;
export const inDays = (day: string | null, from: string, to: string) => !!day && day >= from && day <= to;

export type Grouping = 'day' | 'week' | 'month';
export const GROUP_WORD: Record<Grouping, string> = { day: 'day', week: 'week', month: 'month' };

export interface Bucket {
  /** Axis label. */
  label: string;
  /** "Jun 23 – Jun 29", or one day. */
  span: string;
  start: string;
  end: string;
}

/**
 * The wireframe's grouping, ending on the range's last day: by day, one point per day of the range (7 to 90);
 * by week, the last 8 weeks; by month, the last 7 thirty-day months. shift = 1 gives the period just before.
 */
export function buckets(from: string, to: string, g: Grouping, shift = 0): Bucket[] {
  const rangeDays = Math.max(1, daysBetween(from, to) + 1);
  const n = g === 'day' ? Math.max(7, Math.min(rangeDays, 90)) : g === 'week' ? 8 : 7;
  const span = g === 'day' ? 1 : g === 'week' ? 7 : 30;
  const out: Bucket[] = [];
  for (let i = 0; i < n; i++) {
    const end = addDays(to, -((n - 1 - i) * span + shift * n * span));
    const start = addDays(end, -(span - 1));
    out.push({ label: g === 'week' ? fmtDay(start) : fmtDay(end), span: span === 1 ? fmtDay(end) : `${fmtDay(start)} – ${fmtDay(end)}`, start, end });
  }
  return out;
}

/** The rows registered within each bucket. */
export const rowsIn = (rows: AccountRow[], b: Bucket) => rows.filter((r) => inDays(r.registeredDay, b.start, b.end));
