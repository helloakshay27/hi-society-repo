export interface KpiInfoItem {
  f: string;
  m: string;
}

export const KPI_INFO: Record<string, KpiInfoItem> = {
  "Active Users": {
    f: "Unique residents (user_id) who fired at least one event during the selected period, scaled by date range × device × Admin Scope.",
    m: "Shows the reach of the app among Lockated's registered residents."
  },
  "Screen Views": {
    f: "Count of all View-typed screen-load events across the 14 catalogued categories.",
    m: "Overall content consumption across the app."
  },
  "Sessions": {
    f: "Count of distinct app sessions started in the period.",
    m: "Usage volume across all residents."
  },
  "Session Duration": {
    f: "Total session time ÷ total sessions.",
    m: "Engagement depth per visit."
  },
  "Bounce Rate": {
    f: "% of sessions with only a launch/home-view event and no further interaction.",
    m: "Immediate exits or a poor first impression."
  },
  "Recently Online": {
    f: "Distinct residents with an event in the last 30 minutes.",
    m: "A live pulse of who is in the app right now."
  },
  "Seat Utilisation": {
    f: "Active residents this period ÷ an illustrative registered-residents ceiling (not yet sourced from a live resident-management table).",
    m: "How much of the resident base is actually opening the app."
  },
  "Stickiness": {
    f: "Average daily active users ÷ monthly active users (DAU/MAU) over the period.",
    m: "Whether app use is habitual or occasional."
  },
  "Adoption Trend": {
    f: "% change in weekly active users versus the prior 8-week average.",
    m: "Whether adoption is accelerating or plateauing."
  },
  "14-Day Activation": {
    f: "% of newly registered residents who fire a first Action-typed event within 14 days of first_seen (proposed property name).",
    m: "Whether new residents actually start using the app, not just completing onboarding."
  },
  "Module Breadth": {
    f: "Count of distinct categories used at least once ÷ 13 categories in the Lockated catalogue.",
    m: "How much of the platform a resident base has actually adopted, not just Home."
  },
  "Dormant Users": {
    f: "Count of residents with no activity in the last 14+ days.",
    m: "Residents who may need a re-engagement nudge."
  },
  "Workflow Adoption": {
    f: "% of active users who fired the workflow's first event.",
    m: "Shows how many residents attempt this process."
  },
  "Completion Rate": {
    f: "% of users who reached the workflow's terminal event after starting it.",
    m: "How effectively the workflow converts an attempt into a completed action."
  },
  "Biggest Step Drop": {
    f: "The single step in the funnel with the largest % of entrants lost, based on the seeded funnel model.",
    m: "Points to exactly where in the process residents are abandoning."
  },
  "Usage Volume": {
    f: "Count of users who fired the workflow's terminal event this period, scaled to the selected date range.",
    m: "Absolute volume of completed requests, bookings, or engagements — the raw workload this workflow represents."
  }
};

export function getKpiInfo(label: string): KpiInfoItem {
  return KPI_INFO[label] || {
    f: "Definition not yet finalized for this metric.",
    m: "Business meaning to be confirmed with product team."
  };
}
