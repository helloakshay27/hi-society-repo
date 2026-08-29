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
