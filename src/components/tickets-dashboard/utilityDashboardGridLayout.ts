import GridLayout from 'react-grid-layout';

/**
 * Utility tab layout — same pattern as Escalation / Visitor:
 * KPI strips (h:3) → pie pairs (w:6) → bar pairs (w:6) / full-width bars (w:12).
 */
export const DEFAULT_UTILITY_GRID_LAYOUT: GridLayout.Layout[] = [
  // Power Consumption KPIs
  { i: 'kpi-power-mains', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-power-solar', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-power-dg', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-diesel', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Water Consumption KPIs
  { i: 'kpi-water-total', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-water-domestic', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-water-flushing', x: 6, y: 3, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-water-irrigation', x: 9, y: 3, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Carbon / Fuel / Energy / Renewable
  { i: 'kpi-water-stp', x: 0, y: 6, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-carbon-scope1', x: 3, y: 6, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-carbon-scope2', x: 6, y: 6, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-fuel', x: 9, y: 6, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-energy-intensity', x: 0, y: 9, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-power-renewable', x: 3, y: 9, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-carbon-total', x: 6, y: 9, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-utility-sites', x: 9, y: 9, w: 3, h: 3, minW: 2, minH: 3, maxH: 3 },
  // Pie pairs (Escalation-style w:6)
  { i: 'pie-power-sources', x: 0, y: 12, w: 6, h: 8, minW: 3, minH: 6 },
  { i: 'pie-water-sources', x: 6, y: 12, w: 6, h: 8, minW: 3, minH: 6 },
  { i: 'pie-renewable-sources', x: 0, y: 20, w: 6, h: 8, minW: 3, minH: 6 },
  { i: 'bar-power', x: 6, y: 20, w: 6, h: 8, minW: 4, minH: 6 },
  // Bar pairs
  { i: 'bar-water', x: 0, y: 28, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'bar-power-top', x: 6, y: 28, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'bar-water-top', x: 0, y: 36, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'bar-dry-segregation', x: 6, y: 36, w: 6, h: 8, minW: 4, minH: 6 },
  // Full-width EV (Visitor-style)
  { i: 'bar-ev-consumption', x: 0, y: 44, w: 12, h: 8, minW: 6, minH: 6 },
];
