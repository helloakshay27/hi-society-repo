import { apiClient } from '@/utils/apiClient';
import { getDynamicScopeParams } from './reportScopeParams';
import { saveReportDownload } from './reportDownload';

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

/** The five `export=` values the controller accepts. */
export type TicketExportType =
  | 'ageing'
  | 'unit_category'
  | 'resolution_tat'
  | 'response_tat'
  | 'proactive_reactive'
  // Added per "new download api for ticket and visitor for hisociety.md".
  | 'unit_category_proactive'
  | 'common_area_category'
  | 'common_area_category_proactive'
  | 'fm_vs_project'
  | 'complaint_mode';

/**
 * `path` is the chart endpoint each export's card already reads, per the doc's
 * "call it on whichever endpoint's chart the download button lives next to".
 * `<stamp>` in the filename is replaced with the selected date range.
 */
const TICKET_EXPORTS: Record<TicketExportType, { path: string; filename: string }> = {
  ageing: { path: 'performance', filename: 'FM_ageingMatrix_<stamp>.xlsx' },
  unit_category: { path: 'category-breakdown', filename: 'FM_CategoryWiseTicket_<stamp>.xlsx' },
  resolution_tat: { path: 'overview', filename: 'FM_Resolution_TAT_Details_<stamp>.xlsx' },
  response_tat: {
    path: 'overview',
    filename: 'FM_chart_response_resolution_TAT_<stamp>.xlsx',
  },
  proactive_reactive: {
    path: 'overview',
    filename: 'tickets_proactive_reactive_<stamp>.csv',
  },
  unit_category_proactive: {
    path: 'category-breakdown',
    filename: 'FM_UnitCategoryWiseProactiveTicket_<stamp>.xlsx',
  },
  common_area_category: {
    path: 'category-breakdown',
    filename: 'FM_CommonAreaCategoryWiseTicket_<stamp>.xlsx',
  },
  common_area_category_proactive: {
    path: 'category-breakdown',
    filename: 'FM_CommonAreaCategoryWiseProactiveTicket_<stamp>.xlsx',
  },
  fm_vs_project: { path: 'overview', filename: 'FM_FmVsProjectTicket_<stamp>.xlsx' },
  complaint_mode: { path: 'distribution', filename: 'FM_ComplaintModeTicket_<stamp>.xlsx' },
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

  /**
   * Per-card export. Adding `export=<type>` to any of the five chart endpoints
   * makes it return a file instead of JSON — the export type is decided purely by
   * the param, not the route, so each entry below calls the endpoint that already
   * feeds the card the button sits on (see "ticket and visitor download api.md").
   */
  async downloadExport(range: TicketReportDateRange, exportType: TicketExportType): Promise<void> {
    const { path, filename } = TICKET_EXPORTS[exportType];
    const stamp = `${formatDateForAPI(range.fromDate)}_to_${formatDateForAPI(range.toDate)}`;

    await saveReportDownload(
      apiClient.get(`${BASE_PATH}/${path}`, {
        params: buildParams(range, { export: exportType }),
        responseType: 'blob',
      }),
      filename.replace('<stamp>', stamp)
    );
  },
};
