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

const RCA_PAGE_SIZE = 20;
const SR_NO_KEY = '__sr_no';

/**
 * Legacy "Incident Summary" column order + labels. Each entry lists the API keys it can come from;
 * API columns not listed here are appended after these, so no data is dropped.
 */
const SUMMARY_COLUMNS: { label: string; keys: string[]; wide?: boolean }[] = [
  { label: 'Name of the site', keys: ['site_name', 'site'] },
  { label: 'Location', keys: ['area', 'location'] },
  { label: 'Incident date', keys: ['occurrence_date', 'date'] },
  { label: 'Time of incidence', keys: ['occurrence_time', 'time'] },
  { label: 'Incident Category', keys: ['category_name', 'category'] },
  { label: 'Incident Brief', keys: ['description'], wide: true },
  { label: 'Loss/Damage Evaluation', keys: ['loss'] },
  { label: 'RCA', keys: ['rca_text', 'rca'], wide: true },
  { label: 'Level', keys: ['level_name', 'level'] },
  { label: 'Primary RCA Category', keys: ['rca_category_name'] },
  { label: 'Corrective Actions', keys: ['corrective_action', 'corrective_actions'], wide: true },
  { label: 'Preventive Actions', keys: ['preventive_action', 'preventive_actions'], wide: true },
  { label: 'Status', keys: ['current_status', 'status'] },
];

/** Columns the summary view replaces with its own Sr. No. */
const HIDDEN_KEYS = new Set(['sr_no', 'serial_no', 'incident_id', 'id']);

/** "RCA Data" — paginated incident RCA rows with client-side search and CSV export. */
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

  const tableColumns = useMemo(() => {
    const available = new Set(columns.map((c) => c.key));
    const used = new Set<string>();
    const ordered: { key: string; label: string; wide?: boolean }[] = [{ key: SR_NO_KEY, label: 'Sr. No.' }];
    SUMMARY_COLUMNS.forEach(({ label, keys, wide }) => {
      const key = keys.find((k) => available.has(k));
      if (!key) return;
      used.add(key);
      ordered.push({ key, label, wide });
    });
    columns.forEach((col) => {
      if (used.has(col.key) || HIDDEN_KEYS.has(col.key)) return;
      ordered.push(col);
    });
    return ordered;
  }, [columns]);

  const numberedRows = useMemo(
    () => rows.map((row, index) => ({ ...row, [SR_NO_KEY]: (page - 1) * RCA_PAGE_SIZE + index + 1 })),
    [rows, page]
  );

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return numberedRows;
    return numberedRows.filter((row) =>
      Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(term))
    );
  }, [numberedRows, search]);

  const renderCell = (row: IncidentRcaRow, key: string) => {
    const value = row[key];
    if (value == null || value === '') return '—';
    return String(value);
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
        <div className="flex h-full min-h-48 flex-col">
          {/* Fills the card so the table shell never sits half-empty inside the grid cell. */}
          <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[#d5dbdb] bg-white">
            <table className="item-table-no-hover w-full border-separate border-spacing-0 text-brand-body-5">
              <thead>
                <tr>
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      style={{ minWidth: col.wide ? '14rem' : col.key === SR_NO_KEY ? '4.5rem' : '7.5rem' }}
                      className="sticky top-0 z-10 px-3 py-2.5 text-center align-middle"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row[SR_NO_KEY]}>
                    {tableColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`whitespace-normal break-words px-3 py-2.5 text-center align-top text-brand-text ${
                          col.key === SR_NO_KEY ? 'font-semibold' : ''
                        }`}
                      >
                        {renderCell(row, col.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex shrink-0 items-center justify-end gap-2 text-brand-body-5 text-brand-text">
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
        </div>
      )}
    </ChartCardShell>
  );
};
