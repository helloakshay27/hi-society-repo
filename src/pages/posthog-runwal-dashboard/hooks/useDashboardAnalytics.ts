/**
 * Unified React Query Hooks for Runwal Dashboard
 *
 * Implements cached data fetching with automatic cache retention
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchTrafficSession,
  fetchUsageAndDistribution,
  fetchAdoptionEngagement,
  fetchAdoptionTrend,
  fetchGrowth,
  fetchRetention,
  fetchRoles,
  fetchModules,
  fetchWorkflowUsage,
  fetchRecentActiveUsers,
  fetchAllowedSites,
  fetchUserAccountSiteId,
  fetchLeaseOverview,
  fetchEventsOverview,
  fetchBroadcastOverview,
  fetchWalletOverview,
  fetchWalletDistribution,
  fetchWalletTransactions,
  fetchPendingApprovals,
  fetchDraftPrs,
  fetchProcurementPipeline,
  fetchPendingRequisitionValue,
  fetchPrSrSplit,
  fetchOverdueInvoices,
  fetchApprovalQueue,
  fetchTopPendingRecords,
} from '../api/api';
import {
  DashboardFilters,
  TrafficSessionResponse,
  UsageDistributionResponse,
  AdoptionEngagementResponse,
  AdoptionTrendResponse,
  GrowthResponse,
  RetentionResponse,
  RolesResponse,
  ModulesResponse,
  WorkflowUsageResponse,
  RecentActiveUsersResponse,
  SiteLookupItem,
  LeaseOverviewData,
  EventsOverviewData,
  BroadcastOverviewData,
  WalletOverviewData,
  WalletDistributionData,
  WalletTransactionsData,
  PendingApprovalsData,
  DraftPrsData,
  ProcurementPipelineData,
  PendingRequisitionValueData,
  PrSrSplitData,
  OverdueInvoicesData,
  ApprovalQueueData,
  TopPendingRecordsData,
} from '../api/types';

export const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
};

const commonKey = (f: DashboardFilters) => [
  f.url || '',
  f.from,
  f.to,
  f.siteIds.join(','),
  f.devPlatform,
  f.displayView || '',
];

// ==========================================
// Sites Hook
// ==========================================

export function useDashboardSites() {
  const query = useQuery<SiteLookupItem[]>({
    queryKey: ['dashboard-sites'],
    queryFn: fetchAllowedSites,
    ...CACHE_CONFIG,
  });

  const sites = query.data ?? [];
  const sitesSettled = !query.isLoading && !query.isFetching;
  const allSiteIds = sites.map((s) => s.id);

  return {
    ...query,
    sites,
    sitesSettled,
    allSiteIds,
  };
}

// ==========================================
// Logged-in user's own site_id (from /api/users/account.json)
// ==========================================

export function useUserAccountSiteId() {
  return useQuery<string | null>({
    queryKey: ['user-account-site-id'],
    queryFn: fetchUserAccountSiteId,
    staleTime: Infinity, // site_id doesn't change without re-login
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ==========================================
// PostHog Analytics Hooks (9 Endpoints)
// ==========================================

export function useTrafficSession(filters: DashboardFilters, enabled: boolean = true) {
  return useQuery<TrafficSessionResponse>({
    queryKey: ['fm-adoption', 'traffic_session', ...commonKey(filters)],
    queryFn: () => fetchTrafficSession(filters),
    enabled,
    ...CACHE_CONFIG,
  });
}

export function useUsageAndDistribution(filters: DashboardFilters, enabled: boolean = true) {
  return useQuery<UsageDistributionResponse>({
    queryKey: ['fm-adoption', 'usage_and_distribution', ...commonKey(filters)],
    queryFn: () => fetchUsageAndDistribution(filters),
    enabled,
    ...CACHE_CONFIG,
  });
}

export function useAdoptionEngagement(filters: DashboardFilters, enabled: boolean = true) {
  return useQuery<AdoptionEngagementResponse>({
    queryKey: [
      'fm-adoption',
      'adoption_engagement',
      ...commonKey(filters),
      String(filters.licensedSeats ?? ''),
    ],
    queryFn: () => fetchAdoptionEngagement(filters),
    enabled,
    ...CACHE_CONFIG,
  });
}

export function useAdoptionTrend(filters: DashboardFilters, enabled: boolean = true) {
  return useQuery<AdoptionTrendResponse>({
    queryKey: [
      'fm-adoption',
      'adoption_trend',
      filters.url || '',
      filters.to,
      filters.siteIds.join(','),
      filters.devPlatform,
      filters.displayView || '',
    ],
    queryFn: () => fetchAdoptionTrend(filters),
    enabled,
    ...CACHE_CONFIG,
  });
}

export function useGrowth(filters: DashboardFilters, enabled: boolean = true) {
  return useQuery<GrowthResponse>({
    queryKey: [
      'fm-adoption',
      'growth',
      filters.url || '',
      filters.to,
      filters.siteIds.join(','),
      filters.devPlatform,
      filters.displayView || '',
    ],
    queryFn: () => fetchGrowth(filters),
    enabled,
    ...CACHE_CONFIG,
  });
}

export function useRetention(filters: DashboardFilters, enabled: boolean = true) {
  return useQuery<RetentionResponse>({
    queryKey: [
      'fm-adoption',
      'retention',
      filters.url || '',
      filters.to,
      filters.siteIds.join(','),
      filters.devPlatform,
      filters.displayView || '',
    ],
    queryFn: () => fetchRetention(filters),
    enabled,
    ...CACHE_CONFIG,
  });
}

export function useRoles(filters: DashboardFilters, enabled: boolean = true) {
  return useQuery<RolesResponse>({
    queryKey: ['fm-adoption', 'roles', ...commonKey(filters)],
    queryFn: () => fetchRoles(filters),
    enabled,
    ...CACHE_CONFIG,
  });
}

/** Sidebar "Recent Activity" feed — latest identified active users, most recent first. */
export function useRecentActiveUsers(filters: DashboardFilters, enabled: boolean = true, limit = 10) {
  return useQuery<RecentActiveUsersResponse>({
    queryKey: ['fm-adoption', 'recent_active_users', ...commonKey(filters), limit],
    queryFn: () => fetchRecentActiveUsers(filters, limit),
    enabled,
    ...CACHE_CONFIG,
  });
}

export function useModuleTree(filters: DashboardFilters, enabled: boolean = true) {
  return useQuery<ModulesResponse>({
    queryKey: ['fm-adoption', 'modules_tree', ...commonKey(filters)],
    queryFn: () => fetchModules(filters, null),
    enabled,
    ...CACHE_CONFIG,
  });
}

export function useSubModuleTree(
  filters: DashboardFilters,
  module: string | null,
  enabled: boolean = true
) {
  return useQuery<ModulesResponse>({
    queryKey: ['fm-adoption', 'submodules_tree', ...commonKey(filters), module || ''],
    queryFn: () => fetchModules(filters, module),
    enabled: enabled && !!module,
    ...CACHE_CONFIG,
  });
}

export function useWorkflowUsage(
  filters: DashboardFilters,
  module?: string | null,
  subModule?: string | null,
  enabled: boolean = true
) {
  return useQuery<WorkflowUsageResponse>({
    queryKey: [
      'fm-adoption',
      'workflow_usage',
      ...commonKey(filters),
      module || '',
      subModule || '',
    ],
    queryFn: () => fetchWorkflowUsage(filters, module, subModule),
    enabled,
    ...CACHE_CONFIG,
  });
}

// ==========================================
// FM Matrix Hooks (CRM & Finance)
// ==========================================

export function useLeaseOverview(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<LeaseOverviewData>({
    queryKey: ['fm-dashboard', 'lease-overview', filters.token],
    queryFn: () => fetchLeaseOverview(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useEventsOverview(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<EventsOverviewData>({
    queryKey: ['fm-dashboard', 'events-overview', filters.token],
    queryFn: () => fetchEventsOverview(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useBroadcastOverview(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<BroadcastOverviewData>({
    queryKey: ['fm-dashboard', 'broadcast-overview', filters.token],
    queryFn: () => fetchBroadcastOverview(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useWalletOverview(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<WalletOverviewData>({
    queryKey: ['fm-dashboard', 'wallet-overview', filters.token],
    queryFn: () => fetchWalletOverview(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useWalletDistribution(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<WalletDistributionData>({
    queryKey: ['fm-dashboard', 'wallet-distribution', filters.token],
    queryFn: () => fetchWalletDistribution(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useWalletTransactions(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<WalletTransactionsData>({
    queryKey: ['fm-dashboard', 'wallet-transactions', filters.token],
    queryFn: () => fetchWalletTransactions(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function usePendingApprovals(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<PendingApprovalsData>({
    queryKey: ['fm-dashboard', 'pending-approvals', filters.token],
    queryFn: () => fetchPendingApprovals(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useDraftPrs(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<DraftPrsData>({
    queryKey: ['fm-dashboard', 'draft-prs', filters.token],
    queryFn: () => fetchDraftPrs(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useProcurementPipeline(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<ProcurementPipelineData>({
    queryKey: ['fm-dashboard', 'procurement-pipeline', filters.token],
    queryFn: () => fetchProcurementPipeline(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function usePendingRequisitionValue(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<PendingRequisitionValueData>({
    queryKey: ['fm-dashboard', 'pending-requisition-value', filters.token],
    queryFn: () => fetchPendingRequisitionValue(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function usePrSrSplit(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<PrSrSplitData>({
    queryKey: ['fm-dashboard', 'pr-sr-split', filters.token],
    queryFn: () => fetchPrSrSplit(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useOverdueInvoices(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<OverdueInvoicesData>({
    queryKey: ['fm-dashboard', 'overdue-invoices', filters.token],
    queryFn: () => fetchOverdueInvoices(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useApprovalQueue(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<ApprovalQueueData>({
    queryKey: ['fm-dashboard', 'approval-queue', filters.token],
    queryFn: () => fetchApprovalQueue(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useTopPendingRecords(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token;
  return useQuery<TopPendingRecordsData>({
    queryKey: ['fm-dashboard', 'top-pending-records', filters.token],
    queryFn: () => fetchTopPendingRecords(filters.token),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}
