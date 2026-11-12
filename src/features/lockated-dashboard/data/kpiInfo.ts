export interface KpiInfoItem {
  f: string;
  m: string;
}

export const KPI_INFO: Record<string, KpiInfoItem> = {
  "Active Users": {
    f: "Count of different people (each user_id once) who did at least one thing during the selected period.",
    m: "Shows the reach of the app among Lockated's registered residents."
  },
  "Screen Views": {
    f: "Count of every screen-load (view) event in the period: a <screen>_viewed / <screen>_opened event in the app.",
    m: "Overall content consumption across the app."
  },
  "Sessions": {
    f: "Count of distinct sessions (visits) with activity in the selected period.",
    m: "Usage volume across all residents."
  },
  "Session Duration": {
    f: "Total time of all sessions ÷ number of sessions (a session runs from its first to its last event; sessions started in the period).",
    m: "Engagement depth per visit."
  },
  "Bounce Rate": {
    f: "Sessions that never get past the launch, sign-in or home screen (splash, login, OTP, home) ÷ all sessions × 100.",
    m: "Immediate exits or a poor first impression."
  },
  "Recently Online": {
    f: "Distinct residents with at least one event in the last 30 minutes.",
    m: "A live pulse of who is in the app right now."
  },
  "Seat Utilisation": {
    f: "Active residents ÷ licensed seats × 100 (needs the licensed seat count).",
    m: "How much of the resident base is actually opening the app."
  },
  "Stickiness": {
    f: "Average daily active users (DAU) over the period ÷ monthly active users (MAU, the 30 days ending on the end date) × 100.",
    m: "Whether app use is habitual or occasional."
  },
  "Adoption Trend": {
    f: "This week's active users (the last 7 days) vs the average of the 8 weeks before: (this week − average) ÷ average × 100. Weeks before the app went live are left out of the average.",
    m: "Whether adoption is accelerating or plateauing."
  },
  "14-Day Activation": {
    f: "New residents (first seen in the period) who did a first real action — used a feature, not just sign-in or home — within 14 days of first appearing ÷ all new residents × 100.",
    m: "Whether new residents actually start using the app, not just completing onboarding."
  },
  "Module Breadth": {
    f: "Screens used at least once in the period ÷ every screen the Lockated app has ever sent (Lockated has no module list yet).",
    m: "How much of the platform a resident base has actually adopted, not just Home."
  },
  "Dormant Users": {
    f: "Count of residents seen before whose last activity is 14 or more days ago.",
    m: "Residents who may need a re-engagement nudge."
  },
  "Workflow Adoption": {
    f: "Users who did the workflow's first step ÷ users active in the period × 100.",
    m: "Shows how many residents attempt this process."
  },
  "Completion Rate": {
    f: "Users who reached the final step ÷ users who did the first step × 100. Shown only when the app sends both steps.",
    m: "How effectively the workflow converts an attempt into a completed action."
  },
  "Biggest Step Drop": {
    f: "At every step: users lost ÷ users at the step before × 100. The largest loss is shown, with the step it happens at.",
    m: "Points to exactly where in the process residents are abandoning."
  },
  "Usage Volume": {
    f: "Count of users who reached the workflow's final step in the period.",
    m: "Absolute volume of completed requests, bookings, or engagements — the raw workload this workflow represents."
  }
};

export function getKpiInfo(label: string): KpiInfoItem {
  return KPI_INFO[label] || {
    f: "Definition not yet finalized for this metric.",
    m: "Business meaning to be confirmed with product team."
  };
}
