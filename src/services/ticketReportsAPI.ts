import { apiClient } from '@/utils/apiClient';

// Pms::Manage::TicketsDashboardController — see hi-society-fm-reports-curls.md
const BASE_PATH = '/api-fm-report/hi-society/tickets';

export interface TicketReportFilters {
  site_ids: number[];
  site_names: string[];
  society_ids: number[];
  society_names: string[];
  from_date: string;
  to_date: string;
  of_phase: string | null;
}

export interface TicketOverviewResponse {
  success: number;
  message: string;
  filters: TicketReportFilters;
  response: {
    total_tickets: number;
    ticket_status: { total_open: number; total_closed: number };
    proactive_reactive: {
      proactive: { open: number; closed: number };
      reactive: { open: number; closed: number };
    };
    golden_user_tickets: { open: number; closed: number; total: number };
    tat: {
      response: { achieved: number; breached: number };
      resolution: { achieved: number; breached: number };
    };
    sentiment: { average_rating: number; total_ratings: number };
  };
  info: string;
}

export interface TicketCategoryCounts {
  tickets_category: string[];
  open_tickets: number[];
  closed_tickets: number[];
  total_tickets: number[];
}

export interface TicketCategoryProactiveReactiveRow {
  category: string;
  proactive: { open: number; closed: number };
  reactive: { open: number; closed: number };
}

export interface TicketCategoryBreakdownResponse {
  success: number;
  message: string;
  filters: TicketReportFilters;
  response: {
    unit_category: TicketCategoryCounts;
    unit_category_proactive: TicketCategoryCounts;
    common_area_category: TicketCategoryCounts;
    common_area_category_proactive: TicketCategoryCounts;
    proactive_reactive: TicketCategoryProactiveReactiveRow[];
  };
  info: string;
}

export interface TicketDistributionResponse {
  success: number;
  message: string;
  filters: TicketReportFilters;
  response: {
    by_issue: { issue: string; count: number }[];
    by_mode: { mode: string; count: number }[];
  };
  info: string;
}

export interface TicketPerformanceResponse {
  success: number;
  message: string;
  filters: TicketReportFilters;
  response: {
    ageing: {
      matrix: Record<string, Record<string, number>>;
      average_days: number;
    };
    resolution_tat_by_category: {
      categories: string[];
      breached: number[];
      achieved: number[];
      total: number[];
      percentage_breached: number[];
      percentage_achieved: number[];
    };
    audit_scores: unknown[];
  };
  info: string;
}

export interface TicketTrendsResponse {
  success: number;
  message: string;
  filters: TicketReportFilters;
  response: {
    granularity: 'monthly' | 'daily';
    closed_tickets: { buckets: string[]; counts: number[] };
    sentiment: { date: string; average_rating: number; count: number }[];
  };
  info: string;
}

export type TicketReportPhase = 'pms' | 'post_possession' | 'post_sale' | 'support';

export interface TicketReportDateRange {
  fromDate: Date;
  toDate: Date;
  ofPhase?: TicketReportPhase;
}

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// site_id and society_id are OR'd server-side, so whichever is present in the
// user's current context is enough to scope the report.
const getDynamicScopeParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  const siteId = localStorage.getItem('selectedSiteId');
  const societyId = localStorage.getItem('selectedSocietyId') || localStorage.getItem('selectedUserSociety');
  if (siteId) params.site_id = siteId;
  if (societyId) params.society_id = societyId;
  return params;
};

const buildParams = (
  { fromDate, toDate, ofPhase }: TicketReportDateRange,
  extra?: Record<string, string>
): Record<string, string> => ({
  ...getDynamicScopeParams(),
  from_date: formatDateForAPI(fromDate),
  to_date: formatDateForAPI(toDate),
  ...(ofPhase ? { of_phase: ofPhase } : {}),
  ...extra,
});

export const ticketReportsAPI = {
  async getOverview(range: TicketReportDateRange): Promise<TicketOverviewResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/overview`, { params: buildParams(range) });
    return data;
  },

  async getCategoryBreakdown(range: TicketReportDateRange): Promise<TicketCategoryBreakdownResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/category-breakdown`, { params: buildParams(range) });
    return data;
  },

  async getDistribution(range: TicketReportDateRange): Promise<TicketDistributionResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/distribution`, { params: buildParams(range) });
    return data;
  },

  async getPerformance(range: TicketReportDateRange): Promise<TicketPerformanceResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/performance`, { params: buildParams(range) });
    return data;
  },

  async getTrends(range: TicketReportDateRange, granularity: 'monthly' | 'daily' = 'monthly'): Promise<TicketTrendsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/trends`, { params: buildParams(range, { granularity }) });
    return data;
  },
};
