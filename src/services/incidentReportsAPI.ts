import { apiClient } from '@/utils/apiClient';
import { getDynamicScopeParams } from './reportScopeParams';

// Per FM-HI-SOCIETY-DASHBOARD-APIS.md § 1 "Incident":
//   GET /api-fm-report/hi-society/incident/incident_kpis   -> KPI totals
//   GET /api-fm-report/hi-society/incident/category_wise   -> top 5 categories
//   GET /api-fm-report/hi-society/incident/level_wise      -> Level 0-3 counts
//   GET /api-fm-report/hi-society/incident/rca_data        -> paginated RCA rows (20/page)
//   GET /api-fm-report/hi-society/incident/body_injury_chart -> body-injury PNG url
//   GET /api-fm-report/hi-society/incident/download        -> CSV
//
// `site_id` and `society_id` are OR'd server-side and `society_id` alone is
// enough, so this module reuses the shared (society-scoped) getDynamicScopeParams.
const BASE_PATH = '/api-fm-report/hi-society/incident';

const RCA_PAGE_SIZE = 20;

export interface IncidentReportDateRange {
  fromDate: Date;
  toDate: Date;
}

export interface IncidentKpis {
  total_incidents: number;
  open: number;
  under_investigation: number;
  closed: number;
  zero_incident_days: number;
  incident_rate: number;
  ltir: number;
}

export interface IncidentKpisResponse {
  success: number;
  message: string;
  response: IncidentKpis;
  info?: string;
}

export interface IncidentNamedCountsResponse {
  success: number;
  message: string;
  response: { name: string; value: number }[];
  info?: string;
}

export type IncidentRcaRow = Record<string, string | number>;

export interface IncidentRcaTableResponse {
  success: number;
  message: string;
  columns: { key: string; label: string }[];
  response: IncidentRcaRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  info?: string;
}

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildParams = (
  { fromDate, toDate }: IncidentReportDateRange,
  extra?: Record<string, string | number>
): Record<string, string | number> => ({
  ...getDynamicScopeParams(),
  from_date: formatDateForAPI(fromDate),
  to_date: formatDateForAPI(toDate),
  ...extra,
});

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const pick = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (obj?.[key] != null) return obj[key];
  }
  return undefined;
};

const humanize = (key: string): string =>
  key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const normalizeKpis = (raw: Record<string, unknown>): IncidentKpis => {
  const r = (raw.response ?? raw) as Record<string, unknown>;
  const status = (pick(r, ['status', 'incident_status', 'statusWise']) ?? {}) as Record<string, unknown>;

  const open = toNumber(pick({ ...r, ...status }, ['open', 'Open', 'open_incidents', 'total_open']));
  const closed = toNumber(pick({ ...r, ...status }, ['closed', 'Closed', 'closed_incidents', 'total_closed']));
  const underInvestigation = toNumber(
    pick({ ...r, ...status }, [
      'under_investigation',
      'underInvestigation',
      'investigation',
      'under_investigations',
    ])
  );
  const totalRaw = pick({ ...r, ...status }, ['total_incidents', 'total', 'totalIncidents', 'count']);

  return {
    total_incidents: totalRaw != null ? toNumber(totalRaw) : open + closed + underInvestigation,
    open,
    under_investigation: underInvestigation,
    closed,
    zero_incident_days: toNumber(
      pick(r, ['zero_incident_days', 'zeroIncidentDays', 'zero_incident_day', 'zero_days'])
    ),
    incident_rate: toNumber(
      pick(r, ['incident_rate', 'incidentRate', 'incident_per_sqft', 'incidentPerSqft', 'rate'])
    ),
    ltir: toNumber(pick(r, ['ltir', 'LTIR', 'lost_time_injury_rate'])),
  };
};

/** Accepts `{ "Label": 12 }` maps, `{ name, value }[]`, `[label, value][]`, `{ labels, values }`. */
const normalizeNamedCounts = (raw: unknown): { name: string; value: number }[] => {
  const payload = raw as Record<string, unknown>;
  const response = payload?.response ?? payload;

  if (Array.isArray(response)) {
    return response.map((item) => {
      if (Array.isArray(item)) return { name: String(item[0] ?? '—'), value: toNumber(item[1]) };
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        name: String(pick(row, ['name', 'label', 'category', 'level', 'title']) ?? '—'),
        value: toNumber(pick(row, ['value', 'count', 'total', 'incidents'])),
      };
    });
  }

  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.labels) && Array.isArray(obj.values ?? obj.data)) {
      const values = (obj.values ?? obj.data) as unknown[];
      return obj.labels.map((label, i) => ({ name: String(label), value: toNumber(values[i]) }));
    }
    return Object.entries(obj)
      .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
      .map(([name, value]) => ({ name: humanize(name), value: toNumber(value) }));
  }

  return [];
};

const RCA_FALLBACK_COLUMNS: { key: string; label: string }[] = [
  { key: 'sr_no', label: 'Sr. No.' },
  { key: 'site', label: 'Site' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'category', label: 'Category' },
  { key: 'level', label: 'Level' },
  { key: 'status', label: 'Status' },
  { key: 'description', label: 'Description' },
  { key: 'rca', label: 'RCA' },
  { key: 'corrective_action', label: 'Corrective Action' },
  { key: 'preventive_action', label: 'Preventive Action' },
];

const normalizeRca = (
  raw: unknown
): { columns: { key: string; label: string }[]; rows: IncidentRcaRow[]; totalPages: number; totalCount: number } => {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const response = payload.response ?? payload;
  const container = (Array.isArray(response) ? { data: response } : (response ?? {})) as Record<string, unknown>;

  const list =
    (Array.isArray(container.data) && container.data) ||
    (Array.isArray(container.rca_data) && container.rca_data) ||
    (Array.isArray(container.rows) && container.rows) ||
    (Array.isArray(container.records) && container.records) ||
    (Array.isArray(payload.data) && payload.data) ||
    [];

  const pagination = (pick(container, ['pagination', 'meta', 'paging']) ??
    pick(payload, ['pagination', 'meta', 'paging']) ??
    {}) as Record<string, unknown>;
  const totalCount = toNumber(
    pick(pagination, ['total_count', 'total', 'totalCount', 'count']) ?? (list as unknown[]).length
  );
  const totalPages = Math.max(
    1,
    toNumber(pick(pagination, ['total_pages', 'totalPages', 'pages'])) ||
      Math.ceil(totalCount / RCA_PAGE_SIZE) ||
      1
  );

  const rawColumns = container.columns ?? container.headers ?? payload.columns;
  let columns: { key: string; label: string }[] = [];
  if (Array.isArray(rawColumns) && rawColumns.length > 0) {
    columns = rawColumns.map((col, i) => {
      if (typeof col === 'string') return { key: col, label: humanize(col) };
      const c = (col ?? {}) as Record<string, unknown>;
      const key = String(c.key ?? c.field ?? c.name ?? c.dataIndex ?? `col_${i}`);
      return { key, label: String(c.label ?? c.title ?? c.header ?? humanize(key)) };
    });
  }

  const rows: IncidentRcaRow[] = (list as unknown[]).map((item, index) => {
    if (Array.isArray(item)) {
      const row: IncidentRcaRow = {};
      item.forEach((val, i) => {
        const key = columns[i]?.key ?? RCA_FALLBACK_COLUMNS[i]?.key ?? `col_${i}`;
        row[key] = val == null || val === '' ? '—' : typeof val === 'number' ? val : String(val);
      });
      return row;
    }
    const obj = (item ?? {}) as Record<string, unknown>;
    const row: IncidentRcaRow = {};
    Object.entries(obj).forEach(([key, val]) => {
      row[key] = val == null || val === '' ? '—' : typeof val === 'number' ? val : String(val);
    });
    if (row.sr_no == null && row['Sr. No.'] == null) row.sr_no = index + 1;
    return row;
  });

  if (columns.length === 0) {
    columns = rows.length > 0 ? Object.keys(rows[0]).map((key) => ({ key, label: humanize(key) })) : RCA_FALLBACK_COLUMNS;
  }

  return { columns, rows, totalPages, totalCount };
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const incidentReportsAPI = {
  async getKpis(range: IncidentReportDateRange): Promise<IncidentKpisResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/incident_kpis`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeKpis(data ?? {}),
      info: data?.info,
    };
  },

  async getCategoryWise(range: IncidentReportDateRange): Promise<IncidentNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/category_wise`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getLevelWise(range: IncidentReportDateRange): Promise<IncidentNamedCountsResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/level_wise`, { params: buildParams(range) });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeNamedCounts(data ?? {}),
      info: data?.info,
    };
  },

  async getRcaData(range: IncidentReportDateRange, page = 1): Promise<IncidentRcaTableResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/rca_data`, { params: buildParams(range, { page }) });
    const { columns, rows, totalPages, totalCount } = normalizeRca(data ?? {});
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      columns,
      response: rows,
      page,
      totalPages,
      totalCount,
      info: data?.info,
    };
  },

  async downloadCsv(range: IncidentReportDateRange): Promise<void> {
    const response = await apiClient.get(`${BASE_PATH}/download`, {
      params: buildParams(range),
      responseType: 'blob',
    });
    triggerDownload(
      response.data as Blob,
      `incident_dashboard-${formatDateForAPI(range.fromDate)}-to-${formatDateForAPI(range.toDate)}.csv`
    );
  },
};
