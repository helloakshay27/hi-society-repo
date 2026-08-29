import React, { useEffect, useState } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { utilityReportsAPI } from '@/services/utilityReportsAPI';
import { getPieChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';
import { SAMPLE_POWER_SOURCES, SAMPLE_WATER_SOURCES, SAMPLE_RENEWABLE_SOURCES } from './sampleData';

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

const SAMPLE_BY_METRIC: Record<UtilityPieMetric, { name: string; value: number }[]> = {
  'power-sources': SAMPLE_POWER_SOURCES,
  'water-sources': SAMPLE_WATER_SOURCES,
  'renewable-sources': SAMPLE_RENEWABLE_SOURCES,
};

interface UtilityPieCardProps {
  metric: UtilityPieMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Pie cards for Utility Consumption — Power, Water, Renewable (Top Management). */
export const UtilityPieCard: React.FC<UtilityPieCardProps> = ({ metric, dateRange, className }) => {
  const [rows, setRows] = useState<{ name: string; value: number }[]>(SAMPLE_BY_METRIC[metric]);
  const [isSample, setIsSample] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };
    const sample = SAMPLE_BY_METRIC[metric];
    const fetcher =
      metric === 'power-sources'
        ? utilityReportsAPI.getPowerSources
        : metric === 'water-sources'
          ? utilityReportsAPI.getWaterSources
          : utilityReportsAPI.getRenewableSources;

    fetcher(range)
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
      isSample={isSample}
      className={className}
      maxVisibleSegments={6}
    />
  );
};
