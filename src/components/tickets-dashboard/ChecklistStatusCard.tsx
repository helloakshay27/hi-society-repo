import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCardShell } from './ChartCardShell';
import { CardDownloadButton } from './CardDownloadButton';
import {
  checklistDashboardAnalyticsAPI,
  ChecklistStatusRow,
} from '@/services/checklistDashboardAnalyticsAPI';
import { TicketsDashboardDateRange } from './types';

export type ChecklistStatusVariant = 'technical' | 'non-technical' | 'site-wise';

/** Status bar colors, matching the FM Matrix `/maintenance/task` analytics cards. */
const STATUS_COLORS = {
  open: '#9EC8BA',
  closed: '#76CDC1',
  work_in_progress: '#CDCAF5',
  overdue: '#E39090',
} as const;

const STATUS_BARS: { key: keyof typeof STATUS_COLORS; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'work_in_progress', label: 'Work in Progress' },
  { key: 'overdue', label: 'Overdue' },
];

const TABLE_COLUMNS: { key: keyof ChecklistStatusRow; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'work_in_progress', label: 'WIP' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'total', label: 'Total' },
];

const VARIANT_META: Record<
  ChecklistStatusVariant,
  {
    title: string;
    subtitle: string;
    firstColumn: string;
    kind: 'technical' | 'nonTechnical' | 'siteWise';
  }
> = {
  technical: {
    title: 'Technical Checklist',
    subtitle: 'Status breakdown by category',
    firstColumn: 'Category',
    kind: 'technical',
  },
  'non-technical': {
    title: 'Non-Technical Checklist',
    subtitle: 'Status breakdown by category',
    firstColumn: 'Category',
    kind: 'nonTechnical',
  },
  'site-wise': {
    title: 'Site-wise Checklist',
    subtitle: 'Status breakdown by site',
    firstColumn: 'Site',
    kind: 'siteWise',
  },
};

interface ChecklistStatusCardProps {
  variant: ChecklistStatusVariant;
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

/**
 * Technical / Non-Technical / Site-wise checklist card — a stacked Open/Closed/WIP/
 * Overdue bar chart over a matching table, ported from the FM Matrix
 * `/maintenance/task` Analytics tab (`TaskAnalyticsCard`).
 */
export const ChecklistStatusCard: React.FC<ChecklistStatusCardProps> = ({
  variant,
  dateRange,
  className,
}) => {
  const meta = VARIANT_META[variant];
  const [rows, setRows] = useState<ChecklistStatusRow[]>([]);
  const [info, setInfo] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    checklistDashboardAnalyticsAPI
      .getStatus(VARIANT_META[variant].kind, {
        fromDate: dateRange.startDate,
        toDate: dateRange.endDate,
      })
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
  }, [variant, dateRange.startDate, dateRange.endDate]);

  const hasData = rows.some((row) => row.total > 0);

  return (
    <ChartCardShell
      title={meta.title}
      subtitle={info ?? meta.subtitle}
      loading={loading}
      className={className}
      rightSlot={
        <CardDownloadButton
          label={`Download ${meta.title}`}
          onDownload={() =>
            checklistDashboardAnalyticsAPI.downloadExport(meta.kind, {
              fromDate: dateRange.startDate,
              toDate: dateRange.endDate,
            })
          }
        />
      }
    >
      {!hasData ? (
        <div className="flex h-full min-h-40 items-center justify-center text-brand-body-5 text-brand-text-light">
          No data available
        </div>
      ) : (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#2C2C2C', fontSize: 11 }} />
              <YAxis allowDecimals={false} width={40} tick={{ fill: '#2C2C2C', fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'rgba(180,180,180,0.15)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {STATUS_BARS.map((bar, i) => (
                <Bar
                  key={bar.key}
                  dataKey={bar.key}
                  stackId="status"
                  name={bar.label}
                  fill={STATUS_COLORS[bar.key]}
                  radius={i === STATUS_BARS.length - 1 ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          <div className="max-h-64 overflow-auto">
            <table className="tickets-ageing-matrix-table w-full min-w-[560px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#d5dbdb] text-brand-body-5">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-brand px-3 py-2.5 text-left font-bold text-white">
                    {meta.firstColumn}
                  </th>
                  {TABLE_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="sticky top-0 bg-brand px-3 py-2.5 text-right font-bold text-white"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.name}-${index}`}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-[#f6f4ee]'}
                  >
                    <td className="border-b border-[#d5dbdb] px-3 py-2.5 font-semibold text-brand-text">
                      {row.name}
                    </td>
                    {TABLE_COLUMNS.map((col) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ChartCardShell>
  );
};
