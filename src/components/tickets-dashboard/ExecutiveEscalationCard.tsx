import React, { useEffect, useState } from 'react';
import { ChartCardShell } from './ChartCardShell';
import { escalationReportsAPI, ExecutiveEscalationRow } from '@/services/escalationReportsAPI';
import { TicketsDashboardDateRange } from './types';

interface ExecutiveEscalationCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

const COLUMNS: { key: keyof ExecutiveEscalationRow; label: string }[] = [
  { key: 'ticket_number', label: 'Ticket Number' },
  { key: 'description', label: 'Description' },
  { key: 'community_head', label: 'Community Head' },
  { key: 'category', label: 'Category' },
  { key: 'sub_category', label: 'Sub Category' },
  { key: 'ticket_status', label: 'Ticket Status' },
  { key: 'created_on', label: 'Created On' },
  { key: 'flat', label: 'Flat' },
];

/** FM Count → Executive Escalation table (ticket rows under executive escalation). */
export const ExecutiveEscalationCard: React.FC<ExecutiveEscalationCardProps> = ({
  dateRange,
  className,
}) => {
  const [rows, setRows] = useState<ExecutiveEscalationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    escalationReportsAPI
      .getExecutiveTable({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
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

  return (
    <ChartCardShell
      title="Executive Escalation"
      subtitle="Tickets under executive escalation"
      loading={loading}
      className={className}
    >
      {rows.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-brand-body-5 text-brand-text-light">
          No Data Available
        </div>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="tickets-ageing-matrix-table w-full min-w-[720px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#d5dbdb] text-brand-body-5">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
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
                <tr key={`${row.ticket_number}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f6f4ee]'}>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="border-b border-[#d5dbdb] px-3 py-2.5 text-brand-text">
                      {col.key === 'description' || col.key === 'ticket_number' ? (
                        <span className={col.key === 'ticket_number' ? 'font-semibold' : 'line-clamp-2'}>
                          {row[col.key]}
                        </span>
                      ) : (
                        row[col.key]
                      )}
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
