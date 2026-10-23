import React, { useMemo, useState } from 'react';
import { DashboardFilters } from '../../../posthog-runwal-dashboard/api/types';
import { QuestionBox } from '../../../posthog-runwal-dashboard/components/common/QuestionBox';
import { KpiTile } from '../../../posthog-runwal-dashboard/components/common/KpiTile';
import { Card } from '../../../posthog-runwal-dashboard/components/common/Card';
import { LineChart } from '../../../posthog-runwal-dashboard/components/charts/LineChart';
import { ErrorState, EmptyState } from '../../../posthog-runwal-dashboard/components/common/DashboardStates';
import { useTrafficSession, useUsageAndDistribution } from '../../../posthog-runwal-dashboard/hooks/useDashboardAnalytics';
import { pct } from '../../../posthog-runwal-dashboard/data/constants';
import { previousPeriodFor } from '../../../posthog-runwal-dashboard/api/usageDateRange';

interface TrafficSessionPageProps {
  filters: DashboardFilters;
  showPrev: boolean;
  benchmarks: Record<string, number | null>;
  onBenchmarkChange: (id: string, value: number | null) => void;
  sitesSettled?: boolean;
}

type UsageKey = 'visitors' | 'views' | 'sessions';
type UsageDay = { day: string; visitors: number; views: number; sessions: number };

const USAGE_TABS: { key: UsageKey; label: string; color: string; fill: string }[] = [
  { key: 'visitors', label: 'Visitors', color: 'var(--chart-blue)', fill: 'var(--chart-fill)' },
  { key: 'views', label: 'Views', color: 'var(--chart-violet)', fill: 'var(--chart-violet-tint)' },
  { key: 'sessions', label: 'Sessions', color: 'var(--green)', fill: 'var(--green-tint)' },
];

const DEVICE_COLORS: Record<string, string> = {
  Desktop: 'var(--chart-blue)',
  Mobile: 'var(--green)',
  iOS: 'var(--chart-violet)',
  Android: 'var(--chart-mint)',
  Tablet: 'var(--chart-amber)',
};

function formatSeconds(sec: number | null | undefined): string {
  if (sec == null || isNaN(sec) || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatDelta(d: number | null | undefined): { text: string | null; dir: 'up' | 'dn' | 'flat' } {
  if (d == null || isNaN(d)) return { text: null, dir: 'flat' };
  const text = `${Math.abs(d).toFixed(1)}% vs prev. period`;
  return { text, dir: d > 0 ? 'up' : d < 0 ? 'dn' : 'flat' };
}

/** Fill days the API omitted with zeroes so the x-axis covers the whole range. */
function densifyUsageData(fromStr: string, toStr: string, rawDays: UsageDay[] = []): UsageDay[] {
  const map = new Map(rawDays.filter((r) => r && r.day).map((r) => [r.day, r]));
  const start = new Date(fromStr);
  const end = new Date(toStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return rawDays;
  const result: UsageDay[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const ymd = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    const e = map.get(ymd);
    result.push({ day: ymd, visitors: e?.visitors || 0, views: e?.views || 0, sessions: e?.sessions || 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

const Loading: React.FC<{ height: number; text: string }> = ({ height, text }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>{text}</div>
);

/** Hi Society Accounting — Traffic & Session tab (wireframe pgTraffic), wired to the live PostHog adoption APIs. */
export const TrafficSessionPage: React.FC<TrafficSessionPageProps> = ({
  filters,
  showPrev,
  benchmarks,
  onBenchmarkChange,
  sitesSettled = true,
}) => {
  const [usageTab, setUsageTab] = useState<UsageKey>('visitors');

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

  const tiles = trafficData?.tiles;
  const deltas = trafficData?.delta_pct;
  const activeUsersDelta = formatDelta(deltas?.active_users);
  const screenViewsDelta = formatDelta(deltas?.screen_views);
  const sessionsDelta = formatDelta(deltas?.sessions);
  const avgSessionDelta = formatDelta(deltas?.avg_session_seconds);
  const bounceDelta = formatDelta(deltas?.bounce_rate);

  const rawCurrentDays = usageData?.usage_over_time?.current;
  const currentUsageDays = useMemo(
    () => densifyUsageData(filters.from, filters.to, rawCurrentDays || []),
    [filters.from, filters.to, rawCurrentDays]
  );
  const rawPreviousDays = usageData?.usage_over_time?.previous;
  const previousRange = useMemo(
    () => previousPeriodFor(filters.from, filters.to),
    [filters.from, filters.to]
  );
  const previousUsageDays = useMemo(
    () => rawPreviousDays?.length
      ? densifyUsageData(previousRange.from, previousRange.to, rawPreviousDays)
      : [],
    [previousRange, rawPreviousDays]
  );

  const chartLabels = currentUsageDays.map((d) => {
    const parts = d.day.split('-');
    return parts.length === 3 ? `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}` : d.day;
  });

  const tab = USAGE_TABS.find((t) => t.key === usageTab) || USAGE_TABS[0];
  const curSeries = currentUsageDays.map((d) => d[tab.key] || 0);
  const prevSeries = previousUsageDays.map((d) => d[tab.key] || 0);
  const hasPrev = showPrev && prevSeries.length === curSeries.length && prevSeries.length > 1;

  const deviceList = usageData?.device_split?.devices || [];
  const viewsPerSession =
    usageData?.views_per_session != null
      ? usageData.views_per_session.toFixed(1)
      : tiles && tiles.sessions > 0
      ? (tiles.screen_views / tiles.sessions).toFixed(1)
      : '—';

  const num = (v: number | undefined, fallback = '0') => (v != null ? v.toLocaleString() : isTrafficLoading ? '...' : fallback);

  return (
    <section className="page on" id="pgTraffic">
      <div className="section-head">
        <h2>Traffic &amp; Session</h2>
        <span className="sd">Monitor overall Accounting traffic, user activity, and session behavior.</span>
      </div>

      <QuestionBox
        questions={[
          'How many users are actively using Accounting, and how frequently?',
          'Which screens and areas generate the most traffic, and are users returning?',
        ]}
      />

      {isTrafficError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorState title="Failed to load Traffic & Session metrics" error={trafficError} onRetry={() => refetchTraffic()} />
        </div>
      )}

      <div className="tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KpiTile
          id="activeUsers"
          infoKey="U1"
          label="Active Users"
          val={num(tiles?.active_users)}
          dir={activeUsersDelta.dir}
          delta={activeUsersDelta.text}
          sub="unique users this period"
          raw={tiles?.active_users}
          goodUp
          benchmark={benchmarks.activeUsers}
          onBenchmarkChange={onBenchmarkChange}
          noTarget
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="screenViews"
          infoKey="U2"
          label="Screen Views"
          val={num(tiles?.screen_views)}
          dir={screenViewsDelta.dir}
          delta={screenViewsDelta.text}
          sub="Accounting screen views"
          raw={tiles?.screen_views}
          noTarget
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="totalSessions"
          infoKey="U3"
          label="Sessions"
          val={num(tiles?.sessions)}
          dir={sessionsDelta.dir}
          delta={sessionsDelta.text}
          sub="sessions with Accounting use"
          raw={tiles?.sessions}
          noTarget
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="avgSessionDur"
          infoKey="U4"
          label="Session Duration"
          val={tiles ? formatSeconds(tiles.avg_session_seconds) : isTrafficLoading ? '...' : '—'}
          dir={avgSessionDelta.dir}
          delta={avgSessionDelta.text}
          sub="per session"
          raw={tiles?.avg_session_seconds}
          noTarget
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="bounceRate"
          infoKey="U5"
          label="Bounce Rate"
          val={tiles ? `${Math.round(tiles.bounce_rate)}%` : isTrafficLoading ? '...' : '0%'}
          dir={bounceDelta.dir}
          delta={bounceDelta.text}
          sub="lower is better"
          raw={tiles?.bounce_rate}
          unit="%"
          goodUp={false}
          benchmark={benchmarks.bounceRate}
          onBenchmarkChange={onBenchmarkChange}
          noTarget
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="recentlyOnline"
          infoKey="U6"
          label="Recently Online"
          val={num(tiles?.recently_online)}
          dir="flat"
          delta={null}
          sub="active in last 30 min"
          noTarget
          isLoading={isTrafficLoading}
        />
      </div>

      <div className="grid2">
        <Card
          id="card-trafficActive"
          infoKey="chart.usage"
          eyebrow="Usage over time · Live PostHog data"
          title="Usage over time"
          purpose="Users, screen views, and sessions for Accounting over time, with the previous period overlaid for comparison."
        >
          {isUsageError ? (
            <ErrorState title="Failed to load usage trend" error={usageError} onRetry={() => refetchUsage()} />
          ) : isUsageLoading ? (
            <Loading height={220} text="Loading usage trend..." />
          ) : currentUsageDays.length === 0 ? (
            <EmptyState message="No usage data recorded for this period" />
          ) : (
            <>
              <div className="charttabs" style={{ marginBottom: '10px' }}>
                {USAGE_TABS.map((t) => (
                  <button key={t.key} type="button" className={usageTab === t.key ? 'on' : ''} onClick={() => setUsageTab(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>
              <LineChart
                cur={curSeries}
                prev={hasPrev ? prevSeries : null}
                labels={chartLabels}
                color={tab.color}
                fill={tab.fill}
                showPrev={hasPrev}
                curLabel={tab.label}
                prevLabel="Previous period"
              />
              <div className="legend">
                <span>
                  <i style={{ background: tab.color }}></i> {tab.label}
                </span>
                {hasPrev && (
                  <span>
                    <i className="dash"></i> Previous period
                  </span>
                )}
              </div>
            </>
          )}
        </Card>

        <Card
          id="card-deviceSplit"
          infoKey="chart.devices"
          eyebrow="Device / platform split"
          title="Mobile OS usage"
          purpose="Share of Accounting sessions by platform, from the device properties PostHog stamps on every event."
        >
          {isUsageError ? (
            <ErrorState title="Failed to load device split" error={usageError} onRetry={() => refetchUsage()} />
          ) : isUsageLoading ? (
            <Loading height={180} text="Loading device distribution..." />
          ) : deviceList.length === 0 ? (
            <EmptyState message="No device distribution data found" />
          ) : (
            <>
              <div className="hbars">
                {deviceList.map((d, idx) => {
                  const sharePct = Math.round(d.session_share <= 1 ? d.session_share * 100 : d.session_share);
                  return (
                    <div className="role" key={idx}>
                      <div className="rn">{d.device}</div>
                      <div className="rbar">
                        <i
                          style={{
                            width: `${Math.min(100, Math.max(0, sharePct))}%`,
                            background: DEVICE_COLORS[d.device] || 'var(--chart-blue)',
                          }}
                        ></i>
                      </div>
                      <div className="rv">{pct(sharePct)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="kv" style={{ marginTop: '14px' }}>
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
    </section>
  );
};
