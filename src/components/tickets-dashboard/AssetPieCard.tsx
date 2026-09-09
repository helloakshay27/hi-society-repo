import React, { useEffect, useState } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { assetReportsAPI, AssetKpisResponse } from '@/services/assetReportsAPI';
import { getPieChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

interface AssetPieCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Asset status split (In Use / In Breakdown / Available) — derived from the KPI totals. */
export const AssetPieCard: React.FC<AssetPieCardProps> = ({ dateRange, className }) => {
  const [kpis, setKpis] = useState<AssetKpisResponse['response'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    assetReportsAPI
      .getKpis({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setKpis(res.response);
      })
      .catch(() => {
        if (!cancelled) setKpis(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  const available = Math.max(
    (kpis?.total_assets_available ?? 0) - (kpis?.assets_in_use ?? 0) - (kpis?.assets_in_breakdown ?? 0),
    0
  );

  const segments: PieChartSegment[] = [
    { name: 'In Use', value: kpis?.assets_in_use ?? 0, color: getPieChartColor(1) },
    { name: 'In Breakdown', value: kpis?.assets_in_breakdown ?? 0, color: getPieChartColor(0) },
    { name: 'Available', value: available, color: getPieChartColor(3) },
  ];

  return (
    <PieChartCard
      title="Asset Status"
      subtitle="In Use / In Breakdown / Available"
      segments={segments}
      loading={loading}
      centerValue={kpis?.total_assets_available ?? 0}
      centerLabel="Total"
      className={className}
    />
  );
};
