import { API_CONFIG } from '@/config/apiConfig';

/**
 * Legacy FM dashboard cards ported to Hi-Society.
 * See HI_SOCIETY_LEGACY_CARDS_API.md.
 *
 * Base host is fixed to production Hi-Society. These six routes are not on the
 * tenant base URL used by the rest of the app.
 */
const LEGACY_CARDS_BASE_URL = 'https://hi-society.lockated.com';

export interface LegacyDateRange {
  fromDate: Date;
  toDate: Date;
}

/** Status buckets from `GET /api-fm-report/hi-society/checklist/summary`. */
export interface ChecklistSummary {
  closed: number;
  open: number;
  workInProgress: number;
  overdue: number;
  info?: string;
}

/** `GET /api-fm-report/hi-society/incident/ltir` — `response` is the rate. */
export interface LtirSummary {
  value: number;
  injuries: number;
  workHours: number;
}

/** `GET /api-fm-report/hi-society/incident/safe_man_hours`. */
export interface SafeManHoursSummary {
  value: number;
}

/** `GET /api-fm-report/hi-society/incident/near_miss_good_catch`. */
export interface NearMissSummary {
  value: number;
  area: number;
  incidents: number;
}

/** One slice of `GET /api-fm-report/hi-society/incident/cause_wise`. */
export interface CauseWiseRow {
  name: string;
  count: number;
}

/** One company from `GET /api-fm-report/hi-society/incident/service_partner_evaluation`. */
export interface ServicePartnerRow {
  name: string;
  score: number;
}

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isUsableId = (value: unknown): boolean => {
  if (value == null) return false;
  const text = `${value}`.trim();
  return text !== '' && text !== '0' && text.toLowerCase() !== 'null' && text.toLowerCase() !== 'undefined';
};

const asId = (value: unknown): string | null => (isUsableId(value) ? `${value}`.trim() : null);

const readStoredObject = (key: string): Record<string, unknown> | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const nested = (obj: Record<string, unknown> | null, key: string): Record<string, unknown> | null => {
  const value = obj?.[key];
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
};

/**
 * `site_id` and `society_id` for the legacy cards.
 * Site: the site switcher, then the signed-in account payload.
 * Society: `selectedSocietyId` (the society's id, written by the header), then the account's society.
 */
const getScopeIds = (): { siteId: string | null; societyId: string | null } => {
  const account = readStoredObject('hiSocietyAccount');
  const user = readStoredObject('user');
  const accountSociety = nested(account, 'society');
  const userSociety = nested(user, 'society');

  const selectedSite = nested(account, 'selected_site') ?? nested(user, 'selected_site');

  const siteId =
    asId(localStorage.getItem('selectedSiteId')) ??
    asId(localStorage.getItem('site_id')) ??
    asId(account?.site_id) ??
    asId(account?.pms_site_id) ??
    asId(accountSociety?.pms_site_id) ??
    asId(accountSociety?.site_id) ??
    asId(selectedSite?.id) ??
    asId(user?.site_id) ??
    asId(user?.pms_site_id) ??
    asId(localStorage.getItem('allSiteIds'));

  const societyId =
    asId(localStorage.getItem('selectedSocietyId')) ??
    asId(accountSociety?.id) ??
    asId(account?.society_id) ??
    asId(account?.id_society) ??
    asId(userSociety?.id) ??
    asId(user?.society_id);

  return { siteId, societyId };
};

const getAuthToken = (): string | null => {
  try {
    if (API_CONFIG.TOKEN) return API_CONFIG.TOKEN;
  } catch {
    // ignore
  }
  const stored = localStorage.getItem('token');
  if (stored) return stored;
  const user = readStoredObject('user');
  return asId(user?.spree_api_key);
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const pickBucket = (source: Record<string, unknown>, aliases: string[]): number => {
  const wanted = new Set(aliases.map((alias) => alias.toLowerCase()));
  for (const [key, value] of Object.entries(source)) {
    if (wanted.has(key.trim().toLowerCase())) return toNumber(value);
  }
  return 0;
};

const infoText = (raw: Record<string, unknown>): string | undefined => {
  const info = raw.info;
  if (typeof info === 'string' && info.trim()) return info.trim();
  if (info && typeof info === 'object') {
    const text = (info as Record<string, unknown>).info;
    if (typeof text === 'string' && text.trim()) return text.trim();
  }
  return undefined;
};

const buildUrl = (path: string, query: Record<string, string | null | undefined>): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== '') params.set(key, value);
  }
  const qs = params.toString();
  return `${LEGACY_CARDS_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
};

const getJson = async (path: string, query: Record<string, string | null | undefined>): Promise<Record<string, unknown>> => {
  const token = getAuthToken();
  const response = await fetch(buildUrl(path, query), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let body: Record<string, unknown> = {};
  try {
    const parsed = (await response.json()) as unknown;
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
  } catch {
    body = {};
  }

  if (!response.ok || body.success === 0) {
    const message =
      (typeof body.message === 'string' && body.message) ||
      (typeof body.error === 'string' && body.error) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
};

const dateQuery = ({ fromDate, toDate }: LegacyDateRange) => ({
  from_date: formatDateForAPI(fromDate),
  to_date: formatDateForAPI(toDate),
});

const mapChecklist = (raw: Record<string, unknown>): ChecklistSummary => {
  const response = (raw.response ?? {}) as Record<string, unknown>;
  const nestedChecklist = response.Checklist ?? response.checklist;
  const buckets =
    nestedChecklist && typeof nestedChecklist === 'object'
      ? (nestedChecklist as Record<string, unknown>)
      : response;

  return {
    closed: pickBucket(buckets, ['closed']),
    open: pickBucket(buckets, ['open']),
    workInProgress: pickBucket(buckets, ['work in progress', 'work_in_progress', 'wip', 'in progress']),
    overdue: pickBucket(buckets, ['overdue']),
    info: infoText(raw),
  };
};

const mapCauseWise = (raw: Record<string, unknown>): CauseWiseRow[] => {
  const response = raw.response;
  if (!Array.isArray(response)) return [];
  return response.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const name = row.name == null || `${row.name}`.trim() === '' ? 'Unspecified' : `${row.name}`;
    return { name, count: toNumber(row.y ?? row.value ?? row.count) };
  });
};

const mapServicePartners = (raw: Record<string, unknown>): ServicePartnerRow[] => {
  const scores = raw.average_scores;
  if (!scores || typeof scores !== 'object' || Array.isArray(scores)) return [];
  return Object.entries(scores as Record<string, unknown>).map(([name, score]) => ({
    name,
    score: toNumber(score),
  }));
};

export const hiSocietyLegacyCardsAPI = {
  /** Checklist status totals. Requires `site_id` plus the dashboard date range. */
  async getChecklistSummary(range: LegacyDateRange): Promise<ChecklistSummary> {
    const { siteId, societyId } = getScopeIds();
    const data = await getJson('/api-fm-report/hi-society/checklist/summary', {
      site_id: siteId,
      society_id: societyId,
      ...dateQuery(range),
    });
    return mapChecklist(data);
  },

  /** Lost Time Injury Rate. Dates are ignored by the API; window is the last 365 days. */
  async getLtir(): Promise<LtirSummary> {
    const { siteId, societyId } = getScopeIds();
    const data = await getJson('/api-fm-report/hi-society/incident/ltir', {
      site_id: siteId,
      society_id: societyId,
    });
    return {
      value: toNumber(data.response),
      injuries: toNumber(data.injuries),
      workHours: toNumber(data.work),
    };
  },

  /** Hours worked after the latest lost-time injury. Dates are ignored. */
  async getSafeManHours(): Promise<SafeManHoursSummary> {
    const { siteId, societyId } = getScopeIds();
    const data = await getJson('/api-fm-report/hi-society/incident/safe_man_hours', {
      site_id: siteId,
      society_id: societyId,
    });
    return { value: toNumber(data.response) };
  },

  /** Level-0 incidents per million sq ft per annum. Dates are ignored. */
  async getNearMiss(): Promise<NearMissSummary> {
    const { siteId, societyId } = getScopeIds();
    const data = await getJson('/api-fm-report/hi-society/incident/near_miss_good_catch', {
      site_id: siteId,
      society_id: societyId,
    });
    return {
      value: toNumber(data.response),
      area: toNumber(data.area),
      incidents: toNumber(data.incidents),
    };
  },

  /** First root-cause groups in the selected date range. Requires `society_id`. */
  async getCauseWise(range: LegacyDateRange): Promise<CauseWiseRow[]> {
    const { societyId } = getScopeIds();
    const data = await getJson('/api-fm-report/hi-society/incident/cause_wise', {
      society_id: societyId,
      ...dateQuery(range),
    });
    return mapCauseWise(data);
  },

  /** Average audit score per supplier. Requires `site_id` and the date range. */
  async getServicePartnerEvaluation(range: LegacyDateRange): Promise<ServicePartnerRow[]> {
    const { siteId } = getScopeIds();
    const data = await getJson('/api-fm-report/hi-society/incident/service_partner_evaluation', {
      site_id: siteId,
      ...dateQuery(range),
    });
    return mapServicePartners(data);
  },
};
