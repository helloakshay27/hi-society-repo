import GridLayout from 'react-grid-layout';

/** Default 12-col layout for Escalation tab — compact KPI row like dashboard-revamp. */
export const DEFAULT_ESCALATION_GRID_LAYOUT: GridLayout.Layout[] = [
  { i: 'kpi-open-escalation', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
  { i: 'kpi-close-escalation', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
  { i: 'kpi-average-escalation', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
  { i: 'kpi-total-escalation', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
  { i: 'open-escalation', x: 0, y: 3, w: 6, h: 8, minW: 3, minH: 6 },
  { i: 'close-escalation', x: 6, y: 3, w: 6, h: 8, minW: 3, minH: 6 },
  { i: 'average-escalation', x: 0, y: 11, w: 6, h: 8, minW: 3, minH: 6 },
  { i: 'executive-escalation-pie', x: 6, y: 11, w: 6, h: 8, minW: 3, minH: 6 },
  { i: 'executive-escalation', x: 0, y: 19, w: 12, h: 10, minW: 6, minH: 6 },
];
