import React, { useEffect, useState } from 'react';
import { ChartCardShell } from './ChartCardShell';
import { incidentReportsAPI } from '@/services/incidentReportsAPI';
import { TicketsDashboardDateRange } from './types';
import humanBodyImg from '@/assets/human_body.png';

interface BodyInjuryChartCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

// ── Coordinate space ──────────────────────────────────────────────────────────
// viewBox="-200 0 1293 873"
//   • The PNG (893×873) sits at x=0, y=0 — coordinates below are in PNG pixels.
//   • The 200 px of negative-x space is label padding on the left side.
//   • The 200 px of extra right space (893 → 1093) is label padding on the right.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Callout slots on the figure. `aliases` are the normalized body-part names the
 * API may return for each slot — `/incident/body_injury_chart` returns whatever
 * parts have at least one incident (Head, Arms, Mouth, Skin, …), so names are
 * resolved onto these fixed anchors rather than assumed to match one-to-one.
 * Geometry here is unchanged from the original verified layout.
 */
const MARKER_SLOTS: {
  key: string;
  aliases: string[];
  dots: { cx: number; cy: number }[];
  linePath: string;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'end';
}[] = [
  {
    key: 'Head',
    aliases: ['head', 'skull', 'scalp', 'face', 'forehead', 'hair'],
    dots: [{ cx: 446, cy: 85 }],
    linePath: 'M 458 85 L 905 85 L 905 48',
    labelX: 912,
    labelY: 48,
    anchor: 'start',
  },
  {
    key: 'Eyes',
    aliases: ['eyes', 'eye', 'vision', 'ear', 'ears'],
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
    key: 'Mouth',
    aliases: ['mouth', 'tongue', 'lips', 'lip', 'teeth', 'jaw', 'chin', 'nose'],
    dots: [{ cx: 446, cy: 128 }],
    linePath: 'M 454 128 L 905 128',
    labelX: 912,
    labelY: 123,
    anchor: 'start',
  },
  {
    key: 'Neck',
    aliases: ['neck', 'throat', 'shoulder', 'shoulders'],
    dots: [{ cx: 446, cy: 175 }],
    linePath: 'M 438 175 L -12 175',
    labelX: -18,
    labelY: 170,
    anchor: 'end',
  },
  {
    key: 'Arms',
    aliases: ['arms', 'arm', 'hand', 'hands', 'elbow', 'elbows', 'wrist', 'wrists', 'finger', 'fingers'],
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
    aliases: ['legs', 'leg', 'knee', 'knees', 'foot', 'feet', 'ankle', 'ankles', 'thigh', 'thighs', 'toe', 'toes'],
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

const normalize = (name: string): string => name.toLowerCase().replace(/[^a-z]/g, '');

const getMarkerColor = (pct: number): string => {
  if (pct >= 20) return '#C72030';
  if (pct >= 10) return '#D97655';
  if (pct > 0) return '#E6B94A';
  return '#D1D5DB';
};

const formatPct = (pct: number): string => (pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(1)}%`);

interface PlacedMarker {
  slot: (typeof MARKER_SLOTS)[number];
  /** The API's own name for this part — shown on the figure, not the slot key. */
  label: string;
  pct: number;
}

/**
 * Matches each body part from the API onto a callout slot. Parts with no anatomical
 * anchor (e.g. "Skin", which is whole-body) and any second part competing for an
 * already-used slot fall through to `unplaced`, so nothing is silently dropped.
 */
const placeMarkers = (
  percentages: Record<string, number>
): { placed: PlacedMarker[]; unplaced: { label: string; pct: number }[] } => {
  const entries = Object.entries(percentages)
    .filter(([, pct]) => pct > 0)
    .sort((a, b) => b[1] - a[1]);

  const placed: PlacedMarker[] = [];
  const unplaced: { label: string; pct: number }[] = [];
  const usedSlots = new Set<string>();

  for (const [label, pct] of entries) {
    const name = normalize(label);
    const slot = MARKER_SLOTS.find((s) => !usedSlots.has(s.key) && s.aliases.includes(name));
    if (slot) {
      usedSlots.add(slot.key);
      placed.push({ slot, label, pct });
    } else {
      unplaced.push({ label, pct });
    }
  }

  return { placed, unplaced };
};

/**
 * Body Injury Map — the anatomical figure with leader-line callouts, driven by
 * `/incident/body_injury_chart`. Percentages are drawn on the figure itself.
 */
export const BodyInjuryChartCard: React.FC<BodyInjuryChartCardProps> = ({
  dateRange,
  className = '',
}) => {
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    incidentReportsAPI
      .getBodyInjuryChart({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (cancelled) return;
        // Failures arrive as 200 + success:0 (missing filters, image build failed),
        // so surface the server's message rather than a generic empty state.
        if (res.success !== 1 && Object.keys(res.percentages).length === 0) {
          setPercentages({});
          setError(res.message || 'Could not load the body injury chart.');
          return;
        }
        setPercentages(res.percentages);
      })
      .catch(() => {
        if (!cancelled) {
          setPercentages({});
          setError('Could not load the body injury chart.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  const { placed, unplaced } = placeMarkers(percentages);
  const hasData = placed.length > 0 || unplaced.length > 0;

  const tiles = [
    ...placed.map(({ label, pct }) => ({ label, pct, onMap: true })),
    ...unplaced.map(({ label, pct }) => ({ label, pct, onMap: false })),
  ].sort((a, b) => b.pct - a.pct);

  return (
    <ChartCardShell
      title="Body Injury Map"
      subtitle="Share of injuries by body part"
      loading={loading}
      error={error}
      className={className}
    >
      {!hasData ? (
        <div className="flex h-full min-h-40 items-center justify-center text-brand-body-5 text-brand-text-light">
          No injury data for the selected date range.
        </div>
      ) : (
        <div>
          <div className="flex justify-center">
            <svg
              viewBox="-200 0 1293 873"
              style={{ width: '100%', maxWidth: '600px' }}
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

              {placed.map(({ slot, label, pct }) => {
                const color = getMarkerColor(pct);

                return (
                  <g key={slot.key}>
                    <path
                      d={slot.linePath}
                      stroke={color}
                      strokeWidth="2.5"
                      fill="none"
                      opacity="0.8"
                      strokeDasharray="7 4"
                    />

                    {slot.dots.map((dot, i) => (
                      <g key={i}>
                        <circle cx={dot.cx} cy={dot.cy} r="26" fill={color} opacity="0.15" />
                        <circle
                          cx={dot.cx}
                          cy={dot.cy}
                          r="13"
                          fill={color}
                          stroke={color}
                          strokeWidth="2.5"
                        />
                        <circle cx={dot.cx} cy={dot.cy} r="5" fill="white" />
                      </g>
                    ))}

                    <text
                      textAnchor={slot.anchor}
                      style={{ fontFamily: 'Work Sans, sans-serif' }}
                    >
                      <tspan x={slot.labelX} y={slot.labelY} fontSize="24" fill="#6B7280">
                        {label}
                      </tspan>
                      <tspan x={slot.labelX} dy="36" fontSize="30" fontWeight="700" fill={color}>
                        {formatPct(pct)}
                      </tspan>
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Same figures as the callouts, listed as tiles. Parts with no anatomical
              anchor (e.g. "Skin") only appear here, so they're flagged as such. */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map(({ label, pct, onMap }) => (
              <div
                key={label}
                className="rounded-lg px-3 py-2.5 text-center"
                style={{ backgroundColor: '#F6F4EE' }}
              >
                <div className="truncate text-brand-body-5 text-brand-text-light">{label}</div>
                <div
                  className="mt-0.5 text-brand-body-4 font-bold tabular-nums"
                  style={{ color: getMarkerColor(pct) }}
                >
                  {formatPct(pct)}
                </div>
                {!onMap && (
                  <div className="mt-0.5 text-brand-caption text-brand-text-light">not on map</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCardShell>
  );
};

export default BodyInjuryChartCard;
