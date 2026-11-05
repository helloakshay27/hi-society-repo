import { apiClient } from '@/utils/apiClient';
import { getUser } from '@/utils/auth';

/**
 * /dashboard_layouts — per-user saved dashboard cards (same resource the FM Matrix
 * "My Dashboard" uses). Rows are scoped by `preffered_by` (user id) and `type`.
 */
export const DASHBOARD_LAYOUT_TYPE = 'Hi Society Dashboard';

/**
 * Static base URL for the dashboard_layouts API for now (the Hi Society backend doesn't serve it).
 * Absolute URLs are used on purpose: apiClient's interceptor overrides `baseURL` per request.
 */
export const DASHBOARD_LAYOUT_BASE_URL = 'https://lockated-api.gophygital.work';
const LAYOUTS_URL = `${DASHBOARD_LAYOUT_BASE_URL}/dashboard_layouts`;

export interface DashboardLayoutRecord {
  id: number;
  chart_code: string | null;
  height: string | null;
  width: string | null;
  position: string | null;
  preffered_by: number | null;
  type: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardLayoutPayload {
  chart_code: string;
  height: string;
  width: string;
  position: string;
}

export function getCurrentUserId(): number | null {
  try {
    const id = getUser()?.id;
    return typeof id === 'number' && Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

/** Always scope by the current user: show/update/destroy work on any row id regardless of owner. */
export async function fetchDashboardLayouts(preferredBy: number): Promise<DashboardLayoutRecord[]> {
  const response = await apiClient.get(LAYOUTS_URL, {
    params: { 'q[preffered_by_eq]': preferredBy, 'q[type_eq]': DASHBOARD_LAYOUT_TYPE },
  });
  const rows = response.data?.dashboard_layouts;
  return Array.isArray(rows) ? rows : [];
}

export async function createDashboardLayout(payload: DashboardLayoutPayload): Promise<DashboardLayoutRecord> {
  const preferredBy = getCurrentUserId();
  const response = await apiClient.post(LAYOUTS_URL, {
    dashboard_layout: {
      ...payload,
      type: DASHBOARD_LAYOUT_TYPE,
      ...(preferredBy ? { preffered_by: preferredBy } : {}),
    },
  });
  return response.data?.dashboard_layout;
}

export async function updateDashboardLayout(
  id: number,
  payload: DashboardLayoutPayload
): Promise<DashboardLayoutRecord> {
  const response = await apiClient.patch(`${LAYOUTS_URL}/${id}`, {
    dashboard_layout: { ...payload, type: DASHBOARD_LAYOUT_TYPE },
  });
  return response.data?.dashboard_layout;
}

export async function deleteDashboardLayout(id: number): Promise<void> {
  await apiClient.delete(`${LAYOUTS_URL}/${id}`);
}
