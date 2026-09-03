import React, { useState, useRef, useEffect } from 'react';
import { DevicePlatform } from '../../types';
import { SiteLookupItem } from '../../api/types';
import { LiveApiBadge } from './DashboardStates';

interface FilterBarProps {
  range: number;
  rangeLabel: string;
  rangeFrom: string;
  rangeTo: string;
  onSetRange: (days: number, label: string) => void;
  onSetCustomRange: (from: string, to: string, days: number, label: string) => void;
  sites: SiteLookupItem[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  isSitesLoading?: boolean;
  dev: DevicePlatform;
  onSelectDev: (dev: DevicePlatform) => void;
  prev: boolean;
  onTogglePrev: () => void;
  recentlyOnlineCount: number;
  isFetching?: boolean;
  isError?: boolean;
  generatedAt?: string;
  // Resident/sales-stage segment — only shown when the URL carries ?app_id=35.
  showResidentSegment?: boolean;
  residentSegment?: 'all' | 'pre' | 'post';
  onSelectResidentSegment?: (segment: 'all' | 'pre' | 'post') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  range,
  rangeLabel,
  rangeFrom,
  rangeTo,
  onSetRange,
  onSetCustomRange,
  sites,
  selectedSiteId,
  onSelectSite,
  isSitesLoading,
  dev,
  onSelectDev,
  prev,
  onTogglePrev,
  recentlyOnlineCount,
  isFetching,
  isError,
  generatedAt,
  showResidentSegment = false,
  residentSegment = 'all',
  onSelectResidentSegment,
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(rangeFrom);
  const [customTo, setCustomTo] = useState(rangeTo);
  const [isCustomApplied, setIsCustomApplied] = useState(false);
  const datePopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomFrom(rangeFrom);
    setCustomTo(rangeTo);
  }, [rangeFrom, rangeTo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePopRef.current && !datePopRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) return;
    const days = Math.max(
      1,
      Math.round(
        (new Date(customTo).getTime() - new Date(customFrom).getTime()) / 86400000
      ) + 1
    );
    const fmt = (d: string) => {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const label = `${fmt(customFrom)} – ${fmt(customTo)}`;
    setIsCustomApplied(true);
    onSetCustomRange(customFrom, customTo, days, label);
    setIsDateOpen(false);
  };

  const handlePresetSelect = (days: number, label: string) => {
    setIsCustomApplied(false);
    onSetRange(days, label);
    setIsDateOpen(false);
  };

  return (
    <div className="filterbar">
      <div className={`daterange ${isDateOpen ? 'open' : ''}`} ref={datePopRef}>
        <button
          type="button"
          className="ctrl"
          id="dateRangeBtn"
          onClick={() => setIsDateOpen(!isDateOpen)}
        >
          <span className="ic">📅</span>
          <span id="dateRangeLabel">{rangeLabel}</span>
          <span className="chev">▾</span>
        </button>

        {isDateOpen && (
          <div className="daterange-pop" id="dateRangePop">
            <div className="dr-presets">
              <button
                type="button"
                className={`dr-preset ${range === 7 && !isCustomApplied ? 'on' : ''}`}
                onClick={() => handlePresetSelect(7, 'Last 7 days')}
              >
                Last 7 days
              </button>
              <button
                type="button"
                className={`dr-preset ${range === 30 && !isCustomApplied ? 'on' : ''}`}
                onClick={() => handlePresetSelect(30, 'Last 30 days')}
              >
                Last 30 days
              </button>
              <button
                type="button"
                className={`dr-preset ${range === 90 && !isCustomApplied ? 'on' : ''}`}
                onClick={() => handlePresetSelect(90, 'Last 90 days')}
              >
                Last 90 days
              </button>
            </div>
            <div className="dr-custom">
              <div className="dr-custom-label">Custom range</div>
              <div className="dr-custom-row">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setIsCustomApplied(false);
                  }}
                />
                <span className="dr-to">–</span>
                <input
                  type="date"
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
                onClick={handleApplyCustom}
              >
                {isCustomApplied ? 'Range applied ✓' : 'Apply custom range'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showResidentSegment && (
        <div className="devtoggle" id="residentToggle" title="Resident Segment">
          <button
            type="button"
            className={residentSegment === 'all' ? 'on' : ''}
            onClick={() => onSelectResidentSegment?.('all')}
          >
            All residents
          </button>
          <button
            type="button"
            className={residentSegment === 'pre' ? 'on' : ''}
            onClick={() => onSelectResidentSegment?.('pre')}
          >
            Pre Sales
          </button>
          <button
            type="button"
            className={residentSegment === 'post' ? 'on' : ''}
            onClick={() => onSelectResidentSegment?.('post')}
          >
            Post Sales
          </button>
        </div>
      )}

      <div className="devtoggle" id="devToggle" title="Device Platform">
        <button
          type="button"
          data-dev="all"
          className={dev === 'all' ? 'on' : ''}
          onClick={() => onSelectDev('all')}
        >
          All
        </button>
        <button
          type="button"
          data-dev="ios"
          className={dev === 'ios' ? 'on' : ''}
          onClick={() => onSelectDev('ios')}
          title="iOS"
        >
          iOS
        </button>
        <button
          type="button"
          data-dev="android"
          className={dev === 'android' ? 'on' : ''}
          onClick={() => onSelectDev('android')}
          title="Android"
        >
          Android
        </button>
      </div>

      <button
        type="button"
        className={`ctrl ${prev ? 'toggle-on' : ''}`}
        id="prevBtn"
        onClick={onTogglePrev}
      >
        <span className="ic">↺</span> Previous period {prev ? '✓' : ''}
      </button>

      <div className="spacer"></div>

      <LiveApiBadge
        isFetching={isFetching}
        isError={isError}
        generatedAt={generatedAt}
      />

      <span className="pill">
        <span className="dot"></span>
        <span id="liveCount">
          {recentlyOnlineCount > 0
            ? `${recentlyOnlineCount.toLocaleString()} recently online`
            : 'Live Activity Active'}
        </span>
      </span>
    </div>
  );
};
