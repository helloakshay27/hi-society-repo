/**
 * Downloads & sign-ups: a group at the bottom of Adoption & Engagement on Runwal Connect and Realty (not CP),
 * built from the Runwal Connect wireframe's "Downloads & sign-ups" view. Only the parts Hi Society's Manage
 * Users API answers in full are here: the Registered Customers, New Registrations and Logged-in Rate tiles;
 * registrations over time; registered vs active users (registered from Manage Users, active from the app's
 * usage data, the Active Users of Traffic & Session); and registered customers by project. Every number opens
 * the people behind it. Nothing says "never logged in": Manage Users cannot tell that reliably, so the
 * Registered Never Logged In tile, the by-store card, the download-gap bars, the "Needs a nudge" list and the
 * never-logged-in column and status were taken off (27 Nov 2026, the product owner's request).
 *
 * Filters, as the rest of the page:
 *   society   the dashboard's society picker: one society, or All Societies (every society of the user).
 *             Manage Users answers only for the society selected in Hi Society, so each chosen society is
 *             selected and read in turn (fetchAccountsBySociety); one society stays selected afterwards.
 *   dates     every request sends them: accounts up to the end date, and accounts within the dates.
 *   phase     Runwal Connect's Post Sales / Post Possession, sent as display_view; under both, the split.
 *   platform  iOS / Android keep the accounts with the app on that platform (Manage Users records each
 *             account's phones).
 * In Hi Society each Runwal project is a society, so "by project" is by society.
 */
import React, { useMemo, useState } from 'react';
import type { DashboardFilters, SiteLookupItem } from '../../api/types';
import { useAccountsBySociety, useTrafficSession } from '../../hooks/useDashboardAnalytics';
import { fetchUserJourneys } from '../../api/api';
import type { UserJourneyPerson } from '../../api/types';
import { Card } from '../common/Card';
import { InfoButton } from '../common/InfoButton';
import { ErrorState } from '../common/DashboardStates';
import { TableSkeleton } from '../common/Skeleton';
import { PeopleDrawer, type DrawerColumn, type DrawerSpec } from '../common/PeopleDrawer';
import { LineChart } from '../charts/LineChart';
import { pct2 } from '../../data/constants';
import {
  type AccountRow,
  type Grouping,
  type Phase,
  type Platform,
  type ProjectRow,
  GROUP_WORD,
  buckets,
  byProject,
  fmtDayYear,
  fmtYmd,
  hiSocietyDisplayView,
  onPlatform,
  pctOf,
  phaseSplit,
  rowsIn,
  toRows,
} from './signupsLogic';

interface SignupsSectionProps {
  filters: DashboardFilters;
  societies: SiteLookupItem[];
  /** The dashboard's society picker: a society id or "all". */
  selectedSocietyId: string;
  societiesLoading?: boolean;
  rangeLabel: string;
  /** "Runwal Connect" / "Runwal Realty" */
  appName: string;
  /** Runwal Connect: show the Post Sales / Post Possession split. */
  showPhase: boolean;
  /** The page's "previous period" switch: the dashed line on the chart. */
  showPrev?: boolean;
  enabled?: boolean;
}

const GROUPS: [Grouping, string][] = [['day', 'Day'], ['week', 'Week'], ['month', 'Month']];

const Tabs: React.FC<{ items: [string, string][]; value: string; onChange: (v: string) => void; label: string }> = ({ items, value, onChange, label }) => (
  // No role="tablist": the app's global theme restyles every tablist (dark text on the dark theme).
  <div className="charttabs" aria-label={label}>
    {items.map(([k, text]) => (
      <button key={k} type="button" aria-pressed={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>
        {text}
      </button>
    ))}
  </div>
);


const fmtN = (n: number) => n.toLocaleString();

const SuTile: React.FC<{
  label: string;
  infoKey: string;
  val: string;
  sub?: React.ReactNode;
  split?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}> = ({ label, infoKey, val, sub, split, loading, onClick }) => (
  <div
    className={`tile${onClick ? ' drillable' : ''}`}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    aria-label={onClick ? `${label}: ${val}. See the people` : undefined}
    onClick={onClick}
    onKeyDown={(e) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <div className="tophead">
      <div className="lbl">{label}</div>
      <InfoButton infoKey={infoKey} />
    </div>
    <div className="val">{loading ? '…' : val}</div>
    {sub && <div className="sub2">{sub}</div>}
    {split && <div className="su-split">{split}</div>}
  </div>
);

export const SignupsSection: React.FC<SignupsSectionProps> = ({
  filters,
  societies,
  selectedSocietyId,
  societiesLoading = false,
  rangeLabel,
  appName,
  showPhase,
  showPrev = true,
  enabled = true,
}) => {
  // Registered accounts (Manage Users) or active users (usage data): the panel shows either.
  const [drawer, setDrawer] = useState<DrawerSpec<any> | null>(null);
  const [trendGrp, setTrendGrp] = useState<Grouping>('day');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const names = useMemo(() => new Map(societies.map((s) => [s.id, s.name])), [societies]);
  const allSocieties = selectedSocietyId === 'all';
  const societyIds = useMemo(
    () => (allSocieties ? societies.map((s) => s.id) : [selectedSocietyId]),
    [allSocieties, selectedSocietyId, societies]
  );
  const displayView = showPhase ? hiSocietyDisplayView(filters.displayView) : undefined;
  const ready = enabled && !societiesLoading && societyIds.length > 0 && !!filters.from && !!filters.to;

  const q = useAccountsBySociety(
    { societyIds, from: filters.from, to: filters.to, displayView },
    ready,
    (done, total) => setProgress({ done, total })
  );

  const platform: Platform = filters.devPlatform === 'ios' || filters.devPlatform === 'android' ? filters.devPlatform : 'all';
  const platformName = platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : null;
  const read = q.data?.societies || [];
  const accounts = useMemo(() => toRows(read.flatMap((s) => s.upTo), societies), [read, societies]);
  const all = useMemo(() => onPlatform(accounts, platform), [accounts, platform]);
  const fresh = useMemo(() => onPlatform(toRows(read.flatMap((s) => s.inRange), societies), platform), [read, societies, platform]);
  const projects = useMemo(
    () =>
      byProject(
        all,
        societyIds.map((id) => ({ id, name: names.get(id) || `Society ${id}`, error: read.find((s) => s.societyId === id)?.error ?? null }))
      ),
    [all, societyIds, names, read]
  );
  const failed = read.filter((s) => s.error);

  // Logged in on the chosen platform (any phone under All platforms).
  const onPhone = (r: AccountRow) => (platform === 'ios' ? r.ios : platform === 'android' ? r.android : r.loggedIn);
  const loggedAll = useMemo(() => accounts.filter(onPhone), [accounts, platform]); // eslint-disable-line react-hooks/exhaustive-deps
  // Active users: the Active Users of Traffic & Session for the same dates, society, phase and platform (the
  // app's usage data, not Manage Users). The same query as that page, so usually no extra request.
  const traffic = useTrafficSession(filters, ready);
  const activeCount = traffic.data?.tiles?.active_users;
  const [activeState, setActiveState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const trendCur = useMemo(() => buckets(filters.from, filters.to, trendGrp), [filters.from, filters.to, trendGrp]);
  const trendPrev = useMemo(() => buckets(filters.from, filters.to, trendGrp, 1), [filters.from, filters.to, trendGrp]);

  // While the accounts for new filters (dates, society, phase) are read, the section shows its loader, not
  // the previous filters' numbers (React Query keeps those as placeholder data until the new ones arrive).
  const isLoading = ready && (q.isLoading || q.isPlaceholderData);
  const answered = ready && !!q.data && !q.isPlaceholderData;
  const phaseName: Phase | null = displayView === 'Pre Sales' ? 'Post Sales' : displayView === 'Post Sales' ? 'Post Possession' : null;
  const splitShown = showPhase && !phaseName;
  const scopeName = allSocieties ? `all ${fmtN(societyIds.length)} societies` : names.get(selectedSocietyId) || `society ${selectedSocietyId}`;
  const where = `${scopeName}${phaseName ? ` (${phaseName})` : ''}${platformName ? ` with the app on ${platformName}` : ''}`;
  const onApp = platformName ? ` with the app on ${platformName}` : '';
  const rl = rangeLabel.toLowerCase();

  const split = (rows: AccountRow[]) => {
    if (!splitShown || !answered) return undefined;
    const s = phaseSplit(rows);
    return (
      <>
        Post Sales <b>{fmtN(s['Post Sales'])}</b> · Post Possession <b>{fmtN(s['Post Possession'])}</b>
      </>
    );
  };

  const columns: DrawerColumn<AccountRow>[] = [
    { key: 'name', label: 'Customer', value: (r) => r.name, render: (r) => <span className="cpn">{r.name}</span> },
    { key: 'society', label: 'Project', value: (r) => r.society },
    { key: 'flat', label: 'Tower / Flat', value: (r) => r.flat || '—' },
    ...(showPhase ? [{ key: 'phase', label: 'Phase', value: (r: AccountRow) => r.phase || '—' }] : []),
    { key: 'platform', label: 'App on', value: (r: AccountRow) => r.platform },
    { key: 'registered', label: 'Registered', num: true, value: (r) => r.registered || '', render: (r) => fmtDayYear(r.registered) },
    { key: 'approval', label: 'Approval', value: (r) => r.approval, csvOnly: true },
    { key: 'resident', label: 'Owner / Tenant', value: (r) => r.residentType, csvOnly: true },
    { key: 'user_id', label: 'User ID', value: (r) => r.userId, csvOnly: true },
  ];

  const open = (title: string, sub: string, rows: AccountRow[], note: React.ReactNode) =>
    setDrawer({
      title,
      sub,
      rows,
      columns,
      rowKey: (r) => r.key,
      sortKey: 'registered',
      sortDir: -1,
      note,
      csvName: `${title.replace(/[^\w]+/g, '_').toLowerCase()}.csv`,
    });

  const openLogged = () =>
    open(
      `Logged in${platformName ? ` on ${platformName}` : ''}`,
      `Customers of ${scopeName}${phaseName ? ` (${phaseName})` : ''} with an account created up to ${fmtYmd(filters.to)} who have logged in${platformName ? ` on ${platform === 'ios' ? 'an iPhone' : 'an Android phone'}` : ''}.`,
      loggedAll,
      <><b>Check:</b> the number of people listed equals the logged-in figure under the Logged-in Rate tile ({fmtN(loggedAll.length)}).</>
    );

  // The people behind Active users: every signed-in person active in the range with the page's filters, from
  // the same usage data as Traffic & Session (user_journeys, per_page=all: one row per person).
  const activeColumns: DrawerColumn<UserJourneyPerson>[] = [
    {
      key: 'name',
      label: 'User',
      value: (u) => `${u.first_name || ''} ${u.last_name || ''}`.trim() || `User ${u.user_id || u.user_key}`,
      render: (u) => <span className="cpn">{`${u.first_name || ''} ${u.last_name || ''}`.trim() || `User ${u.user_id || u.user_key}`}</span>,
    },
    { key: 'society', label: 'Project', value: (u) => (u.society_id ? names.get(String(u.society_id)) || `Society ${u.society_id}` : '—') },
    ...(showPhase ? [{ key: 'phase', label: 'Phase', value: (u: UserJourneyPerson) => u.phase || '—' }] : []),
    { key: 'sessions', label: 'Sessions', num: true, value: (u) => u.sessions },
    { key: 'last_seen', label: 'Last active', num: true, value: (u) => u.last_seen || '', render: (u) => fmtDayYear(u.last_seen) },
    { key: 'user_id', label: 'User ID', value: (u) => u.user_id || '', csvOnly: true },
  ];
  const openActive = async () => {
    if (activeState.loading) return;
    setActiveState({ loading: true, error: null });
    try {
      const data = await fetchUserJourneys(filters, { perPage: 'all', sort: 'first_name', dir: 'asc' });
      const people = data?.people || [];
      setActiveState({ loading: false, error: null });
      setDrawer({
        title: `Active users · ${rangeLabel}`,
        sub: `People who used the app in ${rl}${phaseName ? ` (${phaseName})` : ''}${platformName ? ` on ${platformName}` : ''}${
          allSocieties ? '' : `, in ${scopeName}`
        }: the Active Users of Traffic & Session.`,
        rows: people,
        columns: activeColumns,
        rowKey: (u: UserJourneyPerson) => u.user_key,
        sortKey: 'last_seen',
        sortDir: -1,
        note: <><b>Check:</b> the number of people listed equals Active users ({fmtN(people.length)}).</>,
        csvName: `active_users_${filters.from}_${filters.to}.csv`,
      });
    } catch (e) {
      setActiveState({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  };

  const openProject = (p: ProjectRow) =>
    open(
      p.project,
      `Registered customers of ${p.project}${phaseName ? ` (${phaseName})` : ''}${onApp}, accounts up to ${fmtYmd(filters.to)}.`,
      p.rows,
      <><b>Check:</b> the number of people listed equals the project&rsquo;s Registered figure ({fmtN(p.registered)}).</>
    );

  const val = (n: number) => (answered ? fmtN(n) : '—');

  let notice: React.ReactNode = null;
  if (!enabled || societiesLoading) notice = <>Loading your societies…</>;
  else if (!societies.length) notice = <>No Hi Society societies were found for this login, so there are no accounts to show.</>;

  const loader = isLoading ? (
    <div className="dl-loader" role="status" aria-live="polite">
      <span className="dl-spin" aria-hidden="true" />
      <span>
        Loading accounts
        {progress && progress.total > 1 ? (
          <> · {fmtN(Math.min(progress.done + 1, progress.total))} of {fmtN(progress.total)} societies</>
        ) : null}
        …
      </span>
      {progress && progress.total > 1 ? (
        <span className="dl-bar" aria-hidden="true">
          <i style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
        </span>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="dl-root" id="su-root">
      <div className="dl-group-head">
        <div>
          <h3>Downloads &amp; sign-ups</h3>
          <p>How many {appName} customers registered, and how many went on to log in.</p>
        </div>
      </div>
      <div className="dl-hint">
        Showing <b>{rangeLabel}</b>
        {phaseName ? <> · <b>{phaseName}</b></> : showPhase ? <> · Post Sales and Post Possession</> : null} · <b>{allSocieties ? 'All Societies' : scopeName}</b>
        {' · '}
        {platformName ? <b>{platformName}</b> : 'All platforms'}. Accounts are Hi Society&rsquo;s Manage Users accounts; &ldquo;logged in&rdquo;
        means the person has a phone registered for the app, which happens at the first login.
        {platformName ? (
          <>
            {' '}
            {platformName} keeps the accounts with the app on {platform === 'ios' ? 'an iPhone' : 'an Android phone'}.
          </>
        ) : null}
        {!allSocieties ? <> Picking a society above also selects it in Hi Society, as its header does.</> : null}
      </div>

      {notice ? (
        <div className="dl-notice" style={{ marginTop: 14 }}>{notice}</div>
      ) : q.error ? (
        <div style={{ marginTop: 14 }}>
          <ErrorState title="Failed to load accounts from Manage Users" error={q.error as Error} onRetry={() => q.refetch()} />
        </div>
      ) : (
        <>
          {loader}
          {answered && failed.length > 0 && (
            <div className="dl-notice dl-failed" style={{ marginTop: 12 }}>
              {failed.map((f) => (
                <div key={f.societyId}>
                  Could not read <b>{names.get(f.societyId) || `society ${f.societyId}`}</b>: {f.error}.
                </div>
              ))}
              <div>
                The numbers leave {failed.length === 1 ? 'it' : 'them'} out.{' '}
                <button type="button" className="dl-btn" onClick={() => q.refetch()}>
                  Try again
                </button>
              </div>
            </div>
          )}
          <div className="tiles dl-tiles">
            <SuTile
              label="Registered Customers"
              infoKey="su.registered"
              val={val(all.length)}
              sub={`accounts up to ${fmtYmd(filters.to)}${onApp}`}
              split={split(all)}
              loading={isLoading}
              onClick={
                answered
                  ? () =>
                      open('Registered customers', `Every account of ${where} created up to ${fmtYmd(filters.to)}.`, all, <><b>Check:</b> the number of people listed equals the Registered Customers tile ({fmtN(all.length)}).</>)
                  : undefined
              }
            />
            <SuTile
              label="New Registrations"
              infoKey="su.new"
              val={val(fresh.length)}
              sub={`registered in ${rl}${onApp}`}
              split={split(fresh)}
              loading={isLoading}
              onClick={
                answered
                  ? () =>
                      open('New registrations', `Accounts of ${where} created in ${rl} (${fmtYmd(filters.from)} – ${fmtYmd(filters.to)}).`, fresh, <><b>Check:</b> the number of people listed equals the New Registrations tile ({fmtN(fresh.length)}).</>)
                  : undefined
              }
            />
            <SuTile
              label="Logged-in Rate"
              infoKey="su.rate"
              val={answered ? pct2(pctOf(loggedAll.length, accounts.length)) : '—'}
              sub={
                answered
                  ? `${fmtN(loggedAll.length)} of ${fmtN(accounts.length)} registered have logged in${platformName ? ` on ${platformName}` : ''}`
                  : 'of registered customers'
              }
              loading={isLoading}
              onClick={answered ? openLogged : undefined}
            />
          </div>

          <Card id="card-suTrend" infoKey="chart.suTrend" eyebrow="Registrations · over time" title="Registrations over time" style={{ marginTop: '12px' }}>
            <div className="dl-ctrl">
              <span className="dl-sub">New accounts per {GROUP_WORD[trendGrp]}{onApp}</span>
              <div className="dl-grp">
                <span>Group by</span>
                <Tabs label="Group by" items={GROUPS} value={trendGrp} onChange={(v) => setTrendGrp(v as Grouping)} />
              </div>
            </div>
            {isLoading || !answered ? (
              <TableSkeleton rows={5} cols={4} />
            ) : (
              <>
                <LineChart
                  cur={trendCur.map((b) => rowsIn(all, b).length)}
                  prev={showPrev ? trendPrev.map((b) => rowsIn(all, b).length) : []}
                  showPrev={showPrev}
                  labels={trendCur.map((b) => b.label)}
                  color="var(--green)"
                  fill="var(--green-tint)"
                  curLabel="New registrations"
                  prevLabel="Previous period"
                  clickHint="Click to see who registered"
                  onPointClick={(i) => {
                    const b = trendCur[i];
                    const list = rowsIn(all, b);
                    open(`Registered · ${b.span}`, `Accounts of ${where} created in this ${GROUP_WORD[trendGrp]}.`, list, <><b>Check:</b> the number of people listed equals the point you clicked ({fmtN(list.length)}).</>);
                  }}
                />
                <div className="legend">
                  <span><i style={{ background: 'var(--green)' }} /> New registrations per {GROUP_WORD[trendGrp]}</span>
                  {showPrev && <span><i className="dash" /> Previous period</span>}
                </div>
                <div className="dl-foot">
                  Grouped by day, the points inside the selected dates add up to the New Registrations tile. Click a point to see who registered then.
                </div>
              </>
            )}
          </Card>

            <Card id="card-suActive" infoKey="chart.suActive" eyebrow={`Registered vs active · ${rangeLabel}`} title="Registered users vs active users" style={{ marginTop: '12px' }}>
              {isLoading || !answered || traffic.isLoading ? (
                <TableSkeleton rows={2} cols={3} />
              ) : (
                <>
                  <div className="dl-fun">
                    {(() => {
                      const registered = all.length;
                      const active = activeCount ?? null;
                      const top = Math.max(1, registered, active ?? 0);
                      const bars: { key: string; label: string; n: number | null; sub: string; color: string; onOpen: () => void }[] = [
                        {
                          key: 'registered',
                          label: 'Registered users',
                          n: registered,
                          sub: `Hi Society accounts up to ${fmtYmd(filters.to)}${onApp}`,
                          color: 'var(--blue)',
                          onOpen: () =>
                            open('Registered users', `Every account of ${where} created up to ${fmtYmd(filters.to)}.`, all, <><b>Check:</b> the number of people listed equals Registered users ({fmtN(registered)}).</>),
                        },
                        {
                          key: 'active',
                          label: 'Active users',
                          n: active,
                          sub: `used the app in ${rl}${platformName ? ` on ${platformName}` : ''}`,
                          color: 'var(--green)',
                          onOpen: openActive,
                        },
                      ];
                      return bars.map((b) => (
                        <div
                          key={b.key}
                          className="dl-fr dl-click"
                          role="button"
                          tabIndex={0}
                          title={`${b.sub}. Click to see who`}
                          aria-busy={b.key === 'active' && activeState.loading ? true : undefined}
                          onClick={b.onOpen}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              b.onOpen();
                            }
                          }}
                        >
                          <div className="dl-fl">
                            {b.label}
                            <span className="dl-fs">{b.key === 'active' && activeState.loading ? 'Loading the list…' : b.sub}</span>
                          </div>
                          <div className="dl-fb"><i style={{ width: `${b.n ? Math.max(2, Math.round((b.n / top) * 100)) : 0}%`, background: b.color }} /></div>
                          <div className="dl-fv">
                            {b.n == null ? '—' : fmtN(b.n)}
                            {b.key === 'active' && b.n != null && registered > 0 ? <span>{pct2(pctOf(b.n, registered))} of registered</span> : null}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  {activeState.error && (
                    <div className="dl-notice" style={{ marginTop: 10 }}>
                      Could not load the active users list: {activeState.error}.
                    </div>
                  )}
                  <div className="dl-foot">
                    Registered users come from Hi Society&rsquo;s Manage Users; active users are the Active Users of Traffic &amp; Session (people
                    who used the app in {rl}), with the same{showPhase ? ' phase,' : ''} platform and society.
                    {allSocieties ? <> Under All Societies, active users cover the whole app.</> : null} Click either to see the people.
                  </div>
                </>
              )}
            </Card>


          <Card id="card-suProject" infoKey="chart.suProject" eyebrow="By project" title="Registered customers by project" style={{ marginTop: '12px' }}>
            {isLoading || !answered ? (
              <TableSkeleton rows={5} cols={6} />
            ) : (
              <div className="dl-scroll">
                <table className="dl-tbl">
                  <thead>
                    <tr>
                      <th className="analytics-header">Project</th>
                      {showPhase && <th className="analytics-header">Phase</th>}
                      <th className="analytics-header num">Registered</th>
                      <th className="analytics-header num">Logged in</th>
                      <th className="analytics-header num">Logged-in rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr
                        key={p.societyId}
                        className={p.registered ? 'dl-click' : undefined}
                        tabIndex={p.registered ? 0 : undefined}
                        role={p.registered ? 'button' : undefined}
                        aria-label={p.registered ? `${p.project}: ${p.registered} registered. See them` : undefined}
                        onClick={p.registered ? () => openProject(p) : undefined}
                        onKeyDown={(e) => {
                          if (p.registered && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            openProject(p);
                          }
                        }}
                      >
                        <td><span className="cpn">{p.project}</span></td>
                        {showPhase && <td>{p.phase || '—'}</td>}
                        {p.error ? (
                          <td className="num" colSpan={3}>could not be read</td>
                        ) : (
                          <>
                            <td className="num">{fmtN(p.registered)}</td>
                            <td className="num">{fmtN(p.loggedIn)}</td>
                            <td className="num">{platformName || !p.registered ? '—' : pct2(pctOf(p.loggedIn, p.registered))}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {platformName && (
                  <div className="dl-foot">
                    {platformName} only: every account counted has the app on {platformName}, so the logged-in rate shows under All
                    platforms.
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}

      <PeopleDrawer spec={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
};
