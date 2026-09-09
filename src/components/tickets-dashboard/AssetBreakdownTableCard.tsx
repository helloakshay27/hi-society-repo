import React, { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { ChartCardShell } from './ChartCardShell';
import { assetReportsAPI, AssetBreakdownRow } from '@/services/assetReportsAPI';
import { TicketsDashboardDateRange } from './types';

interface AssetBreakdownTableCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** Asset Breakdown Table — paginated `/assets/tables` rows with a matching Excel export. */
export const AssetBreakdownTableCard: React.FC<AssetBreakdownTableCardProps> = ({ dateRange, className }) => {
  const [columns, setColumns] = useState<{ key: string; label: string }[]>([]);
  const [rows, setRows] = useState<AssetBreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    assetReportsAPI
      .getBreakdownTable({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (cancelled) return;
        setColumns(res.columns);
        setRows(res.response);
      })
      .catch(() => {
        if (!cancelled) {
          setColumns([]);
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await assetReportsAPI.downloadExport(
        { fromDate: dateRange.startDate, toDate: dateRange.endDate },
        'breakdown_table'
      );
    } catch {
      // surfaced by the interceptor; keep the card usable
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ChartCardShell
      title="Asset Breakdown Table"
      loading={loading}
      className={className}
      // rightSlot={
      //   <button
      //     type="button"
      //     onClick={handleDownload}
      //     disabled={downloading}
      //     aria-label="Download asset breakdown"
      //     title="Download"
      //     className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-border text-brand-text hover:bg-brand-light disabled:opacity-50"
      //   >
      //     {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      //   </button>
      // }
    >
      {rows.length === 0 || columns.length === 0 ? (
        <div className="flex h-full min-h-32 items-center justify-center text-brand-body-5 text-brand-text-light">
          No Data Available
        </div>
      ) : (
        <div className="max-h-[260px] overflow-auto">
          <table className="tickets-ageing-matrix-table w-full min-w-[720px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#d5dbdb] text-brand-body-5">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="sticky top-0 bg-brand px-3 py-2.5 text-left font-bold text-white"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f6f4ee]'}>
                  {columns.map((col) => (
                    <td key={col.key} className="border-b border-[#d5dbdb] px-3 py-2.5 text-brand-text">
                      {row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCardShell>
  );
};
