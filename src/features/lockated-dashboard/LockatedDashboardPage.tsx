import React, { useEffect, useCallback } from 'react';
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
import { useEnsureProjectCode } from '../../pages/posthog-runwal-dashboard/hooks/useEnsureProjectCode';

const LOCKATED_PROJECT_CODE = 'HS-01';
const LOCKATED_APP_ID = '1';

// ── Inner layout — consumes the context ─────────────────────────────────────
function DashboardLayout() {
  const {
    state,
    traffic,
    adopt,
    flows,
    sites,
    isRefreshing,
    isTrafficLoading,
    isAdoptLoading,
    isFlowsLoading,
    setPage,
    setDev,
    setScope,
    togglePrev,
    setWorkflow,
    setRange,
    setCustomRange,
    setProject,
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

  // Live recently-online count from traffic metrics
  const recentlyOnlineCount = traffic?.recentlyOnlineCount ?? 0;

  // Dynamic scope label
  const scopeLabel =
    scope === 'tower'
      ? 'Registered residents · Tower Admin scope (proposed)'
      : scope === 'super'
      ? 'Registered residents · Super Admin scope (proposed)'
      : 'Registered residents · all societies';

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
        <Sidebar currentPage={page} onSelectPage={setPage} />

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
            project={project}
            onChangeProject={setProject}
            dev={dev}
            onChangeDev={setDev}
            scope={scope}
            onChangeScope={setScope}
            prev={prev}
            onTogglePrev={togglePrev}
            recentlyOnlineCount={recentlyOnlineCount}
            sites={sites}
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
  projectCode = 'HS-01',
  appId = '1'
}: LockatedDashboardPageProps = {}) {
  return (
    <LockatedDashboardProvider projectCode={projectCode} appId={appId}>
      <DashboardLayout />
    </LockatedDashboardProvider>
  );
}
