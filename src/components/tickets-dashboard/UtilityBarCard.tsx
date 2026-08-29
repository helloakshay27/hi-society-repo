import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { utilityReportsAPI } from '@/services/utilityReportsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';
import {
  SAMPLE_POWER_BAR,
  SAMPLE_WATER_BAR,
  SAMPLE_POWER_TOP_BAR,
  SAMPLE_WATER_TOP_BAR,
  SAMPLE_DRY_SEGREGATION,
  SAMPLE_EV_CONSUMPTION,
} from './sampleData';

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

const SAMPLE_BY_METRIC: Record<UtilityBarMetric, { name: string; value: number }[]> = {
  'power-bar': SAMPLE_POWER_BAR,
  'water-bar': SAMPLE_WATER_BAR,
  'power-top-bar': SAMPLE_POWER_TOP_BAR,
  'water-top-bar': SAMPLE_WATER_TOP_BAR,
  'dry-segregation': SAMPLE_DRY_SEGREGATION,
  'ev-consumption': SAMPLE_EV_CONSUMPTION,
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
  const [rows, setRows] = useState<{ name: string; value: number }[]>(SAMPLE_BY_METRIC[metric]);
  const [loading, setLoading] = useState(true);
  const [isSample, setIsSample] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };
    const sample = SAMPLE_BY_METRIC[metric];

    FETCHER_BY_METRIC[metric](range)
      .then((res) => {
        if (cancelled) return;
        if (res.response.length > 0) {
          setRows(res.response);
          setIsSample(false);
        } else {
          setRows(sample);
          setIsSample(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows(sample);
          setIsSample(true);
        }
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
      isSample={isSample}
      className={className}
    />
  );
};
