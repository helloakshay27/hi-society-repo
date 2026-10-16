import React, { useMemo } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { ChartCardShell } from './ChartCardShell';
import { ChecklistSummary } from '@/services/hiSocietyLegacyCardsAPI';

const STATUS_COLORS = {
  closed: '#76CDC1',
  open: '#9EC8BA',
  workInProgress: '#CDCAF5',
  overdue: '#E39090',
} as const;

const subtitleOf = (summary: ChecklistSummary | null, fallback: string): string => {
  const info = summary?.info?.trim();
  if (!info || info.length > 160) return fallback;
  return info;
};

interface ChecklistSummaryVisualProps {
  summary: ChecklistSummary | null;
  loading: boolean;
  error: string | null;
  className?: string;
}

/** Donut of Closed / Open / Work in progress / Overdue from the checklist summary API. */
export const ChecklistSummaryDonut: React.FC<ChecklistSummaryVisualProps> = ({
  summary,
  loading,
  error,
  className,
}) => {
  const segments = useMemo<PieChartSegment[]>(() => {
    if (!summary) return [];
    return [
      { name: 'Closed', value: summary.closed, color: STATUS_COLORS.closed },
      { name: 'Open', value: summary.open, color: STATUS_COLORS.open },
      { name: 'Work in progress', value: summary.workInProgress, color: STATUS_COLORS.workInProgress },
      { name: 'Overdue', value: summary.overdue, color: STATUS_COLORS.overdue },
    ].filter((segment) => segment.value > 0);
  }, [summary]);

  if (error) {
    return (
      <ChartCardShell title="Checklist" subtitle="Status breakdown" error={error} className={className}>
        {null}
      </ChartCardShell>
    );
  }

  return (
    <PieChartCard
      title="Checklist"
      subtitle={subtitleOf(summary, 'Closed, Open, Work in progress, Overdue')}
      segments={segments}
      loading={loading}
      emptyMessage="No checklist data for the selected date range."
      className={className}
    />
  );
};

/** Same status totals as a bar chart, so the counts are readable next to the donut. */
export const ChecklistSummaryBars: React.FC<ChecklistSummaryVisualProps> = ({
  summary,
  loading,
  error,
  className,
}) => {
  const data = useMemo(() => {
    if (!summary) return [];
    const rows = [
      { category: 'Closed', value: summary.closed, color: STATUS_COLORS.closed },
      { category: 'Open', value: summary.open, color: STATUS_COLORS.open },
      { category: 'Work in progress', value: summary.workInProgress, color: STATUS_COLORS.workInProgress },
      { category: 'Overdue', value: summary.overdue, color: STATUS_COLORS.overdue },
    ];
    return rows.some((row) => row.value > 0) ? rows : [];
  }, [summary]);

  const series: BarChartSeries[] = [{ dataKey: 'value', name: 'Count', color: STATUS_COLORS.closed }];

  if (error) {
    return (
      <ChartCardShell title="Checklist Status" subtitle="Count by status" error={error} className={className}>
        {null}
      </ChartCardShell>
    );
  }

  return (
    <BarChartCard
      title="Checklist Status"
      subtitle="Count by status"
      data={data}
      series={series}
      colorKey="color"
      orientation="vertical"
      loading={loading}
      emptyMessage="No checklist data for the selected date range."
      className={className}
    />
  );
};
