import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { visitorReportsAPI } from '@/services/visitorReportsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';
import {
  SAMPLE_VISITOR_BUILDING_WISE,
  SAMPLE_GOODS_IN,
  SAMPLE_GOODS_OUT,
  SAMPLE_DELIVERY_VISITORS,
} from './sampleData';

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

const SAMPLE_BY_METRIC: Record<VisitorBarMetric, { name: string; value: number }[]> = {
  'total-visitors': SAMPLE_VISITOR_BUILDING_WISE,
  'goods-in': SAMPLE_GOODS_IN,
  'goods-out': SAMPLE_GOODS_OUT,
  'delivery-visitors': SAMPLE_DELIVERY_VISITORS,
};

interface VisitorBarCardProps {
  metric: VisitorBarMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Bar-chart cards for the Visitor tab — Total Visitors, Goods In/Out, Delivery Visitors. */
export const VisitorBarCard: React.FC<VisitorBarCardProps> = ({ metric, dateRange, className }) => {
  const [rows, setRows] = useState<{ name: string; value: number }[]>(SAMPLE_BY_METRIC[metric]);
  const [isSample, setIsSample] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };
    const sample = SAMPLE_BY_METRIC[metric];

    const fetcher =
      metric === 'total-visitors'
        ? visitorReportsAPI.getBuildingWise
        : metric === 'goods-in'
          ? visitorReportsAPI.getGoodsIn
          : metric === 'goods-out'
            ? visitorReportsAPI.getGoodsOut
            : visitorReportsAPI.getDelivery;

    fetcher(range)
      .then((res) => {
        if (cancelled) return;
        if (res.response.length > 0) {
          setRows(res.response);
          setIsSample(false);
        } else {
          setRows(sample);
          setIsSample(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows(sample);
          setIsSample(true);
        }
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
      isSample={isSample}
      className={className}
    />
  );
};
