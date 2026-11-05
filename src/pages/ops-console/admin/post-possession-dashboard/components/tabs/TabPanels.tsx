import React, { useEffect, useMemo } from 'react';
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
import {
  POST_POSSESSION_TAB_BY_DASHBOARD_TAB,
  type PostPossessionTab,
} from '../../api';
import { getPostPossessionChartConfigs } from '../../apiView';
import { TABS } from '../../data/mockData';
import { syncMyDashboardFromServer, useMyDashboardStore } from '../../store/myDashboardStore';

const TAB_HTML: Partial<Record<TabId, string>> = {
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
  const { activeTab, getCharts, initializedTabs, postPossessionApi } = useDashboard();
  const isActive = activeTab === id;
  const shouldMount = initializedTabs.has(id);
  const apiTab: PostPossessionTab | undefined = POST_POSSESSION_TAB_BY_DASHBOARD_TAB[id];
  const apiState = apiTab ? postPossessionApi[apiTab] : undefined;
  const charts = useMemo(
    () => (apiTab ? getPostPossessionChartConfigs(apiTab, apiState) : getCharts(id)),
    [apiState, apiTab, getCharts, id]
  );

  if (!shouldMount) return null;

  return (
    <section id={id} className={`panel${isActive ? ' on' : ''}`}>
      <TabHtmlContent html={TAB_HTML[id] ?? ''} charts={charts} apiTab={apiTab} apiState={apiState} />
    </section>
  );
}

/** One module's saved cards inside My Dashboard: the module's full tab, cut down to the saved cards. */
function MyDashboardGroup({ apiTab, chartIds }: { apiTab: PostPossessionTab; chartIds: string[] }) {
  const { postPossessionApi } = useDashboard();
  const tabId = (Object.keys(POST_POSSESSION_TAB_BY_DASHBOARD_TAB) as TabId[]).find(
    (id) => POST_POSSESSION_TAB_BY_DASHBOARD_TAB[id] === apiTab
  );
  const apiState = postPossessionApi[apiTab];
  const charts = useMemo(() => getPostPossessionChartConfigs(apiTab, apiState), [apiTab, apiState]);
  const codes = useMemo(() => new Set(chartIds), [chartIds.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const label = TABS.find((tab) => tab.id === tabId)?.label ?? apiTab;
  if (!tabId) return null;

  return (
    <div className="pp-my-group">
      <div className="pp-my-heading">{label}</div>
      <TabHtmlContent
        html={TAB_HTML[tabId] ?? ''}
        charts={charts}
        apiTab={apiTab}
        apiState={apiState}
        myDashboardCodes={codes}
        className="pp-tab-content pp-my-content"
      />
    </div>
  );
}

export const MyDashboardTab: React.FC = () => {
  const { activeTab, initializedTabs } = useDashboard();
  const cards = useMyDashboardStore((state) => state.cards);
  const isActive = activeTab === 't-my';

  // Pull saved cards from /dashboard_layouts whenever My Dashboard is opened
  useEffect(() => {
    if (isActive) void syncMyDashboardFromServer();
  }, [isActive]);

  if (!initializedTabs.has('t-my')) return null;

  const groups = (Object.keys(POST_POSSESSION_TAB_BY_DASHBOARD_TAB) as TabId[])
    .map((id) => POST_POSSESSION_TAB_BY_DASHBOARD_TAB[id] as PostPossessionTab)
    .map((apiTab) => ({ apiTab, chartIds: cards.filter((card) => card.tab === apiTab).map((card) => card.chartId) }))
    .filter((group) => group.chartIds.length > 0);

  return (
    <section id="t-my" className={`panel${isActive ? ' on' : ''}`}>
      {groups.length === 0 ? (
        <div className="pp-my-empty">
          <div className="pp-my-empty-title">Nothing in My Dashboard yet</div>
          <div className="pp-my-empty-sub">
            Hover over any card in the other tabs and click the + button to add it here.
          </div>
        </div>
      ) : (
        groups.map((group) => <MyDashboardGroup key={group.apiTab} apiTab={group.apiTab} chartIds={group.chartIds} />)
      )}
    </section>
  );
};

export const TabPanels: React.FC = () => (
  <>
    <MyDashboardTab />
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
