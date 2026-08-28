import GridLayout from 'react-grid-layout';

/** Default 12-col layout for Visitor tab — single KPI strip matching Tickets / Escalation. */
export const DEFAULT_VISITOR_GRID_LAYOUT: GridLayout.Layout[] = [
  { i: 'kpi-total-visitors', x: 0, y: 0, w: 2, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-expected-visitors', x: 2, y: 0, w: 2, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-unexpected-visitors', x: 4, y: 0, w: 2, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-total-vehicles', x: 6, y: 0, w: 2, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-goods-inwards', x: 8, y: 0, w: 2, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-goods-outwards', x: 10, y: 0, w: 2, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'pie-expected-unexpected', x: 0, y: 3, w: 4, h: 8, minW: 3, minH: 6 },
  { i: 'pie-goods-in-out', x: 4, y: 3, w: 4, h: 8, minW: 3, minH: 6 },
  { i: 'pie-delivery-visitors', x: 8, y: 3, w: 4, h: 8, minW: 3, minH: 6 },
  { i: 'bar-total-visitors', x: 0, y: 11, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'bar-goods-in', x: 0, y: 19, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'bar-goods-out', x: 6, y: 19, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'bar-delivery-visitors', x: 0, y: 27, w: 12, h: 8, minW: 6, minH: 6 },
];
