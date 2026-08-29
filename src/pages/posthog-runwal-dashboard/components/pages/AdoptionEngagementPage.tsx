import React, { useState } from 'react';
import { DashboardFilters } from '../../api/types';
import { QuestionBox } from '../common/QuestionBox';
import { KpiTile } from '../common/KpiTile';
import { Card } from '../common/Card';
import { LineChart } from '../charts/LineChart';
import { StackedBarChart } from '../charts/StackedBarChart';
import { RetentionCohortTable } from '../charts/RetentionCohortTable';
import { ErrorState, EmptyState } from '../common/DashboardStates';
import {
  useAdoptionEngagement,
  useAdoptionTrend,
  useGrowth,
  useRetention,
  useRoles,
  useLeaseOverview,
  useEventsOverview,
  useBroadcastOverview,
  useWalletOverview,
  usePendingApprovals,
  usePendingRequisitionValue,
  usePrSrSplit,
  useOverdueInvoices,
} from '../../hooks/useDashboardAnalytics';
import { pct } from '../../data/constants';

interface AdoptionEngagementPageProps {
  filters: DashboardFilters;
  benchmarks: Record<string, number | null>;
  onBenchmarkChange: (id: string, value: number | null) => void;
  sitesSettled?: boolean;
}

function formatDelta(d: number | null | undefined): { text: string | null; dir: 'up' | 'dn' | 'flat' } {
  if (d == null || isNaN(d)) return { text: null, dir: 'flat' };
  const abs = Math.abs(d).toFixed(1);
  if (d > 0) return { text: `${abs}% vs prev`, dir: 'up' };
  if (d < 0) return { text: `${abs}% vs prev`, dir: 'dn' };
  return { text: '0% vs prev', dir: 'flat' };
}

function renderScalarSummary(data: Record<string, any> | undefined | null) {
  if (!data || Object.keys(data).length === 0) {
    return <EmptyState message="No data returned for this module" />;
  }

  const entries = Object.entries(data).filter(
    ([, val]) => typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean'
  );

  if (entries.length === 0) {
    return <EmptyState message="No summary metrics found" />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginTop: '6px' }}>
      {entries.map(([key, val]) => {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const displayVal =
          typeof val === 'number'
            ? val.toLocaleString()
            : typeof val === 'boolean'
            ? val ? 'Yes' : 'No'
            : String(val);

        return (
          <div
            key={key}
            style={{
              padding: '8px 10px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--r-xs)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '3px' }}>
              {formattedKey}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
              {displayVal}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const AdoptionEngagementPage: React.FC<AdoptionEngagementPageProps> = ({
  filters,
  benchmarks,
  onBenchmarkChange,
  sitesSettled = true,
}) => {
  const [opsTab, setOpsTab] = useState<'crm' | 'finance'>('crm');

  // PostHog Adoption Hooks
  const {
    data: adoptData,
    isLoading: isAdoptLoading,
    isError: isAdoptError,
    error: adoptError,
    refetch: refetchAdopt,
  } = useAdoptionEngagement(filters, sitesSettled);

  const {
    data: trendData,
    isLoading: isTrendLoading,
    isError: isTrendError,
    error: trendError,
    refetch: refetchTrend,
  } = useAdoptionTrend(filters, sitesSettled);

  const {
    data: growthData,
    isLoading: isGrowthLoading,
    isError: isGrowthError,
    error: growthError,
    refetch: refetchGrowth,
  } = useGrowth(filters, sitesSettled);

  const {
    data: retentionData,
    isLoading: isRetentionLoading,
    isError: isRetentionError,
    error: retentionError,
    refetch: refetchRetention,
  } = useRetention(filters, sitesSettled);

  const {
    data: rolesData,
    isLoading: isRolesLoading,
    isError: isRolesError,
    error: rolesError,
    refetch: refetchRoles,
  } = useRoles(filters, sitesSettled);

  // FM Matrix CRM Hooks
  const {
    data: leaseData,
    isLoading: isLeaseLoading,
    isError: isLeaseError,
    error: leaseError,
    refetch: refetchLease,
  } = useLeaseOverview(filters, sitesSettled);

  const {
    data: eventsData,
    isLoading: isEventsLoading,
    isError: isEventsError,
    error: eventsError,
    refetch: refetchEvents,
  } = useEventsOverview(filters, sitesSettled);

  const {
    data: broadcastData,
    isLoading: isBroadcastLoading,
    isError: isBroadcastError,
    error: broadcastError,
    refetch: refetchBroadcast,
  } = useBroadcastOverview(filters, sitesSettled);

  const {
    data: walletData,
    isLoading: isWalletLoading,
    isError: isWalletError,
    error: walletError,
    refetch: refetchWallet,
  } = useWalletOverview(filters, sitesSettled);

  // FM Matrix Finance Hooks
  const {
    data: approvalsData,
    isLoading: isApprovalsLoading,
    isError: isApprovalsError,
    error: approvalsError,
    refetch: refetchApprovals,
  } = usePendingApprovals(filters, sitesSettled);

  const {
    data: pendingValData,
    isLoading: isPendingValLoading,
    isError: isPendingValError,
    error: pendingValError,
    refetch: refetchPendingVal,
  } = usePendingRequisitionValue(filters, sitesSettled);

  const {
    data: prSrData,
    isLoading: isPrSrLoading,
    isError: isPrSrError,
    error: prSrError,
    refetch: refetchPrSr,
  } = usePrSrSplit(filters, sitesSettled);

  const {
    data: overdueData,
    isLoading: isOverdueLoading,
    isError: isOverdueError,
    error: overdueError,
    refetch: refetchOverdue,
  } = useOverdueInvoices(filters, sitesSettled);

  // Seat Utilisation
  const seatVal = adoptData?.seat_utilisation?.value;
  const seatDisplay =
    seatVal != null
      ? pct(seatVal <= 1 ? seatVal * 100 : seatVal)
      : isAdoptLoading
      ? '...'
      : '—';
  const seatDelta = formatDelta(adoptData?.seat_utilisation?.delta_pct);

  // Stickiness
  const stickinessVal = adoptData?.stickiness?.value;
  const stickinessDisplay =
    stickinessVal != null
      ? pct(stickinessVal <= 1 ? stickinessVal * 100 : stickinessVal)
      : isAdoptLoading
      ? '...'
      : '—';
  const stickinessDelta = formatDelta(adoptData?.stickiness?.delta_pct);

  // Adoption Trend KPI
  const adoptTrendVal = adoptData?.adoption_trend?.value ?? trendData?.trend_pct;
  const adoptTrendDisplay =
    adoptTrendVal != null
      ? `${adoptTrendVal > 0 ? '+' : ''}${adoptTrendVal.toFixed(1)}%`
      : isAdoptLoading
      ? '...'
      : '—';

  // 14-Day Activation
  const activationVal = adoptData?.activation?.value;
  const activationDisplay =
    activationVal != null
      ? `${Math.round(activationVal <= 1 ? activationVal * 100 : activationVal)}%`
      : isAdoptLoading
      ? '...'
      : '—';
  const activationDelta = formatDelta(adoptData?.activation?.delta_pct);

  // Module Breadth
  const modInUse = adoptData?.module_breadth?.in_use;
  const modTotal = adoptData?.module_breadth?.total;
  const moduleBreadthDisplay =
    modInUse != null && modTotal != null
      ? `${modInUse} / ${modTotal}`
      : isAdoptLoading
      ? '...'
      : '—';

  // Dormant count
  const dormantCount = adoptData?.dormant_users?.value;
  const dormantBand = adoptData?.dormant_users?.band || 'no activity 14+ days';

  // 8-Week Trend Line Chart Series
  const weeklyCurrent = trendData?.weekly?.current || [];
  const weeklyPrevious = trendData?.weekly?.previous || [];
  const trendLabels = weeklyCurrent.map((w) => w.week || 'W');
  const trendSeriesCurrent = weeklyCurrent.map((w) => w.wau || 0);
  const trendSeriesPrev = weeklyPrevious.map((w) => w.wau || 0);

  // Growth Accounting Series
  const growthWeeks = (growthData?.weeks || []).map((w) => w.week || 'W');
  const growthNew = (growthData?.weeks || []).map((w) => w.new || 0);
  const growthRet = (growthData?.weeks || []).map((w) => w.returning || 0);
  const growthRes = (growthData?.weeks || []).map((w) => w.resurrected || 0);
  const growthDorm = (growthData?.weeks || []).map((w) => w.dormant || 0);

  // Audience Roles
  const rolesList = rolesData?.roles || [];
  const roleColors = [
    'var(--chart-blue)',
    'var(--chart-violet)',
    'var(--chart-mint)',
    'var(--green)',
    'var(--chart-amber)',
    'var(--chart-red)',
  ];

  return (
    <section className="page on" id="pgAdopt">
      <div className="section-head">
        <h2>Adoption &amp; Engagement</h2>
        <span className="sd">
          Measure customer adoption, cohort retention, module breadth, and connected FM Matrix operations.
        </span>
      </div>

      <QuestionBox
        questions={[
          'Which modules and features receive the highest adoption across booked homebuyers?',
          'Are new cohorts continuing to return over 8 weeks?',
          'How are resident CRM operations and procurement metrics tracking for live sites?',
        ]}
      />

      {isAdoptError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorState
            title="Failed to load Adoption metrics"
            error={adoptError}
            onRetry={() => refetchAdopt()}
          />
        </div>
      )}

      <div className="tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '16px' }}>
        <KpiTile
          id="seatUtil"
          label="Seat Utilisation"
          val={seatDisplay}
          dir={seatDelta.dir}
          delta={seatDelta.text}
          sub={adoptData?.seat_utilisation?.licensed_seats ? `capacity: ${adoptData.seat_utilisation.licensed_seats}` : 'active ÷ total capacity'}
          raw={seatVal != null ? (seatVal <= 1 ? seatVal * 100 : seatVal) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.seatUtil}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isAdoptLoading}
        />
        <KpiTile
          id="stickiness"
          label="Stickiness"
          val={stickinessDisplay}
          dir={stickinessDelta.dir}
          delta={stickinessDelta.text}
          sub="average DAU / MAU"
          raw={stickinessVal != null ? (stickinessVal <= 1 ? stickinessVal * 100 : stickinessVal) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.stickiness}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isAdoptLoading}
        />
        <KpiTile
          id="adoptionTrend"
          label="Adoption Trend"
          val={adoptTrendDisplay}
          dir={adoptTrendVal && adoptTrendVal > 0 ? 'up' : adoptTrendVal && adoptTrendVal < 0 ? 'dn' : 'flat'}
          delta="vs prior 8 weeks"
          sub="weekly active users trend"
          noTarget={true}
          isLoading={isAdoptLoading || isTrendLoading}
        />
        <KpiTile
          id="activation14"
          label="14-Day Activation"
          val={activationDisplay}
          dir={activationDelta.dir}
          delta={activationDelta.text}
          sub="activated within 14 days"
          raw={activationVal != null ? (activationVal <= 1 ? activationVal * 100 : activationVal) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.activation14}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isAdoptLoading}
        />
        <KpiTile
          id="moduleBreadth2"
          label="Module Breadth"
          val={moduleBreadthDisplay}
          dir="flat"
          delta={null}
          sub="distinct modules used"
          noTarget={true}
          isLoading={isAdoptLoading}
        />
      </div>

      <Card
        id="card-adoptionTrend"
        eyebrow="Trend · Live 8-week PostHog data"
        title="Adoption trend (weekly active users, last 8 weeks)"
        purpose="Weekly active users over the last 8 weeks from PostHog adoption_trend endpoint."
        style={{ marginTop: '12px' }}
      >
        {isTrendError ? (
          <ErrorState
            title="Failed to load adoption trend"
            error={trendError}
            onRetry={() => refetchTrend()}
          />
        ) : isTrendLoading ? (
          <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            Loading 8-week adoption trend...
          </div>
        ) : trendSeriesCurrent.length === 0 ? (
          <EmptyState message="No weekly active user data for this period" />
        ) : (
          <>
            <LineChart
              cur={trendSeriesCurrent}
              prev={trendSeriesPrev}
              labels={trendLabels}
              color="var(--chart-blue)"
              fill="var(--chart-fill)"
              showPrev={weeklyPrevious.length > 0}
              curLabel="Current WAU"
              prevLabel="Prior 8W WAU"
            />
            <div className="legend">
              <span>
                <i style={{ background: 'var(--chart-blue)' }}></i> Current WAU
              </span>
              {weeklyPrevious.length > 0 && (
                <span>
                  <i className="dash"></i> Previous 8-Week Period
                </span>
              )}
            </div>
          </>
        )}
      </Card>

      <div className="grid2">
        <Card
          id="card-growthAccounting"
          eyebrow="Growth accounting · Last 6 weeks"
          title="New · Returning · Resurrecting · Dormant"
          purpose="Breaks the active base into new signups, retained users, resurrected accounts, and dormant users."
        >
          {isGrowthError ? (
            <ErrorState
              title="Failed to load growth accounting"
              error={growthError}
              onRetry={() => refetchGrowth()}
            />
          ) : isGrowthLoading ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              Loading growth accounting...
            </div>
          ) : growthWeeks.length === 0 ? (
            <EmptyState message="No growth data available for this range" />
          ) : (
            <>
              <StackedBarChart
                labels={growthWeeks}
                series={[
                  { label: 'New', data: growthNew, color: 'var(--chart-blue)' },
                  { label: 'Returning', data: growthRet, color: 'var(--green)' },
                  { label: 'Resurrecting', data: growthRes, color: 'var(--chart-mint)' },
                ]}
                negSeries={{ label: 'Dormant', data: growthDorm, color: 'var(--chart-red)' }}
              />
              <div className="legend">
                <span>
                  <i style={{ background: 'var(--chart-blue)' }}></i> New
                </span>
                <span>
                  <i style={{ background: 'var(--green)' }}></i> Returning
                </span>
                <span>
                  <i style={{ background: 'var(--chart-mint)' }}></i> Resurrecting
                </span>
                <span>
                  <i style={{ background: 'var(--chart-red)' }}></i> Dormant
                </span>
              </div>
            </>
          )}
        </Card>

        <Card
          id="card-retentionCohort"
          eyebrow="Retention · Weekly cohorts"
          title="Cohort retention analysis"
          purpose="Percentage of users in each weekly signup cohort who remain active over subsequent weeks."
        >
          {isRetentionError ? (
            <ErrorState
              title="Failed to load retention cohorts"
              error={retentionError}
              onRetry={() => refetchRetention()}
            />
          ) : isRetentionLoading ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              Loading retention cohorts...
            </div>
          ) : (
            <RetentionCohortTable cohorts={retentionData?.cohorts} />
          )}
        </Card>
      </div>

      <div className="grid2">
        <Card
          id="card-roleSplit"
          eyebrow="Adoption by role / audience"
          title="User roles distribution"
          purpose="Active share and user counts by role from PostHog roles API."
        >
          {isRolesError ? (
            <ErrorState
              title="Failed to load roles distribution"
              error={rolesError}
              onRetry={() => refetchRoles()}
            />
          ) : isRolesLoading ? (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              Loading role breakdown...
            </div>
          ) : rolesList.length === 0 ? (
            <EmptyState message="No role data returned" />
          ) : (
            <div className="hbars">
              {rolesList.map((r, idx) => {
                const sharePct = Math.round(r.active_share <= 1 ? r.active_share * 100 : r.active_share);
                const color = roleColors[idx % roleColors.length];
                return (
                  <div className="role" key={idx}>
                    <div className="rn" title={`${r.users || 0} users · ${r.events || 0} events`}>
                      {r.role || 'Unspecified'}
                    </div>
                    <div className="rbar">
                      <i
                        style={{
                          width: `${Math.min(100, Math.max(0, sharePct))}%`,
                          background: color,
                        }}
                      ></i>
                    </div>
                    <div className="rv">{pct(sharePct)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          id="card-dormant"
          eyebrow="Dormant users"
          title="Inactive account summary"
          purpose="Customers with no activity in the dormancy window from PostHog."
        >
          {isAdoptError ? (
            <ErrorState
              title="Failed to load dormant users"
              error={adoptError}
              onRetry={() => refetchAdopt()}
            />
          ) : isAdoptLoading ? (
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              Loading dormant summary...
            </div>
          ) : (
            <div className="kv">
              <div>
                <div className="k">Dormant Users</div>
                <div className="v" style={{ fontSize: '24px' }}>
                  {dormantCount != null ? dormantCount.toLocaleString() : '—'}
                </div>
                <div className="u">{dormantBand}</div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* FM Matrix CRM & Operations Card Section */}
      <div style={{ marginTop: '24px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
            FM Matrix Operational Analytics
          </h3>
          <div className="charttabs">
            <button
              type="button"
              className={opsTab === 'crm' ? 'on' : ''}
              onClick={() => setOpsTab('crm')}
            >
              CRM &amp; Resident
            </button>
            <button
              type="button"
              className={opsTab === 'finance' ? 'on' : ''}
              onClick={() => setOpsTab('finance')}
            >
              Finance &amp; Procurement
            </button>
          </div>
        </div>

        {opsTab === 'crm' && (
          <div className="grid2">
            <Card
              id="card-leaseOverview"
              eyebrow="FM Matrix CRM"
              title="Lease & Occupancy"
              purpose="Live lease metrics from /fm_dashboard/crm/lease_overview.json."
            >
              {isLeaseError ? (
                <ErrorState title="Failed to load lease metrics" error={leaseError} onRetry={() => refetchLease()} />
              ) : isLeaseLoading ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
              ) : (
                renderScalarSummary(leaseData)
              )}
            </Card>

            <Card
              id="card-eventsOverview"
              eyebrow="FM Matrix CRM"
              title="Community Events"
              purpose="Live events overview from /fm_dashboard/crm/events_overview.json."
            >
              {isEventsError ? (
                <ErrorState title="Failed to load events metrics" error={eventsError} onRetry={() => refetchEvents()} />
              ) : isEventsLoading ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
              ) : (
                renderScalarSummary(eventsData)
              )}
            </Card>

            <Card
              id="card-broadcastOverview"
              eyebrow="FM Matrix CRM"
              title="Broadcasts & Notices"
              purpose="Live broadcast reach from /fm_dashboard/crm/broadcast_overview.json."
            >
              {isBroadcastError ? (
                <ErrorState title="Failed to load broadcast metrics" error={broadcastError} onRetry={() => refetchBroadcast()} />
              ) : isBroadcastLoading ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
              ) : (
                renderScalarSummary(broadcastData)
              )}
            </Card>

            <Card
              id="card-walletOverview"
              eyebrow="FM Matrix CRM"
              title="Loyalty Wallet"
              purpose="Resident points balance from /fm_dashboard/crm/wallet_overview.json."
            >
              {isWalletError ? (
                <ErrorState title="Failed to load wallet metrics" error={walletError} onRetry={() => refetchWallet()} />
              ) : isWalletLoading ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
              ) : (
                renderScalarSummary(walletData)
              )}
            </Card>
          </div>
        )}

        {opsTab === 'finance' && (
          <div className="grid2">
            <Card
              id="card-pendingVal"
              eyebrow="FM Matrix Finance"
              title="Pending Requisition Value"
              purpose="Value of pending requisitions from /fm_dashboard/requisitions/pending_value.json."
            >
              {isPendingValError ? (
                <ErrorState title="Failed to load requisition value" error={pendingValError} onRetry={() => refetchPendingVal()} />
              ) : isPendingValLoading ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
              ) : (
                renderScalarSummary(pendingValData)
              )}
            </Card>

            <Card
              id="card-pendingApprovals"
              eyebrow="FM Matrix Finance"
              title="Pending Approvals"
              purpose="Total items pending approval from /fm_dashboard/procurement/pending_approvals.json."
            >
              {isApprovalsError ? (
                <ErrorState title="Failed to load approvals" error={approvalsError} onRetry={() => refetchApprovals()} />
              ) : isApprovalsLoading ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
              ) : (
                renderScalarSummary(approvalsData)
              )}
            </Card>

            <Card
              id="card-prSrSplit"
              eyebrow="FM Matrix Finance"
              title="PR vs SR Split"
              purpose="Material PR to Service Request ratio from /fm_dashboard/procurement/pr_sr_split.json."
            >
              {isPrSrError ? (
                <ErrorState title="Failed to load PR/SR split" error={prSrError} onRetry={() => refetchPrSr()} />
              ) : isPrSrLoading ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
              ) : (
                renderScalarSummary(prSrData)
              )}
            </Card>

            <Card
              id="card-overdueInvoices"
              eyebrow="FM Matrix Finance"
              title="Overdue Invoices"
              purpose="Aging invoices from /fm_dashboard/invoices/overdue_invoices.json."
            >
              {isOverdueError ? (
                <ErrorState title="Failed to load overdue invoices" error={overdueError} onRetry={() => refetchOverdue()} />
              ) : isOverdueLoading ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
              ) : (
                renderScalarSummary(overdueData)
              )}
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};
