import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { ChartCardShell } from './ChartCardShell';
import { hiSocietyLegacyCardsAPI, ServicePartnerRow } from '@/services/hiSocietyLegacyCardsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

interface ServicePartnerEvaluationCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Average raw audit score per service partner. Not a percentage. */
export const ServicePartnerEvaluationCard: React.FC<ServicePartnerEvaluationCardProps> = ({
  dateRange,
  className,
}) => {
  const [rows, setRows] = useState<ServicePartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    hiSocietyLegacyCardsAPI
      .getServicePartnerEvaluation({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setRows(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof Error ? err.message : 'Failed to load service partner scores');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  if (error) {
    return (
      <ChartCardShell
        title="Service Partner Evaluation"
        subtitle="Average actual score by company"
        error={error}
        className={className}
      >
        {null}
      </ChartCardShell>
    );
  }

  const data = rows.map((row, index) => ({
    name: row.name,
    score: row.score,
    color: getTicketsChartColor(index),
  }));
  const series: BarChartSeries[] = [{ dataKey: 'score', name: 'Average score', color: getTicketsChartColor(1) }];

  return (
    <BarChartCard
      title="Service Partner Evaluation"
      subtitle="Average actual score by company"
      data={data}
      categoryKey="name"
      series={series}
      colorKey="color"
      orientation="horizontal"
      loading={loading}
      emptyMessage="No service partner scores for the selected date range."
      className={className}
    />
  );
};
