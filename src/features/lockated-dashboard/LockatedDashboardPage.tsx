import React, { useEffect, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './lockated-dashboard.css';
import { PAGE_TITLES, FOOTERS } from './data/constants';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { TrafficSection } from './sections/TrafficSection';
import { AdoptionSection } from './sections/AdoptionSection';
import { WorkflowSection } from './sections/WorkflowSection';
import {
  LockatedDashboardProvider,
  useLockatedDashboard
} from './context/LockatedDashboardContext';
// import { useEnsureProjectCode } from '../../pages/posthog-runwal-dashboard/hooks/useEnsureProjectCode';
import type { DashboardFilters } from '../../pages/posthog-runwal-dashboard/api/types';

// const LOCKATED_PROJECT_CODE = 'HS-01';
const LOCKATED_APP_ID = '1';

/**
 * Pins `?app_id=` in the URL and removes any `project_code` (shared API helpers
 * fall back to reading it off the URL), so only app_id is sent to PostHog.
 */
function useEnsureAppIdOnly(appId: string): boolean {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let changed = false;
    if (params.get('app_id') !== appId) {
      params.set('app_id', appId);
      changed = true;
    }
    if (params.has('project_code')) {
      params.delete('project_code');
      changed = true;
    }
    if (changed) {
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      return;
    }
    setReady(true);
  }, [location.pathname, location.search, navigate, appId]);

  return ready;
}

// ── Inner layout — consumes the context ─────────────────────────────────────
function DashboardLayout() {
  const {
    state,
    traffic,
    adopt,
    flows,
    sites,
    appId,
    projectCode,
    sitesReady,
    isRefreshing,
    isTrafficLoading,
    isAdoptLoading,
    isFlowsLoading,
    setPage,
    setDev,
    togglePrev,
    setWorkflow,
    setRange,
    setCustomRange,
    setTheme,
    setNavCollapsed,
    refreshAll
  } = useLockatedDashboard();

  const {
    page,
    dev,
    scope,
    prev,
    wf,
    range,
    rangeLabel,
    rangeFrom,
    rangeTo,
    project,
    theme,
    navCollapsed
  } = state;

  // Keyboard shortcut '[' to toggle nav rail
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      setNavCollapsed(!navCollapsed);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navCollapsed, setNavCollapsed]);

  const handleToggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const handleToggleNav = useCallback(() => {
    setNavCollapsed(!navCollapsed);
  }, [navCollapsed, setNavCollapsed]);

  // Same scope as the analytics queries — selected project's site, or all sites.
  const selectedSite = sites.find((s) => s.name.toLowerCase() === project.toLowerCase());
  const recentActivityFilters: DashboardFilters = {
    siteIds: selectedSite ? [selectedSite.id] : sites.map((s) => s.id),
    from: rangeFrom,
    to: rangeTo,
    token: '',
    deviceType: 'Mobile',
    devPlatform: dev,
    licensedSeats: null,
    module: null,
    subModule: null,
    appId: appId || LOCKATED_APP_ID
    // projectCode: projectCode || LOCKATED_PROJECT_CODE
  };

  // Live recently-online count from traffic metrics
  const recentlyOnlineCount = traffic?.recentlyOnlineCount ?? 0;

  const scopeLabel = 'Registered residents · all societies';

  return (
    <div
      className={`lockated-app ${navCollapsed ? 'nav-collapsed' : ''}`}
      data-theme={theme}
    >
      <Header
        navCollapsed={navCollapsed}
        onToggleNav={handleToggleNav}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isLive={!!traffic && !isTrafficLoading}
        isRefreshing={isRefreshing}
      />

      <div className="shell">
        <Sidebar
          currentPage={page}
          onSelectPage={setPage}
          recentActivityFilters={recentActivityFilters}
          sitesSettled={sitesReady}
        />

        <main className="main">
          {/* Page Head */}
          <div className="page-head">
            <h2 id="pageTitle">{PAGE_TITLES[page]}</h2>
            <p className="page-sub">
              <span id="custName">Lockated Resident Application</span> &middot;{' '}
              <span id="scopeLabel">{scopeLabel}</span>
            </p>
          </div>

          {/* Filter Bar — receives live sites list and refresh button */}
          <FilterBar
            range={range}
            rangeLabel={rangeLabel}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            onSelectRange={(days, label) => setRange(days, label)}
            onApplyCustomRange={(from, to, days, label) =>
              setCustomRange(from, to, days, label)
            }
            dev={dev}
            onChangeDev={setDev}
            prev={prev}
            onTogglePrev={togglePrev}
            recentlyOnlineCount={recentlyOnlineCount}
            isRefreshing={isRefreshing}
            onRefresh={refreshAll}
          />

          {/* Page Content */}
          {page === 'pgTraffic' && (
            <TrafficSection
              dev={dev}
              scope={scope}
              range={range}
              prev={prev}
              theme={theme}
              metrics={traffic}
              isLoading={isTrafficLoading}
            />
          )}

          {page === 'pgAdopt' && (
            <AdoptionSection
              dev={dev}
              scope={scope}
              range={range}
              theme={theme}
              metrics={adopt}
              isLoading={isAdoptLoading}
            />
          )}

          {page === 'pgFlows' && (
            <WorkflowSection
              dev={dev}
              scope={scope}
              range={range}
              workflowKey={wf}
              onSelectWorkflow={setWorkflow}
              theme={theme}
              metrics={flows}
              isLoading={isFlowsLoading}
            />
          )}

          {/* Page Footer */}
          <div
            className="footer"
            id="pageFooter"
            dangerouslySetInnerHTML={{ __html: FOOTERS[page] || '' }}
          />
        </main>
      </div>
    </div>
  );
}

// ── Root export — wraps with the provider ────────────────────────────────────
export interface LockatedDashboardPageProps {
  projectCode?: string;
  appId?: string;
}

export default function LockatedDashboardPage({
  // projectCode = LOCKATED_PROJECT_CODE,
  appId = LOCKATED_APP_ID
}: LockatedDashboardPageProps = {}) {
  // Pin ?project_code= in the URL (and drop any stray app_id) before querying.
  // const projectCodeReady = useEnsureProjectCode(projectCode);
  // if (!projectCodeReady) return null;

  // For now only app_id is sent — pin ?app_id= and strip any project_code.
  const appIdReady = useEnsureAppIdOnly(appId);
  if (!appIdReady) return null;

  return (
    <LockatedDashboardProvider appId={appId}>
      <DashboardLayout />
    </LockatedDashboardProvider>
  );
}
