import React, { useState, useRef } from 'react';
import { fmtC } from '../../data/constants';

interface LineChartProps {
  cur: number[];
  prev?: number[] | null;
  labels?: string[];
  color?: string;
  fill?: string;
  showPrev?: boolean;
  pctScale?: boolean;
  gridColor?: string;
  lineColor?: string;
  faintColor?: string;
  curLabel?: string;
  prevLabel?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  cur = [],
  prev,
  labels,
  color = 'var(--blue)',
  fill = 'var(--chart-fill)',
  showPrev = true,
  pctScale = false,
  gridColor = 'var(--chart-grid)',
  lineColor = 'var(--chart-line)',
  faintColor = 'var(--faint)',
  curLabel = 'Current',
  prevLabel = 'Previous',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 680;
  const H = 250;
  const pl = pctScale ? 54 : 44;
  const pr = 14;
  const pt = 16;
  const pb = 30;

  if (!cur || cur.length === 0) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        No chart data available for this range
      </div>
    );
  }

  const all = cur.concat(prev && showPrev ? prev : []);
  const validAll = all.filter((x) => typeof x === 'number' && !isNaN(x));
  const rawMin = validAll.length > 0 ? Math.min(...validAll) : 0;
  const rawMax = validAll.length > 0 ? Math.max(...validAll) : 1;

  const mn = pctScale ? Math.max(0, rawMin - 0.6) : 0;
  const mx = pctScale
    ? Math.min(100, rawMax + 0.6)
    : Math.max(1, rawMax * 1.14);
  const span = mx - mn || 1;
  const n = cur.length;
  const xw = (W - pl - pr) / Math.max(1, n - 1);

  const X = (i: number) => pl + i * xw;
  const Y = (v: number) => pt + (H - pt - pb) * (1 - (v - mn) / span);
  const base = H - pb;
  const vfmt = pctScale ? (v: number) => v.toFixed(1) + '%' : (v: number) => (v >= 1000 ? v.toLocaleString() : fmtC(v));

  const path = (arr: number[]) => {
    let d = '';
    for (let i = 0; i < arr.length; i++) {
      const val = typeof arr[i] === 'number' && !isNaN(arr[i]) ? arr[i] : 0;
      d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(val).toFixed(1) + ' ';
    }
    return d;
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || n <= 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let idx = Math.round((svgX - pl) / xw);
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
  };

  const handlePointerLeave = () => {
    setHoverIdx(null);
  };

  const step = Math.max(1, Math.ceil(n / 6));
  const gridLines: React.ReactNode[] = [];
  const xLabels: React.ReactNode[] = [];

  for (let i = 0; i < n; i += step) {
    const x = X(i).toFixed(1);
    gridLines.push(
      <line
        key={`grid-${i}`}
        x1={x}
        y1={pt}
        x2={x}
        y2={base}
        stroke={gridColor}
        strokeDasharray="2 4"
      />
    );
    xLabels.push(
      <text
        key={`xlab-${i}`}
        x={x}
        y={H - 9}
        textAnchor="middle"
        fontSize="11"
        fill={faintColor}
        fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
      >
        {labels && labels[i] ? labels[i] : i + 1}
      </text>
    );
  }

  const yLabels: React.ReactNode[] = [];
  for (let g = 0; g <= 2; g++) {
    const y = pt + ((H - pt - pb) * g) / 2;
    const val = mn + span * (1 - g / 2);
    yLabels.push(
      <text
        key={`ylab-${g}`}
        x={pl - 11}
        y={y + 4}
        textAnchor="end"
        fontSize="11"
        fill={faintColor}
        fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
      >
        {vfmt(val)}
      </text>
    );
  }

  let areaD = '';
  for (let i = 0; i < n; i++) {
    const val = typeof cur[i] === 'number' && !isNaN(cur[i]) ? cur[i] : 0;
    areaD += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(val).toFixed(1) + ' ';
  }
  areaD += 'L' + X(n - 1).toFixed(1) + ' ' + base + ' L' + X(0).toFixed(1) + ' ' + base + ' Z';

  // Tooltip calculations for hovered index
  let tooltipNode: React.ReactNode = null;
  let hoverCrosshair: React.ReactNode = null;
  let hoverPoints: React.ReactNode = null;

  if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < n) {
    const hx = X(hoverIdx);
    const curVal = typeof cur[hoverIdx] === 'number' && !isNaN(cur[hoverIdx]) ? cur[hoverIdx] : 0;
    const hyCur = Y(curVal);
    const hasPrev = Boolean(prev && showPrev && prev.length === n && typeof prev[hoverIdx] === 'number' && !isNaN(prev[hoverIdx]));
    const prevVal = hasPrev && prev ? prev[hoverIdx] : null;
    const hyPrev = prevVal != null ? Y(prevVal) : null;
    const pointLabel = labels && labels[hoverIdx] ? labels[hoverIdx] : `Point ${hoverIdx + 1}`;

    let deltaStr: string | null = null;
    let deltaColor = 'var(--muted)';
    if (prevVal != null && prevVal > 0) {
      const deltaPct = ((curVal - prevVal) / prevVal) * 100;
      deltaStr = `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}%`;
      deltaColor = deltaPct > 0 ? 'var(--pos, #0f8a3d)' : deltaPct < 0 ? 'var(--neg, #b3402c)' : 'var(--muted)';
    }

    hoverCrosshair = (
      <line
        x1={hx.toFixed(1)}
        y1={pt}
        x2={hx.toFixed(1)}
        y2={base}
        stroke="var(--ink, #141413)"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        strokeOpacity="0.3"
      />
    );

    hoverPoints = (
      <g>
        {hasPrev && hyPrev != null && (
          <circle
            cx={hx.toFixed(1)}
            cy={hyPrev.toFixed(1)}
            r="4.5"
            fill="var(--surface, #ffffff)"
            stroke={lineColor}
            strokeWidth="2"
            strokeDasharray="2 2"
          />
        )}
        <circle
          cx={hx.toFixed(1)}
          cy={hyCur.toFixed(1)}
          r="8"
          fill={color}
          opacity="0.22"
        />
        <circle
          cx={hx.toFixed(1)}
          cy={hyCur.toFixed(1)}
          r="4.5"
          fill="var(--surface, #ffffff)"
          stroke={color}
          strokeWidth="2.5"
        />
      </g>
    );

    // Tooltip Box layout
    const cardW = hasPrev ? 174 : 144;
    const cardH = hasPrev ? 76 : 52;
    let cardX = hx + 12;
    if (cardX + cardW > W - 10) {
      cardX = hx - cardW - 12;
    }
    if (cardX < 10) {
      cardX = 10;
    }
    let cardY = Math.max(pt + 2, Math.min(base - cardH - 6, hyCur - cardH / 2));

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
          y={(cardY + 16).toFixed(1)}
          fontSize="11"
          fontWeight="600"
          fill="var(--ink, #141413)"
          fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
        >
          {pointLabel}
        </text>
        <circle
          cx={(cardX + 13).toFixed(1)}
          cy={(cardY + 33).toFixed(1)}
          r="3.5"
          fill={color}
        />
        <text
          x={(cardX + 22).toFixed(1)}
          y={(cardY + 37).toFixed(1)}
          fontSize="11"
          fill="var(--muted, #6f6e68)"
          fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
        >
          {curLabel}:
        </text>
        <text
          x={(cardX + cardW - 10).toFixed(1)}
          y={(cardY + 37).toFixed(1)}
          textAnchor="end"
          fontSize="11.5"
          fontWeight="600"
          fill="var(--ink, #141413)"
          fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
        >
          {vfmt(curVal)}
        </text>

        {hasPrev && prevVal != null && (
          <>
            <line
              x1={(cardX + 8).toFixed(1)}
              y1={(cardY + 46).toFixed(1)}
              x2={(cardX + cardW - 8).toFixed(1)}
              y2={(cardY + 46).toFixed(1)}
              stroke="var(--border, #e6e4de)"
              strokeDasharray="2 2"
            />
            <circle
              cx={(cardX + 13).toFixed(1)}
              cy={(cardY + 60).toFixed(1)}
              r="3.5"
              fill={lineColor}
            />
            <text
              x={(cardX + 22).toFixed(1)}
              y={(cardY + 64).toFixed(1)}
              fontSize="10.5"
              fill="var(--muted, #6f6e68)"
              fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
            >
              {prevLabel}: {vfmt(prevVal)}
            </text>
            {deltaStr && (
              <text
                x={(cardX + cardW - 10).toFixed(1)}
                y={(cardY + 64).toFixed(1)}
                textAnchor="end"
                fontSize="10.5"
                fontWeight="600"
                fill={deltaColor}
                fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
              >
                {deltaStr}
              </text>
            )}
          </>
        )}
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
      style={{ cursor: 'crosshair', userSelect: 'none' }}
    >
      {gridLines}
      {yLabels}
      {xLabels}
      <line x1={pl} y1={base} x2={W - pr} y2={base} stroke={gridColor} />
      <path d={areaD} fill={fill} />
      {prev && showPrev && prev.length === n && (
        <path
          d={path(prev)}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
      )}
      <path
        d={path(cur)}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {n > 0 && hoverIdx === null && (
        <circle
          cx={X(n - 1).toFixed(1)}
          cy={Y(typeof cur[n - 1] === 'number' ? cur[n - 1] : 0).toFixed(1)}
          r="3.5"
          fill={color}
        />
      )}
      {hoverCrosshair}
      {hoverPoints}
      {tooltipNode}
    </svg>
  );
};

