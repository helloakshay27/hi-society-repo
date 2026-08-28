import React, { useState } from 'react';
import {
  CalendarDays,
  Settings,
  Search,
  ChevronDown,
  Award,
  Flag,
} from 'lucide-react';
import { TicketsDashboardDateRange } from './types';

export type DashboardTab = 'tickets' | 'utility' | 'escalation' | 'visitor';

const SECTION_PILLS: { key: DashboardTab; label: string }[] = [
  { key: 'tickets', label: 'Tickets' },
  { key: 'utility', label: 'Utility' },
  { key: 'escalation', label: 'Escalation' },
  { key: 'visitor', label: 'Visitor' },
];

const toInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatRangeLabel = (start: Date, end: Date): string => {
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return `${fmt(start)} - ${fmt(end)}`;
};

interface DashboardTopNavProps {
  dateRange: TicketsDashboardDateRange;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  goldenActive?: boolean;
  onGoldenToggle?: () => void;
  redFlagActive?: boolean;
  onRedFlagToggle?: () => void;
}

/**
 * Header matching FM Matrix /dashboard-revamp section chrome:
 * title bar → Tickets / Utility / Escalation / Visitor pills → Golden / Red Flag.
 * No duplicate module row (Maintenance / Safety / …).
 */
export const DashboardTopNav: React.FC<DashboardTopNavProps> = ({
  dateRange,
  onStartDateChange,
  onEndDateChange,
  activeTab,
  onTabChange,
  goldenActive = false,
  onGoldenToggle,
  redFlagActive = false,
  onRedFlagToggle,
}) => {
  const [periodOpen, setPeriodOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 bg-brand-bg">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-brand-border bg-white px-6 py-4">
        <h1 className="text-brand-h2 font-bold text-brand-text">Dashboard View</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-brand-body-4 text-brand-text-light md:inline">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-brand-body-4 font-semibold text-white hover:bg-brand-hover"
            >
              <CalendarDays className="h-4 w-4" />
              {formatRangeLabel(dateRange.startDate, dateRange.endDate)}
              <ChevronDown className="h-4 w-4" />
            </button>
            {periodOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-lg border border-brand-border bg-white p-3 shadow-system-md">
                <div className="mb-2 text-brand-caption font-semibold text-brand-text">Date range</div>
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-brand-caption text-brand-text-light">
                    Start
                    <input
                      type="date"
                      value={toInputValue(dateRange.startDate)}
                      max={toInputValue(dateRange.endDate)}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="rounded-md border border-brand-border px-2 py-1.5 text-brand-body-4 text-brand-text"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-brand-caption text-brand-text-light">
                    End
                    <input
                      type="date"
                      value={toInputValue(dateRange.endDate)}
                      min={toInputValue(dateRange.startDate)}
                      max={toInputValue(new Date())}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="rounded-md border border-brand-border px-2 py-1.5 text-brand-body-4 text-brand-text"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setPeriodOpen(false)}
                    className="mt-1 rounded-full bg-brand px-3 py-1.5 text-brand-caption font-semibold text-white hover:bg-brand-hover"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-border text-brand-text hover:bg-brand-light"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Search"
            title="Search"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-border text-brand-text hover:bg-brand-light"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Section pills only — Tickets / Utility / Escalation / Visitor */}
      <div className="px-6">
        <div className="flex flex-wrap gap-1.5 pb-3 pt-3">
          {SECTION_PILLS.map((pill) => {
            const active = pill.key === activeTab;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => onTabChange(pill.key)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-brand-caption font-semibold transition-colors ${
                  active
                    ? 'border-brand bg-brand text-white'
                    : 'border-brand-sidebar bg-white text-brand-green hover:bg-brand-light'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'tickets' && (
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <button
              type="button"
              onClick={onGoldenToggle}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-brand-caption font-medium transition-colors ${
                goldenActive
                  ? 'border-brand-warning bg-brand-warning text-[#5C4A00]'
                  : 'border-brand-border bg-white text-brand-green'
              }`}
            >
              <Award className="h-3 w-3" />
              Golden
            </button>
            <button
              type="button"
              onClick={onRedFlagToggle}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-brand-caption font-medium transition-colors ${
                redFlagActive
                  ? 'border-brand bg-brand text-white'
                  : 'border-brand-border bg-white text-brand-green'
              }`}
            >
              <Flag className="h-3 w-3" />
              Red Flag
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
