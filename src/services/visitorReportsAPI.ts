import { apiClient } from '@/utils/apiClient';
import type { TicketReportDateRange } from './ticketReportsAPI';

// Per FM-HI-SOCIETY-DASHBOARD-APIS.md § 1 "Visitors", the backend only exposes
// two routes:
//   GET /api-fm-report/hi-society/visitors/kpis       -> overview KPI totals
//   GET /api-fm-report/hi-society/visitors/staff_kpi   -> staff-specific KPIs
// There is NO documented per-building / goods-in / goods-out / delivery
// breakdown route, so getBuildingWise/getGoodsIn/getGoodsOut/getDelivery below
// have no real endpoint to call — they're left pointing at their previous
// (already non-existent) paths and will keep falling back to sample data via
// the card components, same as before this fix. See getStaffKpi for the one
// extra route the doc does provide that isn't wired into any card yet.
const BASE_PATH = '/api-fm-report/hi-society/visitors';

export interface VisitorOverviewResponse {
  success: number;
  message: string;
  response: {
    total_visitors: number;
    expected_visitors: number;
    unexpected_visitors: number;
    total_vehicles: number;
    goods_inwards: number;
    goods_outwards: number;
  };
  info?: string;
}

export interface VisitorNamedCountsResponse {
  success: number;
  message: string;
  response: { name: string; value: number }[];
  info?: string;
}

/** GET /visitors/staff_kpi — shape isn't documented beyond "staff KPIs", so
 * this is left as a passthrough of whatever the backend returns. */
export interface VisitorStaffKpiResponse {
  success: number;
  message: string;
  response: Record<string, unknown>;
  info?: string;
}

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDynamicScopeParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  const siteId = localStorage.getItem('selectedSiteId');
  const societyId = localStorage.getItem('selectedSocietyId') || localStorage.getItem('selectedUserSociety');
  if (siteId) params.site_id = siteId;
  if (societyId) params.society_id = societyId;
  return params;
};

const buildParams = ({ fromDate, toDate }: TicketReportDateRange): Record<string, string> => ({
  ...getDynamicScopeParams(),
  from_date: formatDateForAPI(fromDate),
  to_date: formatDateForAPI(toDate),
});

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeOverview = (raw: Record<string, unknown>): VisitorOverviewResponse['response'] => {
  const response = (raw.response ?? raw) as Record<string, unknown>;
  return {
    total_visitors: toNumber(response.total_visitors ?? response.totalVisitors),
    expected_visitors: toNumber(response.expected_visitors ?? response.expectedVisitors),
    unexpected_visitors: toNumber(response.unexpected_visitors ?? response.unexpectedVisitors),
    total_vehicles: toNumber(response.total_vehicles ?? response.totalVehicle ?? response.totalVehicles),
    goods_inwards: toNumber(response.goods_inwards ?? response.goodsInwards),
    goods_outwards: toNumber(response.goods_outwards ?? response.outwards ?? response.goodsOutwards),
  };
};

/** Accepts FM-style `{ "Label": 12 }` maps, or `{ name, value }[]`, or `{ labels, values }`. */
const normalizeNamedCounts = (raw: unknown): { name: string; value: number }[] => {
  const payload = raw as Record<string, unknown>;
  const response = payload?.response ?? payload;

  if (Array.isArray(response)) {
    return response.map((item) => {
      if (Array.isArray(item)) {
        return { name: String(item[0] ?? '—'), value: toNumber(item[1]) };
      }
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        name: String(row.name ?? row.label ?? row.category ?? '—'),
        value: toNumber(row.value ?? row.count ?? row.total),
      };
    });
  }

  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.labels) && Array.isArray(obj.values)) {
      return obj.labels.map((label, i) => ({
        name: String(label),
        value: toNumber((obj.values as unknown[])[i]),
      }));
    }
    return Object.entries(obj).map(([name, value]) => ({ name, value: toNumber(value) }));
  }

  return [];
};

export const visitorReportsAPI = {
  async getOverview(range: TicketReportDateRange): Promise<VisitorOverviewResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/kpis`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeOverview(data ?? {}),
      info: data?.info,
    };
  },

  /** GET /visitors/staff_kpi — documented but not wired into any card yet. */
  async getStaffKpi(range: TicketReportDateRange): Promise<VisitorStaffKpiResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/staff_kpi`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: (data?.response ?? data ?? {}) as Record<string, unknown>,
      info: data?.info,
    };
  },

  // NOT AVAILABLE per FM-HI-SOCIETY-DASHBOARD-APIS.md — no per-building/goods/
  // delivery breakdown route exists for Visitors. Kept calling this (non-existent)
  // path so the card's existing sample-data fallback keeps working unchanged.
  async getBuildingWise(range: TicketReportDateRange): Promise<VisitorNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/building-wise`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  // NOT AVAILABLE per the doc — same as getBuildingWise above.
  async getGoodsIn(range: TicketReportDateRange): Promise<VisitorNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/goods-in`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  // NOT AVAILABLE per the doc — same as getBuildingWise above.
  async getGoodsOut(range: TicketReportDateRange): Promise<VisitorNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/goods-out`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  // NOT AVAILABLE per the doc — same as getBuildingWise above.
  async getDelivery(range: TicketReportDateRange): Promise<VisitorNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/delivery`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },
};
