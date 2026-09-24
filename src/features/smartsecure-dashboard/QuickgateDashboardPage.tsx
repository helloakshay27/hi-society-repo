import './smartsecure-dashboard.css';
import { DashboardProvider, useSmartSecureDashboard } from './context/DashboardContext';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { InfoPopover } from './components/InfoPopover';
import { Footer } from './components/Footer';
import { TrafficSection } from './sections/TrafficSection';
import { AdoptionSection } from './sections/AdoptionSection';
import { WorkflowSection } from './sections/WorkflowSection';
import { useEnsureAppId } from '../../pages/posthog-runwal-dashboard/hooks/useEnsureAppId';
import { RecentActivitySidebar } from '../../pages/posthog-runwal-dashboard/components/common/RecentActivitySidebar';
import type { DashboardFilters } from '../../pages/posthog-runwal-dashboard/api/types';
import type { ActivePage } from './data/types';

const PAGES: { key: ActivePage; title: string; icon: JSX.Element }[] = [
  {
    key: 'pgTraffic',
    title: 'Traffic & Session',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.4 12.6 6.6 7.4l3.4 3.1 4.1-5.4 3.5 4.3" /><path d="M2.4 16.4h15.2" />
      </svg>
    ),
  },
  {
    key: 'pgAdopt',
    title: 'Adoption & Engagement',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="7.6" cy="6.8" r="2.9" /><path d="M2.6 16.6c0-2.7 2.2-4.6 5-4.6s5 1.9 5 4.6" />
        <path d="M13.4 4.3a2.9 2.9 0 0 1 0 5.4M14.6 12.4c1.8.5 3 1.9 3 4.2" />
      </svg>
    ),
  },
  {
    key: 'pgFlows',
    title: 'Workflow Usage',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 2.4 17.4 6 10 9.6 2.6 6Z" /><path d="M2.6 10 10 13.6 17.4 10" /><path d="M2.6 14 10 17.6 17.4 14" />
      </svg>
    ),
  },
];

function DashboardLayout() {
  const { state, setPage, sites, appId } = useSmartSecureDashboard();
  const page = PAGES.find((p) => p.key === state.page) ?? PAGES[0];
  const recentActivityFilters: DashboardFilters = {
    siteIds: state.society === 'All Societies' ? sites.map((site) => site.id) : [state.society],
    from: state.rangeFrom,
    to: state.rangeTo,
    token: '',
    devPlatform: 'all',
    licensedSeats: null,
    module: null,
    subModule: null,
    appId,
  };

  return (
    <div className={`ss-app${state.navCollapsed ? ' nav-collapsed' : ''}`}>
      <Header />
      <div className="shell">
        <aside className="sidebar">
          <h1 className="brandmark">
            <span className="bm-full">QuikGate</span>
            <span className="bm-mini">QG</span>
          </h1>
          <p className="brandmark-sub">QuikGate &middot; flutter_quikgate</p>
          <nav aria-label="Sections">
            <div className="nav-group">
              <div className="nav-label">Layers</div>
              {PAGES.map((p) => (
                <button
                  key={p.key}
                  className={`nav-item ${state.page === p.key ? 'on' : ''}`}
                  onClick={() => setPage(p.key)}
                  data-tip={p.title}
                >
                  <span className="ni-ic">{p.icon}</span>
                  <span className="ni-t">{p.title}</span>
                </button>
              ))}
            </div>
          </nav>
          <RecentActivitySidebar filters={recentActivityFilters} sitesSettled={sites.length > 0} />
        </aside>

        <main className="main">
          <div className="page-head">
            <h2>{page.title}</h2>
            <p className="page-sub">
              <span>QuikGate — Gate Terminal App</span> &middot; <span>All gatekeepers &amp; terminals &middot; all sites &middot; client = smartsecure</span>
            </p>
          </div>

          <ControlBar />

          {state.page === 'pgTraffic' && <TrafficSection />}
          {state.page === 'pgAdopt' && <AdoptionSection />}
          {state.page === 'pgFlows' && <WorkflowSection />}

          <Footer />
        </main>
      </div>
      <InfoPopover />
    </div>
  );
}

const QUIKGATE_APP_ID = '23';

function QuickgateDashboardGate() {
  const appIdReady = useEnsureAppId(QUIKGATE_APP_ID);
  if (!appIdReady) return null;

  return (
    <DashboardProvider appId={QUIKGATE_APP_ID} appName="QuikGate">
      <DashboardLayout />
    </DashboardProvider>
  );
}

export function QuickgateDashboardPage() {
  return <QuickgateDashboardGate />;
}

export default QuickgateDashboardPage;
