import React, { useState, useEffect, useMemo } from 'react';
import { PageId, DevicePlatform } from './types';
import { BM_DEFAULTS } from './data/constants';
import { DashboardProvider } from './context/DashboardContext';
import { InfoPopover } from './components/common/InfoPopover';
import { TopBar } from './components/common/TopBar';
import { SideBar } from './components/common/SideBar';
import { FilterBar } from './components/common/FilterBar';
import { TrafficSessionPage } from './components/pages/TrafficSessionPage';
import { AdoptionEngagementPage } from './components/pages/AdoptionEngagementPage';
import { WorkflowUsagePage } from './components/pages/WorkflowUsagePage';
import { useDashboardSites, useTrafficSession } from './hooks/useDashboardAnalytics';
import { getAppIdFromUrl } from './api/api';
import { DashboardFilters } from './api/types';
import { getToken, getBaseUrlDomain } from '../../utils/auth';
import './styles/dashboard.css';

function dateRangeFor(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: ymd(from), to: ymd(to) };
}

function PosthogRunwalDashboardContent() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('runwal-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
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
      return localStorage.getItem('runwal-nav') === 'collapsed';
    } catch {
      return false;
    }
  });

  // Load user/org accessible sites
  const { sites, sitesSettled, allSiteIds, isLoading: isSitesLoading } = useDashboardSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

  // The "All residents / Pre Sales / Post Sales" tab is only shown for
  // ?app_id=35 (read once — the query param isn't expected to change without
  // a page reload).
  const appId = useMemo(() => getAppIdFromUrl(), []);
  const showResidentSegment = appId === '35';
  const [residentSegment, setResidentSegment] = useState<'all' | 'pre' | 'post'>('all');

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

  // Centralized Filter State (tenant url from backend saved in localStorage)
  const dynamicTenantUrl = useMemo(() => {
    try {
      // 1. Explicit override in localStorage if set
      const explicit =
        localStorage.getItem('runwal_tenant_url') ||
        localStorage.getItem('tenant_url');
      if (explicit) {
        return explicit.replace(/^https?:\/\//, '').replace(/\/+$/, '');
      }

      // 2. Primary: Get backend URL saved during login/auth
      const backendUrl =
        getBaseUrlDomain() ||
        localStorage.getItem('baseUrl') ||
        sessionStorage.getItem('baseUrl') ||
        localStorage.getItem('base_url');

      if (backendUrl) {
        let cleaned = backendUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
        // Clean out API subdomain if backend returned -api URL (e.g. runwal-cp-api.lockated.com -> runwal-cp.lockated.com)
        if (cleaned.includes('-api.')) {
          cleaned = cleaned.replace('-api.', '.');
        }
        return cleaned;
      }
    } catch {}

    // 3. Active deployed browser hostname (when on staging/production runwal domain)
    if (
      typeof window !== 'undefined' &&
      window.location.hostname &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      window.location.hostname.includes('runwal')
    ) {
      return window.location.hostname;
    }

    // 4. Default Runwal tenant domain tracked in PostHog
    return 'runwal-cp.lockated.com';
  }, []);

  const filters: DashboardFilters = useMemo(() => {
    // When "all" is selected, siteIds must be [] so PostHog returns tenant-wide aggregate live data
    const siteIds = selectedSiteId && selectedSiteId !== 'all' ? [selectedSiteId] : [];

    // display_view only applies for the app_id=35 tenant; "all" maps to both
    // segments at once ("0,1"), Pre Sales -> "0", Post Sales -> "1".
    const displayView = showResidentSegment
      ? residentSegment === 'pre'
        ? '0'
        : residentSegment === 'post'
        ? '1'
        : '0,1'
      : undefined;

    return {
      siteIds,
      from: rangeFrom,
      to: rangeTo,
      token: getToken() || localStorage.getItem('token') || '',
      devPlatform,
      licensedSeats: null,
      module: null,
      subModule: null,
      url: dynamicTenantUrl,
      displayView,
    };
  }, [selectedSiteId, devPlatform, rangeFrom, rangeTo, dynamicTenantUrl, showResidentSegment, residentSegment]);

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
      localStorage.setItem('runwal-theme', theme);
    } catch {}
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
          localStorage.setItem('runwal-nav', next ? 'collapsed' : 'open');
        } catch {}
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
        localStorage.setItem('runwal-nav', next ? 'collapsed' : 'open');
      } catch {}
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
    const mainEl = document.querySelector('.posthog-dashboard-root .main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Dynamic User and Organization Info
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
    } catch {}
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
      } catch {}
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
    } catch {}
    return user?.lock_role?.display_name || user?.lock_role?.name || user?.user_type || 'Analytics Admin';
  }, [user]);

  const userEmail = useMemo(() => {
    return user?.email || '';
  }, [user]);

  const orgName = useMemo(() => {
    try {
      const acc = localStorage.getItem('hiSocietyAccount');
      if (acc) {
        const parsed = JSON.parse(acc);
        if (parsed?.organization?.name) return parsed.organization.name;
        if (parsed?.selected_user_society_name) return parsed.selected_user_society_name;
        if (parsed?.society?.building_name) return parsed.society.building_name;
      }
      const savedOrg = localStorage.getItem('org_name') || localStorage.getItem('organization_name');
      if (savedOrg) return savedOrg;
    } catch {}
    return 'Runwal Group';
  }, []);

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
            showResidentSegment={showResidentSegment}
            residentSegment={residentSegment}
            onSelectResidentSegment={setResidentSegment}
            prev={showPrev}
            onTogglePrev={() => setShowPrev((p) => !p)}
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

export const PosthogRunwalDashboard: React.FC = () => {
  return (
    <DashboardProvider>
      <PosthogRunwalDashboardContent />
    </DashboardProvider>
  );
};

export default PosthogRunwalDashboard;

