// @vitest-environment jsdom
// Kalpataru dashboard → its own analytics API. The backend fixes Kalpataru's scope (project code KL-PS01,
// the live app), so every request must go to /residential/kalpataru/adoption/* and carry only filters.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADOPTION_API,
  fetchAdoptionTrend,
  fetchModules,
  fetchRecentActiveUsers,
  fetchTrafficSession,
  fetchWorkflowUsage,
} from "../../posthog-runwal-dashboard/api/api";
import type { DashboardFilters } from "../../posthog-runwal-dashboard/api/types";

const filters = (over: Partial<DashboardFilters> = {}): DashboardFilters => ({
  siteIds: [],
  from: "2026-10-15",
  to: "2026-11-13",
  token: "t",
  devPlatform: "all",
  licensedSeats: null,
  module: null,
  subModule: null,
  apiPath: ADOPTION_API.kalpataru,
  ...over,
});

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

/** The URL of the n-th request the page made. */
const requested = (n = 0) => new URL(String(fetchMock.mock.calls[n][0]), "http://localhost");
const params = (n = 0) => Object.fromEntries(requested(n).searchParams.entries());

describe("Kalpataru analytics requests", () => {
  it("has its own API path", () => {
    expect(ADOPTION_API.kalpataru).toBe("residential/kalpataru");
  });

  it("traffic_session goes to Kalpataru's API with the date range and the app's platform only", async () => {
    await fetchTrafficSession(filters());
    expect(requested().pathname).toMatch(/\/residential\/kalpataru\/adoption\/traffic_session$/);
    expect(params()).toEqual({ from: "2026-10-15", to: "2026-11-13", device_type: "Mobile" });
  });

  it("never sends an app id, project code, tenant url or site id (the API fixes the scope)", async () => {
    await fetchTrafficSession(filters({ appId: "29", projectCode: "KL-PS01", url: "kalpataru.lockated.com" }));
    for (const key of ["app_id", "project_code", "url", "base_url", "site_id"]) {
      expect(requested().searchParams.has(key)).toBe(false);
    }
  });

  it("the platform buttons send the matching OS", async () => {
    await fetchTrafficSession(filters({ devPlatform: "android" }));
    await fetchTrafficSession(filters({ devPlatform: "ios" }));
    expect(params(0)).toMatchObject({ device_type: "Mobile", os: "Android" });
    expect(params(1)).toMatchObject({ device_type: "Mobile", os: "ios" });
  });

  it("workflow_usage and modules pass the selected screen", async () => {
    await fetchWorkflowUsage(filters(), "my_account", null);
    await fetchModules(filters(), "my_account");
    expect(requested(0).pathname).toMatch(/\/residential\/kalpataru\/adoption\/workflow_usage$/);
    expect(params(0)).toMatchObject({ module: "my_account" });
    expect(requested(0).searchParams.has("sub_module")).toBe(false);
    expect(requested(1).pathname).toMatch(/\/residential\/kalpataru\/adoption\/modules$/);
    expect(params(1)).toMatchObject({ module: "my_account" });
  });

  it("recent activity asks for 10 rows; the trend for 8 weeks", async () => {
    await fetchRecentActiveUsers(filters());
    await fetchAdoptionTrend(filters());
    expect(requested(0).pathname).toMatch(/\/recent_active_users$/);
    expect(params(0)).toMatchObject({ limit: "10" });
    expect(params(1)).toMatchObject({ weeks: "8" });
  });

  it("a page without an API path fails loudly instead of calling a shared endpoint", async () => {
    await expect(fetchTrafficSession(filters({ apiPath: undefined }))).rejects.toThrow(/no adoption API/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("an error answer surfaces as an error (the card shows its error state)", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 422, statusText: "Unprocessable" });
    await expect(fetchTrafficSession(filters())).rejects.toThrow(/422/);
  });
});
