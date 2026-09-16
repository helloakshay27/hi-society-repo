import axios from 'axios';

/**
 * Manage Users stats for the Hi-Society Dashboard's "Manage Users" tab.
 *
 * Uses the exact same endpoint as `src/pages/ManageUsersPage.tsx`:
 *   GET https://<baseUrl>/crm/admin/user_societies.json
 * whose payload carries a `dashboard` block with all ten counters, plus
 *   GET https://<baseUrl>/crm/admin/user_societies.xlsx?<filter>
 * for the per-card XLSX exports.
 *
 * Unlike the asset / checklist dashboard services, this one is NOT pinned to a
 * hardcoded host — it reads `localStorage.baseUrl` exactly like ManageUsersPage,
 * so the tab always reports on the tenant the user is signed in to.
 */

/** The `dashboard` block returned alongside the user list. */
export interface ManageUsersDashboard {
  total_users: number;
  pending_users: number;
  approved_users: number;
  rejected_users: number;
  app_downloads: number;
  total_flat_downloads: number;
  total_owner_downloads: number;
  total_tenant_downloads: number;
  post_sale_downloads: number;
  post_possession_downloads: number;
}

export const EMPTY_MANAGE_USERS_DASHBOARD: ManageUsersDashboard = {
  total_users: 0,
  pending_users: 0,
  approved_users: 0,
  rejected_users: 0,
  app_downloads: 0,
  total_flat_downloads: 0,
  total_owner_downloads: 0,
  total_tenant_downloads: 0,
  post_sale_downloads: 0,
  post_possession_downloads: 0,
};

export interface ManageUsersDateRange {
  fromDate: Date;
  toDate: Date;
}

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** `localStorage.baseUrl` is stored bare (no scheme) in this app, but tolerate either. */
const getApiOrigin = (): string | null => {
  const raw = localStorage.getItem('baseUrl');
  if (!raw || !raw.trim()) return null;
  const host = raw.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return host ? `https://${host}` : null;
};

const getToken = (): string | null => localStorage.getItem('token');

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeDashboard = (raw: unknown): ManageUsersDashboard => {
  const d = (raw ?? {}) as Record<string, unknown>;
  return {
    total_users: toNumber(d.total_users),
    pending_users: toNumber(d.pending_users),
    approved_users: toNumber(d.approved_users),
    rejected_users: toNumber(d.rejected_users),
    app_downloads: toNumber(d.app_downloads),
    total_flat_downloads: toNumber(d.total_flat_downloads),
    total_owner_downloads: toNumber(d.total_owner_downloads),
    total_tenant_downloads: toNumber(d.total_tenant_downloads),
    post_sale_downloads: toNumber(d.post_sale_downloads),
    post_possession_downloads: toNumber(d.post_possession_downloads),
  };
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const manageUsersDashboardAPI = {
  /**
   * Reads the `dashboard` counters off the user-societies list endpoint, scoped to
   * the dashboard's date range via `from_date` / `to_date` — the same param pair
   * every other Tickets Dashboard report call uses.
   */
  async getDashboard(range: ManageUsersDateRange): Promise<ManageUsersDashboard> {
    const origin = getApiOrigin();
    const token = getToken();
    if (!origin || !token) throw new Error('Missing base URL or auth token');

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('from_date', formatDateForAPI(range.fromDate));
    params.set('to_date', formatDateForAPI(range.toDate));

    const { data } = await axios.get(`${origin}/crm/admin/user_societies.json?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return normalizeDashboard(data?.dashboard);
  },

  /**
   * Per-card XLSX export. `endpoint` is the path+query used by the matching
   * StatsCard on ManageUsersPage, e.g.
   * `/crm/admin/user_societies.xlsx?q[approve_eq]=true`.
   *
   * The dashboard's `from_date` / `to_date` are appended so the exported file covers
   * the same window as the tile it was downloaded from.
   */
  async downloadExport(
    endpoint: string,
    fileName: string,
    range: ManageUsersDateRange
  ): Promise<void> {
    const origin = getApiOrigin();
    const token = getToken();
    if (!origin || !token) throw new Error('Missing base URL or auth token');

    const dates = `from_date=${formatDateForAPI(range.fromDate)}&to_date=${formatDateForAPI(range.toDate)}`;
    const url = `${origin}${endpoint}${endpoint.includes('?') ? '&' : '?'}${dates}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });

    triggerDownload(new Blob([response.data]), fileName);
  },
};
