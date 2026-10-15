import type { BarRow, FunnelStep, HeatRow, Kpi, TrendPoint } from './types';

/* ---------- small primitives (no chart lib — inline SVG like reference) ---------- */

export function Info({ text }: { text: string }) {
  if (!text) return null;
  return (
    <>
      <button className="ud-info" tabIndex={0} aria-label="Definition">i</button>
      <span className="ud-info-tip">{text}</span>
    </>
  );
}

export function Card(props: { eyebrow?: string; title: string; desc?: string; info?: string; children: React.ReactNode }) {
  return (
    <div className="ud-card">
      <Info text={props.info ?? ''} />
      <div className="ud-card-h">
        {props.eyebrow ? <div className="cr">{props.eyebrow}</div> : null}
        <div className="ct">{props.title}</div>
        {props.desc ? <div className="cd">{props.desc}</div> : null}
      </div>
      <div className="ud-card-b">{props.children}</div>
    </div>
  );
}

export function KpiTile({ kpi }: { kpi: Kpi }) {
  const cls = kpi.deltaPct === null ? 'flat' : kpi.deltaPct >= 0 ? 'up' : 'dn';
  const arrow = kpi.deltaPct === null ? '' : kpi.deltaPct >= 0 ? '▲ ' : '▼ ';
  return (
    <div className="ud-tile">
      <Info text={kpi.info} />
      <div className="v">{kpi.value}</div>
      {kpi.deltaPct !== null && (
        <div className={`d ${cls}`}>{arrow}{Math.abs(kpi.deltaPct).toFixed(1)}%</div>
      )}
      <div className="l">{kpi.label}</div>
      <div className="s">{kpi.sub}</div>
    </div>
  );
}

export function TrendChart({ data, height = 180 }: { data: TrendPoint[]; height?: number }) {
  const W = 640;
  const H = height;
  const PAD = 28;
  const max = Math.max(1, ...data.map((d) => d.current), ...data.map((d) => d.previous ?? 0));
  const x = (i: number) => PAD + (i / Math.max(1, data.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const path = (key: 'current' | 'previous') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y((d[key] ?? 0) as number).toFixed(1)}`).join(' ');
  const area = `${path('current')} L${x(data.length - 1).toFixed(1)},${(H - PAD).toFixed(1)} L${x(0).toFixed(1)},${(H - PAD).toFixed(1)} Z`;
  const step = Math.max(1, Math.floor(data.length / 6));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={PAD} x2={W - PAD} y1={y(max * t)} y2={y(max * t)} stroke="#e6e4de" strokeWidth={1} />
      ))}
      <path d={area} fill="#da7756" opacity={0.12} />
      {data.some((d) => d.previous !== null) && (
        <path d={path('previous')} fill="none" stroke="#d3d1c7" strokeWidth={1.6} strokeDasharray="5 4" />
      )}
      <path d={path('current')} fill="none" stroke="#da7756" strokeWidth={2.2} strokeLinejoin="round" />
      {data.map((d, i) =>
        i % step === 0 ? (
          <text key={i} x={x(i)} y={H - 8} fontSize={10} fill="#888780" textAnchor="middle">{d.label}</text>
        ) : null,
      )}
    </svg>
  );
}

export function Donut({ slices }: { slices: { name: string; value: number; color: string }[] }) {
  const total = Math.max(1, slices.reduce((s, x) => s + x.value, 0));
  let acc = 0;
  const R = 54;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={R} fill="none" stroke="#f6f4ee" strokeWidth={18} />
        {slices.map((s) => {
          const frac = s.value / total;
          const el = (
            <circle
              key={s.name}
              cx={70}
              cy={70}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={18}
              strokeDasharray={`${(frac * C).toFixed(1)} ${C.toFixed(1)}`}
              strokeDashoffset={(-acc * C).toFixed(1)}
              transform="rotate(-90 70 70)"
            />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
        {slices.map((s) => (
          <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.name} <b>{s.value}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

export function HBars({ rows }: { rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      {rows.map((r) => (
        <div className="ud-hbar" key={r.label}>
          <span style={{ color: '#2c2c2c' }}>{r.label}</span>
          <div className="ud-track"><div className="ud-fill" style={{ width: `${(r.value / max) * 100}%` }} /></div>
          <span style={{ textAlign: 'right', fontWeight: 600 }} title={r.hint}>{r.value}%</span>
        </div>
      ))}
    </div>
  );
}

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.users));
  return (
    <div>
      {steps.map((s) => (
        <div key={s.label}>
          <div className="ud-funnel-row">
            <span>{s.label}</span>
            <div className="ud-track" style={{ height: 20 }}>
              <div className="ud-fill" style={{ width: `${(s.users / max) * 100}%`, background: '#2c7be5' }} />
            </div>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>{s.users.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ fontSize: 11, color: '#888780', margin: '-2px 0 6px 180px' }}>
            {s.pctOfStart.toFixed(1)}% of start{s.dropoffFromPrev !== null ? ` · −${s.dropoffFromPrev}% vs prev` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Heatmap({ rows }: { rows: HeatRow[] }) {
  const heads = ['Cohort', 'Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 21', 'Day 30'];
  const bg = (v: number | null) =>
    v === null ? '#f6f4ee' : `rgba(44,123,229,${(0.1 + (v / 100) * 0.68).toFixed(2)})`;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="ud-heat">
        <thead><tr>{heads.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cohort}>
              <td style={{ textAlign: 'left', color: '#555', background: 'none' }}>{r.cohort}</td>
              {r.cells.map((c, i) => (
                <td key={i} style={{ background: bg(c.value), color: (c.value ?? 0) > 55 ? '#fff' : '#2c2c2c' }}>
                  {c.value === null ? '–' : `${c.value}%`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
