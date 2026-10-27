import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { CD } from './LoyaltyDashboardData';
import '@/styles/theme.css';

Chart.register(...registerables);

const chartColorCache = new Map<string, string>();

function resolveChartColor(color: string): string {
  if (!color.includes('var(')) return color;
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

export const Briefing = ({ label, text, icon = "✦" }: { label: string, text: React.ReactNode, icon?: React.ReactNode }) => (
  <div className="bg-[var(--loyalty-surface-card)] border border-[var(--loyalty-border)] rounded-lg p-3 px-4 mb-3 flex gap-3 items-start relative overflow-hidden shadow-sm">
    <div className="shrink-0 mt-[2px] text-[var(--loyalty-accent)]">{icon}</div>
    <div className="relative z-10">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--loyalty-subtle)] mb-1 flex items-center gap-1.5">{label}</div>
      <div className="text-[11px] text-[var(--loyalty-text)] leading-relaxed [&>strong]:text-[var(--loyalty-text)]" dangerouslySetInnerHTML={{ __html: text as string }} />
    </div>
  </div>
);

export const KpiStripCard = ({ title, value, sub, barWidth, barColor, valueColor, onClick, icon, iconBg, iconColor }: any) => (
  <div onClick={onClick} className="bg-white border border-[var(--loyalty-divider)] rounded-lg p-[12px_14px] cursor-pointer transition-all duration-150 hover:border-[var(--loyalty-accent)] hover:shadow-[0_2px_8px_rgba(var(--loyalty-accent-rgb),.14)] flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">{title}</div>
        {icon && (
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconBg || 'bg-[var(--loyalty-accent)]/10'} ${iconColor || 'text-[var(--loyalty-accent)]'}`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`text-[22px] font-bold leading-none ${valueColor || 'text-[var(--loyalty-text)]'}`}>{value}</div>
    </div>
    <div>
      {barWidth !== undefined && (
        <div className="h-[3px] bg-[var(--loyalty-divider)] rounded-full overflow-hidden mt-2">
          <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: barColor || 'var(--loyalty-accent)' }} />
        </div>
      )}
      <div className="text-[10px] mt-1.5 text-[var(--loyalty-green)]" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  </div>
);

export const KpiCard = ({ title, value, sub, barWidth, barColor, valueColor, onClick, icon, iconBg, iconColor }: any) => (
  <div onClick={onClick} className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[12px_14px] cursor-pointer transition-all duration-150 hover:border-[var(--loyalty-accent)] hover:shadow-sm flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">{title}</div>
        {icon && (
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconBg || 'bg-[var(--loyalty-accent)]/10'} ${iconColor || 'text-[var(--loyalty-accent)]'}`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`text-[22px] font-bold leading-none ${valueColor || 'text-[var(--loyalty-text)]'}`}>{value}</div>
    </div>
    <div>
      {barWidth !== undefined && (
        <div className="h-[3px] bg-[var(--loyalty-divider)] rounded-full overflow-hidden mt-2">
          <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: barColor || 'var(--loyalty-accent)' }} />
        </div>
      )}
      <div className="text-[10px] mt-1.5 text-[var(--loyalty-green)]" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  </div>
);

export const ModuleCard = ({ title, value, sub, colorClass, chips, onClick }: any) => {
  const colorMap: Record<string, string> = {
    coral: 'bg-[var(--loyalty-accent)]',
    forest: 'bg-[var(--loyalty-success)]',
    amber: 'bg-[var(--loyalty-warning)]',
    crimson: 'bg-[var(--loyalty-danger)]',
    violet: 'bg-[var(--loyalty-info)]',
    sky: 'bg-[var(--loyalty-info)]'
  };
  const topBorderClass = colorMap[colorClass] || 'bg-[var(--loyalty-divider)]';

  return (
    <div onClick={onClick} className="bg-white border border-[var(--loyalty-divider)] rounded-lg p-3 cursor-pointer transition-all duration-150 hover:border-[var(--loyalty-accent)] hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(var(--color-text-rgb),.07)] relative overflow-hidden group">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${topBorderClass}`}></div>
      <div className="text-[9px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wide mb-[3px] mt-[2px]">{title}</div>
      <div className="text-[17px] font-bold text-[var(--loyalty-text)] leading-none">{value}</div>
      <div className="text-[10px] text-[var(--loyalty-green)] mt-[2px]" dangerouslySetInnerHTML={{ __html: sub }}></div>
      {chips && chips.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-1.5">
          {chips.map((c: any, i: number) => {
            const chipClassMap: Record<string, string> = {
              'chip-ok': 'bg-[var(--loyalty-success)]/20 text-[var(--loyalty-success)] border border-[var(--loyalty-success)]/50',
              'chip-warn': 'bg-[var(--loyalty-warning)]/25 text-[var(--loyalty-warning-text)] border border-[var(--loyalty-warning)]/50',
              'chip-err': 'bg-[var(--loyalty-danger)]/20 text-[var(--loyalty-danger-text)] border border-[var(--loyalty-danger)]/50',
              'chip-info': 'bg-[var(--loyalty-info)]/20 text-[var(--loyalty-info)] border border-[var(--loyalty-info)]/40',
              'chip-muted': 'bg-[var(--loyalty-green)]/15 text-[var(--loyalty-green)] border border-[var(--loyalty-divider)]',
            };
            return (
              <span key={i} className={`text-[9px] font-semibold px-[7px] py-[2px] rounded-full ${chipClassMap[c.type]}`}>{c.label}</span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ChartViewer = ({ id, activeType, chartDataOverride }: { id: string, activeType: string, chartDataOverride?: any }) => {
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
        pointHoverRadius: isLine ? 7 : 0,
        pointBackgroundColor: resolveChartColor(d.bc || d.bg || 'var(--loyalty-accent)'),
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: isLine ? 1.5 : 0,
        pointHoverBackgroundColor: resolveChartColor('var(--loyalty-accent)'),
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2,
        borderWidth: isLine ? 2.5 : (ct === 'bar' ? 0 : 0),
        borderRadius: ct === 'bar' ? 4 : 0,
        borderDash: d.dash
      }));
    } else {
      datasets = [{
        data: c.values,
        backgroundColor: isLine ? resolveChartColor('rgba(var(--loyalty-accent-rgb), 0.15)') : resolveChartColors(c.colors),
        borderColor: isLine ? resolveChartColor(c.colors?.[0] || 'var(--loyalty-accent)') : (isDo ? '#fff' : undefined),
        hoverBackgroundColor: isLine ? resolveChartColor('rgba(var(--loyalty-accent-rgb), 0.25)') : resolveChartColors(c.colors),
        borderWidth: isDo ? 2 : (isLine ? 2.5 : 0),
        borderRadius: ct === 'bar' ? 4 : 0,
        fill: isLine,
        tension: isLine ? 0.35 : 0,
        pointRadius: isLine ? 4 : 0,
        pointHoverRadius: isLine ? 7 : 0,
        pointBackgroundColor: isLine ? resolveChartColor(c.colors?.[0] || 'var(--loyalty-accent)') : undefined,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: isLine ? 1.5 : 0,
        pointHoverBackgroundColor: resolveChartColor('var(--loyalty-accent)'),
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2,
      }];
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
            labels: { font: { size: 9, family: "'Poppins',sans-serif" }, boxWidth: 8, padding: 6, color: resolveChartColor('var(--loyalty-text)') }
          },
          tooltip: {
            enabled: true,
            mode: isDo ? 'nearest' : 'index',
            intersect: false,
            backgroundColor: 'rgba(44, 44, 44, 0.95)',
            titleColor: '#FFFFFF',
            titleFont: { size: 11, weight: 'bold', family: "'Poppins',sans-serif" },
            bodyColor: resolveChartColor('var(--loyalty-bg)'),
            bodyFont: { size: 10, family: "'Poppins',sans-serif" },
            padding: 10,
            cornerRadius: 8,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            displayColors: true,
            boxPadding: 4,
            callbacks: {
              label: function (context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                const val = context.parsed.y !== undefined
                  ? context.parsed.y
                  : (context.parsed.x !== undefined && c.h ? context.parsed.x : (context.parsed !== undefined ? context.parsed : context.raw));
                if (typeof val === 'number') {
                  label += val.toLocaleString();
                } else {
                  label += val ?? 0;
                }
                return label;
              },
            },
          }
        },
        ...(isDo ? { cutout: '65%' } : {
          indexAxis: c.h ? 'y' : 'x',
          scales: {
            x: { grid: { color: resolveChartColor('rgba(var(--color-text-rgb),.08)') }, ticks: { font: { size: 9 }, color: resolveChartColor('var(--loyalty-green)') } },
            y: { grid: { color: resolveChartColor('rgba(var(--color-text-rgb),.08)') }, ticks: { font: { size: 9 }, color: resolveChartColor('var(--loyalty-green)') } }
          }
        })
      }
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
      <div className="flex h-full w-full items-center justify-center rounded-md bg-[var(--loyalty-surface)] text-[11px] text-[var(--loyalty-subtle)]">
        No data for this period
      </div>
    );
  }

  if (ct === 'tbl') {
    if (c.multi) {
      return (
        <div className="overflow-x-auto w-full h-full">
          <table className="w-full border-collapse text-[10px] text-left">
            <thead>
              <tr>
                <th className="p-[4px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-medium text-[var(--loyalty-green)]">Period</th>
                {c.datasets.map((d: any, i: number) => (
                  <th key={i} className="p-[4px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] text-right font-medium text-[var(--loyalty-green)]">{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.labels.map((l: string, i: number) => (
                <tr key={i}>
                  <td className="p-[4px_8px] border-b border-[var(--loyalty-divider)] text-[var(--loyalty-text)]">{l}</td>
                  {c.datasets.map((d: any, j: number) => (
                    <td key={j} className="p-[4px_8px] border-b border-[var(--loyalty-divider)] text-right font-semibold text-[var(--loyalty-text)]">{Number(d.data[i] ?? 0).toLocaleString()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div className="overflow-x-auto w-full h-full">
          <table className="w-full border-collapse text-[10px] text-left">
            <thead>
              <tr>
                <th className="p-[4px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-medium text-[var(--loyalty-green)]">Category</th>
                <th className="p-[4px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] text-right font-medium text-[var(--loyalty-green)]">Value</th>
              </tr>
            </thead>
            <tbody>
              {c.labels.map((l: string, i: number) => (
                <tr key={i}>
                  <td className="p-[4px_8px] border-b border-[var(--loyalty-divider)] text-[var(--loyalty-text)]">{l}</td>
                  <td className="p-[4px_8px] border-b border-[var(--loyalty-divider)] text-right font-semibold text-[var(--loyalty-text)]">{Number(c.values[i] ?? 0).toLocaleString()}</td>
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

export const ChartCard = ({ id, title, acts, insight, onAiOpen, chartDataOverride }: { id: string, title: string, acts: any[], insight?: any, onAiOpen?: () => void, chartDataOverride?: any }) => {
  const cDef = (chartDataOverride || CD[id])?.def || 'bar';
  const [activeType, setActiveType] = useState<string>(acts && acts.length > 0 ? acts[0].type : cDef);
  
  return (
    <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[14px] flex flex-col h-full">
      <div className="flex justify-between items-start mb-2.5">
        <div><div className="text-[12px] font-semibold text-[var(--loyalty-text)]">{title}</div></div>
        {acts && acts.length > 0 && (
          <div className="flex gap-1 items-center flex-wrap">
            {acts.map((act) => (
              <button 
                key={act.type} 
                onClick={() => setActiveType(act.type)} 
                className={`border rounded-[6px] px-2 py-[3px] text-[10px] cursor-pointer font-[Poppins] transition-all duration-150 ${activeType === act.type ? 'bg-[var(--loyalty-accent)] text-white border-[var(--loyalty-accent)]' : 'bg-transparent border-[var(--loyalty-divider)] text-[var(--loyalty-green)] hover:bg-[var(--loyalty-accent)] hover:text-white hover:border-[var(--loyalty-accent)]'}`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-[200px] relative w-full grow">
        <ChartViewer id={id} activeType={activeType} chartDataOverride={chartDataOverride} />
      </div>
      {insight && (
        <div className="mt-2 flex items-center gap-2 flex-wrap cursor-pointer group" onClick={onAiOpen}>
          <div className={`p-[6px_10px] rounded-[6px] border-l-[3px] flex-1 min-w-0 transition-colors ${insight.bgClass} ${insight.borderClass} group-hover:bg-[var(--loyalty-warning-bg-soft)] group-hover:border-[var(--loyalty-accent)]`}>
            <div className={`text-[9px] font-bold uppercase tracking-wide mb-[2px] transition-colors ${insight.textClass} group-hover:text-[var(--loyalty-accent)]`}>{insight.label}</div>
            <div className="text-[10.5px] leading-relaxed text-[var(--loyalty-text)] line-clamp-2">{insight.text}</div>
          </div>
          <button className="inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-transparent border border-[var(--loyalty-border)] text-[var(--loyalty-green)] cursor-pointer font-[Poppins] transition-all group-hover:border-[var(--loyalty-accent)] group-hover:text-[var(--loyalty-accent)]">{insight.btnText || '✦ Generate'}</button>
        </div>
      )}
    </div>
  );
};
