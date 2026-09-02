import React, { useEffect, useState } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { visitorReportsAPI, VisitorOverviewResponse } from '@/services/visitorReportsAPI';
import { PIE_OPEN_COLOR, PIE_CLOSED_COLOR } from './colors';
import { TicketsDashboardDateRange } from './types';

export type VisitorPieMetric = 'expected-unexpected' | 'goods-in-out' | 'delivery-visitors';

const PIE_METRIC_META: Record<VisitorPieMetric, { title: string; subtitle?: string }> = {
  'expected-unexpected': {
    title: 'Expected vs Unexpected Visitors',
    subtitle: 'Expected / Unexpected',
  },
  'goods-in-out': {
    title: 'Goods In vs Goods Out',
    subtitle: 'Inwards / Outwards',
  },
  'delivery-visitors': {
    title: 'Delivery Visitors',
    subtitle: 'Delivery-partner visit split',
  },
};

interface VisitorPieCardProps {
  metric: VisitorPieMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Pie/donut cards for the Visitor tab — Expected/Unexpected, Goods In/Out, Delivery. */
export const VisitorPieCard: React.FC<VisitorPieCardProps> = ({ metric, dateRange, className }) => {
  const [overview, setOverview] = useState<VisitorOverviewResponse['response'] | null>(null);
  const [delivery, setDelivery] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };

    if (metric === 'delivery-visitors') {
      visitorReportsAPI
        .getDelivery(range)
        .then((res) => {
          if (!cancelled) setDelivery(res.response);
        })
        .catch(() => {
          if (!cancelled) setDelivery([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      visitorReportsAPI
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

  let segments: PieChartSegment[] = [];
  switch (metric) {
    case 'expected-unexpected':
      segments = [
        { name: 'Expected', value: overview?.expected_visitors ?? 0, color: PIE_CLOSED_COLOR },
        { name: 'Unexpected', value: overview?.unexpected_visitors ?? 0, color: PIE_OPEN_COLOR },
      ];
      break;
    case 'goods-in-out':
      segments = [
        { name: 'Goods In', value: overview?.goods_inwards ?? 0, color: PIE_CLOSED_COLOR },
        { name: 'Goods Out', value: overview?.goods_outwards ?? 0, color: PIE_OPEN_COLOR },
      ];
      break;
    case 'delivery-visitors': {
      const DELIVERY_COLORS = ['#CDCAF5', '#76CDC1'] as const;
      segments = delivery.map((entry, i) => ({
        name: entry.name,
        value: entry.value,
        color: DELIVERY_COLORS[i % DELIVERY_COLORS.length],
      }));
      break;
    }
  }

  const meta = PIE_METRIC_META[metric];

  return (
    <PieChartCard
      title={meta.title}
      subtitle={meta.subtitle}
      segments={segments}
      loading={loading}
      className={className}
      maxVisibleSegments={metric === 'delivery-visitors' ? 6 : undefined}
    />
  );
};
