import { apiClient } from '@/utils/apiClient';
import type { TicketReportDateRange } from './ticketReportsAPI';

// Per FM-HI-SOCIETY-DASHBOARD-APIS.md § 4 "Utility". Unlike Visitors/Escalation,
// Utility has no single "overview"/"kpi" endpoint that covers every field the
// dashboard's KPI tiles need — the real routes are split across Energy and
// Water sub-modules (none of the current KPI tiles are waste-related, so
// waste_kpis isn't part of the overview merge below):
//   GET /utility/energy_kpis                        -> no scope/dates required
//   GET /utility/water_kpis                          -> no scope/dates required
//   GET /utility/card_energy_intensity               -> site_id + dates REQUIRED (+ optional society_id)
//   GET /utility/card_fuel_consumption               -> site_id + dates REQUIRED
//   GET /utility/carbon_emission_scopes              -> site_id + dates REQUIRED
//   GET /utility/card_site_wise_power_consumption    -> site_id + dates REQUIRED
//   GET /utility/site_wise_water_consumption         -> no scope/dates required (site_id/type optional)
//   GET /utility/site_wise_dry_waste_segregation     -> no scope/dates required
//   GET /utility/site_wise_ev_consumption            -> site_id + dates REQUIRED
//   GET /utility/water_source                        -> no scope/dates required
// getOverview() below fans out to the five KPI-bearing routes (energy, water,
// energy intensity, fuel, carbon scopes) and merges them into the flat shape
// the dashboard's KPI tiles already expect. The four "REQUIRED" routes above
// return a `{success:0,...}` error when no site is in scope (see
// getDynamicScopeParams) — that's treated as zero, same as any other empty
// response. There is no dedicated "power sources"/"renewable sources"
// breakdown route, so those two pie metrics are derived client-side from
// energy_kpis instead (see getPowerSources/getRenewableSources).
const BASE_PATH = '/api-fm-report/hi-society/utility';

export interface UtilityOverviewResponse {
  success: number;
  message: string;
  response: {
    power_mains_kwh: number;
    power_solar_kwh: number;
    power_dg_kwh: number;
    diesel_liters: number;
    power_renewable_kwh: number;
    water_total_kl: number;
    water_domestic_kl: number;
    water_flushing_kl: number;
    water_irrigation_kl: number;
    water_stp_kl: number;
    carbon_scope1: number;
    carbon_scope2: number;
    fuel_consumption: number;
    energy_intensity: number;
  };
  info?: string;
}

export interface UtilityNamedCountsResponse {
  success: number;
  message: string;
  response: { name: string; value: number }[];
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

/** Unwraps the `{ response: {...} }` envelope every endpoint in this doc uses. */
const responseOf = (raw: unknown): Record<string, unknown> => {
  const payload = (raw ?? {}) as Record<string, unknown>;
  return (payload.response ?? payload) as Record<string, unknown>;
};

/** Reads the first present key from a list of aliases — exact field names for
 * these endpoints aren't documented beyond prose descriptions, so this tries
 * the documented vocabulary plus a few common variants. */
const pick = (obj: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') return toNumber(value);
  }
  return 0;
};

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

export const utilityReportsAPI = {
  /** Fans out to the five real KPI-bearing routes and merges them into the
   * flat shape the dashboard's KPI tiles expect (see BASE_PATH comment above). */
  async getOverview(range: TicketReportDateRange): Promise<UtilityOverviewResponse> {
    const params = buildParams(range);
    const [energy, water, intensity, fuel, carbon] = await Promise.allSettled([
      apiClient.get(`${BASE_PATH}/energy_kpis`, { params }),
      apiClient.get(`${BASE_PATH}/water_kpis`, { params }),
      apiClient.get(`${BASE_PATH}/card_energy_intensity`, { params }),
      apiClient.get(`${BASE_PATH}/card_fuel_consumption`, { params }),
      apiClient.get(`${BASE_PATH}/carbon_emission_scopes`, { params }),
    ]);

    const dataOf = (result: PromiseSettledResult<{ data: unknown }>) =>
      result.status === 'fulfilled' ? responseOf(result.value.data) : {};

    const energyData = dataOf(energy);
    const waterData = dataOf(water);
    const intensityData = dataOf(intensity);
    const fuelData = dataOf(fuel);
    const carbonData = dataOf(carbon);

    const response: UtilityOverviewResponse['response'] = {
      power_mains_kwh: pick(energyData, ['power_mains_kwh', 'mains', 'mains_kwh', 'total_consumption']),
      power_solar_kwh: pick(energyData, ['power_solar_kwh', 'solar', 'solar_kwh', 'solar_total']),
      power_dg_kwh: pick(energyData, ['power_dg_kwh', 'dg', 'dg_kwh', 'dg_total']),
      diesel_liters: pick(energyData, ['diesel_liters', 'diesel', 'diesel_consumed', 'diesel_consumption']),
      power_renewable_kwh: pick(energyData, ['power_renewable_kwh', 'renewable', 'renewable_kwh', 'total_renewable']),
      water_total_kl: pick(waterData, ['water_total_kl', 'total', 'total_kl', 'total_water']),
      water_domestic_kl: pick(waterData, ['water_domestic_kl', 'domestic', 'domestic_kl']),
      water_flushing_kl: pick(waterData, ['water_flushing_kl', 'flushing', 'flushing_kl']),
      water_irrigation_kl: pick(waterData, ['water_irrigation_kl', 'irrigation', 'irrigation_kl']),
      water_stp_kl: pick(waterData, ['water_stp_kl', 'stp', 'stp_kl']),
      carbon_scope1: pick(carbonData, ['carbon_scope1', 'scope1', 'scope_1']),
      carbon_scope2: pick(carbonData, ['carbon_scope2', 'scope2', 'scope_2']),
      fuel_consumption: pick(fuelData, ['fuel_consumption', 'fuel', 'value', 'total']),
      energy_intensity: pick(intensityData, ['energy_intensity', 'value', 'intensity']),
    };

    return { success: 1, message: '', response };
  },

  /** No dedicated "power sources" breakdown route exists — derived client-side
   * from energy_kpis' mains/solar/DG fields instead. */
  async getPowerSources(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/energy_kpis`, { params: buildParams(range) });
    const r = responseOf(data);
    const response = [
      { name: 'Mains', value: pick(r, ['power_mains_kwh', 'mains', 'mains_kwh']) },
      { name: 'Solar', value: pick(r, ['power_solar_kwh', 'solar', 'solar_kwh']) },
      { name: 'DG', value: pick(r, ['power_dg_kwh', 'dg', 'dg_kwh']) },
    ].filter((row) => row.value > 0);
    return { success: data?.success ?? 1, message: data?.message ?? '', response, info: data?.info };
  },

  async getWaterSources(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/water_source`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getPowerBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/card_site_wise_power_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getWaterBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/site_wise_water_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  /** No dedicated "renewable sources" breakdown route exists — derived
   * client-side from energy_kpis (renewable vs. mains+DG) instead. */
  async getRenewableSources(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/energy_kpis`, { params: buildParams(range) });
    const r = responseOf(data);
    const renewable = pick(r, ['power_renewable_kwh', 'renewable', 'renewable_kwh']);
    const nonRenewable =
      pick(r, ['power_mains_kwh', 'mains', 'mains_kwh']) + pick(r, ['power_dg_kwh', 'dg', 'dg_kwh']);
    const response = [
      { name: 'Renewable', value: renewable },
      { name: 'Non-renewable', value: nonRenewable },
    ].filter((row) => row.value > 0);
    return { success: data?.success ?? 1, message: data?.message ?? '', response, info: data?.info };
  },

  // "Top Management" bars use the same site-wise routes as their plain
  // counterparts above — the doc doesn't define a separate top-N variant.
  async getPowerTopBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/card_site_wise_power_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getWaterTopBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/site_wise_water_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getDrySegregation(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/site_wise_dry_waste_segregation`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getEvConsumption(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/site_wise_ev_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },
};
