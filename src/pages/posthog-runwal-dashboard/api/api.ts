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
  return (
    (import.meta as any).env?.VITE_FM_ADOPTION_API_URL ||
    (import.meta as any).env?.VITE_POSTHOG_API_URL ||
    localStorage.getItem('posthog_api_url') ||
    'https://posthog-api.lockated.com'
  );
}

/** Read the `app_id` query param off the current URL (e.g. /posthog-runwal-dashboard?app_id=35). */
export function getAppIdFromUrl(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('app_id');
  } catch {
    return null;
  }
}

/**
 * Read the `project_code` query param off the current URL (e.g.
 * /posthog-runwal-cp-dashboard?project_code=RE-CP01). Runwal CP identifies
 * itself this way instead of by app_id — mirrors getAppIdFromUrl() above.
 */
export function getProjectCodeFromUrl(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('project_code');
  } catch {
    return null;
  }
}

export function getDynamicTenantUrl(): string {
  const baseUrl = localStorage.getItem('baseUrl') || '';
  return baseUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function getDeviceParams(dev: DashboardFilters['devPlatform']): Record<string, string> {
  if (dev === 'ios') return { os: 'ios' };
  if (dev === 'android') return { os: 'Android' };
  return { device_type: 'Mobile' };
}

function buildPosthogQuery(filters: DashboardFilters, extra: Record<string, any> = {}): string {
  const parts: string[] = [];

  // const tenantUrl = (filters.url || getDynamicTenantUrl()).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  // parts.push(`base_url=${encodeURIComponent(tenantUrl)}`);

  if (filters.from) parts.push(`from=${encodeURIComponent(filters.from)}`);
  if (filters.to) parts.push(`to=${encodeURIComponent(filters.to)}`);

  for (const [k, v] of Object.entries(getDeviceParams(filters.devPlatform))) {
    parts.push(`${k}=${encodeURIComponent(v)}`);
  }

  // Runwal CP has no app_id at all — it identifies itself by project_code
  // instead, so (absent an explicit filters.appId) the two stay mutually
  // exclusive on the wire. A dashboard that explicitly sets both (e.g. My
  // Piramal, which sends project_code=PIR-01 and app_id=30 together) gets
  // both regardless.
  const projectCode = filters.projectCode || getProjectCodeFromUrl();
  if (projectCode) {
    parts.push(`project_code=${encodeURIComponent(projectCode)}`);
  }
  if (filters.appId) {
    parts.push(`app_id=${encodeURIComponent(filters.appId)}`);
  } else if (!projectCode) {
    const appId = getAppIdFromUrl();
    if (appId) parts.push(`app_id=${encodeURIComponent(appId)}`);
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

async function getPosthog<T>(endpoint: string, queryStr: string): Promise<T> {
  const base = getPosthogApiBase();
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const url = `${cleanBase}/fm/adoption/${endpoint}?${queryStr}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PostHog API error (${response.status}): ${response.statusText || 'Failed to fetch'}`);
  }

  return response.json() as Promise<T>;
}

export const fetchTrafficSession = (filters: DashboardFilters) =>
  getPosthog<TrafficSessionResponse>('traffic_session', buildPosthogQuery(filters));

export const fetchUsageAndDistribution = (filters: DashboardFilters) =>
  getPosthog<UsageDistributionResponse>('usage_and_distribution', buildPosthogQuery(filters));

export const fetchAdoptionEngagement = (filters: DashboardFilters) =>
  getPosthog<AdoptionEngagementResponse>(
    'adoption_engagement',
    buildPosthogQuery(filters, {
      licensed_seats: filters.licensedSeats || undefined,
    })
  );

export const fetchAdoptionTrend = (filters: DashboardFilters) =>
  getPosthog<AdoptionTrendResponse>('adoption_trend', buildPosthogQuery(filters, { weeks: 8 }));

export const fetchGrowth = (filters: DashboardFilters) =>
  getPosthog<GrowthResponse>('growth', buildPosthogQuery(filters, { weeks: 6 }));

export const fetchRetention = (filters: DashboardFilters) =>
  getPosthog<RetentionResponse>('retention', buildPosthogQuery(filters, { weeks: 8 }));

export const fetchRoles = (filters: DashboardFilters) =>
  getPosthog<RolesResponse>('roles', buildPosthogQuery(filters));

export const fetchModules = (filters: DashboardFilters, module?: string | null) =>
  getPosthog<ModulesResponse>('modules', buildPosthogQuery(filters, { module: module || undefined }));

export const fetchWorkflowUsage = (
  filters: DashboardFilters,
  module?: string | null,
  subModule?: string | null
) =>
  getPosthog<WorkflowUsageResponse>(
    'workflow_usage',
    buildPosthogQuery(filters, {
      module: module || undefined,
      sub_module: subModule || undefined,
    })
  );

/** Latest identified active users + the path/screen each is on. No `from`/`to` = today ("currently active"). */
export const fetchRecentActiveUsers = (filters: DashboardFilters, limit = 10) =>
  getPosthog<RecentActiveUsersResponse>('recent_active_users', buildPosthogQuery(filters, { limit }));

/**
 * Downloads the `.xlsx` workbook of every active user in the filtered scope
 * (uncapped — `limit` is ignored server-side unless passed deliberately) and
 * saves it via a throwaway anchor, mirroring the blob-download pattern used
 * elsewhere in the app (see WalletTopup.tsx's handleExport).
 */
export async function downloadActiveUsersExport(filters: DashboardFilters): Promise<void> {
  const base = getPosthogApiBase();
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const queryStr = buildPosthogQuery(filters);
  const url = `${cleanBase}/fm/adoption/active_users_export?${queryStr}`;

  const response = await fetch(url, { method: 'GET', headers: { Accept: '*/*' } });
  if (!response.ok) {
    throw new Error(`Active users export failed (${response.status}): ${response.statusText || 'Failed to fetch'}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filename = match
    ? decodeURIComponent(match[1])
    : `active_users_${filters.from || 'today'}_to_${filters.to || 'today'}.xlsx`;

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
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

  const baseUrl = getApiBaseUrl();
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${cleanBase}${cleanPath}?${query.toString()}`;

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

