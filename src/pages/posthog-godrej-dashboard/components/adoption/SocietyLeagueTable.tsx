import React from 'react';
import { SiteLookupItem, DashboardFilters } from '../../../posthog-runwal-dashboard/api/types';
import { useTrafficSession } from '../../../posthog-runwal-dashboard/hooks/useDashboardAnalytics';
import { Card } from '../../../posthog-runwal-dashboard/components/common/Card';
import { EmptyState } from '../../../posthog-runwal-dashboard/components/common/DashboardStates';

interface SocietyLeagueTableProps {
  sites: SiteLookupItem[];
  baseFilters: DashboardFilters;
  enabled: boolean;
}

function formatAvgSession(sec: number | null | undefined): string {
  if (sec == null || isNaN(sec) || sec <= 0) return '—';
  return `${(sec / 60).toFixed(1)}m`;
}

/** One row's live traffic data for its own society — each row calls the real API scoped to that single site. */
const SocietyRow: React.FC<{ site: SiteLookupItem; baseFilters: DashboardFilters; enabled: boolean }> = ({ site, baseFilters, enabled }) => {
  const siteFilters: DashboardFilters = { ...baseFilters, siteIds: [site.id] };
  const { data, isLoading, isError } = useTrafficSession(siteFilters, enabled);

  const tiles = data?.tiles;
  const active = tiles?.active_users ?? null;
  const sessions = tiles?.sessions ?? null;
  const bounce = tiles?.bounce_rate ?? null;
  const avgSession = tiles?.avg_session_seconds ?? null;
  const activeDelta = data?.delta_pct?.active_users ?? null;

  const trend = activeDelta == null ? null : activeDelta > 0 ? 'up' : activeDelta < 0 ? 'dn' : 'flat';
  const trendArrow = trend === 'up' ? '▲' : trend === 'dn' ? '▼' : '—';

  const status =
    bounce == null
      ? null
      : bounce >= 22
      ? ['st-drop', 'Watch']
      : bounce >= 16
      ? ['st-watch', 'Steady']
      : ['st-healthy', 'Healthy'];

  return (
    <tr>
      <td className="strong">{site.name}</td>
      <td className="num">{isLoading ? '…' : isError ? '—' : active != null ? active.toLocaleString() : '—'}</td>
      <td className="num">{isLoading ? '…' : isError ? '—' : sessions != null ? sessions.toLocaleString() : '—'}</td>
      <td className="num">{isLoading ? '…' : isError ? '—' : formatAvgSession(avgSession)}</td>
      <td className="num">{isLoading ? '…' : isError ? '—' : bounce != null ? `${Math.round(bounce)}%` : '—'}</td>
      <td>{trend && <span className={`arrow ${trend}`}>{trendArrow}</span>}</td>
      <td>{status && <span className={`status ${status[0]}`}>{status[1]}</span>}</td>
    </tr>
  );
};

/** Society-wise breakdown league table — matches the wireframe's card-siteWise. */
export const SocietyLeagueTable: React.FC<SocietyLeagueTableProps> = ({ sites, baseFilters, enabled }) => {
  return (
    <Card
      id="card-siteWise"
      eyebrow="League table"
      title="Society-wise breakdown"
      purpose="Active residents, sessions and bounce rate per society, each fetched live from the same traffic_session endpoint used on the Traffic & Session tab, scoped one society at a time."
      style={{ marginTop: '12px' }}
    >
      {sites.length === 0 ? (
        <EmptyState message="No societies available for this account" />
      ) : (
        <div className="tbl-wrap">
          <table className="league">
            <thead>
              <tr>
                <th>Society</th>
                <th className="num">Active users</th>
                <th className="num">Sessions</th>
                <th className="num">Avg session</th>
                <th className="num">Bounce</th>
                <th>Trend</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <SocietyRow key={site.id} site={site} baseFilters={baseFilters} enabled={enabled} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
