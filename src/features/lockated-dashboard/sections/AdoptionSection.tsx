import React from 'react';
import type { Device, AdminScope } from '../data/types';
import { getChartPalette } from '../utils/rng';
import { Tile } from '../components/Tile';
import { ChartCard } from '../components/ChartCard';
import {
  LineChart,
  StackedBarChart,
  RetentionCohortTable
} from '../components/Charts';
import { buildAdoption, type AdoptionMetrics } from '../data/metrics';

interface AdoptionSectionProps {
  dev: Device;
  scope: AdminScope;
  range: number;
  theme: 'light' | 'dark';
  metrics?: AdoptionMetrics;
  isLoading?: boolean;
}

export const AdoptionSection: React.FC<AdoptionSectionProps> = ({
  dev,
  scope,
  range,
  theme,
  metrics,
  isLoading
}) => {
  const palette = getChartPalette(theme);

  const m =
    metrics ??
    buildAdoption({
      dev,
      scope,
      prev: true,
      wf: 'serviceRequestCreate',
      bucket: 'Service & Support',
      page: 'pgAdopt',
      range,
      rangeLabel: 'Last 30 days',
      rangeFrom: '',
      rangeTo: '',
      project: 'All Projects',
      theme,
      navCollapsed: false
    });

  const tiles = m.tiles.filter((tile) => tile.label !== 'Seat Utilisation');

  return (
    <section className="section" id="pgAdopt">
      <div className="section-head">
        <h2>Adoption &amp; Engagement</h2>
        <span className="sd">
          Measure how effectively residents adopt and engage with the app’s major modules, and whether they keep coming back.
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
          <span>Updating adoption metrics from analytics API...</span>
        </div>
      )}

      <div className="tiles" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginTop: '16px' }}>
        {tiles.map((tile) => <Tile key={tile.label} {...tile} />)}
      </div>

      <ChartCard
        eyebrow="Trend · weekly active users"
        title="Adoption trend (last 8 weeks)"
        purpose="Weekly active users returned by the analytics API."
        style={{ marginTop: '12px' }}
      >
        <LineChart
          cur={m.trendSeries.cur}
          labels={m.trendSeries.labels}
          color={palette.blue}
          fill={palette.fill}
          showPrev={false}
          theme={theme}
        />
      </ChartCard>

      <div className="grid2">
        <ChartCard eyebrow="Growth accounting · last 6 weeks" title="New, returning, resurrected and dormant users">
          <StackedBarChart
            labels={m.growthSeries.labels}
            series={m.growthSeries.series}
            negSeries={m.growthSeries.negSeries}
            theme={theme}
          />
          <div className="legend">
            {m.growthSeries.series.map((series) => (
              <span key={series.label}><i style={{ background: series.color }} /> {series.label}</span>
            ))}
            <span><i style={{ background: m.growthSeries.negSeries.color }} /> Dormant</span>
          </div>
        </ChartCard>

        <ChartCard eyebrow="Retention · weekly cohorts" title="Do residents keep coming back?">
          <RetentionCohortTable dates={m.cohortDates} matrix={m.cohortMatrix} theme={theme} />
        </ChartCard>
      </div>

      <div className="grid2">
        <ChartCard eyebrow="Dormant users" title="Dormant users">
          <div className="kv">
            <div>
              <div className="k">Dormant residents</div>
              <div className="v" style={{ fontSize: '22px' }}>
                {m.dormantCount == null ? '--' : m.dormantCount.toLocaleString()}
              </div>
              <div className="u">No activity in the last 14 days</div>
            </div>
          </div>
        </ChartCard>

        <ChartCard eyebrow="Project breakdown" title="Site-level metrics">
          <div className="tbl-wrap">
            <table className="league">
              <thead>
                <tr><th>Project</th><th className="num">Active users</th><th className="num">Sessions</th><th className="num">Avg session</th><th className="num">Bounce</th><th>Trend</th><th>Status</th></tr>
              </thead>
              <tbody>
                {m.siteRows.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--sub)' }}>No project metrics available for this period</td></tr>
                  : m.siteRows.map((row) => (
                    <tr key={row.p}>
                      <td className="strong">{row.p}</td>
                      <td className="num">{row.active.toLocaleString()}</td>
                      <td className="num">{row.sess.toLocaleString()}</td>
                      <td className="num">{row.avgSess}</td>
                      <td className="num">{row.bnc}%</td>
                      <td><span className={`arrow ${row.trend}`}>{row.trend === 'up' ? '↗' : row.trend === 'dn' ? '↘' : '→'}</span></td>
                      <td><span className="status">{row.trend === 'dn' ? 'Watch' : 'Healthy'}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </section>
  );
};
