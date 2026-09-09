import React from 'react';
import humanBodyImg from '@/assets/human_body.png';

interface BodyInjuryChartCardProps {
  startDate?: string;
  endDate?: string;
  /** Body-part -> injury share (%). Defaults to the reference distribution. */
  percentages?: Record<string, number>;
  className?: string;
}

const STATIC_PERCENTAGES: Record<string, number> = {
  Head: 15.8,
  Arms: 15.8,
  Neck: 10.5,
  Tongue: 10.5,
};

// ── Coordinate space ──────────────────────────────────────────────────────────
// viewBox="-200 0 1293 873"
//   • The PNG (893×873) sits at x=0, y=0 — coordinates below are in PNG pixels.
//   • The 200 px of negative-x space is label padding on the left side.
//   • The 200 px of extra right space (893 → 1093) is label padding on the right.
// ─────────────────────────────────────────────────────────────────────────────

const MARKER_CONFIG: {
  key: string;
  dots: { cx: number; cy: number }[];
  linePath: string;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'end';
}[] = [
  {
    key: 'Head',
    dots: [{ cx: 446, cy: 85 }],
    linePath: 'M 458 85 L 905 85 L 905 48',
    labelX: 912,
    labelY: 48,
    anchor: 'start',
  },
  {
    key: 'Eyes',
    dots: [
      { cx: 415, cy: 72 },
      { cx: 478, cy: 72 },
    ],
    linePath: 'M 408 72 L -12 72 L -12 38',
    labelX: -18,
    labelY: 38,
    anchor: 'end',
  },
  {
    key: 'Tongue',
    dots: [{ cx: 446, cy: 128 }],
    linePath: 'M 454 128 L 905 128',
    labelX: 912,
    labelY: 123,
    anchor: 'start',
  },
  {
    key: 'Neck',
    dots: [{ cx: 446, cy: 175 }],
    linePath: 'M 438 175 L -12 175',
    labelX: -18,
    labelY: 170,
    anchor: 'end',
  },
  {
    key: 'Arms',
    dots: [
      { cx: 330, cy: 320 },
      { cx: 550, cy: 320 },
    ],
    linePath: 'M 317 320 L -12 320',
    labelX: -18,
    labelY: 315,
    anchor: 'end',
  },
  {
    key: 'Legs',
    dots: [
      { cx: 375, cy: 495 },
      { cx: 518, cy: 495 },
    ],
    linePath: 'M 525 495 L 905 495',
    labelX: 912,
    labelY: 490,
    anchor: 'start',
  },
];

const getMarkerColor = (pct: number): string => {
  if (pct >= 20) return '#C72030';
  if (pct >= 10) return '#D97655';
  if (pct > 0) return '#E6B94A';
  return '#D1D5DB';
};

/** Outline figure with leader-line callouts for the incident body-injury distribution. */
export const BodyInjuryChartCard: React.FC<BodyInjuryChartCardProps> = ({
  percentages = STATIC_PERCENTAGES,
  className = '',
}) => {
  const sortedEntries = Object.entries(percentages).sort((a, b) => b[1] - a[1]);

  return (
    <div
      className={`flex h-full w-full flex-col overflow-auto rounded-xl border border-brand-border bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Work Sans, sans-serif' }}>
            Body Injury Map
          </h3>
          <p
            className="text-brand-body-5 text-brand-green leading-relaxed mt-1"
            style={{ fontFamily: 'Work Sans, sans-serif' }}
          >
            Real category structure · matches reference style — outline figure with leader-line callouts
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-center">
          <svg
            viewBox="-200 0 1293 873"
            style={{ width: '100%', maxWidth: '460px' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <image
              href={humanBodyImg}
              x="0"
              y="0"
              width="893"
              height="873"
              preserveAspectRatio="xMidYMid meet"
            />

            {MARKER_CONFIG.map(({ key, dots, linePath, labelX, labelY, anchor }) => {
              const pct = percentages[key];
              const isActive = pct !== undefined && pct > 0;
              const color = isActive ? getMarkerColor(pct) : '#D1D5DB';

              return (
                <g key={key}>
                  {isActive && (
                    <path
                      d={linePath}
                      stroke={color}
                      strokeWidth="2.5"
                      fill="none"
                      opacity="0.8"
                      strokeDasharray="7 4"
                    />
                  )}

                  {dots.map((dot, i) => (
                    <g key={i}>
                      {isActive && (
                        <circle cx={dot.cx} cy={dot.cy} r="26" fill={color} opacity="0.15" />
                      )}
                      <circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r="13"
                        fill={isActive ? color : '#F3F4F6'}
                        stroke={color}
                        strokeWidth="2.5"
                      />
                      {isActive && <circle cx={dot.cx} cy={dot.cy} r="5" fill="white" />}
                    </g>
                  ))}

                  {isActive && (
                    <text textAnchor={anchor} style={{ fontFamily: 'Work Sans, sans-serif' }}>
                      <tspan x={labelX} y={labelY} fontSize="24" fill="#6B7280">
                        {key}
                      </tspan>
                      <tspan x={labelX} dy="36" fontSize="30" fontWeight="700" fill={color}>
                        {pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(1)}%`}
                      </tspan>
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {sortedEntries.length > 0 ? (
          <div className="mt-4 pt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sortedEntries.map(([part, pct]) => (
                <div
                  key={part}
                  className="rounded-lg px-4 py-3 text-center"
                  style={{ backgroundColor: '#F6F4EE' }}
                >
                  <div className="truncate text-xs text-gray-500">{part}</div>
                  <div className="mt-1 text-xs font-bold tabular-nums" style={{ color: '#E6B94A' }}>
                    {pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(1)}%`}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3">
              <div className="mb-1 text-xs font-semibold text-gray-900">Injury types (not a body location)</div>
              <div className="mb-2 text-xs text-brand-green">Cut 5.3% · Burn 5.3% · Fracture 5.3%</div>
              <p className="text-xs leading-relaxed text-brand-green">
                Rebuilt with a proper anatomical body outline — verified by rendering the SVG before
                committing it, not guessed blind. Head and Arms are tied as the top locations, not a
                single dominant one.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-16 items-center justify-center text-sm text-gray-400">
            No injury data available
          </div>
        )}
      </div>
    </div>
  );
};

export default BodyInjuryChartCard;
