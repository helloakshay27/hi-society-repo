// @vitest-environment jsdom
// The society dropdown on Runwal Connect / Realty: its list (the user's Hi Society societies, as in the
// header) and the society_id it sends to the analytics API.
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ADOPTION_API, fetchRecentActiveUsers, fetchTrafficSession, fetchUserSocieties } from "../api/api";
import type { DashboardFilters } from "../api/types";
import { FilterBar } from "../components/common/FilterBar";

const filters = (over: Partial<DashboardFilters> = {}): DashboardFilters => ({
  siteIds: [], from: "2026-10-22", to: "2026-11-20", token: "t", devPlatform: "all", licensedSeats: null,
  module: null, subModule: null, apiPath: ADOPTION_API.runwalConnect, ...over,
});

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const params = (n = 0) => Object.fromEntries(new URL(String(fetchMock.mock.calls[n][0]), "http://localhost").searchParams.entries());

describe("society_id on Runwal requests", () => {
  it("is sent for the chosen society, one or many, and not at all for All Societies", async () => {
    await fetchTrafficSession(filters({ societyIds: ["3685"] }));
    await fetchRecentActiveUsers(filters({ societyIds: ["3685", "3710"] }));
    await fetchTrafficSession(filters({ societyIds: [] }));
    await fetchTrafficSession(filters());
    expect(params(0).society_id).toBe("3685");
    expect(params(1).society_id).toBe("3685,3710");
    expect(params(2).society_id).toBeUndefined();
    expect(params(3).society_id).toBeUndefined();
  });
});

describe("the society list", () => {
  const society = (id: number, id_society: number, name: string) => ({ id, id_society, society: { id: id_society, building_name: name } });

  it("comes from user_approved_societies.json, one entry per society, sorted by name", async () => {
    localStorage.setItem("baseUrl", "hi-society.lockated.com");
    localStorage.setItem("token", "login.jwt");
    localStorage.setItem("org_id", "4");
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ user_societies: [
      society(91, 3710, "Runwal Avenue"), society(92, 3685, "Runwal Gardens"), society(93, 3685, "Runwal Gardens"),
    ] }) });
    expect(await fetchUserSocieties()).toEqual([
      { id: "3710", name: "Runwal Avenue" }, { id: "3685", name: "Runwal Gardens" },
    ]);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/user_approved_societies.json");
    expect(Object.fromEntries(url.searchParams.entries())).toEqual({ token: "login.jwt", organization_id: "4" });
  });

  it("falls back to the list the header saved when the call fails", async () => {
    localStorage.setItem("baseUrl", "hi-society.lockated.com");
    localStorage.setItem("token", "login.jwt");
    localStorage.setItem("hiSocietyApprovedSocieties", JSON.stringify([society(91, 3709, "Runwal Bliss")]));
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    expect(await fetchUserSocieties()).toEqual([{ id: "3709", name: "Runwal Bliss" }]);
  });
});

describe("the dropdown", () => {
  const base = {
    range: 30, rangeLabel: "Last 30 days", rangeFrom: "2026-10-22", rangeTo: "2026-11-20", onSetRange: () => {},
    onSetCustomRange: () => {}, sites: [], selectedSiteId: "all", onSelectSite: () => {}, dev: "all" as const,
    onSelectDev: () => {}, prev: true, onTogglePrev: () => {}, recentlyOnlineCount: 0,
  };

  it("lists All Societies and the user's societies, and reports the choice", () => {
    const onSelectSociety = vi.fn();
    render(<FilterBar {...base} showSocietyFilter societies={[{ id: "3685", name: "Runwal Gardens" }]}
                      selectedSocietyId="all" onSelectSociety={onSelectSociety} />);
    const select = screen.getByLabelText("Society") as HTMLSelectElement;
    expect([...select.options].map((o) => o.text)).toEqual(["All Societies", "Runwal Gardens"]);
    fireEvent.change(select, { target: { value: "3685" } });
    expect(onSelectSociety).toHaveBeenCalledWith("3685");
  });

  it("is not shown unless the page asks for it (Runwal CP and the other dashboards)", () => {
    render(<FilterBar {...base} />);
    expect(screen.queryByLabelText("Society")).toBeNull();
  });
});
