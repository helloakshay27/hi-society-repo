import GridLayout from 'react-grid-layout';

/** Default 12-col layout — KPI row uses compact h:3 to match revamp metric cards. */
export const DEFAULT_TICKETS_GRID_LAYOUT: GridLayout.Layout[] = [
  { i: 'kpi-open', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-closed', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-total', x: 8, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'tickets-overview', x: 0, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'proactive-reactive', x: 6, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'activity-feed', x: 0, y: 11, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'unit-category', x: 0, y: 19, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'unit-category-proactive', x: 0, y: 27, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'common-area-category', x: 0, y: 35, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'common-area-category-proactive', x: 6, y: 35, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'ageing-matrix', x: 0, y: 43, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'response-tat', x: 0, y: 51, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'resolution-tat', x: 6, y: 51, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'fm-vs-project', x: 0, y: 59, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'golden-tickets', x: 6, y: 59, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'complaint-mode', x: 0, y: 67, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'delivery-visitors', x: 6, y: 67, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'checklist', x: 0, y: 75, w: 12, h: 8, minW: 6, minH: 6 },
];
