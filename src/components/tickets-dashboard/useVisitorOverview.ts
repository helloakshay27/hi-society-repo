import { useEffect, useState } from 'react';
import { visitorReportsAPI, VisitorOverviewResponse } from '@/services/visitorReportsAPI';
import { TicketsDashboardDateRange } from './types';
import { SAMPLE_VISITOR_OVERVIEW } from './sampleData';

/** Fetches visitor KPI totals used by the Visitor tab tiles. */
export const useVisitorOverview = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): VisitorOverviewResponse['response'] | null => {
  const [data, setData] = useState<VisitorOverviewResponse['response'] | null>(SAMPLE_VISITOR_OVERVIEW);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    visitorReportsAPI
      .getOverview({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (cancelled) return;
        const next = res.response;
        const hasData =
          (next.total_visitors ?? 0) +
            (next.expected_visitors ?? 0) +
            (next.unexpected_visitors ?? 0) +
            (next.total_vehicles ?? 0) +
            (next.goods_inwards ?? 0) +
            (next.goods_outwards ?? 0) >
          0;
        setData(hasData ? next : SAMPLE_VISITOR_OVERVIEW);
      })
      .catch(() => {
        if (!cancelled) setData(SAMPLE_VISITOR_OVERVIEW);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
