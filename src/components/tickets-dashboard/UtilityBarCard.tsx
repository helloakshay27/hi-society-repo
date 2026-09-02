import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { utilityReportsAPI } from '@/services/utilityReportsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

export type UtilityBarMetric =
  | 'power-bar'
  | 'water-bar'
  | 'power-top-bar'
  | 'water-top-bar'
  | 'dry-segregation'
  | 'ev-consumption';

const BAR_METRIC_META: Record<
  UtilityBarMetric,
  { title: string; subtitle?: string; orientation?: 'horizontal' | 'vertical' }
> = {
  'power-bar': {
    title: 'Power Consumption',
    subtitle: 'Period-wise mains consumption (kWh)',
    orientation: 'vertical' as const,
  },
  'water-bar': {
    title: 'Water Consumption',
    subtitle: 'Period-wise total water (KL)',
    orientation: 'vertical' as const,
  },
  'power-top-bar': {
    title: 'Power Consumption Top Management',
    subtitle: 'Month-wise power consumption',
    orientation: 'vertical' as const,
  },
  'water-top-bar': {
    title: 'Water Consumption Top Management',
    subtitle: 'Site-wise water consumption',
    orientation: 'vertical' as const,
  },
  'dry-segregation': {
    title: 'Site Wise Dry Segregation Data',
    subtitle: 'Dry waste segregation by site',
    orientation: 'vertical' as const,
  },
  'ev-consumption': {
    title: 'Site Wise EV Consumption',
    subtitle: 'EV charging consumption by site',
    orientation: 'vertical' as const,
  },
};

const FETCHER_BY_METRIC: Record<
  UtilityBarMetric,
  typeof utilityReportsAPI.getPowerBar
> = {
  'power-bar': utilityReportsAPI.getPowerBar,
  'water-bar': utilityReportsAPI.getWaterBar,
  'power-top-bar': utilityReportsAPI.getPowerTopBar,
  'water-top-bar': utilityReportsAPI.getWaterTopBar,
  'dry-segregation': utilityReportsAPI.getDrySegregation,
  'ev-consumption': utilityReportsAPI.getEvConsumption,
};

interface UtilityBarCardProps {
  metric: UtilityBarMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Bar cards for full Utility Consumption menu from FM user-dashboard. */
export const UtilityBarCard: React.FC<UtilityBarCardProps> = ({ metric, dateRange, className }) => {
  const [rows, setRows] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };

    FETCHER_BY_METRIC[metric](range)
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
  }, [metric, dateRange.startDate, dateRange.endDate]);

  const meta = BAR_METRIC_META[metric];
  const data = rows.map((row, i) => ({
    category: row.name,
    value: row.value,
    color: getTicketsChartColor(i),
  }));
  const series: BarChartSeries[] = [{ dataKey: 'value', name: meta.title, color: getTicketsChartColor(0) }];

  return (
    <BarChartCard
      title={meta.title}
      subtitle={meta.subtitle}
      data={data}
      series={series}
      colorKey="color"
      orientation={meta.orientation}
      loading={loading}
      className={className}
    />
  );
};
