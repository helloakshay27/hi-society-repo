import React, { useState, useRef, useEffect } from 'react';
import type { Device, AdminScope } from '../data/types';
import { PROJECTS, RANGE_LABELS } from '../data/constants';
import type { Site } from '../api/queries';

interface FilterBarProps {
  range: number;
  rangeLabel: string;
  rangeFrom: string;
  rangeTo: string;
  onSelectRange: (days: number, label: string) => void;
  onApplyCustomRange: (from: string, to: string, days: number, label: string) => void;
  project: string;
  onChangeProject: (project: string) => void;
  dev: Device;
  onChangeDev: (dev: Device) => void;
  scope: AdminScope;
  onChangeScope: (scope: AdminScope) => void;
  prev: boolean;
  onTogglePrev: () => void;
  recentlyOnlineCount: number;
  sites?: Site[];
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  range,
  rangeLabel,
  rangeFrom,
  rangeTo,
  onSelectRange,
  onApplyCustomRange,
  project,
  onChangeProject,
  dev,
  onChangeDev,
  scope,
  onChangeScope,
  prev,
  onTogglePrev,
  recentlyOnlineCount,
  sites,
  isRefreshing,
  onRefresh
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(rangeFrom);
  const [customTo, setCustomTo] = useState(rangeTo);
  const [isCustomApplied, setIsCustomApplied] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) return;
    const diffMs = new Date(customTo).getTime() - new Date(customFrom).getTime();
    const days = Math.max(1, Math.round(diffMs / 86400000) + 1);

    const fmt = (dStr: string) => {
      const dt = new Date(dStr);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const label = `${fmt(customFrom)} – ${fmt(customTo)}`;

    setIsCustomApplied(true);
    onApplyCustomRange(customFrom, customTo, days, label);
    setIsDateOpen(false);
  };

  // Build project options list
  const projectOptions = React.useMemo(() => {
    if (sites && sites.length > 0) {
      return ['All Projects', ...sites.map((s) => s.name)];
    }
    return PROJECTS;
  }, [sites]);

  return (
    <div className="filterbar">
      {/* Date Range Picker */}
      <div className={`daterange ${isDateOpen ? 'open' : ''}`} ref={dateRef}>
        <button
          type="button"
          className="ctrl"
          id="dateRangeBtn"
          onClick={() => setIsDateOpen((prev) => !prev)}
        >
          <span className="ic">&#128197;</span>
          <span id="dateRangeLabel">{rangeLabel}</span>
          <span className="chev">&#9662;</span>
        </button>

        <div className="daterange-pop" id="dateRangePop">
          <div className="dr-presets">
            {[7, 30, 90].map((days) => (
              <button
                key={`preset-${days}`}
                type="button"
                className={`dr-preset ${range === days && !isCustomApplied ? 'on' : ''}`}
                onClick={() => {
                  setIsCustomApplied(false);
                  onSelectRange(days, RANGE_LABELS[days]);
                  setIsDateOpen(false);
                }}
              >
                {RANGE_LABELS[days]}
              </button>
            ))}
          </div>

          <div className="dr-custom">
            <div className="dr-custom-label">Custom range</div>
            <div className="dr-custom-row">
              <input
                type="date"
                id="dateFrom"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setIsCustomApplied(false);
                }}
              />
              <span className="dr-to">&ndash;</span>
              <input
                type="date"
                id="dateTo"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setIsCustomApplied(false);
                }}
              />
            </div>
            <button
              type="button"
              className={`dr-apply ${isCustomApplied ? 'applied' : ''}`}
              id="dateApplyBtn"
              onClick={handleApplyCustom}
            >
              {isCustomApplied ? 'Range applied ✓' : 'Apply custom range'}
            </button>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <label className="ctrl">
        <span className="ic">&#127959;</span>
        <select
          id="projectSel"
          value={project}
          onChange={(e) => onChangeProject(e.target.value)}
        >
          {projectOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <span className="chev">&#9662;</span>
      </label>

      {/* Platform Toggle */}
      <div className="devtoggle" id="devToggle" title="Platform">
        <button
          type="button"
          data-dev="all"
          className={dev === 'all' ? 'on' : ''}
          onClick={() => onChangeDev('all')}
        >
          All
        </button>
        <button
          type="button"
          data-dev="ios"
          title="iOS only"
          className={dev === 'ios' ? 'on' : ''}
          onClick={() => onChangeDev('ios')}
        >
          iOS
        </button>
        <button
          type="button"
          data-dev="android"
          title="Android only"
          className={dev === 'android' ? 'on' : ''}
          onClick={() => onChangeDev('android')}
        >
          Android
        </button>
      </div>

      {/* Admin Scope Toggle */}
      <div className="scopetoggle" id="scopeToggle" title="Admin Scope (proposed)">
        <button
          type="button"
          data-scope="all"
          className={scope === 'all' ? 'on' : ''}
          onClick={() => onChangeScope('all')}
        >
          All
        </button>
        <button
          type="button"
          data-scope="tower"
          title="Tower Admin"
          className={scope === 'tower' ? 'on' : ''}
          onClick={() => onChangeScope('tower')}
        >
          Tower
        </button>
        <button
          type="button"
          data-scope="super"
          title="Super Admin"
          className={scope === 'super' ? 'on' : ''}
          onClick={() => onChangeScope('super')}
        >
          Super
        </button>
      </div>

      {/* Previous Period Toggle */}
      <button
        type="button"
        className={`ctrl ${prev ? 'toggle-on' : ''}`}
        id="prevBtn"
        onClick={onTogglePrev}
      >
        <span className="ic">&#8634;</span> Previous period {prev ? '✓' : ''}
      </button>

      {/* Optional Refresh Button */}
      {onRefresh && (
        <button
          type="button"
          className="ctrl"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh analytics data"
          style={{ opacity: isRefreshing ? 0.6 : 1 }}
        >
          <span
            className="ic"
            style={{
              display: 'inline-block',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          >
            &#8635;
          </span>
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      )}

      <div className="spacer" />

      {/* Live Active Pill */}
      <span className="pill">
        <span className="dot" />
        <span id="liveCount">{recentlyOnlineCount.toLocaleString()} recently active</span>
      </span>
    </div>
  );
};
