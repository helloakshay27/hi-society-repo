import GridLayout from 'react-grid-layout';

/** Default 12-col layout — KPI row uses compact h:3 to match revamp metric cards. */
export const DEFAULT_TICKETS_GRID_LAYOUT: GridLayout.Layout[] = [
  { i: 'kpi-open', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-closed', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-total', x: 8, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'tickets-overview', x: 0, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'proactive-reactive', x: 6, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'unit-category', x: 0, y: 11, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'unit-category-proactive', x: 0, y: 19, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'common-area-category', x: 0, y: 27, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'common-area-category-proactive', x: 6, y: 27, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'ageing-matrix', x: 0, y: 35, w: 12, h: 8, minW: 6, minH: 6 },
  { i: 'response-tat', x: 0, y: 43, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'resolution-tat', x: 6, y: 43, w: 6, h: 8, minW: 4, minH: 6 },
  // fm-vs-project (pie) + complaint-mode (bar) share one row — their previous
  // partners (golden-tickets / delivery-visitors) are disabled on this tab.
  { i: 'fm-vs-project', x: 0, y: 51, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'complaint-mode', x: 6, y: 51, w: 6, h: 8, minW: 4, minH: 6 },
  // Escalation section — folded in from the former Escalation tab, so its four
  // KPI tiles and the executive table sit under the ticket cards.
  { i: 'kpi-open-escalation', x: 0, y: 59, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-close-escalation', x: 3, y: 59, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-average-escalation', x: 6, y: 59, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-total-escalation', x: 9, y: 59, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'executive-escalation', x: 0, y: 62, w: 12, h: 10, minW: 6, minH: 6 },
];
