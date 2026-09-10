import GridLayout from 'react-grid-layout';

/**
 * Default 12-col layout for the Assets tab, mirroring the FM Matrix
 * `/maintenance/asset` Analytics tab: a KPI strip first, then the charts.
 *
 * Rows:
 *   1-2  six KPI tiles (Total / In Use / Breakdown / Critical / PPM / AMC)
 *   3    Asset Status + Asset Type Distribution donuts, half width each
 *   4    Category-wise donut + Group-wise bar chart, half width each
 */
export const DEFAULT_ASSET_GRID_LAYOUT: GridLayout.Layout[] = [
  // KPI strip — row 1
  { i: 'kpi-total-assets', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-assets-in-use', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-assets-in-breakdown', x: 8, y: 0, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  // KPI strip — row 2
  { i: 'kpi-critical-breakdown', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-ppm-conduct', x: 4, y: 3, w: 4, h: 3, minW: 2, minH: 3, maxH: 3 },
  { i: 'kpi-amc-assets', x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 3, maxH: 3 },
  // Donuts
  { i: 'pie-asset-status', x: 0, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'pie-asset-type-distribution', x: 6, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
  // Category donut + group bar
  { i: 'pie-asset-category-wise', x: 0, y: 14, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'bar-asset-group-wise', x: 6, y: 14, w: 6, h: 8, minW: 4, minH: 6 },
];
