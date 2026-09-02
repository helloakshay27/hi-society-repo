import React, { useMemo } from 'react';
import { TabHtmlContent } from '../shared/TabHtmlContent';
import { useDashboard } from '../../context/DashboardContext';
import type { TabId } from '../../types';
import { LEADERBOARDTAB_HTML } from './generated/LeaderboardTab';
import { OVERVIEWTAB_HTML } from './generated/OverviewTab';
import { HELPDESKTAB_HTML } from './generated/HelpdeskTab';
import { SECURITYTAB_HTML } from './generated/SecurityTab';
import { STAFFTAB_HTML } from './generated/StaffTab';
import { CLUBTAB_HTML } from './generated/ClubTab';
import { FITOUTTAB_HTML } from './generated/FitoutTab';
import { PARKINGTAB_HTML } from './generated/ParkingTab';
import { COMMUNITYTAB_HTML } from './generated/CommunityTab';

const TAB_HTML: Record<TabId, string> = {
  't-lb': LEADERBOARDTAB_HTML,
  't-ov': OVERVIEWTAB_HTML,
  't-op': HELPDESKTAB_HTML,
  't-sc': SECURITYTAB_HTML,
  't-st': STAFFTAB_HTML,
  't-cl': CLUBTAB_HTML,
  't-ft': FITOUTTAB_HTML,
  't-pk': PARKINGTAB_HTML,
  't-co': COMMUNITYTAB_HTML,
};

export const LeaderboardTab: React.FC = () => <TabPanel id="t-lb" />;
export const OverviewTab: React.FC = () => <TabPanel id="t-ov" />;
export const HelpdeskTab: React.FC = () => <TabPanel id="t-op" />;
export const SecurityTab: React.FC = () => <TabPanel id="t-sc" />;
export const StaffTab: React.FC = () => <TabPanel id="t-st" />;
export const ClubTab: React.FC = () => <TabPanel id="t-cl" />;
export const FitoutTab: React.FC = () => <TabPanel id="t-ft" />;
export const ParkingTab: React.FC = () => <TabPanel id="t-pk" />;
export const CommunityTab: React.FC = () => <TabPanel id="t-co" />;

function TabPanel({ id }: { id: TabId }) {
  const { activeTab, getCharts, initializedTabs } = useDashboard();
  const isActive = activeTab === id;
  const shouldMount = initializedTabs.has(id);
  const charts = useMemo(() => getCharts(id), [getCharts, id]);

  if (!shouldMount) return null;

  return (
    <section id={id} className={`panel${isActive ? ' on' : ''}`}>
      <TabHtmlContent html={TAB_HTML[id]} charts={charts} />
    </section>
  );
}

export const TabPanels: React.FC = () => (
  <>
    <LeaderboardTab />
    <OverviewTab />
    <HelpdeskTab />
    <SecurityTab />
    <StaffTab />
    <ClubTab />
    <FitoutTab />
    <ParkingTab />
    <CommunityTab />
  </>
);
