import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Sparkles, ArrowRight } from 'lucide-react';
import { CD } from './LoyaltyDashboardData';
import '@/styles/theme.css';

Chart.register(...registerables);

const chartColorCache = new Map<string, string>();

function resolveChartColor(color: string): string {
  if (!color || !color.includes('var(')) return color;
  const cached = chartColorCache.get(color);
  if (cached) return cached;

  const probe = document.createElement('span');
  probe.style.color = color;
  const themeRoot = document.querySelector('.loyalty-dashboard-theme') ?? document.body;
  themeRoot.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  chartColorCache.set(color, resolved);
  return resolved;
}

function resolveChartColors(value: string | string[] | undefined): string | string[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value.map(resolveChartColor) : resolveChartColor(value);
}

/** Business Genie AI Insight briefing header */
export const Briefing = ({ label, text, icon }: { label: string; text: React.ReactNode; icon?: React.ReactNode }) => (
  <div
    className="relative rounded-[14px] p-[14px_16px_14px_48px] mb-3 overflow-hidden"
    style={{
      background: 'linear-gradient(135deg, #F4F1FE 0%, #EEEBFF 46%, #F6F4FF 100%)',
      border: '1px solid rgba(90, 75, 224, 0.20)',
    }}
  >
    <div
      className="absolute left-3.5 top-3.5 w-[26px] h-[26px] rounded-[8px] text-white flex items-center justify-center shadow-sm"
      style={{ background: 'linear-gradient(135deg, #5A4BE0 0%, #6B5AE8 52%, #7B6BF0 100%)' }}
    >
      <Sparkles className="w-3.5 h-3.5" />
    </div>
    <div className="relative z-10">
      <div className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase text-[#4839C4] bg-[rgba(90,75,224,0.10)] mb-1">
        {label}
      </div>
      <div
        className="text-[12px] text-[rgba(26,26,24,0.68)] leading-relaxed [&>strong]:text-[#1A1A18] [&>strong]:font-semibold"
        dangerouslySetInnerHTML={{ __html: text as string }}
      />
    </div>
  </div>
);

/** Stat KPI card — matching Business Genie .stat (.card fill #F5F4F0, rounded-16, borderless) */
export const KpiStripCard = ({ title, value, sub, barWidth, barColor, valueColor, onClick, icon }: any) => (
  <div
    onClick={onClick}
    className="bg-[#F5F4F0] rounded-[16px] p-[16px_18px] cursor-pointer transition-all duration-150 hover:bg-[#EFEDE6] flex flex-col justify-between border-0 shadow-none relative"
  >
    <div>
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="text-[11.5px] font-medium text-[rgba(26,26,24,0.68)]">{title}</div>
        {icon && (
          <div className="w-[34px] h-[34px] rounded-[10px] bg-white text-[#1A1A18] flex items-center justify-center shrink-0 shadow-none">
            {icon}
          </div>
        )}
      </div>
      <div className={`text-[24px] font-semibold leading-tight tracking-tight ${valueColor || 'text-[#1A1A18]'}`}>{value}</div>
    </div>
    <div className="mt-2">
      {barWidth !== undefined && (
        <div className="h-[5px] bg-white rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: barColor || '#1A1A18' }} />
        </div>
      )}
      <div className="text-[11px] text-[rgba(26,26,24,0.48)]" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  </div>
);

export const KpiCard = KpiStripCard;

/** Module overview card — grey fill, pill badges */
export const ModuleCard = ({ title, value, sub, chips, onClick }: any) => {
  return (
    <div
      onClick={onClick}
      className="bg-[#F5F4F0] rounded-[16px] p-4 cursor-pointer transition-all duration-150 hover:bg-[#EFEDE6] flex flex-col justify-between border-0 shadow-none relative"
    >
      <div>
        <div className="text-[11px] font-semibold text-[rgba(26,26,24,0.48)] uppercase tracking-wider mb-1">{title}</div>
        <div className="text-[22px] font-semibold text-[#1A1A18] leading-tight">{value}</div>
        <div className="text-[11px] text-[rgba(26,26,24,0.68)] mt-1" dangerouslySetInnerHTML={{ __html: sub }}></div>
      </div>
      {chips && chips.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-3">
          {chips.map((c: any, i: number) => {
            const chipClassMap: Record<string, string> = {
              'chip-ok': 'bg-[#E0F7EA] text-[#0B7A3B]',
              'chip-warn': 'bg-[#FFF2D6] text-[#8A5B00]',
              'chip-err': 'bg-[#FDEDED] text-[#A32126]',
              'chip-info': 'bg-[rgba(90,75,224,0.10)] text-[#4839C4]',
              'chip-muted': 'bg-[rgba(26,26,24,0.06)] text-[rgba(26,26,24,0.68)]',
            };
            return (
              <span key={i} className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${chipClassMap[c.type] || chipClassMap['chip-muted']}`}>
                {c.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ChartViewer = ({ id, activeType, chartDataOverride }: { id: string; activeType: string; chartDataOverride?: any }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const c = chartDataOverride || CD[id];
    if (!c) return;
    const ct = activeType || c.def;
    if (ct === 'tbl') return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const isDo = ct === 'doughnut';
    const isLine = ct === 'line';

    let datasets;
    if (c.multi) {
      datasets = c.datasets.map((d: any) => ({
        label: d.label,
        data: d.data,
        backgroundColor: resolveChartColors(d.bg),
        borderColor: d.bc ? resolveChartColors(d.bc) : undefined,
        hoverBackgroundColor: resolveChartColors(d.bc || d.bg),
        fill: d.fill || false,
        tension: d.tension || (isLine ? 0.35 : 0),
        pointRadius: isLine ? (d.pr !== undefined && d.pr > 0 ? d.pr : 4) : 0,
        pointHoverRadius: isLine ? 6 : 0,
        pointBackgroundColor: resolveChartColor(d.bc || d.bg || '#5A4BE0'),
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: isLine ? 1.5 : 0,
        pointHoverBackgroundColor: resolveChartColor('#5A4BE0'),
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2,
        borderWidth: isLine ? 2.5 : 0,
        borderRadius: ct === 'bar' ? 5 : 0,
        borderDash: d.dash,
      }));
    } else {
      datasets = [
        {
          label: c.label || '',
          data: c.values,
          backgroundColor: isLine ? 'rgba(90, 75, 224, 0.12)' : resolveChartColors(c.colors),
          borderColor: isLine ? resolveChartColor(c.colors?.[0] || '#5A4BE0') : isDo ? '#FFFFFF' : undefined,
          hoverBackgroundColor: isLine ? 'rgba(90, 75, 224, 0.20)' : resolveChartColors(c.colors),
          borderWidth: isDo ? 2 : isLine ? 2.5 : 0,
          borderRadius: ct === 'bar' ? 5 : 0,
          fill: isLine,
          tension: isLine ? 0.35 : 0,
          pointRadius: isLine ? 4 : 0,
          pointHoverRadius: isLine ? 6 : 0,
          pointBackgroundColor: isLine ? resolveChartColor(c.colors?.[0] || '#5A4BE0') : undefined,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: isLine ? 1.5 : 0,
          pointHoverBackgroundColor: resolveChartColor('#5A4BE0'),
          pointHoverBorderColor: '#FFFFFF',
          pointHoverBorderWidth: 2,
        },
      ];
    }

    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: ct as any,
      data: { labels: c.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: isDo ? 'nearest' : 'index',
          intersect: false,
          axis: c.h ? 'y' : 'x',
        },
        hover: {
          mode: isDo ? 'nearest' : 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: isDo || (c.multi && !isDo),
            position: 'right',
            labels: {
              font: { size: 10, family: "'Poppins', sans-serif" },
              boxWidth: 8,
              padding: 8,
              color: '#1A1A18',
            },
          },
          tooltip: {
            enabled: true,
            mode: isDo ? 'nearest' : 'index',
            intersect: false,
            backgroundColor: 'rgba(26, 26, 24, 0.95)',
            titleColor: '#FFFFFF',
            titleFont: { size: 11, weight: 'bold', family: "'Poppins', sans-serif" },
            bodyColor: 'rgba(255, 255, 255, 0.88)',
            bodyFont: { size: 10, family: "'Poppins', sans-serif" },
            padding: 10,
            cornerRadius: 8,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
            displayColors: true,
            boxPadding: 4,
            callbacks: {
              label: function (context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                const val =
                  context.parsed.y !== undefined
                    ? context.parsed.y
                    : context.parsed.x !== undefined && c.h
                    ? context.parsed.x
                    : context.parsed !== undefined
                    ? context.parsed
                    : context.raw;
                if (typeof val === 'number') {
                  label += val.toLocaleString();
                } else {
                  label += val ?? 0;
                }
                return label;
              },
            },
          },
        },
        ...(isDo
          ? { cutout: '68%' }
          : {
              indexAxis: c.h ? 'y' : 'x',
              scales: {
                x: {
                  grid: { color: 'rgba(26, 26, 24, 0.07)' },
                  ticks: { font: { size: 10, family: "'Poppins', sans-serif" }, color: 'rgba(26, 26, 24, 0.48)' },
                },
                y: {
                  grid: { color: 'rgba(26, 26, 24, 0.07)' },
                  ticks: { font: { size: 10, family: "'Poppins', sans-serif" }, color: 'rgba(26, 26, 24, 0.48)' },
                },
              },
            }),
      },
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [id, activeType, JSON.stringify(chartDataOverride)]);

  const c = chartDataOverride || CD[id];
  if (!c) return null;
  const ct = activeType || c.def;

  if (!c.labels || c.labels.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-[12px] bg-white text-[11px] text-[rgba(26,26,24,0.48)]">
        No data for this period
      </div>
    );
  }

  if (ct === 'tbl') {
    if (c.multi) {
      return (
        <div className="overflow-x-auto w-full h-full rounded-[12px] bg-white border border-[rgba(26,26,24,0.07)]">
          <table className="w-full border-collapse text-[11px] text-left">
            <thead>
              <tr className="bg-[#EFEDE6]">
                <th className="p-[8px_12px] font-bold text-[rgba(26,26,24,0.48)] uppercase text-[10px] tracking-wider">Period</th>
                {c.datasets.map((d: any, i: number) => (
                  <th key={i} className="p-[8px_12px] text-right font-bold text-[rgba(26,26,24,0.48)] uppercase text-[10px] tracking-wider">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.labels.map((l: string, i: number) => (
                <tr key={i} className="border-b border-[rgba(26,26,24,0.07)] last:border-b-0 hover:bg-[#FAF9F5] transition-colors">
                  <td className="p-[8px_12px] text-[#1A1A18] font-medium">{l}</td>
                  {c.datasets.map((d: any, j: number) => (
                    <td key={j} className="p-[8px_12px] text-right font-semibold text-[#1A1A18]">
                      {Number(d.data[i] ?? 0).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div className="overflow-x-auto w-full h-full rounded-[12px] bg-white border border-[rgba(26,26,24,0.07)]">
          <table className="w-full border-collapse text-[11px] text-left">
            <thead>
              <tr className="bg-[#EFEDE6]">
                <th className="p-[8px_12px] font-bold text-[rgba(26,26,24,0.48)] uppercase text-[10px] tracking-wider">Category</th>
                <th className="p-[8px_12px] text-right font-bold text-[rgba(26,26,24,0.48)] uppercase text-[10px] tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody>
              {c.labels.map((l: string, i: number) => (
                <tr key={i} className="border-b border-[rgba(26,26,24,0.07)] last:border-b-0 hover:bg-[#FAF9F5] transition-colors">
                  <td className="p-[8px_12px] text-[#1A1A18] font-medium">{l}</td>
                  <td className="p-[8px_12px] text-right font-semibold text-[#1A1A18]">{Number(c.values[i] ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

/** Business Genie chart card — grey fill #F5F4F0, rounded-16, segmented controls, AI insight surface */
export const ChartCard = ({
  id,
  title,
  acts,
  insight,
  onAiOpen,
  chartDataOverride,
}: {
  id: string;
  title: string;
  acts: any[];
  insight?: any;
  onAiOpen?: () => void;
  chartDataOverride?: any;
}) => {
  const cDef = (chartDataOverride || CD[id])?.def || 'bar';
  const [activeType, setActiveType] = useState<string>(acts && acts.length > 0 ? acts[0].type : cDef);

  return (
    <div className="bg-[#F5F4F0] rounded-[16px] p-5 flex flex-col h-full border-0 shadow-none">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-[14px] font-semibold text-[#1A1A18]">{title}</div>
        </div>
        {acts && acts.length > 0 && (
          <div className="inline-flex gap-1 p-[3px] rounded-[8px] bg-[rgba(26,26,24,0.06)]">
            {acts.map((act) => (
              <button
                key={act.type}
                onClick={() => setActiveType(act.type)}
                className={`rounded-[6px] px-2.5 py-[3px] text-[10.5px] cursor-pointer font-[Poppins] transition-all duration-150 font-semibold ${
                  activeType === act.type
                    ? 'bg-white text-[#1A1A18] shadow-[0_1px_2px_rgba(26,26,24,0.1)]'
                    : 'bg-transparent text-[rgba(26,26,24,0.48)] hover:text-[#1A1A18]'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[210px] relative w-full grow">
        <ChartViewer id={id} activeType={activeType} chartDataOverride={chartDataOverride} />
      </div>

      {insight && (
        <div
          className="mt-3 relative rounded-[12px] p-[12px_14px_12px_44px] cursor-pointer transition-all hover:opacity-95"
          style={{
            background: 'linear-gradient(135deg, #F4F1FE 0%, #EEEBFF 46%, #F6F4FF 100%)',
            border: '1px solid rgba(90, 75, 224, 0.20)',
          }}
          onClick={onAiOpen}
        >
          <div
            className="absolute left-3 top-3.5 w-6 h-6 rounded-[7px] text-white flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #5A4BE0 0%, #6B5AE8 52%, #7B6BF0 100%)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase text-[#4839C4] bg-[rgba(90,75,224,0.10)]">
              {insight.label || 'AI INSIGHT'}
            </span>
          </div>
          <div className="text-[11.5px] leading-relaxed text-[rgba(26,26,24,0.68)] line-clamp-2">{insight.text}</div>
          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#1A1A18]">
            <span>{insight.btnText || 'Ask Assistant'}</span>
            <ArrowRight className="w-3 h-3 text-[#5A4BE0]" />
          </div>
        </div>
      )}
    </div>
  );
};
