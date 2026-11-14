// @vitest-environment jsdom
// Kalpataru's Adoption & Engagement page and the module adoption card, rendered with the API answers
// mocked: the cards must show the API's numbers and the labels must say what they count.
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const answers = vi.hoisted(() => ({
  engagement: {} as Record<string, unknown>,
  moduleTree: {} as Record<string, unknown>,
}));
const ok = (data: unknown) => ({ data, isLoading: false, isFetching: false, isError: false, error: null, refetch: () => {} });

vi.mock("../../posthog-runwal-dashboard/hooks/useDashboardAnalytics", () => ({
  useAdoptionEngagement: () => ok(answers.engagement),
  useAdoptionTrend: () => ok({ weekly: { current: [], previous: [] }, trend_pct: null }),
  useGrowth: () => ok({ weeks: [] }),
  useRetention: () => ok({ cohorts: [] }),
  useRoles: () => ok({ total_users: 0, roles: [] }),
  useModuleTree: () => ok(answers.moduleTree),
}));
// Charts draw SVG from measured sizes jsdom does not have; they are not under test here.
vi.mock("../../posthog-runwal-dashboard/components/charts/LineChart", () => ({ LineChart: () => null }));
vi.mock("../../posthog-runwal-dashboard/components/charts/StackedBarChart", () => ({ StackedBarChart: () => null }));

import { AdoptionEngagementPage } from "../components/pages/AdoptionEngagementPage";
import { DashboardProvider } from "../../posthog-runwal-dashboard/context/DashboardContext";
import { ModuleAdoptionCard } from "../../posthog-runwal-dashboard/components/adoption/ModuleAdoptionCard";
import { ADOPTION_API } from "../../posthog-runwal-dashboard/api/api";
import type { DashboardFilters } from "../../posthog-runwal-dashboard/api/types";

const filters: DashboardFilters = {
  siteIds: [], from: "2026-10-15", to: "2026-11-13", token: "", devPlatform: "all",
  licensedSeats: null, module: null, subModule: null, apiPath: ADOPTION_API.kalpataru,
};

const ENGAGEMENT = {
  seat_utilisation: { value: null, used_seats: 244, licensed_seats: null, delta_pct: null },
  stickiness: { value: 5.6, avg_dau: 13.6, mau: 244, delta_pct: null },
  adoption_trend: { value: 131.03, wau_now: 201, wau_4wk_ago: 0, baseline_weeks: 1 },
  activation: { value: 86.5, joiners: 244, delta_pct: null },
  module_breadth: { in_use: 3, total: 4 },
  dormant_users: { value: 0, band: "14+ days" },
};

afterEach(cleanup);

/** Renders inside the provider the dashboard page wraps everything in. */
const show = (ui: React.ReactElement) => render(<DashboardProvider>{ui}</DashboardProvider>);

describe("Kalpataru Adoption & Engagement", () => {
  it("shows the API's numbers on the cards", () => {
    answers.engagement = ENGAGEMENT;
    answers.moduleTree = { tree: [], modules: [], active_users: 244 };
    show(<AdoptionEngagementPage filters={filters} benchmarks={{}} onBenchmarkChange={() => {}} sitesSettled showPrev />);
    expect(screen.getByText("+131.0%")).toBeTruthy();
    expect(screen.getByText(/^3\s*\/\s*4$/)).toBeTruthy();
    expect(screen.getByText("6%")).toBeTruthy(); // stickiness 5.6, shown rounded
    expect(screen.getByText("87%")).toBeTruthy(); // activation 86.5, shown rounded
  });

  it("Adoption Trend says how many weeks the API averaged (1 week since go-live), not always 8", () => {
    answers.engagement = ENGAGEMENT;
    show(<AdoptionEngagementPage filters={filters} benchmarks={{}} onBenchmarkChange={() => {}} sitesSettled showPrev />);
    expect(screen.getByText(/vs prior 1-week average/)).toBeTruthy();
    expect(screen.queryByText(/vs prior 8 weeks/)).toBeNull();
  });
});

describe("Module adoption card", () => {
  it("an app without a module list (Kalpataru) shows its screens and says so", () => {
    answers.moduleTree = {
      active_users: 244, modules: [],
      tree: [{ name: "home_page", users: 228, events: 471, sessions: 437, share_pct: 93.4 }],
    };
    show(<ModuleAdoptionCard filters={filters} />);
    expect(screen.getByText("Adoption by screen")).toBeTruthy();
    expect(screen.getByText("Which screens are used most")).toBeTruthy();
    expect(screen.getByText("93%")).toBeTruthy();
  });

  it("an app with a module list keeps the workflow-bucket wording", () => {
    answers.moduleTree = {
      active_users: 10, tree: [],
      modules: [{ key: "visitors", name: "Visitors", users: 5, events: 9, sessions: 6, share_pct: 50 }],
    };
    show(<ModuleAdoptionCard filters={filters} />);
    expect(screen.getByText("Adoption by workflow bucket")).toBeTruthy();
    expect(screen.getByText("Visitors")).toBeTruthy();
  });
});
