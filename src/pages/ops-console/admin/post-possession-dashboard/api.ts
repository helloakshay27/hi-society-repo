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
const EXTENDED_API_DATE_RANGE = {
  date_from: '2020-01-01',
  date_to: '2026-11-30',
} as const;

export interface PostPossessionRequestFilters {
  siteId?: string;
  towerId?: string;
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
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
  };
  const responses = await Promise.all(
    entries.map(async ([key, path]) => {
      try {
        const endpointParams = {
          ...params,
          ...((tab === 'allTowers' ||
            tab === 'security' ||
            tab === 'club' ||
            tab === 'fitout' ||
            tab === 'parking' ||
            tab === 'community' ||
            tab === 'staff' ||
            (tab === 'helpdesk' &&
              ['kpis', 'statusAndType', 'breachAndAgeing', 'sourceAndVolume'].includes(key)))
            ? EXTENDED_API_DATE_RANGE
            : {}),
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

export async function fetchPostPossessionFilters(): Promise<EndpointResult> {
  try {
    const response = await apiClient.get(`${BASE_PATH}/filters`);
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
