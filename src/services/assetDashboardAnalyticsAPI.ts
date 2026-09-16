import { API_CONFIG } from '@/config/apiConfig';

/**
 * Asset analytics for the Hi-Society Dashboard's Assets tab (`/hi-society-dashboard`).
 *
 * Ported from the FM Matrix `/maintenance/asset` → Analytics tab
 * (`src/services/assetAnalyticsAPI.ts` + `assetAnalyticsDownloadAPI.ts` in that repo).
 * Every chart on that tab is served by ONE endpoint, `/pms/assets/assets_statistics.json`,
 * switched by boolean query flags:
 *   total_assets / assets_in_use / assets_in_breakdown /
 *   critical_assets_breakdown / ppm_overdue_assets / amc_assets  -> KPI numbers
 *   assets_status=true                                           -> in use / breakdown / store / disposed
 *   assets_distribution=true                                     -> IT vs Non-IT
 *   asset_categorywise=true                                      -> category split
 *   assets_group_count_by_name=true                              -> group split
 * Adding `&export=<type>` to any of them returns an XLSX instead of JSON.
 *
 * Two things make this module deliberately separate from the existing
 * `src/services/assetAnalyticsAPI.ts` (which serves the legacy `/maintenance/asset`
 * page and must keep using the tenant's own base URL):
 *   1. the base URL below is HARDCODED — per requirement, only the dashboard's asset
 *      section is pinned to this host; every other dashboard tab still uses the
 *      tenant base URL via `apiClient`.
 *   2. `site_id` is resolved from the signed-in user's account payload, the same way
 *      the Checklist cards do it (see `checklistDashboardAnalyticsAPI`), rather than
 *      from `localStorage.selectedSiteId` alone. The shared `reportScopeParams` helper
 *      is society-scoped only, so it can't be used here.
 */
const ASSET_ANALYTICS_BASE_URL = 'https://lockated-api.gophygital.work';

const STATISTICS_PATH = '/pms/assets/assets_statistics.json';

// ── Response types ────────────────────────────────────────────────────────────

/** Raw `assets_statistics` envelope for the KPI flags. */
interface AssetStatisticsPayload {
  total_assets?: { assets_total_count?: number; assets_total_count_info?: string };
  total_assets_count?: { total_assets_count?: number; info?: string };
  assets_in_use?: { assets_in_use_total?: number; assets_in_use_info?: string };
  assets_in_breakdown?: { assets_in_breakdown_total?: number; assets_in_breakdown_info?: string };
  critical_assets_breakdown?: {
    critical_assets_breakdown_total?: number;
    critical_assets_breakdown_info?: string;
  };
  ppm_overdue_assets?: {
    ppm_conduct_assets_count?: number;
    ppm_conduct_assets_info?: { info?: string; total?: number } | string;
  };
  ppm_conduct_assets_count?: { total?: number; info?: string };
  amc_assets?: { assets_under_amc?: number; assets_missing_amc?: number; info?: string };
}

/** Flat shape the KPI tiles + AMC card consume. */
export interface AssetStatisticsSummary {
  total_assets: number;
  assets_in_use: number;
  assets_in_breakdown: number;
  critical_assets_in_breakdown: number;
  ppm_conduct_assets: number;
  assets_under_amc: number;
  assets_missing_amc: number;
}

export interface AssetNamedCount {
  name: string;
  value: number;
}

export interface AssetNamedCountsResponse {
  response: AssetNamedCount[];
  /** Backend `info` blurb, shown as the card subtitle when present. */
  info?: string;
}

export type AssetExportType =
  | 'total_assets'
  | 'assets_in_use'
  | 'assets_in_breakdown'
  | 'critical_breakdown'
  | 'ppm_overdue'
  | 'amc_asstes' // backend spells it this way — do not "correct" it
  | 'group_wise'
  | 'category_wise'
  | 'distribution';

export interface AssetAnalyticsDateRange {
  fromDate: Date;
  toDate: Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isUsableId = (value: unknown): value is string | number =>
  value != null && `${value}`.trim() !== '' && `${value}` !== '0';

/**
 * `site_id` for the asset calls — explicit site selection first, then the signed-in
 * user's `site_id` off the persisted `/api/users/account.json` payload. The header
 * (`HiSocietyHeader`) and `LoginPage` write that whole account response to
 * `localStorage.hiSocietyAccount`, and some flows write it to `user`, so `site_id` is
 * available synchronously here. The account fallback is what makes this work for users
 * who never touch the site switcher (e.g. `user_type: "snag"`), where `selectedSiteId`
 * is never written. Same resolution order as `checklistDashboardAnalyticsAPI`.
 */
const getAssetSiteId = (): string | null => {
  const selected = localStorage.getItem('selectedSiteId');
  if (isUsableId(selected)) return selected as string;
  for (const key of ['hiSocietyAccount', 'user']) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { site_id?: unknown };
      if (isUsableId(parsed?.site_id)) return `${parsed.site_id}`;
    } catch {
      // ignore malformed cache entries
    }
  }
  return null;
};

/** Bearer token; unlike `getAuthHeader()` this returns null instead of throwing. */
const getAuthToken = (): string | null => {
  try {
    return API_CONFIG.TOKEN || localStorage.getItem('token') || null;
  } catch {
    return null;
  }
};

/** `?site_id=…&from_date=…&to_date=…` plus whichever metric flags the caller needs. */
const buildUrl = (
  { fromDate, toDate }: AssetAnalyticsDateRange,
  flags: Record<string, string | number | boolean>
): string => {
  const params = new URLSearchParams();
  const siteId = getAssetSiteId();
  if (siteId) params.set('site_id', siteId);
  params.set('from_date', formatDateForAPI(fromDate));
  params.set('to_date', formatDateForAPI(toDate));
  for (const [key, value] of Object.entries(flags)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return `${ASSET_ANALYTICS_BASE_URL}${STATISTICS_PATH}?${params.toString()}`;
};

const getJson = async (url: string): Promise<Record<string, unknown>> => {
  const token = getAuthToken();
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Asset analytics request failed (${response.status})`);
  }

  return (await response.json()) as Record<string, unknown>;
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Unwraps the `{ assets_statistics: {...} }` envelope these routes use. */
const statisticsOf = (raw: Record<string, unknown>): Record<string, unknown> =>
  (raw?.assets_statistics ?? raw ?? {}) as Record<string, unknown>;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Accepts `{ category, count }[]` rows (the documented shape), `{ "Label": 12 }` maps,
 * `[label, value][]` pairs, and `{ labels, values }` — the FM Matrix version had to
 * tolerate all four across its legacy/new payloads, so this does too.
 */
const normalizeNamedCounts = (
  raw: unknown,
  nameKeys: string[],
  valueKeys: string[]
): AssetNamedCount[] => {
  if (Array.isArray(raw)) {
    return raw.map((item, i) => {
      if (Array.isArray(item)) {
        return { name: String(item[0] ?? '—'), value: toNumber(item[1]) };
      }
      const row = (item ?? {}) as Record<string, unknown>;
      const name = nameKeys.map((k) => row[k]).find((v) => v != null);
      const value = valueKeys.map((k) => row[k]).find((v) => v != null);
      return { name: String(name ?? `Item ${i + 1}`), value: toNumber(value) };
    });
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.labels) && Array.isArray(obj.values)) {
      return obj.labels.map((label, i) => ({
        name: String(label),
        value: toNumber((obj.values as unknown[])[i]),
      }));
    }
    return Object.entries(obj)
      .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
      .map(([name, value]) => ({ name, value: toNumber(value) }));
  }

  return [];
};

// ── API ───────────────────────────────────────────────────────────────────────

export const assetDashboardAnalyticsAPI = {
  /** KPI numbers behind the Total / In Use / Breakdown / Critical / PPM / AMC cards. */
  async getStatistics(range: AssetAnalyticsDateRange): Promise<AssetStatisticsSummary> {
    const data = await getJson(
      buildUrl(range, {
        total_assets: true,
        assets_in_use: true,
        assets_in_breakdown: true,
        critical_assets_breakdown: true,
        ppm_overdue_assets: true,
        amc_assets: true,
      })
    );
    const s = statisticsOf(data) as AssetStatisticsPayload;

    return {
      total_assets: toNumber(
        s.total_assets?.assets_total_count ?? s.total_assets_count?.total_assets_count
      ),
      assets_in_use: toNumber(s.assets_in_use?.assets_in_use_total),
      assets_in_breakdown: toNumber(s.assets_in_breakdown?.assets_in_breakdown_total),
      critical_assets_in_breakdown: toNumber(
        s.critical_assets_breakdown?.critical_assets_breakdown_total
      ),
      ppm_conduct_assets: toNumber(
        s.ppm_overdue_assets?.ppm_conduct_assets_count ?? s.ppm_conduct_assets_count?.total
      ),
      assets_under_amc: toNumber(s.amc_assets?.assets_under_amc),
      assets_missing_amc: toNumber(s.amc_assets?.assets_missing_amc),
    };
  },

  /** `assets_status=true` — In Use / Breakdown / In Store / In Disposed donut. */
  async getStatus(range: AssetAnalyticsDateRange): Promise<AssetNamedCountsResponse> {
    const data = await getJson(buildUrl(range, { assets_status: true }));
    const stats = statisticsOf(data);
    const status = (stats.status ?? stats) as Record<string, unknown>;

    const rows: AssetNamedCount[] = [
      { name: 'In Use', value: toNumber(status.assets_in_use_total) },
      { name: 'Breakdown', value: toNumber(status.assets_in_breakdown_total) },
      { name: 'In Store', value: toNumber(status.in_store) },
      { name: 'In Disposed', value: toNumber(status.in_disposed) },
    ].filter((row) => row.value > 0);

    return { response: rows, info: asString(status.info) };
  },

  /** `assets_distribution=true` — IT vs Non-IT donut. */
  async getDistribution(range: AssetAnalyticsDateRange): Promise<AssetNamedCountsResponse> {
    const data = await getJson(buildUrl(range, { assets_distribution: true }));
    const stats = statisticsOf(data);
    const distribution = (stats.assets_distribution ?? {}) as Record<string, unknown>;

    const rows: AssetNamedCount[] = [
      { name: 'IT Equipment', value: toNumber(distribution.it_assets_count) },
      { name: 'Non-IT Equipment', value: toNumber(distribution.non_it_assets_count) },
    ].filter((row) => row.value > 0);

    return { response: rows, info: asString(stats.info) };
  },

  /** `asset_categorywise=true` — category split donut. */
  async getCategoryWise(range: AssetAnalyticsDateRange): Promise<AssetNamedCountsResponse> {
    const data = await getJson(buildUrl(range, { asset_categorywise: true }));
    const stats = statisticsOf(data);
    const source = stats.asset_categorywise ?? data.asset_type_category_counts ?? stats.categories ?? [];

    return {
      response: normalizeNamedCounts(
        source,
        ['category', 'category_name', 'name', 'label'],
        ['count', 'asset_count', 'value', 'total']
      ).filter((row) => row.value > 0),
      info: asString(stats.info),
    };
  },

  /** `assets_group_count_by_name=true` — group-wise bar chart. */
  async getGroupWise(range: AssetAnalyticsDateRange): Promise<AssetNamedCountsResponse> {
    const data = await getJson(buildUrl(range, { assets_group_count_by_name: true }));
    const stats = statisticsOf(data);
    const source = stats.assets_group_count_by_name ?? data.group_wise_assets ?? [];

    return {
      response: normalizeNamedCounts(
        source,
        ['group_name', 'name', 'label'],
        ['count', 'asset_count', 'value', 'total']
      ).filter((row) => row.value > 0),
      info: asString(stats.info),
    };
  },

  /**
   * XLSX export. Same routes as above with `&export=<type>` — the metric flag that
   * produced the chart has to be sent alongside it, which is what `EXPORT_FLAGS` maps.
   */
  async downloadExport(range: AssetAnalyticsDateRange, exportType: AssetExportType): Promise<void> {
    const EXPORT_FLAGS: Record<AssetExportType, Record<string, boolean>> = {
      total_assets: { total_assets: true },
      assets_in_use: { assets_in_use: true },
      assets_in_breakdown: { assets_in_breakdown: true },
      critical_breakdown: { critical_assets_breakdown: true },
      ppm_overdue: { ppm_overdue_assets: true },
      amc_asstes: { amc_assets: true },
      group_wise: { assets_group_count_by_name: true },
      category_wise: { asset_categorywise: true },
      distribution: { assets_distribution: true },
    };

    const url = buildUrl(range, { ...EXPORT_FLAGS[exportType], export: exportType });
    const token = getAuthToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });

    if (!response.ok) {
      throw new Error(`Asset analytics export failed (${response.status})`);
    }

    triggerDownload(
      await response.blob(),
      `${exportType}-${formatDateForAPI(range.fromDate)}-to-${formatDateForAPI(range.toDate)}.xlsx`
    );
  },
};
