import GridLayout from 'react-grid-layout';

/** Default 12-col layout for Checklist tab — four chart-plus-table cards in a 2x2 grid.
 *  Height is kept tight to the chart + a scrollable table so cards don't leave a
 *  large empty band under short tables. */
export const DEFAULT_CHECKLIST_GRID_LAYOUT: GridLayout.Layout[] = [
  { i: 'checklist-technical', x: 0, y: 0, w: 6, h: 9, minW: 4, minH: 7 },
  { i: 'checklist-non-technical', x: 6, y: 0, w: 6, h: 9, minW: 4, minH: 7 },
  { i: 'checklist-top-ten', x: 0, y: 9, w: 6, h: 9, minW: 4, minH: 7 },
  { i: 'checklist-site-wise', x: 6, y: 9, w: 6, h: 9, minW: 4, minH: 7 },
];
