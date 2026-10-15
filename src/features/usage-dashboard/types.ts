/**
 * Usage Dashboard — shared types + API contract.
 *
 * The page runs on MOCK data today (see mockData.ts). When the real
 * backend is ready, only api.ts changes — these types are already
 * shaped like the future API response so components/sections stay
 * untouched.
 *
 * Planned route (NOT registered in App.tsx yet — owner will route later):
 *   export const USAGE_DASHBOARD_PATH = '/usage-dashboard';
 */

export const USAGE_DASHBOARD_PATH = '/usage-dashboard';

export type LayerKey = 'traffic' | 'adoption' | 'workflow';
export type DeviceFilter = 'all' | 'ios' | 'android';
export type ScopeFilter = 'all' | 'tower' | 'super';
export type DatePreset = 7 | 30 | 90;

export interface UsageFilters {
  preset: DatePreset;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  society: string; // 'all' | society id/name
  device: DeviceFilter;
  scope: ScopeFilter;
  comparePrevious: boolean;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  deltaPct: number | null; // vs previous period, null = hidden
  sub: string;
  info: string; // tooltip: exact definition
}

export interface TrendPoint {
  label: string; // e.g. 'Sep 01'
  current: number;
  previous: number | null;
}

export interface SplitSlice {
  name: string;
  value: number;
  color: string;
}

export interface BarRow {
  label: string;
  value: number; // 0-100
  hint?: string;
}

export interface FunnelStep {
  label: string;
  users: number;
  pctOfStart: number;
  dropoffFromPrev: number | null;
}

export interface HeatCell {
  value: number | null; // % or null = n/a
}

export interface HeatRow {
  cohort: string;
  cells: HeatCell[]; // Day1..Day30
}

export interface TableRow {
  module: string;
  users: number;
  sessions: number;
  adoptionPct: number;
  trend: 'up' | 'down' | 'flat';
  status: 'healthy' | 'watch' | 'drop';
}

export interface WorkflowModule {
  key: string;
  label: string;
  bucket: string;
  adoptionPct: number;
  completionPct: number;
  dropoffPct: number;
  avgTime: string;
  completions: number;
  funnel: FunnelStep[];
}

/** Full payload the future API should return (mock implements this today). */
export interface UsageDashboardData {
  filtersEcho: UsageFilters;
  societies: string[];
  traffic: {
    kpis: Kpi[];
    usageTrend: TrendPoint[];
    deviceSplit: SplitSlice[];
    liveNow: number;
  };
  adoption: {
    kpis: Kpi[];
    adoptionTrend: TrendPoint[];
    byModule: BarRow[];
    retention: HeatRow[];
    dormant: BarRow[];
    table: TableRow[];
  };
  workflow: {
    modules: WorkflowModule[];
    activeKey: string;
  };
}
