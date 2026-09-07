import React from 'react';
import { DashboardFilters, SiteLookupItem } from '../../../posthog-runwal-dashboard/api/types';
import { QuestionBox } from '../../../posthog-runwal-dashboard/components/common/QuestionBox';
import { KpiTile } from '../../../posthog-runwal-dashboard/components/common/KpiTile';
import { Card } from '../../../posthog-runwal-dashboard/components/common/Card';
import { LineChart } from '../../../posthog-runwal-dashboard/components/charts/LineChart';
import { StackedBarChart } from '../../../posthog-runwal-dashboard/components/charts/StackedBarChart';
import { RetentionCohortTable } from '../../../posthog-runwal-dashboard/components/charts/RetentionCohortTable';
import { ErrorState, EmptyState } from '../../../posthog-runwal-dashboard/components/common/DashboardStates';
import {
  useAdoptionEngagement,
  useAdoptionTrend,
  useGrowth,
  useRetention,
  useRoles,
} from '../../../posthog-runwal-dashboard/hooks/useDashboardAnalytics';
import { pct } from '../../../posthog-runwal-dashboard/data/constants';
import { AdminTiersCard } from '../adoption/AdminTiersCard';
import { SocietyLeagueTable } from '../adoption/SocietyLeagueTable';
import { AdminScope } from '../../data/wireframeData';

interface AdoptionEngagementPageProps {
  filters: DashboardFilters;
  benchmarks: Record<string, number | null>;
  onBenchmarkChange: (id: string, value: number | null) => void;
  sitesSettled?: boolean;
  sites: SiteLookupItem[];
  adminScope: AdminScope;
}

function formatDelta(d: number | null | undefined): { text: string | null; dir: 'up' | 'dn' | 'flat' } {
  if (d == null || isNaN(d)) return { text: null, dir: 'flat' };
  const abs = Math.abs(d).toFixed(1);
  if (d > 0) return { text: `${abs}% vs prev`, dir: 'up' };
  if (d < 0) return { text: `${abs}% vs prev`, dir: 'dn' };
  return { text: '0% vs prev', dir: 'flat' };
}

/** Godrej Living — Adoption & Engagement tab, matching the wireframe's pgAdopt section, wired to live Runwal-family PostHog APIs. */
export const AdoptionEngagementPage: React.FC<AdoptionEngagementPageProps> = ({
  filters,
  benchmarks,
  onBenchmarkChange,
  sitesSettled = true,
  sites,
  adminScope,
}) => {
  const { data: adoptData, isLoading: isAdoptLoading, isError: isAdoptError, error: adoptError, refetch: refetchAdopt } =
    useAdoptionEngagement(filters, sitesSettled);
  const { data: trendData, isLoading: isTrendLoading, isError: isTrendError, error: trendError, refetch: refetchTrend } =
    useAdoptionTrend(filters, sitesSettled);
  const { data: growthData, isLoading: isGrowthLoading, isError: isGrowthError, error: growthError, refetch: refetchGrowth } =
    useGrowth(filters, sitesSettled);
  const { data: retentionData, isLoading: isRetentionLoading, isError: isRetentionError, error: retentionError, refetch: refetchRetention } =
    useRetention(filters, sitesSettled);
  const { data: rolesData, isLoading: isRolesLoading, isError: isRolesError, error: rolesError, refetch: refetchRoles } =
    useRoles(filters, sitesSettled);

  const seatUtilVal = adoptData?.seat_utilisation?.value;
  const seatUtilDisplay = seatUtilVal != null ? pct(seatUtilVal <= 1 ? seatUtilVal * 100 : seatUtilVal) : isAdoptLoading ? '...' : '—';
  const seatUtilDelta = formatDelta(adoptData?.seat_utilisation?.delta_pct);

  const stickinessVal = adoptData?.stickiness?.value;
  const stickinessDisplay = stickinessVal != null ? pct(stickinessVal <= 1 ? stickinessVal * 100 : stickinessVal) : isAdoptLoading ? '...' : '—';
  const stickinessDelta = formatDelta(adoptData?.stickiness?.delta_pct);

  const adoptTrendVal = adoptData?.adoption_trend?.value ?? trendData?.trend_pct;
  const adoptTrendDisplay = adoptTrendVal != null ? `${adoptTrendVal > 0 ? '+' : ''}${adoptTrendVal.toFixed(1)}%` : isAdoptLoading ? '...' : '—';

  const activationVal = adoptData?.activation?.value;
  const activationDisplay =
    activationVal != null ? `${Math.round(activationVal <= 1 ? activationVal * 100 : activationVal)}%` : isAdoptLoading ? '...' : '—';
  const activationDelta = formatDelta(adoptData?.activation?.delta_pct);

  const modInUse = adoptData?.module_breadth?.in_use;
  const modTotal = adoptData?.module_breadth?.total;
  const moduleBreadthDisplay = modInUse != null && modTotal != null ? `${modInUse} / ${modTotal}` : isAdoptLoading ? '...' : '—';

  const dormantCount = adoptData?.dormant_users?.value;
  const dormantBand = adoptData?.dormant_users?.band || 'no activity 14+ days';

  const weeklyCurrent = trendData?.weekly?.current || [];
  const weeklyPrevious = trendData?.weekly?.previous || [];
  const trendLabels = weeklyCurrent.map((w) => w.week || 'W');
  const trendSeriesCurrent = weeklyCurrent.map((w) => w.wau || 0);
  const trendSeriesPrev = weeklyPrevious.map((w) => w.wau || 0);

  const growthWeeks = (growthData?.weeks || []).map((w) => w.week || 'W');
  const growthNew = (growthData?.weeks || []).map((w) => w.new || 0);
  const growthRet = (growthData?.weeks || []).map((w) => w.returning || 0);
  const growthRes = (growthData?.weeks || []).map((w) => w.resurrected || 0);
  const growthDorm = (growthData?.weeks || []).map((w) => w.dormant || 0);

  const rolesList = rolesData?.roles || [];
  const roleColors = ['var(--chart-blue)', 'var(--chart-violet)', 'var(--chart-mint)', 'var(--green)', 'var(--chart-amber)', 'var(--chart-red)'];

  return (
    <section className="page on" id="pgAdopt">
      <div className="section-head">
        <h2>Adoption &amp; Engagement</h2>
        <span className="sd">
          Measure how effectively residents adopt and engage with the app&rsquo;s major modules, and whether they keep coming back day over day.
        </span>
      </div>

      <QuestionBox
        questions={[
          'Which modules and community services receive the highest engagement and adoption?',
          'Which modules need UX improvements, and where do residents spend the most time?',
          'Are residents returning to the application, and is retention improving over time?',
          'How does usage differ between Tower Admins (one tower/wing) and Super Admins (whole society)?',
        ]}
      />

      {isAdoptError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorState title="Failed to load Adoption metrics" error={adoptError} onRetry={() => refetchAdopt()} />
        </div>
      )}

      <div className="tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '16px' }}>
        <KpiTile
          id="seatUtil"
          infoKey="A1"
          label="Seat Utilisation"
          val={seatUtilDisplay}
          dir={seatUtilDelta.dir}
          delta={seatUtilDelta.text}
          sub="active ÷ registered residents"
          raw={seatUtilVal != null ? (seatUtilVal <= 1 ? seatUtilVal * 100 : seatUtilVal) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.seatUtil}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isAdoptLoading}
        />
        <KpiTile
          id="stickiness"
          infoKey="A2"
          label="Stickiness"
          val={stickinessDisplay}
          dir={stickinessDelta.dir}
          delta={stickinessDelta.text}
          sub="avg DAU/MAU"
          raw={stickinessVal != null ? (stickinessVal <= 1 ? stickinessVal * 100 : stickinessVal) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.stickiness}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isAdoptLoading}
        />
        <KpiTile
          id="adoptionTrend"
          infoKey="A3"
          label="Adoption Trend"
          val={adoptTrendDisplay}
          dir={adoptTrendVal && adoptTrendVal > 0 ? 'up' : adoptTrendVal && adoptTrendVal < 0 ? 'dn' : 'flat'}
          delta="vs prior 8 weeks"
          sub="weekly active users"
          noTarget={true}
          isLoading={isAdoptLoading || isTrendLoading}
        />
        <KpiTile
          id="activation14"
          infoKey="A4"
          label="14-Day Activation"
          val={activationDisplay}
          dir={activationDelta.dir}
          delta={activationDelta.text}
          sub="of new bookings"
          raw={activationVal != null ? (activationVal <= 1 ? activationVal * 100 : activationVal) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.activation14}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isAdoptLoading}
        />
        <KpiTile
          id="moduleBreadth2"
          infoKey="A5"
          label="Module Breadth"
          val={moduleBreadthDisplay}
          dir="flat"
          delta={null}
          sub="modules used this period"
          noTarget={true}
          isLoading={isAdoptLoading}
        />
      </div>

      <Card
        id="card-adoptionTrend"
        infoKey="chart.adoptionTrend"
        eyebrow="Trend · SVG line chart"
        title="Adoption trend (weekly active residents, last 8 weeks)"
        purpose="Weekly active residents over the last 8 weeks — the trend line behind the Adoption Trend tile above."
        style={{ marginTop: '12px' }}
      >
        {isTrendError ? (
          <ErrorState title="Failed to load adoption trend" error={trendError} onRetry={() => refetchTrend()} />
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
              curLabel="Weekly active residents"
              prevLabel="Prior 8W"
            />
            <div className="legend">
              <span>
                <i style={{ background: 'var(--chart-blue)' }}></i> Weekly active residents
              </span>
            </div>
          </>
        )}
      </Card>

      <div className="grid2">
        <Card
          id="card-growthAccounting"
          infoKey="chart.growth"
          eyebrow="Growth accounting · Last 6 weeks"
          title="New · Returning · Resurrecting · Dormant"
          purpose="Breaks the active base into new signups, retained users, win-backs and users going quiet — a fuller view than a simple new-vs-returning split."
        >
          {isGrowthError ? (
            <ErrorState title="Failed to load growth accounting" error={growthError} onRetry={() => refetchGrowth()} />
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
          infoKey="chart.retention"
          eyebrow="Retention · weekly cohorts"
          title="Do new users keep coming back?"
          purpose="Each row = residents first active that week; cells = % of that cohort still active N weeks later."
        >
          {isRetentionError ? (
            <ErrorState title="Failed to load retention cohorts" error={retentionError} onRetry={() => refetchRetention()} />
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
          infoKey="chart.roles"
          eyebrow="Adoption by role"
          title="Who is (and isn't) using the app"
          purpose="Active users ÷ registered users, split by the role property stamped on every event — shows whether adoption is concentrated among owners or also reaching tenants and admins."
        >
          {isRolesError ? (
            <ErrorState title="Failed to load roles distribution" error={rolesError} onRetry={() => refetchRoles()} />
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
                      <i style={{ width: `${Math.min(100, Math.max(0, sharePct))}%`, background: color }}></i>
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
          infoKey="chart.dormant"
          eyebrow="Dormant users"
          title="Dormant users"
          purpose="Customers with no activity in the dormancy window from PostHog."
        >
          {isAdoptError ? (
            <ErrorState title="Failed to load dormant users" error={adoptError} onRetry={() => refetchAdopt()} />
          ) : isAdoptLoading ? (
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              Loading dormant summary...
            </div>
          ) : (
            <div className="kv">
              <div>
                <div className="k">Dormant residents</div>
                <div className="v" style={{ fontSize: '22px' }}>
                  {dormantCount != null ? dormantCount.toLocaleString() : '—'}
                </div>
                <div className="u">{dormantBand}</div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <AdminTiersCard roles={rolesList} isLoading={isRolesLoading} adminScope={adminScope} />

      <SocietyLeagueTable sites={sites} baseFilters={filters} enabled={sitesSettled} />
    </section>
  );
};
