import GridLayout from 'react-grid-layout';

/** Default 12-col layout for Checklist tab — the four FM Matrix `/maintenance/task`
 *  analytics charts in a 2x2 grid, each a stacked bar chart over a scrollable table.
 *  Height fits the chart + legend + a few table rows without leaving a large empty
 *  band under short tables. */
export const DEFAULT_CHECKLIST_GRID_LAYOUT: GridLayout.Layout[] = [
  { i: 'checklist-technical', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
  { i: 'checklist-non-technical', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
  { i: 'checklist-top-ten', x: 0, y: 10, w: 6, h: 10, minW: 4, minH: 8 },
  { i: 'checklist-site-wise', x: 6, y: 10, w: 6, h: 10, minW: 4, minH: 8 },
];
