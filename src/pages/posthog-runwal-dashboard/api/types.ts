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
  meta: AdoptionMeta;
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

export interface DeviceStat {
  device: string;
  users: number;
  sessions: number;
  session_share: number;
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
  views_per_session: number;
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

export interface ModuleNode {
  name: string;
  users: number;
  events: number;
  sessions: number;
}

export interface ModulesResponse {
  meta: AdoptionMeta;
  tree: ModuleNode[];
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

export interface WorkflowUsageResponse {
  meta: AdoptionMeta;
  kpis: Record<string, { value: number | null; delta_pct: number | null }>;
  funnel: FunnelStep[];
  flows: FlowItem[];
  entry_screens: EntryScreenItem[];
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
  devices: ('Desktop' | 'Mobile')[];
  licensedSeats: number | null;
  module: string | null;
  subModule: string | null;
  url?: string; // Dynamic tenant base URL from localStorage
}

export interface SiteLookupItem {
  id: string;
  name: string;
  organization_id?: number | string;
  company_id?: number | string;
}
