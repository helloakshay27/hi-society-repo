/**
 * Recent Activity, moved out of the left navigation to a button at the top right. The panel holds the same
 * live list and the same .xlsx download as before (RecentActivitySidebar), with the page's filters. The
 * list is read only while the panel is open.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { DashboardFilters } from '../../api/types';
import { RecentActivitySidebar } from './RecentActivitySidebar';

export const RecentActivityButton: React.FC<{ filters: DashboardFilters; sitesSettled?: boolean }> = ({ filters, sitesSettled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="ra-wrap" ref={ref}>
      <button
        type="button"
        className={`ra-btn${open ? ' on' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title="Recent activity"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="10" cy="10" r="7.2" />
          <path d="M10 6v4.2l2.8 1.8" />
        </svg>
        <span>Recent activity</span>
      </button>
      {open && (
        <div className="ra-panel" role="dialog" aria-label="Recent activity">
          <RecentActivitySidebar filters={filters} sitesSettled={sitesSettled} />
        </div>
      )}
    </div>
  );
};
