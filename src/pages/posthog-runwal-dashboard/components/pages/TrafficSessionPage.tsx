import React, { useState, useMemo } from 'react';
import { DashboardFilters } from '../../api/types';
import { QuestionBox } from '../common/QuestionBox';
import { KpiTile } from '../common/KpiTile';
import { Card } from '../common/Card';
import { LineChart } from '../charts/LineChart';
import { ErrorState, EmptyState } from '../common/DashboardStates';
import {
  useTrafficSession,
  useUsageAndDistribution,
} from '../../hooks/useDashboardAnalytics';
import { pct } from '../../data/constants';

interface TrafficSessionPageProps {
  filters: DashboardFilters;
  showPrev: boolean;
  benchmarks: Record<string, number | null>;
  onBenchmarkChange: (id: string, value: number | null) => void;
  sitesSettled?: boolean;
}

function formatSeconds(sec: number | null | undefined): string {
  if (sec == null || isNaN(sec) || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatDelta(d: number | null | undefined): { text: string | null; dir: 'up' | 'dn' | 'flat' } {
  if (d == null || isNaN(d)) return { text: null, dir: 'flat' };
  const abs = Math.abs(d).toFixed(1);
  if (d > 0) return { text: `+${abs}% vs prev`, dir: 'up' };
  if (d < 0) return { text: `-${abs}% vs prev`, dir: 'dn' };
  return { text: '0% vs prev', dir: 'flat' };
}

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

  const tiles = trafficData?.tiles;
  const deltas = trafficData?.delta_pct;

  const activeUsersDelta = formatDelta(deltas?.active_users);
  const screenViewsDelta = formatDelta(deltas?.screen_views);
  const sessionsDelta = formatDelta(deltas?.sessions);
  const avgSessionDelta = formatDelta(deltas?.avg_session_seconds);
  const bounceDelta = formatDelta(deltas?.bounce_rate);

  // Densify usage days so line charts display full continuous date curves
  const currentUsageDays = useMemo(() => {
    const raw = usageData?.usage_over_time?.current || [];
    return densifyUsageData(filters.from, filters.to, raw);
  }, [filters.from, filters.to, usageData?.usage_over_time?.current]);

  const previousUsageDays = useMemo(() => {
    const raw = usageData?.usage_over_time?.previous || [];
    if (raw.length === 0) return [];
    return raw;
  }, [usageData?.usage_over_time?.previous]);

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

  const deviceList = usageData?.device_split?.devices || [];
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
          Monitor overall application traffic, customer activity, and session behavior from PostHog.
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
          label="Active Users"
          val={tiles ? tiles.active_users.toLocaleString() : isTrafficLoading ? '...' : '0'}
          dir={activeUsersDelta.dir}
          delta={activeUsersDelta.text}
          sub="unique active users"
          raw={tiles?.active_users}
          unit=""
          goodUp={true}
          benchmark={benchmarks.activeUsers}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="screenViews"
          label="Screen Views"
          val={tiles ? tiles.screen_views.toLocaleString() : isTrafficLoading ? '...' : '0'}
          dir={screenViewsDelta.dir}
          delta={screenViewsDelta.text}
          sub="total screen events"
          raw={tiles?.screen_views}
          noTarget={true}
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="totalSessions"
          label="Sessions"
          val={tiles ? tiles.sessions.toLocaleString() : isTrafficLoading ? '...' : '0'}
          dir={sessionsDelta.dir}
          delta={sessionsDelta.text}
          sub="total sessions started"
          raw={tiles?.sessions}
          noTarget={true}
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="avgSessionDur"
          label="Session Duration"
          val={tiles ? formatSeconds(tiles.avg_session_seconds) : isTrafficLoading ? '...' : '—'}
          dir={avgSessionDelta.dir}
          delta={avgSessionDelta.text}
          sub="average per session"
          raw={tiles?.avg_session_seconds}
          noTarget={true}
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="bounceRate"
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
          isLoading={isTrafficLoading}
        />
        <KpiTile
          id="recentlyOnline"
          label="Recently Online"
          val={tiles ? tiles.recently_online.toLocaleString() : isTrafficLoading ? '...' : '0'}
          dir="flat"
          delta={null}
          sub="active in last 30 min"
          noTarget={true}
          isLoading={isTrafficLoading}
        />
      </div>

      <div className="grid2">
        <Card
          id="card-trafficActive"
          eyebrow="Usage over time · Live PostHog data"
          title="Usage over time"
          purpose="Visitors, screen views, and sessions over time, with previous period comparison from PostHog usage_and_distribution API."
        >
          {isUsageError ? (
            <ErrorState
              title="Failed to load usage trend"
              error={usageError}
              onRetry={() => refetchUsage()}
            />
          ) : isUsageLoading ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              Loading usage trend...
            </div>
          ) : currentUsageDays.length === 0 ? (
            <EmptyState message="No usage data recorded for this period" />
          ) : (
            <>
              <div className="charttabs" style={{ marginBottom: '10px' }}>
                <button
                  type="button"
                  className={usageTab === 'visitors' ? 'on' : ''}
                  onClick={() => setUsageTab('visitors')}
                >
                  Visitors
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
                      prev={prevVisitors.length > 0 ? prevVisitors : null}
                      labels={chartLabels}
                      color="var(--chart-blue)"
                      fill="var(--chart-fill)"
                      showPrev={showPrev && prevVisitors.length > 0}
                      curLabel="Visitors"
                      prevLabel="Prev Period"
                    />
                    <div className="legend">
                      <span>
                        <i style={{ background: 'var(--chart-blue)' }}></i> Current Visitors
                      </span>
                      {showPrev && prevVisitors.length > 0 && (
                        <span>
                          <i className="dash"></i> Previous Period
                        </span>
                      )}
                    </div>
                  </>
                )}

                {usageTab === 'views' && (
                  <>
                    <LineChart
                      cur={curViews}
                      prev={prevViews.length > 0 ? prevViews : null}
                      labels={chartLabels}
                      color="var(--chart-violet)"
                      fill="var(--chart-violet-tint)"
                      showPrev={showPrev && prevViews.length > 0}
                      curLabel="Views"
                      prevLabel="Prev Period"
                    />
                    <div className="legend">
                      <span>
                        <i style={{ background: 'var(--chart-violet)' }}></i> Current Views
                      </span>
                      {showPrev && prevViews.length > 0 && (
                        <span>
                          <i className="dash"></i> Previous Period
                        </span>
                      )}
                    </div>
                  </>
                )}

                {usageTab === 'sessions' && (
                  <>
                    <LineChart
                      cur={curSessions}
                      prev={prevSessions.length > 0 ? prevSessions : null}
                      labels={chartLabels}
                      color="var(--green)"
                      fill="var(--green-tint)"
                      showPrev={showPrev && prevSessions.length > 0}
                      curLabel="Sessions"
                      prevLabel="Prev Period"
                    />
                    <div className="legend">
                      <span>
                        <i style={{ background: 'var(--green)' }}></i> Current Sessions
                      </span>
                      {showPrev && prevSessions.length > 0 && (
                        <span>
                          <i className="dash"></i> Previous Period
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
          eyebrow="Device / platform split"
          title="Device platform distribution"
          purpose="Share of sessions and active users by device_type from PostHog."
        >
          {isUsageError ? (
            <ErrorState
              title="Failed to load device split"
              error={usageError}
              onRetry={() => refetchUsage()}
            />
          ) : isUsageLoading ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              Loading device distribution...
            </div>
          ) : deviceList.length === 0 ? (
            <EmptyState message="No device distribution data found" />
          ) : (
            <>
              <div className="hbars">
                {deviceList.map((d, idx) => {
                  const sharePct = Math.round(d.session_share <= 1 ? d.session_share * 100 : d.session_share);
                  const barColor = deviceColors[d.device] || 'var(--chart-blue)';
                  return (
                    <div className="role" key={idx}>
                      <div className="rn">{d.device}</div>
                      <div className="rbar">
                        <i
                          style={{
                            width: `${Math.min(100, Math.max(0, sharePct))}%`,
                            background: barColor,
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
