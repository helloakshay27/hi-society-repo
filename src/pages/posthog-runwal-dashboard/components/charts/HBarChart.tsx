import React, { useState } from 'react';
import { fmtC, pct } from '../../data/constants';

interface HBarChartProps {
  labels: string[];
  values: number[];
  color?: string;
  colorArr?: string[];
  maxLabelLength?: number;
}

export const HBarChart: React.FC<HBarChartProps> = ({
  labels,
  values,
  color = 'var(--blue)',
  colorArr,
  maxLabelLength = 26,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 720;
  const rowH = 28;
  const pr = 58;
  const pt = 6;
  const pb = 6;
  const n = labels.length;
  const H = pt + pb + n * rowH;
  const total = values.reduce((sum, v) => sum + (v || 0), 0) || 1;
  const mx = Math.max(...values) * 1.08 || 1;
  const labelW = 196;
  const chartW = W - pr - labelW - 14;

  const truncLabel = (s: string, max: number) => {
    s = String(s);
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  };

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      onMouseLeave={() => setHoverIdx(null)}
      style={{ userSelect: 'none' }}
    >
      {labels.map((lab, i) => {
        const y = pt + i * rowH;
        const bh = rowH * 0.62;
        const val = values[i] || 0;
        const w = Math.max(2, (val / mx) * chartW);
        const col = (colorArr && colorArr[i]) || color;
        const isHovered = hoverIdx === i;
        const sharePct = (val / total) * 100;

        return (
          <g
            key={i}
            onMouseEnter={() => setHoverIdx(i)}
            style={{ cursor: 'pointer' }}
          >
            {isHovered && (
              <rect
                x={4}
                y={y - 2}
                width={W - 8}
                height={rowH}
                fill="var(--blue, #2c7be5)"
                opacity="0.08"
                rx={4}
              />
            )}
            <text
              x={labelW}
              y={y + bh / 2 + 4}
              textAnchor="end"
              fontSize="11.5"
              fontWeight={isHovered ? '600' : '400'}
              fill={isHovered ? 'var(--ink)' : 'var(--ink-2)'}
              fontFamily="Inter, sans-serif"
            >
              <title>{lab}</title>
              {truncLabel(lab, maxLabelLength)}
            </text>
            <rect
              x={labelW + 10}
              y={y}
              width={w.toFixed(1)}
              height={bh.toFixed(1)}
              rx={4}
              fill={col}
              opacity={hoverIdx !== null && !isHovered ? 0.5 : 1}
              style={{ transition: 'opacity 0.15s ease' }}
            />
            <text
              x={labelW + 10 + w + 8}
              y={y + bh / 2 + 4}
              fontSize="11.5"
              fill={isHovered ? 'var(--ink)' : 'var(--ink-2)'}
              fontFamily="Inter, sans-serif"
              fontWeight={isHovered ? '600' : '500'}
            >
              {fmtC(val)}
              {isHovered && ` (${pct(sharePct, 1)})`}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

