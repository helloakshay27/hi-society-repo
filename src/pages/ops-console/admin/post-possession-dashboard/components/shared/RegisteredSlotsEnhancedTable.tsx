import React from 'react';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import type { ColumnConfig } from '@/hooks/useEnhancedTable';
import { useEnhancedTableScrollViewport } from './useEnhancedTableScrollViewport';

export interface RegisteredSlotRow extends Record<string, string> {
  id: string;
  slot: string;
  tower: string;
  flat: string;
  vehicleNumber: string;
  vehicleType: string;
  parkingType: string;
  stickerNumber: string;
  status: string;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'slot', label: 'Slot', sortable: false, draggable: false, hideable: false },
  { key: 'tower', label: 'Tower', sortable: false, draggable: false, hideable: false },
  { key: 'flat', label: 'Flat', sortable: false, draggable: false, hideable: false },
  {
    key: 'vehicleNumber',
    label: 'Vehicle Number',
    sortable: false,
    draggable: false,
    hideable: false,
  },
  {
    key: 'vehicleType',
    label: 'Vehicle Type',
    sortable: false,
    draggable: false,
    hideable: false,
  },
  {
    key: 'parkingType',
    label: 'Parking Type',
    sortable: false,
    draggable: false,
    hideable: false,
  },
  {
    key: 'stickerNumber',
    label: 'Sticker No.',
    sortable: false,
    draggable: false,
    hideable: false,
  },
  { key: 'status', label: 'Status', sortable: false, draggable: false, hideable: false },
];

interface RegisteredSlotsEnhancedTableProps {
  rows: RegisteredSlotRow[];
  emptyMessage: string;
}

export const RegisteredSlotsEnhancedTable: React.FC<RegisteredSlotsEnhancedTableProps> = ({
  rows,
  emptyMessage,
}) => {
  const tableRootRef = useEnhancedTableScrollViewport('registered-slots-scroll', rows);

  return (
    <div ref={tableRootRef} className="dashboard-enhanced-table-root">
      <EnhancedTable
        data={rows}
        columns={COLUMNS}
        renderRow={(row) => row}
        getItemId={(row) => row.id}
        onRowClick={() =>
          window.dispatchEvent(new CustomEvent('pp-open-drill', { detail: 'parking_all' }))
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
