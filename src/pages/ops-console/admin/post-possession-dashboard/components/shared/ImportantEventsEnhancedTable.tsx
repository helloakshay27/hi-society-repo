import React from 'react';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import type { ColumnConfig } from '@/hooks/useEnhancedTable';
import { useEnhancedTableScrollViewport } from './useEnhancedTableScrollViewport';

export interface ImportantEventRow extends Record<string, string> {
  id: string;
  time: string;
  event: string;
  domain: string;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'time', label: 'Time', sortable: false, draggable: false, hideable: false },
  { key: 'event', label: 'Event', sortable: false, draggable: false, hideable: false },
  { key: 'domain', label: 'Domain', sortable: false, draggable: false, hideable: false },
];

interface ImportantEventsEnhancedTableProps {
  rows: ImportantEventRow[];
  emptyMessage: string;
}

export const ImportantEventsEnhancedTable: React.FC<ImportantEventsEnhancedTableProps> = ({
  rows,
  emptyMessage,
}) => {
  const tableRootRef = useEnhancedTableScrollViewport('important-events-scroll', rows);

  return (
    <div
      ref={tableRootRef}
      className="dashboard-enhanced-table-root important-events-table-root"
    >
      <EnhancedTable
        data={rows}
        columns={COLUMNS}
        renderRow={(row) => row}
        getItemId={(row) => row.id}
        onRowClick={() =>
          window.dispatchEvent(new CustomEvent('pp-open-drill', { detail: 'events' }))
        }
        className="dashboard-enhanced-table important-events-enhanced-table"
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
