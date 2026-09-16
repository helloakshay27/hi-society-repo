import { Card, CardHead } from '../components/Card';
import { Tile } from '../components/Tile';
import { TileSkeleton, ChartSkeleton, BarsSkeleton, TableSkeleton, Skeleton } from '../components/Skeleton';
import { SocietyTable } from '../components/tables/SocietyTable';
import { KnownDeadAreasCard } from '../components/KnownDeadAreasCard';
import { LineChart } from '../../posthog-dashboard/components/charts/LineChart';
import { GrowthChart } from '../../posthog-dashboard/components/charts/GrowthChart';
import { HorizontalBars } from '../../posthog-dashboard/components/charts/HorizontalBars';
import { RetentionHeatmap } from '../../posthog-dashboard/components/charts/RetentionHeatmap';
import { useSmartSecureDashboard } from '../context/DashboardContext';

export function AdoptionSection() {
  const { adopt, isAdoptLoading } = useSmartSecureDashboard();

  return (
    <section className="page on" id="pgAdopt">
      <div className="section-head">
        <h2>Adoption &amp; Engagement</h2>
        <span className="sd">
          Measure how effectively gate staff adopt and engage with the app&rsquo;s major modules, and whether they keep coming back shift over shift.
        </span>
      </div>
      <div className="qbox">
        <b>Key questions</b>
        <ul>
          <li>Which modules and gate operations receive the highest engagement and adoption?</li>
          <li>Which modules need UX improvements, and where do gate staff spend the most time?</li>
          <li>Are gate staff returning to the application, and is retention improving over time?</li>
        </ul>
      </div>

      {isAdoptLoading ? (
        <div style={{ marginTop: 16 }}>
          <TileSkeleton count={4} cols={4} />
        </div>
      ) : (
        <div className="tiles" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginTop: 16 }}>
          {adopt.tiles.map((t) => <Tile key={t.label} {...t} />)}
        </div>
      )}

      <Card
        style={{ marginTop: 12 }}
        infoKey="A6"
        head={<CardHead cr="Trend · SVG line chart" ct="Adoption trend (weekly active users, last 8 weeks)" />}
      >
        {isAdoptLoading ? (
          <ChartSkeleton height={240} />
        ) : (
          <>
            <LineChart cur={adopt.adoptionTrendChart.series} showPrev={false} labels={adopt.adoptionTrendChart.labels} />
            <div className="legend"><span><i style={{ background: 'var(--ss-chart-blue)' }} /> Weekly active users</span></div>
          </>
        )}
      </Card>

      <div className="grid2">
        <Card
          infoKey="A7"
          head={<CardHead cr="Growth accounting · Last 6 weeks" ct="New · Returning · Resurrecting · Dormant" />}
        >
          {isAdoptLoading ? (
            <ChartSkeleton height={240} />
          ) : (
            <>
              <GrowthChart weeks={adopt.growthWeeks} />
              <div className="legend">
                <span><i style={{ background: 'var(--ss-chart-blue)' }} /> New</span>
                <span><i style={{ background: 'var(--ss-green)' }} /> Returning</span>
                <span><i style={{ background: 'var(--ss-mint)' }} /> Resurrecting</span>
                <span><i style={{ background: 'var(--ss-chart-red)' }} /> Dormant</span>
              </div>
            </>
          )}
        </Card>

        <Card
          infoKey="A8"
          bodyClassName="tbl-wrap"
          head={<CardHead cr="Retention · weekly cohorts" ct="Do new users keep coming back?" />}
        >
          {isAdoptLoading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : (
            <RetentionHeatmap cohorts={adopt.retentionCohorts} rowLabels={adopt.retentionRowLabels} />
          )}
        </Card>
      </div>

      <div className="grid2">
        <Card infoKey="A9" head={<CardHead ct="Adoption by role" cd="Who is (and isn't) using the app" />}>
          {isAdoptLoading ? (
            <div style={{ padding: '8px 0' }}>
              <BarsSkeleton count={3} />
            </div>
          ) : (
            <HorizontalBars rows={adopt.roleShares} />
          )}
        </Card>

        <Card infoKey="A10" head={<CardHead ct="Dormant users" cd="Registered gate staff/admins with no activity in the last 14 days." />}>
          <div className="kv">
            <div>
              <div className="k">Dormant gate staff</div>
              {isAdoptLoading ? (
                <Skeleton style={{ width: 60, height: 28, margin: '4px 0' }} />
              ) : (
                <div className="v" style={{ fontSize: 22 }}>{adopt.dormant.toLocaleString()}</div>
              )}
              <div className="u">no activity 14+ days</div>
            </div>
          </div>
        </Card>
      </div>

      <KnownDeadAreasCard />

      <Card
        style={{ marginTop: 12 }}
        infoKey="A11"
        bodyClassName="tbl-wrap"
        head={<CardHead cr="League table" ct="Society-wise breakdown" cd="Active gate staff, sessions and bounce rate per society, worst-trending first." />}
      >
        {isAdoptLoading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <SocietyTable rows={adopt.societyRows} />
        )}
      </Card>
    </section>
  );
}
