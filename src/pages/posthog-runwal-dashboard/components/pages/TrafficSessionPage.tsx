import React, { useState, useMemo } from 'react';
import { DashboardFilters } from '../../api/types';
import { QuestionBox } from '../common/QuestionBox';
import { KpiTile } from '../common/KpiTile';
import { Card } from '../common/Card';
import { LineChart } from '../charts/LineChart';
import { ErrorState, EmptyState } from '../common/DashboardStates';
import { ChartSkeleton, BarsSkeleton } from '../common/Skeleton';
import {
  useTrafficSession,
  useUsageAndDistribution,
} from '../../hooks/useDashboardAnalytics';
import { pct2 } from '../../data/constants';
import { deltaText, previousCoverage } from '../../data/previousPeriod';
import { previousPeriodFor } from '../../api/usageDateRange';
import { platformRows } from './platformRows';
import { useActivePeople, todayYmd } from '../common/ActivePeople';

interface TrafficSessionPageProps {
  filters: DashboardFilters;
  showPrev: boolean;
  benchmarks: Record<string, number | null>;
  onBenchmarkChange: (id: string, value: number | null) => void;
  sitesSettled?: boolean;
  isRefreshing?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-11-20" -> "Nov 20". */
const fmtYmdShort = (ymd: string) => `${MONTHS[Number(ymd.slice(5, 7)) - 1]} ${Number(ymd.slice(8, 10))}`;

function formatSeconds(sec: number | null | undefined): string {
  if (sec == null || isNaN(sec) || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/** A rate as the Bounce Rate tile shows it: two decimals, cut not rounded (14.2833 -> "14.28%"). */
export const formatRate = (x: number | null | undefined) => pct2(x);

function densifyUsageData(
  fromStr: string,
  toStr: string,
  rawDays: { day: string; visitors: number; views: number; sessions: number }[] = []
) {
  const map = new Map<string, { visitors: number; views: number; sessions: number }>();
  for (const r of rawDays) {
    if (r && r.day) {
      map.set(r.day, {
        visitors: r.visitors || 0,
        views: r.views || 0,
        sessions: r.sessions || 0,
      });
    }
  }

  const result: { day: string; visitors: number; views: number; sessions: number }[] = [];
  const start = new Date(fromStr);
  const end = new Date(toStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return rawDays;
  }

  const cur = new Date(start);
  while (cur <= end) {
    const ymd = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    const existing = map.get(ymd);
    result.push({
      day: ymd,
      visitors: existing ? existing.visitors : 0,
      views: existing ? existing.views : 0,
      sessions: existing ? existing.sessions : 0,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

export const TrafficSessionPage: React.FC<TrafficSessionPageProps> = ({
  filters,
  showPrev,
  benchmarks,
  onBenchmarkChange,
  sitesSettled = true,
  isRefreshing = false,
}) => {
  const [usageTab, setUsageTab] = useState<'visitors' | 'views' | 'sessions'>('visitors');

  const {
    data: trafficData,
    isLoading: isTrafficLoading,
    isError: isTrafficError,
    error: trafficError,
    refetch: refetchTraffic,
  } = useTrafficSession(filters, sitesSettled);

  const {
    data: usageData,
    isLoading: isUsageLoading,
    isError: isUsageError,
    error: usageError,
    refetch: refetchUsage,
  } = useUsageAndDistribution(filters, sitesSettled);

  const serverPreviousDays = usageData?.usage_over_time?.previous || [];
  const previousRange = useMemo(
    () => previousPeriodFor(filters.from, filters.to),
    [filters.from, filters.to]
  );
  const previousFilters = useMemo(
    () => ({ ...filters, ...previousRange }),
    [filters, previousRange]
  );
  const previousUsageQuery = useUsageAndDistribution(
    previousFilters,
    sitesSettled && !!usageData && serverPreviousDays.length === 0 && !!previousRange.from
  );

  const isTrafficActiveLoading = isTrafficLoading || isRefreshing;
  const isUsageActiveLoading = isUsageLoading || isRefreshing;

  const tiles = trafficData?.tiles;
  const deltas = trafficData?.delta_pct;
  const prev = trafficData?.previous;
  const count = (x: number | undefined) => (x == null ? null : x.toLocaleString());
  // The change vs the previous period of the same length: (current − previous) ÷ previous × 100 from the
  // API, two decimals cut, with the previous value beside it (issue 5466); "No data in previous period"
  // when that period has none, and a "*" when it has fewer days of data than the range.
  const coverage = previousCoverage(trafficData);
  // No previous period line when that period has no data: a flat line at 0 would read as "no users then".
  const drawPrev = showPrev && coverage.state !== 'none';

  const activeUsersDelta = deltaText(deltas?.active_users, coverage, count(prev?.active_users));
  const screenViewsDelta = deltaText(deltas?.screen_views, coverage, count(prev?.screen_views));
  const sessionsDelta = deltaText(deltas?.sessions, coverage, count(prev?.sessions));
  const avgSessionDelta = deltaText(
    deltas?.avg_session_seconds,
    coverage,
    prev?.avg_session_seconds == null ? null : formatSeconds(prev.avg_session_seconds)
  );
  const bounceDelta = deltaText(deltas?.bounce_rate, coverage, prev?.bounce_rate == null ? null : formatRate(prev.bounce_rate));

  // Densify usage days so line charts display full continuous date curves
  const currentUsageDays = useMemo(() => {
    const raw = usageData?.usage_over_time?.current || [];
    return densifyUsageData(filters.from, filters.to, raw);
  }, [filters.from, filters.to, usageData?.usage_over_time?.current]);

  const previousUsageDays = useMemo(() => {
    const raw = serverPreviousDays.length > 0
      ? serverPreviousDays
      : previousUsageQuery.data?.usage_over_time?.current || [];
    if (raw.length === 0 && !previousUsageQuery.isSuccess) return [];
    return densifyUsageData(previousRange.from, previousRange.to, raw);
  }, [serverPreviousDays, previousUsageQuery.data?.usage_over_time?.current, previousUsageQuery.isSuccess, previousRange]);

  // Every people number opens the people behind it (../common/ActivePeople).
  const people = useActivePeople();
  const platformWord = filters.devPlatform === 'ios' ? ' on iOS' : filters.devPlatform === 'android' ? ' on Android' : '';
  const span = (from: string, to: string) => (from === to ? fmtYmdShort(from) : `${fmtYmdShort(from)} – ${fmtYmdShort(to)}`);
  const openActive = () =>
    people.open({
      title: `Active users · ${span(filters.from, filters.to)}`,
      sub: `People who used the app ${span(filters.from, filters.to)}${platformWord}, with the page's filters.`,
      filters,
      expected: tiles?.active_users ?? null,
    });
  const openOnline = () =>
    people.open({
      title: 'Recently online',
      sub: `People whose last activity was in the last 30 minutes${platformWord}, with the page's filters (any date range).`,
      filters: { ...filters, from: todayYmd(), to: todayYmd() },
      newest: 100,
      keep: (p) => p.minutes_ago != null && p.minutes_ago <= 30,
      expected: tiles?.recently_online ?? null,
    });
  const openDay = (i: number, count?: number) => {
    const day = currentUsageDays[i]?.day;
    if (!day) return;
    people.open({
      title: `Active users · ${fmtYmdShort(day)}`,
      sub: `People who used the app on ${fmtYmdShort(day)}${platformWord}, with the page's filters.`,
      filters: { ...filters, from: day, to: day },
      expected: count ?? null,
    });
  };
  const openPlatform = (name: string, users: number) => {
    const dev = name === 'iOS' ? 'ios' : name === 'Android' ? 'android' : null;
    if (!dev) return;
    people.open({
      title: `Active users on ${name} · ${span(filters.from, filters.to)}`,
      sub: `People whose phone is ${name === 'iOS' ? 'an iPhone' : 'an Android phone'} (the one they used last), active ${span(filters.from, filters.to)}.`,
      filters: { ...filters, devPlatform: dev },
      expected: users,
    });
  };

  const chartLabels = currentUsageDays.map((d) => {
    const parts = d.day.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
    }
    return d.day;
  });

  const getSeries = (days: typeof currentUsageDays, key: 'visitors' | 'views' | 'sessions') =>
    days.map((d) => d[key] || 0);

  const curVisitors = getSeries(currentUsageDays, 'visitors');
  const prevVisitors = getSeries(previousUsageDays, 'visitors');

  const curViews = getSeries(currentUsageDays, 'views');
  const prevViews = getSeries(previousUsageDays, 'views');

  const curSessions = getSeries(currentUsageDays, 'sessions');
  const prevSessions = getSeries(previousUsageDays, 'sessions');

  // Device / platform split (issues 5461 / 5462): each active user counted ONCE, on the platform they
  // used last (the API's platform_usage), so Android + iOS = Active Users and each share is
  // platform users ÷ active users × 100, the formula in the card's (i).
  const platformSplit = useMemo(() => platformRows(usageData), [usageData]);
  const deviceColors: Record<string, string> = {
    Desktop: 'var(--chart-blue)',
    Mobile: 'var(--green)',
    iOS: 'var(--chart-violet)',
    Android: 'var(--chart-mint)',
    Tablet: 'var(--chart-amber)',
  };

  const viewsPerSession =
    usageData?.views_per_session != null
      ? usageData.views_per_session.toFixed(1)
      : tiles && tiles.sessions > 0
      ? (tiles.screen_views / tiles.sessions).toFixed(1)
      : '—';

  return (
    <section className="page on" id="pgTraffic">
      <div className="section-head">
        <h2>Traffic &amp; Session</h2>
        <span className="sd">
          Monitor overall application traffic, customer activity, and session behavior from usage data.
        </span>
      </div>

      <QuestionBox
        questions={[
          'How many customers are actively using the application, and how frequently?',
          'Which devices generate the highest traffic, and how are sessions behaving over time?',
        ]}
      />

      {isTrafficError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorState
            title="Failed to load Traffic & Session metrics"
            error={trafficError}
            onRetry={() => refetchTraffic()}
          />
        </div>
      )}

      <div className="tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KpiTile
          id="activeUsers"
          infoKey="U1"
          label="Active Users"
          val={tiles ? tiles.active_users.toLocaleString() : isTrafficActiveLoading ? '...' : '0'}
          dir={activeUsersDelta.dir}
          delta={activeUsersDelta.text}
          sub="unique active users"
          raw={tiles?.active_users}
          unit=""
          goodUp={true}
          benchmark={benchmarks.activeUsers}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isTrafficActiveLoading}
          onClick={tiles ? openActive : undefined}
        />
        <KpiTile
          id="screenViews"
          infoKey="U2"
          label="Screen Views"
          val={tiles ? tiles.screen_views.toLocaleString() : isTrafficActiveLoading ? '...' : '0'}
          dir={screenViewsDelta.dir}
          delta={screenViewsDelta.text}
          sub="total screen events"
          raw={tiles?.screen_views}
          noTarget={true}
          isLoading={isTrafficActiveLoading}
        />
        <KpiTile
          id="totalSessions"
          infoKey="U3"
          label="Sessions"
          val={tiles ? tiles.sessions.toLocaleString() : isTrafficActiveLoading ? '...' : '0'}
          dir={sessionsDelta.dir}
          delta={sessionsDelta.text}
          sub="sessions in period"
          raw={tiles?.sessions}
          noTarget={true}
          isLoading={isTrafficActiveLoading}
        />
        <KpiTile
          id="avgSessionDur"
          infoKey="U4"
          label="Session Duration"
          val={tiles ? formatSeconds(tiles.avg_session_seconds) : isTrafficActiveLoading ? '...' : '—'}
          dir={avgSessionDelta.dir}
          delta={avgSessionDelta.text}
          sub="average per session"
          raw={tiles?.avg_session_seconds}
          noTarget={true}
          isLoading={isTrafficActiveLoading}
        />
        <KpiTile
          id="bounceRate"
          infoKey="U5"
          label="Bounce Rate"
          val={tiles ? formatRate(tiles.bounce_rate) : isTrafficActiveLoading ? '...' : '0%'}
          dir={bounceDelta.dir}
          delta={bounceDelta.text}
          sub="lower is better"
          raw={tiles?.bounce_rate}
          unit="%"
          goodUp={false}
          benchmark={benchmarks.bounceRate}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isTrafficActiveLoading}
        />
        <KpiTile
          id="recentlyOnline"
          infoKey="U6"
          label="Recently Online"
          val={tiles ? tiles.recently_online.toLocaleString() : isTrafficActiveLoading ? '...' : '0'}
          dir="flat"
          delta={null}
          sub="active in the last 30 min · not tied to the date range"
          noTarget={true}
          isLoading={isTrafficActiveLoading}
          onClick={tiles ? openOnline : undefined}
        />
      </div>

      <div className="grid2">
        <Card
          id="card-trafficActive"
          infoKey="chart.usage"
          eyebrow="Usage over time · Live usage data"
          title="Usage over time"
          purpose="Active users, screen views, and sessions over time, with previous period comparison from the usage_and_distribution API."
        >
          {isUsageError ? (
            <ErrorState
              title="Failed to load usage trend"
              error={usageError}
              onRetry={() => refetchUsage()}
            />
          ) : isUsageActiveLoading ? (
            <ChartSkeleton height={220} />
          ) : currentUsageDays.length === 0 ? (
            <EmptyState message="No usage data recorded for this period" />
          ) : (
            <>
              {showPrev && previousUsageQuery.isError && (
                <div style={{ marginBottom: '12px' }}>
                  <ErrorState
                    title="Failed to load previous-period usage"
                    error={previousUsageQuery.error}
                    onRetry={() => previousUsageQuery.refetch()}
                  />
                </div>
              )}
              <div className="charttabs" style={{ marginBottom: '10px' }}>
                <button
                  type="button"
                  className={usageTab === 'visitors' ? 'on' : ''}
                  onClick={() => setUsageTab('visitors')}
                >
                  Active Users
                </button>
                <button
                  type="button"
                  className={usageTab === 'views' ? 'on' : ''}
                  onClick={() => setUsageTab('views')}
                >
                  Views
                </button>
                <button
                  type="button"
                  className={usageTab === 'sessions' ? 'on' : ''}
                  onClick={() => setUsageTab('sessions')}
                >
                  Sessions
                </button>
              </div>

              <div>
                {usageTab === 'visitors' && (
                  <>
                    <LineChart
                      cur={curVisitors}
                      prev={drawPrev && prevVisitors.length === curVisitors.length && prevVisitors.length > 1 ? prevVisitors : null}
                      labels={chartLabels}
                      color="var(--chart-blue)"
                      fill="var(--chart-fill)"
                      showPrev={drawPrev && prevVisitors.length === curVisitors.length && prevVisitors.length > 1}
                      curLabel="Active Users"
                      prevLabel="Prev Period"
                      clickHint="Click a day to see who was active"
                      onPointClick={(i) => openDay(i, curVisitors[i])}
                    />
                    <div className="legend">
                      <span>
                        <i style={{ background: 'var(--chart-blue)' }}></i> Current Active Users
                      </span>
                      {showPrev && coverage.state === 'none' && (
                        <span>No data in previous period ({coverage.dates})</span>
                      )}
                      {drawPrev && prevVisitors.length === curVisitors.length && prevVisitors.length > 1 && (
                        <span>
                          <i className="dash"></i> Previous Period{coverage.state === 'partial' ? ' *' : ''}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {usageTab === 'views' && (
                  <>
                    <LineChart
                      cur={curViews}
                      prev={drawPrev && prevViews.length === curViews.length && prevViews.length > 1 ? prevViews : null}
                      labels={chartLabels}
                      color="var(--chart-violet)"
                      fill="var(--chart-violet-tint)"
                      showPrev={drawPrev && prevViews.length === curViews.length && prevViews.length > 1}
                      curLabel="Views"
                      prevLabel="Prev Period"
                      clickHint="Click a day to see who was active"
                      onPointClick={(i) => openDay(i, curVisitors[i])}
                    />
                    <div className="legend">
                      <span>
                        <i style={{ background: 'var(--chart-violet)' }}></i> Current Views
                      </span>
                      {showPrev && coverage.state === 'none' && (
                        <span>No data in previous period ({coverage.dates})</span>
                      )}
                      {drawPrev && prevViews.length === curViews.length && prevViews.length > 1 && (
                        <span>
                          <i className="dash"></i> Previous Period{coverage.state === 'partial' ? ' *' : ''}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {usageTab === 'sessions' && (
                  <>
                    <LineChart
                      cur={curSessions}
                      prev={drawPrev && prevSessions.length === curSessions.length && prevSessions.length > 1 ? prevSessions : null}
                      labels={chartLabels}
                      color="var(--green)"
                      fill="var(--green-tint)"
                      showPrev={drawPrev && prevSessions.length === curSessions.length && prevSessions.length > 1}
                      curLabel="Sessions"
                      prevLabel="Prev Period"
                      clickHint="Click a day to see who was active"
                      onPointClick={(i) => openDay(i, curVisitors[i])}
                    />
                    <div className="legend">
                      <span>
                        <i style={{ background: 'var(--green)' }}></i> Current Sessions
                      </span>
                      {showPrev && coverage.state === 'none' && (
                        <span>No data in previous period ({coverage.dates})</span>
                      )}
                      {drawPrev && prevSessions.length === curSessions.length && prevSessions.length > 1 && (
                        <span>
                          <i className="dash"></i> Previous Period{coverage.state === 'partial' ? ' *' : ''}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </Card>

        <Card
          id="card-deviceSplit"
          infoKey="chart.devices"
          eyebrow="Device / platform split"
          title="Device platform distribution"
          purpose="Active users on each platform, each user counted once on the platform they used last, as a share of all active users."
        >
          {isUsageError ? (
            <ErrorState
              title="Failed to load device split"
              error={usageError}
              onRetry={() => refetchUsage()}
            />
          ) : isUsageActiveLoading ? (
            <BarsSkeleton count={3} />
          ) : platformSplit.rows.length === 0 ? (
            <EmptyState message="No device distribution data found" />
          ) : (
            <>
              <div className="hbars platform-split">
                {platformSplit.rows.map((d) => {
                  const barColor = deviceColors[d.platform] || 'var(--chart-blue)';
                  return (
                    <div
                      className={`role${d.platform === 'iOS' || d.platform === 'Android' ? ' role-click' : ''}`}
                      key={d.platform}
                      {...(d.platform === 'iOS' || d.platform === 'Android'
                        ? {
                            role: 'button',
                            tabIndex: 0,
                            title: `See the ${d.users.toLocaleString()} people on ${d.platform}`,
                            onClick: () => openPlatform(d.platform, d.users),
                            onKeyDown: (e: React.KeyboardEvent) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openPlatform(d.platform, d.users);
                              }
                            },
                          }
                        : {})}
                    >
                      <div className="rn">{d.platform}</div>
                      <div className="rbar">
                        <i
                          style={{
                            width: `${Math.min(100, Math.max(0, d.share))}%`,
                            background: barColor,
                          }}
                        ></i>
                      </div>
                      <div className="rv" title={`${d.users.toLocaleString()} of ${platformSplit.totalUsers.toLocaleString()} active users`}>
                        {pct2(d.share)}
                        <span className="rv-sub"> · {d.users.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="kv" style={{ marginTop: '14px' }}>
                <div>
                  <div className="k">Active users</div>
                  <div className="v" style={{ fontSize: '18px' }}>
                    {platformSplit.totalUsers.toLocaleString()}
                  </div>
                  <div className="u">{platformSplit.sumLabel}</div>
                </div>
                <div>
                  <div className="k">Views / session</div>
                  <div className="v" style={{ fontSize: '18px' }}>
                    {viewsPerSession}
                  </div>
                  <div className="u">screens per visit</div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
      {people.drawer}
    </section>
  );
};
