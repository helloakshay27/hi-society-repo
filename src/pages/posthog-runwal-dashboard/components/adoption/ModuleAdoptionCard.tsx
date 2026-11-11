import React from 'react';
import { DashboardFilters } from '../../api/types';
import { Card } from '../common/Card';
import { BarsSkeleton } from '../common/Skeleton';
import { EmptyState, ErrorState } from '../common/DashboardStates';
import { useModuleTree } from '../../hooks/useDashboardAnalytics';
import { formatModuleName } from '../workflow/ModuleNav';
import { pct } from '../../data/constants';

const BAR_COLORS = ['#2f6fed', '#14a38b', '#e0a43a', '#8a63d2', '#d9534f', '#5bc0de'];

/**
 * "Adoption by workflow bucket" from the dashboard guide: users who used a module (a group of
 * features) at least once ÷ users active in the period × 100. The modules API returns share_pct;
 * apps without a module list fall back to their screens.
 */
export const ModuleAdoptionCard: React.FC<{ filters: DashboardFilters; enabled?: boolean }> = ({
  filters,
  enabled = true,
}) => {
  const { data, isLoading, isError, error, refetch } = useModuleTree(filters, enabled);
  const rows = (data?.modules?.length ? data.modules : data?.tree ?? [])
    .filter((m) => m.share_pct != null)
    .slice(0, 12);

  return (
    <Card
      id="card-moduleAdoption"
      infoKey="chart.moduleAdoption"
      eyebrow="Adoption by workflow bucket"
      title="Which group of features is used most"
      purpose="Users who used each module at least once, as a share of all active users."
    >
      {isError ? (
        <ErrorState title="Failed to load module adoption" error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <BarsSkeleton count={5} />
      ) : rows.length === 0 ? (
        <EmptyState message="No module activity in this period" />
      ) : (
        <div className="hbars">
          {rows.map((m, idx) => {
            const share = Math.round(m.share_pct ?? 0);
            return (
              <div className="role" key={m.key ?? m.name}>
                <div className="rn" title={`${m.users.toLocaleString()} of ${(data?.active_users ?? 0).toLocaleString()} active users`}>
                  {m.key ? m.name : formatModuleName(m.name)}
                </div>
                <div className="rbar">
                  <i style={{ width: `${Math.min(100, Math.max(0, share))}%`, background: BAR_COLORS[idx % BAR_COLORS.length] }} />
                </div>
                <div className="rv">{pct(share)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
