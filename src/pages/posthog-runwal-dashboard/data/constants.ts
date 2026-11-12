import { KpiInfo } from '../types';

export function fmtC(n: number): string {
  if (n == null || isNaN(n)) return '—';
  if (n >= 100000) return Math.round(n / 1000) + 'K';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
  return String(Math.round(n));
}

export function pct(x: number, d?: number): string {
  if (x == null || isNaN(x)) return '—';
  return x.toFixed(d == null ? 0 : d) + '%';
}

// "2026-07-12" → "7/12" (matches the Usage-over-time chart's axis label format).
// Non-ISO-date strings (e.g. already-short labels) are returned unchanged.
export function fmtDateShort(value: string | null | undefined): string {
  if (!value) return '';
  const parts = value.split('-');
  return parts.length === 3 ? `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}` : value;
}

export const BM_DEFAULTS: Record<string, number> = {
  activeUsers: 75,
  bounceRate: 18,
  engagementRate: 65,
  featureInteractionRate: 50,
  wfAdoption: 50,
  wfCompletion: 70,
  wfDropoff: 30,
  featureAdoptionRate: 60,
  repeatUsageRate: 55,
  day1Retention: 55,
  day7Retention: 35,
  day30Retention: 20,
  churnRate: 10,
  crashFreeUsers: 99,
  crashFreeSessions: 99,
  seatUtil: 75,
  stickiness: 35,
  activation14: 60,
};

export const KPI_INFO: Record<string, KpiInfo> = {
  'Active Users': {
    f: 'Different people (each user_id counted once) who did at least one thing in the app during the selected period.',
    m: "Shows the reach of the app among booked homebuyers — pulled directly from person-level usage activity.",
  },
  'Screen Views': {
    f: 'Count of every screen-load (view) event in the period: a page view on web, a <screen>_viewed / <screen>_opened event in the app.',
    m: 'Overall content consumption across the app.',
  },
  'Total Sessions': {
    f: 'Count of distinct sessions (visits) in the period.',
    m: 'Usage volume across all customers.',
  },
  'Sessions': {
    f: 'Count of distinct sessions (visits) in the period.',
    m: 'Usage volume across all customers.',
  },
  'Average Session Duration': {
    f: 'Total session time ÷ total sessions.',
    m: 'Engagement depth per visit.',
  },
  'Session Duration': {
    f: 'Total session time ÷ total sessions.',
    m: 'Engagement depth per visit.',
  },
  'Bounce Rate': {
    f: 'Sessions that only saw the launch or home screen ÷ all sessions × 100. Lower is better.',
    m: 'Immediate exits or a poor first impression.',
  },
  'Returning Users': {
    f: 'Users active in the period who were also active in a prior period.',
    m: 'Retention and loyalty of the customer base.',
  },
  'Recently Online': {
    f: 'Distinct customers with an event in the last 30 minutes.',
    m: 'A live pulse of who is in the app right now.',
  },
  'Views / Session': {
    f: 'Total screen views ÷ total sessions.',
    m: 'How much of the app a customer explores per visit.',
  },
  'Device / Platform Split': {
    f: 'Users on each OS ÷ all active users × 100 (Android vs iOS).',
    m: 'Shows device platform distribution for engineering and QA priorities.',
  },
  'Seat Utilisation': {
    f: 'Active unique users ÷ Licensed seats capacity.',
    m: 'Shows the overall penetration and adoption level among all eligible users.',
  },
  'Stickiness': {
    f: 'Average Daily Active Users (DAU) ÷ Monthly Active Users (MAU).',
    m: 'Measures how habitually and repeatedly customers return to the app.',
  },
  'Adoption Trend': {
    f: "This week's active users (the last 7 days) compared with the average of the 8 weeks before: (this week − average) ÷ average × 100. Weeks before the app went live are left out of the average.",
    m: 'Highlights whether app adoption is accelerating or plateauing over time.',
  },
  '14-Day Activation': {
    f: '% of new users who do a first real action within 14 days of first appearing.',
    m: 'Early onboarding health indicator.',
  },
  'Module Breadth': {
    f: 'Count of distinct modules used at least once ÷ Total modules available.',
    m: 'How much of the platform a customer base has actually adopted.',
  },
  'Workflow Adoption': {
    f: "Users who did the workflow's first step ÷ active users × 100.",
    m: 'Shows how many customers attempt this process.',
  },
  'Completion Rate': {
    f: 'Users who reached the final step ÷ users who started × 100.',
    m: 'How effectively the workflow converts.',
  },
  'Biggest Step Drop': {
    f: 'The % lost at every step (users lost ÷ users at the step before); the largest is shown.',
    m: 'Pinpoints UX friction and abandonment points.',
  },
  'Usage Volume': {
    f: 'Count of users who reached the final step in the period.',
    m: 'Absolute volume of successful business transactions.',
  },
};

export interface InfoEntry {
  t: string;  // Title
  f: string;  // Formula (how it's calculated)
  d: string;  // Description (why it matters)
}

/** Plain-language "how this is calculated" explanations, keyed by metric id or chart key. */
export const INFO: Record<string, InfoEntry> = {
  U1: {
    t: 'Active Users (U1)',
    f: 'Count of different people (each user_id once) who did at least one thing during the selected period.',
    d: 'Each person is counted only once no matter how many times they log in. Shows your net audience reach.',
  },
  U2: {
    t: 'Screen Views (U2)',
    f: 'Count of every screen-load (view) event in the period: a page view on web, a <screen>_viewed / <screen>_opened event in the app.',
    d: 'Counts every screen transition — climbs when users browse deeply, not just when more people log in.',
  },
  U3: {
    t: 'Total Sessions (U3)',
    f: 'Count of distinct sessions (visits) in the period. One visit runs from opening the app to leaving it.',
    d: 'Reflects total visit frequency and customer interaction touchpoints across all channels.',
  },
  U4: {
    t: 'Average Session Duration (U4)',
    f: 'Total time of all sessions ÷ number of sessions (a session runs from its first to its last event).',
    d: 'Measures engagement depth and how much time users spend browsing content per visit.',
  },
  U5: {
    t: 'Bounce Rate (U5)',
    f: 'Sessions that only saw the launch or home screen (splash, login, home) ÷ all sessions × 100.',
    d: 'Lower is better. High bounce rate indicates onboarding confusion or premature exits.',
  },
  U6: {
    t: 'Recently Online (U6)',
    f: 'Distinct customers with at least one telemetry event recorded in the last 30 minutes.',
    d: 'Provides a live pulse of real-time active users currently inside the application.',
  },
  A1: {
    t: 'Seat Utilisation (A1)',
    f: 'Active unique users ÷ Total booked homebuyers capacity (licensed seats).',
    d: 'Shows total user penetration and active adoption rate among all eligible customer accounts.',
  },
  A2: {
    t: 'Stickiness (A2)',
    f: 'Average Daily Active Users (DAU) ÷ Monthly Active Users (MAU).',
    d: 'Measures habit formation — a higher ratio indicates users return frequently throughout the month.',
  },
  A3: {
    t: 'Adoption Trend (A3)',
    f: "This week's active users (the last 7 days) vs the average of the 8 weeks before: (this week − average) ÷ average × 100. Weeks before the app went live are left out of the average.",
    d: 'Signals whether customer engagement is accelerating, steady, or decelerating.',
  },
  A4: {
    t: '14-Day Activation (A4)',
    f: 'New users who did a first real action (used a feature, not just sign-in or home) within 14 days of first appearing ÷ all new users in the period × 100.',
    d: 'Critical onboarding metric. Users active within their first 2 weeks have significantly higher long-term retention.',
  },
  A5: {
    t: 'Module Breadth (A5)',
    f: 'Count of distinct modules used at least once in the period ÷ Total modules available.',
    d: 'Highlights cross-functional adoption across documents, tickets, accounts, payments, and amenity bookings.',
  },
  F1: {
    t: 'Workflow Adoption (F1)',
    f: "Users who did the workflow's first step ÷ users active in the period × 100. With All Modules: users who got past launch and sign-in into any module ÷ active users.",
    d: 'Shows how widely a specific operational workflow has been discovered and used by customers.',
  },
  F2: {
    t: 'Completion Rate (F2)',
    f: 'Users who reached the final step ÷ users who did the first step × 100.',
    d: 'Measures funnel efficiency. A high completion rate shows frictionless user journeys.',
  },
  F3: {
    t: 'Biggest Step Drop (F3)',
    f: 'At every step: users lost ÷ users at the step before × 100. The largest loss is shown.',
    d: 'Pinpoints UX friction, validation errors, or confusion where users abandon the process.',
  },
  F4: {
    t: 'Usage Volume (F4)',
    f: 'Count of users who reached the final step in the period; with All Modules, added up across modules.',
    d: 'Reflects the business throughput and operational transaction volume processed via the app.',
  },
  'chart.usage': {
    t: 'Usage Over Time',
    f: 'Plots daily or weekly aggregated trends for Visitors, Screen Views, and Sessions alongside previous period baseline.',
    d: 'Allows tracking period-over-period growth, weekend vs weekday patterns, and campaign spikes.',
  },
  'chart.devices': {
    t: 'Device / Platform Breakdown',
    f: 'Users on each platform (iOS, Android, Desktop Web) ÷ all active users × 100.',
    d: 'Guides mobile vs desktop feature parity and OS-specific testing priorities.',
  },
  'chart.adoptionTrend': {
    t: 'Adoption Trend (8 Weeks)',
    f: 'Trailing 8-week weekly active user (WAU) volume plotted against the prior 8-week period.',
    d: 'Visualizes structural adoption momentum smoothed against weekly seasonality.',
  },
  'chart.growth': {
    t: 'Growth Accounting',
    f: 'Deconstructs weekly active users into New (first time), Returning (active last week), Resurrecting (returned after inactivity), and Dormant (became inactive).',
    d: 'Explains the engine of user growth — whether top-line increase is driven by acquisition or retention.',
  },
  'chart.retention': {
    t: 'Cohort Retention Matrix',
    f: 'Users grouped by the week they first appeared. Each cell = users from that group active N weeks later ÷ group size × 100.',
    d: 'True indicator of product-market fit and long-term customer engagement stickiness.',
  },
  'chart.moduleAdoption': {
    t: 'Adoption by Workflow Bucket',
    f: 'Users who used at least one feature in the group (any screen of the module) ÷ all active users × 100.',
    d: 'Shows which group of features is used most, and which are barely touched.',
  },
  'chart.roles': {
    t: 'Persona / Role Distribution',
    f: 'Breakdown of active users grouped by user roles (Primary Owners, Co-Owners, Tenants, and Family Members).',
    d: 'Reveals which customer personas utilize the app most heavily.',
  },
  'chart.dormant': {
    t: 'Dormant Accounts Analysis',
    f: 'Count of users seen before who have had no activity for 14 or more days.',
    d: 'Target population for re-engagement campaigns and push notification lifecycle triggers.',
  },
  'chart.sitewise': {
    t: 'Project / Site-Wise Engagement',
    f: 'Comparative table of Active Users, Sessions, Avg Duration, and Bounce Rate across individual residential projects.',
    d: 'Identifies high-performing properties vs communities requiring local activation support.',
  },
  'chart.funnel': {
    t: 'Step-by-Step Conversion Funnel',
    f: "Users at each step ÷ users at the first step × 100, with the % lost against the step before. Where the app declares workflows, the module's busiest one is drawn.",
    d: 'Identifies exactly where users drop out of multi-step processes like payments, bookings, or service requests.',
  },
  'chart.screens': {
    t: 'Screen-Level Activity & Drop-off',
    f: 'Views per screen, ranked high to low, with the users and sessions that viewed it.',
    d: 'Detailed screen telemetry for optimizing UX layouts and micro-interactions.',
  },
  'chart.entries': {
    t: 'Top Entry Screens',
    f: 'Only the first screen of each session is counted, ranked high to low (e.g. splash, a deep link, a notification, the home tab).',
    d: 'Shows how customers enter the app and which notification campaigns drive direct session starts.',
  },
  'crm.leases': {
    t: 'Lease & Ownership Overview',
    f: 'Active agreements, upcoming lease renewals, and vacancy status across registered units.',
    d: 'Core property management overview connected directly to backend CRM records.',
  },
  'crm.events': {
    t: 'Society Events & Amenities',
    f: 'Scheduled community events, RSVP counts, and amenity booking attendance.',
    d: 'Community engagement and club house facility utilization analytics.',
  },
  'crm.broadcasts': {
    t: 'Broadcasts & Noticeboard',
    f: 'Broadcast announcements sent, delivery rates, and customer open rates.',
    d: 'Measures management-to-resident communication reach and message visibility.',
  },
  'crm.wallets': {
    t: 'Resident Digital Wallets',
    f: 'Total prepaid wallet balances, top-up frequency, and transaction settlement volume.',
    d: 'Financial liquidity and amenity transaction readiness across residents.',
  },
  'fin.approvals': {
    t: 'Pending Purchase Approvals',
    f: 'Purchase requisitions and service orders awaiting management sign-off.',
    d: 'Tracks approval queue bottlenecks to ensure vendor services are authorized on schedule.',
  },
  'fin.prs': {
    t: 'Draft Purchase Requisitions',
    f: 'Count and monetary value of draft PRs created by site operations teams.',
    d: 'Visibility into unsubmitted operational spend in the pipeline.',
  },
  'fin.pipeline': {
    t: 'Procurement Pipeline',
    f: 'End-to-end procurement status from RFQ to Purchase Order generation and GRN.',
    d: 'Operational procurement cycle speed and vendor execution tracking.',
  },
  'fin.requisition_value': {
    t: 'Pending Requisition Value',
    f: 'Total cumulative monetary value of active requisitions currently under review.',
    d: 'Capital allocation and cash flow forecast for upcoming operational expenses.',
  },
  'fin.pr_sr_split': {
    t: 'PR vs Service Request Ratio',
    f: 'Proportion of material purchase orders vs maintenance service work orders.',
    d: 'Differentiates physical inventory costs from third-party service vendor contracts.',
  },
  'fin.overdue_invoices': {
    t: 'Overdue Vendor Invoices',
    f: 'Vendor bills exceeding standard payment term milestones (30/60/90 days).',
    d: 'Ensures vendor relationship health and prevents service interruptions.',
  },
  'fin.approval_queue': {
    t: 'Approval Queue Ageing',
    f: 'Average turnaround time and oldest pending tickets awaiting managerial approval.',
    d: 'Internal operational SLA compliance monitoring.',
  },
  'fin.top_pending': {
    t: 'High-Value Pending Approvals',
    f: 'Top single-value procurement items requiring senior management authorization.',
    d: 'Prioritizes high-impact financial decisions.',
  },
  U7: {
    t: 'Usage Over Time',
    f: 'Plots daily or weekly aggregated trends for Visitors, Screen Views, and Sessions alongside previous period baseline.',
    d: 'Allows tracking period-over-period growth, weekend vs weekday patterns, and campaign spikes.',
  },
  U8: {
    t: 'Device / Platform Breakdown',
    f: 'Users on each platform (iOS, Android, Desktop Web) ÷ all active users × 100.',
    d: 'Guides mobile vs desktop feature parity and OS-specific testing priorities.',
  },
  A6: {
    t: 'Adoption Trend (8 Weeks)',
    f: 'Trailing 8-week weekly active user (WAU) volume plotted against the prior 8-week period.',
    d: 'Visualizes structural adoption momentum smoothed against weekly seasonality.',
  },
  A7: {
    t: 'Growth Accounting',
    f: 'Deconstructs weekly active users into New (first time), Returning (active last week), Resurrecting (returned after inactivity), and Dormant (became inactive).',
    d: 'Explains the engine of user growth — whether top-line increase is driven by acquisition or retention.',
  },
  A8: {
    t: 'Cohort Retention Matrix',
    f: 'Users grouped by the week they first appeared. Each cell = users from that group active N weeks later ÷ group size × 100.',
    d: 'True indicator of product-market fit and long-term customer engagement stickiness.',
  },
  A9: {
    t: 'Persona / Role Distribution',
    f: 'Breakdown of active users grouped by user roles (Primary Owners, Co-Owners, Tenants, and Family Members).',
    d: 'Reveals which customer personas utilize the app most heavily.',
  },
  A10: {
    t: 'Dormant Accounts Analysis',
    f: 'Count of users seen before who have had no activity for 14 or more days.',
    d: 'Target population for re-engagement campaigns and push notification lifecycle triggers.',
  },
  A11: {
    t: 'Project / Site-Wise Engagement',
    f: 'Comparative table of Active Users, Sessions, Avg Duration, and Bounce Rate across individual residential projects.',
    d: 'Identifies high-performing properties vs communities requiring local activation support.',
  },
};


