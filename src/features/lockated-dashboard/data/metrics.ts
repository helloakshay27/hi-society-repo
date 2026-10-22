import { fmtC, pct } from '../utils/rng';
import type {
  TrafficSessionResponse,
  UsageDistributionResponse,
  AdoptionEngagementResponse,
  AdoptionTrendResponse,
  GrowthResponse,
  RetentionResponse,
  RolesResponse,
  WorkflowUsageResponse
} from '../api/adoptionApi';
import type { DashboardState, TileData } from './types';
import { WORKFLOWS } from './workflows';

const fmtDelta = (v: number | null | undefined, suffix = '%'): string | null =>
  v != null && !isNaN(v) ? (v > 0 ? '+' : '') + v.toFixed(1) + suffix : null;

const fmtDur = (s: number) =>
  s > 0 ? `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s` : '0m 00s';

/**
 * Generate fallback daily date labels for the selected range.
 */
function generateDayLabels(rangeDays: number, toDateStr?: string): string[] {
  const labels: string[] = [];
  const end = toDateStr ? new Date(toDateStr) : new Date();
  const validEnd = !isNaN(end.getTime()) ? end : new Date();
  const count = Math.min(Math.max(rangeDays, 1), 90);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(validEnd);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

/**
 * Generate fallback weekly date labels.
 */
function generateWeekLabels(numWeeks: number): string[] {
  const labels: string[] = [];
  for (let i = 1; i <= numWeeks; i++) {
    labels.push(`W${i}`);
  }
  return labels;
}

/* =========================================================================
   1. TRAFFIC DATA
   ========================================================================= */

export interface TrafficMetrics {
  tiles: TileData[];
  visitorsSeries: { cur: number[]; prev: number[]; labels: string[] };
  viewsSeries: { cur: number[]; prev: number[]; labels: string[] };
  sessionsSeries: { cur: number[]; prev: number[]; labels: string[] };
  iosShare: number;
  andShare: number;
  viewsPerSession: string;
  recentlyOnlineCount: number;
}

export function buildTraffic(
  state: DashboardState,
  trafficQ?: TrafficSessionResponse,
  usageQ?: UsageDistributionResponse
): TrafficMetrics {
  const t = trafficQ?.tiles;
  const d = trafficQ?.delta_pct;

  const activeUsersVal = t?.active_users ?? 0;
  const screenViewsVal = t?.screen_views ?? 0;
  const sessionsVal = t?.sessions ?? 0;
  const avgDurVal = t ? fmtDur(t.avg_session_seconds) : '0m 00s';
  const bounceRateVal = `${t ? Math.round(t.bounce_rate) : 0}%`;
  const recentlyOnlineVal = t?.recently_online ?? 0;

  const tiles: TileData[] = [
    {
      label: 'Active Users',
      val: activeUsersVal ? activeUsersVal.toLocaleString() : '0',
      dir: d?.active_users != null && d.active_users < 0 ? 'dn' : 'up',
      delta: d?.active_users != null ? `${fmtDelta(d.active_users)} vs prev. period` : null,
      sub: 'unique residents this period'
    },
    {
      label: 'Screen Views',
      val: screenViewsVal ? fmtC(screenViewsVal) : '0',
      dir: d?.screen_views != null && d.screen_views < 0 ? 'dn' : 'up',
      delta: d?.screen_views != null ? fmtDelta(d.screen_views) : null,
      sub: 'total across categories'
    },
    {
      label: 'Sessions',
      val: sessionsVal ? sessionsVal.toLocaleString() : '0',
      dir: d?.sessions != null && d.sessions < 0 ? 'dn' : 'up',
      delta: d?.sessions != null ? fmtDelta(d.sessions) : null,
      sub: 'app sessions started'
    },
    {
      label: 'Session Duration',
      val: avgDurVal,
      dir: 'up',
      delta:
        d?.avg_session_seconds != null
          ? `${d.avg_session_seconds > 0 ? '+' : ''}${Math.round(d.avg_session_seconds)}s`
          : null,
      sub: 'per session'
    },
    {
      label: 'Bounce Rate',
      val: bounceRateVal,
      dir: 'dn',
      delta: d?.bounce_rate != null ? fmtDelta(d.bounce_rate) : null,
      sub: 'lower is better'
    },
    {
      label: 'Recently Online',
      val: recentlyOnlineVal ? recentlyOnlineVal.toLocaleString() : '0',
      dir: 'flat',
      delta: null,
      sub: 'active in last 30 min'
    }
  ];

  // Usage over time series
  let labels: string[];
  let visitorsSeries: { cur: number[]; prev: number[]; labels: string[] };
  let viewsSeries: { cur: number[]; prev: number[]; labels: string[] };
  let sessionsSeries: { cur: number[]; prev: number[]; labels: string[] };

  if (usageQ?.usage_over_time?.current && usageQ.usage_over_time.current.length > 0) {
    const usageCurrent = usageQ.usage_over_time.current;
    const usagePrev = usageQ.usage_over_time.previous || [];
    labels = usageCurrent.map((u) => {
      const dt = new Date(u.day);
      return !isNaN(dt.getTime())
        ? dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : u.day;
    });
    // Previous period aligned day-by-day to the current one; missing days
    // (or no previous data at all) are shown as 0 rather than dropped.
    const prevOf = (key: 'visitors' | 'views' | 'sessions') =>
      usageCurrent.map((_, i) => usagePrev[i]?.[key] || 0);
    visitorsSeries = {
      cur: usageCurrent.map((u) => u.visitors || 0),
      prev: prevOf('visitors'),
      labels
    };
    viewsSeries = {
      cur: usageCurrent.map((u) => u.views || 0),
      prev: prevOf('views'),
      labels
    };
    sessionsSeries = {
      cur: usageCurrent.map((u) => u.sessions || 0),
      prev: prevOf('sessions'),
      labels
    };
  } else {
    labels = generateDayLabels(state.range || 30, state.rangeTo);
    const zeroArr = new Array(labels.length).fill(0);
    visitorsSeries = { cur: zeroArr, prev: zeroArr, labels };
    viewsSeries = { cur: zeroArr, prev: zeroArr, labels };
    sessionsSeries = { cur: zeroArr, prev: zeroArr, labels };
  }

  // Device split
  let iosShare = 0.5;
  let andShare = 0.5;

  if (usageQ?.device_split?.devices && usageQ.device_split.devices.length > 0) {
    const iosDev = usageQ.device_split.devices.find((x) => x.device.toLowerCase().includes('ios'));
    const andDev = usageQ.device_split.devices.find((x) => x.device.toLowerCase().includes('android'));
    if (iosDev && andDev) {
      const totalShare = (iosDev.session_share || 0) + (andDev.session_share || 0);
      if (totalShare > 0) {
        iosShare = (iosDev.session_share || 0) / totalShare;
        andShare = (andDev.session_share || 0) / totalShare;
      }
    }
  }

  const viewsPerSession =
    usageQ?.views_per_session != null && !isNaN(usageQ.views_per_session)
      ? usageQ.views_per_session.toFixed(1)
      : '0.0';

  return {
    tiles,
    visitorsSeries,
    viewsSeries,
    sessionsSeries,
    iosShare,
    andShare,
    viewsPerSession,
    recentlyOnlineCount: recentlyOnlineVal
  };
}

/* =========================================================================
   2. ADOPTION DATA
   ========================================================================= */

export interface AdoptionMetrics {
  tiles: TileData[];
  trendSeries: { cur: number[]; labels: string[] };
  growthSeries: {
    labels: string[];
    series: { label: string; data: number[]; color: string }[];
    negSeries: { label: string; data: number[]; color: string };
  };
  cohortDates: string[];
  cohortMatrix: (number | null)[][];
  dormantCount: number | null;
  siteRows: {
    p: string;
    active: number;
    sess: number;
    avgSess: string;
    bnc: number;
    trend: 'up' | 'flat' | 'dn';
  }[];
}

export function buildAdoption(
  _state: DashboardState,
  engagementQ?: AdoptionEngagementResponse,
  trendQ?: AdoptionTrendResponse,
  growthQ?: GrowthResponse,
  retentionQ?: RetentionResponse,
  rolesQ?: RolesResponse
): AdoptionMetrics {
  const seatUtilVal =
    engagementQ?.seat_utilisation?.value != null
      ? pct(engagementQ.seat_utilisation.value)
      : '0%';

  const stickinessVal =
    engagementQ?.stickiness?.value != null
      ? pct(engagementQ.stickiness.value)
      : '0%';

  const trendVal =
    engagementQ?.adoption_trend?.value != null
      ? `${engagementQ.adoption_trend.value >= 0 ? '+' : ''}${Math.round(engagementQ.adoption_trend.value)}%`
      : '0%';

  const activationVal =
    engagementQ?.activation?.value != null
      ? `${Math.round(engagementQ.activation.value)}%`
      : '0%';

  const breadthVal =
    engagementQ?.module_breadth?.in_use != null && engagementQ.module_breadth.total != null
      ? `${engagementQ.module_breadth.in_use} / ${engagementQ.module_breadth.total}`
      : '0 / 13';

  const dormantVal =
    engagementQ?.dormant_users?.value != null
      ? engagementQ.dormant_users.value
      : 0;

  const tiles: TileData[] = [
    {
      label: 'Seat Utilisation',
      val: seatUtilVal,
      dir: 'up',
      delta:
        engagementQ?.seat_utilisation?.delta_pct != null
          ? fmtDelta(engagementQ.seat_utilisation.delta_pct)
          : null,
      sub: 'active ÷ registered residents'
    },
    {
      label: 'Stickiness',
      val: stickinessVal,
      dir: 'up',
      delta:
        engagementQ?.stickiness?.delta_pct != null
          ? fmtDelta(engagementQ.stickiness.delta_pct)
          : null,
      sub: 'avg DAU/MAU'
    },
    {
      label: 'Adoption Trend',
      val: trendVal,
      dir: 'up',
      delta: trendQ?.trend_pct != null ? fmtDelta(trendQ.trend_pct) : null,
      sub: 'weekly active users'
    },
    {
      label: '14-Day Activation',
      val: activationVal,
      dir: 'up',
      delta:
        engagementQ?.activation?.delta_pct != null
          ? fmtDelta(engagementQ.activation.delta_pct)
          : null,
      sub: 'of new registrations'
    },
    {
      label: 'Module Breadth',
      val: breadthVal,
      dir: 'flat',
      delta: null,
      sub: 'categories used this period'
    },
    {
      label: 'Dormant Users',
      val: dormantVal != null ? fmtC(dormantVal) : '0',
      dir: 'flat',
      delta: null,
      sub: 'no activity 14+ days'
    }
  ];

  // Adoption Trend series
  const trendSeries =
    trendQ?.weekly?.current && trendQ.weekly.current.length > 0
      ? {
          cur: trendQ.weekly.current.map((w) => w.wau || 0),
          labels: trendQ.weekly.current.map((_, i) => `W${i + 1}`)
        }
      : {
          cur: [0, 0, 0, 0, 0, 0, 0, 0],
          labels: generateWeekLabels(8)
        };

  // Growth accounting
  let growthSeries: AdoptionMetrics['growthSeries'];
  if (growthQ?.weeks && growthQ.weeks.length > 0) {
    const labels = growthQ.weeks.map((_, i) => `W${i + 1}`);
    growthSeries = {
      labels,
      series: [
        { label: 'New', data: growthQ.weeks.map((w) => w.new || 0), color: '#2c7be5' },
        { label: 'Returning', data: growthQ.weeks.map((w) => w.returning || 0), color: '#0f8a3d' },
        { label: 'Resurrecting', data: growthQ.weeks.map((w) => w.resurrected || 0), color: '#3daf7d' }
      ],
      negSeries: {
        label: 'Dormant',
        data: growthQ.weeks.map((w) => Math.abs(w.dormant || 0)),
        color: '#b3402c'
      }
    };
  } else {
    const labels = generateWeekLabels(6);
    const zeroArr = [0, 0, 0, 0, 0, 0];
    growthSeries = {
      labels,
      series: [
        { label: 'New', data: zeroArr, color: '#2c7be5' },
        { label: 'Returning', data: zeroArr, color: '#0f8a3d' },
        { label: 'Resurrecting', data: zeroArr, color: '#3daf7d' }
      ],
      negSeries: {
        label: 'Dormant',
        data: zeroArr,
        color: '#b3402c'
      }
    };
  }

  // Retention cohort matrix
  let cohortDates: string[];
  let cohortMatrix: (number | null)[][];
  if (retentionQ?.cohorts && retentionQ.cohorts.length > 0) {
    cohortDates = retentionQ.cohorts.map((c) => {
      const dt = new Date(c.cohort_week);
      return !isNaN(dt.getTime()) ? `${dt.getMonth() + 1}/${dt.getDate()}` : c.cohort_week;
    });
    cohortMatrix = retentionQ.cohorts.map((c) =>
      Array.from({ length: 6 }, (_, week) => {
        const value = c[`week${week}`];
        return value == null ? null : Number(value);
      })
    );
  } else {
    cohortDates = generateWeekLabels(6).map((w) => `Cohort ${w}`);
    cohortMatrix = Array.from({ length: 6 }, () => [null, null, null, null, null, null]);
  }

  // Site rows from roles/sites API if available
  const siteRows: AdoptionMetrics['siteRows'] = [];
  if (rolesQ && Array.isArray((rolesQ as any)?.sites)) {
    for (const site of (rolesQ as any).sites) {
      siteRows.push({
        p: site.name || 'Site',
        active: site.active_users || 0,
        sess: site.sessions || 0,
        avgSess: fmtDur(site.avg_session_seconds || 0),
        bnc: Math.round(site.bounce_rate || 0),
        trend: 'flat'
      });
    }
  }

  return {
    tiles,
    trendSeries,
    growthSeries,
    cohortDates,
    cohortMatrix,
    dormantCount: dormantVal,
    siteRows
  };
}

/* =========================================================================
   3. WORKFLOW USAGE DATA
   ========================================================================= */

export interface WorkflowMetrics {
  tiles: TileData[];
  funnelSteps: string[];
  funnelDrops: (number | null)[];
  screenRows: { s: string; users: number; events: number; sess: number; comp: number | null }[];
  entryRows: { screen: string; visitors: number; views: number; bounce: number }[];
}

export function buildFlows(
  state: DashboardState,
  workflowQ?: WorkflowUsageResponse
): WorkflowMetrics {
  const activeWorkflow =
    WORKFLOWS.find((workflow) => workflow.key === state.wf) || WORKFLOWS[0];

  const kpis = workflowQ?.kpis;
  const adoptRate =
    kpis?.f_adopt?.value != null
      ? `${Math.round(kpis.f_adopt.value)}%`
      : `${activeWorkflow.adoption}%`;

  const compRate =
    kpis?.f_comp?.value != null
      ? `${Math.round(kpis.f_comp.value)}%`
      : `${activeWorkflow.completionRate}%`;

  const dropVal =
    kpis?.f_step?.value != null
      ? `${Math.round(kpis.f_step.value)}%`
      : `${activeWorkflow.dropoffRate}%`;

  const volVal =
    kpis?.f_vol?.value != null
      ? fmtC(kpis.f_vol.value)
      : activeWorkflow.completions;

  const biggestStep =
    workflowQ?.funnel?.find((step) => step.biggest)?.step ??
    (activeWorkflow.steps[1] || '--');

  const tiles: TileData[] = [
    {
      label: 'Workflow Adoption',
      val: adoptRate,
      dir: 'up',
      delta: fmtDelta(kpis?.f_adopt?.delta_pct)
    },
    {
      label: 'Completion Rate',
      val: compRate,
      dir: 'up',
      delta: fmtDelta(kpis?.f_comp?.delta_pct)
    },
    {
      label: 'Biggest Step Drop',
      val: dropVal,
      dir: 'dn',
      delta: biggestStep === '--' ? null : biggestStep,
      sub: biggestStep === '--' ? undefined : `at ${biggestStep}`
    },
    {
      label: 'Usage Volume',
      val: volVal,
      dir: 'up',
      delta: fmtDelta(kpis?.f_vol?.delta_pct),
      sub: 'completions'
    }
  ];

  let funnelSteps: string[];
  let funnelDrops: (number | null)[];

  if (workflowQ?.funnel && workflowQ.funnel.length > 0) {
    funnelSteps = workflowQ.funnel.map((step) => step.step);
    funnelDrops = workflowQ.funnel.map((step) => step.drop_pct);
  } else {
    funnelSteps = activeWorkflow.steps;
    funnelDrops = activeWorkflow.steps.map((_, i) =>
      i === 0
        ? null
        : Math.round(activeWorkflow.dropoffRate / (activeWorkflow.steps.length - 1 || 1))
    );
  }

  const screenRows =
    workflowQ?.flows && workflowQ.flows.length > 0
      ? workflowQ.flows.map((flow) => ({
          s: flow.path,
          users: flow.users,
          events: flow.events,
          sess: flow.sessions,
          comp: flow.f_comp == null ? null : Math.round(flow.f_comp)
        }))
      : [];

  const entryRows =
    workflowQ?.entry_screens && workflowQ.entry_screens.length > 0
      ? workflowQ.entry_screens.map((screen) => ({
          screen: screen.path,
          visitors: screen.visitors,
          views: screen.views,
          bounce: Math.round(screen.bounce)
        }))
      : [];

  return {
    tiles,
    funnelSteps,
    funnelDrops,
    screenRows,
    entryRows
  };
}
