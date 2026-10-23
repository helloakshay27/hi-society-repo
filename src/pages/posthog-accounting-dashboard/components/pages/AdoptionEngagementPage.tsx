import React from 'react';
import { DashboardFilters } from '../../../posthog-runwal-dashboard/api/types';
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
  useModuleTree,
  useTrafficSession,
} from '../../../posthog-runwal-dashboard/hooks/useDashboardAnalytics';
import { pct, fmtDateShort } from '../../../posthog-runwal-dashboard/data/constants';
import { formatModuleName } from '../../../posthog-godrej-dashboard/components/workflow/ModuleNav';

interface AdoptionEngagementPageProps {
  filters: DashboardFilters;
  benchmarks: Record<string, number | null>;
  onBenchmarkChange: (id: string, value: number | null) => void;
  sitesSettled?: boolean;
  showPrev: boolean;
}

const MODULE_COLORS = ['var(--chart-blue)', 'var(--chart-mint)', 'var(--chart-violet)', 'var(--green)', 'var(--chart-amber)', 'var(--chart-red)'];
const MAX_MODULE_ROWS = 8;

function formatDelta(d: number | null | undefined): { text: string | null; dir: 'up' | 'dn' | 'flat' } {
  if (d == null || isNaN(d)) return { text: null, dir: 'flat' };
  const text = `${Math.abs(d).toFixed(1)}% vs prev`;
  return { text, dir: d > 0 ? 'up' : d < 0 ? 'dn' : 'flat' };
}

/** API values may arrive as a 0–1 fraction or a 0–100 percentage. */
const asPct = (v: number) => (v <= 1 ? v * 100 : v);

const Loading: React.FC<{ height: number; text: string }> = ({ height, text }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>{text}</div>
);

/** Hi Society Accounting — Adoption & Engagement tab (wireframe pgAdopt), wired to the live PostHog adoption APIs. */
export const AdoptionEngagementPage: React.FC<AdoptionEngagementPageProps> = ({
  filters,
  benchmarks,
  onBenchmarkChange,
  sitesSettled = true,
  showPrev,
}) => {
  const { data: adoptData, isLoading: isAdoptLoading, isError: isAdoptError, error: adoptError, refetch: refetchAdopt } =
    useAdoptionEngagement(filters, sitesSettled);
  const { data: trendData, isLoading: isTrendLoading, isError: isTrendError, error: trendError, refetch: refetchTrend } =
    useAdoptionTrend(filters, sitesSettled);
  const { data: growthData, isLoading: isGrowthLoading, isError: isGrowthError, error: growthError, refetch: refetchGrowth } =
    useGrowth(filters, sitesSettled);
  const {
    data: retentionData,
    isLoading: isRetentionLoading,
    isError: isRetentionError,
    error: retentionError,
    refetch: refetchRetention,
  } = useRetention(filters, sitesSettled);
  const { data: moduleData, isLoading: isModulesLoading, isError: isModulesError, error: modulesError, refetch: refetchModules } =
    useModuleTree(filters, sitesSettled);
  // Same query key as the Traffic tab / filter bar, so this is served from cache.
  const { data: trafficData } = useTrafficSession(filters, sitesSettled);

  const stickinessVal = adoptData?.stickiness?.value;
  const stickinessDelta = formatDelta(adoptData?.stickiness?.delta_pct);

  const adoptTrendVal = adoptData?.adoption_trend?.value ?? trendData?.trend_pct;

  const activationVal = adoptData?.activation?.value;
  const activationDelta = formatDelta(adoptData?.activation?.delta_pct);

  const modInUse = adoptData?.module_breadth?.in_use;
  const modTotal = adoptData?.module_breadth?.total;

  const dormantCount = adoptData?.dormant_users?.value;
  const dormantBand = adoptData?.dormant_users?.band || 'no activity 14+ days';

  const pending = (fallback = '—') => (isAdoptLoading ? '...' : fallback);

  const weeklyCurrent = trendData?.weekly?.current || [];
  const weeklyPrevious = trendData?.weekly?.previous || [];
  const trendLabels = weeklyCurrent.map((w) => (w.week ? fmtDateShort(w.week) : 'W'));

  const growthWeeks = growthData?.weeks || [];
  const growthLabels = growthWeeks.map((w) => (w.week ? fmtDateShort(w.week) : 'W'));

  // Adoption by module: users who touched each module ÷ active users in scope.
  const activeUsers = trafficData?.tiles?.active_users || 0;
  const moduleRows = [...(moduleData?.tree || [])].sort((a, b) => (b.users || 0) - (a.users || 0)).slice(0, MAX_MODULE_ROWS);
  const moduleDenominator = Math.max(activeUsers, ...moduleRows.map((m) => m.users || 0), 1);

  return (
    <section className="page on" id="pgAdopt">
      <div className="section-head">
        <h2>Adoption &amp; Engagement</h2>
        <span className="sd">
          Measure how effectively users adopt and engage with Accounting, and whether they keep coming back.
        </span>
      </div>

      <QuestionBox
        questions={[
          'Which areas of Accounting receive the highest engagement and adoption?',
          'Which workflow groups are used most, and which are barely touched?',
          'Are users returning to Accounting, and is retention improving over time?',
        ]}
      />

      {isAdoptError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorState title="Failed to load Adoption metrics" error={adoptError} onRetry={() => refetchAdopt()} />
        </div>
      )}

      <div className="tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '16px' }}>
        <KpiTile
          id="stickiness"
          infoKey="A2"
          label="Stickiness"
          val={stickinessVal != null ? pct(asPct(stickinessVal)) : pending()}
          dir={stickinessDelta.dir}
          delta={stickinessDelta.text}
          sub="avg DAU/MAU"
          raw={stickinessVal != null ? asPct(stickinessVal) : undefined}
          unit="%"
          goodUp
          benchmark={benchmarks.stickiness}
          onBenchmarkChange={onBenchmarkChange}
          noTarget
          isLoading={isAdoptLoading}
        />
        <KpiTile
          id="adoptionTrend"
          infoKey="A3"
          label="Adoption Trend"
          val={adoptTrendVal != null ? `${adoptTrendVal > 0 ? '+' : ''}${adoptTrendVal.toFixed(1)}%` : pending()}
          dir={adoptTrendVal && adoptTrendVal > 0 ? 'up' : adoptTrendVal && adoptTrendVal < 0 ? 'dn' : 'flat'}
          delta="vs prior 8 weeks"
          sub="weekly active users"
          noTarget
          isLoading={isAdoptLoading || isTrendLoading}
        />
        <KpiTile
          id="activation14"
          infoKey="A4"
          label="14-Day Activation"
          val={activationVal != null ? `${Math.round(asPct(activationVal))}%` : pending()}
          dir={activationDelta.dir}
          delta={activationDelta.text}
          sub="of new users"
          raw={activationVal != null ? asPct(activationVal) : undefined}
          unit="%"
          goodUp
          benchmark={benchmarks.activation14}
          onBenchmarkChange={onBenchmarkChange}
          noTarget
          isLoading={isAdoptLoading}
        />
        <KpiTile
          id="moduleBreadth"
          infoKey="A5"
          label="Module Breadth"
          val={modInUse != null && modTotal != null ? `${modInUse} / ${modTotal}` : pending()}
          dir="flat"
          delta={null}
          sub="areas used this period"
          noTarget
          isLoading={isAdoptLoading}
        />
        <KpiTile
          id="dormantUsers"
          label="Dormant Users"
          val={dormantCount != null ? dormantCount.toLocaleString() : pending()}
          dir="flat"
          delta={null}
          sub={dormantBand}
          noTarget
          isLoading={isAdoptLoading}
        />
      </div>

      <Card
        id="card-adoptionTrend"
        infoKey="chart.adoptionTrend"
        eyebrow="Trend · SVG line chart"
        title="Adoption trend (weekly active users, last 8 weeks)"
        purpose="Weekly active users over the last 8 weeks, the trend line behind the Adoption Trend tile above."
        style={{ marginTop: '12px' }}
      >
        {isTrendError ? (
          <ErrorState title="Failed to load adoption trend" error={trendError} onRetry={() => refetchTrend()} />
        ) : isTrendLoading ? (
          <Loading height={180} text="Loading 8-week adoption trend..." />
        ) : weeklyCurrent.length === 0 ? (
          <EmptyState message="No weekly active user data for this period" />
        ) : (
          <>
            <LineChart
              cur={weeklyCurrent.map((w) => w.wau || 0)}
              prev={showPrev && weeklyPrevious.length === weeklyCurrent.length && weeklyPrevious.length > 1
                ? weeklyPrevious.map((w) => w.wau || 0)
                : []}
              labels={trendLabels}
              color="var(--chart-blue)"
              fill="var(--chart-fill)"
              showPrev={showPrev && weeklyPrevious.length === weeklyCurrent.length && weeklyPrevious.length > 1}
              curLabel="Weekly active users"
              prevLabel="Prior 8W"
            />
            <div className="legend">
              <span>
                <i style={{ background: 'var(--chart-blue)' }}></i> Weekly active users
              </span>
              {showPrev && weeklyPrevious.length === weeklyCurrent.length && weeklyPrevious.length > 1 && (
                <span><i className="dash"></i> Prior 8 weeks</span>
              )}
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
          purpose="Breaks the active base into new users, retained users, win-backs and users going quiet."
        >
          {isGrowthError ? (
            <ErrorState title="Failed to load growth accounting" error={growthError} onRetry={() => refetchGrowth()} />
          ) : isGrowthLoading ? (
            <Loading height={220} text="Loading growth accounting..." />
          ) : growthWeeks.length === 0 ? (
            <EmptyState message="No growth data available for this range" />
          ) : (
            <>
              <StackedBarChart
                labels={growthLabels}
                series={[
                  { label: 'New', data: growthWeeks.map((w) => w.new || 0), color: 'var(--chart-blue)' },
                  { label: 'Returning', data: growthWeeks.map((w) => w.returning || 0), color: 'var(--green)' },
                  { label: 'Resurrecting', data: growthWeeks.map((w) => w.resurrected || 0), color: 'var(--chart-mint)' },
                ]}
                negSeries={{ label: 'Dormant', data: growthWeeks.map((w) => w.dormant || 0), color: 'var(--chart-red)' }}
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
          purpose="Each row = users first active in Accounting that week; cells = % of that cohort still active N weeks later."
        >
          {isRetentionError ? (
            <ErrorState title="Failed to load retention cohorts" error={retentionError} onRetry={() => refetchRetention()} />
          ) : isRetentionLoading ? (
            <Loading height={220} text="Loading retention cohorts..." />
          ) : (
            <RetentionCohortTable cohorts={retentionData?.cohorts} />
          )}
        </Card>
      </div>

      <div className="grid2">
        <Card
          id="card-areaSplit"
          eyebrow="Adoption by module"
          title="Which areas get used most"
          purpose="Users who opened at least one screen in each module ÷ active users in the selected scope. Modules come from the live PostHog path tree."
        >
          {isModulesError ? (
            <ErrorState title="Failed to load module adoption" error={modulesError} onRetry={() => refetchModules()} />
          ) : isModulesLoading ? (
            <Loading height={160} text="Loading module adoption..." />
          ) : moduleRows.length === 0 ? (
            <EmptyState message="No module usage returned" />
          ) : (
            <div className="hbars">
              {moduleRows.map((m, idx) => {
                const sharePct = Math.round(((m.users || 0) / moduleDenominator) * 100);
                return (
                  <div className="role" key={m.name}>
                    <div className="rn" title={`${m.users || 0} users · ${m.events || 0} events · ${m.sessions || 0} sessions`}>
                      {formatModuleName(m.name)}
                    </div>
                    <div className="rbar">
                      <i style={{ width: `${Math.min(100, sharePct)}%`, background: MODULE_COLORS[idx % MODULE_COLORS.length] }}></i>
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
          purpose="Users who used Accounting before but have no activity in the dormancy window."
        >
          {isAdoptError ? (
            <ErrorState title="Failed to load dormant users" error={adoptError} onRetry={() => refetchAdopt()} />
          ) : isAdoptLoading ? (
            <Loading height={100} text="Loading dormant summary..." />
          ) : (
            <div className="kv">
              <div>
                <div className="k">Dormant users</div>
                <div className="v" style={{ fontSize: '22px' }}>
                  {dormantCount != null ? dormantCount.toLocaleString() : '—'}
                </div>
                <div className="u">{dormantBand}</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};
