import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { ChartCardShell } from './ChartCardShell';
import { CauseWiseRow, hiSocietyLegacyCardsAPI } from '@/services/hiSocietyLegacyCardsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

interface CauseWiseIncidentsCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Primary root-cause categories. Row order is the API order (no client sort). */
export const CauseWiseIncidentsCard: React.FC<CauseWiseIncidentsCardProps> = ({ dateRange, className }) => {
  const [rows, setRows] = useState<CauseWiseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    hiSocietyLegacyCardsAPI
      .getCauseWise({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setRows(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof Error ? err.message : 'Failed to load root causes');
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
        title="Primary Root Cause Category"
        subtitle="Incidents grouped by root cause"
        error={error}
        className={className}
      >
        {null}
      </ChartCardShell>
    );
  }

  const data = rows.map((row, index) => ({
    name: row.name,
    count: row.count,
    color: getTicketsChartColor(index),
  }));
  const series: BarChartSeries[] = [{ dataKey: 'count', name: 'Incidents', color: getTicketsChartColor(0) }];

  return (
    <BarChartCard
      title="Primary Root Cause Category"
      subtitle={
        rows.length > 0
          ? rows.map((row) => `${row.name}: ${row.count}`).join(' · ')
          : 'Incidents grouped by root cause'
      }
      data={data}
      categoryKey="name"
      series={series}
      colorKey="color"
      orientation="horizontal"
      loading={loading}
      emptyMessage="No root-cause data for the selected date range."
      className={className}
    />
  );
};
