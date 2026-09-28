import type { FunnelData } from '../data/metrics';

/** Ported from the wireframe's own funnel markup: full-width colored bars whose width
 *  and opacity shrink step over step, with the drop-off percentage shown above each
 *  step after the first. Visually distinct from the posthog-dashboard Funnel (a
 *  label/thin-bar/count row layout), so kept as its own component rather than reused. */
export function Funnel({ funnel }: { funnel: FunnelData }) {
  if (!funnel || !funnel.steps || funnel.steps.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        No workflow funnel data available.
      </div>
    );
  }

  return (
    <div className="funnel">
      {funnel.steps.map((s, i) => {
        const width = Math.max(30, Math.min(100, 30 + (s.pctOfEntrants / 100) * 70));
        return (
          <div key={`${s.step}-${i}`} className="fitem">
            {s.dropPct != null && (
              <div className="fdrop">
                <span>▼</span> {s.dropPct}% drop-off
              </div>
            )}
            <div className="ftrack">
              <div
                className="fstep"
                style={{ width: `${width}%` }}
                title={`${s.step}: ${s.pctOfEntrants}% of entrants remain`}
              >
                <span className="fname">{s.step}</span>
                <span className="fsub">{s.pctOfEntrants}% of entrants</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
