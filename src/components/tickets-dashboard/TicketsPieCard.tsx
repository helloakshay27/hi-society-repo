import React, { useEffect, useState } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import {
  ticketReportsAPI,
  TicketOverviewResponse,
  TicketDistributionResponse,
} from '@/services/ticketReportsAPI';
import { OPEN_COLOR, CLOSED_COLOR, PROACTIVE_COLOR, REACTIVE_COLOR, getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

export type TicketsPieMetric = 'tickets-overview' | 'proactive-reactive' | 'golden-tickets' | 'fm-vs-project';

const PIE_METRIC_META: Record<TicketsPieMetric, { title: string; subtitle?: string; emptyMessage?: string }> = {
  'tickets-overview': { title: 'Tickets', subtitle: 'Open / Closed' },
  'proactive-reactive': { title: 'Proactive vs Reactive Tickets', subtitle: 'Proactive / Reactive' },
  'golden-tickets': {
    title: 'Golden Tickets',
    subtitle: 'VIP / senior-priority ticket tracking',
    emptyMessage: 'No golden-user tickets in the selected date range.',
  },
  'fm-vs-project': { title: 'FM vs Project Tickets', subtitle: 'Split between FM-raised and Project-raised tickets' },
};

interface TicketsPieCardProps {
  metric: TicketsPieMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Single smart component for every pie/donut card on the Tickets Dashboard — pick the metric via `metric`. */
export const TicketsPieCard: React.FC<TicketsPieCardProps> = ({ metric, dateRange, className }) => {
  const [overview, setOverview] = useState<TicketOverviewResponse['response'] | null>(null);
  const [distribution, setDistribution] = useState<TicketDistributionResponse['response'] | null>(null);
  const [loading, setLoading] = useState(true);

  const needsDistribution = metric === 'fm-vs-project';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };

    const request = needsDistribution
      ? ticketReportsAPI.getDistribution(range).then((res) => {
          if (!cancelled) setDistribution(res.response);
        })
      : ticketReportsAPI.getOverview(range).then((res) => {
          if (!cancelled) setOverview(res.response);
        });

    request
      .catch(() => {
        if (!cancelled) {
          setOverview(null);
          setDistribution(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [metric, needsDistribution, dateRange.startDate, dateRange.endDate]);

  let segments: PieChartSegment[] = [];
  switch (metric) {
    case 'tickets-overview':
      segments = [
        { name: 'Open', value: overview?.ticket_status.total_open ?? 0, color: OPEN_COLOR },
        { name: 'Closed', value: overview?.ticket_status.total_closed ?? 0, color: CLOSED_COLOR },
      ];
      break;
    case 'proactive-reactive': {
      const pr = overview?.proactive_reactive;
      segments = [
        { name: 'Proactive', value: (pr?.proactive.open ?? 0) + (pr?.proactive.closed ?? 0), color: PROACTIVE_COLOR },
        { name: 'Reactive', value: (pr?.reactive.open ?? 0) + (pr?.reactive.closed ?? 0), color: REACTIVE_COLOR },
      ];
      break;
    }
    case 'golden-tickets':
      segments = [
        { name: 'Open', value: overview?.golden_user_tickets.open ?? 0, color: OPEN_COLOR },
        { name: 'Closed', value: overview?.golden_user_tickets.closed ?? 0, color: CLOSED_COLOR },
      ];
      break;
    case 'fm-vs-project':
      segments = (distribution?.by_issue ?? []).map((entry, i) => ({
        name: entry.issue,
        value: entry.count,
        color: getTicketsChartColor(i),
      }));
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
      className={className}
    />
  );
};
