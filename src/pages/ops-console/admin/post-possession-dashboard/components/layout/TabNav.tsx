import React from 'react';
import { TABS } from '../../data/mockData';
import { useDashboard } from '../../context/DashboardContext';
import type { PostPossessionTab } from '../../api';
import type { TabId } from '../../types';

const TAB_BADGE_PATHS: Partial<
  Record<TabId, { tab: PostPossessionTab; path: string[] }>
> = {
  't-lb': { tab: 'allTowers', path: ['towers'] },
  't-op': { tab: 'helpdesk', path: ['total_tickets'] },
  't-sc': { tab: 'security', path: ['visitors_today', 'total'] },
  't-st': { tab: 'staff', path: ['active_staff_on_record'] },
  't-cl': { tab: 'club', path: ['total_members'] },
  't-ft': { tab: 'fitout', path: ['total_requests'] },
  't-pk': { tab: 'parking', path: ['total_vehicles'] },
};

function getBadgeCount(
  tabId: TabId,
  tabBadgeApi: ReturnType<typeof useDashboard>['tabBadgeApi']
): string | null {
  const source = TAB_BADGE_PATHS[tabId];
  if (!source) return null;
  const endpoint = tabBadgeApi[source.tab];
  if (!endpoint?.data || endpoint.error) return null;

  let value: unknown = endpoint.data;
  for (const key of source.path) {
    if (typeof value !== 'object' || value === null || !(key in value)) return null;
    value = (value as Record<string, unknown>)[key];
  }

  const count = Array.isArray(value)
    ? value.length
    : typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : NaN;
  return Number.isFinite(count) && count >= 0
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(count)
    : null;
}

export const TabNav: React.FC = () => {
  const { activeTab, setActiveTab, tabBadgeApi } = useDashboard();

  return (
    <nav className="tnav">
      <div className="tnav-inner">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const badge = getBadgeCount(tab.id, tabBadgeApi);
          return (
            <button
              key={tab.id}
              type="button"
              className={`tab${activeTab === tab.id ? ' on' : ''}`}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
            >
              <Icon size={16} strokeWidth={1.8} />
              {tab.label}
              {badge !== null && <span className="tbc">{badge}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
