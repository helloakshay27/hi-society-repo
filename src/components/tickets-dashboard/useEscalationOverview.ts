import { useEffect, useState } from 'react';
import { escalationReportsAPI, EscalationOverviewResponse } from '@/services/escalationReportsAPI';
import { TicketsDashboardDateRange } from './types';
import { SAMPLE_ESCALATION_OVERVIEW } from './sampleData';

/** Fetches Open / Closed / Average Escalation totals for the Escalation KPI tiles + pies. */
export const useEscalationOverview = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): EscalationOverviewResponse['response'] | null => {
  const [data, setData] = useState<EscalationOverviewResponse['response'] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    escalationReportsAPI
      .getOverview({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (cancelled) return;
        const next = res.response;
        const hasData = (next.open ?? 0) + (next.closed ?? 0) + (next.average_ageing ?? 0) > 0;
        setData(hasData ? next : SAMPLE_ESCALATION_OVERVIEW);
      })
      .catch(() => {
        if (!cancelled) setData(SAMPLE_ESCALATION_OVERVIEW);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
