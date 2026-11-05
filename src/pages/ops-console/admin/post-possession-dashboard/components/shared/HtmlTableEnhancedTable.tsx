import React from 'react';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import type { ColumnConfig } from '@/hooks/useEnhancedTable';

export interface HtmlTableEnhancedRow extends Record<string, React.ReactNode> {
  id: string;
  drill: string;
}

interface HtmlTableEnhancedTableProps {
  headers: string[];
  tableClassName: string;
  rows: HtmlTableEnhancedRow[];
  emptyMessage: string;
}

export const HtmlTableEnhancedTable: React.FC<HtmlTableEnhancedTableProps> = ({
  headers,
  tableClassName,
  rows,
  emptyMessage,
}) => {
  const isLeaderboardTable = tableClassName.split(/\s+/).includes('lb-tbl');
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);
  const columns: ColumnConfig[] = headers.map((label, index) => ({
    key: `c${index}`,
    label,
    sortable: false,
    draggable: false,
    hideable: false,
  }));
  const enhancedTableClassName = ['dashboard-enhanced-table', tableClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="dashboard-enhanced-table-root">
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={(row, columnKey) => {
          const index = Number(columnKey.slice(1));
          const content = row[columnKey];
          const cellTitle = row[`c${index}Title`];
          const cellText = row[`c${index}Text`];
          const cellClass = row[`c${index}Class`];
          return (
            <span
              className={`dashboard-table-cell-content ${
                typeof cellClass === 'string' ? cellClass : ''
              }`}
              title={
                typeof cellTitle === 'string' && cellTitle
                  ? `${typeof cellText === 'string' ? cellText : ''} · ${cellTitle}`
                  : undefined
              }
            >
              {content}
            </span>
          );
        }}
        getItemId={(row) => row.id}
        onRowClick={(row) => {
          if (isLeaderboardTable) setSelectedRowId(row.id);
          if (row.drill) {
            window.dispatchEvent(new CustomEvent('pp-open-drill', { detail: row.drill }));
          }
        }}
        rowClassName={(row) =>
          isLeaderboardTable && row.id === selectedRowId ? 'dashboard-table-row-selected' : ''
        }
        className={enhancedTableClassName}
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
