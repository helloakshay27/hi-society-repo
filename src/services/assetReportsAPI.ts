import { apiClient } from '@/utils/apiClient';

// Per FM-HI-SOCIETY-DASHBOARD-APIS.md § 2 "Assets":
//   GET /api-fm-report/hi-society/assets/kpis    -> KPI totals
//   GET /api-fm-report/hi-society/assets/tables  -> paginated breakdown table
//   GET /api-fm-report/hi-society/assets/charts  -> chart datasets
//   ...&export=<type>                             -> file download (any of the 3)
//
// Assets is scoped by `site_id` ONLY — `society_id` is NOT supported here, and a
// missing site filter 422s. `site_id` falls back server-side to the token user's
// `selected_site_id`, so this module resolves it locally when it can and
// otherwise lets the backend apply that fallback. This is why Assets does not
// use the shared `getDynamicScopeParams` (which is society-scoped).
const BASE_PATH = '/api-fm-report/hi-society/assets';

// tables is paginated server-side (default page=1, per_page=20, max 100).
const ASSET_TABLE_PER_PAGE = 100;

export interface AssetReportDateRange {
  fromDate: Date;
  toDate: Date;
}

export interface AssetKpisResponse {
  success: number;
  message: string;
  response: {
    total_assets_available: number;
    assets_in_use: number;
    assets_in_breakdown: number;
    critical_assets_in_breakdown: number;
    ppm_overdue_assets: number;
    customer_average_rating: number;
  };
  info?: string;
}

export type AssetBreakdownRow = Record<string, string | number>;

export interface AssetBreakdownTableResponse {
  success: number;
  message: string;
  columns: { key: string; label: string }[];
  response: AssetBreakdownRow[];
  info?: string;
}

export interface AssetNamedCountsResponse {
  success: number;
  message: string;
  response: { name: string; value: number }[];
  info?: string;
}

export type AssetChartKey = 'group_wise' | 'category_wise' | 'distribution';

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isUsableId = (value: unknown): value is string | number =>
  value != null && `${value}`.trim() !== '' && `${value}` !== '0';

/** Assets needs `site_id` (society_id unsupported) — explicit site selection, then account payload. */
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

const buildParams = (
  { fromDate, toDate }: AssetReportDateRange,
  extra?: Record<string, string | number>
): Record<string, string | number> => {
  const siteId = getAssetSiteId();
  return {
    ...(siteId ? { site_id: siteId } : {}),
    from_date: formatDateForAPI(fromDate),
    to_date: formatDateForAPI(toDate),
    ...extra,
  };
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const pick = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (obj?.[key] != null) return obj[key];
  }
  return undefined;
};

const humanize = (key: string): string =>
  key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const normalizeKpis = (raw: Record<string, unknown>): AssetKpisResponse['response'] => {
  const r = (raw.response ?? raw) as Record<string, unknown>;
  return {
    total_assets_available: toNumber(
      pick(r, ['total_assets_available', 'total_assets', 'totalAssetsAvailable', 'totalAssets', 'assets_available'])
    ),
    assets_in_use: toNumber(pick(r, ['assets_in_use', 'asset_in_use', 'assetsInUse', 'in_use'])),
    assets_in_breakdown: toNumber(
      pick(r, ['assets_in_breakdown', 'asset_in_breakdown', 'assetsInBreakdown', 'in_breakdown', 'breakdown'])
    ),
    critical_assets_in_breakdown: toNumber(
      pick(r, ['critical_assets_in_breakdown', 'critical_breakdown', 'criticalAssetsInBreakdown', 'critical_assets'])
    ),
    ppm_overdue_assets: toNumber(
      pick(r, ['ppm_overdue_assets', 'ppm_overdue', 'ppmOverdueAssets', 'ppmOverdue', 'overdue_ppm'])
    ),
    customer_average_rating: toNumber(
      pick(r, [
        'customer_average_rating',
        'customer_avg_rating',
        'customerAverageRating',
        'average_rating',
        'avg_rating',
      ])
    ),
  };
};

/** Accepts FM-style `{ "Label": 12 }` maps, `{ name, value }[]`, `[label, value][]`, or `{ labels, values }`. */
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
        name: String(row.name ?? row.label ?? row.category ?? row.group ?? '—'),
        value: toNumber(row.value ?? row.count ?? row.total),
      };
    });
  }

  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.labels) && Array.isArray(obj.values)) {
      return obj.labels.map((label, i) => ({ name: String(label), value: toNumber((obj.values as unknown[])[i]) }));
    }
    return Object.entries(obj)
      .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
      .map(([name, value]) => ({ name: humanize(name), value: toNumber(value) }));
  }

  return [];
};

const normalizeTable = (
  raw: unknown
): { columns: { key: string; label: string }[]; rows: AssetBreakdownRow[] } => {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const response = payload.response ?? payload;
  const container = (Array.isArray(response) ? { data: response } : (response ?? {})) as Record<string, unknown>;

  const list =
    (Array.isArray(container.data) && container.data) ||
    (Array.isArray(container.rows) && container.rows) ||
    (Array.isArray(container.records) && container.records) ||
    (Array.isArray(payload.data) && payload.data) ||
    [];

  const rawColumns = container.columns ?? container.headers ?? payload.columns;
  let columns: { key: string; label: string }[] = [];
  if (Array.isArray(rawColumns) && rawColumns.length > 0) {
    columns = rawColumns.map((col, i) => {
      if (typeof col === 'string') return { key: col, label: humanize(col) };
      const c = (col ?? {}) as Record<string, unknown>;
      const key = String(c.key ?? c.field ?? c.name ?? c.dataIndex ?? `col_${i}`);
      return { key, label: String(c.label ?? c.title ?? c.header ?? humanize(key)) };
    });
  }

  const rows: AssetBreakdownRow[] = (list as unknown[]).map((item) => {
    if (Array.isArray(item)) {
      const row: AssetBreakdownRow = {};
      item.forEach((val, i) => {
        const key = columns[i]?.key ?? `col_${i}`;
        row[key] = val == null || val === '' ? '—' : typeof val === 'number' ? val : String(val);
      });
      return row;
    }
    const obj = (item ?? {}) as Record<string, unknown>;
    const row: AssetBreakdownRow = {};
    Object.entries(obj).forEach(([key, val]) => {
      row[key] = val == null || val === '' ? '—' : typeof val === 'number' ? val : String(val);
    });
    return row;
  });

  if (columns.length === 0 && rows.length > 0) {
    columns = Object.keys(rows[0]).map((key) => ({ key, label: humanize(key) }));
  }

  return { columns, rows };
};

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

export const assetReportsAPI = {
  async getKpis(range: AssetReportDateRange): Promise<AssetKpisResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/kpis`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeKpis(data ?? {}),
      info: data?.info,
    };
  },

  async getBreakdownTable(
    range: AssetReportDateRange,
    page = 1,
    perPage = ASSET_TABLE_PER_PAGE
  ): Promise<AssetBreakdownTableResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/tables`, {
      params: buildParams(range, { page, per_page: perPage }),
    });
    const { columns, rows } = normalizeTable(data ?? {});
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      columns,
      response: rows,
      info: data?.info,
    };
  },

  /** Pulls one dataset out of the shared `/charts` payload (group-wise / category-wise / distribution). */
  async getChart(range: AssetReportDateRange, key: AssetChartKey): Promise<AssetNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/charts`, { params: buildParams(range) });
    const r = (data?.response ?? data ?? {}) as Record<string, unknown>;
    const source =
      pick(r, [
        key,
        `${key}_assets`,
        key.replace('_', ''),
        key === 'group_wise' ? 'groupWise' : key === 'category_wise' ? 'categoryWise' : 'assetDistribution',
      ]) ?? r;
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(source),
      info: data?.info,
    };
  },

  /** Downloads an Excel export. `exportType` per FM-HI-SOCIETY-DASHBOARD-APIS.md § 2.4. */
  async downloadExport(range: AssetReportDateRange, exportType: string): Promise<void> {
    const response = await apiClient.get(`${BASE_PATH}/kpis`, {
      params: buildParams(range, { export: exportType }),
      responseType: 'blob',
    });
    triggerDownload(
      response.data as Blob,
      `${exportType}-${formatDateForAPI(range.fromDate)}-to-${formatDateForAPI(range.toDate)}.xlsx`
    );
  },
};
