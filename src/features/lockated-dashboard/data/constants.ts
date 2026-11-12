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
    "<b>Data note.</b> Every number comes from the Lockated usage-analytics API (app_id 1, client lockated). Lockated's events so far come from test builds. The app is mobile-only, so the All / iOS / Android toggle is an OS split.",
  pgAdopt:
    "<b>Data note.</b> Lockated has no module list yet, so Module Breadth counts screens: screens used in the period ÷ every screen the app has ever sent. Users without a person role are not in the role chart.",
  pgFlows:
    "<b>Data note.</b> The 6 workflows are Lockated's named workflows (config/workflows.yml, lockated), counted in users on real events. A workflow whose events the app does not send yet shows —, never a sample number.",
};
