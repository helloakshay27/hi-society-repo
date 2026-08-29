import { apiClient } from '@/utils/apiClient';
import type { TicketReportDateRange } from './ticketReportsAPI';

// Mirrors FM user-dashboard Utility Consumption menu:
// Power / Power Top Management / Water / Water Top Management /
// Energy Intensity / Carbon Emission / Fuel Consumption /
// Site Wise Dry Segregation / Site Wise EV Consumption
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

const normalizeOverview = (raw: Record<string, unknown>): UtilityOverviewResponse['response'] => {
  const response = (raw.response ?? raw) as Record<string, unknown>;
  return {
    power_mains_kwh: toNumber(response.power_mains_kwh ?? response.mains ?? response.total_consumption),
    power_solar_kwh: toNumber(response.power_solar_kwh ?? response.solar ?? response.transformer_total),
    power_dg_kwh: toNumber(response.power_dg_kwh ?? response.dg ?? response.dg_total),
    diesel_liters: toNumber(response.diesel_liters ?? response.diesel ?? response.diesel_consumed),
    power_renewable_kwh: toNumber(response.power_renewable_kwh ?? response.renewable ?? response.total_renewable),
    water_total_kl: toNumber(response.water_total_kl ?? response.water_total ?? response.total_water),
    water_domestic_kl: toNumber(response.water_domestic_kl ?? response.domestic),
    water_flushing_kl: toNumber(response.water_flushing_kl ?? response.flushing),
    water_irrigation_kl: toNumber(response.water_irrigation_kl ?? response.irrigation),
    water_stp_kl: toNumber(response.water_stp_kl ?? response.stp),
    carbon_scope1: toNumber(response.carbon_scope1 ?? response.scope1),
    carbon_scope2: toNumber(response.carbon_scope2 ?? response.scope2),
    fuel_consumption: toNumber(response.fuel_consumption ?? response.fuel),
    energy_intensity: toNumber(response.energy_intensity ?? response.energyIntensity),
  };
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
  async getOverview(range: TicketReportDateRange): Promise<UtilityOverviewResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/overview`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeOverview(data ?? {}),
      info: data?.info,
    };
  },

  async getPowerSources(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/power-sources`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getWaterSources(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/water-sources`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getPowerBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/power-bar`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getWaterBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/water-bar`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getRenewableSources(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/renewable-sources`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getPowerTopBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/power-top-bar`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getWaterTopBar(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/water-top-bar`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getDrySegregation(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/dry-segregation`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getEvConsumption(range: TicketReportDateRange): Promise<UtilityNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/ev-consumption`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },
};
