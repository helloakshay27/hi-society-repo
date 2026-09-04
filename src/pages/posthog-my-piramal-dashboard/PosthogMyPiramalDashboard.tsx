import React, { useState, useEffect, useMemo } from 'react';
// Everything below except TopBar/SideBar is brand-agnostic — reused directly
// from the Runwal dashboard rather than duplicated, so chart/table/page logic
// has a single source of truth across both dashboards.
import { PageId, DevicePlatform } from '../posthog-runwal-dashboard/types';
import { BM_DEFAULTS } from '../posthog-runwal-dashboard/data/constants';
import { DashboardProvider } from '../posthog-runwal-dashboard/context/DashboardContext';
import { InfoPopover } from '../posthog-runwal-dashboard/components/common/InfoPopover';
import { TopBar } from './components/common/TopBar';
import { SideBar } from './components/common/SideBar';
import { FilterBar } from '../posthog-runwal-dashboard/components/common/FilterBar';
import { TrafficSessionPage } from '../posthog-runwal-dashboard/components/pages/TrafficSessionPage';
import { AdoptionEngagementPage } from '../posthog-runwal-dashboard/components/pages/AdoptionEngagementPage';
import { WorkflowUsagePage } from '../posthog-runwal-dashboard/components/pages/WorkflowUsagePage';
import { useDashboardSites, useTrafficSession } from '../posthog-runwal-dashboard/hooks/useDashboardAnalytics';
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

function PosthogMyPiramalDashboardContent() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('my-piramal-theme');
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
      return localStorage.getItem('my-piramal-nav') === 'collapsed';
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
      localStorage.setItem('my-piramal-theme', theme);
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
          localStorage.setItem('my-piramal-nav', next ? 'collapsed' : 'open');
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
        localStorage.setItem('my-piramal-nav', next ? 'collapsed' : 'open');
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
    return 'My Piramal';
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

export const PosthogMyPiramalDashboard: React.FC = () => {
  return (
    <DashboardProvider>
      <PosthogMyPiramalDashboardContent />
    </DashboardProvider>
  );
};

export default PosthogMyPiramalDashboard;

