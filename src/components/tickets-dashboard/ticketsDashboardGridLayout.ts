import GridLayout from 'react-grid-layout';

/** Default 12-col layout for every card on the Tickets Dashboard. */
export const DEFAULT_TICKETS_GRID_LAYOUT: GridLayout.Layout[] = [
  { i: 'kpi-open', x: 0, y: 0, w: 4, h: 6, minW: 2, minH: 6 },
  { i: 'kpi-closed', x: 4, y: 0, w: 4, h: 6, minW: 2, minH: 6 },
  { i: 'kpi-total', x: 8, y: 0, w: 4, h: 6, minW: 2, minH: 6 },
  { i: 'tickets-overview', x: 0, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'proactive-reactive', x: 6, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'activity-feed', x: 0, y: 14, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'unit-category', x: 0, y: 22, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'unit-category-proactive', x: 0, y: 30, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'common-area-category', x: 0, y: 38, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'common-area-category-proactive', x: 6, y: 38, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'ageing-matrix', x: 0, y: 46, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'response-tat', x: 0, y: 54, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'resolution-tat', x: 6, y: 54, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'fm-vs-project', x: 0, y: 62, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'golden-tickets', x: 6, y: 62, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'complaint-mode', x: 0, y: 70, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'delivery-visitors', x: 6, y: 70, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'checklist', x: 0, y: 78, w: 12, h: 8, minW: 6, minH: 6 },
];