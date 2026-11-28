/**
 * The people behind a usage number: clicking a tile, a chart point or a bar opens the signed-in people it
 * counts, from the same usage data and filters (GET <dashboard>/adoption/user_journeys?per_page=all, one row per
 * person). Only the dates or the platform change between charts:
 *   Active Users tile          the page's dates
 *   a day on Usage over time   that day
 *   a week on Adoption trend   that week (Monday to Sunday)
 *   a platform bar             the page's dates, people on that platform
 *   Recently Online            people whose last activity is under 30 minutes old
 * Emails come back masked (../../data/mask).
 */
import React, { useCallback, useState } from 'react';
import type { DashboardFilters, UserJourneyPerson } from '../../api/types';
import { fetchUserJourneys } from '../../api/api';
import { useUserSocieties } from '../../hooks/useDashboardAnalytics';
import { PeopleDrawer, type DrawerColumn, type DrawerSpec } from './PeopleDrawer';

export interface ActivePeopleRequest {
  /** Panel title, e.g. "Active users · Nov 20". */
  title: string;
  /** One line under the title: who is listed. */
  sub: string;
  /** The page's filters with what this number changes (dates, platform). */
  filters: DashboardFilters;
  /** What the number on the chart was, for the "Check" line; omit when there is none to compare. */
  expected?: number | null;
  /** Keep only some of the people (Recently Online: the last 30 minutes). */
  keep?: (p: UserJourneyPerson) => boolean;
  /** Ask for the most recently active first and at most this many (Recently Online). */
  newest?: number;
}

const fmtN = (n: number) => n.toLocaleString();
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "Nov 20, 2026, 10:42" in IST. */
function fmtSeen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const d = new Date(t + 330 * 60_000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${hh}:${mm}`;
}
const personName = (u: UserJourneyPerson) =>
  `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || `User ${u.user_id || u.user_key}`;

/** Opens the people behind a usage number. Render `drawer` once on the page. */
export function useActivePeople() {
  const { data: societies = [] } = useUserSocieties();
  const [spec, setSpec] = useState<DrawerSpec<UserJourneyPerson> | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(
    async (req: ActivePeopleRequest) => {
      setLoading(req.title);
      setError(null);
      try {
        const data = await fetchUserJourneys(
          req.filters,
          req.newest ? { perPage: req.newest, page: 1, sort: 'last_active', dir: 'desc' } : { perPage: 'all', sort: 'first_name', dir: 'asc' }
        );
        const people = (data?.people || []).filter((p) => (req.keep ? req.keep(p) : true));
        const names = new Map(societies.map((s) => [String(s.id), s.name]));
        const columns: DrawerColumn<UserJourneyPerson>[] = [
          { key: 'name', label: 'User', value: personName, render: (u) => <span className="cpn">{personName(u)}</span> },
          { key: 'society', label: 'Project', value: (u) => (u.society_id ? names.get(String(u.society_id)) || `Society ${u.society_id}` : '—') },
          { key: 'phase', label: 'Phase', value: (u) => u.phase || '—' },
          { key: 'sessions', label: 'Sessions', num: true, value: (u) => u.sessions },
          { key: 'last_seen', label: 'Last active', num: true, value: (u) => u.last_seen || '', render: (u) => fmtSeen(u.last_seen) },
          { key: 'email', label: 'Email', value: (u) => u.email || '', csvOnly: true },
          { key: 'user_id', label: 'User ID', value: (u) => u.user_id || '', csvOnly: true },
        ];
        setSpec({
          title: req.title,
          sub: req.sub,
          rows: people,
          columns,
          rowKey: (u) => u.user_key,
          sortKey: 'last_seen',
          sortDir: -1,
          note:
            req.expected != null ? (
              <><b>Check:</b> the number of people listed ({fmtN(people.length)}) equals the number you clicked ({fmtN(req.expected)}).</>
            ) : undefined,
          csvName: `${req.title.replace(/[^\w]+/g, '_').toLowerCase()}.csv`,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(null);
      }
    },
    [societies]
  );

  const drawer = (
    <>
      {loading && (
        <div className="ap-toast" role="status" aria-live="polite">
          <span className="dl-spin" aria-hidden="true" /> Loading the people behind “{loading}”…
        </div>
      )}
      {error && !loading && (
        <div className="ap-toast ap-toast-err" role="alert">
          Could not load the people: {error}
          <button type="button" className="dl-btn" onClick={() => setError(null)}>
            Close
          </button>
        </div>
      )}
      <PeopleDrawer spec={spec} onClose={() => setSpec(null)} />
    </>
  );

  return { open, drawer, loading };
}

/** YYYY-MM-DD plus n days. */
export const addDaysYmd = (ymd: string, n: number) =>
  new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** Today, YYYY-MM-DD, in the viewer's local time (the dashboard's dates are the viewer's). */
export const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
