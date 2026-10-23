import React, { useMemo } from 'react';
import { PageId } from '../../posthog-runwal-dashboard/types';
import { DashboardFilters } from '../../posthog-runwal-dashboard/api/types';
import { RecentActivitySidebar } from '../../posthog-runwal-dashboard/components/common/RecentActivitySidebar';

interface SideBarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  filters: DashboardFilters;
  sitesSettled?: boolean;
}

const NAV_ITEMS: { page: PageId; label: string; icon: React.ReactNode }[] = [
  {
    page: 'pgTraffic',
    label: 'Traffic & Session',
    icon: (
      <>
        <path d="M2.4 12.6 6.6 7.4l3.4 3.1 4.1-5.4 3.5 4.3" />
        <path d="M2.4 16.4h15.2" />
      </>
    ),
  },
  {
    page: 'pgAdopt',
    label: 'Adoption & Engagement',
    icon: (
      <>
        <circle cx="7.6" cy="6.8" r="2.9" />
        <path d="M2.6 16.6c0-2.7 2.2-4.6 5-4.6s5 1.9 5 4.6" />
        <path d="M13.4 4.3a2.9 2.9 0 0 1 0 5.4M14.6 12.4c1.8.5 3 1.9 3 4.2" />
      </>
    ),
  },
  {
    page: 'pgFlows',
    label: 'Workflow Usage',
    icon: (
      <>
        <path d="M10 2.4 17.4 6 10 9.6 2.6 6Z" />
        <path d="M2.6 10 10 13.6 17.4 10" />
        <path d="M2.6 14 10 17.6 17.4 14" />
      </>
    ),
  },
];

export const SideBar: React.FC<SideBarProps> = ({ activePage, onSelectPage, filters, sitesSettled }) => {
  // Recent Activity hits …/fm/adoption/recent_active_users?app_id=29&device_type=mobile&from&to&limit=10
  // — device_type is pinned to the lowercase "mobile" the endpoint was specified with.
  const recentActivityFilters = useMemo<DashboardFilters>(() => ({ ...filters, deviceType: 'mobile' }), [filters]);

  return (
    <aside className="sidebar">
      <h1 className="brandmark">
        <span className="bm-full">Hi Society</span>
        <span className="bm-mini">HS</span>
      </h1>
      <p className="brandmark-sub">Hi Society · Accounting module</p>

      <nav aria-label="Sections">
        <div className="nav-group">
          <div className="nav-label">Layers</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              type="button"
              className={`nav-item ${activePage === item.page ? 'on' : ''}`}
              onClick={() => onSelectPage(item.page)}
              data-tip={item.label}
            >
              <span className="ni-ic">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {item.icon}
                </svg>
              </span>
              <span className="ni-t">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <RecentActivitySidebar filters={recentActivityFilters} sitesSettled={sitesSettled} />
    </aside>
  );
};
