import React from 'react';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import type { ColumnConfig } from '@/hooks/useEnhancedTable';
import { useEnhancedTableScrollViewport } from './useEnhancedTableScrollViewport';

export interface QuarantineCaseRow extends Record<string, string> {
  id: string;
  resident: string;
  tower: string;
  flat: string;
  type: string;
  start: string;
  end: string;
  status: string;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'resident', label: 'Resident', sortable: false, draggable: false, hideable: false },
  { key: 'tower', label: 'Tower', sortable: false, draggable: false, hideable: false },
  { key: 'flat', label: 'Flat', sortable: false, draggable: false, hideable: false },
  { key: 'type', label: 'Type', sortable: false, draggable: false, hideable: false },
  { key: 'start', label: 'Start', sortable: false, draggable: false, hideable: false },
  { key: 'end', label: 'End', sortable: false, draggable: false, hideable: false },
  { key: 'status', label: 'Status', sortable: false, draggable: false, hideable: false },
];

interface QuarantineCasesEnhancedTableProps {
  rows: QuarantineCaseRow[];
  emptyMessage: string;
}

export const QuarantineCasesEnhancedTable: React.FC<QuarantineCasesEnhancedTableProps> = ({
  rows,
  emptyMessage,
}) => {
  const tableRootRef = useEnhancedTableScrollViewport('quarantine-cases-scroll', rows);

  return (
    <div ref={tableRootRef} className="dashboard-enhanced-table-root">
      <EnhancedTable
        data={rows}
        columns={COLUMNS}
        renderRow={(row) => row}
        getItemId={(row) => row.id}
        onRowClick={() =>
          window.dispatchEvent(new CustomEvent('pp-open-drill', { detail: 'quarantine' }))
        }
        className="dashboard-enhanced-table"
        emptyMessage={emptyMessage}
        pagination={false}
        hideTableSearch
        hideTableExport
        hideColumnsButton
      />
    </div>
  );
};
