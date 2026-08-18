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
