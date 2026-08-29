import { useEffect, useState } from 'react';
import { utilityReportsAPI, UtilityOverviewResponse } from '@/services/utilityReportsAPI';
import { TicketsDashboardDateRange } from './types';
import { SAMPLE_UTILITY_OVERVIEW } from './sampleData';

const hasOverviewData = (next: UtilityOverviewResponse['response']): boolean =>
  (next.power_mains_kwh ?? 0) +
    (next.power_solar_kwh ?? 0) +
    (next.power_dg_kwh ?? 0) +
    (next.diesel_liters ?? 0) +
    (next.power_renewable_kwh ?? 0) +
    (next.water_total_kl ?? 0) +
    (next.water_domestic_kl ?? 0) +
    (next.carbon_scope1 ?? 0) +
    (next.carbon_scope2 ?? 0) +
    (next.fuel_consumption ?? 0) +
    (next.energy_intensity ?? 0) >
  0;

/** Fetches utility KPI totals used by the Utility tab tiles. */
export const useUtilityOverview = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): UtilityOverviewResponse['response'] | null => {
  const [data, setData] = useState<UtilityOverviewResponse['response'] | null>(SAMPLE_UTILITY_OVERVIEW);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    utilityReportsAPI
      .getOverview({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (cancelled) return;
        setData(hasOverviewData(res.response) ? res.response : SAMPLE_UTILITY_OVERVIEW);
      })
      .catch(() => {
        if (!cancelled) setData(SAMPLE_UTILITY_OVERVIEW);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
