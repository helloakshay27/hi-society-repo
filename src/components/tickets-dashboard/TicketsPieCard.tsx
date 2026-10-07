import React, { useEffect, useState } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { CardDownloadButton } from './CardDownloadButton';
import {
  ticketReportsAPI,
  TicketExportType,
  TicketOverviewResponse,
  TicketDistributionResponse,
} from '@/services/ticketReportsAPI';
import {
  PIE_OPEN_COLOR,
  PIE_CLOSED_COLOR,
  PIE_PROACTIVE_COLOR,
  PIE_REACTIVE_COLOR,
  getPieChartColor,
  SENTIMENT_GREAT_COLOR,
  SENTIMENT_GOOD_COLOR,
  SENTIMENT_OKAY_COLOR,
  SENTIMENT_BAD_COLOR,
  SENTIMENT_UNACCEPTABLE_COLOR,
} from './colors';
import { TicketsDashboardDateRange } from './types';

export type TicketsPieMetric =
  | 'tickets-overview'
  | 'proactive-reactive'
  | 'golden-tickets'
  | 'fm-vs-project'
  | 'customer-sentiments';

/**
 * Per-card exports. `tickets-overview` and `golden-tickets` have no documented
 * export type, so those cards show no download button.
 */
const EXPORT_BY_METRIC: Partial<Record<TicketsPieMetric, TicketExportType>> = {
  'proactive-reactive': 'proactive_reactive',
  'fm-vs-project': 'fm_vs_project',
  'customer-sentiments': 'customer_sentiment',
};

const PIE_METRIC_META: Record<TicketsPieMetric, { title: string; subtitle?: string; emptyMessage?: string }> = {
  'tickets-overview': { title: 'Tickets', subtitle: 'Open / Closed' },
  'proactive-reactive': { title: 'Proactive vs Reactive Tickets', subtitle: 'Proactive / Reactive' },
  'golden-tickets': {
    title: 'Golden Tickets',
    subtitle: 'VIP / senior-priority ticket tracking',
    emptyMessage: 'No golden-user tickets in the selected date range.',
  },
  'fm-vs-project': { title: 'FM vs Project Tickets', subtitle: 'Split between FM-raised and Project-raised tickets' },
  'customer-sentiments': {
    title: 'Customer Sentiments',
    subtitle: 'Resident feedback by rating',
    emptyMessage: 'No customer sentiment feedback for the selected date range.',
  },
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
        { name: 'Open', value: overview?.ticket_status.total_open ?? 0, color: PIE_OPEN_COLOR },
        { name: 'Closed', value: overview?.ticket_status.total_closed ?? 0, color: PIE_CLOSED_COLOR },
      ];
      break;
    case 'proactive-reactive': {
      const pr = overview?.proactive_reactive;
      segments = [
        { name: 'Proactive', value: (pr?.proactive.open ?? 0) + (pr?.proactive.closed ?? 0), color: PIE_PROACTIVE_COLOR },
        { name: 'Reactive', value: (pr?.reactive.open ?? 0) + (pr?.reactive.closed ?? 0), color: PIE_REACTIVE_COLOR },
      ];
      break;
    }
    case 'golden-tickets':
      segments = [
        { name: 'Open', value: overview?.golden_user_tickets.open ?? 0, color: PIE_OPEN_COLOR },
        { name: 'Closed', value: overview?.golden_user_tickets.closed ?? 0, color: PIE_CLOSED_COLOR },
      ];
      break;
    case 'fm-vs-project':
      segments = (distribution?.by_issue ?? []).map((entry, i) => ({
        name: entry.issue,
        value: entry.count,
        color: getPieChartColor(i),
      }));
      break;
    case 'customer-sentiments': {
      const d = overview?.sentiment.distribution;
      if (d) {
        segments = [
          { name: 'Great', value: d.great, color: SENTIMENT_GREAT_COLOR },
          { name: 'Good', value: d.good, color: SENTIMENT_GOOD_COLOR },
          { name: 'Okay', value: d.okay, color: SENTIMENT_OKAY_COLOR },
          { name: 'Bad', value: d.bad, color: SENTIMENT_BAD_COLOR },
          { name: 'Unacceptable', value: d.unacceptable, color: SENTIMENT_UNACCEPTABLE_COLOR },
        ];
      } else {
        // Older/un-migrated environments only return the average, with no
        // per-rating counts (see frontend-tickets-dashboard-changes.md).
        // Round the average to its nearest rating bucket and put the full
        // total there — an approximation, but it surfaces the real
        // average_rating/total_ratings instead of an empty card.
        const avg = overview?.sentiment.average_rating;
        const total = overview?.sentiment.total_ratings ?? 0;
        const bucket = avg != null ? Math.min(5, Math.max(1, Math.round(avg))) : null;
        segments = [
          { name: 'Great', value: bucket === 5 ? total : 0, color: SENTIMENT_GREAT_COLOR },
          { name: 'Good', value: bucket === 4 ? total : 0, color: SENTIMENT_GOOD_COLOR },
          { name: 'Okay', value: bucket === 3 ? total : 0, color: SENTIMENT_OKAY_COLOR },
          { name: 'Bad', value: bucket === 2 ? total : 0, color: SENTIMENT_BAD_COLOR },
          { name: 'Unacceptable', value: bucket === 1 ? total : 0, color: SENTIMENT_UNACCEPTABLE_COLOR },
        ];
      }
      break;
    }
  }

  const meta = PIE_METRIC_META[metric];
  const exportType = EXPORT_BY_METRIC[metric];
  const hasSentimentDistribution = !!overview?.sentiment.distribution;
  const centerValue =
    metric === 'customer-sentiments'
      ? (hasSentimentDistribution ? overview?.sentiment.distribution?.total : overview?.sentiment.total_ratings)
      : undefined;
  const subtitle =
    metric === 'customer-sentiments' && overview && !hasSentimentDistribution
      ? `Estimated from average rating (${overview.sentiment.average_rating.toFixed(1)}/5) — no per-rating breakdown available`
      : meta.subtitle;

  return (
    <PieChartCard
      title={meta.title}
      subtitle={subtitle}
      segments={segments}
      centerValue={centerValue}
      loading={loading}
      emptyMessage={meta.emptyMessage}
      className={className}
      rightSlot={
        exportType ? (
          <CardDownloadButton
            label={`Download ${meta.title}`}
            onDownload={() =>
              ticketReportsAPI.downloadExport(
                { fromDate: dateRange.startDate, toDate: dateRange.endDate },
                exportType
              )
            }
          />
        ) : undefined
      }
    />
  );
};
