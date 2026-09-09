import { apiClient } from '@/utils/apiClient';

// Per FM-HI-SOCIETY-DASHBOARD-APIS.md § 3 "Checklist". These routes are NOT
// nested under a module segment — they sit directly under /api-fm-report/hi-society:
//   GET /get-chart-technical-checklist-monthly       -> technical checklist chart + table
//   GET /get-chart-non-technical-checklist-monthly   -> non-technical checklist chart + table
//   GET /get-top-ten-checklist                       -> top 10 checklist types
//   GET /get-site-wise-checklist                     -> site-wise checklist status
//   GET /get-chart-checklist-download                -> combined XLSX
//   GET /get-chart-technical-checklist-download      -> technical XLSX
//   GET /get-chart-non-technical-checklist-download  -> non-technical XLSX
//   GET /get-top-ten-checklist-download              -> top 10 XLSX (also accepts society_id)
//
// Scoped by `site_id` in practice (`society_id` is only honoured by
// get-top-ten-checklist-download), so this module resolves `site_id` locally the
// same way assetReportsAPI does, rather than using the society-scoped
// getDynamicScopeParams helper.
const BASE_PATH = '/api-fm-report/hi-society';

export interface ChecklistReportDateRange {
  fromDate: Date;
  toDate: Date;
}

export interface ChecklistStatusRow {
  name: string;
  open: number;
  closed: number;
  wip: number;
  overdue: number;
  total: number;
}

export interface ChecklistStatusResponse {
  success: number;
  message: string;
  chart: { name: string; value: number }[];
  response: ChecklistStatusRow[];
  info?: string;
}

export interface ChecklistTopTenRow {
  rank: number;
  type: string;
  count: number;
}

export interface ChecklistTopTenResponse {
  success: number;
  message: string;
  response: ChecklistTopTenRow[];
  info?: string;
}

export type ChecklistExportKind = 'combined' | 'technical' | 'non_technical' | 'top_ten';

const EXPORT_PATHS: Record<ChecklistExportKind, string> = {
  combined: 'get-chart-checklist-download',
  technical: 'get-chart-technical-checklist-download',
  non_technical: 'get-chart-non-technical-checklist-download',
  top_ten: 'get-top-ten-checklist-download',
};

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isUsableId = (value: unknown): value is string | number =>
  value != null && `${value}`.trim() !== '' && `${value}` !== '0';

/** Checklist needs `site_id` — explicit site selection, then the account payload. */
const getChecklistSiteId = (): string | null => {
  const selected = localStorage.getItem('selectedSiteId');
  if (isUsableId(selected)) return selected as string;
  for (const key of ['hiSocietyAccount', 'user']) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { site_id?: unknown };
      if (isUsableId(parsed?.site_id)) return `${parsed.site_id}`;
    } catch {
      // ignore malformed cache entries
    }
  }
  return null;
};

const buildParams = (
  { fromDate, toDate }: ChecklistReportDateRange,
  extra?: Record<string, string | number>
): Record<string, string | number> => {
  const siteId = getChecklistSiteId();
  return {
    ...(siteId ? { site_id: siteId } : {}),
    from_date: formatDateForAPI(fromDate),
    to_date: formatDateForAPI(toDate),
    ...extra,
  };
};

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

const ACRONYMS = new Set(['ppm', 'amc', 'wip', 'fm', 'sla', 'tat']);

/** "Ppm" -> "PPM", "work_in_progress" -> "Work In Progress". */
const prettifyName = (key: string): string => {
  const cleaned = key.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  if (ACRONYMS.has(cleaned.toLowerCase())) return cleaned.toUpperCase();
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
};

const STATUS_FIELD_HINTS = ['open', 'closed', 'wip', 'work_in_progress', 'in_progress', 'overdue', 'total'];

/** A `{ open, closed, work_in_progress, overdue }`-style status bucket. */
const isStatusRecord = (value: unknown): value is Record<string, unknown> =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value as Record<string, unknown>).some((k) =>
    STATUS_FIELD_HINTS.includes(k.toLowerCase().replace(/\s+/g, '_'))
  );

const rowFromRecord = (name: string, row: Record<string, unknown>): ChecklistStatusRow => {
  const open = toNumber(pick(row, ['open', 'Open', 'open_count', 'openCount']));
  const closed = toNumber(pick(row, ['closed', 'Closed', 'closed_count', 'closedCount']));
  const wip = toNumber(
    pick(row, ['wip', 'WIP', 'work_in_progress', 'in_progress', 'inProgress', 'wip_count'])
  );
  const overdue = toNumber(pick(row, ['overdue', 'Overdue', 'overdue_count', 'overdueCount']));
  const totalRaw = pick(row, ['total', 'Total', 'total_count', 'totalCount']);
  return {
    name,
    open,
    closed,
    wip,
    overdue,
    total: totalRaw != null ? toNumber(totalRaw) : open + closed + wip + overdue,
  };
};

const asList = (raw: unknown): unknown[] => {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const response = payload.response ?? payload;
  const container = (Array.isArray(response) ? { data: response } : (response ?? {})) as Record<string, unknown>;
  return (
    (Array.isArray(container.data) && container.data) ||
    (Array.isArray(container.table) && container.table) ||
    (Array.isArray(container.rows) && container.rows) ||
    (Array.isArray(container.records) && container.records) ||
    (Array.isArray(payload.data) && payload.data) ||
    (Array.isArray(payload.table) && payload.table) ||
    []
  );
};

const normalizeStatusRows = (raw: unknown): ChecklistStatusRow[] => {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const response = payload.response ?? payload;

  // Shape from get-chart-(non-)technical-checklist-monthly:
  //   { response: { "Routine": { open, closed, work_in_progress, overdue }, "Ppm": {...} } }
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const recordEntries = Object.entries(response as Record<string, unknown>).filter(([, v]) =>
      isStatusRecord(v)
    );
    if (recordEntries.length > 0) {
      return recordEntries.map(([name, v]) => rowFromRecord(prettifyName(name), v as Record<string, unknown>));
    }
  }

  // Fallback: array envelopes ({ response: [...] } / { table: [...] } / bare rows).
  return asList(raw).map((item) => {
    if (Array.isArray(item)) {
      const open = toNumber(item[1]);
      const closed = toNumber(item[2]);
      const wip = toNumber(item[3]);
      const overdue = toNumber(item[4]);
      return {
        name: String(item[0] ?? '—'),
        open,
        closed,
        wip,
        overdue,
        total: item[5] != null ? toNumber(item[5]) : open + closed + wip + overdue,
      };
    }
    const row = (item ?? {}) as Record<string, unknown>;
    const name = String(
      pick(row, ['category', 'Category', 'site', 'Site', 'site_name', 'siteName', 'name', 'label']) ?? '—'
    );
    return rowFromRecord(name, row);
  });
};

const normalizeStatusChart = (
  raw: unknown,
  rows: ChecklistStatusRow[]
): { name: string; value: number }[] => {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const response = (payload.response ?? payload) as Record<string, unknown>;
  const chart = response?.chart ?? response?.monthly ?? response?.graph ?? payload.chart;

  if (Array.isArray(chart)) {
    return chart.map((c) => {
      const entry = (c ?? {}) as Record<string, unknown>;
      return {
        name: String(pick(entry, ['name', 'label', 'month', 'category']) ?? '—'),
        value: toNumber(pick(entry, ['value', 'count', 'total'])),
      };
    });
  }
  if (chart && typeof chart === 'object') {
    const obj = chart as Record<string, unknown>;
    const values = (obj.values ?? obj.data ?? obj.counts) as unknown[] | undefined;
    if (Array.isArray(obj.labels) && Array.isArray(values)) {
      return obj.labels.map((label, i) => ({ name: String(label), value: toNumber(values[i]) }));
    }
  }
  return rows.map((r) => ({ name: r.name, value: r.total }));
};

const normalizeTopTen = (raw: unknown): ChecklistTopTenRow[] =>
  asList(raw).map((item, i) => {
    if (Array.isArray(item)) {
      return {
        rank: toNumber(item[0]) || i + 1,
        type: String(item[1] ?? '—'),
        count: toNumber(item[2]),
      };
    }
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      rank: toNumber(pick(row, ['rank', 'Rank', 'position'])) || i + 1,
      type: String(
        pick(row, ['checklist_type', 'checklistType', 'type', 'name', 'label', 'form_name', 'formName']) ?? '—'
      ),
      count: toNumber(pick(row, ['count', 'Count', 'total', 'occurrences'])),
    };
  });

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

const buildStatusResponse = (data: unknown): ChecklistStatusResponse => {
  const rows = normalizeStatusRows(data ?? {});
  const envelope = (data ?? {}) as Record<string, unknown>;
  return {
    success: toNumber(envelope.success ?? 1),
    message: String(envelope.message ?? ''),
    chart: normalizeStatusChart(data ?? {}, rows),
    response: rows,
    info: envelope.info as string | undefined,
  };
};

export const checklistReportsAPI = {
  async getTechnicalMonthly(range: ChecklistReportDateRange): Promise<ChecklistStatusResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/get-chart-technical-checklist-monthly`, {
      params: buildParams(range),
    });
    return buildStatusResponse(data);
  },

  async getNonTechnicalMonthly(range: ChecklistReportDateRange): Promise<ChecklistStatusResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/get-chart-non-technical-checklist-monthly`, {
      params: buildParams(range),
    });
    return buildStatusResponse(data);
  },

  async getSiteWise(range: ChecklistReportDateRange): Promise<ChecklistStatusResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/get-site-wise-checklist`, {
      params: buildParams(range),
    });
    return buildStatusResponse(data);
  },

  async getTopTen(range: ChecklistReportDateRange): Promise<ChecklistTopTenResponse> {
    const { data } = await apiClient.get(`${BASE_PATH}/get-top-ten-checklist`, {
      params: buildParams(range),
    });
    return {
      success: data?.success ?? 1,
      message: data?.message ?? '',
      response: normalizeTopTen(data ?? {}),
      info: data?.info,
    };
  },

  /** Downloads an Excel export. `get-top-ten-checklist-download` also accepts society_id server-side. */
  async downloadExport(range: ChecklistReportDateRange, kind: ChecklistExportKind): Promise<void> {
    const path = EXPORT_PATHS[kind];
    const response = await apiClient.get(`${BASE_PATH}/${path}`, {
      params: buildParams(range),
      responseType: 'blob',
    });
    triggerDownload(
      response.data as Blob,
      `${path}-${formatDateForAPI(range.fromDate)}-to-${formatDateForAPI(range.toDate)}.xlsx`
    );
  },
};
