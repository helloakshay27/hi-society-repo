import React from 'react';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import type { ColumnConfig } from '@/hooks/useEnhancedTable';
import { useEnhancedTableScrollViewport } from './useEnhancedTableScrollViewport';

export interface FitoutTableRow extends Record<string, string> {
  id: string;
}

const column = (key: string, label: string): ColumnConfig => ({
  key,
  label,
  sortable: false,
  draggable: false,
  hideable: false,
});

const PENDING_REQUEST_COLUMNS: ColumnConfig[] = [
  column('c0', 'ID'),
  column('c1', 'Resident'),
  column('c2', 'Tower'),
  column('c3', 'Flat'),
  column('c4', 'Type'),
  column('c5', 'Created By'),
  column('c6', 'Requested'),
  column('c7', 'Status'),
  column('c8', 'Contractor'),
  column('c9', 'Expiry Date'),
  column('c10', 'Deposit Refund'),
];

const COMPLIANCE_COLUMNS: ColumnConfig[] = [
  column('c0', 'ID'),
  column('c1', 'Resident'),
  column('c2', 'Tower'),
  column('c3', 'Type'),
  column('c4', 'Completion'),
  column('c5', 'Missing Documents'),
  column('c6', 'Deposit Held'),
  column('c7', 'Refund Due'),
];

interface FitoutEnhancedTableProps {
  rows: FitoutTableRow[];
  emptyMessage: string;
}

interface BaseProps extends FitoutEnhancedTableProps {
  columns: ColumnConfig[];
  viewportClassName: string;
  drill: string;
}

const FitoutEnhancedTable: React.FC<BaseProps> = ({
  rows,
  emptyMessage,
  columns,
  viewportClassName,
  drill,
}) => {
  const tableRootRef = useEnhancedTableScrollViewport(viewportClassName, rows, undefined, 10);

  return (
    <div ref={tableRootRef} className="dashboard-enhanced-table-root">
      <EnhancedTable
        data={rows}
        columns={columns}
        renderRow={(row) => row}
        getItemId={(row) => row.id}
        onRowClick={() => window.dispatchEvent(new CustomEvent('pp-open-drill', { detail: drill }))}
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

export const PENDING_REQUESTS_SCROLL_CLASS = 'pending-requests-scroll';
export const COMPLIANCE_CHECKLIST_SCROLL_CLASS = 'compliance-checklist-scroll';

export const PendingRequestsEnhancedTable: React.FC<FitoutEnhancedTableProps> = (props) => (
  <FitoutEnhancedTable
    {...props}
    columns={PENDING_REQUEST_COLUMNS}
    viewportClassName={PENDING_REQUESTS_SCROLL_CLASS}
    drill="fitout_pending"
  />
);

export const ComplianceChecklistEnhancedTable: React.FC<FitoutEnhancedTableProps> = (props) => (
  <FitoutEnhancedTable
    {...props}
    columns={COMPLIANCE_COLUMNS}
    viewportClassName={COMPLIANCE_CHECKLIST_SCROLL_CLASS}
    drill="fitout_compliance"
  />
);
