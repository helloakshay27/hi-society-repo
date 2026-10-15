import UsageDashboardPage from "./UsageDashboardPage";

/**
 * Suncity usage analytics — standalone page locked to Suncity (app_id 6).
 * Route: /suncity-usage-analytics
 *
 * Full dashboard UI lives in UsageDashboardPage; fixedSite locks this page
 * to Suncity only (no site switcher, no mixed data).
 */
export default function SuncityDashboardPage() {
  return <UsageDashboardPage fixedSite="suncity" />;
}
