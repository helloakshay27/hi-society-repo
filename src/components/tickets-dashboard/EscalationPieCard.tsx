import React, { useEffect, useState } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { escalationReportsAPI, EscalationOverviewResponse } from '@/services/escalationReportsAPI';
import { PIE_OPEN_COLOR, PIE_CLOSED_COLOR, getPieChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

export type EscalationPieMetric =
  | 'open-escalation'
  | 'close-escalation'
  | 'average-escalation'
  | 'executive-escalation';

const PIE_METRIC_META: Record<
  EscalationPieMetric,
  { title: string; subtitle?: string; emptyMessage?: string; centerLabel?: string }
> = {
  'open-escalation': { title: 'Open Escalation', subtitle: 'Open / Closed' },
  'close-escalation': { title: 'Close Escalation', subtitle: 'Open / Closed' },
  'average-escalation': {
    title: 'Average Escalation',
    subtitle: 'Average ageing (days)',
    emptyMessage: 'No average escalation data for the selected date range.',
    centerLabel: 'Days',
  },
  'executive-escalation': {
    title: 'Executive Escalation',
    subtitle: 'Status-wise executive escalations',
    emptyMessage: 'No executive escalation data for the selected date range.',
  },
};

const buildStatusSegments = (rows: { ticket_status: string }[]): PieChartSegment[] => {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const status = row.ticket_status || 'Unknown';
    counts.set(status, (counts.get(status) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, value], i) => ({
    name,
    value,
    color: getPieChartColor(i),
  }));
};

interface EscalationPieCardProps {
  metric: EscalationPieMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Pie/donut cards for Escalation — Open, Close, Average, Executive (FM Count widgets). */
export const EscalationPieCard: React.FC<EscalationPieCardProps> = ({ metric, dateRange, className }) => {
  const [overview, setOverview] = useState<EscalationOverviewResponse['response'] | null>(null);
  const [statusSegments, setStatusSegments] = useState<PieChartSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };

    if (metric === 'executive-escalation') {
      escalationReportsAPI
        .getExecutiveTable(range)
        .then((res) => {
          if (!cancelled) setStatusSegments(buildStatusSegments(res.response));
        })
        .catch(() => {
          if (!cancelled) setStatusSegments([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      escalationReportsAPI
        .getOverview(range)
        .then((res) => {
          if (!cancelled) setOverview(res.response);
        })
        .catch(() => {
          if (!cancelled) setOverview(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [metric, dateRange.startDate, dateRange.endDate]);

  const open = overview?.open ?? 0;
  const closed = overview?.closed ?? 0;

  let segments: PieChartSegment[] = [];
  let centerValue: string | number | undefined;
  let centerLabel: string | undefined;

  switch (metric) {
    case 'open-escalation':
    case 'close-escalation':
      segments = [
        { name: 'Open', value: open, color: PIE_OPEN_COLOR },
        { name: 'Closed', value: closed, color: PIE_CLOSED_COLOR },
      ];
      break;
    case 'average-escalation': {
      const avg = overview?.average_ageing ?? 0;
      segments = [{ name: 'Average Days', value: avg > 0 ? avg : 0, color: '#CDCAF5' }];
      centerValue = avg > 0 ? (Number.isInteger(avg) ? avg : avg.toFixed(1)) : undefined;
      centerLabel = 'Days';
      break;
    }
    case 'executive-escalation':
      segments = statusSegments;
      break;
  }

  const meta = PIE_METRIC_META[metric];

  return (
    <PieChartCard
      title={meta.title}
      subtitle={meta.subtitle}
      segments={segments}
      loading={loading}
      emptyMessage={meta.emptyMessage}
      centerValue={centerValue}
      centerLabel={centerLabel ?? meta.centerLabel}
      className={className}
    />
  );
};
