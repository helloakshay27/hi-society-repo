import type {
  BarRow,
  FunnelStep,
  HeatRow,
  Kpi,
  TableRow,
  TrendPoint,
  UsageDashboardData,
  UsageFilters,
  WorkflowModule,
} from './types';

/* Deterministic seeded RNG so mock numbers are stable per filter combo
   (mirrors the reference wireframe behaviour). */
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SOCIETIES = ['Artesia', 'Suncity', 'Sunteck'];

const MODULES: { key: string; label: string; bucket: string }[] = [
  { key: 'helpdesk', label: 'Helpdesk', bucket: 'Service & Support' },
  { key: 'visitors', label: 'Visitors & Gate', bucket: 'Service & Support' },
  { key: 'bills', label: 'Bill Payment', bucket: 'Finance' },
  { key: 'amenity', label: 'Amenity Booking', bucket: 'Community' },
  { key: 'events', label: 'Events & RSVP', bucket: 'Community' },
  { key: 'notices', label: 'Notices', bucket: 'Community' },
  { key: 'polls', label: 'Polls & Surveys', bucket: 'Community' },
  { key: 'documents', label: 'Documents', bucket: 'More' },
];

function scopeFactor(scope: UsageFilters['scope'], rng: () => number): number {
  // Tower Admin sees a slice, Super Admin the whole society.
  if (scope === 'tower') return 0.28 + rng() * 0.08;
  if (scope === 'super') return 1;
  return 0.72 + rng() * 0.1;
}

function deviceFactor(device: UsageFilters['device']): number {
  if (device === 'ios') return 0.44;
  if (device === 'android') return 0.56;
  return 1;
}

function dayLabels(from: string, days: number): string[] {
  const out: string[] = [];
  const d = new Date(from + 'T00:00:00');
  for (let i = 0; i < days; i++) {
    const c = new Date(d);
    c.setDate(d.getDate() + i);
    out.push(c.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
  }
  return out;
}

function trend(
  rng: () => number,
  labels: string[],
  base: number,
  vol: number,
  compare: boolean,
): TrendPoint[] {
  return labels.map((label) => {
    const current = Math.max(0, Math.round(base * (0.75 + rng() * 0.5) + rng() * vol));
    const previous = compare ? Math.max(0, Math.round(current * (0.82 + rng() * 0.3))) : null;
    return { label, current, previous };
  });
}

function funnelFor(rng: () => number, start: number, steps: string[]): FunnelStep[] {
  let cur = start;
  return steps.map((label, i) => {
    const pctOfStart = (cur / start) * 100;
    const prev = i === 0 ? null : cur;
    const step: FunnelStep = {
      label,
      users: Math.round(cur),
      pctOfStart: Math.round(pctOfStart * 10) / 10,
      dropoffFromPrev: prev === null ? null : Math.round(((prev - cur) / prev) * 1000) / 10,
    };
    cur = cur * (0.62 + rng() * 0.22);
    return step;
  });
}

export function buildMockDashboard(filters: UsageFilters): UsageDashboardData {
  const seedKey = `${filters.preset}|${filters.from}|${filters.society}|${filters.device}|${filters.scope}`;
  const rng = mulberry32(hashStr(seedKey));
  const scopeF = scopeFactor(filters.scope, rng);
  const devF = deviceFactor(filters.device);
  const f = scopeF * devF;
  const days = filters.preset;
  const labels = dayLabels(filters.from, Math.min(days, 30));

  const activeUsers = Math.round(4200 * f * (0.9 + rng() * 0.2));
  const sessions = Math.round(activeUsers * (3.1 + rng()));
  const views = Math.round(sessions * (6.4 + rng() * 2));
  const avgDur = `${Math.round(4 + rng() * 3)}m ${Math.round(rng() * 59)}s`;

  const trafficKpis: Kpi[] = [
    { id: 'active', label: 'Active Users', value: activeUsers.toLocaleString('en-IN'), deltaPct: 8.2, sub: 'unique residents in period', info: 'Unique residents (user_id) with at least one event in the selected period.' },
    { id: 'sessions', label: 'Total Sessions', value: sessions.toLocaleString('en-IN'), deltaPct: 5.4, sub: 'app launches in period', info: 'Distinct app sessions started (app_launched is the first event of every session).' },
    { id: 'views', label: 'Screen Views', value: views.toLocaleString('en-IN'), deltaPct: 6.9, sub: `${(views / Math.max(1, sessions)).toFixed(1)} views / session`, info: 'All View-typed screen-load events across modules.' },
    { id: 'dur', label: 'Avg. Session', value: avgDur, deltaPct: -1.2, sub: 'per session', info: 'Total session time divided by total sessions.' },
    { id: 'bounce', label: 'Bounce Rate', value: `${(14 + rng() * 8).toFixed(1)}%`, deltaPct: -2.1, sub: 'single-screen sessions', info: '% of sessions with only app launch and no further interaction.' },
    { id: 'returning', label: 'Returning Users', value: `${Math.round(52 + rng() * 14)}%`, deltaPct: 3.3, sub: 'active in prior period too', info: 'Users active now who were also active in a prior period.' },
  ];

  const adoptionTrend = trend(rng, labels, 900 * f, 120, filters.comparePrevious);

  const byModule: BarRow[] = MODULES.map((m) => ({
    label: m.label,
    value: Math.round(28 + rng() * 64),
    hint: `${Math.round(400 * f + rng() * 900)} users`,
  })).sort((a, b) => b.value - a.value);

  const cohorts = ['Mar W1', 'Mar W2', 'Mar W3', 'Mar W4'];
  const retention: HeatRow[] = cohorts.map((cohort) => ({
    cohort,
    cells: [100, 58, 41, 33, 27, 22].map((base) => ({
      value: Math.min(100, Math.round(base * (0.9 + rng() * 0.2))),
    })),
  }));

  const dormant: BarRow[] = [
    { label: 'Never opened module', value: Math.round(12 + rng() * 10), hint: 'of active users' },
    { label: 'Opened once, never again', value: Math.round(18 + rng() * 10), hint: 'of triallists' },
    { label: 'Inactive 30+ days', value: Math.round(9 + rng() * 8), hint: 'churned' },
  ];

  const table: TableRow[] = MODULES.map((m) => {
    const users = Math.round((500 + rng() * 2200) * f);
    const adoptionPct = Math.round(30 + rng() * 60);
    const r = rng();
    return {
      module: m.label,
      users,
      sessions: Math.round(users * (1.4 + rng() * 2.4)),
      adoptionPct,
      trend: r > 0.6 ? 'up' : r > 0.3 ? 'flat' : 'down',
      status: adoptionPct > 60 ? 'healthy' : adoptionPct > 40 ? 'watch' : 'drop',
    };
  }).sort((a, b) => b.users - a.users);

  const adoptionKpis: Kpi[] = [
    { id: 'eng', label: 'Engagement Rate', value: `${Math.round(58 + rng() * 14)}%`, deltaPct: 4.1, sub: 'sessions with an action', info: '% of sessions with a meaningful Action event beyond a plain view.' },
    { id: 'feat', label: 'Feature Adoption', value: `${Math.round(55 + rng() * 16)}%`, deltaPct: 2.6, sub: 'used ≥1 tracked module', info: '% of active users who used at least one tracked module.' },
    { id: 'repeat', label: 'Repeat Usage', value: `${Math.round(48 + rng() * 14)}%`, deltaPct: 1.8, sub: 'used module 2+ times', info: '% of module users who came back more than once.' },
    { id: 'breadth', label: 'Module Breadth', value: `${Math.round(4 + rng() * 3)}/8`, deltaPct: null, sub: 'modules touched', info: 'Distinct modules used at least once vs total available.' },
    { id: 'd1', label: 'Day-1 Retention', value: `${Math.round(50 + rng() * 12)}%`, deltaPct: 2.2, sub: 'new users back day 1', info: '% of new users returning exactly 1 day after first session.' },
    { id: 'churn', label: 'Churn (30d)', value: `${Math.round(8 + rng() * 6)}%`, deltaPct: -0.9, sub: 'inactive 30+ days', info: '% of previously active users with no activity in 30 days.' },
  ];

  const wfSteps: Record<string, string[]> = {
    helpdesk: ['Raise request opened', 'Details submitted', 'Request tracked', 'Resolved / closed'],
    visitors: ['Invite created', 'Gate notified', 'Checked in', 'Checked out'],
    bills: ['Bill viewed', 'Payment started', 'Payment success', 'Receipt viewed'],
    amenity: ['Slot browsed', 'Booking started', 'Booking confirmed', 'Attended'],
    events: ['Event viewed', 'RSVP opened', 'RSVP submitted', 'Attended'],
    notices: ['Notice viewed', 'Notice opened', 'Acknowledged', 'Shared'],
    polls: ['Poll viewed', 'Vote started', 'Vote submitted', 'Results viewed'],
    documents: ['List viewed', 'Document opened', 'Downloaded', 'Shared'],
  };

  const modules: WorkflowModule[] = MODULES.map((m) => {
    const start = Math.round((900 + rng() * 2400) * f);
    const fun = funnelFor(rng, start, wfSteps[m.key] ?? wfSteps.helpdesk);
    const completionPct = Math.round((fun[fun.length - 1].users / Math.max(1, start)) * 100);
    return {
      key: m.key,
      label: m.label,
      bucket: m.bucket,
      adoptionPct: Math.round(34 + rng() * 48),
      completionPct,
      dropoffPct: 100 - completionPct,
      avgTime: `${Math.round(1 + rng() * 6)}m ${Math.round(rng() * 59)}s`,
      completions: fun[fun.length - 1].users,
      funnel: fun,
    };
  });

  return {
    filtersEcho: filters,
    societies: SOCIETIES,
    traffic: {
      kpis: trafficKpis,
      usageTrend: trend(rng, labels, 1400 * f, 260, filters.comparePrevious),
      deviceSplit: [
        { name: 'Android', value: Math.round(56 + rng() * 6), color: '#2c7be5' },
        { name: 'iOS', value: Math.round(44 - rng() * 6), color: '#3daf7d' },
      ],
      liveNow: Math.round(40 + rng() * 120 * f + 20),
    },
    adoption: { kpis: adoptionKpis, adoptionTrend, byModule, retention, dormant, table },
    workflow: { modules, activeKey: modules[0].key },
  };
}
