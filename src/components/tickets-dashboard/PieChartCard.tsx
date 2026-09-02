import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartCardShell } from './ChartCardShell';

export interface PieChartSegment {
  name: string;
  value: number;
  color: string;
}

interface PieChartCardProps {
  title: string;
  subtitle?: string;
  segments: PieChartSegment[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  /** Overrides the donut center number (defaults to sum of segments). */
  centerValue?: string | number;
  /** Overrides the donut center caption (defaults to "Total"). */
  centerLabel?: string;
  /** Collapse smaller slices into "Others" when segment count exceeds this (pie + legend). */
  maxVisibleSegments?: number;
}

const OTHERS_COLOR = '#D3D1C7';

const collapsePieSegments = (
  segments: PieChartSegment[],
  maxVisible: number
): PieChartSegment[] => {
  if (segments.length <= maxVisible) return segments;

  const sorted = [...segments].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, maxVisible - 1);
  const rest = sorted.slice(maxVisible - 1);
  const othersValue = rest.reduce((sum, segment) => sum + segment.value, 0);
  if (othersValue <= 0) return top;

  return [...top, { name: 'Others', value: othersValue, color: OTHERS_COLOR }];
};

/** Generic donut chart card: donut with a centered total, and a legend on the right listing each segment's count + percentage. */
export const PieChartCard: React.FC<PieChartCardProps> = ({
  title,
  subtitle,
  segments,
  loading,
  emptyMessage = 'No data for the selected date range.',
  className,
  centerValue,
  centerLabel = 'Total',
  maxVisibleSegments,
}) => {
  const displaySegments = useMemo(
    () => (maxVisibleSegments ? collapsePieSegments(segments, maxVisibleSegments) : segments),
    [segments, maxVisibleSegments]
  );

  const total = displaySegments.reduce((sum, s) => sum + s.value, 0);
  const displayCenter = centerValue ?? total;

  return (
    <ChartCardShell
      title={title}
      subtitle={subtitle}
      loading={loading}
      className={className}
    >
      {total === 0 ? (
        <div className="flex h-48 items-center justify-center text-brand-body-5 text-brand-text-light">{emptyMessage}</div>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displaySegments}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={displaySegments.length > 6 ? 0 : 1}
                  stroke="none"
                >
                  {displaySegments.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-brand-h2 font-bold text-brand-text">{displayCenter}</span>
              <span className="text-brand-caption text-brand-text-light">{centerLabel}</span>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-1 flex-col justify-center space-y-3">
            {displaySegments.map((entry) => (
              <div key={entry.name} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ background: entry.color }}
                />
                <div className="min-w-0">
                  <p className="text-brand-body-5 font-medium leading-tight text-brand-text">{entry.name}</p>
                  <p className="mt-0.5 text-brand-body-4 font-semibold tabular-nums text-brand-text">
                    {entry.value} &middot; {((entry.value / total) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCardShell>
  );
};
