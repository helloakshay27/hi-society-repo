import GridLayout from 'react-grid-layout';

/** Default 12-col layout for Assets tab — KPI strip + breakdown table.
 *  Row 2 uses two half-width tiles so it fills the grid (no partial row for the
 *  table below to leave a gap around), and the table is kept short with its own
 *  internal scroll rather than a tall fixed card. */
export const DEFAULT_ASSET_GRID_LAYOUT: GridLayout.Layout[] = [
  // Row 1
  { i: 'kpi-total-assets', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-assets-in-use', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-assets-in-breakdown', x: 8, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Row 2
  { i: 'kpi-critical-breakdown', x: 0, y: 3, w: 6, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-ppm-overdue', x: 6, y: 3, w: 6, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Breakdown table
  { i: 'asset-breakdown-table', x: 0, y: 6, w: 12, h: 6, minW: 6, minH: 4 },
];
