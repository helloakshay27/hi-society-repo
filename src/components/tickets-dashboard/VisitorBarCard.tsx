import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { visitorReportsAPI } from '@/services/visitorReportsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

export type VisitorBarMetric = 'total-visitors' | 'goods-in' | 'goods-out' | 'delivery-visitors';

const BAR_METRIC_META: Record<
  VisitorBarMetric,
  { title: string; subtitle?: string; orientation?: 'horizontal' | 'vertical' }
> = {
  'total-visitors': {
    title: 'Total Visitors',
    subtitle: 'Building-wise visitor volume',
    orientation: 'vertical',
  },
  'goods-in': {
    title: 'Goods In',
    subtitle: 'Day / period-wise goods inwards',
    orientation: 'vertical',
  },
  'goods-out': {
    title: 'Goods Out',
    subtitle: 'Day / period-wise goods outwards',
    orientation: 'vertical',
  },
  'delivery-visitors': {
    title: 'Delivery Visitors',
    subtitle: 'Delivery-partner visit volume (Blinkit, Swiggy, Zomato, etc.)',
    orientation: 'horizontal',
  },
};

const FETCHER_BY_METRIC: Record<
  VisitorBarMetric,
  typeof visitorReportsAPI.getBuildingWise
> = {
  'total-visitors': visitorReportsAPI.getBuildingWise,
  'goods-in': visitorReportsAPI.getGoodsIn,
  'goods-out': visitorReportsAPI.getGoodsOut,
  'delivery-visitors': visitorReportsAPI.getDelivery,
};

interface VisitorBarCardProps {
  metric: VisitorBarMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Bar-chart cards for the Visitor tab — Total Visitors, Goods In/Out, Delivery Visitors. */
export const VisitorBarCard: React.FC<VisitorBarCardProps> = ({ metric, dateRange, className }) => {
  const [rows, setRows] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };

    FETCHER_BY_METRIC[metric](range)
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
