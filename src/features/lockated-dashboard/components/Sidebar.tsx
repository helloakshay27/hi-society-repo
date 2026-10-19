import React from 'react';
import type { ActivePage } from '../data/types';

interface SidebarProps {
  currentPage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage }) => {
  return (
    <aside className="sidebar">
      <h1 className="brandmark">
        <span className="bm-full">Lockated</span>
        <span className="bm-mini">LK</span>
      </h1>
      <p className="brandmark-sub">Lockated &middot; Resident App</p>

      <nav aria-label="Sections">
        <div className="nav-group">
          <div className="nav-label">Layers</div>

          <button
            type="button"
            id="nav-pgTraffic"
            className={`nav-item ${currentPage === 'pgTraffic' ? 'on' : ''}`}
            data-page="pgTraffic"
            data-tip="Traffic &amp; Session"
            onClick={() => onSelectPage('pgTraffic')}
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
                <path d="M2.4 12.6 6.6 7.4l3.4 3.1 4.1-5.4 3.5 4.3" />
                <path d="M2.4 16.4h15.2" />
              </svg>
            </span>
            <span className="ni-t">Traffic &amp; Session</span>
          </button>

          <button
            type="button"
            id="nav-pgAdopt"
            className={`nav-item ${currentPage === 'pgAdopt' ? 'on' : ''}`}
            data-page="pgAdopt"
            data-tip="Adoption &amp; Engagement"
            onClick={() => onSelectPage('pgAdopt')}
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
                <circle cx="7.6" cy="6.8" r="2.9" />
                <path d="M2.6 16.6c0-2.7 2.2-4.6 5-4.6s5 1.9 5 4.6" />
                <path d="M13.4 4.3a2.9 2.9 0 0 1 0 5.4M14.6 12.4c1.8.5 3 1.9 3 4.2" />
              </svg>
            </span>
            <span className="ni-t">Adoption &amp; Engagement</span>
          </button>

          <button
            type="button"
            id="nav-pgFlows"
            className={`nav-item ${currentPage === 'pgFlows' ? 'on' : ''}`}
            data-page="pgFlows"
            data-tip="Workflow Usage"
            onClick={() => onSelectPage('pgFlows')}
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
                <path d="M10 2.4 17.4 6 10 9.6 2.6 6Z" />
                <path d="M2.6 10 10 13.6 17.4 10" />
                <path d="M2.6 14 10 17.6 17.4 14" />
              </svg>
            </span>
            <span className="ni-t">Workflow Usage</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};
