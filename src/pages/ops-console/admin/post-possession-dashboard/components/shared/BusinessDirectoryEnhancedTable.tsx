import React from 'react';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import type { ColumnConfig } from '@/hooks/useEnhancedTable';
import { useEnhancedTableScrollViewport } from './useEnhancedTableScrollViewport';

export interface BusinessDirectoryRow extends Record<string, string> {
  id: string;
  company: string;
  category: string;
  status: string;
}

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
  const tableRootRef = useEnhancedTableScrollViewport('directory-vendors-scroll', rows);

  return (
    <div ref={tableRootRef} className="dashboard-enhanced-table-root">
      <EnhancedTable
        data={rows}
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
  );
};
