import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { ChartCardShell, SampleDataBadge } from './ChartCardShell';

export interface BarChartSeries {
  dataKey: string;
  name: string;
  color: string;
  stackId?: string;
}

interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number>>;
  categoryKey?: string;
  series: BarChartSeries[];
  /** When set, colors each bar of a single-series chart from `entry[colorKey]` instead of the series' flat color. */
  colorKey?: string;
  /** 'horizontal' = bars extend sideways with categories on the Y axis (used for category comparisons). */
  orientation?: 'horizontal' | 'vertical';
  loading?: boolean;
  isSample?: boolean;
  insight?: string;
  emptyMessage?: string;
  className?: string;
}

/** Generic bar chart card, used for every category/vendor/mode comparison on the Tickets Dashboard. */
export const BarChartCard: React.FC<BarChartCardProps> = ({
  title,
  subtitle,
  data,
  categoryKey = 'category',
  series,
  colorKey,
  orientation = 'horizontal',
  loading,
  isSample,
  insight,
  emptyMessage = 'No data for the selected date range.',
  className,
}) => {
  const isHorizontal = orientation === 'horizontal';
  const chartHeight = isHorizontal ? Math.max(240, data.length * 34 + 40) : 300;

  return (
    <ChartCardShell
      title={title}
      subtitle={subtitle}
      loading={loading}
      rightSlot={isSample ? <SampleDataBadge /> : undefined}
      className={className}
    >
      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-brand-body-5 text-brand-text-light">{emptyMessage}</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout={isHorizontal ? 'vertical' : 'horizontal'}
              margin={isHorizontal ? { top: 8, right: 24, left: 8, bottom: 8 } : { top: 8, right: 16, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              {isHorizontal ? (
                <>
                  <XAxis type="number" tick={{ fill: '#2C2C2C', fontSize: 11 }} />
                  <YAxis dataKey={categoryKey} type="category" width={120} tick={{ fill: '#2C2C2C', fontSize: 11 }} />
                </>
              ) : (
                <>
                  <XAxis dataKey={categoryKey} angle={-40} textAnchor="end" height={70} tick={{ fill: '#2C2C2C', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#2C2C2C', fontSize: 11 }} />
                </>
              )}
              <Tooltip />
              {series.length > 1 && <Legend />}
              {series.map((s, i) => (
                <Bar
                  key={s.dataKey}
                  dataKey={s.dataKey}
                  name={s.name}
                  stackId={s.stackId}
                  fill={s.color}
                  radius={i === series.length - 1 ? (isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]) : undefined}
                >
                  {colorKey &&
                    data.map((entry, idx) => <Cell key={idx} fill={String(entry[colorKey] ?? s.color)} />)}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          {insight && <p className="mt-3 text-brand-body-5 italic text-brand-green">{insight}</p>}
        </>
      )}
    </ChartCardShell>
  );
};
