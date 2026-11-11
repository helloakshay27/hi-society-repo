import React from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from './components/layout/Header';
import { KpiStrip } from './components/layout/KpiStrip';
import { FilterBar } from './components/layout/FilterBar';
import { TabNav } from './components/layout/TabNav';
import { TabPanels } from './components/tabs/TabPanels';
import { DrillPanel, ToastStack } from './components/overlays/DrillPanel';
import { InfoPopover } from './components/overlays/InfoPopover';
import { AiCopilot } from './components/overlays/AiCopilot';
import './styles/post-possession-dashboard.css';

// A crash inside one tab (or the drill panel) shows an error message for that
// area only, and resets when another tab is opened, instead of blanking the page.
const GuardedPanels: React.FC = () => {
  const { activeTab } = useDashboard();
  return (
    <ErrorBoundary key={activeTab}>
      <TabPanels />
    </ErrorBoundary>
  );
};

export const PostPossessionDashboard: React.FC = () => {
  return (
    <DashboardProvider>
      <div className="pp-dashboard-root">
        <Header />
        <KpiStrip />
        <TabNav />
        <FilterBar />
        <main className="pg">
          <GuardedPanels />
        </main>
        <ErrorBoundary fallback={<></>}>
          <DrillPanel />
        </ErrorBoundary>
        <ToastStack />
        <InfoPopover />
        <AiCopilot />
      </div>
    </DashboardProvider>
  );
};

export default PostPossessionDashboard;
