/**
 * Unified Dashboard API Client
 *
 * Implements:
 * 1. PostHog Adoption Analytics Endpoints
 * 2. FM Matrix Non-AI Endpoints (CRM & Finance)
 * 3. Dynamic Site / Project Lookup
 */

import { getBaseUrl, getToken, getUser } from '../../../utils/auth';
import {
  DashboardFilters,
  TrafficSessionResponse,
  UsageDistributionResponse,
  AdoptionEngagementResponse,
  AdoptionTrendResponse,
  GrowthResponse,
  RetentionResponse,
  RolesResponse,
  ModulesResponse,
  WorkflowUsageResponse,
  RecentActiveUsersResponse,
  SiteLookupItem,
  LeaseOverviewData,
  EventsOverviewData,
  BroadcastOverviewData,
  WalletOverviewData,
  WalletDistributionData,
  WalletTransactionsData,
  PendingApprovalsData,
  DraftPrsData,
  ProcurementPipelineData,
  PendingRequisitionValueData,
  PrSrSplitData,
  OverdueInvoicesData,
  ApprovalQueueData,
  TopPendingRecordsData,
} from './types';

// ==========================================
// 1. PostHog Adoption API Client
// ==========================================

function getPosthogApiBase(): string {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return '/posthog-api';
  }
  return (
    (import.meta as any).env?.VITE_FM_ADOPTION_API_URL ||
    (import.meta as any).env?.VITE_POSTHOG_API_URL ||
    localStorage.getItem('posthog_api_url') ||
    'https://posthog-api.lockated.com'
  );
}

/**
 * Each dashboard has its own adoption API in posthog_backend (see its config/routes.rb), and that API
 * fixes on the server which app's events it reads, so no app_id / project_code is sent. A dashboard
 * names its API with `filters.apiPath`.
 */
export const ADOPTION_API = {
  runwalConnect: 'residential/runwal/connect',
  runwalEnterprise: 'residential/runwal/enterprise',
  runwalCp: 'residential/runwal/cp',
  godrej: 'residential/godrej',
  kraheja: 'residential/kraheja',
  lacircle: 'residential/lacircle',
  kalpataru: 'residential/kalpataru',
  mypiramal: 'residential/mypiramal',
  artesia: 'residential/artesia',
  sunteck: 'residential/sunteck',
  suncity: 'residential/suncity',
  hiSociety: 'residential/hi_society',
  lockated: 'commercial/lockated',
  smartsecure: 'commercial/smartsecure',
  quikgate: 'commercial/quikgate',
  accounting: 'commercial/accounting',
} as const;

export type AdoptionApiPath = (typeof ADOPTION_API)[keyof typeof ADOPTION_API];

/** The Runwal dashboard serves two apps from one page: ?app_id=35 is Enterprise, anything else Connect. */
export const runwalApiPath = (appId?: string | null): AdoptionApiPath =>
  appId === '35' ? ADOPTION_API.runwalEnterprise : ADOPTION_API.runwalConnect;

function adoptionUrl(filters: Pick<DashboardFilters, 'apiPath'>, endpoint: string, query: string): string {
  if (!filters.apiPath) {
    throw new Error('This dashboard has no adoption API yet');
  }
  const base = getPosthogApiBase();
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}/${filters.apiPath}/adoption/${endpoint}?${query}`;
}

/**
 * The open dashboard's app_id / project_code, kept in memory rather than in the browser URL so the
 * codes are never shown or shared in a link. A dashboard pins its own scope (useEnsureAppId /
 * useEnsureProjectCode / pinDashboardScope); an old link that still carries ?app_id= or
 * ?project_code= is read once and then removed from the address bar (stripScopeFromUrl).
 */
const pinnedScope: { appId: string | null; projectCode: string | null; pinned: boolean } = {
  appId: null,
  projectCode: null,
  pinned: false,
};

export function pinDashboardScope(scope: { appId?: string | null; projectCode?: string | null }): void {
  pinnedScope.appId = scope.appId ?? null;
  pinnedScope.projectCode = scope.projectCode ?? null;
  pinnedScope.pinned = true;
}

export function clearDashboardScope(): void {
  pinnedScope.appId = null;
  pinnedScope.projectCode = null;
  pinnedScope.pinned = false;
}

const SCOPE_PARAMS = ['app_id', 'appId', 'project_code', 'projectCode'];

function readUrlParam(...names: string[]): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    for (const name of names) {
      const value = params.get(name);
      if (value) return value;
    }
  } catch {
    /* no URL */
  }
  return null;
}

/** Removes app_id / project_code from the address bar without reloading or adding history. */
export function stripScopeFromUrl(): void {
  try {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!SCOPE_PARAMS.some((name) => url.searchParams.has(name))) return;
    SCOPE_PARAMS.forEach((name) => url.searchParams.delete(name));
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {
    /* no URL */
  }
}

/** The dashboard's app_id: the pinned scope, else an old link's ?app_id= (before it is stripped). */
export function getAppIdFromUrl(): string | null {
  return pinnedScope.pinned ? pinnedScope.appId : readUrlParam('app_id', 'appId');
}

/** The dashboard's project_code: the pinned scope, else an old link's ?project_code=. */
export function getProjectCodeFromUrl(): string | null {
  return pinnedScope.pinned ? pinnedScope.projectCode : readUrlParam('project_code', 'projectCode');
}

export function getDynamicTenantUrl(): string {
  const baseUrl = localStorage.getItem('baseUrl') || '';
  return baseUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function getDeviceParams(dev?: DashboardFilters['devPlatform']): Record<string, string> {
  if (dev === 'ios') return { device_type: 'Mobile', os: 'ios' };
  if (dev === 'android') return { device_type: 'Mobile', os: 'Android' };
  return { device_type: 'Mobile' };
}

/** What an adoption request reads off the filters. The download is also called with just these. */
type AdoptionQueryFilters = Pick<DashboardFilters, 'apiPath' | 'from' | 'to'> &
  Partial<Pick<DashboardFilters, 'devPlatform' | 'deviceType' | 'includeAnonymous' | 'displayView'>>;

function buildPosthogQuery(filters: AdoptionQueryFilters, extra: Record<string, any> = {}): string {
  const parts: string[] = [];

  // const tenantUrl = (filters.url || getDynamicTenantUrl()).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  // parts.push(`base_url=${encodeURIComponent(tenantUrl)}`);

  if (filters.from) parts.push(`from=${encodeURIComponent(filters.from)}`);
  if (filters.to) parts.push(`to=${encodeURIComponent(filters.to)}`);

  const deviceParams = getDeviceParams(filters.devPlatform);
  if (filters.deviceType) {
    deviceParams.device_type = filters.deviceType;
  }
  for (const [k, v] of Object.entries(deviceParams)) {
    parts.push(`${k}=${encodeURIComponent(v)}`);
  }

  if (filters.includeAnonymous) {
    parts.push('include_anonymous=1');
  }

  // Sent unescaped (matches the site_id convention below) — the value is
  // always a plain digit or comma-separated digits, e.g. "0,1".
  if (filters.displayView) parts.push(`display_view=${filters.displayView}`);

  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null && v !== '') {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }

  return parts.join('&');
}

async function getPosthog<T>(filters: DashboardFilters, endpoint: string, queryStr: string): Promise<T> {
  const url = adoptionUrl(filters, endpoint, queryStr);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Usage API error (${response.status}): ${response.statusText || 'Failed to fetch'}`);
  }

  return response.json() as Promise<T>;
}

export const fetchTrafficSession = (filters: DashboardFilters) =>
  getPosthog<TrafficSessionResponse>(filters, 'traffic_session', buildPosthogQuery(filters));

export const fetchUsageAndDistribution = (filters: DashboardFilters) =>
  getPosthog<UsageDistributionResponse>(filters, 'usage_and_distribution', buildPosthogQuery(filters));

export const fetchAdoptionEngagement = (filters: DashboardFilters) =>
  getPosthog<AdoptionEngagementResponse>(
    filters, 'adoption_engagement',
    buildPosthogQuery(filters, {
      licensed_seats: filters.licensedSeats || undefined,
    })
  );

export const fetchAdoptionTrend = (filters: DashboardFilters) =>
  getPosthog<AdoptionTrendResponse>(filters, 'adoption_trend', buildPosthogQuery(filters, { weeks: 8 }));

export const fetchGrowth = (filters: DashboardFilters) =>
  getPosthog<GrowthResponse>(filters, 'growth', buildPosthogQuery(filters, { weeks: 6 }));

export const fetchRetention = (filters: DashboardFilters) =>
  getPosthog<RetentionResponse>(filters, 'retention', buildPosthogQuery(filters, { weeks: 8 }));

export const fetchRoles = (filters: DashboardFilters) =>
  getPosthog<RolesResponse>(filters, 'roles', buildPosthogQuery(filters));

export const fetchModules = (filters: DashboardFilters, module?: string | null) =>
  getPosthog<ModulesResponse>(filters, 'modules', buildPosthogQuery(filters, { module: module || undefined }));

export const fetchWorkflowUsage = (
  filters: DashboardFilters,
  module?: string | null,
  subModule?: string | null
) =>
  getPosthog<WorkflowUsageResponse>(
    filters, 'workflow_usage',
    buildPosthogQuery(filters, {
      module: module || undefined,
      sub_module: subModule || undefined,
    })
  );

/** The live activity log: one row per event, newest first. No `from`/`to` = today. */
export const fetchRecentActiveUsers = (filters: DashboardFilters, limit = 10) =>
  getPosthog<RecentActiveUsersResponse>(
    filters, 'recent_active_users',
    buildPosthogQuery(filters, { limit })
  );

/** What to call a user in an activity row: their name, else their email's local part, else their id. */
export const activityUserLabel = (u: { user_name?: string | null; email?: string | null; user_id?: string | null }): string =>
  u.user_name || u.email?.split('@')[0] || (u.user_id ? `user ${u.user_id}` : 'anonymous');

/**
 * Downloads the `.xlsx` workbook of every event each user did, with the
 * dashboard's own filters and date range applied (uncapped), and saves it via
 * a throwaway anchor.
 */
export async function downloadActiveUsersExport(filters: AdoptionQueryFilters): Promise<void> {
  const url = adoptionUrl(filters, 'active_users_export', buildPosthogQuery(filters));

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: '*/*' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Active users export failed (${response.status}): ${response.statusText || 'Failed to fetch'}`);
  }

  // The server already builds the finished workbook (bold header, column widths),
  // so save it as-is. Re-reading it with SheetJS here multiplied a large export
  // roughly tenfold in browser memory.
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filenameWithoutExtension = (match
    ? decodeURIComponent(match[1])
    : `user_activity_${filters.from || 'today'}_to_${filters.to || 'today'}`)
    .replace(/\.(?:csv|json|xls|xlsx)$/i, '');
  const filename = `${filenameWithoutExtension}.xlsx`;

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking straight away can cancel the download in Safari.
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
}

// ==========================================
// 2. FM Matrix Backend API Client
// ==========================================

export const getApiBaseUrl = (): string => {
  const envVite = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envVite) return envVite;

  const envNext = (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL;
  if (envNext) return envNext;

  const authBase = getBaseUrl();
  if (authBase) return authBase;

  return 'http://localhost:3000';
};

/**
 * Fetch the logged-in user's account details and return their site_id.
 * Used as the dynamic site filter for every dashboard API call now that
 * there's no manual site picker in the UI — the dashboard always scopes
 * to the current user's own site, fetched fresh rather than hardcoded.
 */
export async function fetchUserAccountSiteId(): Promise<string | null> {
  const token = getToken() || localStorage.getItem('token') || '';
  if (!token) return null;

  const baseUrl = getApiBaseUrl();
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  const response = await fetch(`${cleanBase}/api/users/account.json`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Account API error (${response.status}): ${response.statusText || 'Failed to fetch'}`);
  }

  const data = await response.json();
  return data?.site_id != null ? String(data.site_id) : null;
}

async function getFm<T>(
  path: string,
  params: {
    token?: string;
    [key: string]: any;
  } = {}
): Promise<T> {
  const query = new URLSearchParams();
  const token = params.token || getToken() || localStorage.getItem('token') || '';

  if (token) query.set('token', token);

  for (const [key, value] of Object.entries(params)) {
    if (key !== 'token' && value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }

  const projectCode = getProjectCodeFromUrl();
  if (projectCode) {
    query.set('project_code', projectCode);
  } else {
    const appId = getAppIdFromUrl();
    if (appId) query.set('app_id', appId);
  }

  // const baseUrl = getApiBaseUrl();
  // const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `https://posthog-api.lockated.com/fm${path}?${query.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`FM API error (${response.status}): ${response.statusText || 'Failed to fetch'}`);
  }

  return response.json() as Promise<T>;
}

// CRM Endpoints (Non-AI)
export const fetchLeaseOverview = (token: string) =>
  getFm<LeaseOverviewData>('/fm_dashboard/crm/lease_overview.json', { token });

export const fetchEventsOverview = (token: string) =>
  getFm<EventsOverviewData>('/fm_dashboard/crm/events_overview.json', { token });

export const fetchBroadcastOverview = (token: string) =>
  getFm<BroadcastOverviewData>('/fm_dashboard/crm/broadcast_overview.json', { token });

export const fetchWalletOverview = (token: string) =>
  getFm<WalletOverviewData>('/fm_dashboard/crm/wallet_overview.json', { token });

export const fetchWalletDistribution = (token: string) =>
  getFm<WalletDistributionData>('/fm_dashboard/crm/wallet_distribution.json', { token });

export const fetchWalletTransactions = (token: string) =>
  getFm<WalletTransactionsData>('/fm_dashboard/crm/wallet_transactions.json', { token });

// Finance Endpoints (Non-AI)
export const fetchPendingApprovals = (token: string) =>
  getFm<PendingApprovalsData>('/fm_dashboard/procurement/pending_approvals.json', { token });

export const fetchDraftPrs = (token: string) =>
  getFm<DraftPrsData>('/fm_dashboard/requisitions/draft_prs.json', { token });

export const fetchProcurementPipeline = (token: string) =>
  getFm<ProcurementPipelineData>('/fm_dashboard/procurement/procurement_pipeline.json', { token });

export const fetchPendingRequisitionValue = (token: string) =>
  getFm<PendingRequisitionValueData>('/fm_dashboard/requisitions/pending_value.json', { token });

export const fetchPrSrSplit = (token: string) =>
  getFm<PrSrSplitData>('/fm_dashboard/procurement/pr_sr_split.json', { token });

export const fetchOverdueInvoices = (token: string) =>
  getFm<OverdueInvoicesData>('/fm_dashboard/invoices/overdue_invoices.json', { token });

export const fetchApprovalQueue = (token: string) =>
  getFm<ApprovalQueueData>('/fm_dashboard/approvals/approval_queue.json', { token });

export const fetchTopPendingRecords = (token: string) =>
  getFm<TopPendingRecordsData>('/fm_dashboard/approvals/top_pending_records.json', { token });

// ==========================================
// 3. Dynamic Site Lookup
// ==========================================

const DEFAULT_RUNWAL_SITES: SiteLookupItem[] = [
  { id: '1', name: 'Runwal Bliss' },
  { id: '2', name: 'Runwal Forests' },
  { id: '3', name: 'Runwal Pinnacle' },
  { id: '4', name: 'Runwal Gardens' },
  { id: '5', name: 'Runwal Sanctuary' },
  { id: '6', name: 'Runwal 25 Hour Life' },
  { id: '7', name: 'Runwal Avenue' },
];

export async function fetchAllowedSites(): Promise<SiteLookupItem[]> {
  const user = getUser();
  let userId = user?.id || localStorage.getItem('user_id') || localStorage.getItem('userId');
  
  if (!userId) {
    try {
      const uStr = localStorage.getItem('user');
      if (uStr) userId = JSON.parse(uStr)?.id;
      const accStr = localStorage.getItem('hiSocietyAccount');
      if (!userId && accStr) userId = JSON.parse(accStr)?.id || JSON.parse(accStr)?.user?.id;
    } catch {}
  }

  const baseUrl = getApiBaseUrl();
  const token = getToken() || localStorage.getItem('token') || localStorage.getItem('spree_api_key') || '';
  const cleanBase = baseUrl ? (baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl) : '';

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Frontend guard: on localhost, avoid failing 3 remote CORS preflights to runwal-cp-api
  const isLocalDev =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocalDev && cleanBase.includes('runwal-cp-api.lockated.com')) {
    try {
      const cached =
        localStorage.getItem('sites') ||
        localStorage.getItem('allowed_sites') ||
        localStorage.getItem('hiSocietyApprovedSocieties');
      if (cached) {
        const parsed = JSON.parse(cached);
        const raw = Array.isArray(parsed) ? parsed : parsed.sites || parsed.user_societies || [];
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map((s: any) => ({
            id: String(s.id_society || s.society?.id || s.id),
            name: s.name || s.site_name || s.building_name || s.society?.building_name || `Site ${s.id}`,
            organization_id: s.organization_id,
            company_id: s.company_id,
          }));
        }
      }
    } catch {}
    return DEFAULT_RUNWAL_SITES;
  }

  // 1. Try /pms/sites/allowed_sites.json
  if (cleanBase && userId) {
    try {
      const query = new URLSearchParams();
      if (token) query.set('token', token);
      query.set('user_id', String(userId));
      const projectCodeAllowed = getProjectCodeFromUrl();
      if (projectCodeAllowed) {
        query.set('project_code', projectCodeAllowed);
      } else {
        const appIdAllowed = getAppIdFromUrl();
        if (appIdAllowed) query.set('app_id', appIdAllowed);
      }

      const res = await fetch(`${cleanBase}/pms/sites/allowed_sites.json?${query.toString()}`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data.sites || data.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map((s: any) => ({
            id: String(s.id),
            name: s.name || s.site_name || s.building_name || `Site ${s.id}`,
            organization_id: s.organization_id,
            company_id: s.company_id,
          }));
        }
      }
    } catch (e) {
      console.warn('Could not fetch from /pms/sites/allowed_sites.json', e);
    }
  }

  // 2. Fallback to /pms/sites.json
  if (cleanBase) {
    try {
      const orgId = localStorage.getItem('org_id') || localStorage.getItem('organization_id');
      const query = new URLSearchParams();
      if (token) query.set('token', token);
      if (orgId) query.set('organization_id', orgId);
      const projectCodeSites = getProjectCodeFromUrl();
      if (projectCodeSites) {
        query.set('project_code', projectCodeSites);
      } else {
        const appIdSites = getAppIdFromUrl();
        if (appIdSites) query.set('app_id', appIdSites);
      }

      const res = await fetch(`${cleanBase}/pms/sites.json?${query.toString()}`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data.sites || data.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map((s: any) => ({
            id: String(s.id),
            name: s.name || s.site_name || s.building_name || `Site ${s.id}`,
            organization_id: s.organization_id,
            company_id: s.company_id,
          }));
        }
      }
    } catch (e) {
      console.warn('Could not fetch from /pms/sites.json', e);
    }
  }

  // 3. Fallback to /societies/user_approved_societies.json
  if (cleanBase && token) {
    try {
      const projectCodeSocieties = getProjectCodeFromUrl();
      const appIdSocieties = projectCodeSocieties ? null : getAppIdFromUrl();
      const societiesQuery = `token=${encodeURIComponent(token)}${
        projectCodeSocieties
          ? `&project_code=${encodeURIComponent(projectCodeSocieties)}`
          : appIdSocieties
          ? `&app_id=${encodeURIComponent(appIdSocieties)}`
          : ''
      }`;
      const res = await fetch(`${cleanBase}/societies/user_approved_societies.json?${societiesQuery}`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.user_societies || data.societies || [];
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map((s: any) => ({
            id: String(s.id_society || s.society?.id || s.id),
            name: s.society?.building_name || s.building_name || s.name || `Society ${s.id}`,
            organization_id: s.organization_id,
          }));
        }
      }
    } catch {}
  }

  // 4. Check cached societies in localStorage
  try {
    const cachedApproved = localStorage.getItem('hiSocietyApprovedSocieties');
    if (cachedApproved) {
      const parsed = JSON.parse(cachedApproved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: any) => ({
          id: String(s.id_society || s.society?.id || s.id),
          name: s.society?.building_name || s.building_name || s.name || `Society ${s.id}`,
        }));
      }
    }

    const cachedAccount = localStorage.getItem('hiSocietyAccount');
    if (cachedAccount) {
      const parsed = JSON.parse(cachedAccount);
      const rmSocieties = parsed.rm_societies || (parsed.society ? [parsed.society] : []);
      if (Array.isArray(rmSocieties) && rmSocieties.length > 0) {
        return rmSocieties.map((s: any) => ({
          id: String(s.society_id || s.id),
          name: s.building_name || s.name || `Society ${s.id}`,
        }));
      }
    }

    const cachedSites = localStorage.getItem('sites') || localStorage.getItem('allowed_sites');
    if (cachedSites) {
      const parsed = JSON.parse(cachedSites);
      const raw = Array.isArray(parsed) ? parsed : parsed.sites || [];
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((s: any) => ({
          id: String(s.id),
          name: s.name || s.site_name || `Site ${s.id}`,
        }));
      }
    }
  } catch {}

  // 5. Default fallback to tenant projects so dashboard never fails
  return DEFAULT_RUNWAL_SITES;
}

