/**
 * Downloads & sign-ups: a group at the bottom of Adoption & Engagement on Runwal Connect and Realty (not CP),
 * built from the Runwal Connect wireframe's "Downloads & sign-ups" view. Only the parts Hi Society's Manage
 * Users API answers in full are here: the Registered Customers, New Registrations, Logged-in Rate and
 * Registered Never Logged In tiles; registrations over time; the registration -> login funnel; logged-in
 * customers by store; the registered-but-not-logged-in bars; the named "Needs a nudge" list; and registered
 * customers by project. Every number opens the people behind it.
 *
 * Filters, as the rest of the page:
 *   society   the dashboard's society picker: one society, or All Societies (every society of the user).
 *             Manage Users answers only for the society selected in Hi Society, so each chosen society is
 *             selected and read in turn (fetchAccountsBySociety); one society stays selected afterwards.
 *   dates     every request sends them: accounts up to the end date, and accounts within the dates.
 *   phase     Runwal Connect's Post Sales / Post Possession, sent as display_view; under both, the split.
 *   platform  iOS / Android keep the accounts with the app on that platform (Manage Users records each
 *             account's phones); people who never logged in have no phone, so no platform.
 * In Hi Society each Runwal project is a society, so "by project" is by society.
 */
import React, { useMemo, useState } from 'react';
import type { DashboardFilters, SiteLookupItem } from '../../api/types';
import { useAccountsBySociety } from '../../hooks/useDashboardAnalytics';
import { Card } from '../common/Card';
import { InfoButton } from '../common/InfoButton';
import { ErrorState } from '../common/DashboardStates';
import { TableSkeleton } from '../common/Skeleton';
import { PeopleDrawer, type DrawerColumn, type DrawerSpec } from '../common/PeopleDrawer';
import { LineChart } from '../charts/LineChart';
import {
  type AccountRow,
  type Bucket,
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
  neverLoggedIn,
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

/** One bar per bucket; a click opens that bucket's people. */
const ClickBars: React.FC<{ buckets: Bucket[]; values: number[]; color: string; hint: string; onClick: (i: number) => void }> = ({
  buckets: bs,
  values,
  color,
  hint,
  onClick,
}) => {
  const W = 680, H = 230, pl = 44, pr = 14, pt = 14, pb = 30;
  const ch = H - pt - pb, base = H - pb, n = bs.length;
  const mx = Math.max(1, ...values) * 1.14;
  const slot = (W - pl - pr) / Math.max(1, n);
  const bw = Math.max(2, Math.min(30, slot * 0.62));
  const step = Math.max(1, Math.ceil(n / 10));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={hint}>
      {[0, 1, 2].map((k) => {
        const y = pt + (ch * k) / 2;
        return (
          <g key={k}>
            {k < 2 && <line x1={pl} y1={y} x2={W - pr} y2={y} stroke="var(--chart-grid, var(--border))" strokeDasharray="2 4" />}
            <text x={pl - 11} y={y + 4} textAnchor="end" fontSize="11" fill="var(--faint)">
              {Math.round(mx * (1 - k / 2))}
            </text>
          </g>
        );
      })}
      {bs.map((b, i) => {
        const x = pl + i * slot + (slot - bw) / 2;
        const h = (values[i] / mx) * ch;
        return (
          <g key={b.start}>
            {values[i] > 0 && (
              <rect
                className="dl-seg"
                role="button"
                tabIndex={0}
                aria-label={`${b.span}: ${values[i]}. ${hint}`}
                x={x.toFixed(1)}
                y={(base - h).toFixed(1)}
                width={bw.toFixed(1)}
                height={h.toFixed(1)}
                fill={color}
                onClick={() => onClick(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(i);
                  }
                }}
              >
                <title>{`${b.span}: ${values[i]} · ${hint}`}</title>
              </rect>
            )}
            {i % step === 0 && (
              <text x={(x + bw / 2).toFixed(1)} y={H - 9} textAnchor="middle" fontSize="11" fill="var(--faint)">
                {b.label}
              </text>
            )}
          </g>
        );
      })}
      <line x1={pl} y1={base} x2={W - pr} y2={base} stroke="var(--chart-line, var(--border-2))" />
    </svg>
  );
};

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
  const [drawer, setDrawer] = useState<DrawerSpec<AccountRow> | null>(null);
  const [trendGrp, setTrendGrp] = useState<Grouping>('day');
  const [gapGrp, setGapGrp] = useState<Grouping>('week');
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
  // Never logged in = no phone, so no platform: only under All platforms.
  const neverAll = useMemo(() => neverLoggedIn(accounts), [accounts]);
  const never = platformName ? [] : neverAll;
  const top10 = never.slice(0, 10);
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
  // Registered within the dates, every platform: an account has no platform until its owner logs in.
  const registeredInRange = useMemo(() => toRows(read.flatMap((s) => s.inRange), societies), [read, societies]);
  const loggedInRange = registeredInRange.filter(onPhone);
  const neverInRange = registeredInRange.filter((r) => !r.loggedIn);
  const storeRows = useMemo(
    () => ({ ios: registeredInRange.filter((r) => r.ios), android: registeredInRange.filter((r) => r.android) }),
    [registeredInRange]
  );
  const trendCur = useMemo(() => buckets(filters.from, filters.to, trendGrp), [filters.from, filters.to, trendGrp]);
  const trendPrev = useMemo(() => buckets(filters.from, filters.to, trendGrp, 1), [filters.from, filters.to, trendGrp]);
  const gapB = useMemo(() => buckets(filters.from, filters.to, gapGrp), [filters.from, filters.to, gapGrp]);

  const isLoading = ready && q.isLoading;
  const answered = ready && !!q.data;
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

  const columns = (waiting: boolean): DrawerColumn<AccountRow>[] => [
    { key: 'name', label: 'Customer', value: (r) => r.name, render: (r) => <span className="cpn">{r.name}</span> },
    { key: 'society', label: 'Project', value: (r) => r.society },
    { key: 'flat', label: 'Tower / Flat', value: (r) => r.flat || '—' },
    ...(showPhase ? [{ key: 'phase', label: 'Phase', value: (r: AccountRow) => r.phase || '—' }] : []),
    // People who never logged in have no phone, so no platform.
    ...(waiting ? [] : [{ key: 'platform', label: 'Platform', value: (r: AccountRow) => r.platform }]),
    { key: 'registered', label: 'Registered', num: true, value: (r) => r.registered || '', render: (r) => fmtDayYear(r.registered) },
    ...(waiting
      ? [{ key: 'waiting', label: 'Waiting', num: true, value: (r: AccountRow) => r.waiting ?? 0, render: (r: AccountRow) => (r.waiting != null ? `${r.waiting} d` : '—') }]
      : []),
    {
      key: 'status',
      label: 'Status',
      value: (r) => (r.loggedIn ? 'Logged in' : 'Never logged in'),
      render: (r) => <span className={`dl-st ${r.loggedIn ? 'in' : 'out'}`}>{r.loggedIn ? 'Logged in' : 'Never logged in'}</span>,
    },
    { key: 'email', label: 'Email', value: (r) => r.email, csvOnly: true },
    { key: 'mobile', label: 'Mobile', value: (r) => r.mobile, csvOnly: true },
    { key: 'approval', label: 'Approval', value: (r) => r.approval, csvOnly: true },
    { key: 'resident', label: 'Owner / Tenant', value: (r) => r.residentType, csvOnly: true },
    { key: 'user_id', label: 'User ID', value: (r) => r.userId, csvOnly: true },
  ];

  const open = (title: string, sub: string, rows: AccountRow[], note: React.ReactNode, opts: { waiting?: boolean } = {}) =>
    setDrawer({
      title,
      sub,
      rows,
      columns: columns(!!opts.waiting),
      rowKey: (r) => r.key,
      sortKey: opts.waiting ? 'waiting' : 'registered',
      sortDir: -1,
      note,
      csvName: `${title.replace(/[^\w]+/g, '_').toLowerCase()}.csv`,
    });

  const openNever = () =>
    open(
      'Registered, never logged in',
      `Customers of ${where} with an account created up to ${fmtYmd(filters.to)} who have never logged in, longest waiting first.`,
      never,
      <><b>Check:</b> the number of people listed equals the &ldquo;Registered, Never Logged In&rdquo; tile ({fmtN(never.length)}).</>,
      { waiting: true }
    );

  const openLogged = () =>
    open(
      `Logged in${platformName ? ` on ${platformName}` : ''}`,
      `Customers of ${scopeName}${phaseName ? ` (${phaseName})` : ''} with an account created up to ${fmtYmd(filters.to)} who have logged in${platformName ? ` on ${platform === 'ios' ? 'an iPhone' : 'an Android phone'}` : ''}.`,
      loggedAll,
      <><b>Check:</b> the number of people listed equals the logged-in figure under the Logged-in Rate tile ({fmtN(loggedAll.length)}).</>
    );

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

  const reading =
    q.isFetching && progress && progress.total > 1 ? (
      <div className="dl-notice" style={{ marginTop: 12 }}>
        Reading <b>{fmtN(Math.min(progress.done + 1, progress.total))}</b> of {fmtN(progress.total)} societies… Hi Society&rsquo;s Manage Users
        answers for one society at a time, so each is selected in Hi Society in turn and then the one you were on is selected again.
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
            {platformName} keeps the accounts with the app on {platform === 'ios' ? 'an iPhone' : 'an Android phone'}; people who never logged in
            have no phone yet, so no platform.
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
          {reading}
          {answered && failed.length > 0 && (
            <div className="dl-notice" style={{ marginTop: 12 }}>
              Could not read {failed.map((f) => names.get(f.societyId) || `society ${f.societyId}`).join(', ')} ({failed[0].error}). The numbers
              leave {failed.length === 1 ? 'it' : 'them'} out.
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
              val={answered ? `${pctOf(loggedAll.length, accounts.length)}%` : '—'}
              sub={
                answered
                  ? `${fmtN(loggedAll.length)} of ${fmtN(accounts.length)} registered have logged in${platformName ? ` on ${platformName}` : ''}`
                  : 'of registered customers'
              }
              loading={isLoading}
              onClick={answered ? openLogged : undefined}
            />
            <SuTile
              label="Registered, Never Logged In"
              infoKey="su.never"
              val={platformName ? '—' : val(never.length)}
              sub={
                platformName
                  ? `no phone yet, so not on ${platformName}: ${answered ? fmtN(neverAll.length) : '—'} under All platforms`
                  : answered
                    ? `${pctOf(never.length, all.length)}% of registered, no login yet`
                    : 'registered, no login yet'
              }
              split={platformName ? undefined : split(never)}
              loading={isLoading}
              onClick={answered && !platformName ? openNever : undefined}
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

          <div className="grid2" style={{ marginTop: '12px' }}>
            <Card id="card-suFunnel" infoKey="chart.suFunnel" eyebrow={`Funnel · ${rangeLabel}`} title="From registration to first login">
              {isLoading || !answered ? (
                <TableSkeleton rows={3} cols={3} />
              ) : (
                <>
                  <div className="dl-fun">
                    {([
                      ['Registered', registeredInRange, `Accounts created ${rl}`],
                      [platformName ? `Logged in on ${platformName}` : 'Logged in at least once', loggedInRange, `Of them, logged in${platformName ? ` on ${platformName}` : ''}`],
                    ] as [string, AccountRow[], string][]).map(([label, list, sub], i, steps) => {
                      const top = Math.max(1, steps[0][1].length);
                      const prevN = i ? steps[i - 1][1].length : null;
                      const drop = prevN ? Math.round((1 - list.length / prevN) * 100) : null;
                      return (
                        <React.Fragment key={label}>
                          {drop != null && <div className="dl-drop">▼ {drop}% drop-off</div>}
                          <div
                            className="dl-fr dl-click"
                            role="button"
                            tabIndex={0}
                            title={sub}
                            onClick={() => open(`${label} · ${rangeLabel}`, `${sub}, in ${scopeName}${phaseName ? ` (${phaseName})` : ''}.`, list, <><b>Check:</b> the number of people listed equals the {label} step ({fmtN(list.length)}).</>)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                (e.currentTarget as HTMLElement).click();
                              }
                            }}
                          >
                            <div className="dl-fl">{label}</div>
                            <div className="dl-fb"><i style={{ width: `${Math.max(2, Math.round((list.length / top) * 100))}%`, opacity: 1 - i * 0.22 }} /></div>
                            <div className="dl-fv">
                              {fmtN(list.length)}
                              <span>{steps[0][1].length ? `${Math.round((list.length / top) * 100)}%` : '—'}</span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="dl-foot">
                    {registeredInRange.length ? (
                      <>
                        <b>{fmtN(registeredInRange.length - loggedInRange.length)}</b> of the {fmtN(registeredInRange.length)} people who registered in {rl} have
                        not logged in{platformName ? ` on ${platformName}` : ''} yet.
                      </>
                    ) : (
                      <>Nobody registered in {rl}.</>
                    )}
                    {platformName ? <> Registration has no platform, so the first step counts every account.</> : null}
                  </div>
                </>
              )}
            </Card>

            <Card id="card-suStore" infoKey="chart.suStore" eyebrow="Where they logged in" title="Logged-in customers by store">
              {isLoading || !answered ? (
                <TableSkeleton rows={2} cols={3} />
              ) : (
                <>
                  <div className="hbars dl-store">
                    {([
                      ['ios', 'App Store (iOS)', storeRows.ios, 'var(--chart-violet, #8b7cf6)'],
                      ['android', 'Google Play (Android)', storeRows.android, 'var(--green)'],
                    ] as [Platform, string, AccountRow[], string][])
                      .filter(([k]) => platform === 'all' || platform === k)
                      .map(([k, label, list, color]) => {
                        const total = Math.max(1, storeRows.ios.length + storeRows.android.length);
                        return (
                          <div
                            className="role dl-click"
                            key={k}
                            role="button"
                            tabIndex={0}
                            onClick={() => open(`${label} · ${rangeLabel}`, `Customers of ${scopeName}${phaseName ? ` (${phaseName})` : ''} registered in ${rl} who have the app on ${k === 'ios' ? 'an iPhone' : 'an Android phone'}.`, list, <><b>Check:</b> the number of people listed equals the {label} figure ({fmtN(list.length)}).</>)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                (e.currentTarget as HTMLElement).click();
                              }
                            }}
                          >
                            <div className="rn">{label}</div>
                            <div className="rbar"><i style={{ width: `${list.length ? Math.max(1, Math.round((list.length / total) * 100)) : 0}%`, background: color }} /></div>
                            <div className="rv">{fmtN(list.length)}</div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="dl-foot">
                    Of the {fmtN(registeredInRange.length)} customers who registered in {rl}, by the phone they have the app on. Someone with an iPhone and an
                    Android phone counts on each. Customers who never logged in have no phone, so they are on neither.
                  </div>
                </>
              )}
            </Card>
          </div>

          <Card id="card-suGap" infoKey="chart.suGap" eyebrow={`Download gap · ${rangeLabel}`} title="Registered, but not logged in" style={{ marginTop: '12px' }}>
            {isLoading || !answered ? (
              <TableSkeleton rows={5} cols={4} />
            ) : platformName ? (
              <div className="dl-foot">
                People who never logged in have no phone yet, so they are on neither iOS nor Android. Choose <b>All platforms</b> to see them.
              </div>
            ) : (
              <>
                <div className="dl-kv">
                  <div
                    className="ku dl-click"
                    role="button"
                    tabIndex={0}
                    onClick={() => open(`Registered in ${rl}, never logged in`, `Accounts of ${where} created in ${rl} that have never logged in.`, neverInRange, <><b>Check:</b> the number of people listed equals the figure you clicked ({fmtN(neverInRange.length)}).</>, { waiting: true })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).click();
                      }
                    }}
                  >
                    <div className="kl"><i style={{ background: 'var(--chart-red, #d4705f)' }} />Registered in {rl}, never logged in</div>
                    <div className="kv2">{fmtN(neverInRange.length)}</div>
                    <div className="ks">of {fmtN(registeredInRange.length)} registered in {rl} · click to see who</div>
                  </div>
                </div>
                <div className="dl-ctrl">
                  <span className="dl-sub">Registered and not logged in, per {GROUP_WORD[gapGrp]} of registration</span>
                  <div className="dl-grp">
                    <span>Group by</span>
                    <Tabs label="Group by" items={GROUPS} value={gapGrp} onChange={(v) => setGapGrp(v as Grouping)} />
                  </div>
                </div>
                <ClickBars
                  buckets={gapB}
                  values={gapB.map((b) => rowsIn(neverAll, b).length)}
                  color="var(--chart-red, #d4705f)"
                  hint="click to see who"
                  onClick={(i) => {
                    const b = gapB[i];
                    const list = rowsIn(neverAll, b);
                    open(`Registered, never logged in · ${b.span}`, `Accounts of ${where} created in this ${GROUP_WORD[gapGrp]} that have never logged in.`, list, <><b>Check:</b> the number of people listed equals the bar you clicked ({fmtN(list.length)}).</>, { waiting: true });
                  }}
                />
                <div className="legend"><span><i style={{ background: 'var(--chart-red, #d4705f)' }} /> Registered, never logged in</span></div>
              </>
            )}
          </Card>

          <Card id="card-suNever" infoKey="chart.suNever" eyebrow="Needs a nudge · named list" title="Registered, but never logged in" style={{ marginTop: '12px' }}>
            {isLoading || !answered ? (
              <TableSkeleton rows={6} cols={6} />
            ) : platformName ? (
              <div className="dl-foot">
                People who never logged in have no phone yet, so they are on neither iOS nor Android. Choose <b>All platforms</b> to see them
                ({fmtN(neverAll.length)}).
              </div>
            ) : never.length ? (
              <>
                <div className="dl-sum">
                  <b>{fmtN(never.length)}</b> of {fmtN(all.length)} registered customers ({pctOf(never.length, all.length)}%) have never logged in.
                  Longest-waiting first.
                </div>
                <div className="dl-scroll">
                  <table className="dl-tbl">
                    <thead>
                      <tr>
                        <th className="analytics-header">Customer</th>
                        <th className="analytics-header">Project</th>
                        <th className="analytics-header">Tower / Flat</th>
                        {showPhase && <th className="analytics-header">Phase</th>}
                        <th className="analytics-header">Email</th>
                        <th className="analytics-header num">Registered</th>
                        <th className="analytics-header num">Waiting</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top10.map((r) => (
                        <tr key={r.key}>
                          <td><span className="cpn">{r.name}</span></td>
                          <td>{r.society}</td>
                          <td>{r.flat || '—'}</td>
                          {showPhase && <td>{r.phase || '—'}</td>}
                          <td><span className="dl-mail">{r.email || '—'}</span></td>
                          <td className="num">{fmtDayYear(r.registered)}</td>
                          <td className="num">{r.waiting != null ? `${r.waiting} d` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="dl-more">
                  <button type="button" className="dl-btn" onClick={openNever}>
                    View all {fmtN(never.length)} →
                  </button>
                </div>
              </>
            ) : (
              <div className="dl-foot">Everyone who registered up to {fmtYmd(filters.to)} has logged in at least once.</div>
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
                      <th className="analytics-header num">Never logged in</th>
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
                          <td className="num" colSpan={4}>could not be read</td>
                        ) : (
                          <>
                            <td className="num">{fmtN(p.registered)}</td>
                            <td className="num">{fmtN(p.loggedIn)}</td>
                            <td className="num">{platformName ? '—' : fmtN(p.never)}</td>
                            <td className="num">{platformName || !p.registered ? '—' : `${Math.round(pctOf(p.loggedIn, p.registered))}%`}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {platformName && (
                  <div className="dl-foot">
                    {platformName} only: every account counted has the app on {platformName}, so never logged in and the rate show under All
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
