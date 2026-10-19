import React, { useState } from 'react';
import type { Device, AdminScope, UsageTab } from '../data/types';
import { pct, getChartPalette } from '../utils/rng';
import { Tile } from '../components/Tile';
import { ChartCard } from '../components/ChartCard';
import { LineChart } from '../components/Charts';
import { buildTraffic, type TrafficMetrics } from '../data/metrics';

interface TrafficSectionProps {
  dev: Device;
  scope: AdminScope;
  range: number;
  prev: boolean;
  theme: 'light' | 'dark';
  metrics?: TrafficMetrics;
  isLoading?: boolean;
}

export const TrafficSection: React.FC<TrafficSectionProps> = ({
  dev,
  scope,
  range,
  prev,
  theme,
  metrics,
  isLoading
}) => {
  const [usageTab, setUsageTab] = useState<UsageTab>('visitors');
  const [hoveredDev, setHoveredDev] = useState<string | null>(null);
  const palette = getChartPalette(theme);

  const m =
    metrics ??
    buildTraffic({
      dev,
      scope,
      prev,
      wf: 'serviceRequestCreate',
      bucket: 'Service & Support',
      page: 'pgTraffic',
      range,
      rangeLabel: 'Last 30 days',
      rangeFrom: '',
      rangeTo: '',
      project: 'All Projects',
      theme,
      navCollapsed: false
    });

  const {
    tiles: tilesToRender,
    visitorsSeries,
    viewsSeries,
    sessionsSeries,
    iosShare,
    andShare,
    viewsPerSession,
    recentlyOnlineCount: curActive
  } = m;

  return (
    <section className="section" id="pgTraffic">
      <div className="section-head">
        <h2>Traffic &amp; Session</h2>
        <span className="sd">
          Monitor overall application traffic, resident activity, and session behavior.
        </span>
      </div>

      {isLoading && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            marginBottom: '12px',
            borderRadius: '6px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            fontSize: '12px'
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              border: '2px solid var(--blue)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block'
            }}
          />
          <span>Updating metrics from analytics API...</span>
        </div>
      )}

      <div className="qbox">
        <b>Key questions</b>
        <ul>
          <li>
            How many registered residents are actively using the application, and how frequently?
          </li>
          <li>
            Which projects generate the highest traffic, and are residents returning?
          </li>
        </ul>
      </div>

      {/* KPI Tiles */}
      <div className="tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {tilesToRender.map((t) => (
          <Tile
            key={t.label}
            label={t.label}
            val={t.val}
            dir={t.dir}
            delta={t.delta}
            sub={t.sub}
          />
        ))}
      </div>

      {/* Grid2: Usage Over Time & Device Split */}
      <div className="grid2">
        {/* Usage Over Time */}
        <ChartCard
          eyebrow="Usage over time · SVG chart"
          title="Usage over time"
          purpose="Visitors, screen views, and sessions over time, across all projects, with the previous period overlaid for comparison."
        >
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

          <div id="usageChartBody">
            {usageTab === 'visitors' && (
              <>
                <LineChart
                  cur={visitorsSeries.cur}
                  prev={visitorsSeries.prev}
                  labels={visitorsSeries.labels}
                  color={palette.blue}
                  fill={palette.fill}
                  showPrev={prev}
                  theme={theme}
                />
                <div className="legend">
                  <span>
                    <i style={{ background: palette.blue }} /> Visitors
                  </span>
                  <span>
                    <i className="dash" /> Previous period
                  </span>
                </div>
              </>
            )}

            {usageTab === 'views' && (
              <>
                <LineChart
                  cur={viewsSeries.cur}
                  prev={viewsSeries.prev}
                  labels={viewsSeries.labels}
                  color={palette.violet}
                  fill={palette.violetTint}
                  showPrev={prev}
                  theme={theme}
                />
                <div className="legend">
                  <span>
                    <i style={{ background: palette.violet }} /> Views
                  </span>
                  <span>
                    <i className="dash" /> Previous period
                  </span>
                </div>
              </>
            )}

            {usageTab === 'sessions' && (
              <>
                <LineChart
                  cur={sessionsSeries.cur}
                  prev={sessionsSeries.prev}
                  labels={sessionsSeries.labels}
                  color={palette.green}
                  fill="var(--green-tint)"
                  showPrev={prev}
                  theme={theme}
                />
                <div className="legend">
                  <span>
                    <i style={{ background: palette.green }} /> Sessions
                  </span>
                  <span>
                    <i className="dash" /> Previous period
                  </span>
                </div>
              </>
            )}
          </div>
        </ChartCard>

        {/* Mobile OS Split */}
        <ChartCard
          eyebrow="Device / platform split"
          title="Mobile OS usage"
          purpose="Share of active users by platform — Lockated is mobile-only, so this shows where release testing and support effort should concentrate. PROPOSED split, not measured traffic."
        >
          <div className="hbars" style={{ position: 'relative' }}>
            <div
              className="role"
              onMouseEnter={() => setHoveredDev('ios')}
              onMouseLeave={() => setHoveredDev(null)}
              style={{
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '6px',
                background: hoveredDev === 'ios' ? 'var(--surface-2)' : 'transparent',
                transition: 'background 0.12s'
              }}
            >
              <div className="rn" style={{ fontWeight: hoveredDev === 'ios' ? 600 : 400 }}>
                iOS
              </div>
              <div className="rbar">
                <i
                  style={{
                    width: `${Math.round(iosShare * 100)}%`,
                    background: palette.violet,
                    filter: hoveredDev === 'ios' ? 'brightness(1.15)' : 'none'
                  }}
                />
              </div>
              <div className="rv" style={{ fontWeight: 600 }}>{pct(iosShare * 100)}</div>
            </div>

            <div
              className="role"
              onMouseEnter={() => setHoveredDev('android')}
              onMouseLeave={() => setHoveredDev(null)}
              style={{
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '6px',
                background: hoveredDev === 'android' ? 'var(--surface-2)' : 'transparent',
                transition: 'background 0.12s'
              }}
            >
              <div className="rn" style={{ fontWeight: hoveredDev === 'android' ? 600 : 400 }}>
                Android
              </div>
              <div className="rbar">
                <i
                  style={{
                    width: `${Math.round(andShare * 100)}%`,
                    background: palette.green,
                    filter: hoveredDev === 'android' ? 'brightness(1.15)' : 'none'
                  }}
                />
              </div>
              <div className="rv" style={{ fontWeight: 600 }}>{pct(andShare * 100)}</div>
            </div>

            {/* Hover Tooltip for Mobile OS */}
            {hoveredDev && (
              <div
                style={{
                  position: 'absolute',
                  top: hoveredDev === 'ios' ? '-32px' : '6px',
                  right: '10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xs, 6px)',
                  padding: '5px 9px',
                  boxShadow: 'var(--shadow-pop)',
                  fontSize: '12px',
                  pointerEvents: 'none',
                  zIndex: 20,
                  whiteSpace: 'nowrap'
                }}
              >
                <b>{hoveredDev === 'ios' ? 'Apple iOS' : 'Google Android'}</b> &middot;{' '}
                {hoveredDev === 'ios'
                  ? `${Math.round(curActive * iosShare).toLocaleString()} residents (${pct(iosShare * 100)})`
                  : `${Math.round(curActive * andShare).toLocaleString()} residents (${pct(andShare * 100)})`}
              </div>
            )}
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
        </ChartCard>
      </div>
    </section>
  );
};
