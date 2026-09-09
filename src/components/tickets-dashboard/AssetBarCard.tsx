import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { assetReportsAPI, AssetChartKey } from '@/services/assetReportsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

export type AssetBarMetric = 'group-wise' | 'category-wise';

const BAR_METRIC_META: Record<AssetBarMetric, { title: string; subtitle?: string; chartKey: AssetChartKey }> = {
  'group-wise': {
    title: 'Group-wise Assets',
    subtitle: 'Asset count per group',
    chartKey: 'group_wise',
  },
  'category-wise': {
    title: 'Category-wise Assets',
    subtitle: 'Asset count per category',
    chartKey: 'category_wise',
  },
};

interface AssetBarCardProps {
  metric: AssetBarMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Bar-chart card for the Assets tab — group-wise / category-wise counts from `/assets/charts`. */
export const AssetBarCard: React.FC<AssetBarCardProps> = ({ metric, dateRange, className }) => {
  const meta = BAR_METRIC_META[metric];
  const [rows, setRows] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    assetReportsAPI
      .getChart({ fromDate: dateRange.startDate, toDate: dateRange.endDate }, meta.chartKey)
      .then((res) => {
        if (!cancelled) setRows(res.response);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [meta.chartKey, dateRange.startDate, dateRange.endDate]);

  const data = [...rows]
    .sort((a, b) => b.value - a.value)
    .map((row, i) => ({ ...row, color: getTicketsChartColor(i) }));
  const series: BarChartSeries[] = [{ dataKey: 'value', name: 'Assets', color: getTicketsChartColor(0) }];

  return (
    <BarChartCard
      title={meta.title}
      subtitle={meta.subtitle}
      data={data}
      categoryKey="name"
      series={series}
      colorKey="color"
      orientation="horizontal"
      loading={loading}
      className={className}
    />
  );
};
