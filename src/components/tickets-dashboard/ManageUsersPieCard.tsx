import React from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { ManageUsersDashboard } from '@/services/manageUsersDashboardAPI';
import { getPieChartColor } from './colors';

/**
 * The download counters from ManageUsersPage's StatsCards, grouped into
 * coherent two-slice donuts rather than one meaningless six-slice pie.
 */
export type ManageUsersPieMetric = 'app-downloads' | 'resident-type' | 'phase';

const PIE_METRIC_META: Record<
  ManageUsersPieMetric,
  {
    title: string;
    subtitle: string;
    slices: { label: string; key: keyof ManageUsersDashboard }[];
  }
> = {
  'app-downloads': {
    title: 'App Downloads',
    subtitle: 'Total vs flat downloads',
    slices: [
      { label: 'Total Downloads', key: 'app_downloads' },
      { label: 'Flat Downloads', key: 'total_flat_downloads' },
    ],
  },
  'resident-type': {
    title: 'Downloads by Resident Type',
    subtitle: 'Owners vs tenants',
    slices: [
      { label: 'Owners', key: 'total_owner_downloads' },
      { label: 'Tenants', key: 'total_tenant_downloads' },
    ],
  },
  phase: {
    title: 'Downloads by Phase',
    subtitle: 'Post sale vs post possession',
    slices: [
      { label: 'Post Sale', key: 'post_sale_downloads' },
      { label: 'Post Possession', key: 'post_possession_downloads' },
    ],
  },
};

interface ManageUsersPieCardProps {
  metric: ManageUsersPieMetric;
  dashboard: ManageUsersDashboard | null;
  loading?: boolean;
  className?: string;
}

/** Donut cards for the Manage Users tab's download metrics. */
export const ManageUsersPieCard: React.FC<ManageUsersPieCardProps> = ({
  metric,
  dashboard,
  loading,
  className,
}) => {
  const meta = PIE_METRIC_META[metric];

  const segments: PieChartSegment[] = meta.slices.map((slice, i) => ({
    name: slice.label,
    value: dashboard?.[slice.key] ?? 0,
    color: getPieChartColor(i),
  }));

  return (
    <PieChartCard
      title={meta.title}
      subtitle={meta.subtitle}
      segments={segments}
      loading={loading}
      className={className}
      centerLabel="Users"
    />
  );
};
