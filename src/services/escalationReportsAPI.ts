import { apiClient } from '@/utils/apiClient';
import type { TicketReportDateRange } from './ticketReportsAPI';

// Per FM-HI-SOCIETY-DASHBOARD-APIS.md § 2 "Escalation":
//   GET /api-fm-report/hi-society/escalation/escalation_kpi   -> open/closed/average_ageing
//   GET /api-fm-report/hi-society/escalation/escalation_table -> paginated row list
// Note the singular "escalation" segment (the old BASE_PATH used the plural
// "escalations", which doesn't exist on the backend).
const BASE_PATH = '/api-fm-report/hi-society/escalation';

export interface EscalationOverviewResponse {
  success: number;
  message: string;
  response: {
    open: number;
    closed: number;
    average_ageing: number;
  };
  info?: string;
}

export interface ExecutiveEscalationRow {
  ticket_number: string;
  description: string;
  community_head: string;
  category: string;
  sub_category: string;
  ticket_status: string;
  created_on: string;
  flat: string;
}

export interface ExecutiveEscalationTableResponse {
  success: number;
  message: string;
  response: ExecutiveEscalationRow[];
  info?: string;
}

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDynamicScopeParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  const siteId = localStorage.getItem('selectedSiteId');
  const societyId = localStorage.getItem('selectedSocietyId') || localStorage.getItem('selectedUserSociety');
  if (siteId) params.site_id = siteId;
  if (societyId) params.society_id = societyId;
  return params;
};

const buildParams = ({ fromDate, toDate }: TicketReportDateRange): Record<string, string> => ({
  ...getDynamicScopeParams(),
  from_date: formatDateForAPI(fromDate),
  to_date: formatDateForAPI(toDate),
});

// escalation_table is paginated server-side (default page=1, per_page=20, max 100).
// The widget renders a single flat list, so request the max page size instead of
// adding pagination UI.
const ESCALATION_TABLE_PER_PAGE = 100;

const normalizeOverview = (raw: Record<string, unknown>): EscalationOverviewResponse['response'] => {
  const response = (raw.response ?? raw) as Record<string, unknown>;
  const open = Number(response.open ?? response.Open ?? 0);
  const closed = Number(response.closed ?? response.Closed ?? 0);
  const averageRaw = response.average_ageing ?? response.average ?? response.Average ?? raw.response;
  const average_ageing = typeof averageRaw === 'number' || typeof averageRaw === 'string' ? Number(averageRaw) : 0;
  return {
    open: Number.isFinite(open) ? open : 0,
    closed: Number.isFinite(closed) ? closed : 0,
    average_ageing: Number.isFinite(average_ageing) ? average_ageing : 0,
  };
};

const cell = (row: unknown, index: number): string => {
  if (Array.isArray(row)) {
    const value = row[index];
    return value == null || value === '' ? '—' : String(value);
  }
  return '—';
};

const normalizeTableRows = (raw: unknown): ExecutiveEscalationRow[] => {
  const payload = raw as Record<string, unknown>;
  const response = payload?.response as Record<string, unknown> | unknown[] | undefined;
  // Accept a bare array, a `{ response: [...] }` envelope, or a paginated
  // `{ response: { data: [...], pagination: {...} } }` envelope.
  const list = (Array.isArray(response) ? response : (response as Record<string, unknown>)?.data)
    ?? payload?.data
    ?? payload;
  if (!Array.isArray(list)) return [];

  return list.map((item) => {
    if (Array.isArray(item)) {
      // FM table columns: [ticket, description, community_head, category, sub_category, status, created_on, ?, flat]
      return {
        ticket_number: cell(item, 0),
        description: cell(item, 1),
        community_head: cell(item, 2),
        category: cell(item, 3),
        sub_category: cell(item, 4),
        ticket_status: cell(item, 5),
        created_on: cell(item, 6),
        flat: cell(item, 8),
      };
    }

    const row = (item ?? {}) as Record<string, unknown>;
    return {
      ticket_number: String(row.ticket_number ?? row.ticketNumber ?? '—'),
      description: String(row.description ?? '—'),
      community_head: String(row.community_head ?? row.communityHead ?? '—'),
      category: String(row.category ?? '—'),
      sub_category: String(row.sub_category ?? row.subCategory ?? '—'),
      ticket_status: String(row.ticket_status ?? row.ticketStatus ?? row.status ?? '—'),
      created_on: String(row.created_on ?? row.createdOn ?? '—'),
      flat: String(row.flat ?? '—'),
    };
  });
};

export const escalationReportsAPI = {
  async getOverview(range: TicketReportDateRange): Promise<EscalationOverviewResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/escalation_kpi`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeOverview(data ?? {}),
      info: data?.info,
    };
  },

  async getExecutiveTable(range: TicketReportDateRange): Promise<ExecutiveEscalationTableResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/escalation_table`, {
      params: { ...buildParams(range), page: 1, per_page: ESCALATION_TABLE_PER_PAGE },
    });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeTableRows(data ?? {}),
      info: data?.info,
    };
  },
};
