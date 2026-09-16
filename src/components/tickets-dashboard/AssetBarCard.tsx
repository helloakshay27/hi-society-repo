import React, { useEffect, useState } from 'react';
import { BarChartCard, BarChartSeries } from './BarChartCard';
import { CardDownloadButton } from './CardDownloadButton';
import { assetDashboardAnalyticsAPI, AssetNamedCount } from '@/services/assetDashboardAnalyticsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

interface AssetBarCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/**
 * Group-wise Assets bar chart — `assets_group_count_by_name=true`, the one bar chart
 * on the FM Matrix `/maintenance/asset` Analytics tab.
 */
export const AssetBarCard: React.FC<AssetBarCardProps> = ({ dateRange, className }) => {
  const [rows, setRows] = useState<AssetNamedCount[]>([]);
  const [info, setInfo] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    assetDashboardAnalyticsAPI
      .getGroupWise({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
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
  }, [dateRange.startDate, dateRange.endDate]);

  const data = [...rows]
    .sort((a, b) => b.value - a.value)
    .map((row, i) => ({ ...row, color: getTicketsChartColor(i) }));

  const series: BarChartSeries[] = [
    { dataKey: 'value', name: 'Assets', color: getTicketsChartColor(0) },
  ];

  return (
    <BarChartCard
      title="Group-wise Assets"
      subtitle={info ?? 'Asset count per group'}
      data={data}
      categoryKey="name"
      series={series}
      colorKey="color"
      orientation="horizontal"
      loading={loading}
      className={className}
      rightSlot={
        <CardDownloadButton
          label="Download Group-wise Assets"
          onDownload={() =>
            assetDashboardAnalyticsAPI.downloadExport(
              { fromDate: dateRange.startDate, toDate: dateRange.endDate },
              'group_wise'
            )
          }
        />
      }
    />
  );
};
