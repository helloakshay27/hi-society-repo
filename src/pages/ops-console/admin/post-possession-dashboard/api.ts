import { apiClient } from '@/utils/apiClient';
import { isAxiosError } from 'axios';
import type { TabId } from './types';

export type PostPossessionTab =
  | 'allTowers'
  | 'overview'
  | 'helpdesk'
  | 'security'
  | 'staff'
  | 'club'
  | 'fitout'
  | 'parking'
  | 'community';

export interface EndpointResult {
  data?: unknown;
  error?: string;
}

export interface SocietyOption {
  id: string;
  name: string;
}

export type EndpointResults = Record<string, EndpointResult>;

export interface PostPossessionApiState {
  societyId: string | null;
  loading: boolean;
  endpoints: EndpointResults;
}

export const POST_POSSESSION_TAB_BY_DASHBOARD_TAB: Partial<Record<TabId, PostPossessionTab>> = {
  't-lb': 'allTowers',
  't-ov': 'overview',
  't-op': 'helpdesk',
  't-sc': 'security',
  't-st': 'staff',
  't-cl': 'club',
  't-ft': 'fitout',
  't-pk': 'parking',
  't-co': 'community',
};

export const POST_POSSESSION_ENDPOINTS: Record<PostPossessionTab, Record<string, string>> = {
  allTowers: {
    summary: '/all-towers/summary',
  },
  overview: {
    kpis: '/overview/kpi-cards',
    feedbackAndEvents: '/overview/feedback-and-events',
  },
  helpdesk: {
    kpis: '/helpdesk/kpis',
    statusAndType: '/helpdesk/status-and-type-breakdown',
    breachAndAgeing: '/helpdesk/breach-and-ageing',
    sourceAndVolume: '/helpdesk/source-and-volume',
    escalations: '/helpdesk/escalations',
  },
  security: {
    kpis: '/security/kpis',
    visitorComposition: '/security/visitor-composition-and-traffic',
    purposeGateAndVehicles: '/security/purpose-gate-and-vehicle-hourly',
    vehicleKpis: '/security/vehicle-kpis',
    patrolAndFlagged: '/security/patrol-and-flagged',
  },
  staff: {
    kpis: '/staff/kpis',
    coverage: '/staff/coverage-by-category-and-shift',
  },
  club: {
    kpis: '/club-facility/kpis',
    membershipBreakdown: '/club-facility/membership-and-facility-breakdown',
    slotsAndExpiring: '/club-facility/slots-and-expiring-memberships',
  },
  fitout: {
    kpis: '/fitout/kpis',
    outcomes: '/fitout/outcomes-and-financials',
    typeDeviation: '/fitout/type-and-deviation-breakdown',
    approvalSpeed: '/fitout/approval-speed-and-rejection-rates',
    pendingCompliance: '/fitout/pending-requests-and-compliance',
    occupancyByTower: '/fitout/occupancy-by-tower',
  },
  parking: {
    kpis: '/parking/kpis',
    breakdown: '/parking/breakdown',
  },
  community: {
    kpis: '/community/kpis',
    appAdoption: '/community/app-adoption',
    pollsNotifications: '/community/polls-and-notifications',
    quarantineDirectory: '/community/quarantine-and-directory',
  },
};

const BASE_PATH = '/api/post-possession/super-admin';
export interface PostPossessionRequestFilters {
  siteId?: string;
  towerId?: string;
  period?: 'today' | 'this_week' | 'this_month' | 'custom';
  month?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export function getSelectedSocietyId(): string | null {
  const raw =
    localStorage.getItem('selectedSocietyId') ??
    localStorage.getItem('society_id') ??
    '';
  const societyId = raw.trim();
  return /^\d+$/.test(societyId) && Number(societyId) > 0 ? societyId : null;
}

function toSocietyOption(raw: unknown): SocietyOption | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const id = String(item.id ?? '');
  const rawName = item.building_name ?? item.name;
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  return /^\d+$/.test(id) && Number(id) > 0 && name ? { id, name } : null;
}

/**
 * Societies the signed-in user can switch between: the account's company
 * societies (account.json -> society.company_id -> societies/search), always
 * including the account's own society.
 */
export async function fetchAccountSocieties(): Promise<SocietyOption[]> {
  const account = (await apiClient.get('/api/users/account.json')).data as
    | { society?: { id?: unknown; building_name?: unknown; company_id?: unknown } }
    | undefined;
  const ownSociety = toSocietyOption(account?.society);
  const companyId = account?.society?.company_id;

  let companySocieties: SocietyOption[] = [];
  if (companyId) {
    const response = await apiClient.get(`/api/societies/search.json?q[company_id_eq]=${companyId}`);
    const list = response.data?.societies;
    if (Array.isArray(list)) {
      companySocieties = list.flatMap((society: unknown) => {
        const option = toSocietyOption(society);
        return option ? [option] : [];
      });
    }
  }

  const all = ownSociety && !companySocieties.some((s) => s.id === ownSociety.id)
    ? [ownSociety, ...companySocieties]
    : companySocieties;
  return all;
}

export function getSocietyOptions(data: unknown): SocietyOption[] {
  if (typeof data !== 'object' || data === null || !('societies' in data)) return [];
  const societies = data.societies;
  if (!Array.isArray(societies)) return [];

  return societies.flatMap((society: unknown): SocietyOption[] => {
    if (typeof society !== 'object' || society === null || !('id' in society) || !('name' in society)) {
      return [];
    }

    const id = String(society.id);
    const name = typeof society.name === 'string' ? society.name.trim() : '';
    return /^\d+$/.test(id) && Number(id) > 0 && name ? [{ id, name }] : [];
  });
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const responseBody = error.response?.data;
    if (
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'error' in responseBody &&
      typeof responseBody.error === 'string'
    ) {
      return responseBody.error;
    }
    if (error.response?.status) return `Request failed (${error.response.status}).`;
  }
  if (error instanceof Error) return error.message;
  return 'The request failed unexpectedly.';
}

export async function fetchPostPossessionTab(
  tab: PostPossessionTab,
  societyId: string,
  filters: PostPossessionRequestFilters = {},
  endpointKeys?: string[]
): Promise<EndpointResults> {
  const entries = Object.entries(POST_POSSESSION_ENDPOINTS[tab]).filter(
    ([key]) => !endpointKeys || endpointKeys.includes(key)
  );
  const params = {
    society_id: societyId,
    site_id: filters.siteId,
    tower_id: filters.towerId,
    period: filters.period,
    month: filters.month,
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
  };
  const responses = await Promise.all(
    entries.map(async ([key, path]) => {
      try {
        const endpointParams = {
          ...params,
          ...(tab === 'overview' && key === 'feedbackAndEvents'
            ? { page: filters.page, per_page: filters.perPage }
            : {}),
        };
        const response = await apiClient.get(`${BASE_PATH}${path}`, {
          params: endpointParams,
        });
        return [key, { data: response.data }] as const;
      } catch (error) {
        return [key, { error: getErrorMessage(error) }] as const;
      }
    })
  );
  return Object.fromEntries(responses);
}

export interface TowerOption {
  id: string;
  name: string;
}

/** Towers (society blocks) of a society — same API the Manage Users page uses. */
export async function fetchSocietyTowers(societyId: string): Promise<TowerOption[]> {
  const response = await apiClient.get('/get_society_blocks.json', { params: { society_id: societyId } });
  const blocks = response.data?.society_blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks.flatMap((block: unknown): TowerOption[] => {
    if (typeof block !== 'object' || block === null) return [];
    const item = block as Record<string, unknown>;
    const id = String(item.id ?? '');
    const rawName = item.name ?? item.block_no;
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    return id && name ? [{ id, name }] : [];
  });
}

export async function fetchPostPossessionFilters(societyId?: string | null): Promise<EndpointResult> {
  try {
    // Without society_id the API returns an empty towers[] (and no site)
    const response = await apiClient.get(`${BASE_PATH}/filters`, {
      params: societyId ? { society_id: societyId } : undefined,
    });
    return { data: response.data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export function createEndpointErrors(tab: PostPossessionTab, message: string): EndpointResults {
  return Object.fromEntries(
    Object.keys(POST_POSSESSION_ENDPOINTS[tab]).map((key) => [key, { error: message }])
  );
}
