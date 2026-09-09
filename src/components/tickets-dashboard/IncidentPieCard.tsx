import React, { useEffect, useState } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { incidentReportsAPI } from '@/services/incidentReportsAPI';
import { getPieChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

export type IncidentPieMetric = 'category-wise' | 'status-distribution';

const META: Record<IncidentPieMetric, { title: string; subtitle?: string }> = {
  'category-wise': { title: 'Top 5 Category-wise Incidents', subtitle: 'Incident volume per category' },
  'status-distribution': { title: 'Incident Status Distribution', subtitle: 'Open / Closed / Under Investigation' },
};

interface IncidentPieCardProps {
  metric: IncidentPieMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Donut card for the Incident tab — top-5 categories, or the open/closed/under-investigation split. */
export const IncidentPieCard: React.FC<IncidentPieCardProps> = ({ metric, dateRange, className }) => {
  const [segments, setSegments] = useState<PieChartSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };

    const request =
      metric === 'category-wise'
        ? incidentReportsAPI.getCategoryWise(range).then((res) => {
            if (cancelled) return;
            setSegments(
              [...res.response]
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((entry, i) => ({ name: entry.name, value: entry.value, color: getPieChartColor(i) }))
            );
          })
        : incidentReportsAPI.getKpis(range).then((res) => {
            if (cancelled) return;
            const k = res.response;
            const other = Math.max(
              k.total_incidents - k.open - k.closed - k.under_investigation,
              0
            );
            setSegments([
              { name: 'Open', value: k.open, color: getPieChartColor(0) },
              { name: 'Closed', value: k.closed, color: getPieChartColor(1) },
              { name: 'Under Investigation', value: k.under_investigation, color: getPieChartColor(3) },
              { name: 'Other', value: other, color: getPieChartColor(4) },
            ]);
          });

    request
      .catch(() => {
        if (!cancelled) setSegments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [metric, dateRange.startDate, dateRange.endDate]);

  const meta = META[metric];

  return (
    <PieChartCard
      title={meta.title}
      subtitle={meta.subtitle}
      segments={segments}
      loading={loading}
      maxVisibleSegments={metric === 'category-wise' ? 5 : undefined}
      className={className}
    />
  );
};
