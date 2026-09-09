import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCardShell } from './ChartCardShell';
import { CardDownloadButton } from './CardDownloadButton';
import {
  checklistReportsAPI,
  ChecklistExportKind,
  ChecklistStatusRow,
} from '@/services/checklistReportsAPI';
import { getTicketsChartColor } from './colors';
import { TicketsDashboardDateRange } from './types';

export type ChecklistStatusVariant = 'technical' | 'non-technical' | 'site-wise';

const VARIANT_META: Record<
  ChecklistStatusVariant,
  { title: string; firstColumn: string; exportKind: ChecklistExportKind }
> = {
  technical: { title: 'Technical Checklist', firstColumn: 'Category', exportKind: 'technical' },
  'non-technical': { title: 'Non-Technical Checklist', firstColumn: 'Category', exportKind: 'non_technical' },
  'site-wise': { title: 'Site-wise Checklist Status', firstColumn: 'Site', exportKind: 'combined' },
};

const STATUS_COLUMNS: { key: keyof ChecklistStatusRow; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'wip', label: 'WIP' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'total', label: 'Total' },
];

interface ChecklistStatusCardProps {
  variant: ChecklistStatusVariant;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

const fetchByVariant = (variant: ChecklistStatusVariant, range: { fromDate: Date; toDate: Date }) => {
  if (variant === 'technical') return checklistReportsAPI.getTechnicalMonthly(range);
  if (variant === 'non-technical') return checklistReportsAPI.getNonTechnicalMonthly(range);
  return checklistReportsAPI.getSiteWise(range);
};

/** Chart + status table card for the technical / non-technical / site-wise checklist views. */
export const ChecklistStatusCard: React.FC<ChecklistStatusCardProps> = ({ variant, dateRange, className }) => {
  const meta = VARIANT_META[variant];
  const [chart, setChart] = useState<{ name: string; value: number }[]>([]);
  const [rows, setRows] = useState<ChecklistStatusRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchByVariant(variant, { fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (cancelled) return;
        setChart(res.chart);
        setRows(res.response);
      })
      .catch(() => {
        if (!cancelled) {
          setChart([]);
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [variant, dateRange.startDate, dateRange.endDate]);

  const hasChart = chart.some((point) => point.value > 0);

  return (
    <ChartCardShell
      title={meta.title}
      loading={loading}
      className={className}
      rightSlot={
        <CardDownloadButton
          label={`Download ${meta.title}`}
          onDownload={() =>
            checklistReportsAPI.downloadExport(
              { fromDate: dateRange.startDate, toDate: dateRange.endDate },
              meta.exportKind
            )
          }
        />
      }
    >
      {!hasChart && rows.length === 0 ? (
        <div className="flex h-full min-h-40 items-center justify-center text-brand-body-5 text-brand-text-light">
          No data available
        </div>
      ) : (
      <div className="space-y-4">
        {hasChart && (
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={chart} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="name" tick={{ fill: '#2C2C2C', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#2C2C2C', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Checklists" fill={getTicketsChartColor(2)} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="max-h-64 overflow-auto">
          <table className="tickets-ageing-matrix-table w-full min-w-[560px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#d5dbdb] text-brand-body-5">
            <thead>
              <tr>
                <th className="sticky top-0 bg-brand px-3 py-2.5 text-left font-bold text-white">
                  {meta.firstColumn}
                </th>
                {STATUS_COLUMNS.map((col) => (
                  <th key={col.key} className="sticky top-0 bg-brand px-3 py-2.5 text-right font-bold text-white">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={STATUS_COLUMNS.length + 1}
                    className="border-b border-[#d5dbdb] px-3 py-6 text-center font-semibold text-brand-text-light"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={`${row.name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f6f4ee]'}>
                    <td className="border-b border-[#d5dbdb] px-3 py-2.5 font-semibold text-brand-text">
                      {row.name}
                    </td>
                    {STATUS_COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={`border-b border-[#d5dbdb] px-3 py-2.5 text-right tabular-nums text-brand-text ${
                          col.key === 'total' ? 'font-bold' : ''
                        }`}
                      >
                        {row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </ChartCardShell>
  );
};
