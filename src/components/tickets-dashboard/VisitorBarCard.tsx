import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { visitorReportsAPI } from '@/services/visitorReportsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

// Only the delivery-partner split has a real breakdown in the Visitors API
// (the `delivery_visitors` map on /kpis). Building-wise / goods-in / goods-out
// bars had no endpoint and were removed.
export type VisitorBarMetric = 'delivery-visitors';

const BAR_METRIC_META: Record<
  VisitorBarMetric,
  { title: string; subtitle?: string; orientation?: 'horizontal' | 'vertical' }
> = {
  'delivery-visitors': {
    title: 'Delivery Visitors',
    subtitle: 'Delivery-partner visit volume (Blinkit, Swiggy, Zomato, etc.)',
    orientation: 'horizontal',
  },
};

interface VisitorBarCardProps {
  metric: VisitorBarMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Bar-chart card for the Visitor tab — Delivery Visitors by provider. */
export const VisitorBarCard: React.FC<VisitorBarCardProps> = ({ metric, dateRange, className }) => {
  const [rows, setRows] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };

    visitorReportsAPI
      .getDelivery(range)
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
  }, [metric, dateRange.startDate, dateRange.endDate]);

  const meta = BAR_METRIC_META[metric];
  const data = rows.map((row, i) => ({
    category: row.name,
    value: row.value,
    color: getTicketsChartColor(i),
  }));
  const series: BarChartSeries[] = [{ dataKey: 'value', name: meta.title, color: getTicketsChartColor(0) }];

  return (
    <BarChartCard
      title={meta.title}
      subtitle={meta.subtitle}
      data={data}
      series={series}
      colorKey="color"
      orientation={meta.orientation}
      loading={loading}
      className={className}
    />
  );
};
