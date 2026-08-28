import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartCardShell, SampleDataBadge } from './ChartCardShell';

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
  isSample?: boolean;
  emptyMessage?: string;
  className?: string;
  /** Overrides the donut center number (defaults to sum of segments). */
  centerValue?: string | number;
  /** Overrides the donut center caption (defaults to "Total"). */
  centerLabel?: string;
}

/** Generic donut chart card: donut with a centered total, and a legend on the right listing each segment's count + percentage. */
export const PieChartCard: React.FC<PieChartCardProps> = ({
  title,
  subtitle,
  segments,
  loading,
  isSample,
  emptyMessage = 'No data for the selected date range.',
  className,
  centerValue,
  centerLabel = 'Total',
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const displayCenter = centerValue ?? total;

  return (
    <ChartCardShell
      title={title}
      subtitle={subtitle}
      loading={loading}
      rightSlot={isSample ? <SampleDataBadge /> : undefined}
      className={className}
    >
      {total === 0 ? (
        <div className="flex h-48 items-center justify-center text-brand-body-5 text-brand-text-light">{emptyMessage}</div>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative flex-shrink-0" style={{ width: 220, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segments} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={1} stroke="none">
                  {segments.map((entry) => (
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
          <div className="w-full space-y-3">
            {segments.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-brand-body-4">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                  <span className="text-brand-text">{entry.name}</span>
                </span>
                <span className="font-semibold text-brand-text">
                  {entry.value} &middot; {((entry.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCardShell>
  );
};
