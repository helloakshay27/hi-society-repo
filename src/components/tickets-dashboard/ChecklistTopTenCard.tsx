import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartCardShell } from './ChartCardShell';
import { CardDownloadButton } from './CardDownloadButton';
import { checklistReportsAPI, ChecklistTopTenRow } from '@/services/checklistReportsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

interface ChecklistTopTenCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/** "Top 10 Checklist Types" — ranked bar chart + rank / type / count table. */
export const ChecklistTopTenCard: React.FC<ChecklistTopTenCardProps> = ({ dateRange, className }) => {
  const [rows, setRows] = useState<ChecklistTopTenRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    checklistReportsAPI
      .getTopTen({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setRows(res.response);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  const chartData = [...rows]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((row, i) => ({ name: row.type, value: row.count, color: getTicketsChartColor(i) }));
  const chartHeight = Math.max(200, chartData.length * 34 + 40);

  return (
    <ChartCardShell
      title="Top 10 Checklist Types"
      loading={loading}
      className={className}
      rightSlot={
        <CardDownloadButton
          label="Download Top 10 Checklist Types"
          onDownload={() =>
            checklistReportsAPI.downloadExport(
              { fromDate: dateRange.startDate, toDate: dateRange.endDate },
              'top_ten'
            )
          }
        />
      }
    >
      {rows.length === 0 ? (
        <div className="flex h-full min-h-40 items-center justify-center text-brand-body-5 text-brand-text-light">
          No data available
        </div>
      ) : (
      <div className="space-y-4">
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis type="number" allowDecimals={false} tick={{ fill: '#2C2C2C', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fill: '#2C2C2C', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="max-h-72 overflow-auto">
          <table className="tickets-ageing-matrix-table w-full min-w-[420px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#d5dbdb] text-brand-body-5">
            <thead>
              <tr>
                <th className="sticky top-0 bg-brand px-3 py-2.5 text-left font-bold text-white">Rank</th>
                <th className="sticky top-0 bg-brand px-3 py-2.5 text-left font-bold text-white">Checklist Type</th>
                <th className="sticky top-0 bg-brand px-3 py-2.5 text-right font-bold text-white">Count</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.type}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f6f4ee]'}>
                  <td className="border-b border-[#d5dbdb] px-3 py-2.5 font-semibold text-brand-text">{row.rank}</td>
                  <td className="border-b border-[#d5dbdb] px-3 py-2.5 text-brand-text">{row.type}</td>
                  <td className="border-b border-[#d5dbdb] px-3 py-2.5 text-right font-bold tabular-nums text-brand-text">
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </ChartCardShell>
  );
};
