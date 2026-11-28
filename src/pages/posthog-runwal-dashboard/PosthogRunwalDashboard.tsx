import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageId, DevicePlatform } from "./types";
import { BM_DEFAULTS } from "./data/constants";
import { loadView, presetRange, saveView } from "./data/savedView";
import { DashboardProvider } from "./context/DashboardContext";
import { InfoPopover } from "./components/common/InfoPopover";
import { TopBar } from "./components/common/TopBar";
import { SideBar } from "./components/common/SideBar";
import { FilterBar } from "./components/common/FilterBar";
import { PreviousPeriodNote } from "./components/common/PreviousPeriodNote";
import { ReportSection, useReportNav } from "./components/common/ReportSection";
import { RecentActivityButton } from "./components/common/RecentActivityButton";
import { previousCoverage } from "./data/previousPeriod";
import { TrafficSessionPage } from "./components/pages/TrafficSessionPage";
import { AdoptionEngagementPage } from "./components/pages/AdoptionEngagementPage";
import { WorkflowUsagePage } from "./components/pages/WorkflowUsagePage";
import {
  useDashboardSites,
  useUserSocieties,
  useTrafficSession,
  useUserAccountSiteId,
} from "./hooks/useDashboardAnalytics";
import {
  clearDashboardScope,
  getAppIdFromUrl,
  pinDashboardScope,
  runwalApiPath,
  stripScopeFromUrl,
} from "./api/api";
import { DashboardFilters } from "./api/types";
import { getToken, getBaseUrlDomain } from "../../utils/auth";
import "./styles/dashboard.css";

function PosthogRunwalDashboardContent({
  fixedAppId,
}: {
  fixedAppId?: string;
}) {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("runwal-theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("runwal-nav") === "collapsed";
    } catch {
      return false;
    }
  });

  // Which Runwal app: fixed by the route (/runwal-connect-usage-dashboard = 12,
  // /runwal-enterprise-usage-dashboard = 35), or read once from an old
  // /runwal-usage-dashboard?app_id= link. It is pinned in memory and removed
  // from the address bar, so the code never shows in the URL.
  const appId = useMemo(() => {
    const id = fixedAppId ?? getAppIdFromUrl() ?? "12";
    pinDashboardScope({ appId: id });
    return id;
  }, [fixedAppId]);
  useEffect(() => {
    pinDashboardScope({ appId });
    stripScopeFromUrl();
    return () => clearDashboardScope();
  }, [appId]);

  // The view picked before a page refresh (date range, platform, society, segment, page), per app.
  const viewKey = `app-${appId}`;
  const [savedView] = useState(() => loadView(viewKey));

  // Load user/org accessible sites
  const {
    sites,
    sitesSettled,
    allSiteIds,
    isLoading: isSitesLoading,
  } = useDashboardSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");

  // Society dropdown (Runwal Connect and Realty): the logged-in user's Hi Society societies, the same list
  // as the Hi Society header's dropdown. "all" sends no society, so the numbers cover every society.
  const { data: societies = [], isLoading: isSocietiesLoading } = useUserSocieties();
  const [selectedSocietyId, setSelectedSocietyId] = useState<string>(savedView.societyId);
  // A society saved before the refresh that is no longer in the user's list goes back to All Societies.
  useEffect(() => {
    if (isSocietiesLoading || selectedSocietyId === "all") return;
    if (!societies.some((s) => s.id === selectedSocietyId)) setSelectedSocietyId("all");
  }, [isSocietiesLoading, societies, selectedSocietyId]);

  // Dynamic site scope: fetched from the logged-in user's own account
  // (site_id on /api/users/account.json) rather than a manual picker, since
  // the site dropdown was removed from the filter bar.
  const { data: accountSiteId } = useUserAccountSiteId();

  const showResidentSegment = appId === "12";
  const [residentSegment, setResidentSegment] = useState<
    "all" | "pre" | "post"
  >(savedView.segment);

  // One scrollable report: the nav jumps to a section and highlights the one on screen.
  const report = useReportNav(savedView.page);
  const activePage: PageId = report.active;
  const [devPlatform, setDevPlatform] = useState<DevicePlatform>(savedView.dev);
  const [showPrev, setShowPrev] = useState<boolean>(true);
  const [rangeDays, setRangeDays] = useState<number>(savedView.range.days);
  const [rangeLabel, setRangeLabel] = useState<string>(savedView.range.label);
  const [rangeFrom, setRangeFrom] = useState<string>(savedView.range.from);
  const [rangeTo, setRangeTo] = useState<string>(savedView.range.to);
  const [rangeIsCustom, setRangeIsCustom] = useState<boolean>(savedView.range.custom);

  useEffect(() => {
    saveView(viewKey, {
      range: { days: rangeDays, label: rangeLabel, from: rangeFrom, to: rangeTo, custom: rangeIsCustom },
      dev: devPlatform,
      societyId: selectedSocietyId,
      segment: residentSegment,
      page: activePage,
    });
  }, [viewKey, rangeDays, rangeLabel, rangeFrom, rangeTo, rangeIsCustom, devPlatform, selectedSocietyId, residentSegment, activePage]);

  const [benchmarks, setBenchmarks] = useState<Record<string, number | null>>({
    ...BM_DEFAULTS,
  });

  // Centralized Filter State (tenant url from backend saved in localStorage)
  const dynamicTenantUrl = useMemo(() => {
    try {
      // 1. Explicit override in localStorage if set
      const explicit =
        localStorage.getItem("runwal_tenant_url") ||
        localStorage.getItem("tenant_url");
      if (explicit) {
        return explicit.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      }

      // 2. Primary: Get backend URL saved during login/auth
      const backendUrl =
        getBaseUrlDomain() ||
        localStorage.getItem("baseUrl") ||
        sessionStorage.getItem("baseUrl") ||
        localStorage.getItem("base_url");

      if (backendUrl) {
        let cleaned = backendUrl
          .replace(/^https?:\/\//, "")
          .replace(/\/+$/, "");
        // Clean out API subdomain if backend returned -api URL (e.g. runwal-cp-api.lockated.com -> runwal-cp.lockated.com)
        if (cleaned.includes("-api.")) {
          cleaned = cleaned.replace("-api.", ".");
        }
        return cleaned;
      }
    } catch {}

    // 3. Active deployed browser hostname (when on staging/production runwal domain)
    if (
      typeof window !== "undefined" &&
      window.location.hostname &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1" &&
      window.location.hostname.includes("runwal")
    ) {
      return window.location.hostname;
    }

    // 4. Default Runwal tenant domain tracked in usage analytics
    return "runwal-cp.lockated.com";
  }, []);

  const filters: DashboardFilters = useMemo(() => {
    // Site scope comes from the logged-in user's own account (site_id),
    // not a manual picker — falls back to [] (tenant-wide) until it loads.
    const siteIds = accountSiteId ? [accountSiteId] : [];

    // display_view only applies for the app_id=35 tenant; "all" maps to both
    // segments at once ("0,1"), Pre Sales -> "0", Post Sales -> "1".
    const displayView = showResidentSegment
      ? residentSegment === "pre"
        ? "0"
        : residentSegment === "post"
          ? "1"
          : "0,1"
      : undefined;

    return {
      siteIds,
      from: rangeFrom,
      to: rangeTo,
      token: getToken() || localStorage.getItem("token") || "",
      devPlatform,
      licensedSeats: null,
      module: null,
      subModule: null,
      url: dynamicTenantUrl,
      displayView,
      societyIds: selectedSocietyId === "all" ? [] : [selectedSocietyId],
      appId: appId || undefined,
      // ?app_id=35 is Runwal Enterprise, anything else Runwal Connect: each has its own API.
      apiPath: runwalApiPath(appId),
    };
  }, [
    accountSiteId,
    devPlatform,
    rangeFrom,
    rangeTo,
    dynamicTenantUrl,
    showResidentSegment,
    residentSegment,
    selectedSocietyId,
    appId,
  ]);

  // Traffic Session query for global live counter & badge
  const {
    data: trafficData,
    isFetching: isTrafficFetching,
    isError: isTrafficError,
  } = useTrafficSession(filters, sitesSettled);

  const recentlyOnlineCount = trafficData?.tiles?.recently_online || 0;
  const generatedAt = trafficData?.meta?.generated_at;

  // Sync theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("runwal-theme", theme);
    } catch {}
  }, [theme]);

  // Sync keyboard shortcut '[' for nav rail toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      const tag = target && target.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      )
        return;
      e.preventDefault();
      setIsNavCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("runwal-nav", next ? "collapsed" : "open");
        } catch {}
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const handleToggleNav = () => {
    setIsNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("runwal-nav", next ? "collapsed" : "open");
      } catch {}
      return next;
    });
  };

  const handleBenchmarkChange = (id: string, value: number | null) => {
    setBenchmarks((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectPage = (page: PageId) => report.goTo(page);

  const handleSetRange = (days: number, label: string) => {
    const r = presetRange(days);
    setRangeDays(days);
    setRangeLabel(label);
    setRangeFrom(r.from);
    setRangeTo(r.to);
    setRangeIsCustom(false);
  };

  const handleSetCustomRange = (
    from: string,
    to: string,
    days: number,
    label: string
  ) => {
    setRangeDays(days);
    setRangeLabel(label);
    setRangeFrom(from);
    setRangeTo(to);
    setRangeIsCustom(true);
  };

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Refetch every active query on this dashboard (usage adoption + FM
  // Matrix) with the current filters, instead of waiting for cache staleness.
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.resetQueries({ queryKey: ["fm-adoption"] }),
        queryClient.resetQueries({ queryKey: ["fm-dashboard"] }),
      ]);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Dynamic User and Organization Info
  const user = useMemo(() => {
    try {
      const u = getUser();
      if (u && (u.firstname || u.name || u.email)) return u;
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.firstname || parsed?.name || parsed?.email) return parsed;
      }
      const acc = localStorage.getItem("hiSocietyAccount");
      if (acc) {
        const parsed = JSON.parse(acc);
        return parsed?.user || parsed;
      }
    } catch {}
    return null;
  }, []);

  const userName = useMemo(() => {
    if (!user) {
      try {
        const acc = localStorage.getItem("hiSocietyAccount");
        if (acc) {
          const parsed = JSON.parse(acc);
          const name = [parsed.firstname, parsed.lastname]
            .filter(Boolean)
            .join(" ");
          if (name) return name;
        }
      } catch {}
      return "Logged-in User";
    }
    const name = [user.firstname, user.lastname].filter(Boolean).join(" ");
    if (name) return name;
    if (user.name) return user.name;
    // Never the email (no contact details on the dashboard).
    return "Logged-in User";
  }, [user]);

  const userRole = useMemo(() => {
    try {
      const acc = localStorage.getItem("hiSocietyAccount");
      if (acc) {
        const parsed = JSON.parse(acc);
        if (parsed?.user_type) {
          if (parsed.user_type === "rm_user") return "RM User";
          if (parsed.user_type === "cs_user") return "CS User";
          return parsed.user_type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
        }
      }
    } catch {}
    return (
      user?.lock_role?.display_name ||
      user?.lock_role?.name ||
      user?.user_type ||
      "Analytics Admin"
    );
  }, [user]);

  const userEmail = useMemo(() => {
    return ""; // the profile menu shows no email (no contact details on the dashboard)
  }, [user]);

  const orgName = useMemo(() => {
    try {
      const acc = localStorage.getItem("hiSocietyAccount");
      if (acc) {
        const parsed = JSON.parse(acc);
        if (parsed?.organization?.name) return parsed.organization.name;
        if (parsed?.selected_user_society_name)
          return parsed.selected_user_society_name;
        if (parsed?.society?.building_name) return parsed.society.building_name;
      }
      const savedOrg =
        localStorage.getItem("org_name") ||
        localStorage.getItem("organization_name");
      if (savedOrg) return savedOrg;
    } catch {}
    return "Runwal Group";
  }, []);

  return (
    <div
      className={`posthog-dashboard-root ${isNavCollapsed ? "nav-collapsed" : ""}`}
      data-theme={theme}
    >
      <TopBar
        title="Runwal Enterprises"
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isNavCollapsed={isNavCollapsed}
        onToggleNav={handleToggleNav}
        userName={userName}
        userRole={userRole}
        userEmail={userEmail}
        orgName={orgName}
        isFetching={isTrafficFetching}
        actions={<RecentActivityButton filters={filters} sitesSettled={sitesSettled} />}
      />

      <div className="shell">
        <SideBar
          activePage={activePage}
          onSelectPage={handleSelectPage}
          filters={filters}
          sitesSettled={sitesSettled}
          brandSub="Runwal Connect"
        />

        <main className="main">
          <div className="page-head">
            <h2 id="pageTitle">Usage report</h2>
          </div>

          <FilterBar
            range={rangeDays}
            rangeIsCustom={rangeIsCustom}
            rangeLabel={rangeLabel}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            onSetRange={handleSetRange}
            onSetCustomRange={handleSetCustomRange}
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
            isSitesLoading={isSitesLoading}
            showSocietyFilter
            societies={societies}
            selectedSocietyId={selectedSocietyId}
            onSelectSociety={setSelectedSocietyId}
            isSocietiesLoading={isSocietiesLoading}
            dev={devPlatform}
            onSelectDev={setDevPlatform}
            showResidentSegment={showResidentSegment}
            residentSegment={residentSegment}
            onSelectResidentSegment={setResidentSegment}
            prev={showPrev}
            onTogglePrev={() => setShowPrev((p) => !p)}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            recentlyOnlineCount={recentlyOnlineCount}
            isFetching={isTrafficFetching}
            isError={isTrafficError}
            generatedAt={generatedAt}
          />

          <PreviousPeriodNote coverage={previousCoverage(trafficData)} />

          <ReportSection id="pgTraffic" mounted={report.isMounted("pgTraffic")} onSeen={report.markSeen}>
            <TrafficSessionPage
              filters={filters}
              showPrev={showPrev}
              benchmarks={benchmarks}
              onBenchmarkChange={handleBenchmarkChange}
              sitesSettled={sitesSettled}
              isRefreshing={isRefreshing}
            />
          </ReportSection>

          <ReportSection id="pgAdopt" mounted={report.isMounted("pgAdopt")} onSeen={report.markSeen}>
            <AdoptionEngagementPage
              filters={filters}
              benchmarks={benchmarks}
              onBenchmarkChange={handleBenchmarkChange}
              sitesSettled={sitesSettled}
              showPrev={showPrev}
              isRefreshing={isRefreshing}
              signups={{
                societies,
                selectedSocietyId,
                societiesLoading: isSocietiesLoading,
                rangeLabel,
                appName: appId === "35" ? "Runwal Realty" : "Runwal Connect",
                showPhase: showResidentSegment,
              }}
            />
          </ReportSection>

          <ReportSection id="pgFlows" mounted={report.isMounted("pgFlows")} onSeen={report.markSeen}>
            <WorkflowUsagePage
              filters={filters}
              benchmarks={benchmarks}
              onBenchmarkChange={handleBenchmarkChange}
              sitesSettled={sitesSettled}
              isRefreshing={isRefreshing}
              showUserJourneys
              societies={societies}
              rangeLabel={rangeLabel}
            />
          </ReportSection>

          {/* <div className="footer">
            <b>Live Analytics Integration.</b> Connected directly to Usage
            Adoption Analytics (<code>https://posthog-api.lockated.com</code>)
            and Hi-Society Backend endpoints. All metrics dynamically update
            based on selected sites, date ranges, and device platforms.
          </div> */}
        </main>
      </div>

      {/* Floating Info Popover for (i) Button */}
      <InfoPopover />
    </div>
  );
}

/** fixedAppId: "12" = Runwal Connect, "35" = Runwal Enterprise; omitted = read from an old ?app_id= link. */
export const PosthogRunwalDashboard: React.FC<{ fixedAppId?: string }> = ({
  fixedAppId,
}) => {
  return (
    <DashboardProvider>
      <PosthogRunwalDashboardContent fixedAppId={fixedAppId} />
    </DashboardProvider>
  );
};

export default PosthogRunwalDashboard;
