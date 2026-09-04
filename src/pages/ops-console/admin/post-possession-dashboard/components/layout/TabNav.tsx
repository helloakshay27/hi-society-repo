import React from 'react';
import { TABS } from '../../data/mockData';
import { useDashboard } from '../../context/DashboardContext';
import type { TabId } from '../../types';

export const TabNav: React.FC = () => {
  const { activeTab, setActiveTab } = useDashboard();

  return (
    <nav className="tnav">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            className={`tab${activeTab === tab.id ? ' on' : ''}`}
            data-tab={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
          >
            <Icon size={12} />
            {tab.label}
            {tab.badge && (
              <span className={`tbc${tab.badgeVariant === 'a' ? ' a' : tab.badgeVariant === 'ok' ? ' ok' : ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
