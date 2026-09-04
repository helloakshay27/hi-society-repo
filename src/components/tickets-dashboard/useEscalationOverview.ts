import { useEffect, useState } from 'react';
import { escalationReportsAPI, EscalationOverviewResponse } from '@/services/escalationReportsAPI';
import { TicketsDashboardDateRange } from './types';

const EMPTY_ESCALATION_OVERVIEW: EscalationOverviewResponse['response'] = {
  open: 0,
  closed: 0,
  average_ageing: 0,
};

/** Fetches Open / Closed / Average Escalation totals for the Escalation KPI tiles + pies. */
export const useEscalationOverview = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): EscalationOverviewResponse['response'] | null => {
  const [data, setData] = useState<EscalationOverviewResponse['response'] | null>(EMPTY_ESCALATION_OVERVIEW);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    escalationReportsAPI
      .getOverview({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (cancelled) return;
        setData(res.response);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_ESCALATION_OVERVIEW);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
