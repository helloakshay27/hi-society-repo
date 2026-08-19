import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import {
  ticketReportsAPI,
  TicketCategoryBreakdownResponse,
  TicketDistributionResponse,
  TicketOverviewResponse,
} from '@/services/ticketReportsAPI';
import { REACTIVE_COLOR, PROACTIVE_COLOR, TAT_ACHIEVED_COLOR, TAT_BREACHED_COLOR, getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';
import { SAMPLE_DELIVERY_VISITORS } from './sampleData';

export type TicketsBarMetric =
  | 'unit-category'
  | 'unit-category-proactive'
  | 'common-area-category'
  | 'common-area-category-proactive'
  | 'complaint-mode'
  | 'delivery-visitors'
  | 'response-tat'
  | 'resolution-tat';

const BAR_METRIC_META: Record<TicketsBarMetric, { title: string; subtitle?: string; orientation?: 'horizontal' | 'vertical' }> = {
  'unit-category': { title: 'Unit Category-wise Tickets', subtitle: 'Reactive vs Proactive volume per category' },
  'unit-category-proactive': { title: 'Unit Category-wise Proactive Tickets', subtitle: 'Proactive-only volume per category' },
  'common-area-category': {
    title: 'Common Area Category-wise Tickets',
    subtitle: 'Reactive vs Proactive volume per common-area category',
  },
  'common-area-category-proactive': {
    title: 'Common Area Category-wise Proactive Tickets',
    subtitle: 'Proactive-only volume per common-area category',
  },
  'complaint-mode': { title: 'Complaint Mode', subtitle: 'Tickets raised by mode (App, Call, Email, Walk-in, etc.)' },
  'delivery-visitors': { title: 'Delivery Visitors', subtitle: 'Delivery-partner visit volume (Blinkit, Swiggy, Zomato, etc.)' },
  'response-tat': { title: 'Response TAT', orientation: 'vertical' },
  'resolution-tat': { title: 'Resolution TAT', orientation: 'vertical' },
};

const CATEGORY_ENDPOINT_METRICS: TicketsBarMetric[] = [
  'unit-category',
  'unit-category-proactive',
  'common-area-category',
  'common-area-category-proactive',
];
const OVERVIEW_ENDPOINT_METRICS: TicketsBarMetric[] = ['response-tat', 'resolution-tat'];

interface TicketsBarCardProps {
  metric: TicketsBarMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Single smart component for every bar-chart card on the Tickets Dashboard — pick the metric via `metric`. */
export const TicketsBarCard: React.FC<TicketsBarCardProps> = ({ metric, dateRange, className }) => {
  const [categoryBreakdown, setCategoryBreakdown] = useState<TicketCategoryBreakdownResponse['response'] | null>(null);
  const [distribution, setDistribution] = useState<TicketDistributionResponse['response'] | null>(null);
  const [overview, setOverview] = useState<TicketOverviewResponse['response'] | null>(null);
  const [loading, setLoading] = useState(metric !== 'delivery-visitors');

  useEffect(() => {
    if (metric === 'delivery-visitors') return;

    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };

    const request = CATEGORY_ENDPOINT_METRICS.includes(metric)
      ? ticketReportsAPI.getCategoryBreakdown(range).then((res) => {
          if (!cancelled) setCategoryBreakdown(res.response);
        })
      : OVERVIEW_ENDPOINT_METRICS.includes(metric)
        ? ticketReportsAPI.getOverview(range).then((res) => {
            if (!cancelled) setOverview(res.response);
          })
        : ticketReportsAPI.getDistribution(range).then((res) => {
            if (!cancelled) setDistribution(res.response);
          });

    request
      .catch(() => {
        if (!cancelled) {
          setCategoryBreakdown(null);
          setDistribution(null);
          setOverview(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [metric, dateRange.startDate, dateRange.endDate]);

  let data: Array<Record<string, string | number>> = [];
  let series: BarChartSeries[] = [];
  let categoryKey = 'category';
  let colorKey: string | undefined;
  let insight: string | undefined;
  let emptyMessage: string | undefined;

  switch (metric) {
    case 'unit-category': {
      const rows = (categoryBreakdown?.proactive_reactive ?? [])
        .map((c) => ({
          category: c.category,
          reactive: c.reactive.open + c.reactive.closed,
          proactive: c.proactive.open + c.proactive.closed,
        }))
        .sort((a, b) => b.reactive + b.proactive - (a.reactive + a.proactive));
      data = rows;
      series = [
        { dataKey: 'reactive', name: 'Reactive', color: REACTIVE_COLOR, stackId: 'a' },
        { dataKey: 'proactive', name: 'Proactive', color: PROACTIVE_COLOR, stackId: 'a' },
      ];
      const top = rows[0];
      insight = top
        ? `${top.category} leads volume with ${top.reactive + top.proactive} tickets — worth checking whether that reflects genuine demand or a recurring issue specific to that category.`
        : undefined;
      break;
    }
    case 'unit-category-proactive': {
      data = (categoryBreakdown?.proactive_reactive ?? [])
        .map((c) => ({ category: c.category, proactive: c.proactive.open + c.proactive.closed }))
        .filter((c) => (c.proactive as number) > 0)
        .sort((a, b) => (b.proactive as number) - (a.proactive as number));
      series = [{ dataKey: 'proactive', name: 'Proactive', color: PROACTIVE_COLOR }];
      emptyMessage = 'No proactive tickets recorded for the selected date range.';
      break;
    }
    case 'common-area-category': {
      const total = categoryBreakdown?.common_area_category;
      const proactive = categoryBreakdown?.common_area_category_proactive;
      data = (total?.tickets_category ?? []).map((category, i) => {
        const proactiveIdx = proactive?.tickets_category.indexOf(category) ?? -1;
        const proactiveCount = proactiveIdx >= 0 ? proactive!.total_tickets[proactiveIdx] : 0;
        const totalCount = total!.total_tickets[i];
        return { category, proactive: proactiveCount, reactive: Math.max(totalCount - proactiveCount, 0) };
      });
      series = [
        { dataKey: 'reactive', name: 'Reactive', color: REACTIVE_COLOR, stackId: 'a' },
        { dataKey: 'proactive', name: 'Proactive', color: PROACTIVE_COLOR, stackId: 'a' },
      ];
      break;
    }
    case 'common-area-category-proactive': {
      const proactive = categoryBreakdown?.common_area_category_proactive;
      data = (proactive?.tickets_category ?? [])
        .map((category, i) => ({ category, proactive: proactive!.total_tickets[i] }))
        .filter((c) => (c.proactive as number) > 0)
        .sort((a, b) => (b.proactive as number) - (a.proactive as number));
      series = [{ dataKey: 'proactive', name: 'Proactive', color: PROACTIVE_COLOR }];
      emptyMessage = 'No proactive tickets recorded for the selected date range.';
      break;
    }
    case 'complaint-mode': {
      data = (distribution?.by_mode ?? []).map((m, i) => ({ name: m.mode, value: m.count, color: getTicketsChartColor(i) }));
      series = [{ dataKey: 'value', name: 'Tickets', color: getTicketsChartColor(0) }];
      categoryKey = 'name';
      colorKey = 'color';
      break;
    }
    case 'delivery-visitors': {
      data = SAMPLE_DELIVERY_VISITORS.map((visitor, i) => ({ ...visitor, color: getTicketsChartColor(i) }));
      series = [{ dataKey: 'value', name: 'Visits', color: getTicketsChartColor(0) }];
      categoryKey = 'name';
      colorKey = 'color';
      break;
    }
    case 'response-tat':
    case 'resolution-tat': {
      const variant = metric === 'response-tat' ? 'response' : 'resolution';
      const tat = overview?.tat?.[variant];
      data = [
        { name: 'Achieved', value: tat?.achieved ?? 0, color: TAT_ACHIEVED_COLOR },
        { name: 'Breached', value: tat?.breached ?? 0, color: TAT_BREACHED_COLOR },
      ];
      series = [{ dataKey: 'value', name: BAR_METRIC_META[metric].title, color: TAT_ACHIEVED_COLOR }];
      categoryKey = 'name';
      colorKey = 'color';
      break;
    }
  }

  const meta = BAR_METRIC_META[metric];

  return (
    <BarChartCard
      title={meta.title}
      subtitle={meta.subtitle}
      data={data}
      categoryKey={categoryKey}
      series={series}
      colorKey={colorKey}
      orientation={meta.orientation ?? 'horizontal'}
      loading={loading}
      isSample={metric === 'delivery-visitors'}
      insight={insight}
      emptyMessage={emptyMessage}
      className={className}
    />
  );
};
