import { useEffect, useState } from 'react';
import { incidentReportsAPI, IncidentKpis } from '@/services/incidentReportsAPI';
import { TicketsDashboardDateRange } from './types';

const EMPTY_INCIDENT_OVERVIEW: IncidentKpis = {
  total_incidents: 0,
  open: 0,
  under_investigation: 0,
  closed: 0,
  zero_incident_days: 0,
  incident_rate: 0,
  ltir: 0,
};

/** Fetches incident KPI totals used by the Incident tab tiles. */
export const useIncidentOverview = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): IncidentKpis | null => {
  const [data, setData] = useState<IncidentKpis | null>(EMPTY_INCIDENT_OVERVIEW);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    incidentReportsAPI
      .getKpis({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setData(res.response);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_INCIDENT_OVERVIEW);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
