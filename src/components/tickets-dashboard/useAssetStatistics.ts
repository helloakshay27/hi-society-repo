import { useEffect, useState } from 'react';
import {
  assetDashboardAnalyticsAPI,
  AssetStatisticsSummary,
} from '@/services/assetDashboardAnalyticsAPI';
import { TicketsDashboardDateRange } from './types';

const EMPTY_ASSET_STATISTICS: AssetStatisticsSummary = {
  total_assets: 0,
  assets_in_use: 0,
  assets_in_breakdown: 0,
  critical_assets_in_breakdown: 0,
  ppm_conduct_assets: 0,
  assets_under_amc: 0,
  assets_missing_amc: 0,
};

/**
 * Asset KPI numbers for the Assets tab tiles + AMC card — one call to
 * `assets_statistics.json` with all six metric flags, matching the FM Matrix
 * Analytics tab's `AssetStatisticsSelector`.
 */
export const useAssetStatistics = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): AssetStatisticsSummary | null => {
  const [data, setData] = useState<AssetStatisticsSummary | null>(EMPTY_ASSET_STATISTICS);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    assetDashboardAnalyticsAPI
      .getStatistics({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_ASSET_STATISTICS);
      });

    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
