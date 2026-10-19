import React, { useState, useRef } from "react";
import { fmtC, truncLabel, getChartPalette } from "../utils/rng";

/* =========================================================================
   1. LineChart with smooth pointer tracking, crosshairs, and floating tooltip
   ========================================================================= */

interface LineChartProps {
  cur: number[];
  prev?: number[] | null;
  labels?: string[];
  color?: string;
  fill?: string;
  pctScale?: boolean;
  theme?: "light" | "dark";
  showPrev?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  cur,
  prev,
  labels,
  color,
  fill,
  pctScale = false,
  theme = "light",
  showPrev = true,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const palette = getChartPalette(theme);
  const lineColor = color || palette.blue;
  const areaFill = fill || palette.fill;

  const W = 680;
  const H = 250;
  const pl = pctScale ? 54 : 44;
  const pr = 14;
  const pt = 16;
  const pb = 30;

  if (!cur || cur.length === 0) {
    return (
      <div
        style={{
          height: H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sub, #64748b)',
          fontSize: '13px'
        }}
      >
        No data recorded for this period
      </div>
    );
  }

  const all = cur.concat(prev && showPrev ? prev : []);
  const minVal = all.length > 0 ? Math.min(...all) : 0;
  const maxVal = all.length > 0 ? Math.max(...all) : 0;
  const mn = pctScale ? Math.max(0, minVal - 0.6) : 0;
  const mx = pctScale
    ? Math.min(100, maxVal + 0.6)
    : (maxVal * 1.14 || 1);
  const span = mx - mn || 1;

  const n = cur.length;
  const xw = (W - pl - pr) / (n - 1 || 1);
  const X = (i: number) => pl + i * xw;
  const Y = (v: number) => pt + (H - pt - pb) * (1 - (v - mn) / span);
  const base = H - pb;

  const vfmt = pctScale ? (v: number) => v.toFixed(1) + "%" : fmtC;

  function path(arr: number[]) {
    let d = "";
    for (let i = 0; i < arr.length; i++) {
      d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(arr[i]).toFixed(1) + " ";
    }
    return d;
  }

  const step = Math.max(1, Math.ceil(n / 6));

  // Area path
  let areaD = "";
  for (let i = 0; i < n; i++) {
    areaD +=
      (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(cur[i]).toFixed(1) + " ";
  }
  areaD += `L${X(n - 1).toFixed(1)} ${base} L${X(0).toFixed(1)} ${base} Z`;

  // Pointer move handler on SVG
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || n <= 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let idx = Math.round((svgX - pl) / (xw || 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
  };

  const handlePointerLeave = () => {
    setHoverIdx(null);
  };

  // Delta calculation for hovered point
  let deltaStr: string | null = null;
  let isUp = true;
  if (hoverIdx !== null && prev && showPrev && prev[hoverIdx] !== undefined) {
    const curV = cur[hoverIdx];
    const prevV = prev[hoverIdx];
    if (prevV > 0) {
      const diff = ((curV - prevV) / prevV) * 100;
      isUp = diff >= 0;
      deltaStr = `${isUp ? "+" : ""}${diff.toFixed(1)}% vs prev`;
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <svg
        ref={svgRef}
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ cursor: "crosshair", display: "block" }}
      >
        {/* Grid lines and X labels */}
        {Array.from({ length: n }).map((_, i) => {
          if (i % step !== 0) return null;
          return (
            <React.Fragment key={`grid-${i}`}>
              <line
                x1={X(i).toFixed(1)}
                y1={pt}
                x2={X(i).toFixed(1)}
                y2={base}
                stroke={palette.grid}
                strokeDasharray="2 4"
              />
              <text
                x={X(i).toFixed(1)}
                y={H - 9}
                textAnchor="middle"
                fontSize="11"
                fill={palette.faint}
                fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
              >
                {labels ? labels[i] : i + 1}
              </text>
            </React.Fragment>
          );
        })}

        {/* Y Axis labels */}
        {[0, 1, 2].map((g) => {
          const y = pt + ((H - pt - pb) * g) / 2;
          const val = mn + span * (1 - g / 2);
          return (
            <text
              key={`y-${g}`}
              x={pl - 11}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill={palette.faint}
              fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
            >
              {vfmt(val)}
            </text>
          );
        })}

        {/* Base line */}
        <line x1={pl} y1={base} x2={W - pr} y2={base} stroke={palette.grid} />

        {/* Area fill */}
        <path d={areaD} fill={areaFill} opacity={0.7} />

        {/* Previous period line */}
        {prev && showPrev && (
          <path
            d={path(prev)}
            fill="none"
            stroke={palette.line}
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />
        )}

        {/* Current period line */}
        <path
          d={path(cur)}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End circle */}
        <circle
          cx={X(n - 1).toFixed(1)}
          cy={Y(cur[n - 1]).toFixed(1)}
          r="3.5"
          fill={lineColor}
        />

        {/* Hover Crosshair & Dots */}
        {hoverIdx !== null && (
          <g>
            {/* Vertical crosshair */}
            <line
              x1={X(hoverIdx).toFixed(1)}
              y1={pt}
              x2={X(hoverIdx).toFixed(1)}
              y2={base}
              stroke={palette.ink}
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity={0.4}
            />

            {/* Previous point dot */}
            {prev && showPrev && prev[hoverIdx] !== undefined && (
              <circle
                cx={X(hoverIdx).toFixed(1)}
                cy={Y(prev[hoverIdx]).toFixed(1)}
                r="4"
                fill={palette.line}
                stroke={palette.onHeat}
                strokeWidth="1.5"
              />
            )}

            {/* Current point highlighted dot with halo */}
            <circle
              cx={X(hoverIdx).toFixed(1)}
              cy={Y(cur[hoverIdx]).toFixed(1)}
              r="7"
              fill={lineColor}
              opacity={0.25}
            />
            <circle
              cx={X(hoverIdx).toFixed(1)}
              cy={Y(cur[hoverIdx]).toFixed(1)}
              r="4.5"
              fill={lineColor}
              stroke={palette.onHeat}
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* Floating Interactive Tooltip */}
      {hoverIdx !== null && (
        <div
          style={{
            position: "absolute",
            left: `${Math.min(90, Math.max(10, (X(hoverIdx) / W) * 100)).toFixed(1)}%`,
            top: "4px",
            transform: "translateX(-50%)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm, 8px)",
            padding: "7px 11px",
            boxShadow: "var(--shadow-pop)",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 30,
            whiteSpace: "nowrap",
            lineHeight: 1.45,
            minWidth: "130px",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: "var(--ink)",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "3px",
              marginBottom: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{labels ? labels[hoverIdx] : `Point ${hoverIdx + 1}`}</span>
            {deltaStr && (
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: isUp ? "var(--pos)" : "var(--neg)",
                  background: isUp ? "var(--green-tint)" : "var(--red-tint)",
                  padding: "1px 5px",
                  borderRadius: "10px",
                }}
              >
                {deltaStr}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--ink)",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: lineColor,
                display: "inline-block",
              }}
            />
            <span>Current:</span>
            <span style={{ fontWeight: 600, marginLeft: "auto" }}>
              {vfmt(cur[hoverIdx])}
            </span>
          </div>

          {prev && showPrev && prev[hoverIdx] !== undefined && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--muted)",
                fontSize: "11px",
                marginTop: "2px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "2px",
                  background: palette.line,
                  display: "inline-block",
                }}
              />
              <span>Previous:</span>
              <span style={{ marginLeft: "auto" }}>{vfmt(prev[hoverIdx])}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   2. HBarChart with interactive hover highlighting and floating tooltip
   ========================================================================= */

interface HBarChartProps {
  labels: string[];
  values: number[];
  color?: string;
  colorArr?: string[];
  theme?: "light" | "dark";
}

export const HBarChart: React.FC<HBarChartProps> = ({
  labels,
  values,
  color,
  colorArr,
  theme = "light",
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const palette = getChartPalette(theme);

  const W = 720;
  const rowH = 28;
  const pr = 58;
  const pt = 6;
  const pb = 6;
  const n = labels ? labels.length : 0;

  if (!labels || labels.length === 0 || !values || values.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--sub, #64748b)',
          fontSize: '13px'
        }}
      >
        No data available for the selected filters
      </div>
    );
  }

  const H = pt + pb + n * rowH;
  const total = values.reduce((sum, v) => sum + v, 0) || 1;
  const mx = (values.length > 0 ? Math.max(...values) : 0) * 1.08 || 1;
  const labelW = 196;
  const chartW = W - pr - labelW - 14;

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`}>
        {labels.map((lab, i) => {
          const y = pt + i * rowH;
          const bh = rowH * 0.62;
          const w = Math.max(2, (values[i] / mx) * chartW);
          const col = (colorArr && colorArr[i]) || color || palette.blue;
          const isHovered = hoverIdx === i;

          return (
            <g
              key={`hbar-${i}`}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Row hover background indicator */}
              {isHovered && (
                <rect
                  x="0"
                  y={y - 2}
                  width={W}
                  height={rowH}
                  fill="var(--surface-2)"
                  rx="4"
                  opacity={0.6}
                />
              )}

              {/* Label */}
              <text
                x={labelW}
                y={y + bh / 2 + 4}
                textAnchor="end"
                fontSize="11.5"
                fill={isHovered ? palette.ink : palette.ink}
                fontWeight={isHovered ? "600" : "400"}
                fontFamily="Inter, sans-serif"
              >
                {truncLabel(lab, 26)}
              </text>

              {/* Bar */}
              <rect
                x={labelW + 10}
                y={y}
                width={w.toFixed(1)}
                height={bh.toFixed(1)}
                rx={4}
                fill={col}
                opacity={isHovered ? 1 : 0.88}
                style={{
                  transition: "opacity 0.15s, transform 0.15s",
                  filter: isHovered ? "brightness(1.08)" : "none",
                }}
              />

              {/* Value Text */}
              <text
                x={labelW + 10 + w + 8}
                y={y + bh / 2 + 4}
                fontSize="11.5"
                fill={palette.ink}
                fontFamily="Inter, sans-serif"
                fontWeight="500"
              >
                {fmtC(values[i])}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoverIdx !== null && (
        <div
          style={{
            position: "absolute",
            left: `${labelW + 30}px`,
            top: `${pt + hoverIdx * rowH - 6}px`,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xs, 6px)",
            padding: "5px 9px",
            boxShadow: "var(--shadow-pop)",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 30,
            whiteSpace: "nowrap",
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>
            {labels[hoverIdx]}
          </div>
          <div style={{ color: "var(--muted)", fontSize: "11px" }}>
            Count:{" "}
            <b style={{ color: "var(--ink)" }}>
              {values[hoverIdx].toLocaleString()}
            </b>{" "}
            &middot; {((values[hoverIdx] / total) * 100).toFixed(1)}% of total
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3. StackedBarChart (Growth Accounting) with interactive week hover tooltip
   ========================================================================= */

interface StackedBarSeries {
  label: string;
  data: number[];
  color: string;
}

interface StackedBarChartProps {
  labels: string[];
  series: StackedBarSeries[];
  negSeries?: StackedBarSeries;
  theme?: "light" | "dark";
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  labels,
  series,
  negSeries,
  theme = "light",
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const palette = getChartPalette(theme);
  const W = 600;
  const H = 260;
  const pl = 40;
  const pr = 12;
  const pt = 14;
  const pb = 26;

  if (!labels || labels.length === 0 || !series || series.length === 0) {
    return (
      <div
        style={{
          height: H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sub, #64748b)',
          fontSize: '13px'
        }}
      >
        No growth data available for the selected period
      </div>
    );
  }

  const n = labels.length;
  const maxUp =
    Math.max(
      0,
      ...labels.map((_, i) => series.reduce((a, s) => a + (s.data[i] || 0), 0))
    ) || 1;
  const maxDn =
    negSeries && negSeries.data && negSeries.data.length > 0
      ? Math.max(0, ...negSeries.data)
      : 0;
  const gap = (W - pl - pr) / (n || 1);
  const bw = gap * 0.52;
  const zero = pt + (H - pt - pb) * (maxUp / (maxUp + maxDn || 1));
  const scaleUp = (zero - pt) / (maxUp || 1);
  const scaleDn = (H - pb - zero) / (maxDn || 1);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || n <= 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let idx = Math.floor((svgX - pl) / (gap || 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
  };

  const handlePointerLeave = () => {
    setHoverIdx(null);
  };

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <svg
        ref={svgRef}
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ cursor: "pointer", display: "block" }}
      >
        {/* Hover column background highlight */}
        {hoverIdx !== null && (
          <rect
            x={pl + hoverIdx * gap}
            y={pt}
            width={gap}
            height={H - pt - pb + 4}
            fill="var(--surface-2)"
            rx="6"
            opacity={0.65}
          />
        )}

        {labels.map((lab, i) => {
          const x = pl + i * gap + (gap - bw) / 2;
          let y = zero;
          const isHovered = hoverIdx === i;

          return (
            <g key={`bar-group-${i}`}>
              {series.map((s, si) => {
                const h = s.data[i] * scaleUp;
                y -= h;
                return (
                  <rect
                    key={`bar-${i}-${si}`}
                    x={x.toFixed(1)}
                    y={y.toFixed(1)}
                    width={bw.toFixed(1)}
                    height={Math.max(0, h).toFixed(1)}
                    fill={s.color}
                    opacity={hoverIdx === null || isHovered ? 1 : 0.6}
                    stroke={isHovered ? palette.ink : "none"}
                    strokeWidth={isHovered ? 1 : 0}
                  />
                );
              })}
              {negSeries && (
                <rect
                  x={x.toFixed(1)}
                  y={zero.toFixed(1)}
                  width={bw.toFixed(1)}
                  height={Math.max(0, negSeries.data[i] * scaleDn).toFixed(1)}
                  fill={negSeries.color}
                  opacity={hoverIdx === null || isHovered ? 1 : 0.6}
                  stroke={isHovered ? palette.ink : "none"}
                  strokeWidth={isHovered ? 1 : 0}
                />
              )}
              <text
                x={x + bw / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize="11"
                fill={isHovered ? palette.ink : palette.faint}
                fontWeight={isHovered ? "600" : "400"}
                fontFamily="Inter, -apple-system, Segoe UI, sans-serif"
              >
                {lab}
              </text>
            </g>
          );
        })}

        {/* Zero baseline */}
        <line
          x1={pl}
          y1={zero.toFixed(1)}
          x2={W - pr}
          y2={zero.toFixed(1)}
          stroke={palette.line}
          strokeWidth="1.5"
        />
      </svg>

      {/* Floating Tooltip for Stacked Bar */}
      {hoverIdx !== null && (
        <div
          style={{
            position: "absolute",
            left: `${Math.min(85, Math.max(15, ((pl + hoverIdx * gap + gap / 2) / W) * 100)).toFixed(1)}%`,
            top: "4px",
            transform: "translateX(-50%)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm, 8px)",
            padding: "7px 11px",
            boxShadow: "var(--shadow-pop)",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 30,
            whiteSpace: "nowrap",
            lineHeight: 1.45,
            minWidth: "140px",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: "var(--ink)",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "3px",
              marginBottom: "4px",
            }}
          >
            {labels[hoverIdx]} &middot; Growth Accounting
          </div>

          {series.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11.5px",
                color: "var(--ink)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  background: s.color,
                  display: "inline-block",
                }}
              />
              <span>{s.label}:</span>
              <span style={{ fontWeight: 600, marginLeft: "auto" }}>
                +{s.data[hoverIdx].toLocaleString()}
              </span>
            </div>
          ))}

          {negSeries && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11.5px",
                color: "var(--neg)",
                marginTop: "1px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  background: negSeries.color,
                  display: "inline-block",
                }}
              />
              <span>{negSeries.label}:</span>
              <span style={{ fontWeight: 600, marginLeft: "auto" }}>
                -{negSeries.data[hoverIdx].toLocaleString()}
              </span>
            </div>
          )}

          <div
            style={{
              borderTop: "1px solid var(--border)",
              marginTop: "4px",
              paddingTop: "3px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            <span>Net Growth:</span>
            <span style={{ color: "var(--pos)" }}>
              +
              {(
                series.reduce((sum, s) => sum + s.data[hoverIdx], 0) -
                (negSeries ? negSeries.data[hoverIdx] : 0)
              ).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   4. RetentionCohortTable with interactive cell hover and floating details
   ========================================================================= */

interface RetentionCohortTableProps {
  dates: string[];
  matrix: (number | null)[][];
  theme?: "light" | "dark";
}

export const RetentionCohortTable: React.FC<RetentionCohortTableProps> = ({
  dates,
  matrix,
  theme = "light",
}) => {
  const [hoverCell, setHoverCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const palette = getChartPalette(theme);

  if (!dates || dates.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--sub, #64748b)',
          fontSize: '13px'
        }}
      >
        No cohort retention data available for the selected filters
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <table className="rt">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Cohort</th>
            {Array.from({ length: 6 }).map((_, w) => (
              <th key={`head-w-${w}`}>Week {w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((dt, i) => (
            <tr key={`row-${dt}`}>
              <td className="lbl">{dt}</td>
              {Array.from({ length: 6 }).map((_, w) => {
                const val = matrix[i] ? matrix[i][w] : null;
                const isHovered = hoverCell?.row === i && hoverCell?.col === w;

                if (val === null || val === undefined) {
                  return (
                    <td
                      key={`cell-${i}-${w}`}
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--faint)",
                      }}
                    >
                      ·
                    </td>
                  );
                }

                const t = val / 100;
                const bg = `rgba(${palette.heatRgb}, ${(palette.heatA0 + t * palette.heatA1).toFixed(2)})`;
                const col = t > 0.55 ? palette.onHeat : "var(--ink)";

                return (
                  <td
                    key={`cell-${i}-${w}`}
                    onMouseEnter={() => setHoverCell({ row: i, col: w })}
                    onMouseLeave={() => setHoverCell(null)}
                    style={{
                      background: bg,
                      color: col,
                      cursor: "pointer",
                      transform: isHovered ? "scale(1.08)" : "none",
                      outline: isHovered ? "2px solid var(--ink)" : "none",
                      boxShadow: isHovered ? "var(--shadow-pop)" : "none",
                      zIndex: isHovered ? 10 : 1,
                      position: "relative",
                      transition: "transform 0.1s ease",
                    }}
                  >
                    {val}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Floating Tooltip for Retention Cohort Cell */}
      {hoverCell !== null &&
        matrix[hoverCell.row]?.[hoverCell.col] !== null && (
          <div
            style={{
              position: "absolute",
              bottom: "6px",
              right: "8px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-xs, 6px)",
              padding: "5px 9px",
              boxShadow: "var(--shadow-pop)",
              fontSize: "12px",
              pointerEvents: "none",
              zIndex: 30,
              whiteSpace: "nowrap",
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--ink)" }}>
              Cohort: {dates[hoverCell.row]} &middot; Week {hoverCell.col}
            </div>
            <div style={{ color: "var(--muted)", fontSize: "11px" }}>
              Retention:{" "}
              <b style={{ color: "var(--ink)" }}>
                {matrix[hoverCell.row][hoverCell.col]}%
              </b>{" "}
              of cohort still active after {hoverCell.col * 7}–
              {(hoverCell.col + 1) * 7} days
            </div>
          </div>
        )}
    </div>
  );
};

/* =========================================================================
   5. FunnelChart with interactive step hover and drop-off tooltips
   ========================================================================= */

interface FunnelChartProps {
  steps: string[];
  theme?: "light" | "dark";
  drops: (number | null)[];
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  steps,
  drops,
  theme = "light",
}) => {
  const [hoverStep, setHoverStep] = useState<number | null>(null);
  const palette = getChartPalette(theme);

  if (!steps || steps.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--sub, #64748b)',
          fontSize: '13px'
        }}
      >
        No funnel steps configured for this workflow
      </div>
    );
  }

  const n = steps.length;
  const start = 100;

  return (
    <div className="funnel" style={{ position: "relative" }}>
      {steps.map((step, i) => {
        const pct2 = Math.round(start - i * ((start * 0.55) / (n - 1 || 1)));
        const width = 45 + (pct2 / 100) * 55;
        const drop = drops[i];
        const isHovered = hoverStep === i;

        return (
          <React.Fragment key={`funnel-step-${i}`}>
            {i > 0 && drop !== null && (
              <div
                className="fdrop"
                style={{
                  cursor: "pointer",
                  fontWeight: isHovered ? 600 : 400,
                }}
                onMouseEnter={() => setHoverStep(i)}
                onMouseLeave={() => setHoverStep(null)}
              >
                ▼ {drop}% drop-off from previous step
              </div>
            )}
            <div
              className="fstep"
              onMouseEnter={() => setHoverStep(i)}
              onMouseLeave={() => setHoverStep(null)}
              style={{
                width: `${width}%`,
                background: palette.blue,
                opacity: isHovered ? 1 : 1 - i * 0.1,
                borderRadius: "8px",
                cursor: "pointer",
                transform: isHovered ? "translateY(-2px)" : "none",
                boxShadow: isHovered
                  ? "0 4px 16px rgba(44,123,229,0.3)"
                  : "none",
                transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
              }}
              title={`${step}: ${pct2}% of entrants remain`}
            >
              {step}
              <span className="fsub">
                {pct2}% of initial entrants remain
                {drop !== null ? ` (lost ${drop}%)` : " (start of funnel)"}
              </span>
            </div>
          </React.Fragment>
        );
      })}

      {/* Floating Tooltip for Hovered Funnel Step */}
      {hoverStep !== null && (
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "8px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm, 8px)",
            padding: "7px 11px",
            boxShadow: "var(--shadow-pop)",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 30,
            whiteSpace: "nowrap",
            lineHeight: 1.45,
            minWidth: "150px",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>
            Step {hoverStep + 1}: {steps[hoverStep]}
          </div>
          <div
            style={{
              color: "var(--blue)",
              fontWeight: 500,
              fontSize: "11.5px",
            }}
          >
            {Math.round(start - hoverStep * ((start * 0.55) / (n - 1 || 1)))}%
            of entrants reached this step
          </div>
          {hoverStep > 0 && drops[hoverStep] !== null && (
            <div
              style={{
                color: "var(--neg)",
                fontSize: "11px",
                marginTop: "2px",
              }}
            >
              ▼ {drops[hoverStep]}% abandoned before reaching here
            </div>
          )}
        </div>
      )}
    </div>
  );
};
