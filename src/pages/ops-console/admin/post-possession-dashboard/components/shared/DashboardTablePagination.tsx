import React, { useEffect, useState } from 'react';

const PAGE_SIZE = 10;

export function renderDashboardTablePagination(
  anchor: HTMLElement,
  rowCount: number,
  page: number,
  onPageChange: (page: number) => void,
  id: string
): void {
  const container = anchor.parentElement;
  container?.querySelector<HTMLElement>(`#${id}`)?.remove();
  if (!container || rowCount === 0) return;

  const totalPages = Math.max(1, Math.ceil(rowCount / PAGE_SIZE));
  const activePage = Math.min(Math.max(page, 1), totalPages);
  const start = (activePage - 1) * PAGE_SIZE;
  const nav = document.createElement('nav');
  nav.id = id;
  nav.className = 'pgn dashboard-table-pagination';
  nav.setAttribute('aria-label', 'Table pagination');

  const info = document.createElement('span');
  info.className = 'pgn-info';
  info.textContent = `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, rowCount)} of ${rowCount}`;

  const buttons = document.createElement('div');
  buttons.className = 'pgn-btns';
  const addButton = (label: string, targetPage: number, disabled = false, current = false) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `pgn-b${current ? ' cur' : ''}`;
    button.setAttribute('aria-label', label === '‹' ? 'Previous page' : label === '›' ? 'Next page' : `Page ${label}`);
    if (current) button.setAttribute('aria-current', 'page');
    button.disabled = disabled;
    button.textContent = label;
    button.addEventListener('click', () => onPageChange(targetPage));
    buttons.append(button);
  };

  addButton('‹', activePage - 1, activePage === 1);
  for (let targetPage = 1; targetPage <= totalPages; targetPage += 1) {
    addButton(String(targetPage), targetPage, false, targetPage === activePage);
  }
  addButton('›', activePage + 1, activePage === totalPages);
  nav.append(info, buttons);
  anchor.after(nav);
}

interface DashboardTablePaginationProps<T> {
  rows: T[];
  children: (rows: T[]) => React.ReactNode;
}

export function DashboardTablePagination<T>({
  rows,
  children,
}: DashboardTablePaginationProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);
  const start = (activePage - 1) * PAGE_SIZE;

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div className="dashboard-table-pagination-container">
      {children(rows.slice(start, start + PAGE_SIZE))}
      {rows.length > 0 && (
        <nav className="pgn dashboard-table-pagination" aria-label="Table pagination">
          <span className="pgn-info">
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="pgn-btns">
            <button
              type="button"
              className="pgn-b"
              aria-label="Previous page"
              disabled={activePage === 1}
              onClick={() => setPage(activePage - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={`pgn-b${pageNumber === activePage ? ' cur' : ''}`}
                  aria-label={`Page ${pageNumber}`}
                  aria-current={pageNumber === activePage ? 'page' : undefined}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              type="button"
              className="pgn-b"
              aria-label="Next page"
              disabled={activePage === totalPages}
              onClick={() => setPage(activePage + 1)}
            >
              ›
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
