import { apiClient } from '@/utils/apiClient';
import type { TicketReportDateRange } from './ticketReportsAPI';
import { getDynamicScopeParams } from './reportScopeParams';

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

/** A `[amount, "Label"]` / `["Label", amount]` pair, or `{ value/unit: n }`. */
const pairValue = (entry: unknown): number => {
  if (Array.isArray(entry)) {
    const num = entry.find((v) => typeof v === 'number');
    return toNumber(num ?? entry[0]);
  }
  if (entry && typeof entry === 'object') {
    const row = entry as Record<string, unknown>;
    return toNumber(row.value ?? row.count ?? row.total ?? row.unit ?? row.amount);
  }
  return toNumber(entry);
};

// Keys that are ratios / per-area figures, not additive consumption amounts.
const DERIVED_KEY = /percent|per_sq|persq|ratio|_pct|average|avg/i;

/** Collapses one site's value into a single number:
 *  - `[[amount, "Commodity"], ...]`         -> sum of amounts  (dry-waste)
 *  - `{ ev: n }` / `{ domestic, flushing }` -> sum of `sumKeys`, else sum of
 *    every plain numeric field that isn't a percentage / per-sqft ratio
 *  - scalar                                 -> the number itself */
const siteValue = (value: unknown, sumKeys?: string[]): number => {
  if (Array.isArray(value)) {
    return value.reduce((sum: number, entry) => sum + pairValue(entry), 0);
  }
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    if (sumKeys && sumKeys.length > 0) {
      return sumKeys.reduce((sum, key) => sum + toNumber(row[key]), 0);
    }
    return Object.entries(row).reduce((sum, [key, v]) => {
      if (DERIVED_KEY.test(key)) return sum;
      if (typeof v === 'number') return sum + v;
      if (typeof v === 'string' && v.trim() !== '' && !v.includes('%') && Number.isFinite(Number(v))) {
        return sum + Number(v);
      }
      return sum;
    }, 0);
  }
  return toNumber(value);
};

const normalizeNamedCounts = (
  raw: unknown,
  sumKeys?: string[]
): { name: string; value: number }[] => {
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
    // Site-keyed map — value is a scalar, a `[amount, label]` list, or a
    // `{ dg, solar, main, ... }`-style breakdown object.
    return Object.entries(obj).map(([name, value]) => ({
      name: name.trim(),
      value: siteValue(value, sumKeys),
    }));
  }

  return [];
};

/** Drop empty sites and sort so the biggest contributors lead the bar chart. */
const rankedSiteTotals = (
  raw: unknown,
  sumKeys?: string[]
): { name: string; value: number }[] =>
  normalizeNamedCounts(raw, sumKeys)
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

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

  /** Response: `{ "<site>": { dg, solar, main, consumption_per_sq_feet, *_percentage } }`
   * — bar value is DG + Solar + Mains (the additive amounts, not the ratios). */
  async getPowerBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/card_site_wise_power_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: rankedSiteTotals(data ?? {}, ['dg', 'solar', 'main']),
      info: data?.info,
    };
  },

  /** Response: `{ "<site>": { domestic, flushing, irrigation } }` — bar value is their sum. */
  async getWaterBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/site_wise_water_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: rankedSiteTotals(data ?? {}, ['domestic', 'flushing', 'irrigation']),
      info: data?.info,
    };
  },

  /** energy_kpis carries a renewable breakdown in `response.pie`
   * (`{ Solar, Wind, Hydro }`); fall back to the flat solar/wind/hydro fields,
   * then to a renewable-vs-non-renewable split if neither is present. */
  async getRenewableSources(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/energy_kpis`, { params: buildParams(range) });
    const r = responseOf(data);

    const pie = (r.pie ?? r.renewable_pie ?? r.renewable_sources) as Record<string, unknown> | undefined;
    let response: { name: string; value: number }[] = [];

    if (pie && typeof pie === 'object' && !Array.isArray(pie)) {
      response = Object.entries(pie).map(([name, value]) => ({ name, value: toNumber(value) }));
    } else {
      response = [
        { name: 'Solar', value: pick(r, ['solar', 'solar_kwh', 'power_solar_kwh']) },
        { name: 'Wind', value: pick(r, ['wind', 'wind_kwh']) },
        { name: 'Hydro', value: pick(r, ['hydro', 'hydro_kwh']) },
      ];
    }

    response = response.filter((row) => row.value > 0).sort((a, b) => b.value - a.value);

    if (response.length === 0) {
      const renewable = pick(r, ['renewable_total', 'power_renewable_kwh', 'renewable', 'renewable_kwh']);
      const nonRenewable =
        pick(r, ['power_consumption', 'power_mains_kwh', 'mains', 'mains_kwh']) +
        pick(r, ['dg_total', 'power_dg_kwh', 'dg', 'dg_kwh']);
      response = [
        { name: 'Renewable', value: renewable },
        { name: 'Non-renewable', value: nonRenewable },
      ].filter((row) => row.value > 0);
    }

    return { success: data?.success ?? 1, message: data?.message ?? '', response, info: data?.info };
  },

  // "Top Management" bars use the same site-wise routes as their plain
  // counterparts above — the doc doesn't define a separate top-N variant.
  async getPowerTopBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/card_site_wise_power_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: rankedSiteTotals(data ?? {}, ['dg', 'solar', 'main']),
      info: data?.info,
    };
  },

  async getWaterTopBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/site_wise_water_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: rankedSiteTotals(data ?? {}, ['domestic', 'flushing', 'irrigation']),
      info: data?.info,
    };
  },

  /** Response: `{ "<site>": [[amount, "<commodity>"], ...] }` — bar value sums the commodities. */
  async getDrySegregation(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/site_wise_dry_waste_segregation`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: rankedSiteTotals(data ?? {}),
      info: data?.info,
    };
  },

  /** Response: `{ "<site>": { ev: <kWh> } }`. */
  async getEvConsumption(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/site_wise_ev_consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: rankedSiteTotals(data ?? {}, ['ev']),
      info: data?.info,
    };
  },
};
