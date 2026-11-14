import React from 'react';
import { DashboardFilters } from '../../api/types';
import { activityUserLabel, downloadActiveUsersExport } from '../../api/api';
import { useRecentActiveUsers } from '../../hooks/useDashboardAnalytics';
import { ExportSpinner, ExportStatus, useExportDownload } from './ExportProgress';

interface RecentActivitySidebarProps {
  filters: DashboardFilters;
  sitesSettled?: boolean;
}

function formatMinutesAgo(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

/**
 * Sidebar "Recent Activity" block — shared across every tenant dashboard
 * (Runwal, Lacircle, My Piramal, …) rather than duplicated per-SideBar, same
 * as FilterBar/InfoPopover. Lives inline in the sidebar itself (no separate
 * page/section): a label row with an inline download button for the full
 * `.xlsx` export, and the live `recent_active_users` event log directly beneath.
 */
export const RecentActivitySidebar: React.FC<RecentActivitySidebarProps> = ({
  filters,
  sitesSettled = true,
}) => {
  // The 10 newest events (one row per thing a user did, logins and logouts included), live.
  const { data, isLoading } = useRecentActiveUsers(filters, sitesSettled, 10);
  const exportJob = useExportDownload();
  const isDownloading = exportJob.busy;
  const users = data?.users ?? [];

  const handleDownload = () => exportJob.run((onPhase) => downloadActiveUsersExport(filters, onPhase));

  return (
    <div className="recent-activity">
      <div className="sidebar-divider" />
      <div className="recent-activity-head">
        <span className="recent-activity-label">Recent Activity</span>
        <button
          type="button"
          className="iconbtn recent-activity-download"
          onClick={handleDownload}
          disabled={isDownloading}
          title={isDownloading ? 'Preparing the download…' : 'Download user activity (.xlsx)'}
          aria-label="Download user activity"
          aria-busy={isDownloading}
        >
          {isDownloading ? <ExportSpinner /> : <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 3v9.4" />
            <path d="M6.2 9.2 10 13l3.8-3.8" />
            <path d="M3.5 16.2h13" />
          </svg>}
        </button>
      </div>
      <ExportStatus phase={exportJob.phase} startedAt={exportJob.startedAt} error={exportJob.error} />

      {isLoading ? (
        <div className="recent-activity-empty">Loading…</div>
      ) : users.length === 0 ? (
        <div className="recent-activity-empty">No recent activity yet.</div>
      ) : (
        <div className="recent-activity-list">
          {users.map((u, i) => (
            <div className="recent-activity-item" key={i}>
              <span className="recent-activity-name">{activityUserLabel(u)}</span>
              <span className="recent-activity-meta" title={u.path || undefined}>{u.path || '—'}</span>
              <span className="recent-activity-meta" title={u.last_event || undefined}>
                {u.last_event || '—'}
                {u.minutes_ago != null ? ` · ${formatMinutesAgo(u.minutes_ago)}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
