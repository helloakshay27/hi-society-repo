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
  fetchAllowedSites,
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
  f.devices.join(','),
];

const fmKey = (f: DashboardFilters) => [f.token, f.siteIds.join(',')];

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
      filters.devices.join(','),
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
      filters.devices.join(','),
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
      filters.devices.join(','),
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
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<LeaseOverviewData>({
    queryKey: ['fm-dashboard', 'lease-overview', ...fmKey(filters)],
    queryFn: () => fetchLeaseOverview(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useEventsOverview(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<EventsOverviewData>({
    queryKey: ['fm-dashboard', 'events-overview', ...fmKey(filters)],
    queryFn: () => fetchEventsOverview(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useBroadcastOverview(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<BroadcastOverviewData>({
    queryKey: ['fm-dashboard', 'broadcast-overview', ...fmKey(filters)],
    queryFn: () => fetchBroadcastOverview(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useWalletOverview(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<WalletOverviewData>({
    queryKey: ['fm-dashboard', 'wallet-overview', ...fmKey(filters)],
    queryFn: () => fetchWalletOverview(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useWalletDistribution(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<WalletDistributionData>({
    queryKey: ['fm-dashboard', 'wallet-distribution', ...fmKey(filters)],
    queryFn: () => fetchWalletDistribution(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useWalletTransactions(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<WalletTransactionsData>({
    queryKey: ['fm-dashboard', 'wallet-transactions', ...fmKey(filters)],
    queryFn: () => fetchWalletTransactions(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function usePendingApprovals(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<PendingApprovalsData>({
    queryKey: ['fm-dashboard', 'pending-approvals', ...fmKey(filters)],
    queryFn: () => fetchPendingApprovals(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useDraftPrs(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<DraftPrsData>({
    queryKey: ['fm-dashboard', 'draft-prs', ...fmKey(filters)],
    queryFn: () => fetchDraftPrs(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useProcurementPipeline(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<ProcurementPipelineData>({
    queryKey: ['fm-dashboard', 'procurement-pipeline', ...fmKey(filters)],
    queryFn: () => fetchProcurementPipeline(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function usePendingRequisitionValue(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<PendingRequisitionValueData>({
    queryKey: ['fm-dashboard', 'pending-requisition-value', ...fmKey(filters)],
    queryFn: () => fetchPendingRequisitionValue(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function usePrSrSplit(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<PrSrSplitData>({
    queryKey: ['fm-dashboard', 'pr-sr-split', ...fmKey(filters)],
    queryFn: () => fetchPrSrSplit(filters.token, filters.siteIds),
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
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<ApprovalQueueData>({
    queryKey: ['fm-dashboard', 'approval-queue', ...fmKey(filters)],
    queryFn: () => fetchApprovalQueue(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}

export function useTopPendingRecords(filters: DashboardFilters, enabled: boolean = true) {
  const isEnabled = enabled && !!filters.token && filters.siteIds.length > 0;
  return useQuery<TopPendingRecordsData>({
    queryKey: ['fm-dashboard', 'top-pending-records', ...fmKey(filters)],
    queryFn: () => fetchTopPendingRecords(filters.token, filters.siteIds),
    enabled: isEnabled,
    ...CACHE_CONFIG,
  });
}
