import { useEffect, useState } from 'react';
import { assetReportsAPI, AssetKpisResponse } from '@/services/assetReportsAPI';
import { TicketsDashboardDateRange } from './types';

const EMPTY_ASSET_OVERVIEW: AssetKpisResponse['response'] = {
  total_assets_available: 0,
  assets_in_use: 0,
  assets_in_breakdown: 0,
  critical_assets_in_breakdown: 0,
  ppm_overdue_assets: 0,
  customer_average_rating: 0,
};

/** Fetches asset KPI totals used by the Assets tab tiles. */
export const useAssetOverview = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): AssetKpisResponse['response'] | null => {
  const [data, setData] = useState<AssetKpisResponse['response'] | null>(EMPTY_ASSET_OVERVIEW);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    assetReportsAPI
      .getKpis({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setData(res.response);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_ASSET_OVERVIEW);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
