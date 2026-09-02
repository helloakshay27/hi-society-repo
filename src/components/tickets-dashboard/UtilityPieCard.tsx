import React, { useEffect, useState } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { utilityReportsAPI } from '@/services/utilityReportsAPI';
import { getPieChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

export type UtilityPieMetric = 'power-sources' | 'water-sources' | 'renewable-sources';

const PIE_METRIC_META: Record<UtilityPieMetric, { title: string; subtitle?: string }> = {
  'power-sources': {
    title: 'Cumulative Power Consumed',
    subtitle: 'Sub-meter source split',
  },
  'water-sources': {
    title: 'Water Source Split',
    subtitle: 'Municipal / Borewell / Tanker / STP',
  },
  'renewable-sources': {
    title: 'Renewable Sources & Consumption',
    subtitle: 'Solar / Wind / Other renewable',
  },
};

const FETCHER_BY_METRIC: Record<UtilityPieMetric, typeof utilityReportsAPI.getPowerSources> = {
  'power-sources': utilityReportsAPI.getPowerSources,
  'water-sources': utilityReportsAPI.getWaterSources,
  'renewable-sources': utilityReportsAPI.getRenewableSources,
};

interface UtilityPieCardProps {
  metric: UtilityPieMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Pie cards for Utility Consumption — Power, Water, Renewable (Top Management). */
export const UtilityPieCard: React.FC<UtilityPieCardProps> = ({ metric, dateRange, className }) => {
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

  const segments: PieChartSegment[] = rows.map((entry, i) => ({
    name: entry.name,
    value: entry.value,
    color: getPieChartColor(i),
  }));

  const meta = PIE_METRIC_META[metric];

  return (
    <PieChartCard
      title={meta.title}
      subtitle={meta.subtitle}
      segments={segments}
      loading={loading}
      className={className}
      maxVisibleSegments={6}
    />
  );
};
