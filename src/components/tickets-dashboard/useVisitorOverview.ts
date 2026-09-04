import { useEffect, useState } from 'react';
import { visitorReportsAPI, VisitorOverviewResponse } from '@/services/visitorReportsAPI';
import { TicketsDashboardDateRange } from './types';

const EMPTY_VISITOR_OVERVIEW: VisitorOverviewResponse['response'] = {
  total_visitors: 0,
  expected_visitors: 0,
  unexpected_visitors: 0,
  total_vehicles: 0,
  goods_inwards: 0,
  goods_outwards: 0,
};

/** Fetches visitor KPI totals used by the Visitor tab tiles. */
export const useVisitorOverview = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): VisitorOverviewResponse['response'] | null => {
  const [data, setData] = useState<VisitorOverviewResponse['response'] | null>(EMPTY_VISITOR_OVERVIEW);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    visitorReportsAPI
      .getOverview({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (cancelled) return;
        setData(res.response);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_VISITOR_OVERVIEW);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
