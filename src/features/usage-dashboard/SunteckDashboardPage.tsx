import UsageDashboardPage from "./UsageDashboardPage";

/**
 * Sunteck usage analytics — standalone page locked to Sunteck (app_id 16).
 * Route: /sunteck-usage-analytics
 *
 * Full dashboard UI lives in UsageDashboardPage; fixedSite locks this page
 * to Sunteck only (no site switcher, no mixed data).
 */
export default function SunteckDashboardPage() {
  return <UsageDashboardPage fixedSite="sunteck" />;
}
