import type { ActivePage } from './types';

export const PROJECTS = ['All Projects', 'Society A', 'Society B', 'Society C'];

export const REAL_PROJECTS = ['Society A', 'Society B', 'Society C'];

export const BOOKED_HOMEBUYERS = 1900;

export const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

export const ACTIVE_USERS_BASE = MONTHS.map((_, i) => Math.round(1650 * (1 + i * 0.03)));

export const SESSIONS_BASE = MONTHS.map((_, i) => Math.round(2650 * (1 + i * 0.03)));

export const MODULES_LIST: [string, number][] = [
  ['Launch, Auth & Onboarding', 100],
  ['Home, Shell & Navigation', 96],
  ['Helpdesk & Service Requests', 56],
  ['Visitors & Daily Help', 60],
  ['Amenities & Club Bookings', 29],
  ['Food & Beverage', 33],
  ['Community (Notices/Events/Polls/Gallery)', 52],
  ['Other Projects & Referrals', 24],
  ['Cross-module list & create lifecycle', 47],
  ['Bills, Payments & Documents', 20],
  ['Profile, Settings & Notifications', 62],
  ['Webviews & Design Inputs', 16],
  ['Admin console', 8]
];

export const TOTAL_MODULES = MODULES_LIST.length;
export const TOTAL_REAL_EVENTS = 150;
export const TOTAL_LEGACY_EVENTS = 180;

export const PAGE_TITLES: Record<ActivePage, string> = {
  pgTraffic: 'Traffic & Session',
  pgAdopt: 'Adoption & Engagement',
  pgFlows: 'Workflow Usage'
};

export const RANGE_LABELS: Record<number, string> = {
  7: 'Last 7 days',
  30: 'Last 30 days',
  90: 'Last 90 days'
};

export const FOOTERS: Record<ActivePage, string> = {
  pgTraffic:
    "<b>Wireframe note.</b> Lockated is a <b>resident/society mobile app</b> (flutter_resident, CompanyName.lockated) — the company's own brand of the shared shell, running the SAME legacy call sites as Suncity. It ships no screens of its own; every brand-gated branch is cosmetic. It is <b>mobile-only</b>: there is no companion web/desktop client, so the All/iOS/Android device toggle is a pure OS split, not a cross-platform one. This dashboard also carries a proposed <b>Admin Scope</b> filter (All / Tower Admin / Super Admin) matching Suncity's and Sunteck's treatment — see the Adoption & Engagement page's Admin Tiers card. Lockated is <b>confirmed post-possession</b> (isPostSales=false) — booking-stamp fields all arrive as \"none\". Visitor creation on Lockated uses the <b>single-contact</b> variant, never multi_contact — the one real behavioural difference from Suncity's own catalogue — and, unlike Suncity, <b>Incident Management is unreachable</b> (commented out of the home grid) while <b>Convenience is enabled</b>. Every number on this dashboard is <b>seeded illustrative sample data</b> — it recomputes as you change filters, but nothing here is a live PostHog query. 150 modern events / 13 categories + 180 legacy events / 13 categories = 330 total, independently re-parsed from Lockated_App_PostHog_Events.xlsx. See the companion Chart Calculation & Instrumentation Reference for the full event-level disclosure.",
  pgAdopt:
    "<b>Wireframe note.</b> Module Breadth is measured against Lockated's own <b>13 catalogued categories</b> (150 modern events) — matching Suncity's own 13, since this sheet set is effectively Suncity's: the two brands reach the same surfaces from the same call sites. Adoption by workflow bucket uses the same 3 buckets as Workflow Usage as a <b>proposed</b> proxy for engagement breadth — the catalogue has no confirmed role/persona property. Admin Tiers is a <b>proposed, illustrative</b> scoping lens: Tower Admin vs. Super Admin is not a confirmed distinction anywhere in this catalogue (the admin console has no Lockated-specific styling; its tabs report through the single modern <code>admin_tab_selected</code> event), only inferred from 7 legacy admin tab-open events + <code>admin_page_clicked</code>.",
  pgFlows:
    "<b>Wireframe note.</b> 6 real workflows across 3 buckets, all using confirmed, catalogued Lockated event names. Cross-module list & create lifecycle, Launch/Auth/Onboarding, Home/Shell & Navigation, Bills/Payments & Documents, Profile/Settings & Notifications, Admin console and Webviews & Design Inputs are excluded from this layer as non-funnel-bearing bookkeeping/utility/shared-infrastructure categories. <b>Visitor Creation</b> is single-contact on this brand — the one workflow-level difference from Suncity's own catalogue. 150 modern events / 13 categories + 180 legacy events / 13 categories = 330 total, independently re-parsed from Lockated_App_PostHog_Events.xlsx. None of the 180 legacy events are unioned into any metric here — see the companion Chart Calculation & Instrumentation Reference §10 for the full reasoning."
};
