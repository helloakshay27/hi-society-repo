import '../features/posthog-dashboard/posthog-dashboard.css';
import { DashboardProvider, useDashboard } from '../features/posthog-dashboard/context/DashboardContext';
import { CanvasProvider } from '../features/posthog-dashboard/context/CanvasContext';
import { Header } from '../features/posthog-dashboard/components/Header';
import { ControlBar } from '../features/posthog-dashboard/components/ControlBar';
import { InfoPopover } from '../features/posthog-dashboard/components/InfoPopover';
import { AiPanel } from '../features/posthog-dashboard/components/AiPanel';
import { TierNote } from '../features/posthog-dashboard/components/TierNote';
import { Footer } from '../features/posthog-dashboard/components/Footer';
import { TrafficSection } from '../features/posthog-dashboard/sections/TrafficSection';
import { AdoptionSection } from '../features/posthog-dashboard/sections/AdoptionSection';
import { WorkflowSection } from '../features/posthog-dashboard/sections/WorkflowSection';
import type { DashboardState } from '../features/posthog-dashboard/data/metrics';

const PAGES: { key: DashboardState['activePage']; title: string; icon: JSX.Element }[] = [
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
  const { vm, setActivePage } = useDashboard();
  const { activePage } = vm.state;
  const page = PAGES.find((p) => p.key === activePage) ?? PAGES[0];

  return (
    <>
      <Header />
      <div className="shell">
        <aside className="sidebar">
          <h1 className="brandmark">
            <span className="bm-full">Hi Society</span>
            <span className="bm-mini">HS</span>
          </h1>
          <p className="brandmark-sub">Usage Analytics</p>
          <nav aria-label="Sections">
            <div className="nav-group">
              <div className="nav-label">Layers</div>
              {PAGES.map((p) => (
                <button
                  key={p.key}
                  className={`nav-item ${activePage === p.key ? 'on' : ''}`}
                  onClick={() => setActivePage(p.key)}
                  data-tip={p.title}
                >
                  <span className="ni-ic">{p.icon}</span>
                  <span className="ni-t">{p.title}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <main className="main">
          <div className="page-head">
            <h2>{page.title}</h2>
            <p className="page-sub">{vm.scopeLabel} · last {vm.state.date} days</p>
          </div>

          <ControlBar />
          <TierNote />

          {activePage === 'pgTraffic' && <TrafficSection />}
          {activePage === 'pgAdopt' && <AdoptionSection />}
          {activePage === 'pgFlows' && <WorkflowSection />}

          <Footer />
        </main>
      </div>
      <InfoPopover />
      <AiPanel />
    </>
  );
}

export function HiSocietyUsageDashboard() {
  return (
    <DashboardProvider projectCode="HS-01">
      <CanvasProvider>
        <DashboardLayout />
      </CanvasProvider>
    </DashboardProvider>
  );
}

export default HiSocietyUsageDashboard;
