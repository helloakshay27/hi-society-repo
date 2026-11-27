// @vitest-environment jsdom
// The society dropdown on Artesia / Sunteck / Suncity: every request the page makes carries the chosen
// society as society_id (one or many), and none for All Societies, on that site's own API.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLiveWorkflow, fetchRecentActiveUsers, fetchTrafficSection, fetchWorkflowModules } from "../api";

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); });

const urls = () => fetchMock.mock.calls.map((c) => new URL(String(c[0]), "http://localhost"));
const range = { from: "2026-10-25", to: "2026-11-23" };

describe("society_id on the Artesia / Sunteck / Suncity requests", () => {
  it("goes on every card's request for the chosen society", async () => {
    const input = { appId: "29", ...range, dev: "all" as const, societyIds: ["3636"] };
    await fetchTrafficSection({ ...input, appId: "16" });
    await fetchWorkflowModules({ ...input, appId: "16" });
    // An empty answer is an error for the funnel; only the request it sent matters here.
    await fetchLiveWorkflow({ ...input, appId: "16" }, null).catch(() => null);
    await fetchRecentActiveUsers({ appId: "16", ...range, societyIds: ["3636", "3637"] });
    const all = urls();
    expect(all.length).toBeGreaterThan(3);
    for (const u of all) {
      expect(u.pathname).toContain("/residential/sunteck/adoption/");
    }
    expect(all.slice(0, -1).every((u) => u.searchParams.get("society_id") === "3636")).toBe(true);
    expect(all[all.length - 1].searchParams.get("society_id")).toBe("3636,3637");
  });

  it("is left out for All Societies", async () => {
    await fetchTrafficSection({ appId: "6", ...range, dev: "all", societyIds: [] });
    await fetchRecentActiveUsers({ appId: "6", ...range });
    expect(urls().every((u) => !u.searchParams.has("society_id"))).toBe(true);
  });
});
