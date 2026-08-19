import React from 'react';
import { CalendarDays, Settings, Search, ChevronDown, Award, Flag } from 'lucide-react';
import { TicketsDashboardDateRange } from './types';

const toInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DashboardTopNavProps {
  dateRange: TicketsDashboardDateRange;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export const DashboardTopNav: React.FC<DashboardTopNavProps> = ({ dateRange, onStartDateChange, onEndDateChange }) => {
  return (
    <div className="sticky top-0 z-20 mb-6 rounded-lg border border-brand-border bg-white">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <h1 className="text-brand-h2 font-bold text-brand-text">Dashboard View</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-brand-body-4 text-brand-text-light md:inline">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>

          <label className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-brand-body-4 font-semibold text-white">
            <CalendarDays className="h-4 w-4" />
            <input
              type="date"
              value={toInputValue(dateRange.startDate)}
              max={toInputValue(dateRange.endDate)}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-[92px] bg-transparent text-brand-body-4 font-semibold text-white outline-none [color-scheme:dark]"
            />
            <span>&ndash;</span>
            <input
              type="date"
              value={toInputValue(dateRange.endDate)}
              min={toInputValue(dateRange.startDate)}
              max={toInputValue(new Date())}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-[92px] bg-transparent text-brand-body-4 font-semibold text-white outline-none [color-scheme:dark]"
            />
            <ChevronDown className="h-4 w-4" />
          </label>

          <button
            type="button"
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-border text-brand-text hover:bg-brand-light"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-border text-brand-text hover:bg-brand-light"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Module tabs — Tickets stands in for what would be "Transitioning" and is the active module here */}
      <div className="flex items-center gap-6 overflow-x-auto px-4 sm:px-6">
        <button
          type="button"
          className="flex-shrink-0 whitespace-nowrap border-b-2 border-brand px-1 py-3 text-brand-body-4 font-semibold text-brand"
        >
          Tickets
        </button>
      </div>

      {/* Section pill row */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-3 sm:px-6">
        <span className="rounded-full bg-brand px-4 py-1.5 text-brand-body-5 font-semibold text-white">Tickets</span>
        <span className="flex items-center gap-1.5 rounded-full border border-brand-sidebar bg-white px-3 py-1.5 text-brand-body-5 font-semibold text-brand-text-light">
          <Award className="h-3.5 w-3.5" />
          Golden
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-brand-sidebar bg-white px-3 py-1.5 text-brand-body-5 font-semibold text-brand-text-light">
          <Flag className="h-3.5 w-3.5" />
          Red Flag
        </span>
      </div>
    </div>
  );
};
