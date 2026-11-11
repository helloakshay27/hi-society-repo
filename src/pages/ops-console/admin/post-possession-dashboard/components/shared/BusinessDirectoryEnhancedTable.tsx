import React, { useMemo, useState } from 'react';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import type { ColumnConfig } from '@/hooks/useEnhancedTable';
import { useEnhancedTableScrollViewport } from './useEnhancedTableScrollViewport';

export interface BusinessDirectoryRow extends Record<string, string> {
  id: string;
  company: string;
  category: string;
  status: string;
}

const PAGE_SIZE = 20;

const COLUMNS: ColumnConfig[] = [
  { key: 'company', label: 'Company', sortable: false, draggable: false, hideable: false },
  { key: 'category', label: 'Category', sortable: false, draggable: false, hideable: false },
  { key: 'status', label: 'Status', sortable: false, draggable: false, hideable: false },
];

interface BusinessDirectoryEnhancedTableProps {
  rows: BusinessDirectoryRow[];
  emptyMessage: string;
}

export const BusinessDirectoryEnhancedTable: React.FC<BusinessDirectoryEnhancedTableProps> = ({
  rows,
  emptyMessage,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const pageRows = useMemo(
    () => rows.slice(startIndex, startIndex + PAGE_SIZE),
    [rows, startIndex]
  );
  const tableRootRef = useEnhancedTableScrollViewport('directory-vendors-scroll', pageRows);

  return (
    <div className="business-directory-enhanced-table">
      <div className="directory-vendors-scroll">
        <div ref={tableRootRef} className="dashboard-enhanced-table-root">
          <EnhancedTable
            data={pageRows}
            columns={COLUMNS}
            renderRow={(row) => row}
            getItemId={(row) => row.id}
            onRowClick={() =>
              window.dispatchEvent(new CustomEvent('pp-open-drill', { detail: 'directory_all' }))
            }
            className="dashboard-enhanced-table"
            truncateCells
            emptyMessage={emptyMessage}
            pagination={false}
            hideTableSearch
            hideTableExport
            hideColumnsButton
          />
        </div>
      </div>
      {rows.length > 0 && (
        <div className="pgn">
          <span className="pgn-info">
            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="pgn-btns">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  type="button"
                  className={`pgn-b${page === activePage ? ' cur' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
