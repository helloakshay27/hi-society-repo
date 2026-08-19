// Color palette for the Tickets Dashboard charts (per explicit design direction).
export const TICKETS_CHART_PALETTE = ['#9EC8BA', '#8E7BE0', '#DA7756', '#798C5E', '#EDC488'] as const;

export const getTicketsChartColor = (index: number): string => TICKETS_CHART_PALETTE[index % TICKETS_CHART_PALETTE.length];

// Semantic two-way pairs reused across cards
export const OPEN_COLOR = '#DA7756';
export const CLOSED_COLOR = '#798C5E';
export const REACTIVE_COLOR = '#DA7756';
export const PROACTIVE_COLOR = '#798C5E';
export const ACHIEVED_COLOR = '#798C5E';
export const BREACHED_COLOR = '#EDC488';
export const TAT_ACHIEVED_COLOR = '#DA7756';
export const TAT_BREACHED_COLOR = '#8E7BE0';

// Pie-chart palette (per explicit design direction)
export const PIE_OPEN_COLOR = '#CDCAF5';
export const PIE_CLOSED_COLOR = '#76CDC1';
export const PIE_PROACTIVE_COLOR = '#76CDC1';
export const PIE_REACTIVE_COLOR = '#CDCAF5';
export const PIE_CHART_PALETTE = ['#CDCAF5', '#76CDC1', '#E39090'] as const;
export const getPieChartColor = (index: number): string => PIE_CHART_PALETTE[index % PIE_CHART_PALETTE.length];
