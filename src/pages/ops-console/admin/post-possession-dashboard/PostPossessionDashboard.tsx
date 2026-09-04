import React from 'react';
import { DashboardProvider } from './context/DashboardContext';
import { Header } from './components/layout/Header';
import { KpiStrip } from './components/layout/KpiStrip';
import { FilterBar } from './components/layout/FilterBar';
import { TabNav } from './components/layout/TabNav';
import { TabPanels } from './components/tabs/TabPanels';
import { DrillPanel, ToastStack } from './components/overlays/DrillPanel';
import { InfoPopover } from './components/overlays/InfoPopover';
import { AiCopilot } from './components/overlays/AiCopilot';
import './styles/post-possession-dashboard.css';

export const PostPossessionDashboard: React.FC = () => {
  return (
    <DashboardProvider>
      <div className="pp-dashboard-root">
        <Header />
        <KpiStrip />
        <FilterBar />
        <TabNav />
        <main className="pg">
          <TabPanels />
        </main>
        <DrillPanel />
        <ToastStack />
        <InfoPopover />
        <AiCopilot />
      </div>
    </DashboardProvider>
  );
};

export default PostPossessionDashboard;
