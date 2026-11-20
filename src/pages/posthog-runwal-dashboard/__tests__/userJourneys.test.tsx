// @vitest-environment jsdom
// User journeys (Workflow Usage, Runwal Connect / Realty): people -> sessions -> steps, each request with
// the page's filters.
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ADOPTION_API } from "../api/api";
import type { DashboardFilters } from "../api/types";
import { UserJourneysCard, ago, fmtDT, fmtDur, stepLabel, toCsv } from "../components/workflow/UserJourneysCard";

const filters: DashboardFilters = {
  siteIds: [], from: "2026-10-22", to: "2026-11-20", token: "t", devPlatform: "android", licensedSeats: null,
  module: "visitors", subModule: null, apiPath: ADOPTION_API.runwalConnect, displayView: "1", societyIds: ["3685"],
};

const person = { user_key: "42", user_id: "42", first_name: "Asha", last_name: "Rao", email: "asha@example.com",
                 society_id: "3685", phase: "Post Possession", sessions: 2, events: 8, last_seen: "2026-11-20T10:00:00+05:30", minutes_ago: 90 };
const answers: Record<string, unknown> = {
  user_journeys: { meta: { total: 1, pages: 1, page: 1, per_page: 20 }, people: [person] },
  user_journey_sessions: { meta: { total: 1, pages: 1, page: 1, per_page: 2000, truncated: false }, person,
    summary: { sessions: 1, screens: 1, taps: 2, problems: 1, avg_duration_s: 240 },
    sessions: [{ id: "s1", started_at: "2026-11-20T10:00:00+05:30", ended_at: "2026-11-20T10:04:00+05:30", duration_s: 240,
                 events: 5, screens: 1, taps: 2, problems: 1, first_screen: "home", last_event: "logout_tapped", ended_by: "logout" }] },
  user_journey_steps: { meta: { total: 3, pages: 1, page: 1, per_page: 2000, truncated: false },
    session: { id: "s1", started_at: "2026-11-20T10:00:00+05:30", ended_at: "2026-11-20T10:04:00+05:30", duration_s: 240, ended_by: "logout", counts: {} },
    steps: [
      { at: "2026-11-20T10:00:00.000+05:30", offset_s: 0, event: "home_screen_viewed", kind: "screen", screen: "home" },
      { at: "2026-11-20T10:01:00.000+05:30", offset_s: 60, event: "visitor_add_tapped", kind: "tap", screen: "visitors" },
      { at: "2026-11-20T10:03:00.000+05:30", offset_s: 180, event: "payment_failed", kind: "problem", screen: "payments" },
    ] },
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn().mockImplementation(async (url: string) => {
    const endpoint = new URL(url, "http://localhost").pathname.split("/adoption/")[1];
    return { ok: true, json: async () => answers[endpoint] };
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const calls = (endpoint: string) => fetchMock.mock.calls.map((c) => new URL(String(c[0]), "http://localhost"))
  .filter((u) => u.pathname.endsWith(`/adoption/${endpoint}`));

const renderCard = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <UserJourneysCard filters={filters} societies={[{ id: "3685", name: "Runwal Gardens" }]} />
  </QueryClientProvider>
);

describe("User journeys card", () => {
  it("lists people with the page filters, then a person's sessions, then a session's steps", async () => {
    renderCard();
    await screen.findByText("Asha");
    expect(screen.getByText("Runwal Gardens")).toBeTruthy();
    const people = Object.fromEntries(calls("user_journeys")[0].searchParams.entries());
    expect(people).toMatchObject({ from: "2026-10-22", to: "2026-11-20", society_id: "3685", display_view: "1", os: "Android",
                                   sort: "first_name", dir: "asc", page: "1" });
    expect(people.module).toBeUndefined();

    fireEvent.click(screen.getByText("Asha"));
    await screen.findByText("Logged out");
    // the person's header, chips and stage, as in the wireframe
    expect(screen.getByText("Asha Rao", { selector: "h3" })).toBeTruthy();
    expect(screen.getByText("Post Possession")).toBeTruthy();
    expect(screen.getByText("Average session")).toBeTruthy();
    expect(screen.getAllByText("4m 00s").length).toBe(2); // the Average session chip and the session's Duration
    expect(Object.fromEntries(calls("user_journey_sessions")[0].searchParams.entries())).toMatchObject({ user: "42", society_id: "3685" });

    fireEvent.click(screen.getByText("Logged out"));
    await screen.findByText("Payment failed");
    expect(screen.getByText(/Session on/)).toBeTruthy();
    expect(screen.getByText("Tapped visitor add")).toBeTruthy();
    expect(Object.fromEntries(calls("user_journey_steps")[0].searchParams.entries())).toMatchObject({ user: "42", session: "s1" });
    fireEvent.click(screen.getByText("Problems (1)"));
    expect(screen.queryByText("Visitor add tapped")).toBeNull();
    expect(screen.getByText("Payment failed")).toBeTruthy();

    fireEvent.click(screen.getByText("All people"));
    await screen.findByText("Download CSV");
  });

  it("sorts and searches on the server", async () => {
    renderCard();
    await screen.findByText("Asha");
    fireEvent.click(screen.getByText("Sessions"));
    await waitFor(() => expect(calls("user_journeys").some((u) => u.searchParams.get("sort") === "sessions" && u.searchParams.get("dir") === "desc")).toBe(true));
    fireEvent.change(screen.getByLabelText("Search people"), { target: { value: "asha" } });
    await waitFor(() => expect(calls("user_journeys").some((u) => u.searchParams.get("q") === "asha")).toBe(true), { timeout: 2000 });
  });
});

describe("helpers", () => {
  it("formats like the wireframe", () => {
    expect(fmtDur(456)).toBe("7m 36s");
    expect(fmtDur(3725)).toBe("1h 02m");
    expect(ago(new Date().toISOString())).toBe("Today");
    expect(ago("2026-11-15T10:00:00+05:30", new Date("2026-11-20T09:00:00+05:30"))).toBe("5 d ago");
    expect(fmtDT("2026-06-27T08:09:00")).toBe("27 Jun 2026, 8:09 AM");
    expect(stepLabel("visitor_add_tapped")).toBe("Tapped visitor add");
    expect(stepLabel("home_page_viewed")).toBe("Home");
    expect(stepLabel("wallet_balance_load_failed")).toBe("Wallet balance load failed");
    expect(stepLabel("support_tab_page_clicked")).toBe("Opened the support tab");
  });
  it("quotes CSV cells", () => {
    expect(toCsv(["A", "B"], [['Rao, "Jr"', 2]])).toBe('"A","B"\n"Rao, ""Jr""","2"');
  });
});
