import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { ChartCardShell } from './ChartCardShell';
import { CardDownloadButton } from './CardDownloadButton';
import { incidentReportsAPI, IncidentRcaRow } from '@/services/incidentReportsAPI';
import { TicketsDashboardDateRange } from './types';

interface IncidentRcaTableCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

const PILL_BASE = 'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-brand-body-5 font-semibold';

/** Short fields stay on one line; narrative fields get a readable width and clamp. */
const COLUMN_WIDTH: Record<string, { minWidth: string; clamp?: boolean }> = {
  sr_no: { minWidth: '4.5rem' },
  incident_id: { minWidth: '7rem' },
  site_name: { minWidth: '10rem' },
  site: { minWidth: '10rem' },
  area: { minWidth: '9rem' },
  occurrence_date: { minWidth: '9rem' },
  date: { minWidth: '8rem' },
  occurrence_time: { minWidth: '8rem' },
  time: { minWidth: '7rem' },
  category_name: { minWidth: '9rem' },
  category: { minWidth: '9rem' },
  loss: { minWidth: '6rem' },
  rca_category_name: { minWidth: '11rem' },
  current_status: { minWidth: '8rem' },
  status: { minWidth: '8rem' },
  assigned_to_user_name: { minWidth: '10rem' },
  level_name: { minWidth: '7rem' },
  level: { minWidth: '7rem' },
  description: { minWidth: '18rem', clamp: true },
  rca_text: { minWidth: '18rem', clamp: true },
  rca: { minWidth: '18rem', clamp: true },
  corrective_action: { minWidth: '18rem', clamp: true },
  preventive_action: { minWidth: '18rem', clamp: true },
};

const levelPillClass = (value: string): string => {
  const v = value.toLowerCase();
  if (v.includes('high') || v.includes('critical') || v.includes('severe')) return `${PILL_BASE} bg-[#F2C8C4] text-black`;
  if (v.includes('moderate') || v.includes('medium')) return `${PILL_BASE} bg-[#F2EBC9] text-black`;
  if (v.includes('low')) return `${PILL_BASE} bg-[#C7EDDA] text-black`;
  return `${PILL_BASE} bg-brand-bg text-brand-text`;
};

const statusPillClass = (value: string): string => {
  const v = value.toLowerCase();
  if (v.includes('final')) return `${PILL_BASE} bg-[#CECBF6] text-black`;
  if (v.includes('provisional') || v.includes('pending') || v.includes('progress'))
    return `${PILL_BASE} bg-[#F2EBC9] text-black`;
  if (v.includes('open') || v.includes('active')) return `${PILL_BASE} bg-[#C7EDDA] text-black`;
  if (v.includes('closed') || v.includes('reject')) return `${PILL_BASE} bg-[#EDEAE3] text-black`;
  return `${PILL_BASE} bg-brand-bg text-brand-text`;
};

/** "RCA Data" — paginated incident RCA rows with client-side Sr. No. search and CSV export. */
export const IncidentRcaTableCard: React.FC<IncidentRcaTableCardProps> = ({ dateRange, className }) => {
  const [columns, setColumns] = useState<{ key: string; label: string }[]>([]);
  const [rows, setRows] = useState<IncidentRcaRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPage(1);
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    incidentReportsAPI
      .getRcaData({ fromDate: dateRange.startDate, toDate: dateRange.endDate }, page)
      .then((res) => {
        if (cancelled) return;
        setColumns(res.columns);
        setRows(res.response);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        if (!cancelled) {
          setColumns([]);
          setRows([]);
          setTotalPages(1);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, page]);

  const srKey = useMemo(
    () => columns.find((c) => /sr\.?\s*no|serial|^#$/i.test(c.label) || /sr_no|serial/i.test(c.key))?.key ?? 'sr_no',
    [columns]
  );

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(term))
    );
  }, [rows, search]);

  const renderCell = (row: IncidentRcaRow, key: string, label: string) => {
    const value = row[key];
    if (value == null || value === '') return '—';
    const text = String(value);
    if (/level/i.test(label) || /level/i.test(key)) {
      return <span className={levelPillClass(text)}>{text}</span>;
    }
    if (/status/i.test(label) || /status/i.test(key)) {
      return <span className={statusPillClass(text)}>{text}</span>;
    }
    if (COLUMN_WIDTH[key]?.clamp) {
      return (
        <span className="line-clamp-4 whitespace-normal" title={text}>
          {text}
        </span>
      );
    }
    return <span className="whitespace-nowrap">{text}</span>;
  };

  return (
    <ChartCardShell
      title="RCA Data"
      loading={loading}
      className={className}
      rightSlot={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-text-light" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search RCA..."
              className="h-8 w-44 rounded-md border border-brand-border bg-white pl-8 pr-2 text-brand-body-5 text-brand-text placeholder:text-brand-text-light focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <CardDownloadButton
            label="Export incident RCA data"
            onDownload={() =>
              incidentReportsAPI.downloadCsv({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
            }
          />
        </div>
      }
    >
      {visibleRows.length === 0 || columns.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-brand-body-5 text-brand-text-light">
          No Data Available
        </div>
      ) : (
        <>
          <div className="max-h-[28rem] overflow-auto">
            <table
              style={{ width: 'max-content', minWidth: '100%' }}
              className="border-separate border-spacing-0 text-left text-brand-body-5"
            >
              <thead>
                <tr>
                  {columns.map((col) => {
                    const width = COLUMN_WIDTH[col.key]?.minWidth ?? '8rem';
                    return (
                      <th
                        key={col.key}
                        style={{
                          minWidth: width,
                          width: COLUMN_WIDTH[col.key]?.clamp ? width : undefined,
                        }}
                        className="sticky top-0 whitespace-nowrap border-b border-[#c4b89d] bg-brand px-3 py-2.5 text-left font-bold text-white"
                      >
                        {col.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f6f4ee]'}>
                    {columns.map((col) => {
                      const width = COLUMN_WIDTH[col.key]?.minWidth ?? '8rem';
                      const clamp = COLUMN_WIDTH[col.key]?.clamp;
                      return (
                        <td
                          key={col.key}
                          style={{ minWidth: width, maxWidth: clamp ? width : undefined, width: clamp ? width : undefined }}
                          className={`border-b border-[#d5dbdb] px-3 py-2.5 align-top text-brand-text ${
                            col.key === srKey ? 'font-semibold' : ''
                          }`}
                        >
                          {renderCell(row, col.key, col.label)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2 text-brand-body-5 text-brand-text">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-border hover:bg-brand-light disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-border hover:bg-brand-light disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </ChartCardShell>
  );
};
