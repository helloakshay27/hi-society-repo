/**
 * Usage Dashboard — LIVE PostHog API client.
 *
 * Same backend as the Runwal dashboard (`/posthog-runwal-dashboard?app_id=12`):
 *   {base}/fm/adoption/{endpoint}?from=&to=&device_type=&os=&app_id=
 * where base = '/posthog-api' on localhost, else posthog-api.lockated.com.
 *
 * Difference: app_id is STATIC per site (not read from the URL):
 *   Artesia → 27 · Sunteck → 16 · Suncity → 6
 */
import type {
  AdoptionEngagementResponse,
  AdoptionTrendResponse,
  GrowthResponse,
  ModulesResponse,
  RecentActiveUsersResponse,
  RetentionResponse,
  RolesResponse,
  TrafficSessionResponse,
  UsageDistributionResponse,
  WorkflowUsageResponse,
} from '../../pages/posthog-runwal-dashboard/api/types';

export type SiteKey = 'artesia' | 'sunteck' | 'suncity';
export type DeviceKey = 'all' | 'ios' | 'android';

export interface SiteRef {
  key: SiteKey;
  label: string;
  appId: string;
}

export const SITES: SiteRef[] = [
  { key: 'artesia', label: 'Artesia', appId: '27' },
  { key: 'sunteck', label: 'Sunteck', appId: '16' },
  { key: 'suncity', label: 'Suncity', appId: '6' },
];

export function siteByKey(key: SiteKey): SiteRef {
  return SITES.find((s) => s.key === key) ?? SITES[0];
}

/**
 * Use the dev-server proxy locally so the browser does not enforce the
 * upstream PostHog host's CORS headers; use an absolute API base elsewhere.
 *
 * Resolution order:
 *   1. /posthog-api on localhost (Vite proxy)
 *   2. VITE_FM_ADOPTION_API_URL / VITE_POSTHOG_API_URL (build env)
 *   3. localStorage 'posthog_api_url' (per-deployment override)
 *   4. Tenant baseUrl (localStorage 'baseUrl' from login) when it already
 *      points at an absolute backend host — keeps the call on the same
 *      landscape the app was launched against
 *   5. Default shared host https://posthog-api.lockated.com
 */
function getPosthogApiBase(): string {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return '/posthog-api';
  }

  const env =
    (import.meta as any).env?.VITE_FM_ADOPTION_API_URL ||
    (import.meta as any).env?.VITE_POSTHOG_API_URL;
  if (env) return env;

  try {
    const stored = localStorage.getItem('posthog_api_url');
    if (stored && /^https?:\/\//.test(stored)) return stored.replace(/\/+$/, '');

    const tenant = localStorage.getItem('baseUrl') || '';
    if (/^https?:\/\//.test(tenant) && !/localhost|127\.0\.0\.1/.test(tenant)) {
      return tenant.replace(/\/+$/, '');
    }
  } catch {
    /* storage unavailable — fall through to default */
  }

  return DEFAULT_POSTHOG_API;
}

export interface QueryInput {
  appId: string;
  from: string;
  to: string;
  dev: DeviceKey;
}

function deviceParams(dev: DeviceKey): Record<string, string> {
  if (dev === 'ios') return { device_type: 'Mobile', os: 'ios' };
  if (dev === 'android') return { device_type: 'Mobile', os: 'Android' };
  return { device_type: 'Mobile' };
}

function buildQuery(input: QueryInput, extra: Record<string, any> = {}): string {
  const parts: string[] = [];
  if (input.from) parts.push(`from=${encodeURIComponent(input.from)}`);
  if (input.to) parts.push(`to=${encodeURIComponent(input.to)}`);
  for (const [k, v] of Object.entries(deviceParams(input.dev))) {
    parts.push(`${k}=${encodeURIComponent(v)}`);
  }
  parts.push(`app_id=${encodeURIComponent(input.appId)}`);
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null && v !== '') {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.join('&');
}

const DEFAULT_POSTHOG_API = 'https://posthog-api.lockated.com';

export async function fetchRecentActiveUsers(
  input: Pick<QueryInput, 'appId' | 'from' | 'to'>,
  limit = 10,
): Promise<RecentActiveUsersResponse> {
  const params = new URLSearchParams({
    app_id: input.appId,
    device_type: 'mobile',
    from: input.from,
    to: input.to,
    limit: String(limit),
  });
  return getPosthog<RecentActiveUsersResponse>('recent_active_users', params.toString());
}

async function getFrom<T>(base: string, endpoint: string, query: string): Promise<T> {
  const clean = base.endsWith('/') ? base.slice(0, -1) : base;
  const res = await fetch(`${clean}/fm/adoption/${endpoint}?${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`PostHog API ${endpoint} failed (${res.status})`);
  return (await res.json()) as T;
}

async function getPosthog<T>(endpoint: string, query: string): Promise<T> {
  const base = getPosthogApiBase();
  try {
    return await getFrom<T>(base, endpoint, query);
  } catch (e) {
    // Tenant baseUrl doesn't serve /fm/adoption everywhere — retry once on the
    // shared host before giving up (page falls back to mock per-card anyway).
    const norm = (u: string) => u.replace(/\/+$/, '').toLowerCase();
    if (norm(base) !== norm(DEFAULT_POSTHOG_API)) {
      return getFrom<T>(DEFAULT_POSTHOG_API, endpoint, query);
    }
    throw e;
  }
}

const num = (v: unknown, fb = 0): number =>
  typeof v === 'number' && !Number.isNaN(v) ? v : fb;

/** API may return a ratio (0.72) or a percent (72) — normalize to 0..1. */
const ratio = (v: unknown): number | null => {
  if (typeof v !== 'number' || Number.isNaN(v)) return null;
  return v > 1 ? v / 100 : v;
};

const dayLabel = (day: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  if (m) return `${m[3]}/${m[2]}`;
  return day;
};

/* ---------------- consolidated live payload (all fields optional) ---------------- */

export interface LiveUsageDay {
  label: string;
  visitors: number;
  views: number;
  sessions: number;
}

export interface LiveDashboard {
  tiles: {
    active: number;
    views: number;
    sessions: number;
    avgSessionSec: number;
    bounce: number;
    online: number;
  } | null;
  tileDeltas: Record<string, number | null>;
  usage: { current: LiveUsageDay[]; previous: LiveUsageDay[] } | null;
  deviceShares: { ios: number; android: number } | null; // 0..1
  viewsPerSession: number | null;
  engagement: {
    seatUtil: number | null; // 0..1
    stickiness: number | null; // 0..1
    adoptionDeltaPct: number | null;
    activation14: number | null; // 0..1
    breadthInUse: number | null;
    breadthTotal: number | null;
    dormant: number | null;
  };
  adoptionWeekly: { labels: string[]; cur: number[]; prev: number[] } | null;
  growth: { labels: string[]; nw: number[]; ret: number[]; res: number[]; dorm: number[] } | null;
  cohorts: { label: string; values: (number | null)[] }[] | null;
  roles: { label: string; sharePct: number }[] | null;
  modules: { name: string; users: number; sessions: number }[] | null;
}

export type TrafficSlice = Pick<
  LiveDashboard,
  'tiles' | 'tileDeltas' | 'usage' | 'deviceShares' | 'viewsPerSession'
>;
export type AdoptionSlice = Pick<
  LiveDashboard,
  'engagement' | 'adoptionWeekly' | 'growth' | 'cohorts' | 'roles' | 'modules'
>;

/** Blank merged state — sections fill in as their layer loads. */
export const EMPTY_DASHBOARD: LiveDashboard = {
  tiles: null,
  tileDeltas: {},
  usage: null,
  deviceShares: null,
  viewsPerSession: null,
  engagement: {
    seatUtil: null,
    stickiness: null,
    adoptionDeltaPct: null,
    activation14: null,
    breadthInUse: null,
    breadthTotal: null,
    dormant: null,
  },
  adoptionWeekly: null,
  growth: null,
  cohorts: null,
  roles: null,
  modules: null,
};

const settled = async <T>(p: Promise<T>): Promise<T | null> => {
  try {
    return await p;
  } catch (e) {
    console.warn('[usage-dashboard] endpoint failed:', e);
    return null;
  }
};

/** Traffic & Session layer: tiles + usage trend + device split (3 calls). */
export async function fetchTrafficSection(input: QueryInput): Promise<TrafficSlice> {
  const q = (extra: Record<string, any> = {}) => buildQuery(input, extra);
  const [traffic, usage] = await Promise.all([
    settled(getPosthog<TrafficSessionResponse>('traffic_session', q())),
    settled(getPosthog<UsageDistributionResponse>('usage_and_distribution', q())),
  ]);

  // --- device shares from os_breakdown (fallback: device session_share) ---
  let deviceShares: LiveDashboard['deviceShares'] = null;
  const devs = usage?.device_split?.devices;
  if (Array.isArray(devs) && devs.length > 0) {
    let ios = 0;
    let and = 0;
    for (const d of devs) {
      if (Array.isArray(d.os_breakdown) && d.os_breakdown.length > 0) {
        for (const o of d.os_breakdown) {
          if (/ios/i.test(o.os || '')) ios += num(o.users);
          else and += num(o.users);
        }
      } else {
        if (/ios/i.test(d.device || '')) ios += num(d.users);
        else and += num(d.users);
      }
    }
    const tot = ios + and;
    if (tot > 0) deviceShares = { ios: ios / tot, android: and / tot };
  }

  return {
    tiles: traffic
      ? {
          active: num(traffic.tiles?.active_users),
          views: num(traffic.tiles?.screen_views),
          sessions: num(traffic.tiles?.sessions),
          avgSessionSec: num(traffic.tiles?.avg_session_seconds),
          bounce: num(traffic.tiles?.bounce_rate),
          online: num(traffic.tiles?.recently_online),
        }
      : null,
    tileDeltas: (traffic?.delta_pct as Record<string, number | null>) ?? {},
    usage: usage
      ? {
          current: (usage.usage_over_time?.current ?? []).map((d) => ({
            label: dayLabel(d.day),
            visitors: num(d.visitors),
            views: num(d.views),
            sessions: num(d.sessions),
          })),
          previous: (usage.usage_over_time?.previous ?? []).map((d) => ({
            label: dayLabel(d.day),
            visitors: num(d.visitors),
            views: num(d.views),
            sessions: num(d.sessions),
          })),
        }
      : null,
    deviceShares,
    viewsPerSession: usage ? num(usage.views_per_session, -1) : null,
  };
}

/** Adoption & Engagement layer: engagement, trends, cohorts, roles, modules (6 calls). */
export async function fetchAdoptionSection(input: QueryInput): Promise<AdoptionSlice> {
  const q = (extra: Record<string, any> = {}) => buildQuery(input, extra);
  const [engagement, trend, growth, retention, roles, modules] = await Promise.all([
    settled(getPosthog<AdoptionEngagementResponse>('adoption_engagement', q())),
    settled(getPosthog<AdoptionTrendResponse>('adoption_trend', q({ weeks: 8 }))),
    settled(getPosthog<GrowthResponse>('growth', q({ weeks: 6 }))),
    settled(getPosthog<RetentionResponse>('retention', q({ weeks: 8 }))),
    settled(getPosthog<RolesResponse>('roles', q())),
    settled(getPosthog<ModulesResponse>('modules', q())),
  ]);

  // --- retention cohorts: keep insertion order, skip cohort_week/size ---
  let cohorts: LiveDashboard['cohorts'] = null;
  if (Array.isArray(retention?.cohorts) && retention.cohorts.length > 0) {
    cohorts = retention.cohorts.slice(0, 6).map((c) => {
      const values: (number | null)[] = [];
      for (const [k, v] of Object.entries(c)) {
        if (k === 'cohort_week' || k === 'size') continue;
        if (typeof v === 'number') values.push(v <= 1 ? Math.round(v * 100) : Math.round(v));
        else values.push(null);
        if (values.length >= 6) break;
      }
      return { label: String((c as any).cohort_week ?? ''), values };
    });
  }

  return {
    engagement: {
      seatUtil: ratio(engagement?.seat_utilisation?.value),
      stickiness: ratio(engagement?.stickiness?.value),
      adoptionDeltaPct:
        typeof engagement?.stickiness?.delta_pct === 'number' ? engagement.stickiness.delta_pct : null,
      activation14: ratio(engagement?.activation?.value),
      breadthInUse: engagement ? num(engagement.module_breadth?.in_use, -1) : null,
      breadthTotal: engagement ? num(engagement.module_breadth?.total, -1) : null,
      dormant: engagement ? num(engagement.dormant_users?.value, -1) : null,
    },
    adoptionWeekly: trend
      ? {
          labels: trend.weekly.current.map((w) => w.week),
          cur: trend.weekly.current.map((w) => num(w.wau)),
          prev: trend.weekly.previous.map((w) => num(w.wau)),
        }
      : null,
    growth: growth
      ? {
          labels: growth.weeks.map((w) => w.week),
          nw: growth.weeks.map((w) => num(w.new)),
          ret: growth.weeks.map((w) => num(w.returning)),
          res: growth.weeks.map((w) => num(w.resurrected)),
          dorm: growth.weeks.map((w) => num(w.dormant)),
        }
      : null,
    cohorts,
    roles:
      roles && Array.isArray(roles.roles) && roles.total_users > 0
        ? roles.roles
            .slice()
            .sort((a, b) => b.users - a.users)
            .slice(0, 4)
            .map((r) => ({ label: r.role, sharePct: (num(r.users) / roles.total_users) * 100 }))
        : null,
    modules: Array.isArray(modules?.tree)
      ? modules.tree.map((m) => ({ name: m.name, users: num(m.users), sessions: num(m.sessions) }))
      : null,
  };
}

/* ---------------- per-workflow funnel (live, fallback null) ---------------- */

export interface LiveFunnelStep {
  step: string;
  reach: number;
  dropPct: number | null;
}
export interface LiveFlowRow {
  path: string;
  users: number;
  events: number;
  sessions: number;
  comp: number | null;
}
export interface LiveEntryRow {
  screen: string;
  visitors: number;
  views: number;
  bounce: number;
}
export interface LiveWorkflow {
  funnel: LiveFunnelStep[];
  adoptionPct: number | null;
  completionPct: number | null;
  flows: LiveFlowRow[];
  entry: LiveEntryRow[];
}

export async function fetchLiveWorkflow(
  input: QueryInput,
  module: string,
): Promise<LiveWorkflow> {
  const err = (e: unknown) => (e instanceof Error ? e.message : String(e));
  // 1) module-scoped funnel first.
  try {
    const scoped = await getPosthog<WorkflowUsageResponse>(
      'workflow_usage',
      buildQuery(input, { module }),
    );
    const mapped = mapWorkflow(scoped);
    if (mapped) return mapped;
  } catch (e) {
    console.warn(`[usage-dashboard] workflow_usage module '${module}' failed:`, e);
  }
  // 2) Fallback: aggregate funnel without module filter (backend module
  // names vary by app — e.g. app_id 27 may not know 'serviceRequestCreate').
  const res = await getPosthog<WorkflowUsageResponse>(
    'workflow_usage',
    buildQuery(input, {}),
  ).catch((e) => {
    throw new Error(
      `workflow_usage failed (app_id ${input.appId}, module '${module}'): ${err(e)}`,
    );
  });
  const mapped = mapWorkflow(res);
  if (!mapped) {
    throw new Error(
      `workflow_usage returned no funnel steps (app_id ${input.appId}, module '${module}')`,
    );
  }
  return mapped;
}

function mapWorkflow(res: WorkflowUsageResponse | null): LiveWorkflow | null {
  try {
    if (!res || !Array.isArray(res.funnel) || res.funnel.length === 0) return null;
    const funnel: LiveFunnelStep[] = res.funnel.map((s) => ({
      step: s.step,
      reach: num(s.reach),
      dropPct: typeof s.drop_pct === 'number' ? s.drop_pct : null,
    }));
    const kpis = res.kpis ?? {};
    const pick = (...keys: string[]): number | null => {
      for (const k of keys) {
        const v = (kpis as Record<string, any>)[k]?.value;
        if (typeof v === 'number') return v <= 1 ? v * 100 : v;
      }
      return null;
    };
    let completionPct = pick('completion_rate', 'completion', 'conversion_rate');
    if (completionPct === null && funnel.length > 1 && funnel[0].reach > 0) {
      completionPct = (funnel[funnel.length - 1].reach / funnel[0].reach) * 100;
    }
    return {
      funnel,
      adoptionPct: pick('adoption', 'adoption_rate', 'workflow_adoption'),
      completionPct,
      flows: (res.flows ?? []).map((f) => ({
        path: f.path,
        users: num(f.users),
        events: num(f.events),
        sessions: num(f.sessions),
        comp: typeof f.f_comp === 'number' ? f.f_comp : null,
      })),
      entry: (res.entry_screens ?? []).map((e) => ({
        screen: e.path,
        visitors: num(e.visitors),
        views: num(e.views),
        bounce: num(e.bounce),
      })),
    };
  } catch (e) {
    console.warn('[usage-dashboard] mapWorkflow failed:', e);
    return null;
  }
}

/* ---------------- 3-site league (one traffic_session per app_id) ---------------- */

export interface LeagueRow {
  site: string;
  active: number;
  sessions: number;
  avgMin: number;
  bounce: number;
}

export async function fetchSitesLeague(input: Omit<QueryInput, 'appId'>): Promise<LeagueRow[] | null> {
  const rows = await Promise.all(
    SITES.map(async (s) => {
      const t = await settled(
        getPosthog<TrafficSessionResponse>(
          'traffic_session',
          buildQuery({ ...input, appId: s.appId }),
        ),
      );
      if (!t) return null;
      return {
        site: s.label,
        active: num(t.tiles?.active_users),
        sessions: num(t.tiles?.sessions),
        avgMin: num(t.tiles?.avg_session_seconds) / 60,
        bounce: num(t.tiles?.bounce_rate),
      } as LeagueRow;
    }),
  );
  const ok = rows.filter((r): r is LeagueRow => r !== null);
  return ok.length > 0 ? ok : null;
}
