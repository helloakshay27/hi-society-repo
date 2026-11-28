// @vitest-environment jsdom
// 28 Nov 2026 requests on the Runwal usage dashboards:
//   - emails and phone numbers masked everywhere (first 2 and last 2 characters shown)
//   - Recent Activity out of the left navigation, into a button at the top right
//   - one scrollable report: the navigation jumps to a section instead of swapping pages
//   - the people behind the usage numbers: Active Users, Recently Online, a day on Usage over time, a
//     platform bar (and a week on the adoption trend, in the Adoption page)
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ADOPTION_API, fetchUserJourneys, activityUserLabel, fetchSocietyAccounts } from "../api/api";
import type { DashboardFilters } from "../api/types";
import { toRows } from "../components/adoption/signupsLogic";
import { SideBar } from "../components/common/SideBar";
import { RecentActivityButton } from "../components/common/RecentActivityButton";
import { TrafficSessionPage } from "../components/pages/TrafficSessionPage";
import { DashboardProvider } from "../context/DashboardContext";

const filters: DashboardFilters = {
  siteIds: [], from: "2026-11-20", to: "2026-11-26", token: "t", devPlatform: "all", licensedSeats: null,
  module: null, subModule: null, apiPath: ADOPTION_API.runwalConnect,
};
// The usage API's "now" for the people lists: 26 Nov 10:30 IST. A person last seen `minutesAgo` before it.
const NOW = Date.parse("2026-11-26T10:30:00+05:30");
const person = (n: number, minutesAgo = 600) => ({
  user_key: `u${n}`, user_id: String(1000 + n), first_name: `Person`, last_name: String(n), email: `person${n}@example.com`,
  society_id: "3685", phase: "Post Possession", sessions: n, events: 3 * n,
  last_seen: new Date(NOW - minutesAgo * 60_000).toISOString(), minutes_ago: Math.round(minutesAgo),
});
let onlineNow = 2; // what the usage API says Recently Online is, each time it is asked
let fetchMock: ReturnType<typeof vi.fn>;
const calls = () => fetchMock.mock.calls.map((c) => new URL(String(c[0]), "http://localhost"));
beforeEach(() => {
  fetchMock = vi.fn().mockImplementation(async (url: string) => {
    const u = new URL(url, "http://localhost");
    const endpoint = u.pathname.split("/adoption/")[1];
    if (endpoint === "user_journeys") {
      // 3 is 30.4 minutes back: its rounded minutes_ago is 30, but it is outside the 30 minutes the tile counts.
      const people = u.searchParams.get("os") === "ios" ? [person(1)] : [person(1, 5), person(2, 20), person(3, 30.4), person(4, 300)];
      return { ok: true, json: async () => ({ meta: { total: people.length, generated_at: new Date(NOW).toISOString() }, people }) };
    }
    if (endpoint === "recent_active_users") {
      return { ok: true, json: async () => ({ users: [{ user_id: "7", user_name: null, email: "anita.rao@example.com", path: "home", last_event: "home_viewed", minutes_ago: 2 }] }) };
    }
    if (endpoint === "traffic_session") {
      return { ok: true, json: async () => ({ meta: { metric: "traffic_session" }, tiles: { active_users: 4, screen_views: 10, sessions: 4, avg_session_seconds: 60, bounce_rate: 10, recently_online: onlineNow }, previous: {}, delta_pct: {} }) };
    }
    if (endpoint === "usage_and_distribution") {
      return { ok: true, json: async () => ({
        meta: { metric: "usage_and_distribution" },
        usage_over_time: { current: [{ day: "2026-11-25", visitors: 2, views: 5, sessions: 2 }, { day: "2026-11-26", visitors: 3, views: 5, sessions: 2 }], previous: [] },
        platform_usage: { total_users: 3, total_sessions: 0, platforms: [
          { platform: "Android", users: 2, user_share: 66.6, sessions: 0, session_share: null },
          { platform: "iOS", users: 1, user_share: 33.3, sessions: 0, session_share: null },
        ] },
        device_split: { total_sessions: 0, devices: [] }, views_per_session: 2,
      }) };
    }
    return { ok: true, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const wrap = (ui: React.ReactElement) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <DashboardProvider>{ui}</DashboardProvider>
  </QueryClientProvider>
);

describe("no email or phone number anywhere", () => {
  it("is dropped from the usage API's people lists, journeys and recent activity, even when an API still sends it", async () => {
    const r = await fetchUserJourneys(filters, { perPage: "all" });
    expect(r.people.length).toBe(4);
    expect(r.people.every((p) => !("email" in p))).toBe(true);
    expect(activityUserLabel({ user_name: "", user_id: "7" })).toBe("user 7");
  });

  it("is not kept from Hi Society's Manage Users accounts (nor the nested user record with its API key)", async () => {
    localStorage.setItem("baseUrl", "hi-society.lockated.com");
    localStorage.setItem("token", "login.jwt");
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({
      user_societies: [{ id: 1, id_user: 5, id_society: 3685, created_at: "2026-11-20T10:00:00+05:30", approve: true,
        display_view: "Post Sales", full_name: "A B", email: "ab.cd@example.com", mobile: "9876543210", block_no: "A", flat_no: "1",
        resident_type: "owner", app_downloaded: { any_app_downloaded: true, ios: true, android: false },
        user: { id: 5, spree_api_key: "secret-key", email: "ab.cd@example.com", mobile: "9876543210" } }],
      pagination: { total_pages: 1, total_count: 1 } }) });
    const { accounts } = await fetchSocietyAccounts({ societyIds: ["3685"], to: "2026-11-27" });
    expect(JSON.stringify(accounts)).not.toMatch(/example\.com|9876543210|secret-key|"user"/);
    const [row] = toRows(accounts, []);
    expect(Object.keys(row)).not.toContain("email");
    expect(Object.keys(row)).not.toContain("mobile");
    expect(row.ios).toBe(true);
    localStorage.clear();
  });
});

describe("Recent Activity at the top right", () => {
  it("is no longer in the left navigation", () => {
    render(<SideBar activePage="pgTraffic" onSelectPage={() => {}} />);
    expect(screen.queryByText("Recent Activity")).toBeNull();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Traffic & Session", "Adoption & Engagement", "Workflow Usage"]);
  });

  it("opens as a panel from its button, with the live list (no email) and the download", async () => {
    wrap(<RecentActivityButton filters={filters} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Recent activity/ }));
    const panel = screen.getByRole("dialog", { name: "Recent activity" });
    await within(panel).findByText("user 7"); // no name sent: the user id, never the email
    expect(panel.textContent).not.toContain("@");
    expect(within(panel).getByLabelText("Download user activity")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("the navigation jumps within one report", () => {
  it("reports the section asked for and marks the one on screen", () => {
    const onSelect = vi.fn();
    render(<SideBar activePage="pgAdopt" onSelectPage={onSelect} />);
    fireEvent.click(screen.getByText("Workflow Usage"));
    expect(onSelect).toHaveBeenCalledWith("pgFlows");
    expect(screen.getByText("Adoption & Engagement").closest("button")!.getAttribute("aria-current")).toBe("true");
  });
});

describe("the people behind the usage numbers", () => {
  const renderPage = () => wrap(<TrafficSessionPage filters={filters} showPrev benchmarks={{}} onBenchmarkChange={() => {}} />);
  const journeyCalls = () => calls().filter((u) => u.pathname.endsWith("/adoption/user_journeys")).map((u) => Object.fromEntries(u.searchParams.entries()));

  it("Active Users opens everyone active in the range", async () => {
    renderPage();
    const tile = (await screen.findByText("Active Users", { selector: ".lbl" })).closest(".tile") as HTMLElement;
    await waitFor(() => expect(tile.getAttribute("role")).toBe("button"));
    fireEvent.click(tile);
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getAllByRole("row")).toHaveLength(5); // header + 4
    expect(journeyCalls().at(-1)).toMatchObject({ from: "2026-11-20", to: "2026-11-26", per_page: "all" });
    expect(panel.textContent).toContain("equals the number you clicked (4)");
  });

  it("Recently Online opens the people active in the last 30 minutes", async () => {
    renderPage();
    const tile = (await screen.findByText("Recently Online", { selector: ".lbl" })).closest(".tile") as HTMLElement;
    await waitFor(() => expect(tile.getAttribute("role")).toBe("button"));
    fireEvent.click(tile);
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getAllByRole("row")).toHaveLength(3); // header + 1 and 2 (3 is 30.4 minutes back)
    expect(journeyCalls().at(-1)).toMatchObject({ sort: "last_active", dir: "desc", per_page: "100" });
    expect(panel.textContent).toContain("equals the number you clicked (2)");
  });

  it("Recently Online is counted again with the list: an older count on the tile does not show as a mismatch", async () => {
    onlineNow = 9; // the tile was worked out when the page loaded
    renderPage();
    const tile = (await screen.findByText("Recently Online", { selector: ".lbl" })).closest(".tile") as HTMLElement;
    await waitFor(() => expect(tile.querySelector(".val")?.textContent).toBe("9"));
    onlineNow = 2; // minutes later, when the tile is clicked
    fireEvent.click(tile);
    const panel = await screen.findByRole("dialog");
    expect(panel.textContent).toContain("the number of people listed (2) equals the number you clicked (2)");
    await waitFor(() => expect(tile.querySelector(".val")?.textContent).toBe("2")); // the tile catches up too
    onlineNow = 2;
  });

  it("a platform bar opens the people on that platform", async () => {
    renderPage();
    const card = document.getElementById("card-deviceSplit")!;
    const ios = await within(card).findByTitle(/people on iOS/);
    fireEvent.click(ios);
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getAllByRole("row")).toHaveLength(2); // header + 1
    expect(journeyCalls().at(-1)).toMatchObject({ os: "ios", device_type: "Mobile" });
  });
});
