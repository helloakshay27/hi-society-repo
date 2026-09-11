import { API_CONFIG } from '@/config/apiConfig';

/**
 * Checklist analytics for the Hi-Society Dashboard's Checklist tab (`/hi-society-dashboard`).
 *
 * Ported from the FM Matrix `/maintenance/task` → Analytics tab
 * (`src/services/taskAnalyticsAPI.ts` + `taskAnalyticsDownloadAPI.ts` in that repo),
 * which renders exactly four charts off `/pms/custom_forms/*`:
 *   chart_technical_checklist_monthly.json      -> technical, status buckets per category
 *   chart_non_technical_checklist_monthly.json  -> non-technical, same shape
 *   top_ten_checklist.json                      -> top 10 checklist types by count
 *   site_wise_checklist.json                    -> status buckets per site
 * Each has a matching `*_download.json` route returning an XLSX.
 *
 * Like `assetDashboardAnalyticsAPI`, this module deliberately does NOT go through
 * `apiClient` / `API_CONFIG.BASE_URL`:
 *   1. the base URL below is HARDCODED, per requirement — only the dashboard's asset
 *      and checklist sections are pinned to this host; every other tab still uses the
 *      tenant base URL.
 *   2. `site_id` is resolved from the signed-in user's account payload rather than
 *      `localStorage.selectedSiteId` alone (the shared `reportScopeParams` helper is
 *      society-scoped only, so it can't be used here).
 */
const CHECKLIST_ANALYTICS_BASE_URL = 'https://lockated-api.gophygital.work';

const BASE_PATH = '/pms/custom_forms';

// ── Types ─────────────────────────────────────────────────────────────────────

/** One row of the Open / Closed / WIP / Overdue breakdown, keyed by category or site. */
export interface ChecklistStatusRow {
  name: string;
  open: number;
  closed: number;
  work_in_progress: number;
  overdue: number;
  total: number;
}

export interface ChecklistStatusResponse {
  response: ChecklistStatusRow[];
  /** Backend `info` blurb, shown as the card subtitle when present. */
  info?: string;
}

export interface ChecklistTopTenRow {
  rank: number;
  type: string;
  count: number;
}

export interface ChecklistTopTenResponse {
  response: ChecklistTopTenRow[];
  info?: string;
}

/** The four charts, matching the FM Matrix `chartOrder` ids. */
export type ChecklistAnalyticsKind = 'technical' | 'nonTechnical' | 'topTen' | 'siteWise';

const DATA_PATHS: Record<ChecklistAnalyticsKind, string> = {
  technical: 'chart_technical_checklist_monthly.json',
  nonTechnical: 'chart_non_technical_checklist_monthly.json',
  topTen: 'top_ten_checklist.json',
  siteWise: 'site_wise_checklist.json',
};

const DOWNLOAD_PATHS: Record<ChecklistAnalyticsKind, string> = {
  technical: 'chart_technical_checklist_download.json',
  nonTechnical: 'chart_non_technical_checklist_download.json',
  topTen: 'top_ten_checklist_download.json',
  // Site-wise shares the combined checklist export, same as FM Matrix.
  siteWise: 'chart_checklist_download.json',
};

export interface ChecklistAnalyticsDateRange {
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
 * `site_id` for the checklist calls — explicit site selection first, then the
 * signed-in user's `site_id` off the persisted `/api/users/account.json` payload.
 * `HiSocietyHeader` and `LoginPage` write that whole account response to
 * `localStorage.hiSocietyAccount`, and some flows write it to `user`, so it is
 * available synchronously here. The account fallback is what makes this work for
 * users who never touch the site switcher (e.g. `user_type: "snag"`), where
 * `selectedSiteId` is never written. Same order as `assetDashboardAnalyticsAPI`.
 */
const getChecklistSiteId = (): string | null => {
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

const buildUrl = (path: string, { fromDate, toDate }: ChecklistAnalyticsDateRange): string => {
  const params = new URLSearchParams();
  const siteId = getChecklistSiteId();
  if (siteId) params.set('site_id', siteId);
  params.set('from_date', formatDateForAPI(fromDate));
  params.set('to_date', formatDateForAPI(toDate));
  return `${CHECKLIST_ANALYTICS_BASE_URL}${BASE_PATH}/${path}?${params.toString()}`;
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
    throw new Error(`Checklist analytics request failed (${response.status})`);
  }

  return (await response.json()) as Record<string, unknown>;
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

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

/** Reads the first present key from a list of aliases. */
const pick = (row: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (row?.[key] != null) return row[key];
  }
  return undefined;
};

const rowFrom = (name: string, value: Record<string, unknown>): ChecklistStatusRow => {
  const open = toNumber(pick(value, ['open', 'Open']));
  const closed = toNumber(pick(value, ['closed', 'Closed']));
  const work_in_progress = toNumber(
    pick(value, ['work_in_progress', 'wip', 'WIP', 'in_progress', 'inProgress'])
  );
  const overdue = toNumber(pick(value, ['overdue', 'Overdue']));
  const totalRaw = pick(value, ['total', 'Total']);

  return {
    name,
    open,
    closed,
    work_in_progress,
    overdue,
    total: totalRaw != null ? toNumber(totalRaw) : open + closed + work_in_progress + overdue,
  };
};

/**
 * The documented shape is a keyed map — `{ "Routine": { open, closed, ... }, ... }`.
 * An array envelope is also tolerated, since the FM Matrix card fell back to one.
 */
const normalizeStatusRows = (raw: Record<string, unknown>): ChecklistStatusRow[] => {
  const response = raw.response ?? raw;

  if (Array.isArray(response)) {
    return response.map((item, i) => {
      const row = (item ?? {}) as Record<string, unknown>;
      const name = pick(row, ['category', 'Category', 'site', 'Site', 'site_name', 'name', 'label']);
      return rowFrom(String(name ?? `Item ${i + 1}`), row);
    });
  }

  if (response && typeof response === 'object') {
    return Object.entries(response as Record<string, unknown>)
      .filter(([, value]) => value != null && typeof value === 'object' && !Array.isArray(value))
      .map(([name, value]) => rowFrom(name, value as Record<string, unknown>));
  }

  return [];
};

const normalizeTopTen = (raw: Record<string, unknown>): ChecklistTopTenRow[] => {
  const response = raw.response ?? raw;
  if (!Array.isArray(response)) return [];

  return response.slice(0, 10).map((item, i) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      rank: i + 1,
      type: String(pick(row, ['type', 'checklist_type', 'name', 'label']) ?? 'N/A'),
      count: toNumber(pick(row, ['count', 'Count', 'total'])),
    };
  });
};

// ── API ───────────────────────────────────────────────────────────────────────

export const checklistDashboardAnalyticsAPI = {
  /** Open / Closed / WIP / Overdue buckets for technical, non-technical, or site-wise. */
  async getStatus(
    kind: Exclude<ChecklistAnalyticsKind, 'topTen'>,
    range: ChecklistAnalyticsDateRange
  ): Promise<ChecklistStatusResponse> {
    const data = await getJson(buildUrl(DATA_PATHS[kind], range));
    return { response: normalizeStatusRows(data), info: asString(data.info) };
  },

  /** Top 10 checklist types by occurrence count. */
  async getTopTen(range: ChecklistAnalyticsDateRange): Promise<ChecklistTopTenResponse> {
    const data = await getJson(buildUrl(DATA_PATHS.topTen, range));
    return { response: normalizeTopTen(data), info: asString(data.info) };
  },

  /** XLSX export for any of the four charts. */
  async downloadExport(
    kind: ChecklistAnalyticsKind,
    range: ChecklistAnalyticsDateRange
  ): Promise<void> {
    const url = buildUrl(DOWNLOAD_PATHS[kind], range);
    const token = getAuthToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });

    if (!response.ok) {
      throw new Error(`Checklist analytics export failed (${response.status})`);
    }

    triggerDownload(
      await response.blob(),
      `${kind}-checklist-${formatDateForAPI(range.fromDate)}-to-${formatDateForAPI(range.toDate)}.xlsx`
    );
  },
};
