import type { CSSProperties } from 'react';

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`ss-skeleton ${className}`} style={style} />;
}

export function TileSkeleton({ count = 3, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className="tiles" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="tile" style={{ pointerEvents: 'none' }}>
          <div className="tophead">
            <Skeleton style={{ width: '48%', height: 16 }} />
            <Skeleton style={{ width: 18, height: 18, borderRadius: '50%' }} />
          </div>
          <Skeleton style={{ width: '65%', height: 32, margin: '14px 0 8px' }} />
          <Skeleton style={{ width: '50%', height: 14 }} />
          <div className="bm" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <Skeleton style={{ width: '38%', height: 14 }} />
            <Skeleton style={{ width: '28%', height: 20, borderRadius: 20, marginLeft: 'auto' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton style={{ width: 120, height: 14 }} />
        <Skeleton style={{ width: 90, height: 14 }} />
      </div>
      <Skeleton style={{ width: '100%', height, borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <Skeleton style={{ width: 110, height: 12 }} />
        <Skeleton style={{ width: 110, height: 12 }} />
      </div>
    </div>
  );
}

export function BarsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 40px', gap: 12, alignItems: 'center' }}>
          <Skeleton style={{ height: 14 }} />
          <Skeleton style={{ height: 10, borderRadius: 4 }} />
          <Skeleton style={{ height: 14 }} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} style={{ flex: 1, height: 15 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 12, padding: '6px 0' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} style={{ flex: 1, height: 14 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FunnelSkeleton({ steps = 4 }: { steps?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
      {Array.from({ length: steps }).map((_, i) => {
        const width = `${100 - i * 15}%`;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {i > 0 && <Skeleton style={{ width: 80, height: 12 }} />}
            <Skeleton style={{ width, height: 42, borderRadius: 8 }} />
          </div>
        );
      })}
    </div>
  );
}
