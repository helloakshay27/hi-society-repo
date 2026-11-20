// @vitest-environment jsdom
// Downloads & sign-ups (Adoption & Engagement, Runwal Connect / Realty): the parts of the wireframe that Hi
// Society's Manage Users answers in full, the exact query it is sent, reading every chosen society (Manage
// Users answers for the one selected in Hi Society, so each is selected in turn), and the people behind
// every number.
//
// A stand-in Hi Society answers below: /change_user_society.json selects a society; Manage Users returns the
// selected society's accounts, narrowed by the q[...] it is sent, as the real one does.
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ADOPTION_API, fetchAccountsBySociety, fetchSocietyAccounts, headerSocietyId, societyAccountsParams, switchHiSocietySociety,
} from "../api/api";
import type { DashboardFilters, HiSocietyAccount } from "../api/types";
import { SignupsSection } from "../components/adoption/SignupsSection";
import { DashboardProvider } from "../context/DashboardContext";
import {
  buckets, byProject, hiSocietyDisplayView, neverLoggedIn, onPlatform, phaseOf, phaseSplit, rowsIn, toRows,
} from "../components/adoption/signupsLogic";

const societies = [{ id: "3710", name: "Runwal Avenue" }, { id: "3685", name: "Runwal Gardens" }];
const filters = (over: Partial<DashboardFilters> = {}): DashboardFilters => ({
  siteIds: [], from: "2026-10-22", to: "2026-11-20", token: "t", devPlatform: "all", licensedSeats: null,
  module: null, subModule: null, apiPath: ADOPTION_API.runwalConnect, displayView: "0,1", ...over,
});

const acc = (id: number, created: string, over: Partial<HiSocietyAccount> = {}): HiSocietyAccount => ({
  id, id_user: 1000 + id, id_society: 3685, created_at: created, approve: true, display_view: "Post Sales",
  full_name: `Person ${id}`, email: `p${id}@example.com`, mobile: `98000000${id}`, block_no: "A", flat_no: `${100 + id}`,
  resident_type: "owner", app_downloaded: { any_app_downloaded: true, ios: false, android: true }, ...over,
});
const noApp = { any_app_downloaded: false, ios: false, android: false };
// Runwal Gardens, up to 20 Nov: 1-2 before the range, 3-5 inside it; 2 and 4 have never logged in.
const GARDENS = [
  acc(1, "2026-06-01T10:00:00+05:30"),
  acc(2, "2026-07-01T10:00:00+05:30", { app_downloaded: noApp, display_view: "Pre Sales" }),
  acc(3, "2026-10-25T10:00:00+05:30", { app_downloaded: { any_app_downloaded: true, ios: true, android: true } }),
  acc(4, "2026-11-10T10:00:00+05:30", { app_downloaded: noApp }),
  acc(5, "2026-11-20T22:00:00+05:30", { approve: null, display_view: "Pre Sales" }),
];
// Runwal Avenue: 11 in the range on iOS, 12 before it and never logged in; 13 after the end date.
const AVENUE = [
  acc(11, "2026-11-01T10:00:00+05:30", { id_society: 3710, app_downloaded: { any_app_downloaded: true, ios: true, android: false } }),
  acc(12, "2026-05-01T10:00:00+05:30", { id_society: 3710, app_downloaded: noApp, display_view: "Pre Sales" }),
  acc(13, "2026-11-25T10:00:00+05:30", { id_society: 3710 }),
];
const BY_SOCIETY: Record<string, HiSocietyAccount[]> = { "3685": GARDENS, "3710": AVENUE };
const USER_SOCIETY: Record<string, string> = { "92": "3685", "91": "3710" };

let selected = "3685"; // the society selected in the stand-in Hi Society
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  selected = "3685";
  localStorage.setItem("baseUrl", "hi-society.lockated.com");
  localStorage.setItem("token", "login.jwt");
  localStorage.setItem("user", JSON.stringify({ id: 7, spree_api_key: "spree.key" }));
  // Hi Society has Runwal Gardens selected (the user's user-society 92 there).
  localStorage.setItem("selectedUserSociety", "92");
  localStorage.setItem("hiSocietyApprovedSocieties", JSON.stringify([
    { id: 91, id_society: 3710, society: { building_name: "Runwal Avenue" } },
    { id: 92, id_society: 3685, society: { building_name: "Runwal Gardens" } },
  ]));
  fetchMock = vi.fn().mockImplementation(async (url: string) => {
    const u = new URL(url);
    if (u.pathname === "/change_user_society.json") {
      selected = USER_SOCIETY[u.searchParams.get("user_society_id") || ""];
      return { ok: true, json: async () => ({}) };
    }
    const g = u.searchParams.get("q[created_at_gteq]"), l = u.searchParams.get("q[created_at_lteq]");
    const dv = u.searchParams.get("q[display_view_eq]"), ids = u.searchParams.getAll("q[id_society_in][]");
    const rows = (BY_SOCIETY[selected] || []).filter((a) =>
      (!g || Date.parse(a.created_at!) >= Date.parse(g)) && (!l || Date.parse(a.created_at!) <= Date.parse(l)) &&
      (!dv || a.display_view === dv) && (!ids.length || ids.includes(String(a.id_society))));
    return { ok: true, json: async () => ({ user_societies: rows, pagination: { current_page: 1, total_pages: 1, total_count: rows.length, per_page: 1000 } }) };
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const calls = () => fetchMock.mock.calls.map((c) => new URL(String(c[0])));
/** "switch 3710", "read 3710 upTo", "read 3710 range", ... */
const trail = () => calls().map((u) =>
  u.pathname === "/change_user_society.json"
    ? `switch ${USER_SOCIETY[u.searchParams.get("user_society_id") || ""]}`
    : `read ${u.searchParams.getAll("q[id_society_in][]").join(",")} ${u.searchParams.has("q[created_at_gteq]") ? "range" : "upTo"}`);

const renderSection = (over: Partial<DashboardFilters> = {}, selectedSocietyId = "all", showPhase = true) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <DashboardProvider>
      <SignupsSection filters={filters(over)} societies={societies} selectedSocietyId={selectedSocietyId}
                      rangeLabel="Last 30 days" appName="Runwal Connect" showPhase={showPhase} />
    </DashboardProvider>
  </QueryClientProvider>
);
const tile = (label: string) => screen.getByText(label).closest(".tile") as HTMLElement;
const val = (label: string) => tile(label).querySelector(".val")?.textContent;
const projectRows = () =>
  [...(screen.getByText("By project").closest(".card") as HTMLElement).querySelectorAll("tbody tr")]
    .map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent));

describe("the query sent to Manage Users", () => {
  it("carries the society id, the dates in IST and the phase by Hi Society's own names", () => {
    const p = societyAccountsParams({ societyIds: ["3685"], from: "2026-10-22", to: "2026-11-20", displayView: "Pre Sales" }, 2);
    expect(p.getAll("q[id_society_in][]")).toEqual(["3685"]);
    expect(p.get("q[created_at_gteq]")).toBe("2026-10-22T00:00:00+05:30");
    expect(p.get("q[created_at_lteq]")).toBe("2026-11-20T23:59:59+05:30");
    expect(p.get("q[display_view_eq]")).toBe("Pre Sales");
    expect([p.get("page"), p.get("per_page")]).toEqual(["2", "1000"]);
    const upTo = societyAccountsParams({ societyIds: ["3685"], to: "2026-11-20" }, 1);
    expect([upTo.has("q[created_at_gteq]"), upTo.has("q[display_view_eq]")]).toEqual([false, false]);
  });

  it("maps the dashboard's phase: 0 = Post Sales = 'Pre Sales', 1 = Post Possession = 'Post Sales', both = no filter", () => {
    expect([hiSocietyDisplayView("0"), hiSocietyDisplayView("1"), hiSocietyDisplayView("0,1"), hiSocietyDisplayView(undefined)])
      .toEqual(["Pre Sales", "Post Sales", undefined, undefined]);
    expect([phaseOf("Pre Sales"), phaseOf("Post Sales"), phaseOf(null)]).toEqual(["Post Sales", "Post Possession", null]);
  });

  it("reads every page, with the login token as a Bearer header", async () => {
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ user_societies: GARDENS.slice(0, 3), pagination: { total_pages: 2, total_count: 5 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ user_societies: GARDENS.slice(3), pagination: { total_pages: 2, total_count: 5 } }) });
    const r = await fetchSocietyAccounts({ societyIds: ["3685"], to: "2026-11-20" });
    expect([r.accounts.length, r.total]).toEqual([5, 5]);
    expect(calls().map((u) => [u.pathname, u.searchParams.get("page")])).toEqual([
      ["/crm/admin/user_societies.json", "1"], ["/crm/admin/user_societies.json", "2"],
    ]);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer login.jwt");
  });
});

describe("reading the chosen societies", () => {
  const q = (societyIds: string[]) => ({ societyIds, from: "2026-10-22", to: "2026-11-20" });

  it("All Societies: selects each society in turn, reads it with the dates both ways, then puts Hi Society back", async () => {
    const r = await fetchAccountsBySociety(q(["3710", "3685"]));
    expect(trail()).toEqual([
      "switch 3710", "read 3710 upTo", "read 3710 range", "switch 3685", "read 3685 upTo", "read 3685 range",
    ]);
    expect(r.societies.map((s) => [s.societyId, s.upTo.length, s.inRange.length, s.error])).toEqual([
      ["3710", 2, 1, null], ["3685", 5, 3, null],
    ]);
    expect([selected, headerSocietyId()]).toEqual(["3685", "3685"]);
  });

  it("puts Hi Society back on its society even when it ends on another one", async () => {
    await fetchAccountsBySociety(q(["3685", "3710"]));
    expect(trail().filter((t) => t.startsWith("switch"))).toEqual(["switch 3710", "switch 3685"]);
    expect(selected).toBe("3685");
  });

  it("one society stays selected afterwards, as if picked in Hi Society's header", async () => {
    await fetchAccountsBySociety(q(["3710"]));
    expect(trail()).toEqual(["switch 3710", "read 3710 upTo", "read 3710 range"]);
    expect([selected, headerSocietyId(), localStorage.getItem("selectedUserSociety")]).toEqual(["3710", "3710", "91"]);
  });

  it("a society the user is not in is reported; the others are still read", async () => {
    const r = await fetchAccountsBySociety(q(["9999", "3685"]));
    expect(r.societies.map((s) => [s.societyId, s.upTo.length, s.error])).toEqual([
      ["9999", 0, "You are not a member of this society in Hi Society"], ["3685", 5, null],
    ]);
  });

  it("a switch asked for meanwhile waits for the reading to finish", async () => {
    await Promise.all([fetchAccountsBySociety(q(["3710", "3685"])), switchHiSocietySociety("3710")]);
    expect(trail()).toEqual([
      "switch 3710", "read 3710 upTo", "read 3710 range", "switch 3685", "read 3685 upTo", "read 3685 range", "switch 3710",
    ]);
  });

  it("switching uses the user's own user-society id there, and refuses a society the user is not in", async () => {
    await switchHiSocietySociety("3710");
    const u = calls()[0];
    expect(Object.fromEntries(u.searchParams.entries())).toEqual({ token: "spree.key", user_society_id: "91" });
    expect([localStorage.getItem("selectedUserSociety"), sessionStorage.getItem("selectedSocietyId")]).toEqual(["91", "3710"]);
    await expect(switchHiSocietySociety("9999")).rejects.toThrow(/not a member/);
  });
});

describe("the numbers", () => {
  it("never logged in = no phone registered for the app, longest waiting first; phases split", () => {
    const rows = toRows(GARDENS, societies, new Date("2026-11-20T12:00:00+05:30"));
    expect(neverLoggedIn(rows).map((r) => r.key)).toEqual(["2", "4"]);
    expect(rows.find((r) => r.key === "3")?.platform).toBe("iOS, Android");
    expect(rows.find((r) => r.key === "5")?.approval).toBe("Pending");
    expect(rows.find((r) => r.key === "2")?.waiting).toBe(142);
    expect(phaseSplit(rows)).toEqual({ "Post Sales": 2, "Post Possession": 3 });
  });

  it("iOS / Android keep the accounts with the app on that platform; someone on both is in each", () => {
    const rows = toRows(GARDENS, societies);
    expect(onPlatform(rows, "ios").map((r) => r.key)).toEqual(["3"]);
    expect(onPlatform(rows, "android").map((r) => r.key)).toEqual(["1", "3", "5"]);
    expect(onPlatform(rows, "all")).toHaveLength(5);
  });

  it("by project = by society: every chosen society has a row, most registered first", () => {
    const rows = toRows([...GARDENS, ...AVENUE.slice(0, 2)], societies);
    const chosen = [...societies, { id: "3757", name: "Runwal Bliss" }];
    expect(byProject(rows, chosen).map((p) => [p.project, p.registered, p.loggedIn, p.never, p.phase])).toEqual([
      ["Runwal Gardens", 5, 3, 2, "Both"], ["Runwal Avenue", 2, 1, 1, "Both"], ["Runwal Bliss", 0, 0, 0, null],
    ]);
  });
});

describe("the section", () => {
  it("All Societies: tiles add up every society, one project row each, Hi Society back where it was", async () => {
    renderSection();
    await waitFor(() => expect(val("Registered Customers")).toBe("7"));
    expect(screen.getByRole("heading", { name: "Downloads & sign-ups" })).toBeTruthy();
    expect([val("New Registrations"), val("Registered, Never Logged In")]).toEqual(["4", "3"]);
    expect(tile("Registered Customers").textContent).toContain("Post Sales 3 · Post Possession 4");
    expect(projectRows()).toEqual([
      ["Runwal Gardens", "Both", "5", "3", "2", "60%"],
      ["Runwal Avenue", "Both", "2", "1", "1", "50%"],
    ]);
    expect(selected).toBe("3685");
    const list = screen.getByText("Needs a nudge · named list").closest(".card") as HTMLElement;
    expect([...list.querySelectorAll("tbody tr")].map((tr) => tr.querySelector("td")?.textContent)).toEqual(["Person 12", "Person 2", "Person 4"]);
  });

  it("a click on a project or a number opens the people behind it", async () => {
    renderSection();
    await waitFor(() => expect(val("Registered Customers")).toBe("7"));
    const card = screen.getByText("By project").closest(".card") as HTMLElement;
    fireEvent.click(card.querySelectorAll("tbody tr")[1] as HTMLElement);
    let panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("heading", { name: "Runwal Avenue" })).toBeTruthy();
    expect(within(panel).getAllByRole("row")).toHaveLength(3); // header + 2
    fireEvent.click(within(panel).getByLabelText("Close"));
    fireEvent.click(tile("New Registrations"));
    panel = await screen.findByRole("dialog");
    expect(within(panel).getByText("New registrations")).toBeTruthy();
    expect(within(panel).getAllByRole("row")).toHaveLength(5); // header + 4
  });

  it("one society: selects it in Hi Society, reads only it, and leaves it selected", async () => {
    renderSection({}, "3710");
    await waitFor(() => expect(val("Registered Customers")).toBe("2"));
    expect(trail()).toEqual(["switch 3710", "read 3710 upTo", "read 3710 range"]);
    expect(projectRows()).toEqual([["Runwal Avenue", "Both", "2", "1", "1", "50%"]]);
    expect(selected).toBe("3710");
  });

  it("Post Sales sends display_view 'Pre Sales' and drops the split", async () => {
    renderSection({ displayView: "0" }, "3685");
    await waitFor(() => expect(val("Registered Customers")).toBe("2"));
    calls().filter((u) => u.pathname.endsWith("user_societies.json"))
      .forEach((u) => expect(u.searchParams.get("q[display_view_eq]")).toBe("Pre Sales"));
    expect(tile("Registered Customers").querySelector(".su-split")).toBeNull();
  });

  it("iOS: tiles and projects count accounts with the app on an iPhone; never logged in has no platform", async () => {
    renderSection({ devPlatform: "ios" });
    await waitFor(() => expect(val("Registered Customers")).toBe("2"));
    expect([val("New Registrations"), val("Registered, Never Logged In")]).toEqual(["2", "—"]);
    expect(tile("Registered, Never Logged In").textContent).toContain("no phone yet, so not on iOS: 3 under All platforms");
    const nudge = screen.getByText("Needs a nudge · named list").closest(".card") as HTMLElement;
    expect(nudge.textContent).toContain("they are on neither iOS nor Android");
    expect(projectRows()).toEqual([
      ["Runwal Avenue", "Post Possession", "1", "1", "—", "—"],
      ["Runwal Gardens", "Post Possession", "1", "1", "—", "—"],
    ]);
    calls().forEach((u) => expect([...u.searchParams.keys()].some((k) => /os|platform|device/i.test(k))).toBe(false));
  });
});

describe("over time, funnel, by store and the gap", () => {
  const card = (id: string) => document.getElementById(id) as HTMLElement;

  it("buckets end on the last day; by day the points inside the dates add up to New Registrations", () => {
    const days = buckets("2026-10-22", "2026-11-20", "day");
    expect([days.length, days[0].start, days[29].end]).toEqual([30, "2026-10-22", "2026-11-20"]);
    const weeks = buckets("2026-10-22", "2026-11-20", "week");
    expect([weeks.length, weeks[7].start, weeks[7].end]).toEqual([8, "2026-11-14", "2026-11-20"]);
    expect(buckets("2026-10-22", "2026-11-20", "day", 1)[29].end).toBe("2026-10-21");
    const rows = toRows([...GARDENS, ...AVENUE], societies);
    expect(days.reduce((n, b) => n + rowsIn(rows, b).length, 0)).toBe(4);
  });

  it("all platforms: logged-in rate, the funnel, both stores and the never-logged-in bars, each opening its people", async () => {
    renderSection();
    await waitFor(() => expect(val("Registered Customers")).toBe("7"));
    expect(val("Logged-in Rate")).toBe("57.1%");
    expect(tile("Logged-in Rate").textContent).toContain("4 of 7 registered have logged in");
    const funnel = card("card-suFunnel");
    expect([...funnel.querySelectorAll(".dl-fr")].map((r) => r.textContent)).toEqual([
      "Registered4100%", "Logged in at least once375%",
    ]);
    expect(funnel.textContent).toContain("25% drop-off");
    const stores = card("card-suStore");
    expect([...stores.querySelectorAll(".role")].map((r) => r.textContent)).toEqual(["App Store (iOS)2", "Google Play (Android)2"]);
    const gap = card("card-suGap");
    expect(gap.querySelector(".kv2")?.textContent).toBe("1");
    const bars = gap.querySelectorAll("rect.dl-seg");
    expect(bars).toHaveLength(1);
    fireEvent.click(bars[0]);
    let panel = await screen.findByRole("dialog");
    expect(within(panel).getAllByRole("row")).toHaveLength(2); // header + Person 4
    fireEvent.click(within(panel).getByLabelText("Close"));
    fireEvent.click(funnel.querySelectorAll(".dl-fr")[1]);
    panel = await screen.findByRole("dialog");
    expect(within(panel).getAllByRole("row")).toHaveLength(4); // header + 3
    fireEvent.click(within(panel).getByLabelText("Close"));
    fireEvent.click(tile("Logged-in Rate"));
    panel = await screen.findByRole("dialog");
    expect(within(panel).getAllByRole("row")).toHaveLength(5); // header + 4
  });

  it("iOS: logged in on an iPhone, only the App Store, and no never-logged-in bars", async () => {
    renderSection({ devPlatform: "ios" });
    await waitFor(() => expect(val("Registered Customers")).toBe("2"));
    expect(val("Logged-in Rate")).toBe("28.6%");
    expect([...card("card-suFunnel").querySelectorAll(".dl-fr")].map((r) => r.textContent)).toEqual([
      "Registered4100%", "Logged in on iOS250%",
    ]);
    expect([...card("card-suStore").querySelectorAll(".role")].map((r) => r.textContent)).toEqual(["App Store (iOS)2"]);
    expect(card("card-suGap").querySelector("rect.dl-seg")).toBeNull();
    expect(card("card-suGap").textContent).toContain("Choose All platforms");
  });
});
