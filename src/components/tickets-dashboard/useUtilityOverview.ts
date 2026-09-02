import { useEffect, useState } from 'react';
import { utilityReportsAPI, UtilityOverviewResponse } from '@/services/utilityReportsAPI';
import { TicketsDashboardDateRange } from './types';

const EMPTY_UTILITY_OVERVIEW: UtilityOverviewResponse['response'] = {
  power_mains_kwh: 0,
  power_solar_kwh: 0,
  power_dg_kwh: 0,
  diesel_liters: 0,
  power_renewable_kwh: 0,
  water_total_kl: 0,
  water_domestic_kl: 0,
  water_flushing_kl: 0,
  water_irrigation_kl: 0,
  water_stp_kl: 0,
  carbon_scope1: 0,
  carbon_scope2: 0,
  fuel_consumption: 0,
  energy_intensity: 0,
};

/** Fetches utility KPI totals used by the Utility tab tiles. */
export const useUtilityOverview = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): UtilityOverviewResponse['response'] | null => {
  const [data, setData] = useState<UtilityOverviewResponse['response'] | null>(EMPTY_UTILITY_OVERVIEW);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    utilityReportsAPI
      .getOverview({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (cancelled) return;
        setData(res.response);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_UTILITY_OVERVIEW);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
