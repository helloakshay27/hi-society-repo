import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { CardDownloadButton } from './CardDownloadButton';
import { incidentReportsAPI } from '@/services/incidentReportsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

interface IncidentBarCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** "Level Wise Incidents" — one bar per risk level. */
export const IncidentBarCard: React.FC<IncidentBarCardProps> = ({ dateRange, className }) => {
  const [rows, setRows] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    incidentReportsAPI
      .getLevelWise({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
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
  }, [dateRange.startDate, dateRange.endDate]);

  const data = [...rows].sort((a, b) => b.value - a.value).map((row) => ({ ...row }));
  const series: BarChartSeries[] = [
    { dataKey: 'value', name: 'Count', color: getTicketsChartColor(2) },
  ];

  return (
    <BarChartCard
      title="Level Wise Incidents"
      data={data}
      categoryKey="name"
      series={series}
      orientation="vertical"
      loading={loading}
      className={className}
      rightSlot={
        <CardDownloadButton
          label="Download Level Wise Incidents"
          onDownload={() =>
            incidentReportsAPI.downloadLevelWise({
              fromDate: dateRange.startDate,
              toDate: dateRange.endDate,
            })
          }
        />
      }
    />
  );
};
