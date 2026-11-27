import type { AdoptionApiPath } from './api';
/**
 * Typed response contracts for PostHog Adoption Analytics & FM Matrix Dashboard APIs
 */

// ==========================================
// 1. PostHog Adoption Analytics Types
// ==========================================

export interface AdoptionMeta {
  metric: string;
  layer?: string;
  level?: string;
  parent?: string | null;
  module?: string;
  sub_module?: string;
  prefix?: string;
  filters: {
    url: string;
    site_id: string[];
    device_type: string[];
    from: string;
    to: string;
  };
  generated_at: string;
}

export interface TrafficSessionResponse {
  meta: AdoptionMeta & {
    /** Days in the range with any event. */
    days_with_data?: number;
    /** The period every change vs prev compares against: the same number of days just before the range. */
    previous_period?: {
      from: string;
      to: string;
      days: number;
      days_with_data: number;
      first_day_with_data: string | null;
    };
  };
  tiles: {
    active_users: number;
    screen_views: number;
    sessions: number;
    avg_session_seconds: number;
    bounce_rate: number; // 0-100
    recently_online: number;
  };
  previous: Record<string, number>;
  delta_pct: Record<string, number | null>;
}

export interface UsageDay {
  day: string;
  visitors: number;
  views: number;
  sessions: number;
}

export interface OsStat {
  os: string;
  users: number;
  sessions: number;
  session_share: number;
}

export interface DeviceStat {
  device: string;
  users: number;
  sessions: number;
  session_share: number;
  /** Per-OS split within this device_type (e.g. Android/iOS within Mobile). */
  os_breakdown?: OsStat[];
}

export interface UsageDistributionResponse {
  meta: AdoptionMeta;
  usage_over_time: {
    current: UsageDay[];
    previous: UsageDay[];
  };
  device_split: {
    total_sessions: number;
    devices: DeviceStat[];
  };
  /** Each active user once, on the platform they used last: the platforms' users add up to total_users. */
  platform_usage?: {
    total_users: number;
    total_sessions: number;
    platforms: PlatformStat[];
  };
  views_per_session: number;
}

export interface PlatformStat {
  platform: string; // iOS | Android | Desktop Web | Other
  users: number;
  user_share: number | null; // users ÷ total_users × 100
  sessions: number;
  session_share: number | null;
}

export interface AdoptionEngagementResponse {
  meta: AdoptionMeta;
  seat_utilisation: {
    value: number | null;
    used_seats: number;
    licensed_seats: number | null;
    delta_pct: number | null;
  };
  stickiness: {
    value: number;
    avg_dau: number;
    mau: number;
    delta_pct: number | null;
  };
  adoption_trend: {
    value: number | null;
    wau_now: number;
    wau_4wk_ago: number;
    /** How many weeks the baseline average used (up to 8; weeks before the app went live are left out). */
    baseline_weeks?: number | null;
  };
  activation: {
    value: number;
    joiners: number;
    delta_pct: number | null;
  };
  module_breadth: {
    in_use: number;
    total: number;
  };
  dormant_users: {
    value: number;
    band: string;
  };
}

export interface AdoptionTrendWeek {
  week: string;
  wau: number;
}

export interface AdoptionTrendResponse {
  meta: AdoptionMeta;
  weekly: {
    current: AdoptionTrendWeek[];
    previous: AdoptionTrendWeek[];
  };
  trend_pct: number | null;
  /** Mean WAU of the last 8 complete weeks vs the 8 before; null when that baseline is 0. */
  avg_trend_pct?: number | null;
  wau_now: number;
  wau_4wk_ago: number;
}

export interface GrowthWeek {
  week: string;
  new: number;
  returning: number;
  resurrected: number;
  dormant: number;
}

export interface GrowthResponse {
  meta: AdoptionMeta;
  weeks: GrowthWeek[];
}

export interface RetentionCohort {
  cohort_week: string;
  size: number;
  [week: string]: number | string | null;
}

export interface RetentionResponse {
  meta: AdoptionMeta;
  cohorts: RetentionCohort[];
}

export interface RoleStat {
  role: string;
  users: number;
  events: number;
  active_share: number;
}

export interface RolesResponse {
  meta: AdoptionMeta;
  total_users: number;
  roles: RoleStat[];
}

export interface SubModuleNode {
  key: string;
  name: string;
  users: number;
  events: number;
  sessions: number;
}

export interface ModuleNode {
  /** Present on `modules` rows: the ?module= value. On `tree` rows, `name` is that value. */
  key?: string;
  name: string;
  users: number;
  /** users who used it / users active in the period * 100 (adoption by module). */
  share_pct?: number | null;
  events: number;
  sessions: number;
  sub_modules?: SubModuleNode[];
}

export interface ModulesResponse {
  meta: AdoptionMeta;
  tree: ModuleNode[];
  /** Live screens arranged under modules; empty unless the scope's app declares them (e.g. RE-CP01). */
  modules?: ModuleNode[];
  /** Users active in the period: the denominator of share_pct. */
  active_users?: number;
}

export interface FunnelStep {
  step: string;
  reach: number;
  drop_pct: number | null;
  biggest: boolean;
}

export interface FlowItem {
  path: string;
  users: number;
  events: number;
  sessions: number;
  f_comp: number | null;
}

export interface EntryScreenItem {
  path: string;
  visitors: number;
  views: number;
  bounce: number;
  visitors_trend: number | null;
  views_trend: number | null;
  bounce_trend: number | null;
}

export interface ModuleFunnel {
  key: string;
  name: string;
  started: number;
  completed: number;
  /** null when none of the module's declared workflows can be measured (first or final step not sent). */
  completion_pct: number | null;
  biggest_drop_pct: number;
}

export interface WorkflowUsageResponse {
  meta: AdoptionMeta;
  kpis: Record<string, { value: number | null; delta_pct: number | null }>;
  funnel: FunnelStep[];
  flows: FlowItem[];
  entry_screens: EntryScreenItem[];
  /** All modules of a catalogue app: each module's own funnel, which the KPIs roll up. */
  module_funnels?: ModuleFunnel[];
  /** "workflows" when the funnel is the module's busiest declared workflow (named here). */
  funnel_source?: 'workflows' | 'events' | 'modules' | 'none';
  funnel_workflow?: { key: string; name: string } | null;
}

/** One row from `recent_active_users` — one event by an identified user. */
export interface RecentActiveUser {
  user_id: string | null;
  /** `first_name last_name`; empty when the app sends no name. */
  user_name: string | null;
  email: string | null;
  /** `$pathname` on web, `screen` on apps. */
  path: string | null;
  /** This event's name. */
  last_event: string | null;
  /** This event's time, IST. */
  last_seen: string | null;
  minutes_ago: number | null;
  user_role: string | null;
  site_id: string | null;
  site_name: string | null;
  device_type: string | null;
  os: string | null;
  distinct_id?: string | null;
  /** The user's totals in the range. */
  events: number | null;
  sessions: number | null;
}

export interface RecentActiveUsersResponse {
  meta: AdoptionMeta;
  users: RecentActiveUser[];
}

// ==========================================
// 2. FM Matrix CRM & Finance Response Types
// ==========================================

export type FmApiResponse<T = Record<string, any>> = T;

export interface LeaseOverviewData {
  total_leases?: number;
  active_leases?: number;
  expiring_leases?: number;
  occupancy_rate?: number;
  total_revenue?: number;
  [key: string]: any;
}

export interface EventsOverviewData {
  total_events?: number;
  upcoming_events?: number;
  completed_events?: number;
  total_attendees?: number;
  [key: string]: any;
}

export interface BroadcastOverviewData {
  total_broadcasts?: number;
  delivered_count?: number;
  opened_count?: number;
  failed_count?: number;
  delivery_rate?: number;
  [key: string]: any;
}

export interface WalletOverviewData {
  total_balance?: number;
  active_wallets?: number;
  points_credited?: number;
  points_debited?: number;
  [key: string]: any;
}

export interface WalletDistributionData {
  tiers?: Array<{ tier: string; users: number; percentage?: number }>;
  brackets?: Record<string, number>;
  [key: string]: any;
}

export interface WalletTransactionsData {
  total_transactions?: number;
  credit_count?: number;
  debit_count?: number;
  recent_transactions?: Array<{
    id: string | number;
    amount: number;
    type: string;
    date: string;
    user_name?: string;
  }>;
  [key: string]: any;
}

export interface PendingApprovalsData {
  pending_count?: number;
  total_value?: number;
  approvals_by_type?: Record<string, number>;
  items?: Array<{
    id: string | number;
    title: string;
    type: string;
    amount?: number;
    requested_by?: string;
    created_at?: string;
  }>;
  [key: string]: any;
}

export interface DraftPrsData {
  draft_count?: number;
  total_estimated_value?: number;
  prs?: Array<{
    id: string | number;
    pr_number?: string;
    title: string;
    department?: string;
    amount?: number;
    created_at?: string;
  }>;
  [key: string]: any;
}

export interface ProcurementPipelineData {
  pipeline_value?: number;
  stages?: Record<string, number>;
  pr_count?: number;
  po_count?: number;
  grn_count?: number;
  invoice_count?: number;
  [key: string]: any;
}

export interface PendingRequisitionValueData {
  pending_pr_value?: number;
  pending_sr_value?: number;
  total_pending_value?: number;
  currency?: string;
  [key: string]: any;
}

export interface PrSrSplitData {
  pr_count?: number;
  sr_count?: number;
  pr_value?: number;
  sr_value?: number;
  pr_pct?: number;
  sr_pct?: number;
  [key: string]: any;
}

export interface OverdueInvoicesData {
  overdue_count?: number;
  overdue_total_amount?: number;
  aging_buckets?: {
    days_1_30?: number;
    days_31_60?: number;
    days_61_90?: number;
    days_90_plus?: number;
  };
  invoices?: Array<{
    id: string | number;
    invoice_number?: string;
    vendor_name?: string;
    amount: number;
    due_date: string;
    overdue_days?: number;
  }>;
  [key: string]: any;
}

export interface ApprovalQueueData {
  queue_length?: number;
  pending_items?: Array<{
    id: string | number;
    module: string;
    reference_number?: string;
    approver?: string;
    status: string;
    created_at?: string;
  }>;
  [key: string]: any;
}

export interface TopPendingRecordsData {
  records?: Array<{
    id: string | number;
    title: string;
    type: string;
    amount?: number;
    submitted_by?: string;
    submitted_date?: string;
    priority?: string;
  }>;
  total_pending?: number;
  [key: string]: any;
}

// ==========================================
// 3. Centralized Dashboard Filters
// ==========================================

export interface DashboardFilters {
  siteIds: string[]; // selected site IDs (comma separated format for requests)
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  token: string; // FM API token
  devPlatform: 'all' | 'ios' | 'android';
  licensedSeats: number | null;
  module: string | null;
  subModule: string | null;
  url?: string; // Dynamic tenant base URL from localStorage
  // Resident/sales-stage segment, only meaningful when the ?app_id=35 tab is
  // shown. "0,1" (All), "0" (Pre Sales) or "1" (Post Sales) — sent verbatim
  // (comma unescaped) as the display_view query param.
  displayView?: string;
  // Read from the current URL's ?app_id=... param — carried explicitly on
  // the filters object (rather than each fetch call re-reading
  // window.location.search) so it's visible wherever filters are, and sent
  // as app_id on every PostHog adoption request.
  appId?: string;
  // Runwal CP identifies itself by project code instead of app_id (it has no
  // app_id at all). When set, this is sent as `project_code` on every
  // PostHog adoption / FM / site-lookup request in place of `app_id` — the
  // two are mutually exclusive identifiers, never sent together.
  projectCode?: string;
  deviceType?: string;
  includeAnonymous?: boolean;
  // Hi Society society ids chosen in the society dropdown (Runwal Connect / Realty only), sent as
  // society_id=<id>[,<id>…]. Empty or missing = every society, as before.
  societyIds?: string[];
  // This dashboard's own adoption API (ADOPTION_API in ./api.ts), e.g. 'residential/runwal/cp'. The
  // server fixes which app it reads, so appId / projectCode are no longer sent to it.
  apiPath?: AdoptionApiPath;
}

export interface SiteLookupItem {
  id: string;
  name: string;
  organization_id?: number | string;
  company_id?: number | string;
}

// ==========================================
// User journeys (Workflow Usage, Runwal Connect / Realty)
// ==========================================

export interface UserJourneyMeta {
  metric: string;
  page: number;
  per_page: number;
  total: number;
  pages: number;
  generated_at: string;
}

/** One signed-in user active in the range. */
export interface UserJourneyPerson {
  user_key: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  society_id: string | null;
  /** Post Sales / Post Possession (the person's latest display_view), when the app sends it. */
  phase: string | null;
  sessions: number;
  events: number;
  last_seen: string;
  minutes_ago: number;
}

export interface UserJourneysResponse {
  meta: UserJourneyMeta;
  people: UserJourneyPerson[];
}

/** How a session ended: logged out, still active, app closed / backgrounded, or 30 minutes of no activity. */
export type UserJourneyEnding = 'logout' | 'active' | 'closed' | 'timeout';

export interface UserJourneySession {
  id: string;
  started_at: string;
  ended_at: string;
  duration_s: number;
  events: number;
  screens: number;
  taps: number;
  problems: number;
  first_screen: string | null;
  last_event: string;
  ended_by: UserJourneyEnding;
  /** The logout / app-exit event that ended it (logout and closed only). */
  end_event?: string | null;
}

export interface UserJourneySessionsResponse {
  meta: UserJourneyMeta & { truncated: boolean };
  person: UserJourneyPerson | null;
  /** The person's totals over all their sessions in the range. */
  summary: { sessions: number; screens: number; taps: number; problems: number; avg_duration_s: number };
  /** Every session of the person in the range (up to 2,000), newest first. */
  sessions: UserJourneySession[];
}

export type UserJourneyStepKind = 'screen' | 'tap' | 'result' | 'problem' | 'system' | 'event';

export interface UserJourneyStep {
  at: string;
  offset_s: number;
  event: string;
  kind: UserJourneyStepKind;
  screen: string;
}

export interface UserJourneyStepsResponse {
  meta: UserJourneyMeta & { truncated: boolean };
  session: {
    id: string;
    started_at: string | null;
    ended_at: string | null;
    duration_s: number;
    ended_by: UserJourneyEnding | null;
    end_event?: string | null;
    counts: Partial<Record<UserJourneyStepKind, number>>;
  };
  steps: UserJourneyStep[];
}

export interface UserJourneyListParams {
  q?: string;
  sort?: 'first_name' | 'last_name' | 'email' | 'society_id' | 'sessions' | 'events' | 'last_active';
  dir?: 'asc' | 'desc';
  page?: number;
  perPage?: number | 'all';
}

// ==========================================
// Sign-ups (Adoption & Engagement, Runwal Connect / Realty): Hi Society's Manage Users accounts
// ==========================================

/** One account from Hi Society's Manage Users (GET /crm/admin/user_societies.json). */
export interface HiSocietyAccount {
  id: number;
  id_user: number | string | null;
  id_society: number | string | null;
  created_at: string | null;
  /** true = approved, false = rejected, null = pending. */
  approve: boolean | null;
  /** Hi Society's own names: 'Pre Sales' = Post Sales, 'Post Sales' = Post Possession. */
  display_view: string | null;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  block_no: string | null;
  flat_no: string | null;
  /** owner / tenant */
  resident_type: string | null;
  /** A phone registered for the society's app, which happens after the person's first login. */
  app_downloaded?: { any_app_downloaded?: boolean; ios?: boolean; android?: boolean } | null;
}

/** What to ask Manage Users for: the dashboard's societies, dates and phase. */
export interface SocietyAccountsQuery {
  /** Every society chosen in the dashboard (all of the user's societies for "All Societies"). */
  societyIds: string[];
  /** YYYY-MM-DD: accounts created from this day (omit for every account up to `to`). */
  from?: string;
  /** YYYY-MM-DD: accounts created up to the end of this day. */
  to: string;
  /** Hi Society's display_view to match ('Pre Sales' = Post Sales, 'Post Sales' = Post Possession); omit for both. */
  displayView?: 'Pre Sales' | 'Post Sales';
}

export interface SocietyAccountsResult {
  accounts: HiSocietyAccount[];
  /** pagination.total_count of the first page: how many accounts match. */
  total: number;
}

/** Each chosen society's accounts (fetchAccountsBySociety). */
export interface SocietyAccountsBySociety {
  societies: {
    societyId: string;
    /** Accounts created up to the end date. */
    upTo: HiSocietyAccount[];
    /** Accounts created within the dates. */
    inRange: HiSocietyAccount[];
    /** Why this society could not be read; null when it was. */
    error: string | null;
  }[];
}
