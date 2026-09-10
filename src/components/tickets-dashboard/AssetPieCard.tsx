import React, { useEffect, useState } from 'react';
import { PieChartCard, PieChartSegment } from './PieChartCard';
import { CardDownloadButton } from './CardDownloadButton';
import {
  assetDashboardAnalyticsAPI,
  AssetExportType,
  AssetNamedCount,
  AssetNamedCountsResponse,
} from '@/services/assetDashboardAnalyticsAPI';
import { getPieChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

/** The three donut charts on the FM Matrix `/maintenance/asset` Analytics tab. */
export type AssetPieMetric = 'status' | 'type-distribution' | 'category-wise';

const PIE_METRIC_META: Record<
  AssetPieMetric,
  {
    title: string;
    subtitle: string;
    fetch: (range: { fromDate: Date; toDate: Date }) => Promise<AssetNamedCountsResponse>;
    /** Asset Status has no export route — same as the FM Matrix card, which hides it there. */
    exportType?: AssetExportType;
  }
> = {
  status: {
    title: 'Asset Status',
    subtitle: 'In use / breakdown / in store / disposed',
    fetch: (range) => assetDashboardAnalyticsAPI.getStatus(range),
  },
  'type-distribution': {
    title: 'Asset Type Distribution',
    subtitle: 'IT vs Non-IT assets',
    fetch: (range) => assetDashboardAnalyticsAPI.getDistribution(range),
    exportType: 'distribution',
  },
  'category-wise': {
    title: 'Category-wise Assets',
    subtitle: 'Assets by category for the selected range',
    fetch: (range) => assetDashboardAnalyticsAPI.getCategoryWise(range),
    exportType: 'category_wise',
  },
};

interface AssetPieCardProps {
  metric: AssetPieMetric;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Donut cards for the Assets tab — status, IT/Non-IT split, category split. */
export const AssetPieCard: React.FC<AssetPieCardProps> = ({ metric, dateRange, className }) => {
  const [rows, setRows] = useState<AssetNamedCount[]>([]);
  const [info, setInfo] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const meta = PIE_METRIC_META[metric];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { fromDate: dateRange.startDate, toDate: dateRange.endDate };

    PIE_METRIC_META[metric]
      .fetch(range)
      .then((res) => {
        if (cancelled) return;
        setRows(res.response);
        setInfo(res.info);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setInfo(undefined);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [metric, dateRange.startDate, dateRange.endDate]);

  const segments: PieChartSegment[] = rows.map((entry, i) => ({
    name: entry.name,
    value: entry.value,
    color: getPieChartColor(i),
  }));

  const exportType = meta.exportType;

  return (
    <PieChartCard
      title={meta.title}
      subtitle={info ?? meta.subtitle}
      segments={segments}
      loading={loading}
      className={className}
      centerLabel="Assets"
      maxVisibleSegments={6}
      rightSlot={
        exportType ? (
          <CardDownloadButton
            label={`Download ${meta.title}`}
            onDownload={() =>
              assetDashboardAnalyticsAPI.downloadExport(
                { fromDate: dateRange.startDate, toDate: dateRange.endDate },
                exportType
              )
            }
          />
        ) : undefined
      }
    />
  );
};
