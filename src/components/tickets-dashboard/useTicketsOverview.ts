import { useEffect, useState } from 'react';
import { ticketReportsAPI, TicketOverviewResponse } from '@/services/ticketReportsAPI';
import { TicketsDashboardDateRange } from './types';

/** Fetches the overview totals used by the Open / Closed / Total KPI tiles. */
export const useTicketsOverview = (dateRange: TicketsDashboardDateRange): TicketOverviewResponse['response'] | null => {
  const [data, setData] = useState<TicketOverviewResponse['response'] | null>(null);

  useEffect(() => {
    let cancelled = false;
    ticketReportsAPI
      .getOverview({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setData(res.response);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  return data;
};