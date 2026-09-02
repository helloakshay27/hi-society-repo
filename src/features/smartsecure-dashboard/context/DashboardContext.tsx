import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTrafficSession,
  fetchUsageAndDistribution,
  fetchAdoptionEngagement,
  fetchAdoptionTrend,
  fetchGrowth,
  fetchRetention,
  fetchRoles,
  fetchWorkflowUsage,
} from '../api/adoptionApi';
import { dateRangeFor } from '../api/queries';
import { BM_DEFAULTS } from '../data/constants';
import { buildTraffic, buildAdoption, buildFlows, type TrafficData, type AdoptData, type FlowsData } from '../data/metrics';
import type { ActivePage, DashboardState, Device, DateRangeDays } from '../data/types';
import { getToken } from '@/utils/auth';

const initialRange = dateRangeFor(30);

const DEFAULT_STATE: DashboardState = {
  dev: 'all',
  prev: true,
  wf: 'devApproval',
  page: 'pgTraffic',
  range: 30,
  rangeLabel: 'Last 30 days',
  rangeFrom: initialRange.from,
  rangeTo: initialRange.to,
  society: 'All Societies',
  theme: 'light',
  navCollapsed: false,
};

interface InfoPopoverState {
  key: string;
  rect: DOMRect;
}

interface DashboardContextValue {
  state: DashboardState;
  traffic: TrafficData;
  adopt: AdoptData;
  flows: FlowsData;
  setDev: (dev: Device) => void;
  togglePrev: () => void;
  setWorkflow: (key: string) => void;
  setPage: (page: ActivePage) => void;
  setRange: (days: DateRangeDays, label: string) => void;
  setCustomRange: (from: string, to: string, label: string) => void;
  setSociety: (society: string) => void;
  setTheme: (theme: DashboardState['theme']) => void;
  setNavCollapsed: (collapsed: boolean) => void;
  benchmarks: Record<string, number | null>;
  getBenchmark: (id: string) => number | null;
  setBenchmark: (id: string, value: number | null) => void;
  infoPopover: InfoPopoverState | null;
  openInfoPopover: (key: string, rect: DOMRect) => void;
  closeInfoPopover: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(DEFAULT_STATE);
  const [benchmarks, setBenchmarks] = useState<Record<string, number | null>>({});
  const [infoPopover, setInfoPopover] = useState<InfoPopoverState | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-ss-theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('smartsecure-theme');
    } catch {}
    if (saved === 'dark' || saved === 'light') {
      setState((s) => ({ ...s, theme: saved as DashboardState['theme'] }));
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setState((s) => ({ ...s, theme: 'dark' }));
    }
  }, []);

  const filters = useMemo(() => {
    const devices: ('Mobile' | 'Desktop')[] | undefined = state.dev === 'all' ? undefined : (state.dev === 'ios' || state.dev === 'android' ? ['Mobile'] : ['Desktop']);
    return {
      from: state.rangeFrom,
      to: state.rangeTo,
      devices,
      siteIds: state.society === 'All Societies' ? undefined : [],
    };
  }, [state.rangeFrom, state.rangeTo, state.dev, state.society]);

  const trafficQ    = useQuery({ queryKey: ['ss-traffic',    filters], queryFn: () => fetchTrafficSession(filters),                                                                        staleTime: 5 * 60_000 });
  const usageQ      = useQuery({ queryKey: ['ss-usage',      filters], queryFn: () => fetchUsageAndDistribution(filters),                                                                   staleTime: 5 * 60_000 });
  const engagementQ = useQuery({ queryKey: ['ss-engagement', filters], queryFn: () => fetchAdoptionEngagement({ ...filters }),                                                             staleTime: 5 * 60_000 });
  const trendQ      = useQuery({ queryKey: ['ss-trend',      filters], queryFn: () => fetchAdoptionTrend({ to: filters.to, weeks: 8, siteIds: filters.siteIds, devices: filters.devices }), staleTime: 5 * 60_000 });
  const growthQ     = useQuery({ queryKey: ['ss-growth',     filters], queryFn: () => fetchGrowth({ to: filters.to, weeks: 6, siteIds: filters.siteIds, devices: filters.devices }),        staleTime: 5 * 60_000 });
  const retentionQ  = useQuery({ queryKey: ['ss-retention',  filters], queryFn: () => fetchRetention({ to: filters.to, weeks: 6, siteIds: filters.siteIds, devices: filters.devices }),     staleTime: 5 * 60_000 });
  const rolesQ      = useQuery({ queryKey: ['ss-roles',      filters], queryFn: () => fetchRoles(filters),                                                                                  staleTime: 5 * 60_000 });
  const workflowQ   = useQuery({ queryKey: ['ss-workflow',   filters, state.wf], queryFn: () => fetchWorkflowUsage({ ...filters, module: state.wf }),                                       staleTime: 5 * 60_000 });

  const traffic = useMemo(() => buildTraffic(state, trafficQ.data, usageQ.data),                                                              [state, trafficQ.data, usageQ.data]);
  const adopt   = useMemo(() => buildAdoption(state, engagementQ.data, trendQ.data, growthQ.data, retentionQ.data, rolesQ.data),             [state, engagementQ.data, trendQ.data, growthQ.data, retentionQ.data, rolesQ.data]);
  const flows   = useMemo(() => buildFlows(state, workflowQ.data),                                                                            [state, workflowQ.data]);

  const value: DashboardContextValue = {
    state,
    traffic,
    adopt,
    flows,
    setDev: (dev) => setState((s) => ({ ...s, dev })),
    togglePrev: () => setState((s) => ({ ...s, prev: !s.prev })),
    setWorkflow: (wf) => setState((s) => ({ ...s, wf })),
    setPage: (page) => setState((s) => ({ ...s, page })),
    setRange: (range, rangeLabel) => {
      const r = dateRangeFor(range);
      setState((s) => ({ ...s, range, rangeLabel, rangeFrom: r.from, rangeTo: r.to }));
    },
    setCustomRange: (rangeFrom, rangeTo, rangeLabel) => {
      const days = Math.max(1, Math.round((new Date(rangeTo).getTime() - new Date(rangeFrom).getTime()) / 86400000) + 1);
      setState((s) => ({ ...s, range: days as DateRangeDays, rangeLabel, rangeFrom, rangeTo }));
    },
    setSociety: (society) => setState((s) => ({ ...s, society })),
    setTheme: (theme) => {
      setState((s) => ({ ...s, theme }));
      try {
        localStorage.setItem('smartsecure-theme', theme);
      } catch {}
    },
    setNavCollapsed: (navCollapsed) => setState((s) => ({ ...s, navCollapsed })),
    benchmarks,
    getBenchmark: (id) => (id in benchmarks ? benchmarks[id] : id in BM_DEFAULTS ? BM_DEFAULTS[id] : null),
    setBenchmark: (id, val) => setBenchmarks((b) => ({ ...b, [id]: val })),
    infoPopover,
    openInfoPopover: (key, rect) => setInfoPopover({ key, rect }),
    closeInfoPopover: () => setInfoPopover(null),
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useSmartSecureDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useSmartSecureDashboard outside DashboardProvider');
  return ctx;
}
