import React, { useState, useRef, useEffect } from "react";
import { DevicePlatform } from "../../types";
import { SiteLookupItem } from "../../api/types";
import { customRangeLabel, daysBetween } from "../../data/savedView";
// import { LiveApiBadge } from './DashboardStates';

interface FilterBarProps {
  range: number;
  /** The applied range is a custom one (so no preset is highlighted), e.g. after a page refresh. */
  rangeIsCustom?: boolean;
  rangeLabel: string;
  rangeFrom: string;
  rangeTo: string;
  onSetRange: (days: number, label: string) => void;
  onSetCustomRange: (
    from: string,
    to: string,
    days: number,
    label: string
  ) => void;
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
  residentSegment?: "all" | "pre" | "post";
  onSelectResidentSegment?: (segment: "all" | "pre" | "post") => void;
  // Admin scope (Tower Admin vs Super Admin) — Godrej-only, UI display filter.
  // PROPOSED: there is no confirmed backend field to scope real data by this
  // dimension yet, so selecting a tier here does not change the numbers shown.
  showAdminScope?: boolean;
  adminScope?: "all" | "tower" | "super";
  onSelectAdminScope?: (scope: "all" | "tower" | "super") => void;
  // Society dropdown (the residential dashboards whose app stamps the society: Runwal Connect / Realty,
  // Godrej, K Raheja, La Circle): the user's Hi Society societies, as in the Hi Society header.
  // "all" = every society. Hidden unless showSocietyFilter.
  showSocietyFilter?: boolean;
  societies?: SiteLookupItem[];
  selectedSocietyId?: string;
  onSelectSociety?: (societyId: string) => void;
  isSocietiesLoading?: boolean;
  // Manual refresh — re-fetches live data for whichever page is on screen.
  showRefresh?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  range,
  rangeIsCustom = false,
  rangeLabel,
  rangeFrom,
  rangeTo,
  onSetRange,
  onSetCustomRange,
  sites,
  selectedSiteId,
  onSelectSite,
  isSitesLoading,
  showSocietyFilter = false,
  societies = [],
  selectedSocietyId = "all",
  onSelectSociety,
  isSocietiesLoading = false,
  dev,
  onSelectDev,
  prev,
  onTogglePrev,
  recentlyOnlineCount,
  isFetching,
  isError,
  generatedAt,
  showResidentSegment = false,
  residentSegment = "all",
  onSelectResidentSegment,
  showAdminScope = false,
  adminScope = "all",
  onSelectAdminScope,
  showRefresh = true,
  onRefresh,
  isRefreshing = false,
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(rangeFrom);
  const [customTo, setCustomTo] = useState(rangeTo);
  const [isCustomApplied, setIsCustomApplied] = useState(rangeIsCustom);
  const datePopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomFrom(rangeFrom);
    setCustomTo(rangeTo);
  }, [rangeFrom, rangeTo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePopRef.current &&
        !datePopRef.current.contains(event.target as Node)
      ) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Issue 5464: an end date before the chosen start date blanks the start date (and a start date after
  // the chosen end date blanks the end date), so the range is picked again instead of silently
  // keeping a start that no longer fits. Apply stays off until both dates are set.
  const handleCustomFromChange = (value: string) => {
    const from = value > todayYmd() ? todayYmd() : value;
    setCustomFrom(from);
    if (from && customTo && customTo < from) setCustomTo("");
    setIsCustomApplied(false);
  };
  const handleCustomToChange = (value: string) => {
    const to = value > todayYmd() ? todayYmd() : value;
    setCustomTo(to);
    if (to && customFrom && to < customFrom) setCustomFrom("");
    setIsCustomApplied(false);
  };

  const handleApplyCustom = () => {
    if (!customFrom || !customTo || customFrom > customTo) return;
    // The dashboard has no data past today, so a range never ends after it.
    const today = todayYmd();
    const fromYmd = customFrom > today ? today : customFrom;
    const toYmd = customTo > today ? today : customTo;
    setCustomFrom(fromYmd);
    setCustomTo(toYmd);
    setIsCustomApplied(true);
    onSetCustomRange(fromYmd, toYmd, daysBetween(fromYmd, toYmd), customRangeLabel(fromYmd, toYmd));
    setIsDateOpen(false);
  };

  const handlePresetSelect = (days: number, label: string) => {
    setIsCustomApplied(false);
    onSetRange(days, label);
    setIsDateOpen(false);
  };

  return (
    <div className="filterbar">
      <div className={`daterange ${isDateOpen ? "open" : ""}`} ref={datePopRef}>
        <button
          type="button"
          className="ctrl"
          id="dateRangeBtn"
          onClick={() => {
            // Opening starts from the applied range, not from dates half-picked and left last time.
            if (!isDateOpen) {
              setCustomFrom(rangeFrom);
              setCustomTo(rangeTo);
            }
            setIsDateOpen(!isDateOpen);
          }}
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
                className={`dr-preset ${range === 7 && !isCustomApplied ? "on" : ""}`}
                onClick={() => handlePresetSelect(7, "Last 7 days")}
              >
                Last 7 days
              </button>
              <button
                type="button"
                className={`dr-preset ${range === 30 && !isCustomApplied ? "on" : ""}`}
                onClick={() => handlePresetSelect(30, "Last 30 days")}
              >
                Last 30 days
              </button>
              <button
                type="button"
                className={`dr-preset ${range === 90 && !isCustomApplied ? "on" : ""}`}
                onClick={() => handlePresetSelect(90, "Last 90 days")}
              >
                Last 90 days
              </button>
            </div>
            <div className="dr-custom">
              <div className="dr-custom-label">Custom range</div>
              <div className="dr-custom-row">
                <input
                  type="date"
                  aria-label="Start date"
                  max={todayYmd()}
                  value={customFrom}
                  onChange={(e) => handleCustomFromChange(e.target.value)}
                />
                <span className="dr-to">–</span>
                <input
                  type="date"
                  aria-label="End date"
                  max={todayYmd()}
                  value={customTo}
                  onChange={(e) => handleCustomToChange(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={`dr-apply ${isCustomApplied ? "applied" : ""}`}
                onClick={handleApplyCustom}
                disabled={!customFrom || !customTo}
              >
                {isCustomApplied ? "Range applied ✓" : "Apply custom range"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showSocietyFilter && (
        <label className="ctrl" title="Society">
          <span className="ic">🏢</span>
          <select
            aria-label="Society"
            value={selectedSocietyId}
            onChange={(e) => onSelectSociety?.(e.target.value)}
            disabled={isSocietiesLoading}
          >
            <option value="all">
              {isSocietiesLoading ? "Loading societies…" : "All Societies"}
            </option>
            {societies.map((society) => (
              <option key={society.id} value={society.id}>
                {society.name}
              </option>
            ))}
          </select>
          <span className="chev">▾</span>
        </label>
      )}

      {/* Society / Project dropdown — commented out for now.
      <label className="ctrl" title="Society / Project">
        <span className="ic">🏢</span>
        <select
          value={selectedSiteId}
          onChange={(e) => onSelectSite(e.target.value)}
          disabled={isSitesLoading}
        >
          <option value="all">All Societies</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <span className="chev">▾</span>
      </label>
      */}

      {/* Admin Scope toggle (All admins / Tower Admin / Super Admin) — commented out for now.
      {showAdminScope && (
        <div className="devtoggle" id="scopeToggle" title="Admin scope">
          <button
            type="button"
            className={adminScope === 'all' ? 'on' : ''}
            onClick={() => onSelectAdminScope?.('all')}
          >
            All admins
          </button>
          <button
            type="button"
            className={adminScope === 'tower' ? 'on' : ''}
            onClick={() => onSelectAdminScope?.('tower')}
            title="Tower/wing admins — access limited to their own tower or wing"
          >
            Tower Admin
          </button>
          <button
            type="button"
            className={adminScope === 'super' ? 'on' : ''}
            onClick={() => onSelectAdminScope?.('super')}
            title="Super admins — access to the whole society, all towers/wings"
          >
            Super Admin
          </button>
        </div>
      )}
      */}

      {showResidentSegment && (
        <div className="devtoggle" id="residentToggle" title="Resident Segment">
          <button
            type="button"
            className={residentSegment === "all" ? "on" : ""}
            onClick={() => onSelectResidentSegment?.("all")}
          >
            All residents
          </button>
          <button
            type="button"
            className={residentSegment === "pre" ? "on" : ""}
            onClick={() => onSelectResidentSegment?.("pre")}
          >
            Post Sales
          </button>
          <button
            type="button"
            className={residentSegment === "post" ? "on" : ""}
            onClick={() => onSelectResidentSegment?.("post")}
          >
            Post Possession
          </button>
        </div>
      )}

      <div className="devtoggle" id="devToggle" title="Device Platform">
        <button
          type="button"
          data-dev="all"
          className={dev === "all" ? "on" : ""}
          onClick={() => onSelectDev("all")}
        >
          All
        </button>
        <button
          type="button"
          data-dev="ios"
          className={dev === "ios" ? "on" : ""}
          onClick={() => onSelectDev("ios")}
          title="iOS"
        >
          iOS
        </button>
        <button
          type="button"
          data-dev="android"
          className={dev === "android" ? "on" : ""}
          onClick={() => onSelectDev("android")}
          title="Android"
        >
          Android
        </button>
      </div>

      {/* <button
        type="button"
        className={`ctrl ${prev ? 'toggle-on' : ''}`}
        id="prevBtn"
        onClick={onTogglePrev}
      >
        <span className="ic">↺</span> Previous period {prev ? '✓' : ''}
      </button> */}

      {showRefresh && (
        <>
          <style>{`
            @keyframes filterbar-refresh-spin { to { transform: rotate(360deg); } }
          `}</style>
          <button
            type="button"
            className="ctrl"
            id="refreshBtn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh live data"
            aria-label="Refresh live data"
          >
            <span
              className="ic"
              style={
                isRefreshing
                  ? {
                      display: "inline-block",
                      animation: "filterbar-refresh-spin 0.8s linear infinite",
                    }
                  : undefined
              }
            >
              ⟳
            </span>{" "}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </>
      )}

      <div className="spacer"></div>

      {/* <LiveApiBadge
        isFetching={isFetching}
        isError={isError}
        generatedAt={generatedAt}
      /> */}

      <span
        className="pill"
        title="People active in the last 30 minutes. Follows the society, segment and platform filters, not the date range."
      >
        <span className="dot"></span>
        <span id="liveCount">
          {recentlyOnlineCount > 0
            ? `${recentlyOnlineCount.toLocaleString()} recently online`
            : "Live Activity Active"}
        </span>
      </span>
    </div>
  );
};
