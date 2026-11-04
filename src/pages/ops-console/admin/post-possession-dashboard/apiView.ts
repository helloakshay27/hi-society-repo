import type { ChartConfiguration, Plugin } from 'chart.js';
import { PP_PALETTE, PP_AXIS, seriesColor } from './charts/chartPalette';
import {
  POST_POSSESSION_ENDPOINTS,
  type EndpointResult,
  type PostPossessionApiState,
  type PostPossessionTab,
} from './api';

type ReadResult =
  | { kind: 'value'; value: unknown }
  | { kind: 'loading' }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'error'; message: string };

interface ApiRisk {
  severity: 'crit' | 'high' | 'med';
  label: string;
  title: string;
  body: string;
  drill: string;
}

interface BarItem {
  label: string;
  value: number;
  percent: number;
  color: string;
}

const CHART_IDS: Record<PostPossessionTab, string[]> = {
  allTowers: [],
  overview: [],
  helpdesk: ['ticketStatusChart', 'modeChart', 'proactiveChart'],
  security: ['guestTypeChart', 'visitTypeChart', 'hourlyTrafficChart', 'purposeChart', 'vehicleHourChart'],
  staff: ['staffCategoryChart', 'shiftCoverageChart'],
  club: ['memberStatusChart', 'planDistChart', 'facilityChart', 'facilityTypeChart'],
  fitout: [
    'fitoutTypeChart',
    'deviationChart',
    'createdByChart',
    'rejectByCreatorChart',
    'rejectByTypeChart',
  ],
  parking: ['parkingTypeChart'],
  community: ['adoptionChart', 'pollChart', 'notifChannelChart', 'quarantineTowerChart'],
};

const CHART_ENDPOINT: Record<string, string> = {
  ticketStatusChart: 'statusAndType',
  modeChart: 'sourceAndVolume',
  proactiveChart: 'statusAndType',
  guestTypeChart: 'visitorComposition',
  visitTypeChart: 'visitorComposition',
  hourlyTrafficChart: 'visitorComposition',
  purposeChart: 'purposeGateAndVehicles',
  vehicleHourChart: 'purposeGateAndVehicles',
  staffCategoryChart: 'coverage',
  shiftCoverageChart: 'coverage',
  memberStatusChart: 'membershipBreakdown',
  planDistChart: 'membershipBreakdown',
  facilityChart: 'membershipBreakdown',
  facilityTypeChart: 'membershipBreakdown',
  fitoutTypeChart: 'typeDeviation',
  deviationChart: 'typeDeviation',
  createdByChart: 'approvalSpeed',
  rejectByCreatorChart: 'approvalSpeed',
  rejectByTypeChart: 'approvalSpeed',
  parkingTypeChart: 'breakdown',
  adoptionChart: 'appAdoption',
  pollChart: 'pollsNotifications',
  notifChannelChart: 'pollsNotifications',
  quarantineTowerChart: 'quarantineDirectory',
};

const CHART_REASON_PATHS: Record<string, string[][]> = {
  ticketStatusChart: [['ticket_status_distribution', 'breakdown']],
  modeChart: [['ticket_source', 'breakdown']],
  proactiveChart: [['proactive_vs_reactive']],
  guestTypeChart: [['guest_type_composition', 'breakdown']],
  visitTypeChart: [['pre_approved_vs_post_approved']],
  hourlyTrafficChart: [['hourly_traffic_pattern_today', 'buckets']],
  purposeChart: [['visitor_purpose_breakdown', 'breakdown']],
  vehicleHourChart: [['member_vs_guest_vehicles_by_hour', 'hourly']],
  staffCategoryChart: [['staff_category_chart']],
  shiftCoverageChart: [['shift_coverage_chart']],
  memberStatusChart: [['member_status_chart']],
  planDistChart: [['plan_dist_chart']],
  facilityChart: [['facility_chart']],
  facilityTypeChart: [['facility_type_chart']],
  fitoutTypeChart: [['request_type_split', 'breakdown']],
  deviationChart: [['deviation_types', 'breakdown']],
  createdByChart: [['approval_speed_admin_vs_resident', 'by_who_raised_it']],
  rejectByCreatorChart: [['rejection_rate_by_who_raised_it']],
  rejectByTypeChart: [['rejection_rate_by_request_type']],
  parkingTypeChart: [['parking_type_distribution', 'breakdown']],
  adoptionChart: [['adoption_chart'], ['overall_adoption_rate']],
  pollChart: [['polls_participation_overview'], ['poll_chart']],
  notifChannelChart: [['notification_delivery_by_channel'], ['notif_channel_chart']],
  quarantineTowerChart: [['cases_by_tower_this_period'], ['quarantine_tower_chart']],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPath(source: unknown, path: string[]): unknown {
  let value = source;
  for (const key of path) {
    if (!isRecord(value) || !(key in value)) return undefined;
    value = value[key];
  }
  return value;
}

function endpointData(state: PostPossessionApiState | undefined, key: string): EndpointResult | undefined {
  return state?.endpoints[key];
}

function read(
  state: PostPossessionApiState | undefined,
  endpointKey: string,
  paths: string[][]
): ReadResult {
  if (!state || state.loading) return { kind: 'loading' };
  const endpoint = endpointData(state, endpointKey);
  if (!endpoint) return { kind: 'error', message: `No response received from ${endpointKey}.` };
  if (endpoint.error) return { kind: 'error', message: endpoint.error };

  for (const path of paths) {
    const value = getPath(endpoint.data, path);
    if (value === undefined) continue;
    if (isRecord(value) && value.available === false) {
      return {
        kind: 'unavailable',
        reason: typeof value.reason === 'string' ? value.reason : 'This metric is unavailable.',
      };
    }
    return { kind: 'value', value };
  }
  return { kind: 'error', message: `The ${endpointKey} response is missing the expected field.` };
}

function readRaw(
  state: PostPossessionApiState | undefined,
  endpointKey: string,
  path: string[]
): ReadResult {
  if (!state || state.loading) return { kind: 'loading' };
  const endpoint = endpointData(state, endpointKey);
  if (!endpoint) return { kind: 'error', message: `No response received from ${endpointKey}.` };
  if (endpoint.error) return { kind: 'error', message: endpoint.error };
  const value = getPath(endpoint.data, path);
  return value === undefined
    ? { kind: 'error', message: `The ${endpointKey} response is missing the expected field.` }
    : { kind: 'value', value };
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatNumber(value: unknown): string {
  const number = numberValue(value);
  if (number === null) return typeof value === 'string' ? value : '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(number);
}

function formatPercent(value: unknown): string {
  const number = numberValue(value);
  return number === null ? '—' : `${formatNumber(number)}%`;
}

function formatCurrency(value: unknown): string {
  const number = numberValue(value);
  return number === null ? '—' : `₹${formatNumber(number)}`;
}

function unwrapCount(result: ReadResult, fields: string[]): ReadResult {
  if (result.kind !== 'value' || !isRecord(result.value)) return result;
  for (const field of fields) {
    if (field in result.value) return { kind: 'value', value: result.value[field] };
  }
  return { kind: 'error', message: 'The API response is missing the count field.' };
}

function safeText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (isRecord(value) && value.available === false) return 'Data Not Available';
  return String(value);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return replacements[char];
  });
}

function isTestRecord(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Object.values(value).some(
    (field) =>
      typeof field === 'string' &&
      isTestText(field)
  );
}

function isTestText(value: string): boolean {
  return /^(test|testing|demo|qa)(?:\b|[-_])/i.test(value.trim());
}

function filteredArray(result: ReadResult): unknown[] {
  if (result.kind !== 'value' || !Array.isArray(result.value)) return [];
  return result.value.filter((item) =>
    typeof item === 'string' ? !isTestText(item) : !isTestRecord(item)
  );
}

function arrayValue(result: ReadResult): Record<string, unknown>[] {
  return result.kind === 'value' && Array.isArray(result.value)
    ? result.value.filter(isRecord)
    : [];
}

function objectValue(result: ReadResult): Record<string, unknown> | null {
  return result.kind === 'value' && isRecord(result.value) ? result.value : null;
}

function donut(labels: string[], values: number[], colors?: string[]): ChartConfiguration {
  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors ?? labels.map((_, index) => seriesColor(index, 0.92)),
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { display: true, position: 'right' } },
    },
  };
}

function getProactiveReactiveData(state: PostPossessionApiState | undefined) {
  const result = read(state, 'statusAndType', [['proactive_vs_reactive']]);
  const data = objectValue(result);
  const proactiveCount = numberValue(getPath(data, ['proactive', 'count']));
  const reactiveCount = numberValue(getPath(data, ['reactive', 'count']));
  const countedTotal =
    proactiveCount !== null && reactiveCount !== null
      ? proactiveCount + reactiveCount
      : null;
  const proactivePercent =
    numberValue(getPath(data, ['proactive', 'percent'])) ??
    (countedTotal ? ((proactiveCount ?? 0) / countedTotal) * 100 : null);
  const reactivePercent =
    numberValue(getPath(data, ['reactive', 'percent'])) ??
    (countedTotal ? ((reactiveCount ?? 0) / countedTotal) * 100 : null);
  return {
    proactiveCount,
    reactiveCount,
    proactivePercent,
    reactivePercent,
    targetPercent: numberValue(data?.target_proactive_percent),
    hasData:
      proactiveCount !== null &&
      reactiveCount !== null &&
      proactiveCount >= 0 &&
      reactiveCount >= 0 &&
      countedTotal !== null &&
      countedTotal > 0,
  };
}

function horizontalBar(labels: string[], values: number[], unit = ''): ChartConfiguration {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: unit ? `Value (${unit})` : 'Count',
          data: values,
          backgroundColor: labels.map((_, index) => seriesColor(index, 0.85)),
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { ...PP_AXIS, beginAtZero: true },
        y: PP_AXIS,
      },
    },
  };
}

function countLabelsPlugin(skipZeroValues = false): Plugin<'bar'> {
  return {
    id: 'postPossessionCountLabels',
    afterDatasetsDraw(chart) {
      const dataset = chart.data.datasets[0];
      if (!dataset) return;

      const context = chart.ctx;
      const elements = chart.getDatasetMeta(0).data;
      context.save();
      context.fillStyle = '#1A1A18';
      context.font = '600 12px Poppins, system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      elements.forEach((element, index) => {
        const value = numberValue(dataset.data[index]);
        if (value === null || (skipZeroValues && value === 0)) return;
        context.fillText(formatNumber(value), element.x, element.y - 8);
      });
      context.restore();
    },
  };
}

function verticalCountBar(
  labels: string[],
  values: number[],
  options: { maxXTicks?: number; skipZeroLabels?: boolean } = {}
): ChartConfiguration {
  const allZero = values.every((value) => value === 0);
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Count',
          data: values,
          backgroundColor: labels.map((_, index) => seriesColor(index, 0.92)),
          borderRadius: 5,
          borderSkipped: false,
          maxBarThickness: 56,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ...PP_AXIS,
          ...(options.maxXTicks
            ? {
                ticks: {
                  ...PP_AXIS.ticks,
                  autoSkip: true,
                  maxTicksLimit: options.maxXTicks,
                  minRotation: 0,
                  maxRotation: 0,
                },
              }
            : {}),
        },
        y: {
          ...PP_AXIS,
          beginAtZero: true,
          ...(allZero ? { max: 1 } : {}),
          ticks: { ...PP_AXIS.ticks, precision: 0 },
        },
      },
    },
    plugins: [countLabelsPlugin(options.skipZeroLabels)],
  };
}

function multiSeriesCountBar(
  labels: string[],
  series: Array<{ label: string; values: number[] }>
): ChartConfiguration {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: series.map((item, index) => ({
        label: item.label,
        data: item.values,
        backgroundColor: seriesColor(index, 0.92),
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 56,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'bottom' } },
      scales: {
        x: { ...PP_AXIS },
        y: { ...PP_AXIS, beginAtZero: true, ticks: { ...PP_AXIS.ticks, precision: 0 } },
      },
    },
    plugins: [countLabelsPlugin()],
  };
}

function entriesFromObject(value: unknown): Array<[string, number]> {
  if (!isRecord(value)) return [];
  return Object.entries(value)
    .map(([label, count]) => [label || 'Unspecified', numberValue(count)] as const)
    .filter((entry): entry is readonly [string, number] => entry[1] !== null);
}

function getPostPossessionCharts(
  tab: PostPossessionTab,
  state: PostPossessionApiState | undefined
): Record<string, ChartConfiguration> {
  const charts: Record<string, ChartConfiguration> = {};
  const addDonut = (id: string, result: ReadResult, labelKey: string, countKey: string) => {
    const rows = arrayValue(result).filter((row) => !isTestRecord(row));
    if (!rows.length) return;
    const labels = rows.map((row) => safeText(row[labelKey] ?? row.name ?? row.poll ?? row.type));
    const values = rows.map((row) => numberValue(row[countKey]) ?? 0);
    charts[id] = donut(labels, values);
  };
  const addObjectDonut = (id: string, result: ReadResult) => {
    const entries = entriesFromObject(result.kind === 'value' ? result.value : null);
    if (entries.length) charts[id] = donut(entries.map(([name]) => name), entries.map(([, count]) => count));
  };

  if (tab === 'helpdesk') {
    addDonut(
      'ticketStatusChart',
      read(state, 'statusAndType', [['ticket_status_distribution', 'breakdown']]),
      'status',
      'count'
    );
    addDonut(
      'modeChart',
      read(state, 'sourceAndVolume', [['ticket_source', 'breakdown']]),
      'mode',
      'count'
    );
    const proactiveReactive = getProactiveReactiveData(state);
    if (
      proactiveReactive.hasData &&
      proactiveReactive.proactiveCount !== null &&
      proactiveReactive.reactiveCount !== null
    ) {
      charts.proactiveChart = donut(
        ['Proactive', 'Reactive'],
        [proactiveReactive.proactiveCount, proactiveReactive.reactiveCount],
        [PP_PALETTE.lavender, PP_PALETTE.teal]
      );
    }
  }

  if (tab === 'security') {
    const guestTypes = arrayValue(
      read(state, 'visitorComposition', [['guest_type_composition', 'breakdown']])
    ).filter((row) => !isTestRecord(row));
    if (guestTypes.length) {
      charts.guestTypeChart = donut(
        guestTypes.map((row) => safeText(row.guest_type ?? row.type ?? row.name)),
        guestTypes.map((row) => numberValue(row.count) ?? 0)
      );
    }

    const approval = objectValue(read(state, 'visitorComposition', [['pre_approved_vs_post_approved']]));
    if (approval) {
      const preApproved = objectValue({ kind: 'value', value: approval.pre_approved });
      const postApproved = objectValue({ kind: 'value', value: approval.post_approved });
      const values = [
        numberValue(preApproved?.count),
        numberValue(postApproved?.count),
      ];
      if (values[0] !== null && values[1] !== null) {
        charts.visitTypeChart = donut(
          ['Pre-Approved', 'Post-Approved'],
          [values[0], values[1]]
        );
      }
    }

    const hourlyTraffic = arrayValue(
      read(state, 'visitorComposition', [['hourly_traffic_pattern_today', 'buckets']])
    );
    if (hourlyTraffic.length) {
      charts.hourlyTrafficChart = verticalCountBar(
        hourlyTraffic.map((row) => `${safeText(row.hour)}:00`),
        hourlyTraffic.map((row) => numberValue(row.count) ?? 0),
        { maxXTicks: 8, skipZeroLabels: true }
      );
    }

    const purposes = arrayValue(
      read(state, 'purposeGateAndVehicles', [['visitor_purpose_breakdown', 'breakdown']])
    ).filter((row) => !isTestRecord(row));
    if (purposes.length) {
      charts.purposeChart = donut(
        purposes.map((row) => safeText(row.purpose ?? row.name ?? row.type)),
        purposes.map((row) => numberValue(row.count) ?? 0)
      );
    }

    const vehicleHours = arrayValue(
      read(state, 'purposeGateAndVehicles', [['member_vs_guest_vehicles_by_hour', 'hourly']])
    );
    const memberVehicles = read(state, 'purposeGateAndVehicles', [
      ['member_vs_guest_vehicles_by_hour', 'member_vehicles'],
    ]);
    if (vehicleHours.length) {
      charts.vehicleHourChart = multiSeriesCountBar(
        vehicleHours.map((row) => `${safeText(row.hour)}:00`),
        [
          {
            label:
              memberVehicles.kind === 'unavailable'
                ? 'Guest vehicles (member data unavailable)'
                : 'Guest vehicles',
            values: vehicleHours.map((row) => numberValue(row.guest) ?? 0),
          },
        ]
      );
    }
  }

  if (tab === 'club') {
    addDonut(
      'memberStatusChart',
      read(state, 'membershipBreakdown', [['member_status_chart']]),
      'status',
      'count'
    );
    addDonut(
      'planDistChart',
      read(state, 'membershipBreakdown', [['plan_dist_chart']]),
      'plan',
      'count'
    );
    const facilities = arrayValue(
      read(state, 'membershipBreakdown', [['facility_chart']])
    )
      .filter((row) => !isTestRecord(row))
      .map((row) => ({
        label: safeText(row.facility ?? row.name ?? row.poll ?? row.type),
        value: numberValue(row.bookings) ?? 0,
      }))
      .sort((a, b) => b.value - a.value);
    if (facilities.length) {
      charts.facilityChart = verticalCountBar(
        facilities.map((facility) => facility.label),
        facilities.map((facility) => facility.value)
      );
    }
    const facilityTypes = arrayValue(
      read(state, 'membershipBreakdown', [['facility_type_chart']])
    )
      .map((row) => {
        const type = safeText(row.type);
        const facilityCount = Array.isArray(row.facilities) ? row.facilities.length : null;
        return {
          label: type.toLowerCase().includes('request')
            ? 'Request-based (Approval)'
            : type.toLowerCase().includes('bookable')
              ? 'Bookable (Instant)'
              : type,
          value: facilityCount,
        };
      })
      .filter((row): row is { label: string; value: number } => row.value !== null);
    if (facilityTypes.length) {
      charts.facilityTypeChart = verticalCountBar(
        facilityTypes.map((row) => row.label),
        facilityTypes.map((row) => row.value)
      );
    }
  }

  if (tab === 'fitout') {
    addDonut(
      'fitoutTypeChart',
      read(state, 'typeDeviation', FITOUT_TYPE_PATHS),
      'type',
      'count'
    );
    const deviationRows = arrayValue(read(state, 'typeDeviation', FITOUT_DEVIATION_PATHS));
    if (deviationRows.length) {
      charts.deviationChart = donut(
        deviationRows.map((row) => safeText(row.deviation_type ?? row.name ?? row.category ?? row.type)),
        deviationRows.map((row) => numberValue(row.count) ?? 0)
      );
    }
    const speed = arrayValue(read(state, 'approvalSpeed', FITOUT_SPEED_PATHS));
    if (speed.length) {
      charts.createdByChart = horizontalBar(
        speed.map(
          (row) =>
            `${safeText(row.name ?? row.created_by)} (${formatNumber(row.decided_count ?? row.request_count)} decided)`
        ),
        speed.map((row) => numberValue(row.avg_days) ?? 0),
        'days'
      );
    }
    const rejectionByWho = rateEntries(
      getPath(endpointData(state, 'approvalSpeed')?.data, ['rejection_rate_by_who_raised_it']) ??
        getPath(endpointData(state, 'approvalSpeed')?.data, ['reject_by_creator_chart'])
    );
    if (rejectionByWho.length) {
      charts.rejectByCreatorChart = horizontalBar(
        rejectionByWho.map((entry) => entry.label),
        rejectionByWho.map((entry) => entry.rate),
        '%'
      );
    }
    const rejectionByType = rateEntries(
      getPath(endpointData(state, 'approvalSpeed')?.data, ['rejection_rate_by_request_type']) ??
        getPath(endpointData(state, 'approvalSpeed')?.data, ['reject_by_type_chart'])
    );
    if (rejectionByType.length) {
      charts.rejectByTypeChart = horizontalBar(
        rejectionByType.map((entry) => entry.label),
        rejectionByType.map((entry) => entry.rate),
        '%'
      );
    }
  }

  if (tab === 'parking') {
    addDonut(
      'parkingTypeChart',
      read(state, 'breakdown', [
        ['parking_type_distribution', 'breakdown'],
        ['parking_type_chart'],
      ]),
      'parking_type',
      'count'
    );
  }

  if (tab === 'community') {
    const pollRows = arrayValue(
      read(state, 'pollsNotifications', [
        ['polls_participation_overview'],
        ['poll_chart'],
      ])
    ).filter((row) => !isTestRecord(row));
    if (pollRows.length) {
      charts.pollChart = horizontalBar(
        pollRows.map((row) => safeText(row.subject ?? row.poll ?? row.name)),
        pollRows.map((row) => numberValue(row.votes) ?? 0),
        'votes'
      );
    }
    addDonut(
      'quarantineTowerChart',
      read(state, 'quarantineDirectory', [
        ['cases_by_tower_this_period'],
        ['quarantine_tower_chart'],
      ]),
      'tower',
      'count'
    );
  }

  if (tab === 'staff') {
    const breakdown = arrayValue(
      read(state, 'coverage', [['staff_category_chart']])
    );
    const categories = breakdown
      .map((row) => ({
        label: safeText(row.category),
        value: numberValue(row.active_staff_on_record),
      }))
      .filter((row): row is { label: string; value: number } => row.value !== null);
    if (categories.length) {
      charts.staffCategoryChart = verticalCountBar(
        categories.map((item) => item.label),
        categories.map((item) => item.value)
      );
    }

    const shifts = arrayValue(read(state, 'coverage', [['shift_coverage_chart']]));
    const shiftCounts = shifts
      .map((row) => ({
        label: safeText(row.shift),
        value: numberValue(row.present),
      }))
      .filter((row): row is { label: string; value: number } => row.value !== null);
    if (shiftCounts.length) {
      charts.shiftCoverageChart = verticalCountBar(
        shiftCounts.map((item) => item.label),
        shiftCounts.map((item) => item.value)
      );
    }
  }

  return charts;
}

const FITOUT_TYPE_PATHS = [['request_type_split', 'breakdown'], ['fitout_type_chart']];
const FITOUT_DEVIATION_PATHS = [['deviation_types', 'breakdown'], ['deviation_chart']];
const FITOUT_SPEED_PATHS = [
  ['approval_speed_admin_vs_resident', 'by_who_raised_it'],
  ['created_by_chart'],
];

function rateEntries(value: unknown): Array<{ label: string; rate: number }> {
  if (Array.isArray(value)) {
    return value
      .filter(isRecord)
      .map((row) => ({
        label: safeText(row.created_by ?? row.type ?? row.name),
        rate: numberValue(row.rejection_rate_percent),
      }))
      .filter((entry): entry is { label: string; rate: number } => entry.rate !== null);
  }
  if (!isRecord(value)) return [];
  return Object.entries(value)
    .map(([label, row]) => ({
      label,
      rate: numberValue(isRecord(row) ? row.rejection_rate_percent : null),
    }))
    .filter((entry): entry is { label: string; rate: number } => entry.rate !== null);
}

function setKpi(
  container: HTMLElement,
  infoKey: string,
  result: ReadResult,
  options: {
    value?: (value: unknown) => string;
    unavailableValue?: string;
    trend?: string;
    target?: string;
  } = {}
): void {
  const infoButton = container.querySelector<HTMLElement>(`[data-info="${infoKey}"]`);
  const card = infoButton?.closest<HTMLElement>('.kc');
  if (!card) return;
  const valueNode = card.querySelector<HTMLElement>('.kc-v');
  const trendNode = card.querySelector<HTMLElement>('.kc-tr');
  const targetNode = card.querySelector<HTMLElement>('.kc-tgt');
  let valueText = '—';
  let trendText = options.trend ?? '';
  let title = '';

  if (result.kind === 'loading') {
    trendText = 'Loading from API…';
  } else if (result.kind === 'error') {
    trendText = `API error: ${result.message}`;
    title = result.message;
  } else if (result.kind === 'unavailable') {
    valueText = options.unavailableValue ?? valueText;
    trendText = 'Data Not Available';
    title = result.reason;
  } else {
    valueText = (options.value ?? formatNumber)(result.value);
  }

  if (valueNode) {
    valueNode.textContent = valueText;
    valueNode.title = title;
  }
  if (trendNode) {
    trendNode.textContent = trendText;
    trendNode.title = title;
  }
  if (targetNode) targetNode.textContent = options.target ?? '';
}

function setBanner(
  container: HTMLElement,
  state: PostPossessionApiState | undefined,
  score: string,
  descriptor: string,
  trend: string,
  why: string,
  bars: BarItem[]
): void {
  const scoreNode = container.querySelector<HTMLElement>('.hban-n');
  const descriptorNode = container.querySelector<HTMLElement>('.hban-d');
  const trendNode = container.querySelector<HTMLElement>('.hban-trend');
  const whyNode = container.querySelector<HTMLElement>('.hban-why');
  const scopeNode = container.querySelector<HTMLElement>('.hban-scope');
  if (scoreNode) scoreNode.textContent = state?.loading ? '…' : score;
  if (descriptorNode) descriptorNode.textContent = ` ${descriptor}`;
  if (trendNode) trendNode.textContent = state?.loading ? 'Loading live dashboard data…' : trend;
  if (whyNode) whyNode.textContent = state?.loading ? '' : why;
  if (scopeNode) scopeNode.textContent = state?.societyId ? `Society ${state.societyId}` : 'Society unavailable';

  const host = container.querySelector<HTMLElement>('.hban-bars');
  if (!host) return;
  host.replaceChildren();
  for (const item of bars) {
    const row = document.createElement('div');
    row.className = 'hb-row';
    const label = document.createElement('div');
    label.className = 'hb-label';
    label.textContent = item.label;
    const track = document.createElement('div');
    track.className = 'hb-track';
    const fill = document.createElement('div');
    fill.className = 'hb-fill';
    fill.style.width = `${Math.max(0, Math.min(100, item.percent))}%`;
    fill.style.background = item.color;
    track.append(fill);
    const value = document.createElement('div');
    value.className = 'hb-val';
    value.style.color = item.color;
    value.textContent = formatNumber(item.value);
    row.append(label, track, value);
    host.append(row);
  }
}

function renderRiskHost(host: HTMLElement | undefined, risks: ApiRisk[]): void {
  if (!host) return;
  host.replaceChildren();
  host.hidden = risks.length === 0;
  for (const risk of risks) {
    const card = document.createElement('div');
    card.className = `rk ${risk.severity}`;
    card.dataset.drill = risk.drill;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    const label = document.createElement('div');
    label.className = 'rk-sv';
    label.textContent = risk.label;
    const title = document.createElement('div');
    title.className = 'rk-t';
    title.textContent = risk.title;
    const body = document.createElement('div');
    body.className = 'rk-m';
    body.textContent = risk.body;
    card.append(label, title, body);
    host.append(card);
  }
}

function setRisks(container: HTMLElement, risks: ApiRisk[]): void {
  const hosts = Array.from(container.querySelectorAll<HTMLElement>('.rg'));
  renderRiskHost(hosts[0], risks);
  hosts.slice(1).forEach((host) => renderRiskHost(host, []));
}

function setTable(
  container: HTMLElement,
  index: number,
  rows: unknown[][],
  emptyMessage = 'No data for this period',
  drill?: string
): void {
  const table = container.querySelectorAll<HTMLTableElement>('table.tbl')[index];
  const body = table?.tBodies.item(0);
  if (!body || !table) return;
  body.replaceChildren();
  if (!rows.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = table.tHead?.rows[0]?.cells.length ?? 1;
    cell.textContent = emptyMessage;
    cell.style.textAlign = 'center';
    return;
  }
  for (const values of rows) {
    const row = body.insertRow();
    if (drill) row.dataset.drill = drill;
    for (const value of values) row.insertCell().textContent = safeText(value);
  }
}

function setTableScrollViewport(
  table: HTMLTableElement,
  visibleRows: number,
  className: string
): void {
  const parent = table.parentElement;
  if (!parent) return;

  let viewport: HTMLElement;
  if (parent.classList.contains(className)) {
    viewport = parent;
  } else if (parent.classList.contains('tbl-scroll')) {
    parent.classList.add(className);
    viewport = parent;
  } else {
    viewport = document.createElement('div');
    viewport.className = `tbl-scroll ${className}`;
    parent.insertBefore(viewport, table);
    viewport.append(table);
  }

  const fitViewport = () => {
    const headerHeight = table.tHead?.getBoundingClientRect().height ?? 0;
    const rows = Array.from(table.tBodies.item(0)?.rows ?? []).slice(0, visibleRows);
    const rowsHeight = rows.reduce(
      (height, row) => height + row.getBoundingClientRect().height,
      0
    );
    if (headerHeight > 0) viewport.style.maxHeight = `${headerHeight + rowsHeight}px`;
  };

  fitViewport();
  requestAnimationFrame(fitViewport);
}

function setListScrollViewport(list: HTMLElement, visibleRows: number, className: string): void {
  list.classList.add(className);

  const fitViewport = () => {
    const rows = Array.from(list.children).slice(0, visibleRows);
    const rowsHeight = rows.reduce((height, row) => height + row.getBoundingClientRect().height, 0);
    const styles = window.getComputedStyle(list);
    const padding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    if (rowsHeight > 0) {
      list.style.maxHeight = `${rowsHeight + (Number.isFinite(padding) ? padding : 0)}px`;
    }
  };

  fitViewport();
  requestAnimationFrame(fitViewport);
}

function tableMessage(result: ReadResult, rows: unknown[][]): string {
  if (result.kind === 'loading') return 'Loading from API…';
  if (result.kind === 'error') return `API error: ${result.message}`;
  if (result.kind === 'unavailable') return `Data Not Available: ${result.reason}`;
  if (!Array.isArray(result.value)) return 'Unexpected response format.';
  if (!rows.length) return 'No data for this period';
  return '';
}

function setContentMessage(host: HTMLElement, result: ReadResult): void {
  host.hidden = false;
  let title = 'No data for this period';
  let detail = '';
  if (result.kind === 'loading') title = 'Loading from API…';
  if (result.kind === 'error') {
    title = 'API error';
    detail = result.message;
  }
  if (result.kind === 'unavailable') {
    title = 'Data Not Available';
    detail = result.reason;
  }
  if (result.kind === 'value' && Array.isArray(result.value) && result.value.length === 0) {
    title = 'No data for this period';
  }
  if (result.kind === 'value' && !Array.isArray(result.value)) {
    title = 'Unexpected response format';
  }
  host.replaceChildren();
  const callout = document.createElement('div');
  callout.className = 'ci am';
  const heading = document.createElement('div');
  heading.className = 'ci-h';
  heading.textContent = title;
  callout.append(heading);
  if (detail) {
    const message = document.createElement('div');
    message.className = 'ci-a';
    message.textContent = detail;
    callout.append(message);
  }
  host.append(callout);
}

function setChartMessage(container: HTMLElement, id: string, result: ReadResult): void {
  const placeholder = container.querySelector<HTMLElement>(`[data-pp-chart="${id}"]`);
  if (placeholder) setContentMessage(placeholder, result);
}

function setKpiByLabel(
  container: HTMLElement,
  label: string,
  result: ReadResult,
  options: { value?: (value: unknown) => string; trend?: string; target?: string } = {}
): void {
  const card = Array.from(container.querySelectorAll<HTMLElement>('.kc')).find((candidate) =>
    candidate.querySelector('.kc-l')?.textContent?.trim().toLowerCase().includes(label.toLowerCase())
  );
  if (!card) return;
  const valueNode = card.querySelector<HTMLElement>('.kc-v');
  const trendNode = card.querySelector<HTMLElement>('.kc-tr');
  const targetNode = card.querySelector<HTMLElement>('.kc-tgt');
  const value =
    result.kind === 'value'
      ? (options.value ?? formatNumber)(result.value)
      : result.kind === 'loading'
        ? '…'
        : result.kind === 'unavailable'
          ? 'Data Not Available'
          : '—';
  const trend =
    result.kind === 'loading'
      ? 'Loading from API…'
      : result.kind === 'error'
        ? `API error: ${result.message}`
        : result.kind === 'unavailable'
          ? result.reason
          : options.trend ?? '';
  if (valueNode) {
    valueNode.textContent = value;
    valueNode.title =
      result.kind === 'unavailable'
        ? result.reason
        : result.kind === 'error'
          ? result.message
          : '';
  }
  if (trendNode) trendNode.textContent = trend;
  if (targetNode) targetNode.textContent = options.target ?? '';
}

function setStatByLabel(
  container: HTMLElement,
  label: string,
  result: ReadResult,
  detail: string
): void {
  const stat = Array.from(container.querySelectorAll<HTMLElement>('.stat')).find((candidate) =>
    candidate.querySelector('.lbl')?.textContent?.trim().toLowerCase().includes(label.toLowerCase())
  );
  if (!stat) return;
  const valueNode = stat.querySelector<HTMLElement>('.val');
  const detailNode = stat.querySelector<HTMLElement>('.sub');
  if (valueNode) {
    valueNode.textContent =
      result.kind === 'value'
        ? formatNumber(result.value)
        : result.kind === 'loading'
          ? '…'
          : result.kind === 'unavailable'
            ? 'Data Not Available'
            : '—';
  }
  if (detailNode) {
    detailNode.textContent =
      result.kind === 'error'
        ? `API error: ${result.message}`
        : result.kind === 'unavailable'
          ? result.reason
          : result.kind === 'loading'
            ? 'Loading from API…'
            : detail;
  }
}

function bindHelpdeskNotice(host: HTMLElement | null, risks: ApiRisk[]): void {
  if (!host) return;
  const notice = host.querySelector<HTMLElement>('.notice');
  if (!notice) return;
  let index = 0;
  const render = () => {
    const risk = risks[index];
    const pill = notice.querySelector<HTMLElement>('[data-n="pill"]');
    const count = notice.querySelector<HTMLElement>('[data-n="count"]');
    const title = notice.querySelector<HTMLElement>('[data-n="title"]');
    const body = notice.querySelector<HTMLElement>('[data-n="body"]');
    const cta = notice.querySelector<HTMLElement>('[data-n="cta"]');
    const go = notice.querySelector<HTMLElement>('.go');
    if (pill) {
      pill.className = `pill ${risk?.severity === 'crit' ? 'p-bad' : risk?.severity === 'high' ? 'p-warn' : 'p-white'}`;
      pill.textContent = risk?.label ?? 'Status';
    }
    if (count) count.textContent = risks.length ? `${index + 1} of ${risks.length}` : 'Live';
    if (title) title.textContent = risk?.title ?? 'No critical helpdesk risks reported';
    if (body) body.textContent = risk?.body ?? 'Ticket and SLA data is up to date from the API.';
    if (cta) cta.textContent = risk ? 'Review helpdesk data' : 'View tickets';
    if (go) go.dataset.drill = risk?.drill ?? 'tickets_all';
  };
  host.querySelector('[data-n="prev"]')?.addEventListener('click', () => {
    index = risks.length ? (index + risks.length - 1) % risks.length : 0;
    render();
  });
  host.querySelector('[data-n="next"]')?.addEventListener('click', () => {
    index = risks.length ? (index + 1) % risks.length : 0;
    render();
  });
  render();
}

function setTableRows(
  table: HTMLTableElement | null,
  rows: unknown[][],
  emptyMessage = 'No data for this period',
  drill?: string
): void {
  const body = table?.tBodies.item(0);
  if (!body || !table) return;
  body.replaceChildren();
  if (!rows.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = table.tHead?.rows[0]?.cells.length ?? 1;
    cell.textContent = emptyMessage;
    cell.style.textAlign = 'center';
    return;
  }
  for (const values of rows) {
    const row = body.insertRow();
    if (drill) row.dataset.drill = drill;
    for (const value of values) row.insertCell().textContent = safeText(value);
  }
}

function setTableByInfo(
  container: HTMLElement,
  infoKey: string,
  result: ReadResult,
  rows: unknown[][],
  drill?: string
): void {
  const infoButton = container.querySelector<HTMLElement>(`[data-info="${infoKey}"]`);
  const table = infoButton
    ?.closest<HTMLElement>('.card, .table-block')
    ?.querySelector<HTMLTableElement>('table.tbl');
  const message = tableMessage(result, rows);
  setTableRows(table ?? null, rows, message || 'No data for this period', drill);
}

function setTableBySelector(
  container: HTMLElement,
  selector: string,
  result: ReadResult,
  rows: unknown[][],
  drill?: string
): void {
  const table = container.querySelector<HTMLTableElement>(selector);
  const message = tableMessage(result, rows);
  setTableRows(table, rows, message || 'No data for this period', drill);
}

function setHorizontalBars(
  container: HTMLElement,
  infoKey: string,
  rows: Array<{ label: string; value: number; display?: string }>,
  maximum?: number,
  emptyResult: ReadResult = { kind: 'value', value: [] }
): void {
  const infoButton = container.querySelector<HTMLElement>(`[data-info="${infoKey}"]`);
  const host = infoButton?.closest<HTMLElement>('.card')?.querySelector<HTMLElement>('.hbars');
  if (!host) return;
  host.replaceChildren();
  if (!rows.length) {
    setContentMessage(host, emptyResult);
    return;
  }
  const maxValue = maximum ?? Math.max(...rows.map((row) => row.value), 1);
  for (const item of rows) {
    const row = document.createElement('div');
    row.className = 'hbar';
    const label = document.createElement('span');
    label.textContent = item.label;
    const track = document.createElement('div');
    track.className = 'htrack';
    const fill = document.createElement('i');
    fill.style.width = `${Math.max(0, Math.min(100, (item.value / maxValue) * 100))}%`;
    track.append(fill);
    const value = document.createElement('b');
    value.textContent = item.display ?? formatNumber(item.value);
    row.append(label, track, value);
    host.append(row);
  }
}

function displayDimension(value: unknown, fields: string[], suffix = '%'): string {
  if (isRecord(value) && value.available === false) {
    return typeof value.reason === 'string' && value.reason.trim()
      ? value.reason
      : 'Data Not Available';
  }
  if (!isRecord(value)) return '—';
  const metric = fields.map((field) => numberValue(value[field])).find((entry) => entry !== null);
  return metric === undefined || metric === null
    ? '—'
    : suffix
      ? `${formatNumber(metric)}${suffix}`
      : formatNumber(metric);
}

function bindAllTowers(container: HTMLElement, state: PostPossessionApiState | undefined): void {
  const result = read(state, 'summary', [['towers']]);
  const responseTowers = arrayValue(result);
  const towerOrder = ['t1', 't3', 't2', 'fm'];
  const requestedTowerNames = new Set(towerOrder);
  const towers = towerOrder.flatMap((name) => {
    const tower = responseTowers.find(
      (item) => safeText(item.tower_name).trim().toLowerCase() === name
    );
    return tower ? [tower] : [];
  });
  const summary = endpointData(state, 'summary')?.data;
  const summaryBestTower =
    isRecord(summary) && isRecord(summary.best_tower) ? summary.best_tower : null;
  const summaryWorstTower =
    isRecord(summary) && isRecord(summary.worst_tower) ? summary.worst_tower : null;
  const bestTower =
    summaryBestTower &&
    requestedTowerNames.has(safeText(summaryBestTower.tower_name).trim().toLowerCase())
      ? summaryBestTower
      : null;
  const worstTower =
    summaryWorstTower &&
    requestedTowerNames.has(safeText(summaryWorstTower.tower_name).trim().toLowerCase())
      ? summaryWorstTower
      : null;
  const bestTowerName = bestTower ? safeText(bestTower.tower_name) : '—';
  const worstTowerName = worstTower ? safeText(worstTower.tower_name) : '—';
  const scoredTowers = towers.filter((tower) => numberValue(tower.composite) !== null);
  const dateWindow = isRecord(summary) && isRecord(summary.window) ? summary.window : null;
  const comparisonWindow = dateWindow && isRecord(dateWindow.trend_compared_with)
    ? dateWindow.trend_compared_with
    : null;
  const windowText = dateWindow && dateWindow.from && dateWindow.to
    ? `${safeText(dateWindow.from)} – ${safeText(dateWindow.to)}`
    : '';
  const comparisonText = comparisonWindow && comparisonWindow.from && comparisonWindow.to
    ? `${safeText(comparisonWindow.from)} – ${safeText(comparisonWindow.to)}`
    : '';
  const tableRows = towers.map((tower) => {
    const trend = isRecord(tower.trend) ? safeText(tower.trend.label) : '—';
    const fitout = isRecord(tower.fitout)
      ? tower.fitout.available === false
        ? displayDimension(tower.fitout, ['avg_days_to_decision'], 'd')
        : `${displayDimension(tower.fitout, ['avg_days_to_decision'], 'd')} · ${displayDimension(tower.fitout, ['rejection_rate_percent'])}`
      : 'Data Not Available';
    return [
      tower.rank,
      tower.tower_name,
      tower.composite,
      trend,
      displayDimension(tower.sla, ['response_achieved_percent']),
      displayDimension(tower.patrol_compliance, ['compliance_percent']),
      displayDimension(tower.club_activation, ['activation_percent']),
      fitout,
      displayDimension(tower.staffing, ['coverage_percent']),
      displayDimension(tower.possession_csat, ['score'], '/5'),
      tower.primary_issue,
    ];
  });
  setTableByInfo(container, 'tbl_tlb_ranked_scorecard', result, tableRows);
  const scorecard = container.querySelector<HTMLTableElement>('.lb-tbl');
  scorecard?.tBodies.item(0)?.querySelectorAll('tr').forEach((row) => {
    const towerName = row.cells.item(1)?.textContent?.trim().toLowerCase();
    if (towerName) row.dataset.drill = `tower_${towerName.replace(/\s+/g, '_')}`;
    const tower = towers.find(
      (item) => safeText(item.tower_name).toLowerCase() === towerName
    );
    const dimensions = tower && Array.isArray(tower.dimensions_used)
      ? tower.dimensions_used.map((dimension) => String(dimension).replace(/_/g, ' '))
      : [];
    const scoreCell = row.cells.item(2);
    if (scoreCell && dimensions.length) {
      scoreCell.title = `Dimensions used: ${dimensions.join(', ')}`;
    }
  });
  setHorizontalBars(
    container,
    'towerCompositeChart',
    towers.map((tower) => ({
      label: safeText(tower.tower_name),
      value: numberValue(tower.composite) ?? 0,
      display: numberValue(tower.composite) === null ? 'N/A' : formatNumber(tower.composite),
    })),
    100,
    result
  );
  setHorizontalBars(
    container,
    'towerRejectionChart',
    towers.map((tower) => {
      const rejectionRate =
        isRecord(tower.fitout) && tower.fitout.available !== false
          ? numberValue(tower.fitout.rejection_rate_percent)
          : null;
      return {
        label: safeText(tower.tower_name),
        value: rejectionRate ?? 0,
        display: rejectionRate === null ? 'N/A' : formatPercent(rejectionRate),
      };
    }),
    100,
    result
  );

  const header = container.querySelector<HTMLElement>('.phead .eyebrow');
  if (header) {
    header.textContent = `Super admin view${windowText ? ` · ${windowText}` : ''} · Best: ${bestTowerName} · Needs attention: ${worstTowerName}`;
  }
  const lede = container.querySelector<HTMLElement>('.phead .lede');
  if (lede) {
    lede.textContent = towers.length
      ? `Composite scores compare ${towers.length} towers using the dimensions available for each. Click a tower for its full breakdown.`
      : result.kind === 'error'
        ? `Tower summary API error: ${result.message}`
        : result.kind === 'loading'
          ? 'Loading tower comparison from the API…'
          : result.kind === 'unavailable'
            ? result.reason
            : 'Tower comparison data is unavailable for this period.';
  }
  const bestWorstButtons = Array.from(
    container.querySelectorAll<HTMLElement>('.phead .callout')
  );
  [bestTower, worstTower].forEach((tower, index) => {
    const button = bestWorstButtons[index];
    if (!button) return;
    const title = button.querySelector<HTMLElement>('span > b');
    const detail = button.querySelector<HTMLElement>('span > .sub');
    const label = index === 0 ? 'Best' : 'Worst';
    const towerName = tower ? safeText(tower.tower_name) : '—';
    const composite = numberValue(tower?.composite);
    const towerTrend = tower && isRecord(tower.trend) ? tower.trend.label : null;
    const trend = towerTrend
      ? safeText(towerTrend)
      : 'trend unavailable';
    if (title) title.textContent = `${label} — Tower ${towerName}`;
    if (detail) {
      detail.textContent = `Composite ${composite === null ? 'unavailable' : formatNumber(composite)} · ${trend}`;
    }
    if (towerName !== '—') {
      button.dataset.drill = `tower_${towerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
    } else {
      button.removeAttribute('data-drill');
    }
  });
  const scorecardCount = container.querySelector<HTMLElement>('.table-block .chead > .sub');
  if (scorecardCount) {
    scorecardCount.textContent = result.kind === 'loading'
      ? 'Loading tower scores…'
      : result.kind === 'error'
        ? 'Tower scores unavailable'
        : result.kind === 'unavailable'
          ? 'Tower scores unavailable'
          : `${towers.length} towers · ${scoredTowers.length} scored`;
  }
  const scorecardSubtitle = container.querySelector<HTMLElement>('.table-block .csub2');
  if (scorecardSubtitle) {
    scorecardSubtitle.textContent = 'Each composite score uses the API-reported dimensions available for that tower.';
  }
  const scorecardFoot = container.querySelector<HTMLElement>('.table-block .foot');
  if (scorecardFoot) {
    const compositeNote = isRecord(summary) && typeof summary.composite_note === 'string'
      ? summary.composite_note
      : 'Composite scoring details were not returned by the API.';
    scorecardFoot.textContent = [
      compositeNote,
      windowText ? `Window: ${windowText}.` : '',
      comparisonText ? `Compared with: ${comparisonText}.` : '',
    ].filter(Boolean).join(' ');
  }
  const rejectionSubtitle = container.querySelectorAll<HTMLElement>('.g.c2 .card .csub2').item(1);
  if (rejectionSubtitle) {
    rejectionSubtitle.textContent = windowText
      ? `Share of decided fitout requests rejected during ${windowText}`
      : 'Share of decided fitout requests rejected in the selected period';
  }

  const insights = container.querySelectorAll<HTMLElement>('.ins');
  const setInsight = (insight: HTMLElement | undefined, text: string, actionText: string) => {
    if (!insight) return;
    const tag = insight.querySelector<HTMLElement>('.tagai');
    if (tag) tag.textContent = 'DATA INSIGHT';
    const paragraph = insight.querySelector<HTMLElement>('p');
    if (paragraph) paragraph.textContent = text;
    const action = insight.querySelector<HTMLElement>('.ins-act');
    if (action) {
      const icon = action.querySelector('svg');
      action.replaceChildren();
      if (icon) action.append(icon);
      action.append(document.createTextNode(actionText));
    }
  };
  const bestScore = numberValue(bestTower?.composite);
  const worstScore = numberValue(worstTower?.composite);
  const bestDimensions = bestTower && Array.isArray(bestTower.dimensions_used)
    ? bestTower.dimensions_used.length
    : 0;
  const worstDimensions = worstTower && Array.isArray(worstTower.dimensions_used)
    ? worstTower.dimensions_used.length
    : 0;
  const scoredSummary = bestScore !== null && worstScore !== null
    ? `Best tower ${bestTowerName} scores ${formatNumber(bestScore)} using ${bestDimensions} dimension${bestDimensions === 1 ? '' : 's'}; lowest scored tower ${worstTowerName} scores ${formatNumber(worstScore)} using ${worstDimensions} dimension${worstDimensions === 1 ? '' : 's'}.`
    : `${scoredTowers.length} towers have a composite score in this response; unscored towers are not assigned a zero score.`;
  setInsight(
    insights.item(0) ?? undefined,
    scoredTowers.length
      ? `${scoredSummary} Scores use each tower's available metrics.`
      : result.kind === 'error'
        ? `Tower summary API error: ${result.message}`
        : result.kind === 'loading'
          ? 'Tower scores are loading from the API.'
          : 'No composite scores were returned for this period.',
    worstScore !== null ? `Review ${worstTowerName}'s available metric breakdown.` : 'Review data availability before comparing towers.'
  );
  setInsight(
    insights.item(1) ?? undefined,
    scoredTowers.length
      ? `${scoredTowers.length} of ${towers.length} towers have a score; the other towers lack enough available dimensions to calculate one.`
      : result.kind === 'error'
        ? `Tower summary API error: ${result.message}`
        : result.kind === 'loading'
          ? 'A composite comparison will appear when tower data finishes loading.'
          : 'A composite comparison will appear when scored tower data is available.',
    'Use the dimensions-used detail on each scored row to interpret its result.'
  );
  const fitoutRates = towers.flatMap((tower) => {
    if (!isRecord(tower.fitout) || tower.fitout.available === false) return [];
    const rate = numberValue(tower.fitout.rejection_rate_percent);
    return rate === null ? [] : [{ name: safeText(tower.tower_name), rate }];
  });
  const highestRejection = fitoutRates.reduce<{ name: string; rate: number } | null>(
    (highest, current) => !highest || current.rate > highest.rate ? current : highest,
    null
  );
  setInsight(
    insights.item(2) ?? undefined,
    result.kind === 'loading'
      ? 'Fitout rejection data is loading from the API.'
      : result.kind === 'error'
        ? `Fitout rejection data API error: ${result.message}`
        : highestRejection
          ? highestRejection.rate > 0
            ? `Highest reported fitout rejection rate is ${formatPercent(highestRejection.rate)} for ${highestRejection.name}; rates are available for ${fitoutRates.length} towers.`
            : `No fitout rejections are reported for the ${fitoutRates.length} towers with rejection-rate data.`
          : 'Fitout rejection-rate data is unavailable for this period.',
    highestRejection && highestRejection.rate > 0
      ? `Review fitout decisions for ${highestRejection.name}.`
      : 'Unavailable tower rates are marked N/A, not treated as zero.'
  );
}

function bindOverview(container: HTMLElement, state: PostPossessionApiState | undefined): void {
  const greeting = container.querySelector<HTMLElement>('.aib-g');
  if (greeting) greeting.textContent = 'Good morning.';

  const summary = endpointData(state, 'kpis')?.data;
  const setPulse = (key: string, value: string, trend: string, detail: string) => {
    const infoButton = container.querySelector<HTMLElement>(`[data-info="${key}"]`);
    const pulse = infoButton?.closest<HTMLElement>('.pulse');
    if (!pulse) return;
    const valueNode = pulse.querySelector<HTMLElement>('.pulse-val');
    const trendNode = pulse.querySelector<HTMLElement>('.pulse-trend');
    const detailNode = pulse.querySelector<HTMLElement>('.txs.cs');
    if (valueNode) {
      const suffix = valueNode.querySelector<HTMLElement>('span');
      const firstText = valueNode.firstChild;
      if (suffix && firstText?.nodeType === Node.TEXT_NODE && value.includes('/')) {
        const [main, ratio] = value.split('/');
        firstText.textContent = main;
        suffix.textContent = `/${ratio}`;
      } else if (suffix && firstText?.nodeType === Node.TEXT_NODE && value.endsWith(' in')) {
        firstText.textContent = value.slice(0, -3);
        suffix.textContent = ' in';
      } else {
        valueNode.textContent = value;
      }
    }
    if (trendNode) trendNode.textContent = trend;
    if (detailNode) detailNode.textContent = detail;
  };
  const helpdesk = getPath(summary, ['helpdesk']);
  const security = getPath(summary, ['security']);
  const club = getPath(summary, ['club_facilities']);
  const fitout = getPath(summary, ['fitout']);
  const topStrip = getPath(summary, ['top_strip']);
  setPulse(
    'pulse_helpdesk',
    isRecord(helpdesk) ? formatNumber(helpdesk.total_tickets) : '—',
    isRecord(helpdesk) ? `${formatNumber(helpdesk.response_breached)} response breached` : 'Data Not Available',
    isRecord(helpdesk)
      ? `${formatNumber(helpdesk.open_tickets)} open · ${formatNumber(helpdesk.in_progress_tickets)} in progress`
      : ''
  );
  const patrolSummary = isRecord(security) ? security.patrol_compliance : undefined;
  const patrolSummaryText =
    isRecord(patrolSummary) && patrolSummary.available === false
      ? 'Data Not Available'
      : displayDimension(patrolSummary, ['compliance_percent']);
  setPulse(
    'pulse_security',
    isRecord(security) ? `${formatNumber(security.visitors_in)} in` : '—',
    isRecord(security)
      ? `${formatNumber(security.visitors_out)} out · ${formatNumber(security.pending_post_approval)} pending`
      : 'Data Not Available',
    `Patrol compliance: ${patrolSummaryText}`
  );
  setPulse(
    'pulse_club',
    isRecord(club)
      ? `${formatNumber(club.facility_slots_booked_today)}/${formatNumber(club.facility_slots_today)}`
      : '—',
    isRecord(club)
      ? `slots booked today · ${formatNumber(club.vacant_slots_today)} vacant`
      : 'Data Not Available',
    isRecord(club)
      ? `${formatNumber(club.active_members)} active members · ${formatNumber(club.pending_members)} pending`
      : ''
  );
  setPulse(
    'pulse_fitout',
    isRecord(fitout) ? formatNumber(fitout.total_requests) : '—',
    isRecord(fitout) ? `${formatNumber(fitout.pending)} still pending` : 'Data Not Available',
    isRecord(fitout)
      ? `${formatNumber(fitout.closed)} closed · ${formatNumber(fitout.open_deviations)} deviations`
      : ''
  );
  const responseBreach = getPath(topStrip, ['response_breached']);
  const pendingApproval = getPath(topStrip, ['pending_post_approval']);
  const clubActivation = getPath(topStrip, ['club_active']);
  const fitoutPending = getPath(topStrip, ['fitout_pending']);
  const visitorsToday = getPath(topStrip, ['visitors_today']);
  const issueCards = Array.from(container.querySelectorAll<HTMLElement>('.aib-issue'));
  const issueData = [
    {
      title: `${formatNumber(getPath(responseBreach, ['count']))} response escalations breached`,
      detail: `${formatPercent(getPath(responseBreach, ['breach_rate_percent']))} of ${formatNumber(getPath(responseBreach, ['total']))} tickets`,
    },
    {
      title: `${formatNumber(getPath(clubActivation, ['pending_activation']))} memberships pending activation`,
      detail: `${formatNumber(getPath(clubActivation, ['active']))} active of ${formatNumber(getPath(clubActivation, ['total']))} members`,
    },
    {
      title: `${formatNumber(getPath(pendingApproval, ['count']))} visitors pending approval`,
      detail: `${formatNumber(getPath(pendingApproval, ['waiting_70_plus_min']))} waiting over 70 minutes`,
    },
  ];
  issueCards.forEach((card, index) => {
    const data = issueData[index];
    if (!data) return;
    const title = card.querySelector<HTMLElement>('.aib-it');
    const detail = card.querySelector<HTMLElement>('.aib-is');
    if (title) title.textContent = data.title;
    if (detail) detail.textContent = data.detail;
  });
  const priorityItems = Array.from(container.querySelectorAll<HTMLElement>('.pcols .pi'));
  const priorityData = [
    [`${formatNumber(getPath(responseBreach, ['count']))} tickets with Response Escalation Breached`, 'Review current response SLA breaches'],
    [`${formatNumber(getPath(fitoutPending, ['pending']))} fitout requests pending`, `${formatNumber(getPath(fitoutPending, ['closed_this_month']))} closed this month`],
    [`${formatNumber(getPath(clubActivation, ['pending_activation']))} club memberships pending`, `${formatNumber(getPath(clubActivation, ['active']))} active of ${formatNumber(getPath(clubActivation, ['total']))}`],
    [`${formatNumber(getPath(pendingApproval, ['count']))} visitor approvals pending`, `${formatNumber(getPath(pendingApproval, ['waiting_70_plus_min']))} waiting over 70 minutes`],
    [`${formatNumber(getPath(visitorsToday, ['total']))} visitors today`, `${formatNumber(getPath(visitorsToday, ['in']))} in · ${formatNumber(getPath(visitorsToday, ['out']))} out`],
  ];
  priorityItems.slice(0, priorityData.length).forEach((item, index) => {
    const title = item.querySelector<HTMLElement>('.pi-t');
    const detail = item.querySelector<HTMLElement>('.pi-s');
    if (title) title.textContent = priorityData[index][0];
    if (detail) detail.textContent = priorityData[index][1];
  });
  priorityItems.slice(priorityData.length).forEach((item) => {
    const title = item.querySelector<HTMLElement>('.pi-t');
    const detail = item.querySelector<HTMLElement>('.pi-s');
    if (title) title.textContent = 'No additional event data returned';
    if (detail) detail.textContent = 'The API did not report another item for this period.';
  });
  const briefItems = Array.from(container.querySelectorAll<HTMLElement>('.aib-left ul li'));
  const briefData = [
    `Helpdesk: ${formatNumber(getPath(responseBreach, ['count']))} of ${formatNumber(getPath(responseBreach, ['total']))} tickets breached the response target.`,
    `Club memberships: ${formatNumber(getPath(clubActivation, ['pending_activation']))} pending activation of ${formatNumber(getPath(clubActivation, ['total']))} members.`,
    `Fitout: ${formatNumber(getPath(fitoutPending, ['pending']))} requests pending; ${formatNumber(getPath(fitoutPending, ['closed_this_month']))} closed this month.`,
  ];
  briefItems.forEach((item, index) => {
    if (briefData[index]) item.textContent = briefData[index];
  });
  const narrative = Array.from(container.querySelectorAll<HTMLElement>('.aib-left .aib-p')).filter(
    (paragraph) => !paragraph.querySelector('ul')
  );
  if (narrative[1]) narrative[1].textContent = 'Possession feedback is not available from the current data sources.';
  if (narrative[2]) {
    narrative[2].textContent =
      `Security recorded ${formatNumber(getPath(visitorsToday, ['total']))} visitors today; ${formatNumber(getPath(pendingApproval, ['count']))} are awaiting post approval.`;
  }

  const feedback = read(state, 'feedbackAndEvents', [['important_events', 'events']]);
  const events = arrayValue(feedback);
  const rows = events.map((event) => {
    const date = typeof event.occurred_at === 'string' ? new Date(event.occurred_at) : null;
    const time = date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : '—';
    const detail = safeText(event.detail);
    const title = detail === '—' ? safeText(event.title) : `${safeText(event.title)} — ${detail}`;
    return [time, `${safeText(event.severity)} · ${title}`, event.domain];
  });
  setTableBySelector(container, '#evTable', feedback, rows, 'events');

  const possession = read(state, 'feedbackAndEvents', [['possession_experience_csat']]);
  const infoButton = container.querySelector<HTMLElement>(
    '[data-info="tbl_tov_possession_experience_resident_feedback"]'
  );
  const card = infoButton?.closest<HTMLElement>('.card');
  const callout = card?.querySelector<HTMLElement>('.ci');
  if (card) {
    const badgeText = Array.from(card.querySelectorAll<HTMLElement>('*')).find(
      (element) =>
        element.childElementCount === 0 &&
        /3\.9\/5/.test(element.textContent ?? '') &&
        /3\.7/.test(element.textContent ?? '')
    );
    (badgeText?.closest<HTMLElement>('.b') ?? badgeText)?.remove();
    const trend = Array.from(card.querySelectorAll<HTMLElement>('*')).find(
      (element) =>
        element.childElementCount === 0 &&
        /↑\s*\+0\.2\s+vs\s+6mo ago/.test(element.textContent?.trim() ?? '')
    );
    trend?.remove();
  }
  if (callout && possession.kind !== 'value') setContentMessage(callout, possession);
  if (possession.kind === 'unavailable' && card) {
    const score = card.querySelector<HTMLElement>('[style*="font-size:36px"]');
    if (score) score.textContent = 'Data Not Available';
    const scale = score?.nextElementSibling as HTMLElement | null;
    if (scale) scale.textContent = 'No possession survey source';
    card.querySelectorAll<HTMLElement>('.hb-row').forEach((row) => {
      const fill = row.querySelector<HTMLElement>('.hb-fill');
      const value = row.querySelector<HTMLElement>('.hb-val');
      if (fill) fill.style.width = '0%';
      if (value) value.textContent = '—';
    });
  }

  const totalNode = container.querySelector<HTMLElement>('#evPgnInfo');
  const importantEvents = getPath(endpointData(state, 'feedbackAndEvents')?.data, ['important_events']);
  if (totalNode && isRecord(importantEvents)) {
    const page = numberValue(importantEvents.page) ?? 1;
    const totalPages = numberValue(importantEvents.total_pages) ?? 1;
    const totalCount = numberValue(importantEvents.total) ?? 0;
    const total = formatNumber(totalCount);
    const eventCountLabel = container
      .querySelector<HTMLElement>('#evTable')
      ?.closest<HTMLElement>('.card')
      ?.querySelector<HTMLElement>('.ch .txs.cs');
    if (eventCountLabel) eventCountLabel.textContent = `High-priority only · ${total} total`;
    const perPage = numberValue(importantEvents.per_page) ?? events.length;
    const start = events.length ? (page - 1) * perPage + 1 : 0;
    totalNode.textContent = events.length
      ? `Showing ${start}–${Math.min(start + events.length - 1, totalCount)} of ${total}`
      : `Showing 0 of ${total}`;
    const buttons = container.querySelector<HTMLElement>('#evPgnBtns');
    if (buttons) {
      buttons.replaceChildren();
      const addPageButton = (target: number, label: string, current = false, disabled = false) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `pgn-b${current ? ' cur' : ''}`;
        button.textContent = label;
        button.disabled = disabled;
        button.addEventListener('click', () =>
          window.dispatchEvent(new CustomEvent('pp-overview-events-page', { detail: target }))
        );
        buttons.append(button);
      };
      addPageButton(page - 1, '‹', false, page <= 1);
      for (let target = 1; target <= totalPages; target += 1) {
        addPageButton(target, String(target), target === page);
      }
      addPageButton(page + 1, '›', false, page >= totalPages);
    }
  }
}

function bindHelpdesk(container: HTMLElement, state: PostPossessionApiState | undefined): void {
  const total = read(state, 'kpis', [['total_tickets']]);
  const open = read(state, 'kpis', [['open_tickets']]);
  const response = read(state, 'kpis', [['response_breached']]);
  const resolution = read(state, 'kpis', [['resolution_breached']]);
  const proactive = read(state, 'kpis', [['proactive_tickets']]);
  const proactiveReactive = getProactiveReactiveData(state);
  const assigned = read(state, 'kpis', [['assigned']]);
  const golden = read(state, 'kpis', [['golden_tickets']]);
  const responseValue = objectValue(response);
  const resolutionValue = objectValue(resolution);
  const proactiveValue = objectValue(proactive);
  const assignedValue = objectValue(assigned);
  const goldenValue = objectValue(golden);
  const header = container.querySelector<HTMLElement>('.phead .eyebrow');
  const lede = container.querySelector<HTMLElement>('.phead .lede');
  const ticketStatusSubtitle = container
    .querySelector<HTMLElement>('[data-pp-chart="ticketStatusChart"]')
    ?.closest<HTMLElement>('.card')
    ?.querySelector<HTMLElement>('.csub2');
  if (ticketStatusSubtitle) {
    ticketStatusSubtitle.textContent =
      total.kind === 'value'
        ? `Where the ${formatNumber(total.value)} tickets sit`
        : 'Ticket status distribution';
  }
  if (header) {
    header.textContent =
      total.kind === 'value'
        ? `${formatNumber(total.value)} tickets · Live helpdesk data`
        : total.kind === 'error'
          ? `Helpdesk API error · ${total.message}`
          : total.kind === 'loading'
            ? 'Loading live helpdesk data…'
            : 'Helpdesk data unavailable';
  }
  if (lede) {
    const responseValue = objectValue(response);
    const resolutionValue = objectValue(resolution);
    lede.textContent =
      responseValue || resolutionValue
        ? `${formatNumber(responseValue?.count)} response breaches (${formatPercent(responseValue?.breach_rate_percent)}) · ${formatNumber(resolutionValue?.count)} resolution breaches (${formatPercent(resolutionValue?.breach_rate_percent)}).`
        : 'Helpdesk service-level and ticket breakdowns from the API.';
  }
  setStatByLabel(
    container,
    'open tickets',
    open,
    `${formatNumber(getPath(endpointData(state, 'kpis')?.data, ['status_buckets', 'in_progress']))} in progress · ${formatPercent(assignedValue?.percent)} assigned`
  );
  setStatByLabel(
    container,
    'response breached',
    unwrapCount(response, ['count']),
    `${formatPercent(responseValue?.breach_rate_percent)} of tickets · target 0%`
  );
  setStatByLabel(
    container,
    'resolution breached',
    unwrapCount(resolution, ['count']),
    `${formatPercent(resolutionValue?.breach_rate_percent)} of tickets · target 0%`
  );
  setStatByLabel(
    container,
    'golden tickets',
    unwrapCount(golden, ['count']),
    `${formatNumber(goldenValue?.p1)} P1 · golden tickets`
  );
  setStatByLabel(container, 'total tickets', total, 'This period · All statuses');
  const proactiveTarget = numberValue(proactiveValue?.target_percent);
  setStatByLabel(
    container,
    'proactive tickets',
    unwrapCount(proactive, ['count']),
    `${formatPercent(proactiveValue?.percent)} ratio${
      proactiveTarget === null ? '' : ` · Target ${formatPercent(proactiveTarget)}+`
    }`
  );
  const proactiveReactiveCard =
    container.querySelector<HTMLElement>('#proactiveReactiveCard');
  if (proactiveReactiveCard) {
    proactiveReactiveCard.hidden = !proactiveReactive.hasData;
    proactiveReactiveCard.style.display = proactiveReactive.hasData ? '' : 'none';
    if (proactiveReactive.hasData) {
      const insightCard = proactiveReactiveCard.querySelector<HTMLElement>('.ci');
      const target = proactiveReactive.targetPercent ?? proactiveTarget ?? 70;
      const targetBadge = proactiveReactiveCard.querySelector<HTMLElement>('[data-proactive-target]');
      const insight = proactiveReactiveCard.querySelector<HTMLElement>('[data-proactive-insight]');
      const action = proactiveReactiveCard.querySelector<HTMLElement>('[data-proactive-action]');
      if (insightCard) insightCard.hidden = false;
      if (targetBadge) targetBadge.textContent = `Target: ${formatPercent(target)} Proactive`;
      if (insight) {
        insight.textContent = `${formatPercent(proactiveReactive.proactivePercent)} Proactive (${formatNumber(proactiveReactive.proactiveCount)} tickets) vs ${formatPercent(proactiveReactive.reactivePercent)} Reactive (${formatNumber(proactiveReactive.reactiveCount)} tickets). Proactive is the desired state—teams spot issues before residents complain.`;
      }
      if (action) {
        action.textContent = `Aim to reach ${formatPercent(target)}+ proactive tickets to demonstrate service quality to residents.`;
      }
    }
  }
  const totalValue = numberValue(total.kind === 'value' ? total.value : null) ?? 0;
  const riskCards: ApiRisk[] = [];
  const responseCount = numberValue(responseValue?.count);
  const resolutionCount = numberValue(resolutionValue?.count);
  const proactivePercent = numberValue(proactiveValue?.percent);
  if (responseCount !== null && responseCount > 0) {
    riskCards.push({
      severity: 'crit',
      label: 'Response SLA',
      title: `${formatNumber(responseCount)} response escalations breached`,
      body: `${formatPercent(responseValue?.breach_rate_percent)} breach rate across ${formatNumber(totalValue)} tickets.`,
      drill: 'resp_breach',
    });
  }
  if (resolutionCount !== null && resolutionCount > 0) {
    riskCards.push({
      severity: 'high',
      label: 'Resolution SLA',
      title: `${formatNumber(resolutionCount)} resolution escalations breached`,
      body: `${formatPercent(resolutionValue?.breach_rate_percent)} of tickets missed the resolution target.`,
      drill: 'res_breach',
    });
  }
  if (proactivePercent !== null && proactivePercent < (numberValue(proactiveValue?.target_percent) ?? 70)) {
    riskCards.push({
      severity: 'med',
      label: 'Proactive vs Reactive',
      title: `Proactive ratio is ${formatPercent(proactivePercent)}`,
      body: `Target is ${formatPercent(proactiveValue?.target_percent)}; review team-raised tickets.`,
      drill: 'tickets_open',
    });
  }
  bindHelpdeskNotice(container.querySelector<HTMLElement>('#notices'), riskCards);
  const slaBars = [
    { label: `Response breached (${formatNumber(responseValue?.count)})`, value: numberValue(responseValue?.breach_rate_percent) ?? 0, display: formatPercent(responseValue?.breach_rate_percent) },
    { label: `Resolution breached (${formatNumber(resolutionValue?.count)})`, value: numberValue(resolutionValue?.breach_rate_percent) ?? 0, display: formatPercent(resolutionValue?.breach_rate_percent) },
  ];
  setHorizontalBars(container, 'escalationChart', slaBars, 100);

  const sourceRows = arrayValue(read(state, 'sourceAndVolume', [['tower_wise_ticket_volume', 'breakdown']]));
  const sourceResult = read(state, 'sourceAndVolume', [['tower_wise_ticket_volume', 'breakdown']]);
  setHorizontalBars(
    container,
    'tbl_top_tower_wise_ticket_volume',
    sourceRows.map((row) => ({
      label: safeText(row.tower),
      value: numberValue(row.count) ?? 0,
      display: `${formatNumber(row.count)} (${formatPercent(row.percent)})`,
    })),
    undefined,
    sourceResult
  );
  const volumeInsight = container.querySelector<HTMLElement>('.ins.mb14');
  if (volumeInsight) {
    const topTower = sourceRows[0];
    const text = volumeInsight.querySelector<HTMLElement>('p');
    const action = volumeInsight.querySelector<HTMLElement>('.ins-act');
    if (text) {
      text.textContent = topTower
        ? `${safeText(topTower.tower)} has the highest reported ticket volume with ${formatNumber(topTower.count)} tickets (${formatPercent(topTower.percent)} of the total).`
        : 'No tower-wise ticket volume was returned for this period.';
    }
    if (action) action.textContent = 'Use the tower volume breakdown to identify where service demand is concentrated.';
  }

  const ageingResult = read(state, 'breachAndAgeing', [['tickets_ageing_matrix', 'priorities']]);
  const ageingRows = arrayValue(ageingResult).map((row) => {
    const buckets = isRecord(row.buckets) ? row.buckets : {};
    return [row.priority, buckets['0-3'], buckets['4-7'], buckets['8-14'], buckets['15-30'], buckets['30+'], row.total];
  });
  const categoryResult = read(state, 'breachAndAgeing', [['response_breach_rate_by_category']]);
  const categoryRows = arrayValue(categoryResult);
  const categoryData = categoryRows.flatMap((row) => {
    const name = safeText(row.category);
    const rate = numberValue(row.breach_rate_percent);
    if (name === '—' || rate === null) return [];
    return [{ name, rate, breached: numberValue(row.breached) }];
  });
  setHorizontalBars(
    container,
    'categoryChart',
    categoryData.map((row) => ({
      label: row.name,
      value: row.rate,
      display: formatPercent(row.rate),
    })),
    100,
    categoryResult
  );
  const categoryCard = container
    .querySelector<HTMLElement>('[data-info="categoryChart"]')
    ?.closest<HTMLElement>('.card');
  const categorySubtitle = categoryCard?.querySelector<HTMLElement>('.csub2');
  const categoryNarrative = categoryCard?.querySelector<HTMLElement>('.ins p');
  const categoryAction = categoryCard?.querySelector<HTMLElement>('.ins-act');
  if (categorySubtitle) categorySubtitle.textContent = 'Response breach rate by ticket category';
  const topCategory = [...categoryData].sort((left, right) => right.rate - left.rate)[0];
  const setCategoryAction = (text: string) => {
    if (!categoryAction) return;
    const icon = categoryAction.querySelector('svg');
    categoryAction.replaceChildren();
    if (icon) categoryAction.append(icon);
    categoryAction.append(document.createTextNode(text));
  };
  if (categoryNarrative) {
    if (topCategory && topCategory.rate > 0) {
      const breachTotal = categoryData.reduce((sum, row) => sum + (row.breached ?? 0), 0);
      const hasAllBreachCounts = categoryData.every((row) => row.breached !== null);
      const share =
        hasAllBreachCounts && breachTotal > 0 && topCategory.breached !== null
          ? ` It accounts for ${formatPercent((topCategory.breached / breachTotal) * 100)} of category-reported response breaches.`
          : '';
      categoryNarrative.textContent =
        `${topCategory.name} has the highest response breach rate at ${formatPercent(topCategory.rate)}.${share}`;
      setCategoryAction(
        `Review ${topCategory.name} response assignments and coverage based on its reported breach rate.`
      );
    } else if (topCategory) {
      categoryNarrative.textContent = 'No response breaches were reported across the returned categories.';
      setCategoryAction('Continue monitoring category response performance.');
    } else {
      categoryNarrative.textContent = tableMessage(
        categoryResult,
        categoryData.map((row) => [row.name, row.rate])
      );
      setCategoryAction('Review category response metrics when data is available.');
    }
  }
  const escalationCard = container.querySelector<HTMLElement>(
    '[data-info="escalationChart"]'
  )?.closest<HTMLElement>('.card');
  const escalationInsight = escalationCard?.querySelector<HTMLElement>('.ins-act');
  const escalationNarrative = escalationCard?.querySelector<HTMLElement>('.ins p');
  const escalationSubtitle = escalationCard?.querySelector<HTMLElement>('.csub2');
  if (escalationSubtitle) {
    escalationSubtitle.textContent =
      total.kind === 'value'
        ? `Of ${formatNumber(total.value)} tickets this period`
        : total.kind === 'loading'
          ? 'Loading ticket metrics…'
          : 'Ticket total unavailable';
  }
  if (escalationNarrative) {
    escalationNarrative.textContent =
      `Response breach rate: ${formatPercent(responseValue?.breach_rate_percent)}; resolution breach rate: ${formatPercent(resolutionValue?.breach_rate_percent)}. Prioritize the higher breach rate to reduce missed service targets.`;
  }
  if (escalationInsight) {
    const icon = escalationInsight.querySelector('svg');
    escalationInsight.replaceChildren();
    if (icon) escalationInsight.append(icon);
    escalationInsight.append(
      document.createTextNode('Prioritize response-time assignment and coverage to reduce first-response breaches.')
    );
  }

  const avgAge = read(state, 'breachAndAgeing', [['tickets_ageing_matrix', 'avg_ticket_age_open_days']]);
  const avgResolution = read(state, 'breachAndAgeing', [['tickets_ageing_matrix', 'avg_resolution_time_days']]);
  setKpiByLabel(container, 'average ticket age', avgAge, { value: (value) => `${formatNumber(value)} days` });
  setKpiByLabel(container, 'avg resolution time', avgResolution, { value: (value) => `${formatNumber(value)} days` });
  setKpiByLabel(container, 'assigned', unwrapCount(assigned, ['count']), {
    trend: assigned.kind === 'value' && isRecord(assigned.value)
      ? `${formatPercent(assigned.value.percent)} of tickets`
      : '',
  });
  setKpiByLabel(
    container,
    'executive escalation',
    read(state, 'escalations', [['executive_escalation', 'open']])
  );

  const ageingHost = container.querySelector<HTMLElement>('#ageing');
  if (ageingHost && ageingResult.kind === 'value' && ageingRows.length) {
    ageingHost.innerHTML = ageingRows
      .map((row) => {
        const [priority, ...values] = row;
        const cells = values.slice(0, 5).map((value) => {
          const count = numberValue(value) ?? 0;
          return `<span class="cell${count ? '' : ' z'}">${count ? escapeHtml(formatNumber(count)) : '—'}</span>`;
        });
        return `<div class="grid-row"><span>${escapeHtml(safeText(priority))}</span>${cells.join('')}<span class="tot">${escapeHtml(formatNumber(values[5]))}</span></div>`;
      })
      .join('');
  } else if (ageingHost) {
    setContentMessage(ageingHost, ageingResult);
  }
}

function bindSecurity(container: HTMLElement, state: PostPossessionApiState | undefined): void {
  const visitors = read(state, 'kpis', [['visitors_today']]);
  const preApproved = read(state, 'kpis', [['pre_approved']]);
  const postApproved = read(state, 'kpis', [['post_approved']]);
  const pending = read(state, 'kpis', [['pending_post_approval']]);
  const rejected = read(state, 'kpis', [['rejected']]);
  const patrol = read(state, 'kpis', [['patrol_compliance']]);
  const approvalPercent = read(state, 'kpis', [['visitor_approval_percent']]);
  const denied = read(state, 'kpis', [['denied_entries']]);

  setKpi(container, 'kpi_tsc_visitors_today', unwrapCount(visitors, ['total']), {
    trend: visitors.kind === 'value' && isRecord(visitors.value)
      ? `${formatNumber(visitors.value.in)} in · ${formatNumber(visitors.value.out)} out`
      : '',
  });
  setKpi(container, 'kpi_tsc_pre_approved', unwrapCount(preApproved, ['count']), {
    target: preApproved.kind === 'value' && isRecord(preApproved.value)
      ? `${formatPercent(preApproved.value.percent)} of guests`
      : '',
  });
  setKpi(container, 'kpi_tsc_post_approved', unwrapCount(postApproved, ['count']), {
    target: postApproved.kind === 'value' && isRecord(postApproved.value)
      ? `${formatPercent(postApproved.value.percent)} of guests`
      : '',
  });
  setKpi(container, 'kpi_tsc_pending_post_approval', unwrapCount(pending, ['count']), {
    trend: pending.kind === 'value' && isRecord(pending.value)
      ? `${formatNumber(pending.value.waiting_70_plus_min)} waiting 70+ min`
      : '',
  });
  setKpi(container, 'kpi_tsc_rejected', unwrapCount(rejected, ['count']), {
    target: rejected.kind === 'value' && isRecord(rejected.value)
      ? `${formatPercent(rejected.value.percent)} of guests`
      : '',
  });

  const patrolValue = objectValue(patrol);
  const patrolPercent = numberValue(patrolValue?.compliance_percent);
  setKpi(container, 'kpi_tsc_patrol_compliance', patrol.kind === 'value' && patrolPercent !== null
    ? { kind: 'value', value: patrolPercent }
    : patrol, {
    value: formatPercent,
    trend: patrolPercent !== null
      ? `${formatNumber(patrolValue?.checkpoints_visited)}/${formatNumber(patrolValue?.checkpoints_expected)} checkpoints`
      : '',
    target: 'Target: 100%',
    unavailableValue: '0',
  });

  const preValue = objectValue(preApproved);
  const pendingValue = objectValue(pending);
  const deniedValue = objectValue(denied);
  const visitorsValue = objectValue(visitors);
  const guestCount = numberValue(visitorsValue?.guests);
  const guestApproval = numberValue(approvalPercent.kind === 'value' ? approvalPercent.value : null) ?? 0;
  const pendingCount = numberValue(pendingValue?.count);
  const waitingCount = numberValue(pendingValue?.waiting_70_plus_min);
  const preApprovalPercent = numberValue(preValue?.percent);
  const incidentResult = read(state, 'patrolAndFlagged', [['missed_patrol_to_incident']]);
  const incidentSummary = objectValue(incidentResult);
  const incidentCount = numberValue(incidentSummary?.total);
  const correlatedIncidentCount = numberValue(incidentSummary?.correlated);
  const riskCards: ApiRisk[] = [
    {
      severity: 'high',
      label: 'High Priority',
      title: pendingCount !== null
        ? `${formatNumber(pendingCount)} guests pending Post Approval${waitingCount === null ? '' : ` — ${formatNumber(waitingCount)} waiting 70+ minutes`}`
        : pending.kind === 'loading'
          ? 'Loading pending approvals…'
          : pending.kind === 'unavailable'
            ? 'Pending approval data unavailable'
            : pending.kind === 'error'
              ? `Pending approval data error: ${pending.message}`
              : 'Pending approval count unavailable',
      body: pendingCount !== null
        ? waitingCount === null
          ? 'Review guest approvals waiting at the gate.'
          : `${formatNumber(waitingCount)} guests have waited over 70 minutes. Review pending approvals to reduce gate delays.`
        : pending.kind === 'unavailable'
          ? pending.reason
          : pending.kind === 'error'
            ? pending.message
            : pending.kind === 'loading'
              ? 'Pending approval metrics are loading from the API.'
              : 'The API did not return a pending approval count.',
      drill: 'vis_pending',
    },
    {
      severity: 'med',
      label: 'Watch Item',
      title: preApprovalPercent !== null
        ? `${formatPercent(preApprovalPercent)} of guests are Pre-Approved`
        : preApproved.kind === 'loading'
          ? 'Loading pre-approval rate…'
          : preApproved.kind === 'error'
            ? `Pre-approval data error: ${preApproved.message}`
            : 'Pre-approval rate unavailable',
      body: preApprovalPercent !== null
        ? [
            preValue?.count === undefined
              ? ''
              : `${formatNumber(preValue.count)} guests were pre-approved${
                  guestCount === null ? '' : ` out of ${formatNumber(guestCount)}`
                }. `,
            'The remaining guest visits require approval at the gate.',
          ].join('')
        : preApproved.kind === 'unavailable'
          ? preApproved.reason
          : preApproved.kind === 'error'
            ? preApproved.message
            : preApproved.kind === 'loading'
              ? 'Pre-approval metrics are loading from the API.'
              : 'The API did not return a pre-approval percentage.',
      drill: 'vis_post_approved',
    },
    {
      severity: 'high',
      label: 'High Risk',
      title: patrol.kind === 'unavailable'
        ? 'Patrol data unavailable'
        : incidentCount !== null
          ? `${formatNumber(incidentCount)} missed patrols; ${formatNumber(correlatedIncidentCount)} followed by an incident`
          : incidentResult.kind === 'loading'
            ? 'Loading patrol incident data…'
            : 'Patrol incident data unavailable',
      body: patrol.kind === 'unavailable'
        ? patrol.reason
        : incidentSummary
          ? `Missed patrols and incidents are reported for the last 7 days. ${incidentSummary.same_guard_for_all === true ? 'The same guard was assigned to every missed patrol.' : ''}`
          : incidentResult.kind === 'error'
            ? incidentResult.message
            : incidentResult.kind === 'unavailable'
              ? incidentResult.reason
              : 'No missed-patrol incident data was returned.',
      drill: 'patrol',
    },
  ];
  setRisks(container, riskCards);
  setBanner(
    container,
    state,
    patrolPercent === null ? '0' : formatPercent(patrolPercent),
    'patrol',
    patrol.kind === 'unavailable' ? 'Patrol data unavailable' : 'Live visitor and patrol activity',
    patrol.kind === 'unavailable' ? patrol.reason : '',
    [
      { label: 'Patrol compliance', value: patrolPercent ?? 0, percent: patrolPercent ?? 0, color: PP_PALETTE.green },
      { label: 'Visitor approval', value: guestApproval, percent: guestApproval, color: PP_PALETTE.teal },
      { label: 'Pre-approved', value: numberValue(preValue?.percent) ?? 0, percent: numberValue(preValue?.percent) ?? 0, color: PP_PALETTE.lavender },
      { label: 'Denied entries', value: numberValue(deniedValue?.count) ?? 0, percent: Math.min(numberValue(deniedValue?.count) ?? 0, 100), color: PP_PALETTE.crim },
    ]
  );
  const memberVehicleKpi = read(state, 'vehicleKpis', [['member_vehicles']]);
  const memberVehicleCount: ReadResult =
    memberVehicleKpi.kind === 'unavailable'
      ? { kind: 'value', value: 0 }
      : memberVehicleKpi;
  setKpiByLabel(container, 'vehicles today', memberVehicleCount);
  setKpiByLabel(container, 'member vehicles', memberVehicleCount);
  setKpiByLabel(container, 'guest vehicles', read(state, 'vehicleKpis', [['guest_vehicles', 'count']]), {
    trend: guestCount ? `${formatNumber(guestCount)} guests today` : '',
  });
  setKpiByLabel(
    container,
    'peak-hour guest share',
    read(state, 'vehicleKpis', [['peak_hour_guest_share', 'share_of_guest_traffic_in_peak_hour_percent']]),
    { value: formatPercent }
  );

  const gateResult = read(state, 'purposeGateAndVehicles', [['gate_wise_visitor_volume_today', 'breakdown']]);
  const gates = arrayValue(gateResult);
  setTableByInfo(
    container,
    'tbl_tsc_gate_wise_visitor_volume_today',
    gateResult,
    gates.map((row) => [row.gate ?? row.name, row.count, formatPercent(row.percent)]),
    'vis_today'
  );
  const gateHost = container.querySelector<HTMLElement>('#gateBars');
  if (gateHost) {
    gateHost.replaceChildren();
    const maxGateCount = Math.max(...gates.map((row) => numberValue(row.count) ?? 0), 1);
    for (const [index, gate] of gates.entries()) {
      const row = document.createElement('div');
      row.className = 'trow';
      const name = document.createElement('div');
      name.className = 'tn';
      name.textContent = safeText(gate.gate ?? gate.name);
      const track = document.createElement('div');
      track.className = 'tb2';
      track.dataset.drill = 'vis_today';
      const fill = document.createElement('div');
      fill.className = 'tf';
      fill.style.width = `${((numberValue(gate.count) ?? 0) / maxGateCount) * 100}%`;
      fill.style.background = seriesColor(index, 0.92);
      track.append(fill);
      const value = document.createElement('div');
      value.className = 'tv';
      value.textContent = formatNumber(gate.count);
      row.append(name, track, value);
      gateHost.append(row);
    }
  }

  const flaggedResult = read(state, 'patrolAndFlagged', [['denied_and_flagged', 'items']]);
  const flagged = arrayValue(flaggedResult);
  setTableByInfo(
    container,
    'tbl_tsc_denied_amp_flagged_today',
    flaggedResult,
    flagged.map((row) => [
      row.guest_name ?? row.visitor_name,
      row.status ?? row.reason,
      row.tower,
      row.flat,
      row.gate,
    ]),
    'vis_rejected'
  );

  const incidentsResult = read(state, 'patrolAndFlagged', [['missed_patrol_to_incident', 'items']]);
  const incidents = arrayValue(incidentsResult);
  setTableByInfo(
    container,
    'tbl_tsc_missed_patrol_resulting_incidents',
    incidentsResult,
    incidents.map((row) => [
      row.missed_checkpoint,
      row.missed_at,
      row.time_to_incident_minutes === null ? 'No incident' : `${formatNumber(row.time_to_incident_minutes)} min`,
      row.resulting_record,
      row.guard_name,
    ]),
    'patrol'
  );
}

function bindStaff(container: HTMLElement, state: PostPossessionApiState | undefined): void {
  const kpiData = endpointData(state, 'kpis')?.data;
  const withUnavailableNote = (result: ReadResult, key: string): ReadResult => {
    const note = getPath(kpiData, ['global_notes', key]);
    return result.kind === 'value' && result.value === null && typeof note === 'string'
      ? { kind: 'unavailable', reason: note }
      : result;
  };
  const scheduled = withUnavailableNote(read(state, 'kpis', [['scheduled_today']]), 'scheduled_today');
  const flatOnRecord = readRaw(state, 'kpis', ['active_staff_on_record']);
  const activeOnRecord =
    flatOnRecord.kind === 'value'
      ? flatOnRecord
      : readRaw(state, 'kpis', ['scheduled_today', 'active_staff_on_record']);
  const present = read(state, 'kpis', [['present']]);
  const absent = withUnavailableNote(read(state, 'kpis', [['absent']]), 'absent');
  const gap = withUnavailableNote(
    read(state, 'kpis', [['evening_shift_gap']]),
    'evening_shift_gap'
  );
  const lateArrivals = withUnavailableNote(
    read(state, 'kpis', [['late_arrivals']]),
    'late_arrivals'
  );
  const attendance = read(state, 'kpis', [['attendance_percent']]);
  const categories = read(state, 'coverage', [['staff_category_chart']]);
  const shift = read(state, 'coverage', [['shift_coverage_chart']]);
  const onRecordValue = activeOnRecord.kind === 'value' ? numberValue(activeOnRecord.value) : null;
  const unavailableAsZero = (result: ReadResult): ReadResult =>
    result.kind === 'unavailable' ? { kind: 'value', value: 0 } : result;
  const scheduledNote = getPath(kpiData, ['global_notes', 'scheduled_today']);
  const absentNote = getPath(kpiData, ['global_notes', 'absent']);
  const gapNote = getPath(kpiData, ['global_notes', 'evening_shift_gap']);

  setKpi(container, 'kpi_tst_scheduled_today', unavailableAsZero(scheduled), {
    target:
      onRecordValue !== null
        ? `${formatNumber(onRecordValue)} active staff on record; not a scheduled count`
        : typeof scheduledNote === 'string'
          ? scheduledNote
          : 'Attendance scheduling data',
  });
  setKpi(container, 'kpi_tst_present', present, {
    target:
      attendance.kind === 'value' && numberValue(attendance.value) !== null
        ? `${formatPercent(attendance.value)} of active staff on record`
        : '',
  });
  setKpi(container, 'kpi_tst_absent', unavailableAsZero(absent), {
    target: typeof absentNote === 'string' ? absentNote : '',
  });
  setKpi(container, 'kpi_tst_evening_shift_gap', unavailableAsZero(gap), {
    target: typeof gapNote === 'string' ? gapNote : '',
  });
  setBanner(
    container,
    state,
    onRecordValue === null ? '—' : formatNumber(onRecordValue),
    'staff on record',
    scheduled.kind === 'unavailable' ? 'Attendance data is unavailable' : 'Staff attendance',
    scheduled.kind === 'unavailable' ? scheduled.reason : '',
    onRecordValue === null
      ? []
      : [{ label: 'Active staff on record', value: onRecordValue, percent: 100, color: PP_PALETTE.lavender }]
  );
  const eveningShift = arrayValue(shift).find(
    (row) => safeText(row.shift).toLowerCase() === 'evening'
  );
  const eveningPresent = numberValue(eveningShift?.present);
  const metricRiskText = (result: ReadResult, label: string): { title: string; body: string } => {
    if (result.kind === 'value') {
      return {
        title: `${label}: ${formatNumber(result.value)}`,
        body: `${label} is reported by the Staff API. Review the attendance details and arrange coverage as needed.`,
      };
    }
    if (result.kind === 'unavailable') {
      return { title: `${label} unavailable`, body: result.reason };
    }
    if (result.kind === 'error') {
      return { title: `${label} API error`, body: result.message };
    }
    return {
      title: `${label} is loading`,
      body: 'This metric is being retrieved from the Staff API.',
    };
  };
  const eveningRisk = metricRiskText(gap, 'Evening shift gap');
  const absentRisk = metricRiskText(absent, 'Staff absence count');
  const lateRisk = metricRiskText(lateArrivals, 'Late arrivals');
  setRisks(container, [
    {
      severity: 'crit',
      label: 'Critical Risk',
      title: eveningRisk.title,
      body: eveningPresent === null
        ? eveningRisk.body
        : `${formatNumber(eveningPresent)} staff entries were recorded in the evening window. ${eveningRisk.body}`,
      drill: 'staff_gap',
    },
    {
      severity: 'high',
      label: 'High Risk',
      title: absentRisk.title,
      body: absentRisk.body,
      drill: 'staff_absent',
    },
    {
      severity: 'med',
      label: 'Watchlist',
      title: lateRisk.title,
      body: lateRisk.body,
      drill: 'staff_present',
    },
  ]);
  const categoryTitle = container.querySelector<HTMLElement>('[data-info="staffCategoryChart"]');
  if (categoryTitle) {
    const cardTitle = categoryTitle.closest('.ct');
    const textNode = cardTitle?.childNodes[0];
    if (textNode) textNode.textContent = 'Active staff on record by category';
  }
  setChartMessage(container, 'staffCategoryChart', categories);
  setChartMessage(container, 'shiftCoverageChart', shift);
}

function bindClub(container: HTMLElement, state: PostPossessionApiState | undefined): void {
  const totalMembers = read(state, 'kpis', [['total_members']]);
  const pending = read(state, 'kpis', [['pending_activation']]);
  const bookings = read(state, 'kpis', [['bookings_today']]);
  const payments = read(state, 'kpis', [['pending_payments']]);
  const failed = read(state, 'kpis', [['failed_payments']]);
  const expiring = read(state, 'kpis', [['expiring_soon']]);
  const bookingsRecord = objectValue(bookings);
  const paymentRecord = objectValue(payments);
  const failedRecord = objectValue(failed);
  const expiringRecord = objectValue(expiring);
  const memberCount = numberValue(totalMembers.kind === 'value' ? totalMembers.value : null);
  const bookingCount = numberValue(bookings.kind === 'value' ? bookings.value : null)
    ?? numberValue(bookingsRecord?.count);
  const pendingPaymentCount = numberValue(payments.kind === 'value' ? payments.value : null)
    ?? numberValue(paymentRecord?.total);
  const failedCount = numberValue(failed.kind === 'value' ? failed.value : null)
    ?? numberValue(failedRecord?.count);
  const expiringCount = numberValue(expiring.kind === 'value' ? expiring.value : null)
    ?? numberValue(expiringRecord?.count);
  const pendingActivationCount = numberValue(pending.kind === 'value' ? pending.value : null)
    ?? numberValue(objectValue(pending)?.count);
  const failedAmount = read(state, 'kpis', [['failed_payments_amount']]);
  const failedPaymentLatest = objectValue(read(state, 'kpis', [['failed_payment_latest']]));
  const slotsResult = read(state, 'slotsAndExpiring', [
    ['facility_slots'],
    ['facility_slots_morning_vs_evening', 'facilities'],
  ]);
  const slotRows = arrayValue(slotsResult).filter((row) => !isTestRecord(row));
  const bookingFacilities = filteredArray(
    bookingsRecord ? { kind: 'value', value: bookingsRecord.facilities } : bookings
  );
  const expiringList = read(state, 'slotsAndExpiring', [
    ['memberships_expiring'],
    ['memberships_expiring_next_30_days', 'members'],
  ]);
  const expiringRecords = arrayValue(expiringList).filter((row) => !isTestRecord(row));
  const expiringListCount =
    expiringList.kind === 'value' && Array.isArray(expiringList.value)
      ? expiringRecords.length
      : null;

  setKpi(container, 'kpi_tcl_total_members', totalMembers, { trend: 'All membership records' });
  setKpi(container, 'kpi_tcl_pending_activation', pending, { target: 'Activation status is not computable' });
  setKpi(container, 'kpi_tcl_bookings_today', bookings.kind === 'value'
    ? { kind: 'value', value: bookingCount ?? 0 }
    : bookings, {
    trend: bookingFacilities.length
      ? bookingFacilities.slice(0, 3).map(safeText).join(', ')
      : 'No facility bookings listed',
  });
  setKpi(container, 'kpi_tcl_pending_payments', payments.kind === 'value'
    ? { kind: 'value', value: pendingPaymentCount ?? 0 }
    : payments, {
    trend: paymentRecord?.note ? String(paymentRecord.note) : 'Club member and facility booking payments',
  });
  setKpi(container, 'kpi_tcl_failed_payments', failed.kind === 'value'
    ? { kind: 'value', value: failedCount ?? 0 }
    : failed, {
    trend: failedRecord?.total_amount !== undefined
      ? `${formatCurrency(failedRecord.total_amount)} failed`
      : '',
  });
  setKpi(container, 'kpi_tcl_expiring_soon', expiring.kind === 'value'
    ? { kind: 'value', value: expiringCount ?? expiringListCount }
    : expiring, {
    trend: expiringRecord?.window_days ? `Next ${formatNumber(expiringRecord.window_days)} days` : '',
  });

  const pendingReason = pending.kind === 'unavailable'
    ? pending.reason
    : typeof getPath(endpointData(state, 'kpis')?.data, ['global_notes', 'pending_activation']) === 'string'
      ? String(getPath(endpointData(state, 'kpis')?.data, ['global_notes', 'pending_activation']))
      : '';
  const metricRiskText = (
    result: ReadResult,
    count: number | null,
    label: string,
    activeTitle: (value: number) => string,
    emptyTitle: string,
    activeBody: string,
    emptyBody: string
  ): { title: string; body: string } => {
    if (result.kind === 'loading') {
      return { title: `${label} loading`, body: 'This metric is being retrieved from the Club & Facilities API.' };
    }
    if (result.kind === 'error') {
      return { title: `${label} API error`, body: result.message };
    }
    if (result.kind === 'unavailable') {
      return { title: `${label} unavailable`, body: result.reason };
    }
    if (count === null) {
      return { title: `${label} unavailable`, body: 'The API did not return a usable count for this metric.' };
    }
    return count > 0
      ? { title: activeTitle(count), body: activeBody }
      : { title: emptyTitle, body: emptyBody };
  };
  const activationRisk = metricRiskText(
    pending,
    pendingActivationCount,
    'Membership activation',
    (count) => `${formatNumber(count)} club memberships in Pending — not yet activated`,
    'No memberships pending activation',
    pendingReason || 'Review pending memberships and activate members who are eligible to use club facilities.',
    'The API reports no pending memberships.'
  );
  const renewalRisk = metricRiskText(
    expiring,
    expiringCount ?? expiringListCount,
    'Membership renewal',
    (count) => `${formatNumber(count)} memberships expiring within 30 days — outreach needed`,
    'No memberships expiring within 30 days',
    'Review the expiring list and contact members before their access ends.',
    'The API reports no memberships expiring in the next 30 days.'
  );
  const failedRisk = metricRiskText(
    failed,
    failedCount,
    'Payment recovery',
    (count) => `${formatNumber(count)} failed payments`,
    'No failed payments',
    (() => {
      const latestName = safeText(failedPaymentLatest?.member_name);
      const amount = numberValue(failedPaymentLatest?.amount)
        ?? numberValue(failedAmount.kind === 'value' ? failedAmount.value : null)
        ?? numberValue(failedRecord?.total_amount);
      const latestPayment = failedPaymentLatest && latestName !== '—'
        ? ` Latest: ${latestName}${amount === null ? '' : ` (${formatCurrency(amount)})`}.`
        : amount === null ? '' : ` Total recorded amount: ${formatCurrency(amount)}.`;
      return `Review failed transactions and contact members to retry payment or arrange collection.${latestPayment}`;
    })(),
    'The API reports no failed payments.'
  );
  setRisks(container, [
    { severity: 'crit', label: 'Action Required', ...activationRisk, drill: 'members_pending' },
    { severity: 'high', label: 'Renewal Alert', ...renewalRisk, drill: 'expiring_mem' },
    { severity: 'med', label: 'Payment Recovery', ...failedRisk, drill: 'failed_payments' },
  ]);

  setBanner(
    container,
    state,
    memberCount === null ? '—' : formatNumber(memberCount),
    'members',
    pendingReason ? 'Activation status unavailable' : `${formatNumber(pendingPaymentCount ?? 0)} pending payments`,
    pendingReason || (bookingCount === null ? '' : `${formatNumber(bookingCount)} facility bookings today.`),
    [
      { label: 'Members', value: memberCount ?? 0, percent: 100, color: PP_PALETTE.lavender },
      { label: 'Bookings Today', value: bookingCount ?? 0, percent: memberCount ? (bookingCount ?? 0) / memberCount * 100 : 0, color: PP_PALETTE.coral },
      { label: 'Pending Payments', value: pendingPaymentCount ?? 0, percent: memberCount ? (pendingPaymentCount ?? 0) / memberCount * 100 : 0, color: PP_PALETTE.crim },
    ]
  );

  const facilitySlotTableRows = slotRows.map((row) => {
    const morning = isRecord(row.morning) ? row.morning : row;
    const evening = isRecord(row.evening) ? row.evening : row;
    const morningBooked = row.morning_booked ?? morning.booked;
    const morningCapacity = row.morning_capacity ?? morning.capacity;
    const eveningBooked = row.evening_booked ?? evening.booked;
    const eveningCapacity = row.evening_capacity ?? evening.capacity;
    const morningVacant = numberValue(morning.vacant);
    const eveningVacant = numberValue(evening.vacant);
    const bookedMorningValue = numberValue(morningBooked);
    const capacityMorningValue = numberValue(morningCapacity);
    const bookedEveningValue = numberValue(eveningBooked);
    const capacityEveningValue = numberValue(eveningCapacity);
    const derivedVacant =
      bookedMorningValue !== null &&
      capacityMorningValue !== null &&
      bookedEveningValue !== null &&
      capacityEveningValue !== null
        ? capacityMorningValue -
          bookedMorningValue +
          capacityEveningValue -
          bookedEveningValue
        : null;
    const vacant =
      numberValue(row.vacant) ??
      (morningVacant !== null || eveningVacant !== null
        ? (morningVacant ?? 0) + (eveningVacant ?? 0)
        : derivedVacant);

    return [
      safeText(row.facility),
      `${safeText(morningBooked)}/${safeText(morningCapacity)}`,
      `${safeText(eveningBooked)}/${safeText(eveningCapacity)}`,
      safeText(vacant),
    ];
  });
  setTableBySelector(
    container,
    'table.slottbl',
    slotsResult,
    facilitySlotTableRows,
    'bookings_today'
  );

  const facilityInsight = objectValue(
    read(state, 'membershipBreakdown', [['facility_insight']])
  );
  const facilityInfoButton = container.querySelector<HTMLElement>('[data-info="facilityChart"]');
  const facilityCard = facilityInfoButton?.closest<HTMLElement>('.card');
  const facilityInsightCallout = facilityCard?.querySelector<HTMLElement>('.ci.fo');
  const facilityChartHost = facilityCard?.querySelector<HTMLElement>(
    '[data-pp-chart="facilityChart"]'
  );
  if (facilityInsightCallout) {
    const mostBooked = isRecord(facilityInsight?.most_booked)
      ? facilityInsight.most_booked
      : null;
    const leastBooked = Array.isArray(facilityInsight?.least_booked)
      ? facilityInsight.least_booked.filter(
          (facility): facility is string => typeof facility === 'string'
        )
      : [];
    const mostBookedName = mostBooked ? safeText(mostBooked.facility) : '';
    const mostBookedCount = mostBooked ? numberValue(mostBooked.bookings) : null;
    const mostBookedText =
      mostBookedName && mostBookedName !== '—' && mostBookedCount !== null
        ? `${mostBookedName} is the most-booked facility (${formatNumber(mostBookedCount)} bookings).`
        : '';
    const leastBookedText = leastBooked.length
      ? `${leastBooked.join(' and ')} have lower utilisation.`
      : '';
    const insightText =
      typeof facilityInsight?.insight === 'string' && facilityInsight.insight.trim()
        ? facilityInsight.insight
        : `${mostBookedText} ${leastBookedText}`.trim();
    const actionText =
      typeof facilityInsight?.action === 'string' ? facilityInsight.action.trim() : '';

    if (insightText || actionText) {
      facilityInsightCallout.replaceChildren();
      facilityInsightCallout.hidden = false;
      if (insightText) {
        const summary = document.createElement('div');
        summary.className = 'ci-h';
        summary.textContent = insightText;
        facilityInsightCallout.append(summary);
      }
      if (actionText) {
        const action = document.createElement('div');
        action.className = 'ci-a';
        action.textContent = `→ ${actionText}`;
        facilityInsightCallout.append(action);
      }
      const facilityChart = read(state, 'membershipBreakdown', [['facility_chart']]);
      if (
        facilityChartHost &&
        facilityChart.kind === 'value' &&
        Array.isArray(facilityChart.value) &&
        facilityChart.value.length === 0
      ) {
        facilityChartHost.hidden = true;
      }
    }
  }

  const expiringInfo = container.querySelector<HTMLElement>(
    '[data-info="tbl_tcl_memberships_expiring_next_30_days"]'
  );
  const expiringCard = expiringInfo?.closest<HTMLElement>('.card');
  if (expiringCard) {
    expiringCard.querySelectorAll('.evitem').forEach((item) => item.remove());
    const appendMessage = (message: string) => {
      const item = document.createElement('div');
      item.className = 'evitem';
      const body = document.createElement('div');
      body.className = 'ev-b';
      const text = document.createElement('div');
      text.className = 'ev-t';
      text.textContent = message;
      body.append(text);
      item.append(body);
      expiringCard.append(item);
    };
    if (expiringList.kind !== 'value') {
      appendMessage(
        expiringList.kind === 'error'
          ? `API error: ${expiringList.message}`
          : expiringList.kind === 'unavailable'
            ? `Data Not Available: ${expiringList.reason}`
            : 'Loading from API…'
      );
    } else if (expiringRecords.length === 0) {
      appendMessage('No memberships expiring in the next 30 days.');
    } else {
      for (const member of expiringRecords) {
        const item = document.createElement('div');
        item.className = 'evitem';
        item.dataset.drill = 'expiring_mem';
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        const dot = document.createElement('span');
        dot.className = 'ev-dot';
        dot.style.background = 'var(--amb)';
        const memberBody = document.createElement('div');
        memberBody.className = 'ev-b';
        const title = document.createElement('div');
        title.className = 'ev-t';
        title.textContent = [
          member.name ?? member.member_name ?? member.full_name,
          member.plan ?? member.membership_plan,
        ]
          .filter(Boolean)
          .map(String)
          .join(' — ') || `Member ${safeText(member.id)}`;
        const meta = document.createElement('div');
        meta.className = 'ev-m';
        meta.textContent = `Expiry: ${safeText(member.end_date ?? member.expiry_date)}`;
        const status = document.createElement('span');
        status.className = 'ev-tag bwa';
        status.textContent = safeText(member.status ?? 'Expiring');
        memberBody.append(title, meta);
        item.append(dot, memberBody, status);
        expiringCard.append(item);
      }
    }
  }

  for (const id of CHART_IDS.club) {
    const endpointKey = CHART_ENDPOINT[id];
    setChartMessage(container, id, read(state, endpointKey, CHART_REASON_PATHS[id] ?? []));
  }
}

function bindFitout(container: HTMLElement, state: PostPossessionApiState | undefined): void {
  const total = unwrapCount(read(state, 'kpis', [['total_requests']]), ['total']);
  const pending = unwrapCount(read(state, 'kpis', [['pending']]), ['count']);
  const resident = unwrapCount(read(state, 'kpis', [['resident_raised']]), ['count']);
  const deviations = read(state, 'kpis', [['open_deviations']]);
  const moveIn = read(state, 'kpis', [['move_in_requests', 'move_in'], ['move_in_requests']]);
  const totalByType = read(state, 'kpis', [['total_requests_by_type'], ['total_requests', 'by_type']]);
  const byType = entriesFromObject(totalByType.kind === 'value' ? totalByType.value : null);
  const admin = readRaw(state, 'kpis', ['resident_raised_admin_raised']);
  const adminNested = readRaw(state, 'kpis', ['resident_raised', 'admin_raised']);
  const adminResult = admin.kind === 'value' ? admin : adminNested;
  const residentPct = read(state, 'kpis', [
    ['resident_raised_percent_of_total'],
    ['resident_raised', 'percent_of_total'],
  ]);
  const totalNum = numberValue(total.kind === 'value' ? total.value : null);
  const pendingNum = numberValue(pending.kind === 'value' ? pending.value : null);
  const residentNum = numberValue(resident.kind === 'value' ? resident.value : null);
  const adminNum = numberValue(adminResult.kind === 'value' ? adminResult.value : null);
  const countsInvalid =
    totalNum !== null &&
    residentNum !== null &&
    adminNum !== null &&
    (residentNum < 0 || adminNum < 0 || residentNum + adminNum !== totalNum);

  setKpi(container, 'kpi_tft_total_requests', total, {
    target: byType.map(([name, count]) => `${name}: ${formatNumber(count)}`).join(' · '),
  });
  setKpi(container, 'kpi_tft_pending', pending, {
    trend: 'Status-name heuristic',
    target: 'Review request statuses',
  });
  setKpi(container, 'kpi_tft_resident_raised', resident, {
    value: formatNumber,
    trend: adminNum === null ? '' : `Admin-raised: ${formatNumber(adminNum)}`,
    target: residentPct.kind === 'value' ? `${formatPercent(residentPct.value)} of requests` : '',
  });
  setKpi(container, 'kpi_tft_open_deviations', deviations, { trend: 'Open deviations' });
  setKpi(container, 'kpi_tft_move_in_requests', moveIn, {
    trend: 'Move In requests',
    target: state?.loading ? '' : 'New occupants',
  });

  const outcomesRaw = endpointData(state, 'outcomes')?.data;
  const flatOutcomes = isRecord(outcomesRaw) && 'rejection_rate_percent' in outcomesRaw ? outcomesRaw : null;
  const outcomes: ReadResult = flatOutcomes
    ? {
        kind: 'value',
        value: {
          rejection_rate_percent: flatOutcomes.rejection_rate_percent,
          rejected: flatOutcomes.rejected_count,
          decided_requests: flatOutcomes.decided_count,
          by_who_raised_it: {
            Resident: { rejection_rate_percent: flatOutcomes.resident_rejection_rate_percent },
            Admin: { rejection_rate_percent: flatOutcomes.admin_rejection_rate_percent },
          },
        },
      }
    : read(state, 'outcomes', [['rejection_rate_all_time']]);
  const rejectionRecord = objectValue(outcomes);
  const rejectionRate = rejectionRecord ? numberValue(rejectionRecord.rejection_rate_percent) : null;
  const outcomesData: ReadResult = flatOutcomes
    ? { kind: 'value', value: flatOutcomes.deposit_currently_held }
    : read(state, 'outcomes', [['deposit_currently_held']]);
  const refund: ReadResult = flatOutcomes
    ? {
        kind: 'value',
        value: {
          fitouts_count: flatOutcomes.refund_due_30_days_count,
          total_deposit_amount: flatOutcomes.refund_due_30_days_amount,
        },
      }
    : read(state, 'outcomes', [['refund_due_30_days']]);
  const refundRecord = objectValue(refund);
  const compliance: ReadResult = flatOutcomes
    ? {
        kind: 'value',
        value: {
          percent: flatOutcomes.avg_compliance_completion_percent,
          completed_items: flatOutcomes.avg_items_completed,
          total_items: flatOutcomes.avg_items_total,
          active_fitouts: flatOutcomes.active_fitouts,
        },
      }
    : read(state, 'outcomes', [['avg_compliance_completion']]);
  const complianceRecord = objectValue(compliance);
  const noActiveFitouts = numberValue(complianceRecord?.active_fitouts) === 0;
  const compliancePercent =
    numberValue(complianceRecord?.percent) ?? (noActiveFitouts ? 0 : null);
  const completedChecklistItems =
    numberValue(complianceRecord?.completed_items) ?? (noActiveFitouts ? 0 : null);
  const totalChecklistItems =
    numberValue(complianceRecord?.total_items) ?? (noActiveFitouts ? 0 : null);
  setKpi(container, 'kpi_tft_rejection_rate_all_time',
    rejectionRate === null ? outcomes : { kind: 'value', value: rejectionRate },
    {
      value: formatPercent,
      trend: rejectionRecord
        ? `${formatNumber(rejectionRecord.rejected)} of ${formatNumber(rejectionRecord.decided_requests)} decided requests`
        : '',
      target: rejectionRecord
        ? Object.entries(isRecord(rejectionRecord.by_who_raised_it) ? rejectionRecord.by_who_raised_it : {})
            .map(([name, data]) => `${name}: ${formatPercent(isRecord(data) ? data.rejection_rate_percent : null)}`)
            .join(' · ')
        : '',
    }
  );
  setKpi(container, 'kpi_tft_deposit_currently_held', outcomesData, {
    value: formatCurrency,
    trend: outcomesData.kind === 'unavailable' ? 'Data Not Available' : '',
  });
  setKpi(container, 'kpi_tft_refund_due_30_days',
    refundRecord ? { kind: 'value', value: refundRecord.fitouts_count } : refund,
    {
      trend: 'Fitouts completing soon',
      target: refundRecord
        ? isRecord(refundRecord.total_deposit_amount) &&
          refundRecord.total_deposit_amount.available === false
          ? `Deposit amount unavailable: ${safeText(refundRecord.total_deposit_amount.reason)}`
          : formatCurrency(refundRecord.total_deposit_amount)
        : '',
    }
  );
  setKpi(container, 'kpi_tft_avg_compliance_completion',
    complianceRecord ? { kind: 'value', value: compliancePercent } : compliance,
    {
      value: formatPercent,
      trend: complianceRecord
        ? `${formatNumber(completedChecklistItems)} of ${formatNumber(totalChecklistItems)} checklist items`
        : '',
      target: complianceRecord ? `Across ${formatNumber(complianceRecord.active_fitouts)} active fitouts` : '',
    }
  );

  const pendingNote =
    getPath(endpointData(state, 'kpis')?.data, ['pending_note']) ??
    getPath(endpointData(state, 'kpis')?.data, ['pending', 'note']);
  const deviationCount = numberValue(deviations.kind === 'value' ? deviations.value : null);
  const moveInCount =
    numberValue(moveIn.kind === 'value' ? moveIn.value : null) ??
    numberValue(objectValue(moveIn)?.count);
  const deviationCategories = arrayValue(read(state, 'typeDeviation', FITOUT_DEVIATION_PATHS));
  const largestDeviationCategory = deviationCategories.reduce<Record<string, unknown> | null>(
    (largest, row) =>
      !largest || (numberValue(row.count) ?? 0) > (numberValue(largest.count) ?? 0)
        ? row
        : largest,
    null
  );
  const countRiskText = (
    result: ReadResult,
    count: number | null,
    label: string,
    activeTitle: (value: number) => string,
    emptyTitle: string,
    activeBody: string,
    emptyBody: string
  ): { title: string; body: string } => {
    if (result.kind === 'loading') {
      return { title: `${label} loading`, body: 'This metric is being retrieved from the Fitout API.' };
    }
    if (result.kind === 'error') {
      return { title: `${label} API error`, body: result.message };
    }
    if (result.kind === 'unavailable') {
      return { title: `${label} unavailable`, body: result.reason };
    }
    if (count === null) {
      return { title: `${label} unavailable`, body: 'The API did not return a usable count for this metric.' };
    }
    return count > 0
      ? { title: activeTitle(count), body: activeBody }
      : { title: emptyTitle, body: emptyBody };
  };
  const pendingRisk = countRiskText(
    pending,
    pendingNum,
    'Pending requests',
    (count) => `${formatNumber(count)} pending requests`,
    'No pending requests',
    typeof pendingNote === 'string' ? pendingNote : 'Review requests awaiting a decision.',
    'The API reports no pending requests.'
  );
  const deviationRisk = countRiskText(
    deviations,
    deviationCount,
    'Open deviations',
    (count) => `${formatNumber(count)} open deviations`,
    'No open deviations',
    largestDeviationCategory
      ? `Largest reported category: ${safeText(largestDeviationCategory.deviation_type ?? largestDeviationCategory.name ?? largestDeviationCategory.category ?? largestDeviationCategory.type)} (${formatNumber(largestDeviationCategory.count)}). Verify each deviation against the approved scope.`
      : 'Review the deviation types returned by the API and verify each against the approved scope.',
    'The API reports no open deviations.'
  );
  const moveInRisk = countRiskText(
    moveIn,
    moveInCount,
    'Move In requests',
    (count) => `${formatNumber(count)} Move In requests`,
    'No Move In requests',
    'The API reports the total Move In count, but does not separate Move In requests by pending status.',
    'The API reports no Move In requests.'
  );
  const decidedCount = numberValue(rejectionRecord?.decided_requests);
  const rejectedCount = numberValue(rejectionRecord?.rejected);
  const creatorRates = isRecord(rejectionRecord?.by_who_raised_it)
    ? Object.entries(rejectionRecord.by_who_raised_it)
        .map(([creator, data]) =>
          `${creator}: ${formatPercent(isRecord(data) ? data.rejection_rate_percent : null)}`
        )
        .join(' · ')
    : '';
  const rejectionRisk: ApiRisk = outcomes.kind === 'loading'
    ? {
        severity: 'med',
        label: 'All-Time Finding',
        title: 'Rejection data loading',
        body: 'All-time outcome metrics are being retrieved from the Fitout API.',
        drill: 'fitout_rejection_rate',
      }
    : outcomes.kind === 'error'
      ? {
          severity: 'med',
          label: 'All-Time Finding',
          title: 'Rejection data API error',
          body: outcomes.message,
          drill: 'fitout_rejection_rate',
        }
      : rejectionRate === null
        ? {
            severity: 'med',
            label: 'All-Time Finding',
            title: 'All-time rejection rate unavailable',
            body: outcomes.kind === 'unavailable' ? outcomes.reason : 'The API did not return an all-time rejection rate.',
            drill: 'fitout_rejection_rate',
          }
        : {
            severity: rejectionRate >= 50 ? 'crit' : 'med',
            label: 'All-Time Finding',
            title: `${formatPercent(rejectionRate)} rejection rate across ${formatNumber(decidedCount)} decided requests`,
            body: `${formatNumber(rejectedCount)} of ${formatNumber(decidedCount)} decided requests were rejected.${creatorRates ? ` ${creatorRates}.` : ''}`,
            drill: 'fitout_rejection_rate',
          };
  const heldDepositAmount = numberValue(outcomesData.kind === 'value' ? outcomesData.value : null);
  const refundDueAmount = numberValue(refundRecord?.total_deposit_amount);
  const liabilityBody = outcomesData.kind === 'loading'
    ? 'Liability metrics are being retrieved from the Fitout API.'
    : outcomesData.kind === 'error'
      ? `Active deposit data API error: ${outcomesData.message}`
      : outcomesData.kind === 'unavailable'
        ? `Active deposit data unavailable: ${outcomesData.reason}`
        : `The API does not break out deposits owed after rejected requests. ${
          heldDepositAmount === null
            ? 'Active fitout deposit total is unavailable'
            : `${formatCurrency(heldDepositAmount)} is held across active fitouts`
        }${
          refundDueAmount === null
            ? '. Refunds due in the next 30 days are not reported as rejected-request liabilities.'
            : `; ${formatCurrency(refundDueAmount)} is scheduled for refund in the next 30 days, not identified as rejected-request liability.`
        }`;
  const liabilityRisk: ApiRisk = {
    severity: 'high',
    label: 'Liability Cleanup',
    title: outcomesData.kind === 'loading'
      ? 'Liability metrics loading'
      : outcomesData.kind === 'error'
        ? 'Deposit data API error'
        : 'Rejected-request refund balance unavailable',
    body: liabilityBody,
    drill: 'fitout_refund_due',
  };
  const riskHosts = Array.from(container.querySelectorAll<HTMLElement>('.rg'));
  renderRiskHost(riskHosts[0], [
    { severity: 'crit', label: 'Action Required', ...pendingRisk, drill: 'fitout_pending' },
    { severity: 'high', label: 'High Risk', ...deviationRisk, drill: 'fitout_deviations' },
    { severity: 'med', label: 'Monitor', ...moveInRisk, drill: 'fitout_movein' },
  ]);
  renderRiskHost(riskHosts[1], [rejectionRisk, liabilityRisk]);
  setBanner(
    container,
    state,
    totalNum === null ? '—' : formatNumber(totalNum),
    'requests',
    `${formatNumber(pendingNum ?? 0)} pending · ${formatNumber(deviationCount ?? 0)} open deviations`,
    countsInvalid
      ? `The API reports ${formatNumber(residentNum)} resident-raised and ${formatNumber(adminNum)} admin-raised requests against ${formatNumber(totalNum)} total.`
      : typeof pendingNote === 'string'
        ? pendingNote
        : 'Fitout and Move In request totals from the API.',
    [
      { label: 'Pending', value: pendingNum ?? 0, percent: totalNum ? ((pendingNum ?? 0) / totalNum) * 100 : 0, color: PP_PALETTE.lavender },
      ...byType.slice(0, 2).map(([label, value], index) => ({
        label,
        value,
        percent: totalNum ? (value / totalNum) * 100 : 0,
        color: index ? PP_PALETTE.for : PP_PALETTE.coral,
      })),
      { label: 'Open Deviations', value: deviationCount ?? 0, percent: totalNum ? ((deviationCount ?? 0) / totalNum) * 100 : 0, color: PP_PALETTE.crim },
    ]
  );
  const occupancyEndpoint = endpointData(state, 'occupancyByTower');
  const occupancyData = occupancyEndpoint?.data;
  const bannerWhy = container.querySelector<HTMLElement>('.hban-why');
  if (bannerWhy) {
    if (occupancyEndpoint?.error) {
      bannerWhy.textContent = `${bannerWhy.textContent ?? ''} Occupancy data unavailable: ${occupancyEndpoint.error}`;
    } else if (isRecord(occupancyData) && isRecord(occupancyData.totals)) {
      const totals = occupancyData.totals;
      const towerOccupancy = arrayValue(read(state, 'occupancyByTower', [['towers']]))
        .map((tower) => `${safeText(tower.tower)} ${formatNumber(tower.occupied)}/${formatNumber(tower.total_flats)} occupied`)
        .join(' · ');
      bannerWhy.textContent =
        `${bannerWhy.textContent ?? ''} Occupancy: ${formatNumber(totals.occupied)} of ${formatNumber(totals.total_flats)} flats occupied; ${formatNumber(totals.unoccupied)} unoccupied; ${formatNumber(totals.occupancy_not_recorded)} not recorded.` +
        (towerOccupancy ? ` ${towerOccupancy}.` : '');
    }
  }

  const typeSplit = read(state, 'typeDeviation', FITOUT_TYPE_PATHS);
  const deviationsSplit = read(state, 'typeDeviation', FITOUT_DEVIATION_PATHS);
  const speed = read(state, 'approvalSpeed', FITOUT_SPEED_PATHS);
  const rejectByCreator = read(state, 'approvalSpeed', [['rejection_rate_by_who_raised_it'], ['reject_by_creator_chart']]);
  const rejectByType = read(state, 'approvalSpeed', [['rejection_rate_by_request_type'], ['reject_by_type_chart']]);
  for (const [id, result] of [
    ['fitoutTypeChart', typeSplit],
    ['deviationChart', deviationsSplit],
    ['createdByChart', speed],
    ['rejectByCreatorChart', rejectByCreator],
    ['rejectByTypeChart', rejectByType],
  ] as const) {
    setChartMessage(container, id, result);
  }

  const requests = read(state, 'pendingCompliance', [['pending_requests_latest_8'], ['pending_requests']]);
  const requestRows = arrayValue(requests).filter((row) => !isTestRecord(row));
  const requestTableRows = requestRows.map((row) => [
      row.id,
      row.resident,
      row.tower ?? '—',
      row.flat ?? row.unit_id,
      row.type,
      row.created_by ?? '—',
      row.requested_at,
      row.status ?? 'Pending',
      row.contractor,
      row.expiry_date ?? '—',
      row.deposit_refund_date ?? '—',
    ]);
  setTable(container, 0, requestTableRows, tableMessage(requests, requestTableRows));
  const complianceResult = read(state, 'pendingCompliance', [
    ['compliance_checklist_active_fitouts', 'fitouts'],
    ['compliance_checklist'],
  ]);
  const fitouts = arrayValue(complianceResult).filter((row) => !isTestRecord(row));
  const fitoutRows = fitouts.map((fitout) => {
      const items = Array.isArray(fitout.items) ? fitout.items.filter(isRecord) : [];
      const missing = items.filter((item) => item.completed !== true).map((item) => safeText(item.name));
      const pct = numberValue(fitout.completion_percent);
      return [
        fitout.fitout_request_id,
        fitout.resident ?? '—',
        fitout.tower ?? '—',
        fitout.fitout_type ?? 'Fitout',
        pct === null ? 'Data Not Available' : `${formatNumber(pct)}%`,
        missing.length ? missing.join(', ') : 'None',
        'Data Not Available',
        'Data Not Available',
      ];
    });
  const complianceNote = getPath(
    endpointData(state, 'pendingCompliance')?.data,
    ['compliance_checklist_active_fitouts', 'note']
  );
  setTable(
    container,
    1,
    fitoutRows,
    fitoutRows.length === 0 && typeof complianceNote === 'string'
      ? complianceNote
      : tableMessage(complianceResult, fitoutRows),
    'fitout_compliance'
  );
  const requestTable = container.querySelectorAll<HTMLTableElement>('table.tbl')[0];
  requestTable?.tBodies.item(0)?.querySelectorAll('tr[data-drill]').forEach((row) => {
    row.setAttribute('data-drill', 'fitout_pending');
  });
}

function bindParking(container: HTMLElement, state: PostPossessionApiState | undefined): void {
  const total = read(state, 'kpis', [['total_vehicles', 'total'], ['total_vehicles']]);
  const split = read(state, 'kpis', [['four_w_two_w_split']]);
  const towers = read(state, 'kpis', [
    ['towers_covered'],
    ['towers_covered_count'],
  ]);
  const mismatch = read(state, 'kpis', [['data_mismatch']]);
  const flatKpis = endpointData(state, 'kpis')?.data;
  const flatFourWheeler = getPath(flatKpis, ['four_wheeler']);
  const flatTwoWheeler = getPath(flatKpis, ['two_wheeler']);
  const splitRecord =
    objectValue(split) ??
    (numberValue(flatFourWheeler) !== null && numberValue(flatTwoWheeler) !== null
      ? {
          four_wheeler: flatFourWheeler,
          two_wheeler: flatTwoWheeler,
          four_wheeler_percent: getPath(flatKpis, ['four_wheeler_percent']),
          two_wheeler_percent: getPath(flatKpis, ['two_wheeler_percent']),
        }
      : null);
  const towersRecord =
    objectValue(towers) ??
    (numberValue(getPath(flatKpis, ['towers_covered'])) !== null
      ? {
          count: getPath(flatKpis, ['towers_covered']),
          total_towers: getPath(flatKpis, ['total_towers']),
          covered: getPath(flatKpis, ['covered_towers']),
          not_covered: getPath(flatKpis, ['not_covered_towers']),
        }
      : null);
  const mismatchRecord =
    objectValue(mismatch) ??
    (numberValue(mismatch.kind === 'value' ? mismatch.value : null) !== null
      ? { count: mismatch.kind === 'value' ? mismatch.value : null }
      : null);
  const totalValue = numberValue(total.kind === 'value' ? total.value : null);
  const fourWheeler = numberValue(splitRecord?.four_wheeler);
  const twoWheeler = numberValue(splitRecord?.two_wheeler);
  const mismatchCount = numberValue(mismatchRecord?.count);
  setKpi(container, 'kpi_tpk_total_vehicles', total, {
    trend: 'Active registrations',
    target: towersRecord ? `${formatNumber(towersRecord.towers_covered)} towers covered` : '',
  });
  setKpi(container, 'kpi_tpk_4w_2w_split',
    fourWheeler !== null && twoWheeler !== null
      ? { kind: 'value', value: `${formatNumber(fourWheeler)}/${formatNumber(twoWheeler)}` }
      : split,
    {
      value: (value) => String(value),
      trend: splitRecord?.majority ? `${String(splitRecord.majority)} majority` : '',
      target:
        splitRecord?.four_wheeler_percent !== undefined && splitRecord.two_wheeler_percent !== undefined
          ? `${formatPercent(splitRecord.four_wheeler_percent)} / ${formatPercent(splitRecord.two_wheeler_percent)}`
          : '',
    }
  );
  setKpi(container, 'kpi_tpk_towers_covered',
    towersRecord ? { kind: 'value', value: towersRecord.count } : towers,
    {
      target: towersRecord ? `of ${formatNumber(towersRecord.total_towers)} towers` : '',
      trend: towersRecord && Array.isArray(towersRecord.covered) ? towersRecord.covered.join(', ') : '',
    }
  );
  setKpi(container, 'kpi_tpk_data_mismatch',
    mismatchCount === null ? mismatch : { kind: 'value', value: mismatchCount },
    {
      trend: mismatchRecord?.note ? String(mismatchRecord.note) : '',
      target: mismatchCount ? 'Review mismatched registrations' : 'No mismatches reported',
    }
  );

  const breakdown = read(state, 'breakdown', [['vehicle_type_by_tower']]);
  const towerMap = objectValue(breakdown);
  const towerRows = towerMap
    ? Object.entries(towerMap).map(([tower, values]) => ({
        label: tower,
        count: Object.values(isRecord(values) ? values : {}).reduce(
          (sum, current) => sum + (numberValue(current) ?? 0),
          0
        ),
      }))
    : arrayValue(breakdown).map((row) => ({
        label: safeText(row.tower ?? row.tower_name),
        count:
          numberValue(row.count ?? row.total ?? row.total_vehicles ?? row.vehicle_count) ??
          (numberValue(row.four_wheeler) ?? 0) +
            (numberValue(row.two_wheeler) ?? 0),
      }));
  const parkingRows = read(state, 'breakdown', [
    ['parking_type_distribution', 'breakdown'],
    ['parking_type_chart'],
  ]);
  const parkingData = read(state, 'breakdown', [
    ['all_registered_slots', 'slots'],
    ['all_registered_slots'],
  ]);
  const slots = arrayValue(parkingData).filter((slot) => !isTestRecord(slot));
  const slotTableRows = slots.map((slot) => [
      slot.slot_name,
      slot.tower ?? '—',
      slot.flat ?? '—',
      slot.vehicle_number,
      slot.vehicle_type,
      slot.parking_type,
      slot.sticker_number,
      slot.status,
    ]);
  setTable(container, 0, slotTableRows, tableMessage(parkingData, slotTableRows), 'parking_all');
  const slotsTable = container.querySelectorAll<HTMLTableElement>('table.tbl')[0];
  if (slotsTable) setTableScrollViewport(slotsTable, 10, 'registered-slots-scroll');

  const bars = container.querySelector<HTMLElement>('#parkingTowerBars');
  if (bars) {
    bars.replaceChildren();
    const max = Math.max(1, ...towerRows.map((row) => row.count));
    for (const [index, item] of towerRows.entries()) {
      const row = document.createElement('div');
      row.className = 'trow';
      const label = document.createElement('div');
      label.className = 'tn';
      label.textContent = item.label;
      label.title = item.label;
      const track = document.createElement('div');
      track.className = 'tb2';
      const fill = document.createElement('div');
      fill.className = 'tf';
      fill.style.width = `${(item.count / max) * 100}%`;
      fill.style.background = seriesColor(index, 0.92);
      track.append(fill);
      const count = document.createElement('div');
      count.className = 'tv';
      count.textContent = formatNumber(item.count);
      row.append(label, track, count);
      bars.append(row);
    }
    if (!towerRows.length) {
      setContentMessage(bars, towerMap ? { kind: 'value', value: [] } : breakdown);
    } else {
      setListScrollViewport(bars, 10, 'parking-tower-bars-scroll');
    }
  }
  const mismatchedSlots = slots.filter((slot) => slot.mismatch === true);
  const firstMismatch = mismatchedSlots[0];
  const mismatchTitle = mismatchCount === null
    ? mismatch.kind === 'loading'
      ? 'Mismatch data loading'
      : mismatch.kind === 'error'
        ? 'Mismatch data API error'
        : 'Mismatch count unavailable'
    : mismatchCount > 0
      ? firstMismatch
        ? `Slot ${safeText(firstMismatch.slot_name ?? firstMismatch.slot)} has conflicting vehicle and parking types`
        : `${formatNumber(mismatchCount)} vehicle/parking type mismatches`
      : 'No vehicle/parking type mismatches';
  const mismatchBody = mismatchCount === null
    ? mismatch.kind === 'error'
      ? mismatch.message
      : mismatch.kind === 'unavailable'
        ? mismatch.reason
        : 'The API did not return a mismatch count.'
    : mismatchCount > 0 && firstMismatch
      ? `Vehicle Type: ${safeText(firstMismatch.vehicle_type)}; Parking Type: ${safeText(firstMismatch.parking_type)}. ${
          mismatchRecord?.note ? String(mismatchRecord.note) : 'Correct the registration so both fields agree.'
        }`
      : mismatchCount > 0
        ? mismatchRecord?.note
          ? String(mismatchRecord.note)
          : 'Review the affected parking registrations.'
        : 'The API reports no mismatched registrations.';
  const coveredCount = numberValue(towersRecord?.count ?? towersRecord?.towers_covered);
  const totalTowerCount = numberValue(towersRecord?.total_towers);
  const notCoveredTowers = Array.isArray(towersRecord?.not_covered)
    ? towersRecord.not_covered.map(String)
    : [];
  const uncoveredCount = notCoveredTowers.length ||
    (coveredCount !== null && totalTowerCount !== null
      ? Math.max(0, totalTowerCount - coveredCount)
      : null);
  const coverageTitle = uncoveredCount === null
    ? towers.kind === 'loading'
      ? 'Tower coverage data loading'
      : towers.kind === 'error'
        ? 'Tower coverage API error'
        : 'Tower coverage unavailable'
    : uncoveredCount > 0
      ? `${formatNumber(uncoveredCount)} towers have no registered vehicles`
      : 'All towers have registered vehicles';
  const coverageBody = uncoveredCount === null
    ? towers.kind === 'error'
      ? towers.message
      : towers.kind === 'unavailable'
        ? towers.reason
        : 'The API did not return the covered and total tower counts.'
    : uncoveredCount > 0
      ? notCoveredTowers.length
        ? `Not covered: ${notCoveredTowers.join(', ')}.`
        : `${formatNumber(coveredCount)} of ${formatNumber(totalTowerCount)} towers have registered vehicles.`
      : 'The API reports parking registrations across all towers.';
  const parkingTypeRows = arrayValue(parkingRows);
  const topParkingType = parkingTypeRows.reduce<Record<string, unknown> | null>(
    (top, row) =>
      !top || (numberValue(row.count) ?? 0) > (numberValue(top.count) ?? 0)
        ? row
        : top,
    null
  );
  const fourWheelerShare = numberValue(splitRecord?.four_wheeler_percent);
  const watchRisk: ApiRisk = topParkingType
    ? {
        severity: 'med',
        label: 'Watchlist',
        title: `${safeText(topParkingType.parking_type ?? topParkingType.type ?? topParkingType.name)} is the most common parking type`,
        body: `${formatNumber(topParkingType.count)} registered slots use this type${
          fourWheelerShare === null ? '.' : `; ${formatPercent(fourWheelerShare)} of vehicles are 4-Wheelers. Review allocation if the vehicle mix changes.`
        }`,
        drill: 'parking_type',
      }
    : {
        severity: 'med',
        label: 'Watchlist',
        title: parkingRows.kind === 'loading'
          ? 'Parking type data loading'
          : parkingRows.kind === 'error'
            ? 'Parking type data API error'
            : 'Parking type breakdown unavailable',
        body: parkingRows.kind === 'error'
          ? parkingRows.message
          : parkingRows.kind === 'unavailable'
            ? parkingRows.reason
            : 'The API did not return parking type counts for this period.',
        drill: 'parking_type',
      };
  setRisks(container, [
    {
      severity: 'high',
      label: 'Data Quality',
      title: mismatchTitle,
      body: mismatchBody,
      drill: 'parking_mismatch',
    },
    {
      severity: 'med',
      label: 'Coverage Gap',
      title: coverageTitle,
      body: coverageBody,
      drill: 'parking_all',
    },
    watchRisk,
  ]);
  const percent4w = numberValue(splitRecord?.four_wheeler_percent);
  setBanner(
    container,
    state,
    totalValue === null ? '—' : formatNumber(totalValue),
    'vehicles',
    mismatchCount ? `${formatNumber(mismatchCount)} data mismatches` : 'Vehicle registration overview',
    mismatchRecord?.note ? String(mismatchRecord.note) : '',
    [
      { label: 'Vehicles', value: totalValue ?? 0, percent: 100, color: PP_PALETTE.sky },
      { label: '4-Wheeler Share', value: percent4w ?? 0, percent: percent4w ?? 0, color: PP_PALETTE.for },
      { label: 'Towers Covered', value: numberValue(towersRecord?.count) ?? 0, percent: numberValue(towersRecord?.total_towers) ? ((numberValue(towersRecord?.count) ?? 0) / (numberValue(towersRecord?.total_towers) ?? 1)) * 100 : 0, color: PP_PALETTE.lavender },
      { label: 'Data Mismatches', value: mismatchCount ?? 0, percent: totalValue ? ((mismatchCount ?? 0) / totalValue) * 100 : 0, color: PP_PALETTE.crim },
    ]
  );
  setChartMessage(container, 'parkingTypeChart', parkingRows);
}

function bindCommunity(container: HTMLElement, state: PostPossessionApiState | undefined): void {
  const notices = read(state, 'kpis', [['active_notices']]);
  const events = read(state, 'kpis', [['events_this_month']]);
  const polls = read(state, 'kpis', [['polls_created']]);
  const notifications = read(state, 'kpis', [['notifications_30d'], ['notifications_sent']]);
  const quarantine = read(state, 'kpis', [['quarantine_active']]);
  const directory = read(state, 'kpis', [['directory_vendors']]);
  const kpiData = endpointData(state, 'kpis')?.data;
  const globalNote = (key: string) => getPath(kpiData, ['global_notes', key]);
  const noticeRecord =
    objectValue(notices) ??
    (numberValue(getPath(kpiData, ['active_notices'])) !== null
      ? {
          total: getPath(kpiData, ['active_notices']),
          important: getPath(kpiData, ['active_notices_important']),
          regular: getPath(kpiData, ['active_notices_regular']),
        }
      : null);
  const eventRecord =
    objectValue(events) ??
    (numberValue(getPath(kpiData, ['events_this_month'])) !== null
      ? {
          total: getPath(kpiData, ['events_this_month']),
          important: getPath(kpiData, ['events_important']),
          regular: getPath(kpiData, ['events_regular']),
        }
      : null);
  const pollRecord =
    objectValue(polls) ??
    (numberValue(getPath(kpiData, ['polls_created'])) !== null
      ? {
          total: getPath(kpiData, ['polls_created']),
          polls_with_zero_votes: getPath(kpiData, ['polls_with_zero_votes']),
        }
      : null);
  const quarantineRecord =
    objectValue(quarantine) ??
    (numberValue(getPath(kpiData, ['quarantine_active'])) !== null
      ? {
          active: getPath(kpiData, ['quarantine_active']),
          released: getPath(kpiData, ['quarantine_in_quarantine']),
        }
      : null);
  const directoryRecord =
    objectValue(directory) ??
    (numberValue(getPath(kpiData, ['directory_vendors_total'])) !== null
      ? {
          active: getPath(kpiData, ['directory_vendors_active']),
          total: getPath(kpiData, ['directory_vendors_total']),
          duplicate_count: getPath(kpiData, ['directory_duplicates']),
        }
      : null);
  const pollOverview = read(state, 'pollsNotifications', [
    ['polls_participation_overview'],
    ['poll_chart'],
  ]);
  const pollRows = arrayValue(pollOverview).filter((row) => !isTestRecord(row));
  const pollChartHost = container.querySelector<HTMLElement>('[data-pp-chart="pollChart"]');
  if (pollChartHost && pollRows.length) {
    pollChartHost.style.height = `${Math.max(180, pollRows.length * 40 + 24)}px`;
    const parent = pollChartHost.parentElement;
    if (parent) {
      let viewport: HTMLElement;
      if (parent.classList.contains('poll-chart-scroll')) {
        viewport = parent;
      } else {
        viewport = document.createElement('div');
        viewport.className = 'poll-chart-scroll';
        viewport.tabIndex = 0;
        viewport.setAttribute('aria-label', 'Poll participation overview; scroll to view more polls');
        parent.insertBefore(viewport, pollChartHost);
        viewport.append(pollChartHost);
      }
      viewport.style.maxHeight = `${Math.max(180, Math.min(pollRows.length, 10) * 40 + 24)}px`;
    }
  }
  setKpi(container, 'kpi_tco_active_notices',
    noticeRecord ? { kind: 'value', value: noticeRecord.total } : notices,
    { trend: noticeRecord ? `${formatNumber(noticeRecord.important)} Important · ${formatNumber(noticeRecord.regular)} Regular` : '' }
  );
  setKpi(container, 'kpi_tco_events_this_month',
    eventRecord ? { kind: 'value', value: eventRecord.total } : events,
    { trend: eventRecord ? `${formatNumber(eventRecord.important)} Important · ${formatNumber(eventRecord.regular)} Regular` : '' }
  );
  setKpi(container, 'kpi_tco_polls_created',
    pollRecord ? { kind: 'value', value: pollRecord.total } : polls,
    {
      trend: pollRecord ? `${formatNumber(pollRecord.polls_with_zero_votes)} with zero votes` : '',
    }
  );
  const notificationsUnavailable =
    notifications.kind === 'unavailable' ||
    (notifications.kind === 'value' && notifications.value === null);
  const notificationsResult: ReadResult = notificationsUnavailable
    ? { kind: 'value', value: 0 }
    : notifications;
  setKpi(container, 'kpi_tco_notifications_30d', notificationsResult, {
    trend: notificationsUnavailable ? '' : 'Last 30 days',
  });
  setKpi(container, 'kpi_tco_quarantine_active',
    quarantineRecord ? { kind: 'value', value: quarantineRecord.active } : quarantine,
    {
      trend: quarantineRecord
        ? numberValue(quarantineRecord.active) === 0
          ? 'No active cases'
          : numberValue(quarantineRecord.released) !== null
            ? `${formatNumber(quarantineRecord.released)} released`
            : ''
        : '',
    }
  );
  const duplicateCount =
    numberValue(directoryRecord?.duplicate_count) ??
    (Array.isArray(directoryRecord?.duplicate_company_names)
      ? directoryRecord.duplicate_company_names.length
      : 0);
  setKpi(container, 'kpi_tco_directory_vendors',
    directoryRecord ? { kind: 'value', value: `${formatNumber(directoryRecord.active)}/${formatNumber(directoryRecord.total)}` } : directory,
    {
      value: (value) => String(value),
      trend: directoryRecord ? `${formatNumber(duplicateCount)} duplicate names` : '',
    }
  );

  const adoptionNames = [
    'kpi_tco_overall_adoption_rate',
    'kpi_tco_highest_tower_t2',
    'kpi_tco_lowest_tower_t3',
    'kpi_tco_explains_poll_gap',
  ];
  const adoptionFields = [
    ['overall_adoption_rate'],
    ['highest_tower'],
    ['lowest_tower'],
    ['explains_poll_gap'],
  ];
  adoptionNames.forEach((key, index) => {
    const result = read(state, 'appAdoption', [adoptionFields[index]]);
    const note = globalNote(adoptionFields[index][0]);
    const adoptionUnavailable =
      result.kind === 'unavailable' ||
      (result.kind === 'value' && result.value === null);
    const adoptionResult: ReadResult = adoptionUnavailable
      ? { kind: 'value', value: 0 }
      : result;
    setKpi(
      container,
      key,
      adoptionResult,
      {
        trend: adoptionUnavailable ? '' : 'Resident app adoption data',
        target: adoptionUnavailable ? '' : typeof note === 'string' ? note : '',
      }
    );
  });
  const highestInfo = container.querySelector<HTMLElement>('[data-info="kpi_tco_highest_tower_t2"]');
  const lowestInfo = container.querySelector<HTMLElement>('[data-info="kpi_tco_lowest_tower_t3"]');
  const highestLabel = highestInfo?.closest('.kc')?.querySelector<HTMLElement>('.kc-l');
  const lowestLabel = lowestInfo?.closest('.kc')?.querySelector<HTMLElement>('.kc-l');
  if (highestLabel?.firstChild) highestLabel.firstChild.textContent = 'Highest Tower';
  if (lowestLabel?.firstChild) lowestLabel.firstChild.textContent = 'Lowest Tower';

  const zeroVoteCount =
    numberValue(getPath(kpiData, ['polls_with_zero_votes'])) ??
    numberValue(pollRecord?.polls_with_zero_votes);
  const zeroVoteRows = pollRows.filter((row) => numberValue(row.votes) === 0);
  const zeroVoteExamples = [
    ...new Set(
      zeroVoteRows
        .map((row) => safeText(row.poll).trim())
        .filter((name) => name && name !== '—')
    ),
  ]
    .slice(0, Math.min(3, Math.floor(zeroVoteCount ?? 0)))
    .map((name) => (name.length > 48 ? `${name.slice(0, 45).trimEnd()}...` : name));
  const remainingZeroVoteCount =
    zeroVoteCount === null
      ? 0
      : Math.max(0, Math.floor(zeroVoteCount) - zeroVoteExamples.length);
  const zeroVoteBody = zeroVoteExamples.length
    ? `No votes recorded for: ${zeroVoteExamples
        .map((name) => `"${name}"`)
        .join(', ')}${remainingZeroVoteCount ? `, and ${formatNumber(remainingZeroVoteCount)} more polls` : ''}.`
    : 'Review poll participation details returned by the API.';
  const pollRisk: ApiRisk = {
    severity: 'med',
    label: 'Poll Participation',
    title: zeroVoteCount === null
      ? pollOverview.kind === 'loading'
        ? 'Poll participation data loading'
        : pollOverview.kind === 'error'
          ? 'Poll participation API error'
          : 'Poll participation unavailable'
      : zeroVoteCount > 0
        ? `${formatNumber(zeroVoteCount)} polls have zero votes`
        : 'No zero-vote polls reported',
    body: zeroVoteCount === null
      ? pollOverview.kind === 'error'
        ? pollOverview.message
        : pollOverview.kind === 'unavailable'
          ? pollOverview.reason
          : 'The API did not return a zero-vote poll count.'
        : zeroVoteCount > 0
          ? zeroVoteBody
          : 'The API reports no polls with zero votes.',
    drill: 'polls',
  };
  const activeQuarantineCount =
    numberValue(quarantineRecord?.active) ??
    numberValue(quarantine.kind === 'value' ? quarantine.value : null);
  const quarantineAverageDays =
    numberValue(quarantineRecord?.avg_duration_days) ??
    numberValue(getPath(kpiData, ['quarantine_avg_duration_days']));
  const quarantineRisk: ApiRisk = {
    severity: 'med',
    label: 'Quarantine Monitoring',
    title: activeQuarantineCount === null
      ? quarantine.kind === 'loading'
        ? 'Quarantine data loading'
        : quarantine.kind === 'error'
          ? 'Quarantine API error'
          : 'Quarantine data unavailable'
      : activeQuarantineCount > 0
        ? `${formatNumber(activeQuarantineCount)} active quarantine cases`
        : 'No active quarantine cases',
    body: activeQuarantineCount === null
      ? quarantine.kind === 'error'
        ? quarantine.message
        : quarantine.kind === 'unavailable'
          ? quarantine.reason
          : 'The API did not return an active quarantine count.'
      : activeQuarantineCount > 0
        ? quarantineAverageDays === null
          ? 'Review active cases and their status with the available quarantine data.'
          : `Average recorded case duration: ${formatNumber(quarantineAverageDays)} days.`
        : 'The API reports no active quarantine cases.',
    drill: 'quarantine',
  };
  const duplicateRiskCount =
    numberValue(getPath(kpiData, ['directory_duplicates'])) ??
    (Array.isArray(directoryRecord?.duplicate_company_names)
      ? directoryRecord.duplicate_company_names.length
      : numberValue(directoryRecord?.duplicate_count));
  const directoryRisk: ApiRisk = {
    severity: 'med',
    label: 'Directory Cleanup',
    title: duplicateRiskCount === null
      ? directory.kind === 'loading'
        ? 'Directory data loading'
        : directory.kind === 'error'
          ? 'Directory API error'
          : 'Directory duplicate count unavailable'
      : duplicateRiskCount > 0
        ? `${formatNumber(duplicateRiskCount)} duplicate company names`
        : 'No duplicate company names reported',
    body: duplicateRiskCount === null
      ? directory.kind === 'error'
        ? directory.message
        : typeof globalNote('directory_duplicates') === 'string'
          ? String(globalNote('directory_duplicates'))
          : 'The API did not return a directory duplicate count.'
      : duplicateRiskCount > 0
        ? Array.isArray(directoryRecord?.duplicate_company_names)
          ? directoryRecord.duplicate_company_names.map(String).join(', ')
          : 'Review duplicate vendor names reported by the API.'
        : 'The API reports no duplicate vendor names.',
    drill: 'directory_all',
  };
  setRisks(container, [pollRisk, quarantineRisk, directoryRisk]);

  const noticeCount = numberValue(noticeRecord?.total) ?? 0;
  const eventCount = numberValue(eventRecord?.total) ?? 0;
  const pollCount = numberValue(pollRecord?.total) ?? 0;
  const voteRows = arrayValue(pollOverview);
  const voteTotal = voteRows.reduce((sum, row) => sum + (numberValue(row.votes) ?? 0), 0);
  setBanner(
    container,
    state,
    formatNumber(pollCount),
    'polls',
    `${formatNumber(noticeCount)} active notices · ${formatNumber(eventCount)} events this month`,
    notifications.kind === 'unavailable'
      ? notifications.reason
      : `Poll participation: ${formatNumber(voteTotal)} votes across ${formatNumber(voteRows.length)} polls.`,
    [
      { label: 'Active Notices', value: noticeCount, percent: noticeCount ? 100 : 0, color: PP_PALETTE.lavender },
      { label: 'Events This Month', value: eventCount, percent: eventCount ? 100 : 0, color: PP_PALETTE.coral },
      { label: 'Poll Participation', value: voteTotal, percent: voteTotal ? 100 : 0, color: PP_PALETTE.crim },
    ]
  );

  const casesResult = read(state, 'quarantineDirectory', [
    ['quarantine_active_and_recent_cases', 'cases'],
    ['quarantine_cases'],
  ]);
  const cases = arrayValue(casesResult).filter((row) => !isTestRecord(row));
  const caseTableRows = cases.map((row) => [
      row.id === undefined ? '—' : `Case ${safeText(row.id)}`,
      row.tower,
      row.flat,
      'Quarantine',
      row.start_date,
      row.end_date,
      row.status,
    ]);
  setTable(container, 0, caseTableRows, tableMessage(casesResult, caseTableRows), 'quarantine');
  const quarantineTable = container.querySelectorAll<HTMLTableElement>('table.tbl')[0];
  if (quarantineTable) setTableScrollViewport(quarantineTable, 10, 'quarantine-cases-scroll');

  const vendorsResult = read(state, 'quarantineDirectory', [
    ['directory_vendors'],
    ['business_directory_vendors', 'vendors'],
  ]);
  const vendorRows =
    vendorsResult.kind === 'value' && Array.isArray(vendorsResult.value)
      ? vendorsResult.value
      : null;
  const vendors = vendorRows?.filter(isRecord) ?? [];
  const vendorCount = vendorRows?.length ?? 0;
  const vendorBody = container.querySelector<HTMLElement>('#dirTableBody');
  const countChip = container.querySelector<HTMLElement>('#dirCountChip');
  if (countChip) {
    countChip.textContent =
      vendorRows === null
        ? tableMessage(vendorsResult, [])
        : `${formatNumber(vendorCount)} vendors`;
  }
  if (vendorBody) {
    vendorBody.replaceChildren();
    if (vendors.length === 0) {
      const row = vendorBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 3;
      cell.textContent = tableMessage(vendorsResult, []);
    } else {
      for (const vendor of vendors) {
        const row = vendorBody.insertRow();
        row.dataset.drill = 'directory_all';
        const company = row.insertCell();
        company.textContent = safeText(vendor.company);
        const category = row.insertCell();
        category.textContent = safeText(vendor.category);
        const status = row.insertCell();
        status.textContent = safeText(vendor.status);
      }
    }
  }

  setChartMessage(container, 'adoptionChart', read(state, 'appAdoption', [['adoption_chart'], ['overall_adoption_rate']]));
  setChartMessage(container, 'pollChart', pollOverview);
  setChartMessage(container, 'notifChannelChart', read(state, 'pollsNotifications', [
    ['notification_delivery_by_channel'],
    ['notif_channel_chart'],
  ]));
  setChartMessage(container, 'quarantineTowerChart', read(state, 'quarantineDirectory', [
    ['cases_by_tower_this_period'],
    ['quarantine_tower_chart'],
  ]));
}

export function getPostPossessionChartConfigs(
  tab: PostPossessionTab,
  state: PostPossessionApiState | undefined
): Record<string, ChartConfiguration> {
  return getPostPossessionCharts(tab, state);
}

export function bindPostPossessionApiData(
  container: HTMLElement,
  tab: PostPossessionTab,
  state: PostPossessionApiState | undefined
): void {
  const filters = Object.entries(state?.endpoints ?? {}).flatMap(([key, endpoint]) => {
    const echoedFilters = getPath(endpoint.data, ['filters']);
    return isRecord(echoedFilters) ? [{ endpoint: key, ...echoedFilters }] : [];
  });
  if (state?.societyId) container.dataset.apiSocietyId = state.societyId;
  container.dataset.apiFilters = JSON.stringify(filters);
  container.querySelectorAll<HTMLElement>('.ci').forEach((element) => {
    element.hidden = true;
  });
  const charts = getPostPossessionCharts(tab, state);
  for (const id of CHART_IDS[tab]) {
    if (charts[id]) continue;
    const endpointKey = CHART_ENDPOINT[id];
    const paths = CHART_REASON_PATHS[id] ?? [];
    const readResult = endpointKey
      ? read(state, endpointKey, paths)
      : { kind: 'error' as const, message: 'No matching API endpoint is documented.' };
    setChartMessage(container, id, readResult);
  }

  if (tab === 'allTowers') bindAllTowers(container, state);
  if (tab === 'overview') bindOverview(container, state);
  if (tab === 'helpdesk') bindHelpdesk(container, state);
  if (tab === 'security') bindSecurity(container, state);
  if (tab === 'staff') bindStaff(container, state);
  if (tab === 'club') bindClub(container, state);
  if (tab === 'fitout') bindFitout(container, state);
  if (tab === 'parking') bindParking(container, state);
  if (tab === 'community') bindCommunity(container, state);
}
