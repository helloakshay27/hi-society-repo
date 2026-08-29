import React, { useState, useRef } from 'react';
import { fmtC } from '../../data/constants';

interface SeriesItem {
  label: string;
  data: number[];
  color: string;
}

interface StackedBarChartProps {
  labels: string[];
  series: SeriesItem[];
  negSeries?: SeriesItem;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  labels = [],
  series = [],
  negSeries,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 600;
  const H = 260;
  const pl = 40;
  const pr = 12;
  const pt = 14;
  const pb = 26;
  const n = labels.length;

  if (n === 0) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        No growth accounting data available
      </div>
    );
  }

  const maxUp = Math.max(
    1,
    ...labels.map((_, i) => series.reduce((a, s) => a + (s.data[i] || 0), 0))
  );
  const maxDn = negSeries && negSeries.data.length > 0 ? Math.max(1, ...negSeries.data) : 1;
  const gap = (W - pl - pr) / n;
  const bw = Math.max(8, gap * 0.52);
  const zero = pt + (H - pt - pb) * (maxUp / (maxUp + maxDn || 1));
  const scaleUp = (zero - pt) / (maxUp || 1);
  const scaleDn = (H - pb - zero) / (maxDn || 1);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || n <= 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let idx = Math.floor((svgX - pl) / gap);
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
  };

  const handlePointerLeave = () => {
    setHoverIdx(null);
  };

  // Tooltip rendering for hovered column
  let tooltipNode: React.ReactNode = null;
  if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < n) {
    const lab = labels[hoverIdx];
    const totalActive = series.reduce((sum, s) => sum + (s.data[hoverIdx] || 0), 0);
    const negVal = negSeries && negSeries.data[hoverIdx] ? negSeries.data[hoverIdx] : 0;

    const items = series.map((s) => ({
      label: s.label,
      val: s.data[hoverIdx] || 0,
      color: s.color,
    }));

    if (negSeries && negVal > 0) {
      items.push({
        label: negSeries.label,
        val: negVal,
        color: negSeries.color,
      });
    }

    const colX = pl + hoverIdx * gap + gap / 2;
    const cardW = 160;
    const cardH = 34 + items.length * 18 + (negVal > 0 ? 6 : 0);
    let cardX = colX + 14;
    if (cardX + cardW > W - 10) {
      cardX = colX - cardW - 14;
    }
    if (cardX < 10) {
      cardX = 10;
    }
    let cardY = Math.max(pt + 2, Math.min(H - pb - cardH - 4, zero - cardH / 2));

    tooltipNode = (
      <g style={{ pointerEvents: 'none', transition: 'all 0.05s ease-out' }}>
        <rect
          x={cardX.toFixed(1)}
          y={cardY.toFixed(1)}
          width={cardW}
          height={cardH}
          rx={6}
          ry={6}
          fill="var(--surface, #ffffff)"
          stroke="var(--border, #e6e4de)"
          strokeWidth="1"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.12))' }}
        />
        <text
          x={(cardX + 10).toFixed(1)}
          y={(cardY + 15).toFixed(1)}
          fontSize="11"
          fontWeight="600"
          fill="var(--ink, #141413)"
          fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
        >
          {lab}
        </text>
        <text
          x={(cardX + cardW - 10).toFixed(1)}
          y={(cardY + 15).toFixed(1)}
          textAnchor="end"
          fontSize="10"
          fill="var(--muted, #6f6e68)"
          fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
        >
          Active: <tspan fontWeight="600" fill="var(--ink, #141413)">{fmtC(totalActive)}</tspan>
        </text>

        <line
          x1={(cardX + 8).toFixed(1)}
          y1={(cardY + 22).toFixed(1)}
          x2={(cardX + cardW - 8).toFixed(1)}
          y2={(cardY + 22).toFixed(1)}
          stroke="var(--border, #e6e4de)"
          strokeDasharray="2 2"
        />

        {items.map((it, itIdx) => {
          const rowY = cardY + 36 + itIdx * 17;
          return (
            <g key={itIdx}>
              <circle
                cx={(cardX + 14).toFixed(1)}
                cy={(rowY - 3).toFixed(1)}
                r="3.5"
                fill={it.color}
              />
              <text
                x={(cardX + 23).toFixed(1)}
                y={rowY.toFixed(1)}
                fontSize="10.5"
                fill="var(--muted, #6f6e68)"
                fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
              >
                {it.label}:
              </text>
              <text
                x={(cardX + cardW - 10).toFixed(1)}
                y={rowY.toFixed(1)}
                textAnchor="end"
                fontSize="11"
                fontWeight="600"
                fill="var(--ink, #141413)"
                fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
              >
                {fmtC(it.val)}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {labels.map((lab, i) => {
        const x = pl + i * gap + (gap - bw) / 2;
        const isHovered = hoverIdx === i;
        let y = zero;

        const posBars = series.map((s, sIdx) => {
          const val = s.data[i] || 0;
          const h = val * scaleUp;
          y -= h;
          return (
            <rect
              key={`pos-${sIdx}-${i}`}
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              width={bw.toFixed(1)}
              height={Math.max(0, h).toFixed(1)}
              fill={s.color}
              rx={1.5}
              opacity={hoverIdx !== null && !isHovered ? 0.45 : 1}
              style={{ transition: 'opacity 0.15s ease' }}
            />
          );
        });

        let negBar: React.ReactNode = null;
        if (negSeries && negSeries.data[i]) {
          const val = negSeries.data[i] || 0;
          const hd = val * scaleDn;
          negBar = (
            <rect
              key={`neg-${i}`}
              x={x.toFixed(1)}
              y={zero.toFixed(1)}
              width={bw.toFixed(1)}
              height={Math.max(0, hd).toFixed(1)}
              fill={negSeries.color}
              rx={1.5}
              opacity={hoverIdx !== null && !isHovered ? 0.45 : 1}
              style={{ transition: 'opacity 0.15s ease' }}
            />
          );
        }

        return (
          <g key={i}>
            {isHovered && (
              <rect
                x={(pl + i * gap + 2).toFixed(1)}
                y={pt}
                width={(gap - 4).toFixed(1)}
                height={H - pt - pb}
                fill="var(--blue, #2c7be5)"
                opacity="0.08"
                rx={4}
              />
            )}
            {posBars}
            {negBar}
            <text
              x={(x + bw / 2).toFixed(1)}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight={isHovered ? '600' : '400'}
              fill={isHovered ? 'var(--ink)' : 'var(--faint)'}
              fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
            >
              {lab}
            </text>
          </g>
        );
      })}
      <line
        x1={pl}
        y1={zero.toFixed(1)}
        x2={W - pr}
        y2={zero.toFixed(1)}
        stroke="var(--chart-line)"
      />
      {tooltipNode}
    </svg>
  );
};

