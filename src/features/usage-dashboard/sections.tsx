import { Card, Donut, Funnel, HBars, Heatmap, KpiTile, TrendChart } from './components';
import type { UsageDashboardData, WorkflowModule } from './types';

export function TrafficSection({ data }: { data: UsageDashboardData }) {
  const t = data.traffic;
  return (
    <section>
      <h2 className="ud-title" style={{ fontSize: 17 }}>Traffic &amp; Session</h2>
      <p className="ud-sub">Overall traffic, resident activity and session behaviour.</p>
      <div className="ud-q"><b>Key questions</b><ul><li>How many residents use the app, and how often?</li><li>Which societies generate the most traffic?</li></ul></div>
      <div className="ud-tiles">{t.kpis.map((k) => <KpiTile key={k.id} kpi={k} />)}</div>
      <div className="ud-grid2">
        <Card eyebrow={`Last ${data.filtersEcho.preset} days${data.filtersEcho.comparePrevious ? ' · vs previous' : ''}`} title="Usage over time" info="Screen views per day in the selected period. Dashed = previous period.">
          <TrendChart data={t.usageTrend} />
        </Card>
        <Card title="Device split" desc="Share of usage by platform." info="Android vs iOS share of active usage.">
          <Donut slices={t.deviceSplit} />
          <p className="ud-sub" style={{ marginTop: 12 }}>● {t.liveNow} recently online (last 30 min, sample)</p>
        </Card>
      </div>
    </section>
  );
}

export function AdoptionSection({ data }: { data: UsageDashboardData }) {
  const a = data.adoption;
  return (
    <section>
      <h2 className="ud-title" style={{ fontSize: 17 }}>Adoption &amp; Engagement</h2>
      <p className="ud-sub">Module adoption, retention and dormant slices.</p>
      <div className="ud-tiles">{a.kpis.map((k) => <KpiTile key={k.id} kpi={k} />)}</div>
      <Card eyebrow="Trend" title="Adoption trend" info="Active users engaging with any tracked module per day.">
        <TrendChart data={a.adoptionTrend} />
      </Card>
      <div className="ud-grid2">
        <Card title="Adoption by module" desc="Share of active users per module." info="Distinct users per module ÷ active users.">
          <HBars rows={a.byModule} />
        </Card>
        <Card title="Retention cohort" desc="New-user cohorts returning over time." info="Rows = weekly cohorts; columns = Day N return rate.">
          <Heatmap rows={a.retention} />
        </Card>
      </div>
      <div className="ud-grid2">
        <Card title="Where attention drops" desc="Dormant / one-and-done slices." info="Diagnostic only — helps prioritise UX fixes.">
          <HBars rows={a.dormant} />
        </Card>
        <Card title="Module league" desc="All modules compared." info="Users, sessions, adoption and health status per module.">
          <div style={{ overflowX: 'auto' }}>
            <table className="ud-tbl">
              <thead><tr><th>Module</th><th style={{ textAlign: 'right' }}>Users</th><th style={{ textAlign: 'right' }}>Adoption</th><th>Status</th></tr></thead>
              <tbody>
                {a.table.map((r) => (
                  <tr key={r.module}>
                    <td><b>{r.module}</b></td>
                    <td style={{ textAlign: 'right' }}>{r.users.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>{r.adoptionPct}%</td>
                    <td><span className={`ud-badge ${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}

export function WorkflowSection({
  data, active, onPick,
}: {
  data: UsageDashboardData;
  active: WorkflowModule;
  onPick: (key: string) => void;
}) {
  return (
    <section>
      <h2 className="ud-title" style={{ fontSize: 17 }}>Workflow Usage</h2>
      <p className="ud-sub">Completion funnels per module — pick a module, see where residents drop.</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        {data.workflow.modules.map((m) => (
          <button
            key={m.key}
            onClick={() => onPick(m.key)}
            style={{
              fontSize: 12.5, padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
              border: '1px solid #d5dbdb',
              background: m.key === active.key ? '#2c2c2c' : '#fff',
              color: m.key === active.key ? '#fff' : '#555',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="ud-tiles four">
        {[
          { v: `${active.adoptionPct}%`, l: 'Adoption', s: 'started this workflow' },
          { v: `${active.completionPct}%`, l: 'Completion', s: 'reached success step' },
          { v: `${active.dropoffPct}%`, l: 'Drop-off', s: 'started, never finished' },
          { v: active.avgTime, l: 'Avg. time', s: `${active.completions.toLocaleString('en-IN')} completions` },
        ].map((k) => (
          <div className="ud-tile" key={k.l}><div className="v">{k.v}</div><div className="l">{k.l}</div><div className="s">{k.s}</div></div>
        ))}
      </div>
      <Card eyebrow={active.bucket} title={`${active.label} — funnel`} desc="Start → success steps with drop-off." info="Each step = users firing that workflow event; drop-off measured vs previous step.">
        <Funnel steps={active.funnel} />
      </Card>
    </section>
  );
}
