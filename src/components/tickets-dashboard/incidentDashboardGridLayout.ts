import GridLayout from 'react-grid-layout';

/** Default 12-col layout for Incident tab — KPI strip (including the legacy
 *  LTIR / Safe Man Hours / Near Miss cards) + charts + RCA table + body map. */
export const DEFAULT_INCIDENT_GRID_LAYOUT: GridLayout.Layout[] = [
  // Row 1 — 4 tiles
  { i: 'kpi-total-incidents', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-open', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-under-investigation', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-closed', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Row 2 — 3 tiles
  { i: 'kpi-zero-incident-days', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-incident-rate', x: 4, y: 3, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-ltir', x: 8, y: 3, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Row 3 — legacy cards that ignore the date range
  { i: 'kpi-safe-man-hours', x: 0, y: 6, w: 6, h: 3, minW: 3, minH: 3, maxH: 3 },
  { i: 'kpi-near-miss', x: 6, y: 6, w: 6, h: 3, minW: 3, minH: 3, maxH: 3 },
  // Charts
  { i: 'pie-category-wise', x: 0, y: 9, w: 6, h: 6, minW: 4, minH: 5 },
  { i: 'pie-status-distribution', x: 6, y: 9, w: 6, h: 6, minW: 4, minH: 5 },
  { i: 'bar-level-wise', x: 0, y: 15, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'bar-cause-wise', x: 0, y: 23, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'bar-service-partner', x: 6, y: 23, w: 6, h: 8, minW: 4, minH: 6 },
  // Tables / map
  { i: 'rca-table', x: 0, y: 31, w: 12, h: 10, minW: 6, minH: 7 },
  // Height is sized to the figure + its percentage tiles; anything taller leaves a
  // large empty band under the chart since the SVG is width-capped.
  { i: 'body-injury-map', x: 0, y: 41, w: 12, h: 10, minW: 6, minH: 7 },
];
