import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// Everything below except TopBar/SideBar/AdoptionEngagementPage is
// brand-agnostic — reused directly from the Runwal dashboard rather than
// duplicated, so chart/table/page logic has a single source of truth across
// all tenant dashboards (same pattern as posthog-godrej-dashboard).
import { PageId, DevicePlatform } from '../posthog-runwal-dashboard/types';
import { BM_DEFAULTS } from '../posthog-runwal-dashboard/data/constants';
import { DashboardProvider } from '../posthog-runwal-dashboard/context/DashboardContext';
import { InfoPopover } from '../posthog-runwal-dashboard/components/common/InfoPopover';
import { TopBar } from './components/common/TopBar';
import { SideBar } from './components/common/SideBar';
import { FilterBar } from '../posthog-runwal-dashboard/components/common/FilterBar';
// Traffic & Session and Workflow Usage are fully data-driven (module tree /
// workflow usage / usage-and-distribution all come live from the backend,
// scoped by app_id) with zero CRM/finance or hardcoded workflow-catalog
// content, and their tile lists/chart structure already match the HTML
// mock's renderTraffic() and workflow sections 1:1 — so they're reused
// directly rather than forked. Adoption & Engagement, however, is forked
// locally: Runwal's own version also renders FM Matrix CRM/Finance sections
// (lease, events, broadcast, wallet, approvals, PR/SR split, overdue
// invoices) that Lacircle's HTML mock does not have at all.
import { TrafficSessionPage } from '../posthog-runwal-dashboard/components/pages/TrafficSessionPage';
import { AdoptionEngagementPage } from './components/pages/AdoptionEngagementPage';
import { WorkflowUsagePage } from '../posthog-runwal-dashboard/components/pages/WorkflowUsagePage';
import { useDashboardSites, useTrafficSession } from '../posthog-runwal-dashboard/hooks/useDashboardAnalytics';
import { useEnsureAppId } from '../posthog-runwal-dashboard/hooks/useEnsureAppId';
import { DashboardFilters } from '../posthog-runwal-dashboard/api/types';
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

// Lacircle is a build of the _COMPANY_RUSTOMJEE theme (isPostSales=false),
// tracked in PostHog under app_id=32 — pinned here per the explicit value
// given for this dashboard (see Lacircle_Dashboard_v1_FM_structure.html's
// wireframe note for the package_name / client disambiguation background).
const LACIRCLE_APP_ID = '32';

function PosthogLacircleDashboardContent() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('lacircle-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* ignore */
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  });

  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lacircle-nav') === 'collapsed';
    } catch {
      return false;
    }
  });

  // Load user/org accessible sites
  const { sites, sitesSettled, allSiteIds, isLoading: isSitesLoading } = useDashboardSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

  const initialRange = useMemo(() => dateRangeFor(30), []);

  const [activePage, setActivePage] = useState<PageId>('pgTraffic');
  const [devPlatform, setDevPlatform] = useState<DevicePlatform>('all');
  const [showPrev, setShowPrev] = useState<boolean>(true);
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [rangeLabel, setRangeLabel] = useState<string>('Last 30 days');
  const [rangeFrom, setRangeFrom] = useState<string>(initialRange.from);
  const [rangeTo, setRangeTo] = useState<string>(initialRange.to);

  const [benchmarks, setBenchmarks] = useState<Record<string, number | null>>({
    ...BM_DEFAULTS,
  });

  // Centralized Filter State
  const filters: DashboardFilters = useMemo(() => {
    // When "all" is selected, siteIds must be [] so PostHog returns tenant-wide aggregate live data
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
      // Lacircle sends both identifiers on every PostHog Adoption API call —
      // app_id and project_code together (same pattern as My Piramal) —
      // since buildPosthogQuery() only falls back to the URL's app_id when
      // no project_code is set on the filters at all.
      appId: LACIRCLE_APP_ID,
      projectCode: 'RMP-01',
    };
  }, [selectedSiteId, devPlatform, rangeFrom, rangeTo]);

  // Traffic Session query for global live counter & badge
  const {
    data: trafficData,
    isFetching: isTrafficFetching,
    isError: isTrafficError,
  } = useTrafficSession(filters, sitesSettled);

  const recentlyOnlineCount = trafficData?.tiles?.recently_online || 0;
  const generatedAt = trafficData?.meta?.generated_at;

  // Sync theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('lacircle-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Sync keyboard shortcut '[' for nav rail toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      const tag = target && target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      e.preventDefault();
      setIsNavCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('lacircle-nav', next ? 'collapsed' : 'open');
        } catch {
          /* ignore */
        }
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleNav = () => {
    setIsNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lacircle-nav', next ? 'collapsed' : 'open');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleBenchmarkChange = (id: string, value: number | null) => {
    setBenchmarks((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectPage = (page: PageId) => {
    setActivePage(page);
    // The root itself scrolls now (edge-to-edge with the window), not .main.
    const rootEl = document.querySelector('.posthog-dashboard-root');
    if (rootEl) {
      rootEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        queryClient.invalidateQueries({ queryKey: ['fm-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-sites'] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  // Dynamic User Info
  const user = useMemo(() => {
    try {
      const u = getUser();
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
    if (!user) {
      try {
        const acc = localStorage.getItem('hiSocietyAccount');
        if (acc) {
          const parsed = JSON.parse(acc);
          const name = [parsed.firstname, parsed.lastname].filter(Boolean).join(' ');
          if (name) return name;
        }
      } catch {
        /* ignore */
      }
      return 'Logged-in User';
    }
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

  const userEmail = useMemo(() => {
    return user?.email || '';
  }, [user]);

  // Fixed brand name — this is a dedicated Lacircle-branded dashboard page,
  // so it should not switch to whatever org happens to be on the logged-in
  // test account (unlike Runwal/Piramal, which are meant to reflect the
  // logged-in account's own org). Casing matches the HTML mock's brandmark,
  // topbar-title and title tag ("LACIRCLE").
  const orgName = 'LACIRCLE';

  const PAGE_TITLES: Record<PageId, string> = {
    pgTraffic: 'Traffic & Session',
    pgAdopt: 'Adoption & Engagement',
    pgFlows: 'Workflow Usage',
  };

  const currentSiteName =
    selectedSiteId === 'all'
      ? 'All Live Sites / Projects'
      : sites.find((s) => String(s.id) === selectedSiteId)?.name || `Site ${selectedSiteId}`;

  return (
    <div
      className={`posthog-dashboard-root ${isNavCollapsed ? 'nav-collapsed' : ''}`}
      data-theme={theme}
    >
      <TopBar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isNavCollapsed={isNavCollapsed}
        onToggleNav={handleToggleNav}
        userName={userName}
        userRole={userRole}
        userEmail={userEmail}
        orgName={orgName}
        siteName={currentSiteName}
        isFetching={isTrafficFetching}
      />

      <div className="shell">
        <SideBar
          activePage={activePage}
          onSelectPage={handleSelectPage}
          filters={filters}
          sitesSettled={sitesSettled}
        />

        <main className="main">
          <div className="page-head">
            <h2 id="pageTitle">{PAGE_TITLES[activePage]}</h2>
            <p className="page-sub">
              <span id="custName">{orgName} Analytics</span> ·{' '}
              <span id="scopeLabel">{currentSiteName}</span>
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
            <b>Live Analytics Integration.</b> Connected directly to PostHog Adoption Analytics (
            <code>https://posthog-api.lockated.com</code>) and Hi-Society Backend endpoints. All metrics dynamically update based on selected sites, date ranges, and device platforms.
          </div>
        </main>
      </div>

      {/* Floating Info Popover for (i) Button */}
      <InfoPopover />
    </div>
  );
}

// Ensures the URL carries app_id=32 before any of the content's
// data-fetching hooks mount — several of them (useDashboardSites in
// particular) have no `enabled` gate and cache under a query key that
// doesn't depend on the URL, so firing them even once before the URL is
// corrected would permanently cache results scoped to the wrong (missing)
// app_id.
function PosthogLacircleDashboardGate() {
  const appIdReady = useEnsureAppId(LACIRCLE_APP_ID);
  if (!appIdReady) return null;
  return <PosthogLacircleDashboardContent />;
}

export const PosthogLacircleDashboard: React.FC = () => {
  return (
    <DashboardProvider>
      <PosthogLacircleDashboardGate />
    </DashboardProvider>
  );
};

export default PosthogLacircleDashboard;
