import GridLayout from 'react-grid-layout';

/** Checklist tab — status totals from `/api-fm-report/hi-society/checklist/summary`.
 *  Four KPI tiles, then the same buckets as a donut and a bar chart. */
export const DEFAULT_CHECKLIST_GRID_LAYOUT: GridLayout.Layout[] = [
  { i: 'kpi-checklist-closed', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-checklist-open', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-checklist-wip', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-checklist-overdue', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'checklist-status', x: 0, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'checklist-status-bars', x: 6, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
];
