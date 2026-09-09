import { useEffect, useState } from 'react';
import {
  visitorReportsAPI,
  VisitorOverviewResponse,
  VisitorStaffKpiResponse,
} from '@/services/visitorReportsAPI';
import { TicketsDashboardDateRange } from './types';

const EMPTY_VISITOR_OVERVIEW: VisitorOverviewResponse['response'] = {
  total_visitors: 0,
  expected_visitors: 0,
  unexpected_visitors: 0,
  total_vehicles: 0,
  total_gate_pass: 0,
  returnable_gate_pass: 0,
  non_returnable_gate_pass: 0,
  delivery_visitors: [],
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

const EMPTY_STAFF_KPI: VisitorStaffKpiResponse['response'] = {
  total_staff: 0,
  staff_in: 0,
  staff_out: 0,
};

/** Fetches staff Total / In / Out headcounts for the Visitor tab tiles. */
export const useVisitorStaffKpi = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): VisitorStaffKpiResponse['response'] | null => {
  const [data, setData] = useState<VisitorStaffKpiResponse['response'] | null>(EMPTY_STAFF_KPI);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    visitorReportsAPI
      .getStaffKpi({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setData(res.response);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_STAFF_KPI);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
