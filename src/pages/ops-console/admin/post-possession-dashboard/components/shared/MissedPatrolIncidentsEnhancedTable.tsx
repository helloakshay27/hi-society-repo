import React from 'react';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import type { ColumnConfig } from '@/hooks/useEnhancedTable';
import { useEnhancedTableScrollViewport } from './useEnhancedTableScrollViewport';

export interface MissedPatrolIncidentRow extends Record<string, string> {
  id: string;
  c0: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'c0', label: 'Missed Checkpoint', sortable: false, draggable: false, hideable: false },
  { key: 'c1', label: 'Missed At', sortable: false, draggable: false, hideable: false },
  { key: 'c2', label: 'Time to Incident', sortable: false, draggable: false, hideable: false },
  { key: 'c3', label: 'Resulting Record', sortable: false, draggable: false, hideable: false },
  { key: 'c4', label: 'Status', sortable: false, draggable: false, hideable: false },
];

interface MissedPatrolIncidentsEnhancedTableProps {
  rows: MissedPatrolIncidentRow[];
  emptyMessage: string;
}

export const MISSED_PATROL_INCIDENTS_SCROLL_CLASS = 'missed-patrol-incidents-scroll';

export const MissedPatrolIncidentsEnhancedTable: React.FC<
  MissedPatrolIncidentsEnhancedTableProps
> = ({ rows, emptyMessage }) => {
  const tableRootRef = useEnhancedTableScrollViewport(
    MISSED_PATROL_INCIDENTS_SCROLL_CLASS,
    rows,
    undefined,
    5
  );

  return (
    <div ref={tableRootRef} className="dashboard-enhanced-table-root">
      <EnhancedTable
        data={rows}
        columns={COLUMNS}
        renderRow={(row) => row}
        getItemId={(row) => row.id}
        onRowClick={() =>
          window.dispatchEvent(new CustomEvent('pp-open-drill', { detail: 'patrol' }))
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
