import React, { useState, useEffect, useMemo, useRef } from "react";
import "./usage-dashboard.css";
import {
  SITES,
  fetchRecentActiveUsers,
  fetchTrafficSection,
  fetchAdoptionSection,
  fetchLiveWorkflow,
  fetchSitesLeague,
  siteByKey,
  EMPTY_DASHBOARD,
} from "./api";
import type { LeagueRow, LiveDashboard, LiveWorkflow, SiteKey } from "./api";

/* ================================================================
   Usage Analytics Dashboard (live data only — no sample numbers)
   ================================================================ */

/* ---------- benchmark defaults & info dict ---------- */
const BM_DEFAULTS: Record<string, number> = {
  activeUsers: 75,
  bounceRate: 18,
  engagementRate: 65,
  featureInteractionRate: 50,
  wfAdoption: 50,
  wfCompletion: 70,
  wfDropoff: 30,
  featureAdoptionRate: 60,
  repeatUsageRate: 55,
  day1Retention: 55,
  day7Retention: 35,
  day30Retention: 20,
  churnRate: 10,
  crashFreeUsers: 99,
  crashFreeSessions: 99,
  seatUtil: 85,
  stickiness: 35,
  activation14: 50,
};

const KPI_INFO: Record<string, { f: string; m: string }> = {
  "Active Users": {
    f: "Unique residents (user_id) who fired at least one event during the selected period.",
    m: "Shows the reach of the app among registered residents — pulled directly from PostHog's person-level activity.",
  },
  "Screen Views": {
    f: "Count of all View-typed screen-load events across modules (e.g. home_page_viewed, service_request_list_viewed, event_details_viewed).",
    m: "Overall screen/content consumption across the app.",
  },
  "Total Sessions": {
    f: "Count of distinct app sessions started in the period (from app_launched, the first event of every session).",
    m: "Usage volume across all resident devices.",
  },
  "Average Session Duration": {
    f: "Total session time ÷ total sessions.",
    m: "Engagement depth per visit.",
  },
  "Bounce Rate": {
    f: "% of sessions with only app_launched/home_page_viewed and no further interaction.",
    m: "Immediate exits or the app opened and left idle.",
  },
  "Recently Online": {
    f: "Distinct residents with an event in the last 30 minutes.",
    m: "A live pulse of who is currently active in the app.",
  },
  "Seat Utilisation": {
    f: "Active residents ÷ total registered residents.",
    m: "What fraction of registered residents are actively logging in and generating events.",
  },
  Stickiness: {
    f: "Daily active users (DAU) ÷ monthly active users (MAU).",
    m: "Reflects daily return habits versus casual monthly usage.",
  },
  "Adoption Trend": {
    f: "Growth in weekly active users over the past 8 weeks.",
    m: "Shows the trajectory and momentum of app adoption across residents.",
  },
  "14-Day Activation": {
    f: "% of newly registered residents who return within 14 days of registration.",
    m: "Key indicator of early onboarding success and sustained adoption.",
  },
  "Module Breadth": {
    f: "Distinct modules used at least once ÷ total enabled modules available.",
    m: "Whether residents use the full platform or only a single utility tile like Helpdesk.",
  },
  "Workflow Adoption": {
    f: "Share of active users who fired the workflow's opening event.",
    m: "How widely this specific workflow is discovered and initiated.",
  },
  "Completion Rate": {
    f: "Users who fired the terminal success event ÷ users who started.",
    m: "Conversion efficiency and lack of friction in the workflow.",
  },
  "Biggest Step Drop": {
    f: "Step transition with the largest percentage drop-off.",
    m: "The exact screen/dialog where resident abandonment is highest.",
  },
  "Usage Volume": {
    f: "Total successful completions during the selected period.",
    m: "Real operational throughput delivered by the workflow.",
  },
};

function fmtC(n: number): string {
  if (n >= 100000) return Math.round(n / 1000) + "K";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
  return String(Math.round(n));
}

function formatActivityAge(minutes: number): string {
  if (minutes < 1) return "now";
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function pct(x: number, d?: number): string {
  return x.toFixed(d == null ? 0 : d) + "%";
}

/* ---------- Workflows list (structure only — values come from live workflow_usage) ---------- */
interface WorkflowItem {
  key: string;
  name: string;
  bucket: string;
  steps: string[];
  incompleteNote?: string;
  proposed?: boolean;
}

const WORKFLOWS: WorkflowItem[] = [
  {
    key: "serviceRequestCreate",
    name: "Service Request Creation",
    bucket: "Service & Support",
    steps: [
      "service_request_create_opened",
      "service_request_category_selected",
      "service_request_subcategory_selected",
      "service_request_field_selected",
      "service_request_submit_tapped",
      "service_request_created_success",
    ],
  },
  {
    key: "visitorApproval",
    name: "Visitor Approval",
    bucket: "Service & Support",
    steps: ["push_notification_opened", "visitor_approval_answered"],
    incompleteNote:
      "This is a thin, single-decision funnel by design: visitor_approval_answered captures the in-app gate-approval decision itself (approve/reject), with press-through from a push notification as the only real predecessor event in the catalogue. The repository's legacy events (visitor_approve_success/visitor_reject_success, in the 221-event legacy family) record the same approval action under different names — see the Workflow Usage scope note below for why those are not unioned into this funnel.",
  },
  {
    key: "facilityBooking",
    name: "Facility Booking",
    bucket: "Community & Amenities",
    steps: [
      "facility_booking_opened",
      "facility_book_cta_tapped",
      "facility_booking_submit_tapped",
      "amenity_payment_mode_selected",
      "amenity_payment_gateway_opened",
      "amenity_booking_confirmed",
    ],
    incompleteNote:
      '"Amenities & Bookings" is not one of Artesia\'s 9 named Home-tab tiles in the product Read-Me, but its 8 events are real, confirmed instrumentation in the shared flutter_resident codebase, reachable if the backend enables the relevant module for a given society — same backend-driven availability caveat as every other module here.',
  },
  {
    key: "eventRsvp",
    name: "Event RSVP",
    bucket: "Community & Amenities",
    steps: [
      "event_item_tapped",
      "event_details_viewed",
      "event_rsvp_confirmed",
    ],
  },
  {
    key: "dailyHelpRegister",
    name: "Daily Help Registration",
    bucket: "Engagement & Daily Life",
    steps: [
      "daily_help_opened",
      "daily_help_create_opened",
      "daily_help_create_submitted",
    ],
  },
  {
    key: "pollVote",
    name: "Poll Voting",
    bucket: "Engagement & Daily Life",
    steps: ["poll_list_viewed", "poll_vote_submitted"],
  },
];

/* ================================================================
   SVG CHARTS ENGINE (Ported from FM Matrix v2)
   ================================================================ */

interface LineChartProps {
  cur: number[];
  prev?: number[] | null;
  labels?: string[];
  color?: string;
  fill?: string;
  prevColor?: string;
  gridColor?: string;
  faintColor?: string;
  showPrev?: boolean;
  curLabel?: string;
  prevLabel?: string;
}

function SvgLineChart({
  cur,
  prev,
  labels,
  color = "#2c7be5",
  fill = "#d3e3f9",
  prevColor = "#d9d6ce",
  gridColor = "#e6e4de",
  faintColor = "#9b9990",
  showPrev = true,
  curLabel = "Value",
  prevLabel = "Previous period",
}: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (cur.length === 0)
    return <div className="chart-empty">No live data available.</div>;

  const W = 680;
  const H = 250;
  const pl = 44;
  const pr = 14;
  const pt = 16;
  const pb = 30;

  const all = cur.concat(prev && showPrev ? prev : []);
  const mn = 0;
  const mx = Math.max(...all) * 1.14 || 1;
  const span = mx - mn || 1;
  const n = cur.length;
  const xw = (W - pl - pr) / (n - 1 || 1);

  const X = (i: number) => pl + i * xw;
  const Y = (v: number) => pt + (H - pt - pb) * (1 - (v - mn) / span);
  const base = H - pb;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || n <= 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let idx = Math.round((svgX - pl) / (xw || 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
  };

  const handlePointerLeave = () => {
    setHoverIdx(null);
  };

  const makePath = (arr: number[]) => {
    let d = "";
    for (let i = 0; i < arr.length; i++) {
      const val = typeof arr[i] === "number" && !isNaN(arr[i]) ? arr[i] : 0;
      d +=
        (i === 0 ? "M" : "L") + X(i).toFixed(1) + " " + Y(val).toFixed(1) + " ";
    }
    return d;
  };

  const step = Math.max(1, Math.ceil(n / 6));
  const gridLines: React.ReactNode[] = [];
  const xLabels: React.ReactNode[] = [];

  for (let i = 0; i < n; i += step) {
    gridLines.push(
      <line
        key={`g-${i}`}
        x1={X(i).toFixed(1)}
        y1={pt}
        x2={X(i).toFixed(1)}
        y2={base}
        stroke={gridColor}
        strokeDasharray="2 4"
      />
    );
    xLabels.push(
      <text
        key={`xl-${i}`}
        x={X(i).toFixed(1)}
        y={H - 9}
        textAnchor="middle"
        fontSize="11"
        fill={faintColor}
        fontFamily="Inter,-apple-system,Segoe UI,sans-serif"
      >
        {labels ? labels[i] : i + 1}
      </text>
    );
  }

  const yLabels: React.ReactNode[] = [];
  for (let g = 0; g <= 2; g++) {
    const y = pt + ((H - pt - pb) * g) / 2;
    const val = mn + span * (1 - g / 2);
    yLabels.push(
      <text
        key={`yl-${g}`}
        x={pl - 11}
        y={y + 4}
        textAnchor="end"
        fontSize="11"
        fill={faintColor}
        fontFamily="Inter,-apple-system,Segoe UI,sans-serif"
      >
        {fmtC(val)}
      </text>
    );
  }

  let areaD = makePath(cur);
  areaD += `L${X(n - 1).toFixed(1)} ${base} L${X(0).toFixed(1)} ${base} Z`;

  // Tooltip calculations for hovered index
  let tooltipNode: React.ReactNode = null;
  let hoverCrosshair: React.ReactNode = null;
  let hoverPoints: React.ReactNode = null;

  if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < n) {
    const hx = X(hoverIdx);
    const curVal =
      typeof cur[hoverIdx] === "number" && !isNaN(cur[hoverIdx])
        ? cur[hoverIdx]
        : 0;
    const hyCur = Y(curVal);
    const hasPrev = Boolean(
      prev &&
      showPrev &&
      prev.length === n &&
      typeof prev[hoverIdx] === "number" &&
      !isNaN(prev[hoverIdx])
    );
    const prevVal = hasPrev && prev ? prev[hoverIdx] : null;
    const hyPrev = prevVal != null ? Y(prevVal) : null;
    const pointLabel =
      labels && labels[hoverIdx] ? labels[hoverIdx] : `Point ${hoverIdx + 1}`;

    let deltaStr: string | null = null;
    let deltaColor = "var(--muted, #6f6e68)";
    if (prevVal != null && prevVal > 0) {
      const deltaPct = ((curVal - prevVal) / prevVal) * 100;
      deltaStr = `${deltaPct > 0 ? "+" : ""}${deltaPct.toFixed(1)}%`;
      deltaColor =
        deltaPct > 0
          ? "var(--pos, #0f8a3d)"
          : deltaPct < 0
            ? "var(--neg, #b3402c)"
            : "var(--muted, #6f6e68)";
    }

    hoverCrosshair = (
      <line
        x1={hx.toFixed(1)}
        y1={pt}
        x2={hx.toFixed(1)}
        y2={base}
        stroke="var(--ink, #141413)"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        strokeOpacity="0.35"
      />
    );

    hoverPoints = (
      <g style={{ pointerEvents: "none" }}>
        {hasPrev && hyPrev != null && (
          <circle
            cx={hx.toFixed(1)}
            cy={hyPrev.toFixed(1)}
            r="4.5"
            fill="var(--surface, #ffffff)"
            stroke={prevColor}
            strokeWidth="2"
            strokeDasharray="2 2"
          />
        )}
        <circle
          cx={hx.toFixed(1)}
          cy={hyCur.toFixed(1)}
          r="8"
          fill={color}
          opacity="0.22"
        />
        <circle
          cx={hx.toFixed(1)}
          cy={hyCur.toFixed(1)}
          r="4.5"
          fill="var(--surface, #ffffff)"
          stroke={color}
          strokeWidth="2.5"
        />
      </g>
    );

    const measure = (s: string, fontSize: number) => s.length * fontSize * 0.58;
    const curValStr = curVal.toLocaleString();
    const titleWidth = measure(pointLabel, 11) + 24;
    const curRowWidth =
      24 + measure(`${curLabel}:`, 11) + 12 + measure(curValStr, 11.5) + 16;
    const prevRowWidth =
      hasPrev && prevVal != null
        ? 24 +
          measure(`${prevLabel}: ${prevVal.toLocaleString()}`, 10.5) +
          (deltaStr ? measure(deltaStr, 10.5) + 14 : 0) +
          16
        : 0;
    const neededWidth = Math.max(titleWidth, curRowWidth, prevRowWidth);
    const cardW = Math.max(hasPrev ? 180 : 150, Math.min(neededWidth, W - 20));
    const cardH = hasPrev ? 74 : 50;
    let cardX = hx + 12;
    if (cardX + cardW > W - 10) {
      cardX = hx - cardW - 12;
    }
    if (cardX < 10) {
      cardX = 10;
    }
    const cardY = Math.max(
      pt + 2,
      Math.min(base - cardH - 6, hyCur - cardH / 2)
    );

    tooltipNode = (
      <g style={{ pointerEvents: "none", transition: "all 0.05s ease-out" }}>
        <rect
          x={cardX.toFixed(1)}
          y={cardY.toFixed(1)}
          width={cardW}
          height={cardH}
          rx={6}
          ry={6}
          fill="var(--surface, #ffffff)"
          stroke="var(--border, #e6e4de)"
          strokeWidth="1"
          style={{ filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.15))" }}
        />
        <text
          x={(cardX + 10).toFixed(1)}
          y={(cardY + 16).toFixed(1)}
          fontSize="11"
          fontWeight="600"
          fill="var(--ink, #141413)"
          fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
        >
          {pointLabel}
        </text>
        <circle
          cx={(cardX + 13).toFixed(1)}
          cy={(cardY + 33).toFixed(1)}
          r="3.5"
          fill={color}
        />
        <text
          x={(cardX + 22).toFixed(1)}
          y={(cardY + 36.5).toFixed(1)}
          fontSize="11"
          fill="var(--muted, #6f6e68)"
          fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
        >
          {curLabel}:
        </text>
        <text
          x={(cardX + cardW - 10).toFixed(1)}
          y={(cardY + 36.5).toFixed(1)}
          textAnchor="end"
          fontSize="11.5"
          fontWeight="600"
          fill="var(--ink, #141413)"
          fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
        >
          {curValStr}
        </text>

        {hasPrev && prevVal != null && (
          <>
            <line
              x1={(cardX + 8).toFixed(1)}
              y1={(cardY + 45).toFixed(1)}
              x2={(cardX + cardW - 8).toFixed(1)}
              y2={(cardY + 45).toFixed(1)}
              stroke="var(--border, #e6e4de)"
              strokeDasharray="2 2"
            />
            <circle
              cx={(cardX + 13).toFixed(1)}
              cy={(cardY + 58).toFixed(1)}
              r="3.5"
              fill={prevColor}
            />
            <text
              x={(cardX + 22).toFixed(1)}
              y={(cardY + 61.5).toFixed(1)}
              fontSize="10.5"
              fill="var(--muted, #6f6e68)"
              fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
            >
              {prevLabel}: {prevVal.toLocaleString()}
            </text>
            {deltaStr && (
              <text
                x={(cardX + cardW - 10).toFixed(1)}
                y={(cardY + 61.5).toFixed(1)}
                textAnchor="end"
                fontSize="10.5"
                fontWeight="600"
                fill={deltaColor}
                fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
              >
                {deltaStr}
              </text>
            )}
          </>
        )}
      </g>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ cursor: "crosshair", userSelect: "none", touchAction: "none" }}
    >
      {gridLines}
      {yLabels}
      {xLabels}
      <line x1={pl} y1={base} x2={W - pr} y2={base} stroke={gridColor} />
      <path d={areaD} fill={fill} />
      {prev && showPrev && (
        <path
          d={makePath(prev)}
          fill="none"
          stroke={prevColor}
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
      )}
      <path
        d={makePath(cur)}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {n > 0 && hoverIdx === null && (
        <circle
          cx={X(n - 1).toFixed(1)}
          cy={Y(cur[n - 1]).toFixed(1)}
          r="3"
          fill={color}
        />
      )}
      {hoverCrosshair}
      {hoverPoints}
      {tooltipNode}
    </svg>
  );
}

interface StackedBarProps {
  labels: string[];
  series: { label: string; data: number[]; color: string }[];
  negSeries?: { label: string; data: number[]; color: string };
  lineColor?: string;
  faintColor?: string;
}

function SvgStackedBarChart({
  labels,
  series,
  negSeries,
  lineColor = "#d9d6ce",
  faintColor = "#9b9990",
}: StackedBarProps) {
  if (labels.length === 0)
    return <div className="chart-empty">No live data available.</div>;

  const W = 600;
  const H = 260;
  const pl = 40;
  const pr = 12;
  const pt = 14;
  const pb = 26;
  const n = labels.length;

  const maxUp = Math.max(
    ...labels.map((_, i) => series.reduce((a, s) => a + s.data[i], 0))
  );
  const maxDn = negSeries ? Math.max(...negSeries.data) : 0;
  const gap = (W - pl - pr) / n;
  const bw = gap * 0.52;
  const zero = pt + (H - pt - pb) * (maxUp / (maxUp + maxDn || 1));
  const scaleUp = (zero - pt) / (maxUp || 1);
  const scaleDn = (H - pb - zero) / (maxDn || 1);

  const bars: React.ReactNode[] = [];
  const xLabels: React.ReactNode[] = [];

  labels.forEach((lab, i) => {
    const x = pl + i * gap + (gap - bw) / 2;
    let y = zero;
    series.forEach((s, sIdx) => {
      const h = s.data[i] * scaleUp;
      y -= h;
      bars.push(
        <rect
          key={`bar-${i}-${sIdx}`}
          x={x.toFixed(1)}
          y={y.toFixed(1)}
          width={bw.toFixed(1)}
          height={Math.max(0, h).toFixed(1)}
          fill={s.color}
        >
          <title>{`${lab} · ${s.label}: ${s.data[i].toLocaleString()}`}</title>
        </rect>
      );
    });
    if (negSeries) {
      const hd = negSeries.data[i] * scaleDn;
      bars.push(
        <rect
          key={`bar-neg-${i}`}
          x={x.toFixed(1)}
          y={zero.toFixed(1)}
          width={bw.toFixed(1)}
          height={Math.max(0, hd).toFixed(1)}
          fill={negSeries.color}
        >
          <title>{`${lab} · ${negSeries.label}: ${negSeries.data[i].toLocaleString()}`}</title>
        </rect>
      );
    }
    xLabels.push(
      <text
        key={`xlab-${i}`}
        x={x + bw / 2}
        y={H - 8}
        textAnchor="middle"
        fontSize="11"
        fill={faintColor}
        fontFamily="Inter,-apple-system,Segoe UI,sans-serif"
      >
        {lab}
      </text>
    );
  });

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`}>
      {bars}
      {xLabels}
      <line
        x1={pl}
        y1={zero.toFixed(1)}
        x2={W - pr}
        y2={zero.toFixed(1)}
        stroke={lineColor}
      />
    </svg>
  );
}

/* ================================================================
   MAIN DASHBOARD COMPONENT
   ================================================================ */

export default function UsageDashboardPage({ fixedSite }: { fixedSite?: SiteKey } = {}) {
  // Theme & rail
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("artesia-theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch { /* storage unavailable */ }
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [navCollapsed, setNavCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("artesia-nav") === "collapsed";
    } catch { /* storage unavailable */ }
    return false;
  });

  // Pages & Filter States
  const [page, setPage] = useState<"pgTraffic" | "pgAdopt" | "pgFlows">(
    "pgTraffic"
  );
  // Site ↔ static app_id: Artesia 27 · Sunteck 16 · Suncity 6 (passed in every API payload)
  const [site, setSite] = useState<SiteKey>(() => {
    if (fixedSite) return fixedSite;
    const appId = new URLSearchParams(window.location.search).get("app_id");
    return (
      SITES.find((candidate) => candidate.appId === appId)?.key ?? "artesia"
    );
  });
  // Separate per-site pages pass fixedSite — lock it so the page can never
  // switch away (no mixed data). Unlocked only on the generic route.
  const lockedSite = fixedSite !== undefined;
  useEffect(() => {
    if (fixedSite) setSite(fixedSite);
  }, [fixedSite]);
  const [dev, setDev] = useState<"all" | "ios" | "android">("all");
  const [prev, setPrev] = useState<boolean>(true);

  // Live API state — fetched layer-wise: the open sidebar layer decides
  // which endpoints fire. Merged into `live` as each layer resolves.
  const [live, setLive] = useState<LiveDashboard | null>(null);
  const [trafficLoading, setTrafficLoading] = useState<boolean>(false);
  const [adoptionLoading, setAdoptionLoading] = useState<boolean>(false);
  const [trafficSig, setTrafficSig] = useState<string | null>(null);
  const [adoptionSig, setAdoptionSig] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);
  const [wfLoading, setWfLoading] = useState<boolean>(false);
  const [recentActivity, setRecentActivity] = useState<
    Awaited<ReturnType<typeof fetchRecentActiveUsers>>["users"]
  >([]);
  const [recentActivityLoading, setRecentActivityLoading] =
    useState<boolean>(false);
  const [liveWf, setLiveWf] = useState<Record<string, LiveWorkflow | null>>({});
  const [wfError, setWfError] = useState<string | null>(null);
  const [league, setLeague] = useState<LeagueRow[] | null>(null);

  // Date Range state (defaults to a rolling last-30-days so the live API always has a valid window)
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthAgoISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }, []);

  // Date Range state
  const [range, setRange] = useState<number>(30);
  const [rangeLabel, setRangeLabel] = useState<string>("Last 30 days");
  const [dateFrom, setDateFrom] = useState<string>(monthAgoISO);
  const [dateTo, setDateTo] = useState<string>(todayISO);
  const [dateRangeOpen, setDateRangeOpen] = useState<boolean>(false);
  const [customApplied, setCustomApplied] = useState<boolean>(false);
  const dateRangeRef = useRef<HTMLDivElement>(null);

  // Usage over time tab
  const [usageTab, setUsageTab] = useState<"visitors" | "views" | "sessions">(
    "visitors"
  );

  // Workflow state
  const [activeWfKey, setActiveWfKey] = useState<string>(
    "serviceRequestCreate"
  );

  // Benchmark targets (user-editable)
  const [benchmarks, setBenchmarks] = useState<Record<string, number | null>>(
    {}
  );

  // Sync theme to root and persistence
  useEffect(() => {
    try {
      localStorage.setItem("artesia-theme", theme);
    } catch { /* storage unavailable */ }
  }, [theme]);

  // Sync nav rail persistence & keyboard shortcut
  useEffect(() => {
    try {
      localStorage.setItem("artesia-nav", navCollapsed ? "collapsed" : "open");
    } catch { /* storage unavailable */ }
  }, [navCollapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      e.preventDefault();
      setNavCollapsed((prev) => !prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close date popover on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        dateRangeRef.current &&
        !dateRangeRef.current.contains(e.target as Node)
      ) {
        setDateRangeOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Live-only dashboard: no factor-scaled mock series.
  const siteRef = siteByKey(site);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("app_id") === siteRef.appId) return;
    url.searchParams.set("app_id", siteRef.appId);
    window.history.replaceState(window.history.state, "", url);
  }, [siteRef.appId]);

  // Effective API window: preset range → rolling window ending today; custom → chosen dates.
  const effRange = useMemo(() => {
    if (customApplied && dateFrom && dateTo)
      return { from: dateFrom, to: dateTo };
    const to = todayISO;
    const d = new Date();
    d.setDate(d.getDate() - (range - 1));
    return { from: d.toISOString().slice(0, 10), to };
  }, [customApplied, dateFrom, dateTo, range, todayISO]);

  // Filter signature: identifies one unique dataset (refresh bumps retryKey).
  const sig = `${siteRef.appId}|${effRange.from}|${effRange.to}|${dev}|${retryKey}`;

  // Clear merged data when the signature changes so stale numbers never flash.
  useEffect(() => {
    setLive(null);
    setLeague(null);
    setLiveWf({});
    setWfError(null);
    setTrafficSig(null);
    setAdoptionSig(null);
  }, [sig]);

  // Traffic & Session layer — fires on landing and on filter change while open.
  useEffect(() => {
    if (page !== "pgTraffic") return;
    if (trafficSig === sig) return;
    let cancelled = false;
    setTrafficLoading(true);
    fetchTrafficSection({
      appId: siteRef.appId,
      from: effRange.from,
      to: effRange.to,
      dev,
    })
      .then((part) => {
        if (cancelled) return;
        setLive((prev) => ({ ...(prev ?? EMPTY_DASHBOARD), ...part }));
        setTrafficSig(sig);
      })
      .finally(() => {
        if (!cancelled) setTrafficLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, sig, trafficSig, siteRef.appId, effRange.from, effRange.to, dev]);

  // Adoption & Engagement layer (+ 3-site league) — fires only when opened.
  useEffect(() => {
    if (page !== "pgAdopt") return;
    if (adoptionSig === sig) return;
    let cancelled = false;
    setAdoptionLoading(true);
    const input = {
      appId: siteRef.appId,
      from: effRange.from,
      to: effRange.to,
      dev,
    };
    fetchAdoptionSection(input)
      .then((part) => {
        if (cancelled) return;
        setLive((prev) => ({ ...(prev ?? EMPTY_DASHBOARD), ...part }));
        setAdoptionSig(sig);
      })
      .finally(() => {
        if (!cancelled) setAdoptionLoading(false);
      });
    fetchSitesLeague({ from: effRange.from, to: effRange.to, dev }).then(
      (rows) => {
        if (!cancelled && rows) setLeague(rows);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [page, sig, adoptionSig, siteRef.appId, effRange.from, effRange.to, dev]);

  // Per-layer readiness for the current signature.
  const trafficReady = trafficSig === sig && live?.tiles != null;
  const adoptionReady = adoptionSig === sig;

  useEffect(() => {
    let cancelled = false;
    setRecentActivityLoading(true);
    fetchRecentActiveUsers(
      { appId: siteRef.appId, from: effRange.from, to: effRange.to },
      10
    )
      .then((response) => {
        if (!cancelled) setRecentActivity(response.users ?? []);
      })
      .catch((error) => {
        console.warn("[usage-dashboard] recent_active_users failed:", error);
        if (!cancelled) setRecentActivity([]);
      })
      .finally(() => {
        if (!cancelled) setRecentActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [siteRef.appId, effRange.from, effRange.to, retryKey]);

  const getBM = (id: string) => {
    if (id in benchmarks) return benchmarks[id];
    if (id in BM_DEFAULTS) return BM_DEFAULTS[id];
    return null;
  };

  const setBM = (id: string, val: string) => {
    const v = val.trim();
    setBenchmarks((prev) => ({
      ...prev,
      [id]: v === "" ? null : parseFloat(v),
    }));
  };

  // Color tokens for inline chart rendering based on theme
  const colors = useMemo(() => {
    if (theme === "dark") {
      return {
        ink: "#f2f0eb",
        faint: "#7b7871",
        grid: "#33302a",
        line: "#4a463d",
        blue: "#5f9df6",
        fill: "#22344b",
        mint: "#57c496",
        amber: "#dfa63e",
        red: "#e4735c",
        violet: "#9d90e8",
        violetTint: "#292440",
        green: "#4fc07f",
        greenTint: "#1a2c21",
        heatRgb: "95,157,246",
        heatA0: 0.12,
        heatA1: 0.8,
        onHeat: "#101820",
      };
    }
    return {
      ink: "#141413",
      faint: "#9b9990",
      grid: "#e6e4de",
      line: "#d9d6ce",
      blue: "#2c7be5",
      fill: "#d3e3f9",
      mint: "#3daf7d",
      amber: "#c98a12",
      red: "#b3402c",
      violet: "#7c6fd6",
      violetTint: "#e7e4f8",
      green: "#0f8a3d",
      greenTint: "#e2efe6",
      heatRgb: "44,123,229",
      heatA0: 0.09,
      heatA1: 0.78,
      onHeat: "#ffffff",
    };
  }, [theme]);

  // Derived Series for Traffic (live usage_and_distribution only — no mock data)
  const liveUsage = live?.usage ?? null;
  const usageLabels = useMemo(
    () => (liveUsage ? liveUsage.current.map((d) => d.label) : []),
    [liveUsage]
  );
  const activeUsersSeries = useMemo(
    () =>
      liveUsage && liveUsage.current.length > 0
        ? liveUsage.current.map((d) => d.visitors)
        : [],
    [liveUsage]
  );
  const prevActiveUsersSeries = useMemo(
    () => liveUsage?.previous?.map((d) => d.visitors) || [],
    [liveUsage]
  );
  const sessionsSeries = useMemo(
    () => liveUsage?.current?.map((d) => d.sessions) || [],
    [liveUsage]
  );
  const prevSessionsSeries = useMemo(
    () => liveUsage?.previous?.map((d) => d.sessions) || [],
    [liveUsage]
  );
  const viewsSeries = useMemo(
    () => liveUsage?.current?.map((d) => d.views) || [],
    [liveUsage]
  );
  const prevViewsSeries = useMemo(
    () => liveUsage?.previous?.map((d) => d.views) || [],
    [liveUsage]
  );
  const fmtDur = (sec: number) =>
    `${Math.floor(sec / 60)}m ${String(Math.round(sec % 60)).padStart(2, "0")}s`;
  const tileDelta = (...keys: string[]): number | null => {
    const d = live?.tileDeltas;
    if (!d) return null;
    for (const k of keys) {
      const v = d[k];
      if (typeof v === "number") return v;
    }
    return null;
  };
  const deltaProps = (v: number | null): { dir: "up" | "dn" | "flat"; delta: string | null } =>
    v === null
      ? { dir: "flat", delta: null }
      : { dir: v >= 0 ? "up" : "dn", delta: `${Math.abs(v).toFixed(1)}% vs prev. period` };
  const curActive = live?.tiles ? live.tiles.active : 0;
  const curSessions = live?.tiles ? live.tiles.sessions : 0;
  const views = live?.tiles ? live.tiles.views : 0;
  const viewsPerSession =
    live?.viewsPerSession != null && live.viewsPerSession >= 0
      ? live.viewsPerSession
      : views / Math.max(1, curSessions);
  const bounceRate = live?.tiles ? live.tiles.bounce : 0;
  const avgSessionStr = live?.tiles ? fmtDur(live.tiles.avgSessionSec) : "–";
  const recentlyOnline = live?.tiles ? live.tiles.online : 0;

  // Adoption Page Metrics (live data only)
  const seatUtil = live?.engagement.seatUtil ?? 0;
  const stickiness = live?.engagement.stickiness ?? 0;
  const adoptionTrend = live?.engagement.adoptionDeltaPct ?? 0;
  const activation14 =
    live?.engagement.activation14 != null
      ? Math.round(live.engagement.activation14 * 100)
      : 0;
  const usedModules =
    live?.engagement.breadthInUse != null && live.engagement.breadthInUse >= 0
      ? Math.round(live.engagement.breadthInUse)
      : 0;
  const totalModules =
    live?.engagement.breadthTotal != null && live.engagement.breadthTotal > 0
      ? Math.round(live.engagement.breadthTotal)
      : 0;

  // Workflow items
  const activeWorkflow = useMemo(
    () => WORKFLOWS.find((w) => w.key === activeWfKey) || WORKFLOWS[0],
    [activeWfKey]
  );

  // Live funnel per selected workflow — fires only when the workflow layer is open.
  // Cache is keyed by signature+module; the clear effect wipes it on filter change.
  const wfCacheKey = `${sig}|${activeWfKey}`;
  useEffect(() => {
    if (page !== "pgFlows") return;
    if (liveWf[wfCacheKey] !== undefined) return;
    let cancelled = false;
    setWfLoading(true);
    setWfError(null);
    fetchLiveWorkflow(
      { appId: siteRef.appId, from: effRange.from, to: effRange.to, dev },
      activeWfKey
    )
      .then((w) => {
        if (cancelled) return;
        setLiveWf((prev) => ({ ...prev, [wfCacheKey]: w }));
        setWfError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setLiveWf((prev) => ({ ...prev, [wfCacheKey]: null }));
        setWfError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setWfLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, sig, wfCacheKey, activeWfKey, liveWf, siteRef.appId, effRange.from, effRange.to, dev]);

  const activeLiveWf = liveWf[wfCacheKey] ?? null;
  const wfReady = activeLiveWf != null;
  const wfPending = wfLoading && !wfReady;

  // Current layer's readiness/loading for badge, refresh button and gates.
  const layerReady =
    page === "pgTraffic" ? trafficReady : page === "pgAdopt" ? adoptionReady : wfReady;
  const layerLoading =
    page === "pgTraffic" ? trafficLoading : page === "pgAdopt" ? adoptionLoading : wfPending;
  const reloading = trafficLoading || adoptionLoading || wfLoading;

  // Helpers for live-only rendering (no dummy numbers anywhere).
  const NoData = ({ label }: { label: string }) => (
    <div className="chart-empty">No live {label} data for this filter.</div>
  );
  const PageSkeleton = () => (
    <section className="section" aria-label="Loading">
      <div className="ud-skel-grid">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="ud-skel-tile" />
        ))}
      </div>
      <div className="ud-skel-card" />
      <div className="ud-skel-card" />
    </section>
  );
  const LayerError = ({ layer, detail }: { layer: string; detail?: string | null }) => (
    <section className="section">
      <div className="chart-empty">
        Couldn&apos;t load {layer} data for {siteRef.label} (app_id{" "}
        {siteRef.appId}). Check the API and retry.
        {detail ? (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>{detail}</div>
        ) : null}
        <div style={{ marginTop: 10 }}>
          <button className="ctrl" onClick={() => setRetryKey((k) => k + 1)}>
            <span className="ic">&#8634;</span> Retry
          </button>
        </div>
      </div>
    </section>
  );

  const biggestDrop = useMemo(() => {
    const lwf = liveWf[wfCacheKey] ?? null;
    if (lwf && lwf.funnel.length > 1) {
      let maxDrop = -1;
      let maxStep = lwf.funnel[1].step;
      for (let i = 1; i < lwf.funnel.length; i++) {
        const d = lwf.funnel[i].dropPct ?? 0;
        if (d > maxDrop) {
          maxDrop = d;
          maxStep = lwf.funnel[i].step;
        }
      }
      return { step: maxStep, pct: Math.round(maxDrop) };
    }
    return null;
  }, [liveWf, wfCacheKey]);

  // Download recent activity as CSV
  const downloadRecentActivity = () => {
    if (recentActivity.length === 0) return;
    const headers = ["Name", "Last Event / Path", "Time"];
    const rows = recentActivity.map((u) => [
      `"${(u.display_name ?? "").replace(/"/g, '""')}"`,
      `"${(u.path ?? u.last_event ?? "—").replace(/"/g, '""')}"`,
      u.minutes_ago != null ? `"${formatActivityAge(u.minutes_ago)}"` : '"—"',
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recent-activity-${siteRef.label.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helpers to render KPI Tiles with popovers
  const renderTile = (o: {
    id?: string;
    label: string;
    val: string;
    dir?: "up" | "dn" | "flat";
    delta?: string | null;
    sub?: string;
    raw?: number;
    unit?: string;
    goodUp?: boolean;
    noTarget?: boolean;
  }) => {
    const arrowSym = o.dir === "up" ? "▲" : o.dir === "dn" ? "▼" : "—";
    const info = KPI_INFO[o.label] || {
      f: "Definition not yet finalized for this metric.",
      m: "Business meaning to be confirmed with product team.",
    };

    return (
      <div className="tile" key={o.label}>
        <div className="tophead">
          <div className="lbl">{o.label}</div>
          <span className="info-wrap">
            <button type="button" className="info-btn">
              i
            </button>
            <div className="info-pop">
              <b>Formula</b>
              {info.f}
              <div className="sep">
                <b>Business meaning</b>
                {info.m}
              </div>
            </div>
          </span>
        </div>
        <div className="val">{o.val}</div>
        {o.delta != null && (
          <div className={`delta ${o.dir || "flat"}`}>
            {arrowSym} {o.delta}
          </div>
        )}
        {o.sub && <div className="sub2">{o.sub}</div>}
      </div>
    );
  };

  return (
    <div
      className={`artesia-dashboard ${navCollapsed ? "nav-collapsed" : ""}`}
      data-theme={theme}
    >
      {/* ============ TOPBAR ============ */}
      <header className="topbar">
        <button
          className="iconbtn nav-toggle"
          id="navToggle"
          aria-label={
            navCollapsed ? "Expand navigation" : "Collapse navigation"
          }
          title={navCollapsed ? "Expand navigation" : "Collapse navigation"}
          onClick={() => setNavCollapsed(!navCollapsed)}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" />
            <line x1="8" y1="3.5" x2="8" y2="16.5" />
          </svg>
        </button>
        <button
          className="back"
          aria-label="Back"
          onClick={() => window.history.back()}
        >
          &#8592;
        </button>
        <span className="topbar-title">{siteRef.label} Analytics</span>
        <div className="spacer" />
        <span className="rule" />
        <button
          className="iconbtn"
          id="themeBtn"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <svg
            className="i-moon"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16.5 11.8A7 7 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3Z" />
          </svg>
          <svg
            className="i-sun"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="3.6" />
            <path d="M10 1.8v1.7M10 16.5v1.7M18.2 10h-1.7M3.5 10H1.8M15.8 4.2l-1.2 1.2M5.4 14.6l-1.2 1.2M15.8 15.8l-1.2-1.2M5.4 5.4 4.2 4.2" />
          </svg>
        </button>
        <span className="badge-sample">
          {layerReady
            ? `Live · app_id ${siteRef.appId}`
            : layerLoading
              ? "Loading live data…"
              : "No live data"}
        </span>
        <div className="avatar">{siteRef.label.slice(0, 2).toUpperCase()}</div>
      </header>

      {/* ============ SHELL ============ */}
      <div className="shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h1 className="brandmark">
            <span className="bm-full">{siteRef.label}</span>
            <span className="bm-mini">
              {siteRef.label.slice(0, 2).toUpperCase()}
            </span>
          </h1>
          <p className="brandmark-sub">
            {siteRef.label} &middot; Resident Experience App
          </p>
          <nav aria-label="Sections">
            <div className="nav-group">
              <div className="nav-label">Layers</div>
              <button
                className={`nav-item ${page === "pgTraffic" ? "on" : ""}`}
                onClick={() => setPage("pgTraffic")}
                data-tip="Traffic &amp; Session"
              >
                <span className="ni-ic">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2.4 12.6 6.6 7.4l3.4 3.1 4.1-5.4 3.5 4.3" />
                    <path d="M2.4 16.4h15.2" />
                  </svg>
                </span>
                <span className="ni-t">Traffic &amp; Session</span>
              </button>
              <button
                className={`nav-item ${page === "pgAdopt" ? "on" : ""}`}
                onClick={() => setPage("pgAdopt")}
                data-tip="Adoption &amp; Engagement"
              >
                <span className="ni-ic">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="7.6" cy="6.8" r="2.9" />
                    <path d="M2.6 16.6c0-2.7 2.2-4.6 5-4.6s5 1.9 5 4.6" />
                    <path d="M13.4 4.3a2.9 2.9 0 0 1 0 5.4M14.6 12.4c1.8.5 3 1.9 3 4.2" />
                  </svg>
                </span>
                <span className="ni-t">Adoption &amp; Engagement</span>
              </button>
              <button
                className={`nav-item ${page === "pgFlows" ? "on" : ""}`}
                onClick={() => setPage("pgFlows")}
                data-tip="Workflow Usage"
              >
                <span className="ni-ic">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 2.4 17.4 6 10 9.6 2.6 6Z" />
                    <path d="M2.6 10 10 13.6 17.4 10" />
                    <path d="M2.6 14 10 17.6 17.4 14" />
                  </svg>
                </span>
                <span className="ni-t">Workflow Usage</span>
              </button>
            </div>
          </nav>
          <section
            className="sidebar-recent-activity"
            aria-label="Recent Activity"
          >
            <div className="sidebar-recent-divider" />
            <div className="sidebar-recent-heading-row">
              <h2 className="sidebar-recent-heading">Recent Activity</h2>
              <button
                className="iconbtn sidebar-recent-download"
                aria-label="Download recent activity as CSV"
                title="Download Recent Activity"
                onClick={downloadRecentActivity}
                disabled={recentActivity.length === 0}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  width="15"
                  height="15"
                >
                  <path d="M10 3v9M6.5 8.5 10 12l3.5-3.5" />
                  <path d="M3.5 14.5h13" />
                </svg>
              </button>
            </div>
            {recentActivityLoading ? (
              <div className="sidebar-recent-empty">Loading activity…</div>
            ) : recentActivity.length === 0 ? (
              <div className="sidebar-recent-empty">No recent activity.</div>
            ) : (
              <div className="sidebar-recent-list">
                {recentActivity.map((user, index) => (
                  <div
                    className="sidebar-recent-item"
                    key={user.user_id || `${user.display_name}-${index}`}
                  >
                    <span className="sidebar-recent-name">
                      {user.display_name}
                    </span>
                    <span className="sidebar-recent-meta">
                      {user.path || user.last_event || "—"}
                      {user.minutes_ago != null
                        ? ` · ${formatActivityAge(user.minutes_ago)}`
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main">
          <div className="page-head">
            <h2 id="pageTitle">
              {page === "pgTraffic"
                ? "Traffic & Session"
                : page === "pgAdopt"
                  ? "Adoption & Engagement"
                  : "Workflow Usage"}
            </h2>
            <p className="page-sub">
              <span id="custName">{siteRef.label} Resident App</span> &middot;{" "}
              <span id="scopeLabel">
                {siteRef.label} · app_id {siteRef.appId}
              </span>
            </p>
          </div>

          {/* FILTERBAR */}
          <div className="filterbar">
            {/* Date range popover */}
            <div
              className={`daterange ${dateRangeOpen ? "open" : ""}`}
              id="dateRange"
              ref={dateRangeRef}
            >
              <button
                className="ctrl"
                id="dateRangeBtn"
                onClick={() => setDateRangeOpen(!dateRangeOpen)}
              >
                <span className="ic">&#128197;</span>
                <span id="dateRangeLabel">{rangeLabel}</span>
                <span className="chev">&#9662;</span>
              </button>
              <div className="daterange-pop" id="dateRangePop">
                <div className="dr-presets">
                  {[7, 30, 90].map((d) => (
                    <button
                      key={d}
                      className={`dr-preset ${range === d && !customApplied ? "on" : ""}`}
                      onClick={() => {
                        setRange(d);
                        setRangeLabel(`Last ${d} days`);
                        setCustomApplied(false);
                        setDateRangeOpen(false);
                      }}
                    >
                      Last {d} days
                    </button>
                  ))}
                </div>
                <div className="dr-custom">
                  <div className="dr-custom-label">Custom range</div>
                  <div className="dr-custom-row">
                    <input
                      type="date"
                      id="dateFrom"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <span className="dr-to">&ndash;</span>
                    <input
                      type="date"
                      id="dateTo"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                  <button
                    className={`dr-apply ${customApplied ? "applied" : ""}`}
                    id="dateApplyBtn"
                    onClick={() => {
                      if (!dateFrom || !dateTo) return;
                      const days = Math.max(
                        1,
                        Math.round(
                          (new Date(dateTo).getTime() -
                            new Date(dateFrom).getTime()) /
                            86400000
                        ) + 1
                      );
                      const fmt = (d: string) =>
                        new Date(d).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      setRange(days);
                      setRangeLabel(`${fmt(dateFrom)} – ${fmt(dateTo)}`);
                      setCustomApplied(true);
                      setDateRangeOpen(false);
                    }}
                  >
                    {customApplied ? "Range applied ✓" : "Apply custom range"}
                  </button>
                </div>
              </div>
            </div>

            {/* Site select (static app_id per site) — locked pages show a static pill */}
            {lockedSite ? (
              <span className="ctrl" title={`app_id ${siteByKey(site).appId}`}>
                <span className="ic">&#127959;</span>
                {siteByKey(site).label}
              </span>
            ) : (
              <label className="ctrl">
                <span className="ic">&#127959;</span>
                <select
                  id="projectSel"
                  value={site}
                  onChange={(e) => setSite(e.target.value as SiteKey)}
                >
                  {SITES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="chev">&#9662;</span>
              </label>
            )}

            {/* Platform toggle */}
            <div className="devtoggle" id="devToggle" title="Platform">
              <button
                className={dev === "all" ? "on" : ""}
                onClick={() => setDev("all")}
              >
                All
              </button>
              <button
                className={dev === "ios" ? "on" : ""}
                onClick={() => setDev("ios")}
                title="iOS only"
              >
                iOS
              </button>
              <button
                className={dev === "android" ? "on" : ""}
                onClick={() => setDev("android")}
                title="Android only"
              >
                Android
              </button>
            </div>

            {/* Site toggle — hidden on locked per-site pages (no mixed data) */}
            {!lockedSite && (
              <div
                className="devtoggle"
                id="scopeToggle"
                title="Site (static app_id per site)"
              >
                {SITES.map((s) => (
                  <button
                    key={s.key}
                    className={site === s.key ? "on" : ""}
                    onClick={() => setSite(s.key)}
                    title={`${s.label} — app_id ${s.appId}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Previous period toggle */}
            <label
              className={`ctrl ${prev ? "toggle-on" : ""}`}
              id="prevBtn"
              onClick={() => setPrev(!prev)}
            >
              <span className="ic">&#8634;</span> Previous period{" "}
              {prev ? "✓" : ""}
            </label>

            {/* Refresh current layer only (re-queries its APIs, no page reload) */}
            <button
              className="ctrl"
              id="refreshBtn"
              title="Refresh this layer's data"
              disabled={reloading}
              onClick={() => {
                setRetryKey((k) => k + 1);
              }}
              style={reloading ? { opacity: 0.6, cursor: "wait" } : undefined}
            >
              <span className={`ic ${reloading ? "ud-spin" : ""}`}>&#8635;</span>{" "}
              {reloading ? "Refreshing…" : "Refresh"}
            </button>

            <div className="spacer" />
            <span className="pill">
              <span className="dot" />
              <span id="liveCount">
                {recentlyOnline.toLocaleString()} recently online
              </span>
            </span>
          </div>

          {/* ================================================================
              PAGE 1: TRAFFIC & SESSION
              Layer-gated: only this layer's endpoints fire while open.
              ================================================================ */}
          {page === "pgTraffic" && (trafficReady ? (
            <section className="section" id="pgTraffic">
              <div className="section-head">
                <div className="eyebrow-sec" />
                <h2>Traffic &amp; Session</h2>
                <span className="sd">
                  Monitor overall application traffic, resident activity, and
                  session behavior.
                </span>
              </div>

              <div className="qbox">
                <b>Key questions</b>
                <ul>
                  <li>
                    How many residents are actively using the app, and how
                    frequently?
                  </li>
                  <li>
                    Which societies/phases generate the highest traffic, and are
                    residents staying active day over day?
                  </li>
                </ul>
              </div>

              <div
                className="tiles"
                style={{ gridTemplateColumns: "repeat(3,1fr)" }}
                id="tilesTraffic"
              >
                {renderTile({
                  id: "activeUsers",
                  label: "Active Users",
                  val: curActive.toLocaleString(),
                  ...deltaProps(tileDelta("active_users", "activeUsers", "active")),
                  sub: "unique residents this period",
                  raw: curActive,
                  unit: "K",
                  goodUp: true,
                })}
                {renderTile({
                  id: "screenViews",
                  label: "Screen Views",
                  val: fmtC(views),
                  ...deltaProps(tileDelta("screen_views", "screenViews", "views")),
                  sub: "total across modules",
                  raw: views,
                  noTarget: true,
                })}
                {renderTile({
                  id: "totalSessions",
                  label: "Sessions",
                  val: curSessions.toLocaleString(),
                  ...deltaProps(tileDelta("sessions", "totalSessions")),
                  sub: "app sessions started",
                  raw: curSessions,
                  noTarget: true,
                })}
                {renderTile({
                  id: "avgSessionDur",
                  label: "Session Duration",
                  val: avgSessionStr,
                  ...deltaProps(tileDelta("avg_session_seconds", "avgSession", "avg_session")),
                  sub: "per session",
                  raw: live?.tiles ? live.tiles.avgSessionSec / 60 : 0,
                  noTarget: true,
                })}
                {renderTile({
                  id: "bounceRate",
                  label: "Bounce Rate",
                  val: `${Math.round(bounceRate)}%`,
                  ...deltaProps(tileDelta("bounce_rate", "bounceRate", "bounce")),
                  sub: "lower is better",
                  raw: bounceRate,
                  unit: "%",
                  goodUp: false,
                })}
                {renderTile({
                  id: "recentlyOnline",
                  label: "Recently Online",
                  val: recentlyOnline.toLocaleString(),
                  dir: "flat",
                  delta: null,
                  sub: "active in last 30 min",
                  noTarget: true,
                })}
              </div>

              <div className="grid2">
                {/* Usage over time card */}
                <div className="card" id="card-trafficActive">
                  <div className="card-head">
                    <div className="charthead">
                      <div>
                        <div className="cr">Usage over time · SVG chart</div>
                        <div className="ct">Usage over time</div>
                      </div>
                      <span className="info-wrap">
                        <button type="button" className="info-btn">
                          i
                        </button>
                        <div className="info-pop">
                          <b>Purpose</b>
                          Visitors, screen views, and sessions over time, across
                          all projects, with the previous period overlaid for
                          comparison.
                        </div>
                      </span>
                    </div>
                  </div>
                  <div className="card-body" id="body-trafActive">
                    <div
                      className="charttabs"
                      id="usageTabs"
                      style={{ marginBottom: 10 }}
                    >
                      <button
                        className={usageTab === "visitors" ? "on" : ""}
                        onClick={() => setUsageTab("visitors")}
                      >
                        Visitors
                      </button>
                      <button
                        className={usageTab === "views" ? "on" : ""}
                        onClick={() => setUsageTab("views")}
                      >
                        Views
                      </button>
                      <button
                        className={usageTab === "sessions" ? "on" : ""}
                        onClick={() => setUsageTab("sessions")}
                      >
                        Sessions
                      </button>
                    </div>

                    <div id="usageChartBody">
                      {(() => {
                        const curSeries =
                          usageTab === "visitors"
                            ? activeUsersSeries
                            : usageTab === "views"
                              ? viewsSeries
                              : sessionsSeries;
                        if (curSeries.length === 0) {
                          return <NoData label="usage trend" />;
                        }
                        const prevCurSeries = prev
                          ? usageTab === "visitors"
                            ? prevActiveUsersSeries
                            : usageTab === "views"
                              ? prevViewsSeries
                              : prevSessionsSeries
                          : null;
                        const curTabLabel =
                          usageTab === "visitors"
                            ? "Visitors"
                            : usageTab === "views"
                              ? "Views"
                              : "Sessions";
                        const curColor =
                          usageTab === "visitors"
                            ? colors.blue
                            : usageTab === "views"
                              ? colors.violet
                              : colors.green;
                        const curFill =
                          usageTab === "visitors"
                            ? colors.fill
                            : usageTab === "views"
                              ? colors.violetTint
                              : colors.greenTint;

                        return (
                          <>
                            <SvgLineChart
                              cur={curSeries}
                              prev={prevCurSeries}
                              labels={usageLabels}
                              color={curColor}
                              fill={curFill}
                              prevColor={colors.line}
                              gridColor={colors.grid}
                              faintColor={colors.faint}
                              showPrev={prev}
                              curLabel={curTabLabel}
                              prevLabel="Previous period"
                            />
                            <div className="legend">
                              <span>
                                <i style={{ background: curColor }} />{" "}
                                {curTabLabel}
                              </span>
                              {prev && (
                                <span>
                                  <i className="dash" /> Previous period
                                </span>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Device / platform split card */}
                <div className="card" id="card-deviceSplit">
                  <div className="card-head">
                    <div className="charthead">
                      <div>
                        <div className="cr">Device / platform split</div>
                        <div className="ct">iOS vs Android usage</div>
                      </div>
                      <span className="info-wrap">
                        <button type="button" className="info-btn">
                          i
                        </button>
                        <div className="info-pop">
                          <b>Purpose</b>
                          Share of active residents by platform — Artesia is
                          mobile-only (Flutter), so this shows where release
                          testing and support effort should concentrate.
                        </div>
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    {(() => {
                      if (!live?.deviceShares) {
                        return (
                          <div className="chart-empty">
                            No live device data available.
                          </div>
                        );
                      }
                      const ds = live.deviceShares.ios;
                      const iosShare =
                        dev === "android" ? 0 : dev === "ios" ? 1 : ds;
                      const andShare =
                        dev === "ios" ? 0 : dev === "android" ? 1 : 1 - ds;
                      const rows = [
                        { name: "iOS", share: iosShare, color: colors.violet },
                        {
                          name: "Android",
                          share: andShare,
                          color: colors.green,
                        },
                      ];
                      return (
                        <>
                          <div className="hbars">
                            {rows.map((r) => (
                              <div
                                className="role"
                                key={r.name}
                                title={`${r.name}: ${pct(r.share * 100)}`}
                              >
                                <div className="rn">{r.name}</div>
                                <div className="rbar">
                                  <i
                                    style={{
                                      width: `${Math.round(r.share * 100)}%`,
                                      background: r.color,
                                    }}
                                  />
                                </div>
                                <div className="rv">{pct(r.share * 100)}</div>
                              </div>
                            ))}
                          </div>
                          <div className="kv" style={{ marginTop: 14 }}>
                            <div>
                              <div className="k">Views / session</div>
                              <div className="v" style={{ fontSize: 18 }}>
                                {viewsPerSession.toFixed(1)}
                              </div>
                              <div className="u">screens per visit</div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </section>
          ) : trafficLoading ? (
            <PageSkeleton />
          ) : (
            <LayerError layer="Traffic & Session" />
          ))}

          {/* ================================================================
              PAGE 2: ADOPTION & ENGAGEMENT
              Layer-gated: adoption endpoints fire only while open.
              ================================================================ */}
          {page === "pgAdopt" && (adoptionReady ? (
            <section className="section" id="pgAdopt">
              <div className="section-head">
                <h2>Adoption &amp; Engagement</h2>
                <span className="sd">
                  Measure how effectively residents adopt and engage with the
                  app’s major modules, and whether they keep coming back.
                </span>
              </div>

              <div className="qbox">
                <b>Key questions</b>
                <ul>
                  <li>
                    Which modules and resident actions receive the highest
                    engagement and adoption?
                  </li>
                  <li>
                    Which modules need UX improvements, and where do residents
                    spend the most time?
                  </li>
                  <li>
                    Are residents returning to the application, and is retention
                    improving over time?
                  </li>
                </ul>
              </div>

              <div
                className="tiles"
                style={{ gridTemplateColumns: "repeat(4,1fr)", marginTop: 16 }}
                id="tilesAdoption"
              >
                {renderTile({
                  id: "stickiness",
                  label: "Stickiness",
                  val: live?.engagement.stickiness != null ? pct(stickiness * 100) : "–",
                  ...deltaProps(live?.engagement.adoptionDeltaPct ?? null),
                  sub: "avg DAU/MAU",
                  raw: stickiness * 100,
                  unit: "%",
                  goodUp: true,
                })}
                {renderTile({
                  id: "adoptionTrend",
                  label: "Adoption Trend",
                  val: live?.engagement.adoptionDeltaPct != null ? `+${adoptionTrend}%` : "–",
                  ...deltaProps(null),
                  sub: "weekly active users",
                  noTarget: true,
                })}
                {renderTile({
                  id: "activation14",
                  label: "14-Day Activation",
                  val: live?.engagement.activation14 != null ? `${activation14}%` : "–",
                  dir: "up",
                  delta: null,
                  sub: "of new registrations",
                  raw: activation14,
                  unit: "%",
                  goodUp: true,
                })}
                {renderTile({
                  id: "moduleBreadth2",
                  label: "Module Breadth",
                  val: totalModules > 0 ? `${usedModules} / ${totalModules}` : "–",
                  dir: "flat",
                  delta: null,
                  sub: "modules used this period",
                  noTarget: true,
                })}
              </div>

              {/* Adoption trend card */}
              <div
                className="card"
                style={{ marginTop: 12 }}
                id="card-adoptionTrend"
              >
                <div className="card-head">
                  <div className="charthead">
                    <div>
                      <div className="cr">Trend · SVG line chart</div>
                      <div className="ct">
                        Adoption trend (weekly active users, last 8 weeks)
                      </div>
                    </div>
                    <span className="info-wrap">
                      <button type="button" className="info-btn">
                        i
                      </button>
                      <div className="info-pop">
                        <b>Purpose</b>
                        Weekly active users over the last 8 weeks — the trend
                        line behind the Adoption Trend tile above.
                      </div>
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  {(() => {
                    if (!live?.adoptionWeekly || live.adoptionWeekly.cur.length === 0) {
                      return <NoData label="adoption trend" />;
                    }
                    const weeks = live.adoptionWeekly.labels;
                    const series = live.adoptionWeekly.cur;
                    return (
                      <>
                        <SvgLineChart
                          cur={series}
                          labels={weeks}
                          color={colors.blue}
                          fill={colors.fill}
                          prevColor={colors.line}
                          gridColor={colors.grid}
                          faintColor={colors.faint}
                          showPrev={false}
                          curLabel="Weekly active users"
                        />
                        <div className="legend">
                          <span>
                            <i style={{ background: colors.blue }} /> Weekly
                            active users
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Grid 2: Growth accounting & Retention Cohort */}
              <div className="grid2">
                <div className="card" id="card-growthAccounting">
                  <div className="card-head">
                    <div className="charthead">
                      <div>
                        <div className="cr">
                          Growth accounting · Last 6 weeks
                        </div>
                        <div className="ct">
                          New · Returning · Resurrecting · Dormant
                        </div>
                      </div>
                      <span className="info-wrap">
                        <button type="button" className="info-btn">
                          i
                        </button>
                        <div className="info-pop">
                          <b>Purpose</b>
                          Breaks the active base into new signups, retained
                          users, win-backs and users going quiet — a fuller view
                          than a simple new-vs-returning split.
                        </div>
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    {(() => {
                      const g = live?.growth;
                      if (!g || g.labels.length === 0) {
                        return (
                          <div className="chart-empty">
                            No live growth data available.
                          </div>
                        );
                      }
                      return (
                        <>
                          <SvgStackedBarChart
                            labels={g.labels}
                            series={[
                              { label: "New", data: g.nw, color: colors.blue },
                              {
                                label: "Returning",
                                data: g.ret,
                                color: colors.green,
                              },
                              {
                                label: "Resurrecting",
                                data: g.res,
                                color: colors.mint,
                              },
                            ]}
                            negSeries={{
                              label: "Dormant",
                              data: g.dorm,
                              color: colors.red,
                            }}
                            lineColor={colors.line}
                            faintColor={colors.faint}
                          />
                          <div className="legend">
                            <span>
                              <i style={{ background: colors.blue }} /> New
                            </span>
                            <span>
                              <i style={{ background: colors.green }} />{" "}
                              Returning
                            </span>
                            <span>
                              <i style={{ background: colors.mint }} />{" "}
                              Resurrecting
                            </span>
                            <span>
                              <i style={{ background: colors.red }} /> Dormant
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Retention cohort card */}
                <div className="card" id="card-retentionCohort">
                  <div className="card-head">
                    <div className="charthead">
                      <div>
                        <div className="cr">Retention · weekly cohorts</div>
                        <div className="ct">Do new users keep coming back?</div>
                      </div>
                      <span className="info-wrap">
                        <button type="button" className="info-btn">
                          i
                        </button>
                        <div className="info-pop">
                          <b>Purpose</b>
                          Each row = residents first active that week; cells = %
                          of that cohort still active N weeks later.
                        </div>
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    {(() => {
                      const cols = 6;
                      type Cell = { kind: "v"; val: number } | { kind: "na" };
                      const rows =
                        live?.cohorts && live.cohorts.length > 0
                          ? live.cohorts.map((c, i, arr) => ({
                              label: c.label || `C${i + 1}`,
                              cells: Array.from({ length: cols }).map(
                                (_, w): Cell => {
                                  // triangular display like the mock (recent cohorts lack later weeks)
                                  if (w > cols - 1 - (arr.length - 1 - i))
                                    return { kind: "na" };
                                  const v = c.values[w];
                                  return v === null || v === undefined
                                    ? { kind: "na" }
                                    : { kind: "v", val: v };
                                }
                              ),
                            }))
                          : [];
                      if (rows.length === 0) {
                        return (
                          <div className="chart-empty">
                            No live retention data available.
                          </div>
                        );
                      }
                      return (
                        <table className="rt">
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left" }}>Cohort</th>
                              {Array.from({ length: cols }).map((_, w) => (
                                <th key={w}>Week {w}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => (
                              <tr key={row.label}>
                                <td className="lbl">{row.label}</td>
                                {row.cells.map((c, w) => {
                                  if (c.kind === "na") {
                                    return (
                                      <td
                                        key={w}
                                        style={{
                                          background: "var(--surface-2)",
                                          color: "var(--faint)",
                                        }}
                                      >
                                        &middot;
                                      </td>
                                    );
                                  }
                                  const t = c.val / 100;
                                  const bg = `rgba(${colors.heatRgb}, ${(colors.heatA0 + t * colors.heatA1).toFixed(2)})`;
                                  const col =
                                    t > 0.55 ? colors.onHeat : "var(--ink)";
                                  return (
                                    <td
                                      key={w}
                                      title={`${row.label} · Week ${w}: ${c.val}%`}
                                      style={{ background: bg, color: col }}
                                    >
                                      {c.val}%
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Grid 2: Adoption by area & Dormant users */}
              <div className="grid2">
                <div className="card" id="card-roleSplit">
                  <div className="card-head">
                    <div className="charthead">
                      <div>
                        <div className="cr">Adoption by area</div>
                        <div className="ct">
                          Who is (and isn&#39;t) using the app
                        </div>
                      </div>
                      <span className="info-wrap">
                        <button type="button" className="info-btn">
                          i
                        </button>
                        <div className="info-pop">
                          <b>Purpose</b>
                          Active users ÷ registered users, split by which
                          top-level tab a resident&#39;s events fall under (home
                          vs. building) — shows whether adoption is concentrated
                          on the Home tab&#39;s day-to-day tiles (Helpdesk,
                          Visitors, Bill Payment) or also reaching the Building
                          tab&#39;s community features (Events, Notice, Polls,
                          Gallery).
                        </div>
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    {(() => {
                      const palette = [
                        colors.blue,
                        colors.violet,
                        colors.mint,
                        colors.green,
                      ];
                      const roles =
                        live?.roles && live.roles.length > 0
                          ? live.roles.slice(0, 4).map((r, i) => ({
                              label: r.label,
                              share: r.sharePct / 100,
                              color: palette[i % palette.length],
                            }))
                          : [];
                      if (roles.length === 0) {
                        return (
                          <div className="chart-empty">
                            No live role data available.
                          </div>
                        );
                      }
                      return (
                        <div className="hbars">
                          {roles.map((r) => (
                            <div
                              className="role"
                              key={r.label}
                              title={`${r.label}: ${pct(r.share * 100)}`}
                            >
                              <div className="rn">{r.label}</div>
                              <div className="rbar">
                                <i
                                  style={{
                                    width: `${Math.round(r.share * 100)}%`,
                                    background: r.color,
                                  }}
                                />
                              </div>
                              <div className="rv">{pct(r.share * 100)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Dormant users card */}
                <div className="card" id="card-dormant">
                  <div className="card-head">
                    <div className="charthead">
                      <div>
                        <div className="cr">Dormant users</div>
                        <div className="ct">Dormant users</div>
                      </div>
                      <span className="info-wrap">
                        <button type="button" className="info-btn">
                          i
                        </button>
                        <div className="info-pop">
                          <b>Purpose</b>
                          Registered residents with no activity in the last 14
                          days — out of scope for the 14-Day Activation tile
                          above.
                        </div>
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    {(() => {
                      if (
                        live?.engagement.dormant == null ||
                        live.engagement.dormant < 0
                      ) {
                        return <NoData label="dormant-user" />;
                      }
                      const dormantCount = Math.round(live.engagement.dormant);
                      return (
                        <div className="kv">
                          <div>
                            <div className="k">Dormant residents</div>
                            <div className="v" style={{ fontSize: 22 }}>
                              {dormantCount.toLocaleString()}
                            </div>
                            <div className="u">no activity 14+ days</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>


              {/* Site-wise breakdown card */}
              <div
                className="card"
                style={{ marginTop: 12 }}
                id="card-siteWise"
              >
                <div className="card-head">
                  <div className="charthead">
                    <div>
                      <div className="cr">League table</div>
                      <div className="ct">Site-wise breakdown</div>
                    </div>
                    <span className="info-wrap">
                      <button type="button" className="info-btn">
                        i
                      </button>
                      <div className="info-pop">
                        <b>Purpose</b>
                        Active residents, sessions and bounce rate per
                        phase/tower, worst-trending first.
                      </div>
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  {(() => {
                    // Live only: one traffic_session per static app_id (Artesia 27 · Sunteck 16 · Suncity 6).
                    if (!league || league.length === 0) {
                      return <NoData label="site league" />;
                    }
                    const rows = league
                      .map((l) => ({
                        p: l.site,
                        act: l.active,
                        sess: l.sessions,
                        avgSess: `${l.avgMin.toFixed(1)}m`,
                        bnc: Math.round(l.bounce),
                        tr: "flat" as const,
                      }))
                      .sort((a, b) => b.act - a.act);

                    return (
                      <table className="league">
                        <thead>
                          <tr>
                            <th>Site</th>
                            <th className="num">Active users</th>
                            <th className="num">Sessions</th>
                            <th className="num">Avg session</th>
                            <th className="num">Bounce</th>
                            <th>Trend</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => {
                            const st =
                              row.bnc >= 22
                                ? ["st-drop", "Watch"]
                                : row.bnc >= 16
                                  ? ["st-watch", "Steady"]
                                  : ["st-healthy", "Healthy"];
                            return (
                              <tr key={row.p}>
                                <td className="strong">{row.p}</td>
                                <td className="num">
                                  {row.act.toLocaleString()}
                                </td>
                                <td className="num">
                                  {row.sess.toLocaleString()}
                                </td>
                                <td className="num">{row.avgSess}</td>
                                <td className="num">{row.bnc}%</td>
                                <td>
                                  <span className={`arrow ${row.tr}`}>
                                    {row.tr === "up"
                                      ? "↗"
                                      : row.tr === "dn"
                                        ? "↘"
                                        : "→"}
                                  </span>
                                </td>
                                <td>
                                  <span className={`status ${st[0]}`}>
                                    {st[1]}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            </section>
          ) : adoptionLoading ? (
            <PageSkeleton />
          ) : (
            <LayerError layer="Adoption & Engagement" />
          ))}

          {/* ================================================================
              PAGE 3: WORKFLOW USAGE
              Layer-gated: workflow_usage fires only while open, per module.
              ================================================================ */}
          {page === "pgFlows" && (wfReady ? (
            <section className="section" id="pgFlows">
              <div className="section-head">
                <h2>Workflow Usage</h2>
                <span className="sd">
                  Resident completion of key workflows per module, all-modules
                  comparison, and where residents navigate &amp; exit.
                </span>
              </div>

              {/* Module Nav (Buckets & modules) */}
              <div
                className="mnav"
                id="modNav"
                title="Choose a module — this filter applies to the per-module cards only"
              >
                {(() => {
                  const buckets = Array.from(
                    new Set(WORKFLOWS.map((w) => w.bucket))
                  );
                  const curBucket = activeWorkflow.bucket;
                  const modsInBucket = WORKFLOWS.filter(
                    (w) => w.bucket === curBucket
                  );

                  return (
                    <>
                      <div className="mnav-buckets">
                        {buckets.map((b) => (
                          <button
                            key={b}
                            className={b === curBucket ? "on" : ""}
                            onClick={() => {
                              const first = WORKFLOWS.find(
                                (w) => w.bucket === b
                              );
                              if (first) setActiveWfKey(first.key);
                            }}
                          >
                            {b}
                            <span className="mcount">
                              {WORKFLOWS.filter((w) => w.bucket === b).length}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="mnav-mods">
                        <div className="segbar">
                          {modsInBucket.map((w) => (
                            <button
                              key={w.key}
                              className={w.key === activeWfKey ? "on" : ""}
                              onClick={() => setActiveWfKey(w.key)}
                            >
                              {w.name}
                              {w.proposed && (
                                <span
                                  style={{ opacity: 0.6, fontStyle: "italic" }}
                                >
                                  {" "}
                                  (proposed)
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Workflow KPI tiles */}
              <div
                className="tiles"
                style={{ gridTemplateColumns: "repeat(4,1fr)" }}
                id="wfKpis"
              >
                {renderTile({
                  id: "wfAdoption",
                  label: "Workflow Adoption",
                  val:
                    activeLiveWf?.adoptionPct != null
                      ? `${Math.round(activeLiveWf.adoptionPct)}%`
                      : "–",
                  dir: "flat",
                  delta: null,
                  sub: "started this workflow",
                  noTarget: true,
                })}
                {renderTile({
                  id: "wfCompletion",
                  label: "Completion Rate",
                  val:
                    activeLiveWf?.completionPct != null
                      ? `${Math.round(activeLiveWf.completionPct)}%`
                      : "–",
                  dir: "flat",
                  delta: null,
                  sub: "reached success step",
                  noTarget: true,
                })}
                {renderTile({
                  label: "Biggest Step Drop",
                  val: biggestDrop ? `${biggestDrop.pct}%` : "–",
                  dir: "dn",
                  delta: biggestDrop ? biggestDrop.step : null,
                  sub: biggestDrop ? `at ${biggestDrop.step}` : "no live funnel",
                  noTarget: true,
                })}
                {renderTile({
                  label: "Usage Volume",
                  val:
                    activeLiveWf && activeLiveWf.funnel.length > 0
                      ? activeLiveWf.funnel[
                          activeLiveWf.funnel.length - 1
                        ].reach.toLocaleString()
                      : "–",
                  dir: "flat",
                  delta: null,
                  sub: "completions",
                  noTarget: true,
                })}
              </div>

              {/* Scope & Legacy notes */}
              <div id="wfScopeNote" style={{ marginTop: 14 }}>
                {activeWorkflow.incompleteNote && (
                  <div className="bmnote crashnote">
                    <span>&#9888;</span>
                    <div>
                      <b>Scope note.</b> {activeWorkflow.incompleteNote}
                    </div>
                  </div>
                )}
                <div className="bmnote">
                  <span>&#8505;</span>
                  <div>
                    <b>Legacy events, not unioned here.</b> The 221-event legacy
                    Google-Analytics family
                    (Artesia_PostHog_Events_Catalogue.xlsx,
                    &quot;3_Legacy_GA_Events&quot;) mirrors into PostHog from
                    the same call sites under different, less-certain names
                    (almost all &quot;derived from name&quot; rather than an
                    authored code comment). This dashboard is built entirely
                    from the 157 modern events; the legacy family is disclosed
                    in the companion instrumentation reference but not wired
                    into this or any other chart.
                  </div>
                </div>
              </div>

              {/* Workflow Funnel Card */}
              <div
                className="card"
                style={{ margin: "16px 0" }}
                id="card-wfFunnel"
              >
                <div className="card-head">
                  <div className="charthead">
                    <div>
                      <div className="cr">
                        Workflow funnel (real event sequence)
                      </div>
                      <div className="ct">
                        {activeWorkflow.name} — completion funnel
                      </div>
                    </div>
                    <span className="info-wrap">
                      <button type="button" className="info-btn">
                        i
                      </button>
                      <div className="info-pop">
                        <b>Purpose</b>
                        Shows step-by-step completion and drop-off for the
                        selected workflow, using the real PostHog event names in
                        sequence.
                      </div>
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  {(() => {
                    // Live funnel from workflow_usage (reach per step); mock decay fallback.
                    if (activeLiveWf && activeLiveWf.funnel.length > 0) {
                      const maxReach = Math.max(
                        1,
                        ...activeLiveWf.funnel.map((f) => f.reach)
                      );
                      const start = activeLiveWf.funnel[0].reach || 1;
                      return (
                        <div className="funnel">
                          {activeLiveWf.funnel.map((f, i) => {
                            const pct2 = Math.round((f.reach / start) * 100);
                            const width = 45 + (pct2 / 100) * 55;
                            return (
                              <React.Fragment key={f.step}>
                                {i > 0 && f.dropPct !== null && (
                                  <div className="fdrop">
                                    ▼ {f.dropPct}% drop-off
                                  </div>
                                )}
                                <div
                                  className="fstep"
                                  style={{
                                    width: `${width}%`,
                                    background: colors.blue,
                                    opacity: 1 - i * 0.1,
                                    borderRadius: 8,
                                  }}
                                  title={`${f.step}: ${f.reach.toLocaleString()} users (${pct2}% of entrants)`}
                                >
                                  {f.step}
                                  <span className="fsub">
                                    {f.reach.toLocaleString()} users · {pct2}%
                                    of entrants
                                  </span>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <div className="chart-empty">
                        No live workflow data available.
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* All screens in this module */}
              <div
                className="card"
                style={{ marginTop: 12 }}
                id="card-allScreens"
              >
                <div className="card-head">
                  <div className="charthead">
                    <div>
                      <div className="cr">All screens in this module</div>
                      <div className="ct">All screens in this module</div>
                    </div>
                    <span className="info-wrap">
                      <button type="button" className="info-btn">
                        i
                      </button>
                      <div className="info-pop">
                        <b>Purpose</b>
                        Every screen path inside {activeWorkflow.name}, with
                        users, events, sessions and completion rate for each —
                        the module-scoped equivalent of the funnel above, at the
                        individual-screen level.
                      </div>
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  {(() => {
                    if (activeLiveWf && activeLiveWf.flows.length > 0) {
                      return (
                        <table className="pathtbl">
                          <thead>
                            <tr>
                              <th>Screen</th>
                              <th className="num">Users</th>
                              <th className="num">Events</th>
                              <th className="num">Sessions</th>
                              <th className="num">Completion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeLiveWf.flows.map((r) => (
                              <tr key={r.path}>
                                <td>{r.path}</td>
                                <td className="num">
                                  {r.users.toLocaleString()}
                                </td>
                                <td className="num">
                                  {r.events.toLocaleString()}
                                </td>
                                <td className="num">
                                  {r.sessions.toLocaleString()}
                                </td>
                                <td className="num">
                                  {r.comp === null
                                    ? "–"
                                    : `${Math.round(r.comp)}%`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    }
                    return (
                      <div className="chart-empty">
                        No live workflow screen data available.
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Top entry screens */}
              <div
                className="card"
                style={{ marginTop: 12 }}
                id="card-entryScreens"
              >
                <div className="card-head">
                  <div className="charthead">
                    <div>
                      <div className="cr">Top entry screens</div>
                      <div className="ct">Top entry screens</div>
                    </div>
                    <span className="info-wrap">
                      <button type="button" className="info-btn">
                        i
                      </button>
                      <div className="info-pop">
                        <b>Purpose</b>
                        The first screen property seen in each session — usually
                        reached via push notification, deep link, or the app
                        icon.
                      </div>
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  {(() => {
                    const liveRows =
                      activeLiveWf && activeLiveWf.entry.length > 0
                        ? activeLiveWf.entry.map((e) => ({
                            screen: e.screen,
                            visitors: e.visitors,
                            views: e.views,
                            bounce: `${Math.round(e.bounce)}%`,
                          }))
                        : null;
                    if (liveRows) {
                      return (
                        <table className="pathtbl">
                          <thead>
                            <tr>
                              <th>Screen</th>
                              <th className="num">Visitors</th>
                              <th className="num">Views</th>
                              <th className="num">Bounce</th>
                            </tr>
                          </thead>
                          <tbody>
                            {liveRows.map((r) => (
                              <tr key={r.screen}>
                                <td>{r.screen}</td>
                                <td className="num">
                                  {r.visitors.toLocaleString()}
                                </td>
                                <td className="num">
                                  {r.views.toLocaleString()}
                                </td>
                                <td className="num">{r.bounce}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    }
                    return (
                      <div className="chart-empty">
                        No live entry-screen data available.
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>
          ) : wfPending ? (
            <PageSkeleton />
          ) : (
            <LayerError layer="Workflow Usage" detail={wfError} />
          ))}

          {/* ============ FOOTER ============ */}
          <div className="footer">
            <b>Data note.</b> Every tile, chart and table on this page renders{" "}
            <b>live data only</b> from the same PostHog adoption backend as the
            Runwal dashboard (<code>/fm/adoption/*</code>), with a{" "}
            <b>static app_id per site</b> — Artesia <code>27</code> · Sunteck{" "}
            <code>16</code> · Suncity <code>6</code> — plus <code>from/to</code>{" "}
            and <code>device_type/os</code> from the filters above. APIs fire{" "}
            <b>layer-wise</b>: landing loads only Traffic &amp; Session;
            Adoption &amp; Engagement loads when you open it (league queries{" "}
            <code>traffic_session</code> once per app_id); Workflow Usage loads{" "}
            <code>workflow_usage</code> per selected module. No dummy or
            sample numbers are rendered: while loading you see skeletons, and
            any card whose endpoint returns nothing shows an empty state (badge
            in the header shows <code>Live</code>, <code>Loading…</code> or the
            error panel with Retry). Hover the <code>i</code> on any tile or
            chart for its exact definition.
          </div>
        </main>
      </div>
    </div>
  );
}
