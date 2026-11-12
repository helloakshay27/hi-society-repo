export interface InfoEntry {
  t: string;
  f: string;
  d: string;
}

/**
 * "How this is calculated" dictionary, keyed by metric id. The formulas say what the usage-analytics
 * backend computes (posthog_backend app/controllers/concerns/adoption_metrics.rb), worded as in the
 * dashboard guide; business-meaning copy adapted from the wireframe's KPI_INFO dictionary.
 */
export const INFO: Record<string, InfoEntry> = {
  U1: { t: 'Active Users (U1)', f: 'Count of different people (each user_id once) who did at least one thing during the selected period.', d: 'Shows the reach of the app among registered gate staff and admins — how many people actually used it, not how many times.' },
  U2: { t: 'Screen Views (U2)', f: 'Count of every screen-load (view) event in the period: a <screen>_viewed / <screen>_opened event in the app.', d: 'Overall screen/content consumption across the app.' },
  U3: { t: 'Sessions (U3)', f: 'Count of distinct sessions (visits) with activity in the period.', d: 'Usage volume across all gate devices.' },
  U4: { t: 'Session Duration (U4)', f: 'Total time of all sessions ÷ number of sessions (a session runs from its first to its last event; sessions started in the period).', d: 'Engagement depth per shift.' },
  U5: { t: 'Bounce Rate (U5)', f: 'Sessions that never get past the launch, sign-in or home screen (splash, login, OTP, home) ÷ all sessions × 100.', d: 'Immediate exits, or a device left idle after login. Lower is better.' },
  U6: { t: 'Recently Online (U6)', f: 'Distinct users with at least one event in the last 30 minutes.', d: 'A live pulse of which gates are currently active.' },
  U7: { t: 'Usage over time (U7)', f: 'Three interchangeable series over the same time axis — Visitors (=U1), Views (=U2), Sessions (=U3) — each with a previous-period dashed overlay.', d: 'Lets you spot the trend and compare it like-for-like against the previous period.' },
  U8: { t: 'Device / Platform Split (U8)', f: 'Users on each platform (iOS, Android) ÷ all active users × 100; a user on both counts in both. Views / session = screen views ÷ sessions.', d: 'SmartSecure runs on gate tablets — this shows where release testing and support effort should concentrate.' },
  A1: { t: 'Seat Utilisation (A1)', f: 'Active users ÷ licensed seats × 100 (needs the licensed seat count).', d: 'Of all the accounts provisioned for gate staff, what share are actually being used.' },
  A2: { t: 'Stickiness (A2)', f: 'Average daily active users (DAU) over the period ÷ monthly active users (MAU, the 30 days ending on the end date) × 100.', d: 'Whether usage is habitual across shifts or only occasional.' },
  A3: { t: 'Adoption Trend (A3)', f: 'This week\'s active users (the last 7 days) vs the average of the 8 weeks before: (this week − average) ÷ average × 100. Weeks before the app went live are left out of the average.', d: 'A momentum reading — positive means more of the gate-staff base is engaging than 8 weeks ago.' },
  A4: { t: '14-Day Activation (A4)', f: 'New users (first seen in the period) who did a first real action — used a feature, not just sign-in or home — within 14 days of first appearing ÷ all new users × 100.', d: 'Whether newly added gate staff reach a first meaningful action within their first two weeks.' },
  A5: { t: 'Module Breadth (A5)', f: 'Modules used at least once in the period ÷ all modules: QuikGate\'s declared workflow groups; for SmartSecure, the screens the app has ever sent.', d: 'How much of the platform a gate/society has actually adopted, not just Home and Visitor check-in.' },
  A6: { t: 'Adoption Trend chart (A6)', f: 'Distinct users per Monday–Sunday week, last 8 weeks.', d: 'The trend line behind the Adoption Trend tile above.' },
  A7: { t: 'Growth Accounting (A7)', f: 'One bar per week: New (first week ever), Returning (also active the week before), Resurrecting (back after a gap); Dormant (below the line) = active the week before but not this week.', d: 'Explains why the active-user number moved — bars above the line are gains, the bar below is the loss.' },
  A8: { t: 'Retention Cohort Grid (A8)', f: 'Users grouped by the week they first appeared. Each cell = users from that group active N weeks later ÷ group size × 100.', d: 'Each row = gate staff first active that week; cells = % of that cohort still active N weeks later.' },
  A9: { t: 'Adoption by Role (A9)', f: 'Active users per person role ÷ active users that have a role × 100. Users whose profile carries no role are not counted.', d: "Shows whether adoption is concentrated at the gate or also reaching the people who configure Setup and review history." },
  A10: { t: 'Dormant Users (A10)', f: 'Count of users seen before whose last activity is 14 or more days ago.', d: 'Registered gate staff/admins with no activity in the last 14 days.' },
  A11: { t: 'Society-wise Breakdown (A11)', f: 'Per society: active users, sessions, avg session, bounce rate, trend vs. previous period, and a status band from bounce rate (Watch ≥22% / Steady 16–21% / Healthy <16%).', d: 'A leaderboard to see which societies are adopting well and which are lagging.' },
  'F-adopt': { t: 'Workflow Adoption (F-adopt)', f: 'Users who did the workflow\'s first step ÷ users active in the period × 100.', d: 'Shows how many gate staff attempt this process.' },
  'F-comp': { t: 'Completion Rate (F-comp)', f: 'Users who reached the final step ÷ users who did the first step × 100.', d: 'How effectively the workflow converts to a completed check-in / check-out / creation.' },
  'F-step': { t: 'Biggest Step Drop (F-step)', f: 'At every step: users lost ÷ users at the step before × 100. The largest loss is shown, with the step it happens at.', d: 'Highlights where the gate process is losing completions — often a validation or API failure.' },
  'F-vol': { t: 'Usage Volume (F-vol)', f: 'Count of users who reached the final step in the period.', d: 'Absolute volume of successful check-ins, check-outs, or creations.' },
  'F-scr': { t: 'All screens in this module (F-scr)', f: 'Views per screen, ranked high to low, with the users and sessions that viewed it.', d: 'The module-scoped equivalent of the funnel above, at the individual-screen level.' },
  'F-entry': { t: 'Top entry screens (F-entry)', f: 'Only the first screen of each session counts: visitors = distinct users whose session started on that screen; views = screen views in those sessions; bounce = sessions with at most one view.', d: 'Where gate staff land — usually the Splash/device-approval flow or Home after login.' },
  tierCoverage: { t: 'Known-dead areas · reference', f: 'Reference card — not a filter. QuikGate catalogue documents two real areas that are fully wired in code but cannot fire in the current build because nothing routes to their screens.', d: 'Surfaces funnels at true-to-code volume so a reviewer sees the gap directly rather than an unexplained absence from Workflow Usage; it does not change any other number on the dashboard.' },
};

export interface DeadAreaItem {
  area: string;
  status: string;
  statusClass: 'st-drop' | 'st-watch' | 'st-healthy';
  eventsAffected: string | number;
}

export const KNOWN_DEAD_AREAS: DeadAreaItem[] = [
  {
    area: 'Device Registration (gate terminal)',
    status: 'Disabled route',
    statusClass: 'st-drop',
    eventsAffected: 5,
  },
  {
    area: 'otp_*{flow=login}',
    status: 'Never navigated to',
    statusClass: 'st-drop',
    eventsAffected: '5 (shared with forgot_password)',
  },
  {
    area: 'otp_*{flow=registration}',
    status: 'Never navigated to',
    statusClass: 'st-drop',
    eventsAffected: '5 (shared with forgot_password)',
  },
  {
    area: 'bluetooth_device_connect_failed',
    status: 'Never emitted',
    statusClass: 'st-watch',
    eventsAffected: 1,
  },
];

/** User-defined KPI benchmarks — rate metrics start with a suggested target, count metrics start blank. Ported from the wireframe's BM_DEFAULTS (only the ids actually wired to a tile in this build). */
export const BM_DEFAULTS: Record<string, number> = {
  activeUsers: 75,
  bounceRate: 18,
  seatUtil: 60,
  stickiness: 55,
  activation14: 55,
  'F-adopt': 50,
  'F-comp': 70,
};

/** ILLUSTRATIVE — there is no live PostHog project behind SmartSecure at all. This 12-point
 *  curve is a plain smooth-growth shape chosen only so the "Usage over time" chart looks
 *  populated; it is NOT anchored to any real endpoint from any live project. */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const ACTIVE_USERS_BASE = [1650, 1720, 1790, 1860, 1930, 2000, 2070, 2140, 2205, 2270, 2330, 2390];
export const SESSIONS_BASE = [9200, 9600, 10000, 10400, 10800, 11200, 11600, 12000, 12380, 12760, 13120, 13480];

/** ILLUSTRATIVE placeholder society names — sample data only, not real SmartSecure client names. */
export const PROJECTS = ['Society A – Powai', 'Society B – Andheri', 'Society C – Malad', 'Society D – Chembur'];

/**
 * ILLUSTRATIVE ceiling — an estimated total registered-gate-staff-and-admin count across
 * societies, not a real/confirmed figure. Named identically to the wireframe's own
 * `BOOKED_HOMEBUYERS` constant (kept for parity with the shared JS engine it was ported
 * from); it functions here as the "registered gate staff" ceiling Active Users is scaled
 * against.
 */
export const BOOKED_HOMEBUYERS = 2500;

/**
 * 17 real modules, taken verbatim from SmartSecure_PostHog_Events.xlsx ("PostHog Events"
 * sheet) — 180 events across 38 categories. The reach % next to each module is
 * illustrative/sample; there is no live PostHog project behind SmartSecure yet.
 */
export const MODULES_LIST: [string, number][] = [
  ['Home', 100], ['Splash & Device Approval', 97], ['Authentication', 94], ['Visitor Management', 86],
  ['Staff Management', 71], ['Profile & Staff Verification', 52], ['Notifications', 48],
  ['Member Vehicle', 44], ['Visitor Vehicle', 41], ['QR Scanner / Gate Entry', 63],
  ['Setup', 36], ['Patrolling', 33], ['Goods Outward', 28], ['History Filter (shared)', 39],
  ['Help Center', 17], ['Shared Utilities', 45], ['App Lifecycle', 100],
];
export const TOTAL_MODULES = MODULES_LIST.length;

export const TREND_WEEKS = 8;
export const GROWTH_WEEKS = 6;
export const RETENTION_WEEKS = 8;

