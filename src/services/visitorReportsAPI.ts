import { apiClient } from '@/utils/apiClient';
import type { TicketReportDateRange } from './ticketReportsAPI';
import { getDynamicScopeParams } from './reportScopeParams';
import { saveReportDownload } from './reportDownload';

// Per FM-HI-SOCIETY-DASHBOARD-APIS.md § 1 "Visitors", the backend only exposes
// two routes:
//   GET /api-fm-report/hi-society/visitors/kpis       -> overview KPI totals
//   GET /api-fm-report/hi-society/visitors/staff_kpi   -> staff-specific KPIs
//
// The /kpis payload (camelCase) is:
//   { totalVisitors, expectedVisitors, unexpectedVisitors, totalGatePass,
//     totalVehicle, returnable_gatePass, non_returnable_gatePass,
//     delivery_visitors: { "<provider>": <count>, ... } }
// So the delivery-partner split ships *inside* /kpis — there is no separate
// /delivery route (getDelivery below reads it back out of /kpis). There is
// still no per-building / goods-in / goods-out breakdown route, so those
// bars were dropped from the Visitor tab. See getStaffKpi for the one extra
// documented route.
const BASE_PATH = '/api-fm-report/hi-society/visitors';

export interface VisitorOverviewResponse {
  success: number;
  message: string;
  response: {
    total_visitors: number;
    expected_visitors: number;
    unexpected_visitors: number;
    total_vehicles: number;
    total_gate_pass: number;
    returnable_gate_pass: number;
    non_returnable_gate_pass: number;
    /** Delivery-partner visit split, from the `delivery_visitors` map in /kpis. */
    delivery_visitors: { name: string; value: number }[];
  };
  info?: string;
}

export interface VisitorNamedCountsResponse {
  success: number;
  message: string;
  response: { name: string; value: number }[];
  info?: string;
}

/** GET /visitors/staff_kpi — `{ total_staff, staff_in, staff_out }`.
 * total_staff is a headcount (not date-filtered); staff_in / staff_out are
 * distinct staff with a gate entry / a matched entry+exit in the range. */
export interface VisitorStaffKpiResponse {
  success: number;
  message: string;
  response: {
    total_staff: number;
    staff_in: number;
    staff_out: number;
  };
  info?: string;
}

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    total_gate_pass: toNumber(response.total_gate_pass ?? response.totalGatePass),
    returnable_gate_pass: toNumber(response.returnable_gate_pass ?? response.returnable_gatePass),
    non_returnable_gate_pass: toNumber(
      response.non_returnable_gate_pass ?? response.non_returnable_gatePass
    ),
    delivery_visitors: normalizeNamedCounts(
      response.delivery_visitors ?? response.deliveryVisitors ?? []
    ),
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

  /** GET /visitors/staff_kpi — Total / In / Out staff headcounts. */
  async getStaffKpi(range: TicketReportDateRange): Promise<VisitorStaffKpiResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/staff_kpi`, { params: buildParams(range) });
    const r = (data?.response ?? data ?? {}) as Record<string, unknown>;
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: {
        total_staff: toNumber(r.total_staff ?? r.totalStaff),
        staff_in: toNumber(r.staff_in ?? r.staffIn ?? r.in),
        staff_out: toNumber(r.staff_out ?? r.staffOut ?? r.out),
      },
      info: data?.info,
    };
  },

  /** Delivery-partner visit split — comes from the `delivery_visitors` map on /kpis. */
  async getDelivery(range: TicketReportDateRange): Promise<VisitorNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/kpis`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeOverview(data ?? {}).delivery_visitors,
      info: data?.info,
    };
  },

  /**
   * `kpis?export=true` — the module's only export (staff_kpi has no download).
   * `from_date` / `to_date` are mandatory here (the JSON call tolerates their
   * absence, the export 422s without them); `buildParams` always sends both.
   * Note the file has one extra row per additional visitor, so its row count is
   * higher than the visitor totals shown on the KPI tiles.
   */
  async downloadKpisExport(range: TicketReportDateRange): Promise<void> {
    await saveReportDownload(
      apiClient.get(`${BASE_PATH}/kpis`, {
        params: { ...buildParams(range), export: 'true' },
        responseType: 'blob',
      }),
      `FM_card_visitors_${formatDateForAPI(range.fromDate)}_to_${formatDateForAPI(range.toDate)}.xlsx`
    );
  },
};
