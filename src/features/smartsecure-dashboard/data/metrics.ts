import type {
  TrafficSessionResponse,
  UsageDistributionResponse,
  AdoptionEngagementResponse,
  AdoptionTrendResponse,
  GrowthResponse,
  RetentionResponse,
  RolesResponse,
  WorkflowUsageResponse,
} from '../api/adoptionApi';
import { TOTAL_MODULES } from './constants';
import { WORKFLOWS, type Workflow } from './workflows';
import { fmtC, pct } from './format';
import type { DashboardState, TileSpec } from './types';

function densifyUsageData(
  fromStr: string,
  toStr: string,
  rawDays: { day: string; visitors: number; views: number; sessions: number }[] = []
) {
  const map = new Map<string, { visitors: number; views: number; sessions: number }>();
  for (const r of rawDays) {
    if (r && r.day) {
      map.set(r.day, {
        visitors: r.visitors || 0,
        views: r.views || 0,
        sessions: r.sessions || 0,
      });
    }
  }

  const result: { day: string; visitors: number; views: number; sessions: number }[] = [];
  const start = new Date(fromStr);
  const end = new Date(toStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return rawDays;
  }

  const cur = new Date(start);
  while (cur <= end) {
    const ymd = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    const existing = map.get(ymd);
    result.push({
      day: ymd,
      visitors: existing ? existing.visitors : 0,
      views: existing ? existing.views : 0,
      sessions: existing ? existing.sessions : 0,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

const fmtDelta = (v: number | null | undefined, suffix = '%'): string | null =>
  v != null && !isNaN(v) ? (v > 0 ? '+' : '') + v.toFixed(1) + suffix : null;

/* ================================================================
   1. TRAFFIC & SESSION
   ================================================================ */

export interface UsageSeries {
  cur: number[];
  prev: number[];
  labels: string[];
  color: string;
  fillColor: string;
  legendLabel: string;
}

export interface TrafficData {
  tiles: TileSpec[];
  usage: Record<'visitors' | 'views' | 'sessions', UsageSeries>;
  deviceRows: { name: string; share: number; color: string }[];
  viewsPerSession: string;
}

export function buildTraffic(
  state: DashboardState,
  trafficQ?: TrafficSessionResponse,
  usageQ?: UsageDistributionResponse,
): TrafficData {
  const t = trafficQ?.tiles;
  const d = trafficQ?.delta_pct;

  const curActive       = t?.active_users ?? 0;
  const curSessions     = t?.sessions ?? 0;
  const views           = t?.screen_views ?? 0;
  const bounce          = t?.bounce_rate ?? 0;
  const recentlyOnline  = t?.recently_online ?? 0;

  const fmtDur = (s: number) => (s > 0 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : '0m 00s');
  const avgDur = t && t.avg_session_seconds > 0 ? fmtDur(t.avg_session_seconds) : '—';

  const tiles: TileSpec[] = [
    {
      id: 'activeUsers',
      label: 'Active Users',
      val: curActive.toLocaleString(),
      dir: (d?.active_users != null && d.active_users < 0 ? 'dn' : 'up') as 'up' | 'dn' | 'flat',
      delta: fmtDelta(d?.active_users, '% vs prev'),
      sub: 'unique gate staff/admins this period',
      raw: curActive,
      unit: '',
      goodUp: true,
    },
    {
      id: 'screenViews',
      label: 'Screen Views',
      val: fmtC(views),
      dir: (d?.screen_views != null && d.screen_views < 0 ? 'dn' : 'up') as 'up' | 'dn' | 'flat',
      delta: fmtDelta(d?.screen_views),
      sub: 'total across modules',
      raw: views,
      noTarget: true,
    },
    {
      id: 'totalSessions',
      label: 'Sessions',
      val: curSessions.toLocaleString(),
      dir: (d?.sessions != null && d.sessions < 0 ? 'dn' : 'up') as 'up' | 'dn' | 'flat',
      delta: fmtDelta(d?.sessions),
      sub: 'app sessions started',
      raw: curSessions,
      noTarget: true,
    },
    {
      id: 'avgSessionDur',
      label: 'Session Duration',
      val: avgDur,
      dir: 'up',
      delta: fmtDelta(d?.avg_session_seconds, 's'),
      sub: 'per session',
      raw: t ? t.avg_session_seconds / 60 : 0,
      noTarget: true,
    },
    {
      id: 'bounceRate',
      label: 'Bounce Rate',
      val: t ? bounce.toFixed(1) + '%' : '0.0%',
      dir: (d?.bounce_rate != null ? (d.bounce_rate < 0 ? 'dn' : 'up') : 'flat') as 'up' | 'dn' | 'flat',
      delta: d?.bounce_rate != null ? Math.abs(d.bounce_rate).toFixed(1) + '%' : null,
      sub: 'lower is better',
      raw: bounce,
      unit: '%',
      goodUp: false,
    },
    {
      id: 'recentlyOnline',
      label: 'Recently Online',
      val: recentlyOnline.toLocaleString(),
      dir: 'flat',
      delta: null,
      sub: 'active in last 30 min',
      noTarget: true,
    },
  ];

  // Map real usage over time or densify 0s across the actual date window
  const rawCurrent = usageQ?.usage_over_time?.current || [];
  const rawPrev = usageQ?.usage_over_time?.previous || [];
  const densifiedCur = densifyUsageData(state.rangeFrom, state.rangeTo, rawCurrent);
  const densifiedPrev = rawPrev.length > 0 ? rawPrev : [];

  const labels = densifiedCur.map((dayObj) => {
    const parts = dayObj.day.split('-');
    return parts.length === 3 ? `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}` : dayObj.day;
  });

  const curVisitors = densifiedCur.map((dayObj) => dayObj.visitors || 0);
  const prevVisitors = densifiedPrev.map((dayObj) => dayObj.visitors || 0);

  const curViews = densifiedCur.map((dayObj) => dayObj.views || 0);
  const prevViews = densifiedPrev.map((dayObj) => dayObj.views || 0);

  const curSess = densifiedCur.map((dayObj) => dayObj.sessions || 0);
  const prevSess = densifiedPrev.map((dayObj) => dayObj.sessions || 0);

  const usage: TrafficData['usage'] = {
    visitors: { cur: curVisitors, prev: prevVisitors, labels, color: 'var(--ss-chart-blue)', fillColor: 'var(--ss-chart-fill)', legendLabel: 'Visitors' },
    views: { cur: curViews, prev: prevViews, labels, color: 'var(--ss-chart-violet)', fillColor: 'var(--ss-chart-violet-tint)', legendLabel: 'Views' },
    sessions: { cur: curSess, prev: prevSess, labels, color: 'var(--ss-green)', fillColor: 'var(--ss-green-tint)', legendLabel: 'Sessions' },
  };

  const deviceRows: TrafficData['deviceRows'] =
    usageQ?.device_split?.devices && usageQ.device_split.devices.length > 0
      ? usageQ.device_split.devices.map((devItem, i) => {
          const palette = ['var(--ss-chart-blue)', 'var(--ss-chart-violet)', 'var(--ss-green)', 'var(--ss-mint)', 'var(--ss-amber)'];
          return {
            name: devItem.device,
            share: (devItem.session_share || 0) / 100,
            color: palette[i % palette.length],
          };
        })
      : [];

  const vps =
    usageQ?.views_per_session != null
      ? usageQ.views_per_session.toFixed(1)
      : curSessions > 0
      ? (views / curSessions).toFixed(1)
      : '—';

  return { tiles, usage, deviceRows, viewsPerSession: vps };
}

/* ================================================================
   2. ADOPTION & ENGAGEMENT
   ================================================================ */

export interface GrowthWeek {
  label: string;
  nw: number;
  ret: number;
  res: number;
  dorm: number;
}

export interface RoleShare {
  name: string;
  share: number;
  color: string;
}

export interface SocietyRow {
  society: string;
  active: number;
  sessions: number;
  avgSession: string;
  bounce: number;
  trend: 'up' | 'dn' | 'flat';
  status: 'Watch' | 'Steady' | 'Healthy';
  statusClass: 'st-drop' | 'st-watch' | 'st-healthy';
}

export interface AdoptData {
  tiles: TileSpec[];
  adoptionTrendChart: { series: number[]; labels: string[] };
  growthWeeks: GrowthWeek[];
  retentionCohorts: (number | null)[][];
  retentionRowLabels: string[];
  roleShares: RoleShare[];
  dormant: number;
  societyRows: SocietyRow[];
}

export function buildAdoption(
  state: DashboardState,
  engagementQ?: AdoptionEngagementResponse,
  trendQ?: AdoptionTrendResponse,
  growthQ?: GrowthResponse,
  retentionQ?: RetentionResponse,
  rolesQ?: RolesResponse,
): AdoptData {
  const seatUtilValue = engagementQ?.seat_utilisation?.value;
  const seatUtil = seatUtilValue != null ? seatUtilValue / 100 : null;
  const seatVal  = seatUtil != null && !isNaN(seatUtil) ? pct(seatUtil * 100) : '—';
  const seatDelta = fmtDelta(engagementQ?.seat_utilisation?.delta_pct);

  const stickinessVal = engagementQ?.stickiness?.value;
  const stickiness    = stickinessVal != null ? stickinessVal : 0;
  const stickyDelta   = fmtDelta(engagementQ?.stickiness?.delta_pct);
  const stickyDisplay = pct(stickiness * 100);

  const adoptionTrendVal = trendQ?.trend_pct ?? engagementQ?.adoption_trend?.value ?? null;
  const trendDisplay     = adoptionTrendVal != null ? (adoptionTrendVal > 0 ? '+' : '') + adoptionTrendVal.toFixed(1) + '%' : '—';
  const trendDelta       = adoptionTrendVal != null ? 'vs prior 8 weeks' : null;

  const activationVal = engagementQ?.activation?.value;
  const activation14  = activationVal != null ? Math.round(activationVal) : null;
  const activeDelta   = fmtDelta(engagementQ?.activation?.delta_pct);
  const activeDisplay = activation14 != null ? activation14 + '%' : '—';

  const usedModules  = engagementQ?.module_breadth?.in_use ?? 0;
  const totalModules = engagementQ?.module_breadth?.total ?? TOTAL_MODULES;

  const tiles: TileSpec[] = [
    // {
    //   id: 'seatUtil',
    //   label: 'Seat Utilisation',
    //   val: seatVal,
    //   dir: (engagementQ?.seat_utilisation?.delta_pct != null && engagementQ.seat_utilisation.delta_pct < 0 ? 'dn' : 'up') as 'up' | 'dn' | 'flat',
    //   delta: seatDelta,
    //   sub: 'active ÷ registered gate staff',
    //   raw: seatUtil != null ? seatUtil * 100 : 0,
    //   unit: '%',
    //   goodUp: true,
    // },
    {
      id: 'stickiness',
      label: 'Stickiness',
      val: stickyDisplay,
      dir: (engagementQ?.stickiness?.delta_pct != null && engagementQ.stickiness.delta_pct < 0 ? 'dn' : 'up') as 'up' | 'dn' | 'flat',
      delta: stickyDelta,
      sub: 'avg DAU/MAU',
      raw: stickiness * 100,
      unit: '%',
      goodUp: true,
    },
    {
      id: 'adoptionTrend',
      label: 'Adoption Trend',
      val: trendDisplay,
      dir: (adoptionTrendVal != null && adoptionTrendVal < 0 ? 'dn' : 'up') as 'up' | 'dn' | 'flat',
      delta: trendDelta,
      sub: 'weekly active users',
      noTarget: true,
    },
    {
      id: 'activation14',
      label: '14-Day Activation',
      val: activeDisplay,
      dir: (engagementQ?.activation?.delta_pct != null && engagementQ.activation.delta_pct < 0 ? 'dn' : 'up') as 'up' | 'dn' | 'flat',
      delta: activeDelta,
      sub: 'of new gate staff',
      raw: activation14 ?? 0,
      unit: '%',
      goodUp: true,
    },
    {
      id: 'moduleBreadth',
      label: 'Module Breadth',
      val: `${usedModules} / ${totalModules}`,
      dir: 'flat',
      delta: null,
      sub: 'modules used this period',
      noTarget: true,
    },
  ];

  let adoptionTrendChart: { series: number[]; labels: string[] };
  if (trendQ?.weekly?.current && trendQ.weekly.current.length > 0) {
    const labels = trendQ.weekly.current.map((_, i) => `W${i + 1}`);
    const series = trendQ.weekly.current.map((w) => w.wau || 0);
    adoptionTrendChart = { series, labels };
  } else {
    adoptionTrendChart = { series: [], labels: [] };
  }

  let growthWeeks: GrowthWeek[];
  if (growthQ?.weeks && growthQ.weeks.length > 0) {
    growthWeeks = growthQ.weeks.map((w, i) => ({
      label: `W${i + 1}`,
      nw: w.new || 0,
      ret: w.returning || 0,
      res: w.resurrected || 0,
      dorm: w.dormant || 0,
    }));
  } else {
    growthWeeks = [];
  }

  let retentionCohorts: (number | null)[][];
  let retentionRowLabels: string[];
  if (retentionQ?.cohorts && retentionQ.cohorts.length > 0) {
    retentionRowLabels = retentionQ.cohorts.map((c) => {
      const parts = c.cohort_week.split('-');
      return parts.length === 3 ? `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}` : c.cohort_week;
    });
    retentionCohorts = retentionQ.cohorts.map((c) => {
      const row: (number | null)[] = [];
      for (let w = 0; w < 6; w++) {
        const val = c[`week${w}`];
        if (val === null || val === undefined || val === '') {
          row.push(null);
        } else {
          row.push(typeof val === 'number' ? Math.round(val) : parseFloat(String(val)) || null);
        }
      }
      return row;
    });
  } else {
    retentionCohorts = [];
    retentionRowLabels = [];
  }

  let roleShares: RoleShare[];
  if (rolesQ?.roles && rolesQ.roles.length > 0) {
    const colors = ['var(--ss-chart-blue)', 'var(--ss-chart-violet)', 'var(--ss-mint)', 'var(--ss-green)', 'var(--ss-amber)'];
    roleShares = rolesQ.roles.map((r, i) => ({
      name: r.role,
      share: (r.active_share || 0) / 100,
      color: colors[i % colors.length],
    }));
  } else {
    roleShares = [];
  }

  const dormant = engagementQ?.dormant_users?.value ?? 0;
  const societyRows: SocietyRow[] = [];

  return {
    tiles,
    adoptionTrendChart,
    growthWeeks,
    retentionCohorts,
    retentionRowLabels,
    roleShares,
    dormant,
    societyRows,
  };
}

/* ================================================================
   3. WORKFLOW USAGE
   ================================================================ */

export interface FunnelStep {
  step: string;
  pctOfEntrants: number;
  dropPct: number | null;
}

export interface FunnelData {
  steps: FunnelStep[];
  worstIndex: number;
}

export interface ScreenRow {
  screen: string;
  users: number;
  events: number;
  sessions: number;
  completion: number;
}

export interface EntryScreenRow {
  screen: string;
  visitors: number;
  views: number;
  bounce: number;
}

export interface FlowsData {
  workflow: Workflow;
  tiles: TileSpec[];
  funnel: FunnelData;
  screens: ScreenRow[];
  entryScreens: EntryScreenRow[];
  scopeNote: { kind: 'proposed' | 'incomplete'; text: string } | null;
}

export function buildFlows(state: DashboardState, workflowQ?: WorkflowUsageResponse): FlowsData {
  const w = WORKFLOWS.find((x) => x.key === state.wf) ?? WORKFLOWS[0];

  const kpis = workflowQ?.kpis;
  const adoptVal = kpis?.f_adopt?.value != null ? kpis.f_adopt.value.toFixed(1) + '%' : '—';
  const compVal  = kpis?.f_comp?.value  != null ? kpis.f_comp.value.toFixed(1)  + '%' : '—';
  const volVal   = kpis?.f_vol?.value   != null ? String(kpis.f_vol.value.toLocaleString()) : '0';

  const apiWorstStep    = workflowQ?.funnel?.find((s) => s.biggest);
  const biggestDropVal  = apiWorstStep?.drop_pct != null ? apiWorstStep.drop_pct.toFixed(1) + '%' : '—';
  const biggestDropStep = apiWorstStep?.step ?? '—';

  const adoptDir: 'up' | 'dn' | 'flat' = kpis?.f_adopt?.delta_pct != null ? (kpis.f_adopt.delta_pct >= 0 ? 'up' : 'dn') : 'flat';
  const compDir:  'up' | 'dn' | 'flat' = kpis?.f_comp?.delta_pct  != null ? (kpis.f_comp.delta_pct  >= 0 ? 'up' : 'dn') : 'flat';

  const tiles: TileSpec[] = [
    {
      id: 'F-adopt',
      label: 'Workflow Adoption',
      val: adoptVal,
      dir: adoptDir,
      delta: fmtDelta(kpis?.f_adopt?.delta_pct),
      raw: kpis?.f_adopt?.value ?? 0,
      unit: '%',
      goodUp: true,
    },
    {
      id: 'F-comp',
      label: 'Completion Rate',
      val: compVal,
      dir: compDir,
      delta: fmtDelta(kpis?.f_comp?.delta_pct),
      raw: kpis?.f_comp?.value ?? 0,
      unit: '%',
      goodUp: true,
    },
    {
      label: 'Biggest Step Drop',
      val: biggestDropVal,
      dir: 'dn',
      delta: biggestDropStep !== '—' ? 'at ' + biggestDropStep : null,
      sub: biggestDropStep !== '—' ? 'at ' + biggestDropStep : undefined,
      noTarget: true,
    },
    {
      label: 'Usage Volume',
      val: volVal,
      dir: 'up',
      delta: fmtDelta(kpis?.f_vol?.delta_pct),
      sub: 'completions',
      noTarget: true,
    },
  ];

  let worstIndex = 0;
  let worstDrop = -1;
  const apiFunnel = workflowQ?.funnel;
  const steps: FunnelStep[] =
    apiFunnel && apiFunnel.length > 0
      ? apiFunnel.map((s, i) => {
          if (s.drop_pct != null && s.drop_pct > worstDrop) {
            worstDrop = s.drop_pct;
            worstIndex = i;
          }
          return {
            step: s.step,
            pctOfEntrants: s.reach || 0,
            dropPct: s.drop_pct,
          };
        })
      : w.steps.map((step) => ({ step, pctOfEntrants: 0, dropPct: null }));

  const screens: ScreenRow[] =
    workflowQ?.flows && workflowQ.flows.length > 0
      ? workflowQ.flows.map((f) => ({
          screen: f.path,
          users: f.users || 0,
          events: f.events || 0,
          sessions: f.sessions || 0,
          completion: f.f_comp != null ? Math.round(f.f_comp) : 0,
        }))
      : [];

  const entryScreens: EntryScreenRow[] =
    workflowQ?.entry_screens && workflowQ.entry_screens.length > 0
      ? workflowQ.entry_screens.map((e) => ({
          screen: e.path,
          visitors: e.visitors || 0,
          views: e.views || 0,
          bounce: Math.round(e.bounce || 0),
        }))
      : [];

  const scopeNote: FlowsData['scopeNote'] = w.proposed
    ? {
        kind: 'proposed',
        text:
          "This card and its event names (steps below) do not exist in SmartSecure_PostHog_Events.xlsx. They were added after reviewing the design team's Figma screens for visitor registration, which show this step as part of the real product flow. Treat every event name here as a suggested starting point for engineers to confirm and instrument, not as confirmed instrumentation.",
      }
    : w.incompleteNote
      ? { kind: 'incomplete', text: w.incompleteNote }
      : null;

  return { workflow: w, tiles, funnel: { steps, worstIndex }, screens, entryScreens, scopeNote };
}
