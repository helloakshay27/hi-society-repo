import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query';
import {
  fetchTrafficSession,
  fetchUsageAndDistribution,
  fetchAdoptionEngagement,
  fetchAdoptionTrend,
  fetchGrowth,
  fetchRetention,
  fetchRoles,
  fetchModules,
  fetchWorkflowUsage,
  getDynamicTenantUrl,
  type ModuleNode
} from '../api/adoptionApi';
import { dateRangeFor, useAllSites, type Site } from '../api/queries';
import {
  buildTraffic,
  buildAdoption,
  buildFlows,
  type TrafficMetrics,
  type AdoptionMetrics,
  type WorkflowMetrics
} from '../data/metrics';
import type { DashboardState, ActivePage, Device, AdminScope } from '../data/types';
import { RANGE_LABELS } from '../data/constants';

const initialRange = dateRangeFor(30);

const DEFAULT_STATE: DashboardState = {
  dev: 'all',
  scope: 'all',
  prev: true,
  wf: 'serviceRequestCreate',
  bucket: 'Service & Support',
  page: 'pgTraffic',
  range: 30,
  rangeLabel: 'Last 30 days',
  rangeFrom: initialRange.from,
  rangeTo: initialRange.to,
  project: 'All Projects',
  theme: 'light',
  navCollapsed: false
};

interface LockatedDashboardContextValue {
  state: DashboardState;
  traffic?: TrafficMetrics;
  adopt?: AdoptionMetrics;
  flows?: WorkflowMetrics;
  sites: Site[];
  modules: ModuleNode[];
  appId: string;
  projectCode: string;
  /** True once the sites lookup has finished (even if it failed or was empty). */
  sitesReady: boolean;
  isRefreshing: boolean;
  isTrafficLoading: boolean;
  isAdoptLoading: boolean;
  isFlowsLoading: boolean;
  setPage: (page: ActivePage) => void;
  setDev: (dev: Device) => void;
  setScope: (scope: AdminScope) => void;
  togglePrev: () => void;
  setWorkflow: (wf: string) => void;
  setRange: (days: number, label: string) => void;
  setCustomRange: (from: string, to: string, days: number, label: string) => void;
  setProject: (project: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setNavCollapsed: (collapsed: boolean) => void;
  refreshAll: () => Promise<void>;
}

const LockatedDashboardContext = createContext<LockatedDashboardContextValue | null>(null);

export function LockatedDashboardProvider({
  children,
  projectCode = 'HS-01',
  appId = '1'
}: {
  children: ReactNode;
  projectCode?: string;
  appId?: string;
}) {
  const [state, setState] = useState<DashboardState>(() => {
    let savedTheme: 'light' | 'dark' = 'light';
    let savedNav = false;
    try {
      const t = localStorage.getItem('lockated-theme');
      if (t === 'dark' || t === 'light') savedTheme = t;
      else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) savedTheme = 'dark';
      const n = localStorage.getItem('lockated-nav');
      if (n === 'collapsed') savedNav = true;
    } catch {
      // ignore
    }
    return {
      ...DEFAULT_STATE,
      theme: savedTheme,
      navCollapsed: savedNav
    };
  });

  // Theme synchronization with documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    try {
      localStorage.setItem('lockated-theme', state.theme);
    } catch {
      // ignore
    }
  }, [state.theme]);

  // Nav collapse synchronization
  useEffect(() => {
    try {
      localStorage.setItem('lockated-nav', state.navCollapsed ? 'collapsed' : 'open');
    } catch {
      // ignore
    }
  }, [state.navCollapsed]);

  // Dynamic tenant URL and Sites query
  const dynamicUrl = getDynamicTenantUrl();
  const sitesQ = useAllSites();
  const sites = useMemo(() => sitesQ.data ?? [], [sitesQ.data]);
  const sitesSettled = sitesQ.isSuccess && sites.length > 0;
  // Wait for the sites lookup to finish (success or failure) before firing
  // analytics queries, so a selected project resolves to its site_id first.
  const queryEnabled = !sitesQ.isLoading;

  // Resolve active site ID if a specific project was selected
  const activeSiteId = useMemo(() => {
    if (state.project === 'All Projects') return undefined;
    const found = sites.find((s) => s.name.toLowerCase() === state.project.toLowerCase());
    return found ? [found.id] : undefined;
  }, [state.project, sites]);

  const effectiveProjectCode = useMemo(() => {
    if (projectCode) return projectCode;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get('project_code') || urlParams.get('projectCode');
      if (fromUrl) return fromUrl;
    }
    return 'HS-01';
  }, [projectCode]);

  const effectiveAppId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get('app_id') || urlParams.get('appId');
      if (fromUrl) return fromUrl;
    }
    if (appId) return appId;
    return '1';
  }, [appId]);

  // Device & OS mapping
  const filters = useMemo(() => {
    const devices: ('Mobile' | 'Desktop')[] = ['Mobile'];
    let os: string | undefined;

    if (state.dev === 'ios') os = 'ios';
    else if (state.dev === 'android') os = 'Android';

    return {
      enabled: sitesSettled,
      from: state.rangeFrom,
      to: state.rangeTo,
      devices,
      os,
      siteIds: activeSiteId,
      url: dynamicUrl,
      token: '',
      appId: effectiveAppId,
      // project_code disabled for now — only app_id is sent.
      // projectCode: effectiveProjectCode
      projectCode: undefined as string | undefined
    };
  }, [state.rangeFrom, state.rangeTo, state.dev, activeSiteId, dynamicUrl, sitesSettled, effectiveAppId]);

  // API Queries via React Query
  const trafficQ = useQuery({
    queryKey: ['lockated-traffic', filters],
    queryFn: () => fetchTrafficSession(filters),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: queryEnabled
  });

  const usageQ = useQuery({
    queryKey: ['lockated-usage', filters],
    queryFn: () => fetchUsageAndDistribution(filters),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: queryEnabled
  });

  const engagementQ = useQuery({
    queryKey: ['lockated-engagement', filters],
    queryFn: () => fetchAdoptionEngagement(filters),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: queryEnabled
  });

  const trendQ = useQuery({
    queryKey: ['lockated-trend', filters],
    queryFn: () =>
      fetchAdoptionTrend({
        to: filters.to,
        weeks: 8,
        siteIds: filters.siteIds,
        devices: filters.devices,
        appId: filters.appId,
        projectCode: filters.projectCode,
        os: filters.os
      }),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: queryEnabled
  });

  const growthQ = useQuery({
    queryKey: ['lockated-growth', filters],
    queryFn: () =>
      fetchGrowth({
        to: filters.to,
        weeks: 6,
        siteIds: filters.siteIds,
        devices: filters.devices,
        appId: filters.appId,
        projectCode: filters.projectCode,
        os: filters.os
      }),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: queryEnabled
  });

  const retentionQ = useQuery({
    queryKey: ['lockated-retention', filters],
    queryFn: () =>
      fetchRetention({
        to: filters.to,
        weeks: 6,
        siteIds: filters.siteIds,
        devices: filters.devices,
        appId: filters.appId,
        projectCode: filters.projectCode,
        os: filters.os
      }),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: queryEnabled
  });

  const rolesQ = useQuery({
    queryKey: ['lockated-roles', filters],
    queryFn: () => fetchRoles(filters),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: queryEnabled
  });

  const modulesQ = useQuery({
    queryKey: ['lockated-modules', filters],
    queryFn: () => fetchModules(filters),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: queryEnabled
  });

  const workflowQ = useQuery({
    queryKey: ['lockated-workflow', filters, state.wf],
    queryFn: () => fetchWorkflowUsage({ ...filters, module: state.wf }),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: queryEnabled
  });

  // Refresh mechanism
  const queryClient = useQueryClient();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const isFetchingQueries =
    useIsFetching({
      predicate: (q) => {
        const k = q.queryKey[0];
        return typeof k === 'string' && k.startsWith('lockated-');
      }
    }) > 0;

  const isRefreshing = isManualRefreshing || isFetchingQueries;

  const refreshAll = async () => {
    setIsManualRefreshing(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 600));
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          predicate: (q) => {
            const k = q.queryKey[0];
            if (k === 'fm-adoption') return q.queryKey[1] === 'recent_active_users';
            return typeof k === 'string' && (k.startsWith('lockated-') || k === 'all-sites');
          },
          refetchType: 'active'
        }),
        minDelay
      ]);
    } catch {
      // ignore
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const isTrafficLoading = sitesQ.isLoading || trafficQ.isLoading || usageQ.isLoading || isManualRefreshing;
  const isAdoptLoading =
    sitesQ.isLoading ||
    engagementQ.isLoading ||
    trendQ.isLoading ||
    growthQ.isLoading ||
    retentionQ.isLoading ||
    rolesQ.isLoading ||
    isManualRefreshing;
  const isFlowsLoading = sitesQ.isLoading || workflowQ.isLoading || isManualRefreshing;

  // Build metrics with live API data & graceful fallbacks
  const traffic = useMemo(
    () => buildTraffic(state, trafficQ.data, usageQ.data),
    [state, trafficQ.data, usageQ.data]
  );

  const adopt = useMemo(
    () => buildAdoption(state, engagementQ.data, trendQ.data, growthQ.data, retentionQ.data, rolesQ.data),
    [state, engagementQ.data, trendQ.data, growthQ.data, retentionQ.data, rolesQ.data]
  );

  const flows = useMemo(
    () => buildFlows(state, workflowQ.data),
    [state, workflowQ.data]
  );

  const value: LockatedDashboardContextValue = {
    state,
    traffic,
    adopt,
    flows,
    sites,
    modules: modulesQ.data?.tree ?? [],
    appId: effectiveAppId,
    projectCode: effectiveProjectCode,
    sitesReady: queryEnabled,
    isRefreshing,
    isTrafficLoading,
    isAdoptLoading,
    isFlowsLoading,
    setPage: (newPage) => {
      setState((s) => ({ ...s, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    setDev: (dev) => setState((s) => ({ ...s, dev })),
    setScope: (scope) => setState((s) => ({ ...s, scope })),
    togglePrev: () => setState((s) => ({ ...s, prev: !s.prev })),
    setWorkflow: (wf) => setState((s) => ({ ...s, wf })),
    setRange: (days, label) => {
      const r = dateRangeFor(days);
      setState((s) => ({ ...s, range: days, rangeLabel: label, rangeFrom: r.from, rangeTo: r.to }));
    },
    setCustomRange: (from, to, days, label) => {
      setState((s) => ({ ...s, range: days, rangeLabel: label, rangeFrom: from, rangeTo: to }));
    },
    setProject: (project) => setState((s) => ({ ...s, project })),
    setTheme: (theme) => setState((s) => ({ ...s, theme })),
    setNavCollapsed: (collapsed) => setState((s) => ({ ...s, navCollapsed: collapsed })),
    refreshAll
  };

  return (
    <LockatedDashboardContext.Provider value={value}>
      {children}
    </LockatedDashboardContext.Provider>
  );
}

export function useLockatedDashboard(): LockatedDashboardContextValue {
  const ctx = useContext(LockatedDashboardContext);
  if (!ctx) {
    throw new Error('useLockatedDashboard must be used within a LockatedDashboardProvider');
  }
  return ctx;
}
