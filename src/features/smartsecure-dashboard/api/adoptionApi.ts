import axios from 'axios';

/**
 * Dynamically resolves the PostHog Adoption Analytics API host.
 */
export function getApiBaseUrl(): string {
  return (
    (import.meta.env.VITE_SMARTSECURE_API_URL as string | undefined) ??
    (import.meta.env.VITE_POSTHOG_API_URL as string | undefined) ??
    (import.meta.env.VITE_FM_ADOPTION_API_URL as string | undefined) ??
    localStorage.getItem('posthog_api_url') ??
    'https://posthog-api.lockated.com'
  );
}

/**
 * Tenant URL to query PostHog analytics for — the org's baseUrl from localStorage.
 */
export function getDynamicTenantUrl(): string {
  const baseUrl = localStorage.getItem('baseUrl') || '';
  return baseUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

const client = axios.create({ timeout: 60_000 });

client.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = getApiBaseUrl();
  }
  return config;
});

/** `device_type` is case-sensitive server-side (`Desktop` / `Mobile`). */
export type DeviceType = 'Desktop' | 'Mobile';

/** Filters shared by the from/to endpoints. */
export interface RangeFilters {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  siteIds?: string[];
  devices?: DeviceType[];
  url?: string;
  appId?: string;
  os?: string;
}

/** Filters for the three look-back endpoints (adoption_trend / growth / retention). */
export interface WeeklyFilters {
  to: string; // YYYY-MM-DD
  weeks: number;
  siteIds?: string[];
  devices?: DeviceType[];
  url?: string;
  appId?: string;
  os?: string;
}

function baseParams(siteIds?: string[], devices?: DeviceType[], customUrl?: string, appId?: string, os?: string) {
  const p: Record<string, string> = {};
  if (devices?.length) p.device_type = devices.join(',');
  if (os) p.os = os;
  return p;
}

function rangeParams(f: RangeFilters) {
  return { ...baseParams(f.siteIds, f.devices, f.url, f.appId, f.os), from: f.from, to: f.to };
}

function weeklyParams(f: WeeklyFilters) {
  return { ...baseParams(f.siteIds, f.devices, f.url, f.appId, f.os), to: f.to, weeks: String(f.weeks) };
}

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  // Build query string manually so site_id commas are NOT percent-encoded (%2C),
  // matching the format the server expects: site_id=2189,2190,2191,...
  const base = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === 'site_id') continue; // handle below
    base.append(k, v);
  }
  let qs = base.toString();
  if (params.site_id) {
    // Append site_id with literal commas, not encoded
    qs += (qs ? '&' : '') + 'site_id=' + params.site_id;
  }
  const res = await client.get<T>(`/fm/adoption/${path}?${qs}`);
  return res.data;
}

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
  get<TrafficSessionResponse>('traffic_session', rangeParams(f));

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
  get<UsageDistributionResponse>('usage_and_distribution', rangeParams(f));

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
export const fetchAdoptionEngagement = (f: RangeFilters & { licensedSeats?: number | null }) =>
  get<AdoptionEngagementResponse>('adoption_engagement', {
    ...rangeParams(f),
    ...(f.licensedSeats != null && f.licensedSeats > 0
      ? { licensed_seats: String(f.licensedSeats) }
      : {}),
  });

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
  get<AdoptionTrendResponse>('adoption_trend', weeklyParams(f));

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

export const fetchGrowth = (f: WeeklyFilters) => get<GrowthResponse>('growth', weeklyParams(f));

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
  get<RetentionResponse>('retention', weeklyParams(f));

/* ------------------------------------------------------ Layer 2 · roles (A8) */

export interface RolesResponse {
  meta: AdoptionMeta;
  total_users: number;
  roles: { role: string; users: number; events: number; active_share: number }[];
  info?: AdoptionInfo;
}

export const fetchRoles = (f: RangeFilters) => get<RolesResponse>('roles', rangeParams(f));

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
export const fetchModules = (f: RangeFilters & { module?: string }) =>
  get<ModulesResponse>('modules', {
    ...rangeParams(f),
    ...(f.module ? { module: f.module } : {}),
  });

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
) =>
  get<WorkflowUsageResponse>('workflow_usage', {
    ...rangeParams(f),
    ...(f.module ? { module: f.module } : {}),
    ...(f.subModule ? { sub_module: f.subModule } : {}),
  });
