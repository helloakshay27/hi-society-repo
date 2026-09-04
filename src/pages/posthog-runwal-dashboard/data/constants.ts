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
    f: 'Unique customers (user_id) who fired at least one event with journey = post_sales during the selected period.',
    m: "Shows the reach of the app among booked homebuyers — pulled directly from PostHog's person-level activity.",
  },
  'Screen Views': {
    f: 'Count of all screen-viewed style events across modules (e.g. home_page_viewed, document_viewed, project_details_viewed).',
    m: 'Overall content consumption across the app.',
  },
  'Total Sessions': {
    f: 'Count of distinct app sessions started in the period (from app_launched / splash_routing_decided).',
    m: 'Usage volume across all customers.',
  },
  'Sessions': {
    f: 'Count of distinct app sessions started in the period (from app_launched / splash_routing_decided).',
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
    f: '% of sessions with only app_launched/home_page_viewed and no further interaction.',
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
    f: 'Share of active users and sessions by device_platform (android vs ios).',
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
    f: '% change in weekly active users over the prior 8 weeks.',
    m: 'Highlights whether app adoption is accelerating or plateauing over time.',
  },
  '14-Day Activation': {
    f: '% of new users who complete key setup actions within 14 days.',
    m: 'Early onboarding health indicator.',
  },
  'Module Breadth': {
    f: 'Count of distinct modules used at least once ÷ Total modules available.',
    m: 'How much of the platform a customer base has actually adopted.',
  },
  'Workflow Adoption': {
    f: "% of active users who started the workflow.",
    m: 'Shows how many customers attempt this process.',
  },
  'Completion Rate': {
    f: "% of users who reached the workflow's terminal success event after starting.",
    m: 'How effectively the workflow converts.',
  },
  'Biggest Step Drop': {
    f: 'Step with the highest drop-off percentage in the sequential funnel.',
    m: 'Pinpoints UX friction and abandonment points.',
  },
  'Usage Volume': {
    f: "Total count of users who completed the workflow in the period.",
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
    f: 'Count of distinct customers (user_id) who were active at least once during the selected date window.',
    d: 'Each person is counted only once no matter how many times they log in. Shows your net audience reach.',
  },
  U2: {
    t: 'Screen Views (U2)',
    f: 'Total number of screens/pages opened across everyone, added up over the selected date range.',
    d: 'Counts every screen transition — climbs when users browse deeply, not just when more people log in.',
  },
  U3: {
    t: 'Total Sessions (U3)',
    f: 'Count of distinct app sessions started in the period (via app_launched or splash screen routing).',
    d: 'Reflects total visit frequency and customer interaction touchpoints across all channels.',
  },
  U4: {
    t: 'Average Session Duration (U4)',
    f: 'Total aggregated session active time ÷ total sessions started in the period.',
    d: 'Measures engagement depth and how much time users spend browsing content per visit.',
  },
  U5: {
    t: 'Bounce Rate (U5)',
    f: '% of sessions with only splash/home opened and zero subsequent interactions or feature actions.',
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
    f: '% change in weekly active users (WAU) comparing current 8 weeks against prior baseline period.',
    d: 'Signals whether customer engagement is accelerating, steady, or decelerating.',
  },
  A4: {
    t: '14-Day Activation (A4)',
    f: '% of newly onboarded users who completed key actions within 14 days of account creation.',
    d: 'Critical onboarding metric. Users active within their first 2 weeks have significantly higher long-term retention.',
  },
  A5: {
    t: 'Module Breadth (A5)',
    f: 'Count of distinct modules used at least once in the period ÷ Total modules available.',
    d: 'Highlights cross-functional adoption across documents, tickets, accounts, payments, and amenity bookings.',
  },
  F1: {
    t: 'Workflow Adoption (F1)',
    f: 'Count of unique users who initiated step 1 of this workflow ÷ Total active users in the period.',
    d: 'Shows how widely a specific operational workflow has been discovered and used by customers.',
  },
  F2: {
    t: 'Completion Rate (F2)',
    f: 'Users reaching the final confirmation/success step ÷ Users who initiated step 1.',
    d: 'Measures funnel efficiency. A high completion rate shows frictionless user journeys.',
  },
  F3: {
    t: 'Biggest Step Drop (F3)',
    f: 'Specific funnel step transition with the largest percentage drop-off in entrants.',
    d: 'Pinpoints UX friction, validation errors, or confusion where users abandon the process.',
  },
  F4: {
    t: 'Usage Volume (F4)',
    f: 'Total absolute count of workflow completions successfully finalized in the selected period.',
    d: 'Reflects the business throughput and operational transaction volume processed via the app.',
  },
  'chart.usage': {
    t: 'Usage Over Time',
    f: 'Plots daily or weekly aggregated trends for Visitors, Screen Views, and Sessions alongside previous period baseline.',
    d: 'Allows tracking period-over-period growth, weekend vs weekday patterns, and campaign spikes.',
  },
  'chart.devices': {
    t: 'Device / Platform Breakdown',
    f: 'Proportion of active users and sessions originating from iOS, Android, and Desktop Web browsers.',
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
    f: 'Weekly cohort analysis showing the % of new user cohorts remaining active across successive weeks W+0 through W+5.',
    d: 'True indicator of product-market fit and long-term customer engagement stickiness.',
  },
  'chart.roles': {
    t: 'Persona / Role Distribution',
    f: 'Breakdown of active users grouped by user roles (Primary Owners, Co-Owners, Tenants, and Family Members).',
    d: 'Reveals which customer personas utilize the app most heavily.',
  },
  'chart.dormant': {
    t: 'Dormant Accounts Analysis',
    f: 'Count and percentage of registered accounts with zero activity in the last 30+ days.',
    d: 'Target population for re-engagement campaigns and push notification lifecycle triggers.',
  },
  'chart.sitewise': {
    t: 'Project / Site-Wise Engagement',
    f: 'Comparative table of Active Users, Sessions, Avg Duration, and Bounce Rate across individual residential projects.',
    d: 'Identifies high-performing properties vs communities requiring local activation support.',
  },
  'chart.funnel': {
    t: 'Step-by-Step Conversion Funnel',
    f: 'Sequential progression from initiation step down to terminal success state with stage-by-stage drop-off %.',
    d: 'Identifies exactly where users drop out of multi-step processes like payments, bookings, or service requests.',
  },
  'chart.screens': {
    t: 'Screen-Level Activity & Drop-off',
    f: 'Aggregate screen impressions, unique visitor counts, average time spent, and stage exit rates.',
    d: 'Detailed screen telemetry for optimizing UX layouts and micro-interactions.',
  },
  'chart.entries': {
    t: 'Top Entry Screens',
    f: 'First screen rendered when a user opens the application (e.g. splash screen, deep link, push notification, home tab).',
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
    f: 'Proportion of active users and sessions originating from iOS, Android, and Desktop Web browsers.',
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
    f: 'Weekly cohort analysis showing the % of new user cohorts remaining active across successive weeks W+0 through W+5.',
    d: 'True indicator of product-market fit and long-term customer engagement stickiness.',
  },
  A9: {
    t: 'Persona / Role Distribution',
    f: 'Breakdown of active users grouped by user roles (Primary Owners, Co-Owners, Tenants, and Family Members).',
    d: 'Reveals which customer personas utilize the app most heavily.',
  },
  A10: {
    t: 'Dormant Accounts Analysis',
    f: 'Count and percentage of registered accounts with zero activity in the last 30+ days.',
    d: 'Target population for re-engagement campaigns and push notification lifecycle triggers.',
  },
  A11: {
    t: 'Project / Site-Wise Engagement',
    f: 'Comparative table of Active Users, Sessions, Avg Duration, and Bounce Rate across individual residential projects.',
    d: 'Identifies high-performing properties vs communities requiring local activation support.',
  },
};


