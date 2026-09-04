import { TicketStatusData, TicketCategoryData, TicketAgingMatrix, ResponseTATData, RecentTicket } from '@/services/ticketAnalyticsAPI';

// Sample fallback data used only when the live API returns nothing (e.g. no
// site selected, or empty period) so the dashboard's charts can still be
// previewed. Every card that uses this shows a "Sample data" badge.

export const SAMPLE_TICKET_STATUS: TicketStatusData = {
  overall: { info: 'Sample', total_open: 104, total_closed: 75, total_wip: 18 },
  proactive_reactive: {
    info: 'Sample',
    proactive: { open: 72, closed: 55 },
    reactive: { open: 32, closed: 20 },
  },
};

export const SAMPLE_CATEGORY_DATA: TicketCategoryData[] = [
  { category: 'Leakage', reactive: { Open: 40, Closed: 20 }, proactive: { Open: 12, Closed: 10 } },
  { category: 'Seepage', reactive: { Open: 9, Closed: 4 }, proactive: { Open: 4, Closed: 2 } },
  { category: 'Carpentry', reactive: { Open: 2, Closed: 2 }, proactive: { Open: 6, Closed: 4 } },
  { category: 'Electrical', reactive: { Open: 1, Closed: 1 }, proactive: { Open: 5, Closed: 3 } },
  { category: 'Plumbing', reactive: { Open: 1, Closed: 0 }, proactive: { Open: 4, Closed: 3 } },
  { category: 'Civil', reactive: { Open: 2, Closed: 1 }, proactive: { Open: 2, Closed: 2 } },
  { category: 'AC Not Working', reactive: { Open: 1, Closed: 0 }, proactive: { Open: 0, Closed: 0 } },
  { category: 'Facade', reactive: { Open: 1, Closed: 0 }, proactive: { Open: 0, Closed: 0 } },
  { category: 'No Water', reactive: { Open: 1, Closed: 0 }, proactive: { Open: 0, Closed: 0 } },
  { category: 'Fire', reactive: { Open: 1, Closed: 0 }, proactive: { Open: 0, Closed: 0 } },
  { category: 'Parking', reactive: { Open: 1, Closed: 0 }, proactive: { Open: 0, Closed: 0 } },
];

export const SAMPLE_COMMON_AREA_CATEGORY_DATA: TicketCategoryData[] = [
  { category: 'Leakage', reactive: { Open: 12, Closed: 4 }, proactive: { Open: 1, Closed: 0 } },
  { category: 'Common Area', reactive: { Open: 2, Closed: 1 }, proactive: { Open: 6, Closed: 5 } },
  { category: 'Pest Control', reactive: { Open: 1, Closed: 1 }, proactive: { Open: 0, Closed: 0 } },
  { category: 'Security', reactive: { Open: 1, Closed: 0 }, proactive: { Open: 0, Closed: 0 } },
];

export const SAMPLE_AGEING_MATRIX: TicketAgingMatrix = {
  success: 1,
  message: 'Sample',
  response: {
    matrix: {
      P1: { '0-10': 97, '11-20': 17, '21-30': 55, '31-40': 0, '40+': 0 },
      P2: { '0-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '40+': 0 },
      P3: { '0-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '40+': 0 },
      P4: { '0-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '40+': 0 },
      P5: { '0-10': 5, '11-20': 2, '21-30': 3, '31-40': 0, '40+': 0 },
    },
  },
  average_days: 12,
  info: 'Sample',
};

export const SAMPLE_RESPONSE_TAT: ResponseTATData = {
  success: 1,
  message: 'Sample',
  response: {
    response: { achieved: 78, breached: 93 },
    resolution: { achieved: 23, breached: 75 },
  },
  info: 'Sample',
};

export const SAMPLE_RECENT_TICKETS: Partial<RecentTicket>[] = [
  {
    id: 1,
    ticket_number: 'TCK-10231',
    heading: 'Water leakage near lift lobby',
    category_type: 'Leakage',
    site_name: 'Tower A',
    status: { name: 'Open', color_code: '#E7848E' },
  },
  {
    id: 2,
    ticket_number: 'TCK-10230',
    heading: 'AC not cooling in common area',
    category_type: 'Electrical',
    site_name: 'Tower B',
    status: { name: 'In Progress', color_code: '#EDC488' },
  },
  {
    id: 3,
    ticket_number: 'TCK-10229',
    heading: 'Carpentry work for cabinet hinge',
    category_type: 'Carpentry',
    site_name: 'Tower A',
    status: { name: 'Closed', color_code: '#798C5E' },
  },
  {
    id: 4,
    ticket_number: 'TCK-10228',
    heading: 'Seepage reported on 4th floor',
    category_type: 'Seepage',
    site_name: 'Tower C',
    status: { name: 'Open', color_code: '#E7848E' },
  },
  {
    id: 5,
    ticket_number: 'TCK-10227',
    heading: 'Security gate access card not working',
    category_type: 'Security',
    site_name: 'Tower B',
    status: { name: 'Closed', color_code: '#798C5E' },
  },
];

export const SAMPLE_FM_VS_PROJECT = { fm: 155, project: 24 };

export const SAMPLE_COMPLAINT_MODE = [
  { name: 'App', value: 88 },
  { name: 'Call', value: 52 },
  { name: 'Walk-in', value: 27 },
  { name: 'Email', value: 12 },
];

export const SAMPLE_DELIVERY_VISITORS = [
  { name: 'Blinkit', value: 959 },
  { name: 'Swiggy / Instamart', value: 240 },
  { name: 'Zomato', value: 184 },
  { name: 'Zepto', value: 147 },
  { name: 'Other', value: 88 },
  { name: 'Amazon', value: 59 },
  { name: 'Big Basket', value: 51 },
  { name: 'D Mart', value: 11 },
  { name: 'Flipkart', value: 5 },
  { name: 'Box8', value: 4 },
  { name: 'Myntra', value: 4 },
  { name: "Domino's", value: 3 },
  { name: 'Country Delight', value: 3 },
  { name: 'Grofers', value: 2 },
  { name: 'Urban Clap', value: 2 },
  { name: 'Jio Mart', value: 2 },
  { name: 'Bharat Gas', value: 1 },
];

export const SAMPLE_CHECKLIST = { total: 500, completed: 410, pending: 90 };

/** Sample visitor overview KPIs when live API is empty. */
export const SAMPLE_VISITOR_OVERVIEW = {
  total_visitors: 1284,
  expected_visitors: 912,
  unexpected_visitors: 372,
  total_vehicles: 486,
  goods_inwards: 214,
  goods_outwards: 168,
};

/** Sample building-wise total visitors bar. */
export const SAMPLE_VISITOR_BUILDING_WISE = [
  { name: 'Tower A', value: 420 },
  { name: 'Tower B', value: 310 },
  { name: 'Tower C', value: 265 },
  { name: 'Club House', value: 148 },
  { name: 'Gate 1', value: 91 },
  { name: 'Gate 2', value: 50 },
];

/** Sample goods-in period bar. */
export const SAMPLE_GOODS_IN = [
  { name: 'Week 1', value: 42 },
  { name: 'Week 2', value: 55 },
  { name: 'Week 3', value: 38 },
  { name: 'Week 4', value: 49 },
  { name: 'Week 5', value: 30 },
];

/** Sample goods-out period bar. */
export const SAMPLE_GOODS_OUT = [
  { name: 'Week 1', value: 28 },
  { name: 'Week 2', value: 41 },
  { name: 'Week 3', value: 33 },
  { name: 'Week 4', value: 36 },
  { name: 'Week 5', value: 30 },
];

/** Sample utility overview KPIs from FM Utility Consumption menu. */
export const SAMPLE_UTILITY_OVERVIEW = {
  power_mains_kwh: 18420,
  power_solar_kwh: 3120,
  power_dg_kwh: 860,
  diesel_liters: 420,
  power_renewable_kwh: 3120,
  water_total_kl: 2450,
  water_domestic_kl: 1680,
  water_flushing_kl: 310,
  water_irrigation_kl: 280,
  water_stp_kl: 180,
  carbon_scope1: 42.5,
  carbon_scope2: 118.2,
  fuel_consumption: 420,
  energy_intensity: 0.086,
};

/** Sample cumulative / sub-meter power sources pie. */
export const SAMPLE_POWER_SOURCES = [
  { name: 'HVAC', value: 6200 },
  { name: 'Lighting', value: 4100 },
  { name: 'Common Area', value: 2800 },
  { name: 'Lifts', value: 1900 },
  { name: 'Others', value: 1420 },
];

/** Sample renewable sources pie (Power Top Management). */
export const SAMPLE_RENEWABLE_SOURCES = [
  { name: 'Solar', value: 2100 },
  { name: 'Wind', value: 620 },
  { name: 'Other Renewable', value: 400 },
];

/** Sample water source pie. */
export const SAMPLE_WATER_SOURCES = [
  { name: 'Municipal', value: 980 },
  { name: 'Borewell', value: 720 },
  { name: 'Tanker', value: 410 },
  { name: 'Recycled / STP', value: 340 },
];

/** Sample power consumption bar (site / period). */
export const SAMPLE_POWER_BAR = [
  { name: 'Week 1', value: 4200 },
  { name: 'Week 2', value: 4550 },
  { name: 'Week 3', value: 3980 },
  { name: 'Week 4', value: 4780 },
  { name: 'Week 5', value: 3890 },
];

/** Sample water consumption bar (site / period). */
export const SAMPLE_WATER_BAR = [
  { name: 'Week 1', value: 480 },
  { name: 'Week 2', value: 520 },
  { name: 'Week 3', value: 455 },
  { name: 'Week 4', value: 540 },
  { name: 'Week 5', value: 455 },
];

/** Sample Power Top Management month-wise bar. */
export const SAMPLE_POWER_TOP_BAR = [
  { name: 'Apr', value: 15200 },
  { name: 'May', value: 16840 },
  { name: 'Jun', value: 17420 },
  { name: 'Jul', value: 18110 },
  { name: 'Aug', value: 17650 },
];

/** Sample Water Top Management site-wise bar. */
export const SAMPLE_WATER_TOP_BAR = [
  { name: 'Site A', value: 820 },
  { name: 'Site B', value: 640 },
  { name: 'Site C', value: 510 },
  { name: 'Site D', value: 480 },
];

/** Sample Site Wise Dry Segregation Data. */
export const SAMPLE_DRY_SEGREGATION = [
  { name: 'Site A', value: 62 },
  { name: 'Site B', value: 55 },
  { name: 'Site C', value: 48 },
  { name: 'Site D', value: 71 },
  { name: 'Site E', value: 39 },
];

/** Sample Site Wise EV Consumption. */
export const SAMPLE_EV_CONSUMPTION = [
  { name: 'Site A', value: 320 },
  { name: 'Site B', value: 210 },
  { name: 'Site C', value: 180 },
  { name: 'Site D', value: 145 },
  { name: 'Site E', value: 95 },
];

/** Sample escalation overview (FM Open / Closed / Average ageing) when live API is empty. */
export const SAMPLE_ESCALATION_OVERVIEW = {
  open: 12,
  closed: 8,
  average_ageing: 4.5,
};

/** Sample executive escalation table rows. */
export const SAMPLE_EXECUTIVE_ESCALATION = [
  {
    ticket_number: 'TCK-20451',
    description: 'Water leakage in lobby — escalated to CH',
    community_head: 'Anita Shah',
    category: 'Plumbing',
    sub_category: 'Leakage',
    ticket_status: 'Open',
    created_on: '2026-08-12',
    flat: 'A-1204',
  },
  {
    ticket_number: 'TCK-20422',
    description: 'Lift not working — Tower B',
    community_head: 'Rahul Mehta',
    category: 'Electrical',
    sub_category: 'Lift',
    ticket_status: 'In Progress',
    created_on: '2026-08-10',
    flat: 'B-502',
  },
  {
    ticket_number: 'TCK-20398',
    description: 'Security gate access failure',
    community_head: 'Anita Shah',
    category: 'Security',
    sub_category: 'Access',
    ticket_status: 'Closed',
    created_on: '2026-08-05',
    flat: 'C-301',
  },
];
