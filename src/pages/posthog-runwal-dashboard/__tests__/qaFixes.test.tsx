// @vitest-environment jsdom
// Runwal post-possession QA issues 5460–5466 on the Traffic & Session page and the filter bar:
//   5460 the view (date range, platform, society, segment, page) survives a page refresh
//   5461 Active Users = iOS + Android on the device card (each user once, on the platform used last)
//   5462 the card's share = platform users ÷ active users × 100, the formula in its (i)
//   5463 "Visitors" reads "Active Users"
//   5464 an end date before the start date blanks the start date
//   5465 Recently Online says it is not tied to the date range
//   5466 Bounce Rate shows the precision its change is worked out from, with the previous rate beside it
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ADOPTION_API } from "../api/api";
import type { DashboardFilters } from "../api/types";
import { FilterBar } from "../components/common/FilterBar";
import { TrafficSessionPage, formatRate } from "../components/pages/TrafficSessionPage";
import { pct2, trunc2 } from "../data/constants";
import { deltaText, previousCoverage } from "../data/previousPeriod";
import { PreviousPeriodNote } from "../components/common/PreviousPeriodNote";
import { platformRows } from "../components/pages/platformRows";
import { loadView, saveView } from "../data/savedView";
import { DashboardProvider } from "../context/DashboardContext";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); });

describe("5460: the view is kept across a refresh", () => {
  const today = new Date(2026, 10, 26); // 26 Nov 2026

  it("is Last 30 days with nothing saved", () => {
    expect(loadView("app-12", today)).toMatchObject({
      range: { days: 30, label: "Last 30 days", from: "2026-10-28", to: "2026-11-26", custom: false },
      dev: "all", societyId: "all", segment: "all", page: "pgTraffic",
    });
  });

  it("brings back a preset as the last N days from today, and the other filters as they were", () => {
    saveView("app-12", { range: { days: 7, label: "Last 7 days", from: "2026-11-01", to: "2026-11-07", custom: false },
                         dev: "ios", societyId: "3685", segment: "post", page: "pgAdopt" });
    expect(loadView("app-12", today)).toMatchObject({
      range: { days: 7, label: "Last 7 days", from: "2026-11-20", to: "2026-11-26", custom: false },
      dev: "ios", societyId: "3685", segment: "post", page: "pgAdopt",
    });
    expect(loadView("app-35", today).range.days).toBe(30); // each dashboard keeps its own
  });

  it("brings back a custom range as its dates, and drops anything unreadable", () => {
    saveView("app-12", { range: { days: 10, label: "x", from: "2026-11-01", to: "2026-11-10", custom: true },
                         dev: "all", societyId: "all", segment: "all", page: "pgTraffic" });
    expect(loadView("app-12", today).range).toEqual({ days: 10, label: "Nov 1 – Nov 10", from: "2026-11-01", to: "2026-11-10", custom: true });
    sessionStorage.setItem("runwal-usage-view:app-12", JSON.stringify({ range: { days: 45 }, dev: "windows", societyId: "1 OR 1=1", page: "x" }));
    expect(loadView("app-12", today)).toMatchObject({ range: { days: 30 }, dev: "all", societyId: "all", page: "pgTraffic" });
    sessionStorage.setItem("runwal-usage-view:app-12", "{not json");
    expect(loadView("app-12", today).range.days).toBe(30);
  });
});

describe("5464: picking the custom range", () => {
  const base = {
    range: 30, rangeLabel: "Last 30 days", rangeFrom: "2026-10-28", rangeTo: "2026-11-26", onSetRange: () => {},
    sites: [], selectedSiteId: "all", onSelectSite: () => {}, dev: "all" as const, onSelectDev: () => {},
    prev: true, onTogglePrev: () => {}, recentlyOnlineCount: 32,
  };
  const open = () => fireEvent.click(screen.getByText("Last 30 days"));
  const start = () => screen.getByLabelText("Start date") as HTMLInputElement;
  const end = () => screen.getByLabelText("End date") as HTMLInputElement;
  const apply = () => screen.getByText("Apply custom range") as HTMLButtonElement;

  it("an end date before the start date blanks the start date, and Apply waits for both", () => {
    const onSetCustomRange = vi.fn();
    render(<FilterBar {...base} onSetCustomRange={onSetCustomRange} />);
    open();
    fireEvent.change(end(), { target: { value: "2026-10-20" } });
    expect(start().value).toBe("");
    expect(end().value).toBe("2026-10-20");
    expect(apply().disabled).toBe(true);
    fireEvent.change(start(), { target: { value: "2026-10-10" } });
    expect(apply().disabled).toBe(false);
    fireEvent.click(apply());
    expect(onSetCustomRange).toHaveBeenCalledWith("2026-10-10", "2026-10-20", 11, "Oct 10 – Oct 20");
  });

  it("a start date after the end date blanks the end date; an end date after the start keeps it", () => {
    render(<FilterBar {...base} onSetCustomRange={() => {}} />);
    open();
    fireEvent.change(end(), { target: { value: "2026-11-20" } });
    expect(start().value).toBe("2026-10-28");
    fireEvent.change(start(), { target: { value: "2026-11-22" } });
    expect(end().value).toBe("");
  });

  it("a custom range brought back after a refresh does not light up a preset", () => {
    render(<FilterBar {...base} rangeIsCustom rangeLabel="Oct 28 – Nov 26" onSetCustomRange={() => {}} />);
    fireEvent.click(screen.getByText("Oct 28 – Nov 26"));
    expect(screen.getByText("Last 30 days").className).not.toContain("on");
  });

  it("5465: the live pill says it follows the filters but not the date range", () => {
    render(<FilterBar {...base} onSetCustomRange={() => {}} />);
    expect(screen.getByText("32 recently online").parentElement!.getAttribute("title")).toMatch(/not the date range/);
  });
});

describe("5461 / 5462: the device card", () => {
  const usage = (platforms: Array<[string, number]>) => ({
    platform_usage: {
      total_users: platforms.reduce((n, [, u]) => n + u, 0), total_sessions: 0,
      platforms: platforms.map(([platform, users]) => ({ platform, users, user_share: null, sessions: 0, session_share: null })),
    },
  }) as any;

  it("splits the active users, so Android + iOS = Active Users and the shares are users ÷ active users × 100", () => {
    const { rows, totalUsers, sumLabel } = platformRows(usage([["Android", 4405], ["iOS", 2077]]));
    expect(totalUsers).toBe(6482);
    expect(rows.map((r) => [r.platform, r.users, r.share.toFixed(1)])).toEqual([["Android", 4405, "68.0"], ["iOS", 2077, "32.0"]]);
    expect(sumLabel).toBe("= Android 4,405 + iOS 2,077");
  });

  it("shows the other phone at 0 when one is toggled, and nothing without data", () => {
    expect(platformRows(usage([["iOS", 10]])).rows.map((r) => [r.platform, r.users, r.share])).toEqual([["iOS", 10, 100], ["Android", 0, 0]]);
    expect(platformRows(usage([])).rows).toEqual([]);
    expect(platformRows(undefined).rows).toEqual([]);
  });
});

const trafficMeta = (prev: { from: string; to: string; days: number; days_with_data: number; first_day_with_data: string | null }, daysWithData: number) =>
  ({ meta: { metric: "traffic_session", filters: {}, generated_at: "", days_with_data: daysWithData, previous_period: prev } }) as any;
const FULL = previousCoverage(trafficMeta({ from: "2026-11-13", to: "2026-11-19", days: 7, days_with_data: 7, first_day_with_data: "2026-11-13" }, 7));
const NONE = previousCoverage(trafficMeta({ from: "2026-05-31", to: "2026-08-28", days: 90, days_with_data: 0, first_day_with_data: null }, 43));
const PARTIAL = previousCoverage(trafficMeta({ from: "2026-09-28", to: "2026-10-27", days: 30, days_with_data: 13, first_day_with_data: "2026-10-13" }, 30));

describe("percentages: two decimals, cut not rounded", () => {
  it("drops every digit after the second decimal, after clearing floating-point noise", () => {
    expect(pct2(178.55555555)).toBe("178.55%");
    expect(pct2(14.099999999999998)).toBe("14.10%");
    expect(pct2(67.91503633)).toBe("67.91%");
    expect(pct2(-13.4999)).toBe("-13.49%");
    expect(pct2(100)).toBe("100.00%");
    expect(pct2(5, true)).toBe("+5.00%");
    expect(trunc2(-0.004)).toBe("0.00");
    expect(pct2(null)).toBe("—");
  });
});

describe("5466: the change vs the previous period", () => {
  it("is (current − previous) ÷ previous × 100 from the API, two decimals cut, with the previous value beside it", () => {
    expect(deltaText(15.6200973272, FULL, "11.77%")).toEqual({ text: "+15.62% vs prev (11.77%)", dir: "up" });
    expect(deltaText(-1.6012810248, FULL, "3,747")).toEqual({ text: "-1.60% vs prev (3,747)", dir: "dn" });
    expect(deltaText(0.001, FULL)).toEqual({ text: "0.00% vs prev", dir: "flat" });
    expect(formatRate(14.283339567)).toBe("14.28%");
  });

  it("says when the previous period has no data, and marks a partly covered one", () => {
    expect(NONE.state).toBe("none");
    expect(deltaText(null, NONE)).toEqual({ text: "No data in previous period", dir: "flat" });
    expect(deltaText(null, FULL)).toEqual({ text: null, dir: "flat" });
    expect(NONE.note).toMatch(/\(May 31 – Aug 28\) has no data/);
    expect(PARTIAL.state).toBe("partial");
    expect(deltaText(222.8287841191, PARTIAL, "2,015").text).toBe("+222.82% vs prev (2,015) *");
    expect(PARTIAL.note).toBe("* The previous period (Sep 28 – Oct 27) has data on only 13 of its 30 days, from Oct 13, so the changes vs prev look bigger than they are.");
    expect(FULL.note).toBeNull();
    expect(previousCoverage(undefined).state).toBe("unknown");
  });

  it("puts the note under the filter bar only when there is something to say", () => {
    const { container, rerender } = render(<PreviousPeriodNote coverage={NONE} />);
    expect(container.textContent).toMatch(/No comparison with the previous period/);
    rerender(<PreviousPeriodNote coverage={FULL} />);
    expect(container.textContent).toBe("");
  });
});

describe("Traffic & Session page", () => {
  const filters: DashboardFilters = {
    siteIds: [], from: "2026-11-20", to: "2026-11-26", token: "t", devPlatform: "all", licensedSeats: null,
    module: null, subModule: null, apiPath: ADOPTION_API.runwalConnect,
  };
  const answers: Record<string, unknown> = {
    traffic_session: {
      ...trafficMeta({ from: "2026-11-13", to: "2026-11-19", days: 7, days_with_data: 7, first_day_with_data: "2026-11-13" }, 7),
      tiles: { active_users: 3578, screen_views: 100183, sessions: 11083, avg_session_seconds: 131, bounce_rate: 14.283339567, recently_online: 35 },
      previous: { active_users: 3746, screen_views: 108770, sessions: 11312, avg_session_seconds: 149, bounce_rate: 11.7719840919 },
      delta_pct: { active_users: -4.4847837693, screen_views: -7.9, sessions: -2.0, avg_session_seconds: -12.1, bounce_rate: 21.3333333333 },
    },
    usage_and_distribution: {
      meta: { metric: "usage_and_distribution" },
      usage_over_time: { current: [{ day: "2026-11-20", visitors: 900, views: 20000, sessions: 2000 }], previous: [] },
      platform_usage: { total_users: 3578, total_sessions: 0, platforms: [
        { platform: "Android", users: 2430, user_share: 67.9, sessions: 0, session_share: null },
        { platform: "iOS", users: 1148, user_share: 32.1, sessions: 0, session_share: null },
      ] },
      device_split: { total_sessions: 0, devices: [] },
      views_per_session: 9.0,
    },
  };
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => {
      const endpoint = new URL(url, "http://localhost").pathname.split("/adoption/")[1];
      return { ok: true, json: async () => answers[endpoint] };
    }));
  });

  it("shows Active Users (not Visitors), the bounce rate change with its previous rate, and the platform split", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <DashboardProvider>
          <TrafficSessionPage filters={filters} showPrev benchmarks={{}} onBenchmarkChange={() => {}} />
        </DashboardProvider>
      </QueryClientProvider>
    );
    await screen.findByText("14.28%");
    expect(screen.getByText(/\+21\.33% vs prev \(11\.77%\)/)).toBeTruthy();
    expect(screen.getByText(/-4\.48% vs prev \(3,746\)/)).toBeTruthy();
    expect(screen.getByText(/not tied to the date range/)).toBeTruthy();
    expect(screen.queryByText(/Visitors/)).toBeNull();
    expect(await screen.findByRole("button", { name: "Active Users" })).toBeTruthy();
    const card = document.getElementById("card-deviceSplit")!;
    expect(within(card).getByText("67.91%")).toBeTruthy(); // 2,430 ÷ 3,578 = 67.915…%
    expect(within(card).getByText("32.08%")).toBeTruthy(); // 1,148 ÷ 3,578 = 32.084…%
    expect(within(card).getByText("= Android 2,430 + iOS 1,148")).toBeTruthy();
  });
});
