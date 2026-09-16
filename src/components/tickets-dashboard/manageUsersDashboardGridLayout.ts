import GridLayout from 'react-grid-layout';

/**
 * Default 12-col layout for the Manage Users tab.
 *
 * Rows:
 *   1  the four user-status KPI tiles (Total / Pending / Approved / Rejected)
 *   2  App Downloads + Downloads by Resident Type donuts, half width each
 *   3  Downloads by Phase donut, half width
 */
export const DEFAULT_MANAGE_USERS_GRID_LAYOUT: GridLayout.Layout[] = [
  { i: 'kpi-total-users', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-pending-users', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-approved-users', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-rejected-users', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },

  { i: 'pie-app-downloads', x: 0, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'pie-resident-type', x: 6, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'pie-phase', x: 0, y: 11, w: 6, h: 8, minW: 4, minH: 6 },
];
