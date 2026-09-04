import { pct } from '../../data/format';

export interface BarRow {
  name: string;
  share: number;
  color: string;
}

/** Generic labelled horizontal-bar row group, used for device split and role-adoption bars. */
export function HorizontalBars({ rows }: { rows: BarRow[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ss-text-sub, #6b7280)', fontSize: 13 }}>
        No breakdown data available.
      </div>
    );
  }
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div className="role" key={r.name}>
          <div className="rn">{r.name}</div>
          <div className="rbar"><i style={{ width: `${Math.round(r.share * 100)}%`, background: r.color }} /></div>
          <div className="rv">{pct(r.share)}</div>
        </div>
      ))}
    </div>
  );
}
