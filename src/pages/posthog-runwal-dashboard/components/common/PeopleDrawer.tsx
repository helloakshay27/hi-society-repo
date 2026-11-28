/**
 * The people behind a number: a panel from the right with search, sortable columns, 20 rows a page and a
 * CSV of every matching row. Opened by clicking a tile, a chart point or bar, or a table row.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface DrawerColumn<T> {
  key: string;
  label: string;
  num?: boolean;
  /** Text for sorting, search and the CSV. */
  value: (row: T) => string | number;
  /** What the cell shows, when not just the value. */
  render?: (row: T) => React.ReactNode;
  /** In the CSV only. */
  csvOnly?: boolean;
}

export interface DrawerSpec<T> {
  title: string;
  sub?: string;
  rows: T[];
  columns: DrawerColumn<T>[];
  rowKey: (row: T) => string;
  sortKey?: string;
  sortDir?: 1 | -1;
  note?: React.ReactNode;
  csvName: string;
}

const PER = 20;

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
function downloadCsv(name: string, head: string[], rows: (string | number)[][]) {
  const text = [head.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 400);
}

export function PeopleDrawer<T>({ spec, onClose }: { spec: DrawerSpec<T> | null; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<Element | null>(null);

  // A new list starts at its first page, unsearched, in its own order.
  useEffect(() => {
    if (!spec) return;
    openerRef.current = document.activeElement;
    setQuery('');
    setPage(0);
    setSortKey(spec.sortKey);
    setSortDir(spec.sortDir || 1);
    window.setTimeout(() => closeRef.current?.focus(), 0);
  }, [spec]);

  useEffect(() => {
    if (!spec) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [spec, onClose]);

  const close = () => {
    onClose();
    const el = openerRef.current as HTMLElement | null;
    if (el && typeof el.focus === 'function') window.setTimeout(() => el.focus(), 0);
  };

  const visible = useMemo(() => {
    if (!spec) return [];
    let rows = spec.rows;
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((r) => spec.columns.some((c) => String(c.value(r)).toLowerCase().includes(q)));
    const col = spec.columns.find((c) => c.key === sortKey);
    if (col) {
      rows = [...rows].sort((a, b) => {
        const x = col.value(a);
        const y = col.value(b);
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
        return c * sortDir;
      });
    }
    return rows;
  }, [spec, query, sortKey, sortDir]);

  if (!spec) return null;
  const shown = spec.columns.filter((c) => !c.csvOnly);
  const pages = Math.max(1, Math.ceil(visible.length / PER));
  const pg = Math.min(page, pages - 1);
  const slice = visible.slice(pg * PER, pg * PER + PER);
  const sortBy = (k: string) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(1);
    }
    setPage(0);
  };

  return createPortal(
    <>
      <div className="dl-scrim on" onClick={close} />
      <aside className="dl-panel on" role="dialog" aria-modal="true" aria-labelledby="dl-panel-title">
        <div className="dr-head">
          <div className="dr-titles">
            <h3 id="dl-panel-title">{spec.title}</h3>
            {spec.sub && <p className="dr-sub">{spec.sub}</p>}
          </div>
          <button ref={closeRef} type="button" className="dr-x" aria-label="Close" onClick={close}>
            ✕
          </button>
        </div>
        <div className="dr-bar">
          <input
            type="search"
            placeholder="Search by name, project or flat…"
            aria-label="Search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
          <button
            type="button"
            className="dr-csv"
            disabled={!visible.length}
            onClick={() =>
              downloadCsv(spec.csvName, spec.columns.map((c) => c.label), visible.map((r) => spec.columns.map((c) => c.value(r))))
            }
          >
            Download CSV
          </button>
          <span className="dr-count">
            {visible.length ? `Showing ${pg * PER + 1}–${pg * PER + slice.length} of ${visible.length.toLocaleString()}` : 'No matches'}
          </span>
        </div>
        <div className="dr-body">
          {!spec.rows.length ? (
            <div className="dr-empty">No people match this number under the current filters.</div>
          ) : (
            <table className="dl-tbl">
              <thead>
                <tr>
                  {shown.map((c) => (
                    <th
                      key={c.key}
                      className={`analytics-header${c.num ? ' num' : ''}`}
                      onClick={() => sortBy(c.key)}
                      aria-sort={sortKey === c.key ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}
                    >
                      {c.label}
                      {sortKey === c.key && <span className="ar">{sortDir === 1 ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((r) => (
                  <tr key={spec.rowKey(r)}>
                    {shown.map((c) => (
                      <td key={c.key} className={c.num ? 'num' : undefined}>
                        {c.render ? c.render(r) : c.value(r)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="dr-pager">
          <button type="button" disabled={pg === 0} onClick={() => setPage(pg - 1)}>
            ← Prev
          </button>
          <span>
            Page {pg + 1} of {pages}
          </span>
          <button type="button" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>
            Next →
          </button>
        </div>
        {spec.note && <div className="dr-note">{spec.note}</div>}
      </aside>
    </>,
    document.body
  );
}
