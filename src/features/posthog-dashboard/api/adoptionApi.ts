import axios from 'axios';

/* ---------------------------------------------------------------------------
 * Hi Society Adoption Analytics API client (ported from FM Matrix).
 *
 * Base URL : VITE_FM_ADOPTION_API_URL (default https://posthog-api.lockated.com)
 * Scope    : Hi Society analytics are scoped by `project_code` only — no `url`
 *            tenant and no `site_id` are sent (see commit 494a9e523).
 * Auth     : a Bearer token is attached at request time only when present.
 * ------------------------------------------------------------------------- */

export const ANALYTICS_BASE_URL =
  (import.meta.env.VITE_FM_ADOPTION_API_URL as string | undefined) ??
  (import.meta.env.VITE_POSTHOG_API_URL as string | undefined) ??
  'https://posthog-api.lockated.com';

/** Hi Society project code sent as `project_code` on every request. */
export const ANALYTICS_PROJECT_CODE =
  (import.meta.env.VITE_HS_ADOPTION_PROJECT_CODE as string | undefined)?.trim() ||
  'HS-01';

const analyticsClient = axios.create({
  baseURL: ANALYTICS_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

/* Bearer token attached at REQUEST time, only when present. The read prefers
   the same keys the app's other clients use (see src/utils/auth.ts and the
   sign-in flow). */
analyticsClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* Response interceptor: when a backend endpoint returns 404 (or any non-JSON
   like a Rails HTML error page), silently return null instead of throwing so
   React Query treats it as "no data" and the UI falls back to sample/empty
   state — exactly the same graceful degradation pattern the other layers
   (traffic, adoption, workflow) use. */
analyticsClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const contentType = error.response?.headers?.['content-type'] || '';
    if (status === 404 || (status >= 400 && !contentType.includes('application/json'))) {
      return Promise.resolve({ data: null });
    }
    return Promise.reject(error);
  },
);

/** `device_type` is case-sensitive server-side (`Desktop` / `Mobile`). */
export type DeviceType = 'Desktop' | 'Mobile';

/** Filters shared by the from/to endpoints. */
export interface RangeFilters {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  /** Optional product scoping for dashboards that share these endpoints. */
  projectCode?: string;
  /** Optional analytics tenant override; the tenant is independent of projectCode. */
  tenantUrl?: string;
  signal?: AbortSignal;
  siteIds?: string[];
  devices?: DeviceType[];
  /** Raw platform/device selection ("all" | "ios" | "android"). */
  dev?: string;
  /** Optional app/platform scope used by the recent active users endpoint. */
  appId?: number | string;
  recentDeviceType?: string;
}

export interface RecentActiveUser {
  user_id: string;
  display_name: string;
  path: string | null;
  last_event: string | null;
  minutes_ago: number | null;
  site_name: string | null;
}

export interface RecentActiveUsersResponse {
  users: RecentActiveUser[];
}

/** Filters for the three look-back endpoints (adoption_trend / growth / retention). */
export interface WeeklyFilters {
  to: string; // YYYY-MM-DD
  weeks: number;
  /** Optional product scoping for dashboards that share these endpoints. */
  projectCode?: string;
  /** Optional analytics tenant override; the tenant is independent of projectCode. */
  tenantUrl?: string;
  signal?: AbortSignal;
  siteIds?: string[];
  devices?: DeviceType[];
  dev?: string;
}

/* ---------------------------------------------------------------------------
 * Query-string builder.
 *
 * `site_id` must be joined with RAW commas in the query string — never
 * percent-encoded to %2C. Axios would encode array values, so we build the
 * query string manually from an ordered list of [key, value] pairs and append
 * it directly to the URL. Non-array string values are kept as-is.
 * ------------------------------------------------------------------------- */

/**
 * @param {Array<[string, string | string[] | number | undefined | null]>} pairs
 */
const buildQuery = (pairs: Array<[string, string | string[] | number | undefined | null]>) => {
  const parts: string[] = [];
  for (const [key, value] of pairs) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      // join with raw commas, e.g. site_id=2189,2190
      parts.push(`${key}=${value.join(',')}`);
    } else {
      parts.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.join('&');
};

/**
 * GET helper: appends a manually built query string (raw commas preserved for
 * site_id) to the endpoint and returns the parsed response.
 */
const get = async <T>(endpoint: string, pairs: Array<[string, string | string[] | number | undefined | null]>, signal?: AbortSignal): Promise<T> => {
  const qs = buildQuery(pairs);
  const url = `/fm/adoption/${endpoint}${qs ? `?${qs}` : ''}`;
  const { data } = await analyticsClient.get<T>(url, { signal });
  return data;
};

export const RECENT_ACTIVE_USERS_EXPORT_ENDPOINT = '/fm/adoption/active_users_export.json';

export const fetchRecentActiveUsers = (f: RangeFilters) =>
  get<RecentActiveUsersResponse>('recent_active_users', [
    ...(f.appId != null
      ? ([
          ['app_id', f.appId],
          ['device_type', f.recentDeviceType],
          ['from', f.from],
          ['to', f.to],
        ] as QueryPairs)
      : rangeParams(f)),
    ['limit', 10],
  ], f.signal);

export async function downloadRecentActiveUsers(f: RangeFilters): Promise<Blob> {
  const qs = buildQuery([...rangeParams(f), ['limit', 10]]);
  const response = await analyticsClient.get<Blob>(
    `${RECENT_ACTIVE_USERS_EXPORT_ENDPOINT}${qs ? `?${qs}` : ''}`,
    { responseType: 'blob' },
  );
  return response.data;
}

/* Shared param slices ---------------------------------------------------- */

type QueryPairs = Array<[string, string | string[] | number | undefined | null]>;

const scopeParams = (projectCode?: string, tenantUrl?: string): QueryPairs => [
  ['url', tenantUrl],
  ['project_code', projectCode || ANALYTICS_PROJECT_CODE],
];

const rangeParams = ({ from, to, devices, projectCode, tenantUrl }: RangeFilters): QueryPairs => [
  ...scopeParams(projectCode, tenantUrl),
  ['from', from],
  ['to', to],
  ['device_type', devices],
];

const weeklyParams = ({ to, weeks, devices, projectCode, tenantUrl }: WeeklyFilters): QueryPairs => [
  ...scopeParams(projectCode, tenantUrl),
  ['to', to],
  ['weeks', weeks],
  ['device_type', devices],
];

/* ------------------------------------------------------------------ shared */

export interface AdoptionMeta {
  metric: string;
  layer?: string;
  level?: string;
  parent?: string | null;
  module?: string;
  sub_module?: string;
  prefix?: string;
  filters: {
    url: string;
    site_id: string[];
    device_type: string[];
    from: string;
    to: string;
  };
  generated_at: string;
}

/** Every response carries this self-describing block (summary + per-metric formulas). */
export interface AdoptionInfo {
  summary?: string;
  period?: Record<string, string>;
  formula?: Record<string, string>;
  notes?: Record<string, string>;
}

/* ------------------------------------------------- Layer 1 · traffic_session */

export interface TrafficSessionResponse {
  meta: AdoptionMeta;
  tiles: {
    active_users: number;
    screen_views: number;
    sessions: number;
    avg_session_seconds: number;
    bounce_rate: number; // already a percentage (0-100)
    recently_online: number;
  };
  previous: {
    active_users: number;
    screen_views: number;
    sessions: number;
    avg_session_seconds: number;
    bounce_rate: number;
  };
  delta_pct: {
    active_users: number | null;
    screen_views: number | null;
    sessions: number | null;
    avg_session_seconds: number | null;
    bounce_rate: number | null;
  };
  info?: AdoptionInfo;
}

export const fetchTrafficSession = (f: RangeFilters) =>
  get<TrafficSessionResponse>('traffic_session', rangeParams(f), f.signal);

/* ------------------------------------------ Layer 1 · usage_and_distribution */

export interface UsageDay {
  day: string; // YYYY-MM-DD
  visitors: number;
  views: number;
  sessions: number;
}

export interface UsageDistributionResponse {
  meta: AdoptionMeta;
  usage_over_time: { current: UsageDay[]; previous: UsageDay[] };
  device_split: {
    total_sessions: number;
    devices: {
      device: string;
      users: number;
      sessions: number;
      session_share: number; // percentage
    }[];
  };
  views_per_session: number;
  info?: AdoptionInfo;
}

export const fetchUsageAndDistribution = (f: RangeFilters) =>
  get<UsageDistributionResponse>('usage_and_distribution', rangeParams(f), f.signal);

/* ---------------------------------------- Layer 2 · adoption_engagement (A*) */

export interface AdoptionEngagementResponse {
  meta: AdoptionMeta;
  seat_utilisation: {
    value: number | null; // null unless licensed_seats was passed
    used_seats: number;
    licensed_seats: number | null;
    delta_pct: number | null;
  };
  stickiness: { value: number; avg_dau: number; mau: number; delta_pct: number | null };
  adoption_trend: { value: number | null; wau_now: number; wau_4wk_ago: number };
  activation: { value: number; joiners: number; delta_pct: number | null };
  module_breadth: { in_use: number; total: number };
  dormant_users: { value: number; band: string };
  info?: AdoptionInfo;
}

/** `licensedSeats` is billing data (not in events) — omit it and A1's % comes back null. */
export const fetchAdoptionEngagement = (f: RangeFilters & { licensedSeats?: number | null }) => {
  const { licensedSeats, ...rest } = f;
  const pairs = rangeParams(rest);
  if (licensedSeats != null && licensedSeats > 0) {
    pairs.push(['licensed_seats', Number(licensedSeats)]);
  }
  return get<AdoptionEngagementResponse>('adoption_engagement', pairs, f.signal);
};

/* -------------------------------------------- Layer 2 · adoption_trend (A3) */

export interface WeeklyWau {
  week: string; // Monday of the ISO week
  wau: number;
}

export interface AdoptionTrendResponse {
  meta: AdoptionMeta;
  weekly: { current: WeeklyWau[]; previous: WeeklyWau[] };
  trend_pct: number | null;
  wau_now: number;
  wau_4wk_ago: number;
  info?: AdoptionInfo;
}

export const fetchAdoptionTrend = (f: WeeklyFilters) =>
  get<AdoptionTrendResponse>('adoption_trend', weeklyParams(f), f.signal);

/* ------------------------------------------------------- Layer 2 · growth */

export interface GrowthWeekRow {
  week: string;
  new: number;
  returning: number;
  resurrected: number;
  dormant: number; // positive; rendered below the axis
}

export interface GrowthResponse {
  meta: AdoptionMeta;
  weeks: GrowthWeekRow[];
  info?: AdoptionInfo;
}

export const fetchGrowth = (f: WeeklyFilters) => get<GrowthResponse>('growth', weeklyParams(f), f.signal);

/* ---------------------------------------------------- Layer 2 · retention */

/** week0..weekN keys are flat on the row, so index them dynamically. */
export interface RetentionCohort {
  cohort_week: string;
  size: number;
  [weekKey: string]: number | string | null;
}

export interface RetentionResponse {
  meta: AdoptionMeta;
  cohorts: RetentionCohort[];
  info?: AdoptionInfo;
}

export const fetchRetention = (f: WeeklyFilters) =>
  get<RetentionResponse>('retention', weeklyParams(f), f.signal);

/* ------------------------------------------------------ Layer 2 · roles (A8) */

export interface RolesResponse {
  meta: AdoptionMeta;
  total_users: number;
  roles: { role: string; users: number; events: number; active_share: number }[];
  info?: AdoptionInfo;
}

export const fetchRoles = (f: RangeFilters) => get<RolesResponse>('roles', rangeParams(f), f.signal);

/* ----------------------------------------------------- Layer 3 · modules */

export interface ModuleNode {
  name: string;
  users: number;
  events: number;
  sessions: number;
}

export interface ModulesResponse {
  meta: AdoptionMeta;
  tree: ModuleNode[];
  info?: AdoptionInfo;
}

/** Omit `module` for the top-level tree (path segment 1); pass it for sub-modules (segment 2). */
export const fetchModules = (f: RangeFilters & { module?: string }) => {
  const pairs = rangeParams(f);
  if (f.module) pairs.push(['module', f.module]);
  return get<ModulesResponse>('modules', pairs, f.signal);
};

/* ---------------------------------------------- Layer 3 · workflow_usage */

export interface WorkflowKpi {
  value: number | null;
  delta_pct: number | null;
}

export interface WorkflowFunnelStep {
  step: string;
  reach: number;
  drop_pct: number | null;
  biggest: boolean;
}

export interface WorkflowFlowRow {
  path: string;
  users: number;
  events: number;
  sessions: number;
  f_comp: number | null;
}

export interface WorkflowEntryScreen {
  path: string;
  visitors: number;
  views: number;
  bounce: number; // percentage
  visitors_trend: number | null;
  views_trend: number | null;
  bounce_trend: number | null;
}

export interface WorkflowUsageResponse {
  meta: AdoptionMeta;
  kpis: {
    f_adopt: WorkflowKpi;
    f_comp: WorkflowKpi;
    f_step: WorkflowKpi;
    f_vol: WorkflowKpi;
  };
  funnel: WorkflowFunnelStep[];
  flows: WorkflowFlowRow[];
  entry_screens: WorkflowEntryScreen[];
  info?: AdoptionInfo;
}

/** Defaults server-side to maintenance / ticket (helpdesk) when module/sub_module are omitted. */
export const fetchWorkflowUsage = (
  f: RangeFilters & { module?: string; subModule?: string }
) => {
  const pairs = rangeParams(f);
  if (f.module) pairs.push(['module', f.module]);
  if (f.subModule) pairs.push(['sub_module', f.subModule]);
  return get<WorkflowUsageResponse>('workflow_usage', pairs, f.signal);
};
