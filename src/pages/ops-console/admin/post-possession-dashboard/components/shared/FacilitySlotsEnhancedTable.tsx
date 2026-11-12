import React from 'react';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import type { ColumnConfig } from '@/hooks/useEnhancedTable';
import { useEnhancedTableScrollViewport } from './useEnhancedTableScrollViewport';

export interface FacilitySlotRow extends Record<string, string> {
  id: string;
  facility: string;
  morning: string;
  evening: string;
  vacantToday: string;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'facility', label: 'Facility', sortable: false, draggable: false, hideable: false },
  { key: 'morning', label: 'Morning', sortable: false, draggable: false, hideable: false },
  { key: 'evening', label: 'Evening', sortable: false, draggable: false, hideable: false },
  { key: 'vacantToday', label: 'Vacant Today', sortable: false, draggable: false, hideable: false },
];

interface FacilitySlotsEnhancedTableProps {
  rows: FacilitySlotRow[];
  allRows?: FacilitySlotRow[];
  emptyMessage: string;
}

function parseBookedCapacity(value: string) {
  const [bookedValue, capacityValue] = value.split('/');
  const booked = Number(bookedValue);
  const capacity = Number(capacityValue);
  return Number.isFinite(booked) && Number.isFinite(capacity)
    ? { booked, capacity }
    : null;
}

function renderBookedCapacity(value: string): React.ReactNode {
  const [booked, capacity] = value.split('/');
  if (capacity === undefined || !Number.isFinite(Number(booked))) return value;
  return (
    <span>
      <strong className="facility-slot-booked">{booked}</strong>/{capacity}
    </span>
  );
}

export const FacilitySlotsEnhancedTable: React.FC<FacilitySlotsEnhancedTableProps> = ({
  rows,
  allRows = rows,
  emptyMessage,
}) => {
  const tableRootRef = useEnhancedTableScrollViewport(
    'facility-slots-scroll',
    rows,
    '.facility-slots-total'
  );
  const totals = allRows.map((row) => ({
    morning: parseBookedCapacity(row.morning),
    evening: parseBookedCapacity(row.evening),
    vacant: Number(row.vacantToday),
  }));
  const rowsHaveCompleteTotals =
    totals.length > 0 &&
    totals.every(
      ({ morning, evening, vacant }) =>
        morning !== null && evening !== null && Number.isFinite(vacant)
    );
  const rowTotals = rowsHaveCompleteTotals
    ? {
        booked: totals.reduce(
          (sum, { morning, evening }) =>
            sum + (morning?.booked ?? 0) + (evening?.booked ?? 0),
          0
        ),
        capacity: totals.reduce(
          (sum, { morning, evening }) =>
            sum + (morning?.capacity ?? 0) + (evening?.capacity ?? 0),
          0
        ),
        vacant: totals.reduce((sum, { vacant }) => sum + vacant, 0),
      }
    : null;

  return (
    <div ref={tableRootRef} className="dashboard-enhanced-table-root facility-slots-table-root">
      <EnhancedTable
        data={rows}
        columns={COLUMNS}
        renderRow={(row) => ({
          ...row,
          facility: <strong>{row.facility}</strong>,
          morning: renderBookedCapacity(row.morning),
          evening: renderBookedCapacity(row.evening),
        })}
        getItemId={(row) => row.id}
        onRowClick={() =>
          window.dispatchEvent(new CustomEvent('pp-open-drill', { detail: 'bookings_today' }))
        }
        className="dashboard-enhanced-table"
        truncateCells
        emptyMessage={emptyMessage}
        pagination={false}
        hideTableSearch
        hideTableExport
        hideColumnsButton
      />
      {rowTotals && (
        <div className="facility-slots-total">
          <strong>Total</strong>
          <strong>{rowTotals.booked}/{rowTotals.capacity} booked</strong>
          <span />
          <strong>{rowTotals.vacant} vacant</strong>
        </div>
      )}
    </div>
  );
};
