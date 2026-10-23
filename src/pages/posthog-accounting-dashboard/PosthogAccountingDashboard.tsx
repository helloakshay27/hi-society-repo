import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// Same composition as the Godrej dashboard: everything brand-agnostic (API,
// hooks, filter bar, charts, tables) is reused from the shared Runwal library
// so there is a single source of truth across tenant dashboards. Only the
// sidebar and the page copy are Accounting-specific.
import { PageId, DevicePlatform } from '../posthog-runwal-dashboard/types';
import { BM_DEFAULTS } from '../posthog-runwal-dashboard/data/constants';
import { DashboardProvider } from '../posthog-runwal-dashboard/context/DashboardContext';
import { InfoPopover } from '../posthog-runwal-dashboard/components/common/InfoPopover';
import { FilterBar } from '../posthog-runwal-dashboard/components/common/FilterBar';
import { useDashboardSites, useTrafficSession } from '../posthog-runwal-dashboard/hooks/useDashboardAnalytics';
import { useEnsureAppId } from '../posthog-runwal-dashboard/hooks/useEnsureAppId';
import { DashboardFilters } from '../posthog-runwal-dashboard/api/types';
import { TopBar } from '../posthog-godrej-dashboard/components/common/TopBar';
import { AdminScope } from '../posthog-godrej-dashboard/data/wireframeData';
import { SideBar } from './components/SideBar';
import { TrafficSessionPage } from './components/pages/TrafficSessionPage';
import { AdoptionEngagementPage } from './components/pages/AdoptionEngagementPage';
import { WorkflowUsagePage } from './components/pages/WorkflowUsagePage';
import { getToken, getUser } from '../../utils/auth';
import '../posthog-runwal-dashboard/styles/dashboard.css';

function dateRangeFor(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: ymd(from), to: ymd(to) };
}

// Hi Society PostHog project — pinned per the recent_active_users URL given for
// this dashboard (…/fm/adoption/recent_active_users?app_id=29&device_type=mobile…).
const ACCOUNTING_APP_ID = '29';

const THEME_KEY = 'hs-acc-theme';
const NAV_KEY = 'hs-acc-nav';

const SCOPE_LABELS: Record<AdminScope, string> = {
  all: 'Accounting users · all societies',
  tower: 'Accounting users · Tower Admin scope (proposed)',
  super: 'Accounting users · Super Admin scope (proposed)',
};

function PosthogAccountingDashboardContent() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NAV_KEY) === 'collapsed';
    } catch {
      return false;
    }
  });

  const { sites, sitesSettled, isLoading: isSitesLoading } = useDashboardSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

  const initialRange = useMemo(() => dateRangeFor(30), []);

  const [activePage, setActivePage] = useState<PageId>('pgTraffic');
  // PROPOSED: no backend field scopes data by Tower vs Super admin yet, so this
  // only drives the filter bar + subtitle — it does not change the numbers.
  const [adminScope, setAdminScope] = useState<AdminScope>('all');
  const [devPlatform, setDevPlatform] = useState<DevicePlatform>('all');
  const [showPrev, setShowPrev] = useState<boolean>(true);
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [rangeLabel, setRangeLabel] = useState<string>('Last 30 days');
  const [rangeFrom, setRangeFrom] = useState<string>(initialRange.from);
  const [rangeTo, setRangeTo] = useState<string>(initialRange.to);

  const [benchmarks, setBenchmarks] = useState<Record<string, number | null>>({ ...BM_DEFAULTS });

  const filters: DashboardFilters = useMemo(() => {
    // "all" → siteIds [] so PostHog returns the tenant-wide aggregate
    const siteIds = selectedSiteId && selectedSiteId !== 'all' ? [selectedSiteId] : [];
    return {
      siteIds,
      from: rangeFrom,
      to: rangeTo,
      token: getToken() || localStorage.getItem('token') || '',
      devPlatform,
      licensedSeats: null,
      module: null,
      subModule: null,
    };
  }, [selectedSiteId, devPlatform, rangeFrom, rangeTo]);

  const { data: trafficData, isFetching: isTrafficFetching, isError: isTrafficError } = useTrafficSession(
    filters,
    sitesSettled
  );

  const recentlyOnlineCount = trafficData?.tiles?.recently_online || 0;
  const generatedAt = trafficData?.meta?.generated_at;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleNav = useCallback(() => {
    setIsNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(NAV_KEY, next ? 'collapsed' : 'open');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // '[' toggles the nav rail, matching the wireframe
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      const tag = target && target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      e.preventDefault();
      toggleNav();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleNav]);

  const handleBenchmarkChange = (id: string, value: number | null) => {
    setBenchmarks((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectPage = (page: PageId) => {
    setActivePage(page);
    const rootEl = document.querySelector('.posthog-dashboard-root');
    if (rootEl) rootEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSetRange = (days: number, label: string) => {
    const r = dateRangeFor(days);
    setRangeDays(days);
    setRangeLabel(label);
    setRangeFrom(r.from);
    setRangeTo(r.to);
  };

  const handleSetCustomRange = (from: string, to: string, days: number, label: string) => {
    setRangeDays(days);
    setRangeLabel(label);
    setRangeFrom(from);
    setRangeTo(to);
  };

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['fm-adoption'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-sites'] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const user = useMemo(() => {
    try {
      const u = getUser() as (ReturnType<typeof getUser> & { name?: string }) | null;
      if (u && (u.firstname || u.name || u.email)) return u;
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.firstname || parsed?.name || parsed?.email) return parsed;
      }
      const acc = localStorage.getItem('hiSocietyAccount');
      if (acc) {
        const parsed = JSON.parse(acc);
        return parsed?.user || parsed;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  const userName = useMemo(() => {
    if (!user) return 'Logged-in User';
    const name = [user.firstname, user.lastname].filter(Boolean).join(' ');
    if (name) return name;
    if (user.name) return user.name;
    if (user.email) return user.email.split('@')[0];
    return 'Logged-in User';
  }, [user]);

  const userRole = useMemo(() => {
    try {
      const acc = localStorage.getItem('hiSocietyAccount');
      if (acc) {
        const parsed = JSON.parse(acc);
        if (parsed?.user_type) {
          if (parsed.user_type === 'rm_user') return 'RM User';
          if (parsed.user_type === 'cs_user') return 'CS User';
          return parsed.user_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        }
      }
    } catch {
      /* ignore */
    }
    return user?.lock_role?.display_name || user?.lock_role?.name || user?.user_type || 'Analytics Admin';
  }, [user]);

  const orgName = 'Hi Society';

  const PAGE_TITLES: Record<PageId, string> = {
    pgTraffic: 'Traffic & Session',
    pgAdopt: 'Adoption & Engagement',
    pgFlows: 'Workflow Usage',
  };

  const currentSiteName =
    selectedSiteId === 'all'
      ? 'All Live Sites / Projects'
      : sites.find((s) => String(s.id) === selectedSiteId)?.name || `Site ${selectedSiteId}`;

  const scopeLabel = selectedSiteId === 'all' ? SCOPE_LABELS[adminScope] : `Accounting users · ${currentSiteName}`;

  return (
    <div className={`posthog-dashboard-root ${isNavCollapsed ? 'nav-collapsed' : ''}`} data-theme={theme}>
      <TopBar
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        isNavCollapsed={isNavCollapsed}
        onToggleNav={toggleNav}
        userName={userName}
        userRole={userRole}
        userEmail={user?.email || ''}
        orgName={orgName}
        siteName={currentSiteName}
        isFetching={isTrafficFetching}
      />

      <div className="shell">
        <SideBar activePage={activePage} onSelectPage={handleSelectPage} filters={filters} sitesSettled={sitesSettled} />

        <main className="main">
          <div className="page-head">
            <h2 id="pageTitle">{PAGE_TITLES[activePage]}</h2>
            <p className="page-sub">
              <span id="custName">Hi Society · Accounting module</span> · <span id="scopeLabel">{scopeLabel}</span>
            </p>
          </div>

          <FilterBar
            range={rangeDays}
            rangeLabel={rangeLabel}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            onSetRange={handleSetRange}
            onSetCustomRange={handleSetCustomRange}
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
            isSitesLoading={isSitesLoading}
            showAdminScope
            adminScope={adminScope}
            onSelectAdminScope={setAdminScope}
            dev={devPlatform}
            onSelectDev={setDevPlatform}
            prev={showPrev}
            onTogglePrev={() => setShowPrev((p) => !p)}
            showRefresh
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            recentlyOnlineCount={recentlyOnlineCount}
            isFetching={isTrafficFetching}
            isError={isTrafficError}
            generatedAt={generatedAt}
          />

          {activePage === 'pgTraffic' && (
            <TrafficSessionPage
              filters={filters}
              showPrev={showPrev}
              benchmarks={benchmarks}
              onBenchmarkChange={handleBenchmarkChange}
              sitesSettled={sitesSettled}
            />
          )}

          {activePage === 'pgAdopt' && (
            <AdoptionEngagementPage
              filters={filters}
              benchmarks={benchmarks}
              onBenchmarkChange={handleBenchmarkChange}
              sitesSettled={sitesSettled}
              showPrev={showPrev}
            />
          )}

          {activePage === 'pgFlows' && (
            <WorkflowUsagePage
              filters={filters}
              benchmarks={benchmarks}
              onBenchmarkChange={handleBenchmarkChange}
              sitesSettled={sitesSettled}
            />
          )}

          <div className="footer">
            {/* <b>Live Analytics Integration.</b> Connected directly to PostHog Adoption Analytics (
            <code>https://posthog-api.lockated.com</code>, <code>app_id={ACCOUNTING_APP_ID}</code>) and Hi-Society
            backend site endpoints. All metrics update with the selected site, date range and device platform. The Admin
            Scope toggle is <b>proposed</b> and does not yet change the numbers. */}
          </div>
        </main>
      </div>

      <InfoPopover />
    </div>
  );
}

// Pin app_id=29 into the URL before any data hook mounts — the shared API reads
// app_id off window.location.search, and useDashboardSites caches under a key
// that doesn't include it (see the Godrej dashboard for the same pattern).
function PosthogAccountingDashboardGate() {
  const appIdReady = useEnsureAppId(ACCOUNTING_APP_ID);
  if (!appIdReady) return null;
  return <PosthogAccountingDashboardContent />;
}

export const PosthogAccountingDashboard: React.FC = () => {
  return (
    <DashboardProvider>
      <PosthogAccountingDashboardGate />
    </DashboardProvider>
  );
};

export default PosthogAccountingDashboard;
