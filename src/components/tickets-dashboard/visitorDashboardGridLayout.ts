import GridLayout from 'react-grid-layout';

/** Default 12-col layout for Visitor tab — two-row KPI strip + charts. */
export const DEFAULT_VISITOR_GRID_LAYOUT: GridLayout.Layout[] = [
  // Row 1: Total, Expected, Unexpected Visitors
  { i: 'kpi-total-visitors', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-expected-visitors', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-unexpected-visitors', x: 8, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Row 2: Total Vehicles, Total Gate Pass, Returnable Gate Pass
  { i: 'kpi-total-vehicles', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-total-gate-pass', x: 4, y: 3, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-returnable-gate-pass', x: 8, y: 3, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Row 3: Staff In, Staff Out
  { i: 'kpi-staff-in', x: 0, y: 6, w: 6, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-staff-out', x: 6, y: 6, w: 6, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Charts — two half-width donuts fill the full row
  { i: 'pie-expected-unexpected', x: 0, y: 9, w: 6, h: 6, minW: 4, minH: 5 },
  { i: 'pie-gate-pass', x: 6, y: 9, w: 6, h: 6, minW: 4, minH: 5 },
  { i: 'bar-delivery-visitors', x: 0, y: 15, w: 12, h: 8, minW: 6, minH: 6 },
];
