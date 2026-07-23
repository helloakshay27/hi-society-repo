import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { CD } from './LoyaltyDashboardData';

Chart.register(...registerables);

export const Briefing = ({ label, text, icon = "✦" }: { label: string, text: React.ReactNode, icon?: string }) => (
  <div className="bg-gradient-to-br from-[#2C2C2C] to-[#3d3530] rounded-[10px] p-3 px-4 mb-3 flex gap-3 items-start relative overflow-hidden">
    <div className="text-[18px] shrink-0 mt-[1px] text-white/40">{icon}</div>
    <div className="relative z-10">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className="text-[11px] text-white/80 leading-relaxed [&>strong]:text-white" dangerouslySetInnerHTML={{ __html: text as string }} />
    </div>
  </div>
);

export const KpiStripCard = ({ title, value, sub, barWidth, barColor, valueColor, onClick }: any) => (
  <div onClick={onClick} className="bg-[#FFF7EB] border border-[#F0D9B0] rounded-[10px] p-[12px_14px] cursor-pointer transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(218,119,86,.14)]">
    <div className="text-[10px] font-medium text-[#798C5E] uppercase tracking-wide mb-1">{title}</div>
    <div className={`text-[22px] font-bold leading-none ${valueColor || 'text-[#2C2C2C]'}`}>{value}</div>
    {barWidth !== undefined && (
      <div className="h-[3px] bg-[#F0D9B0] rounded-full overflow-hidden mt-1.5">
        <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: barColor || '#DA7756' }} />
      </div>
    )}
    <div className="text-[10px] mt-[3px] text-[#798C5E]" dangerouslySetInnerHTML={{ __html: sub }} />
  </div>
);

export const KpiCard = ({ title, value, sub, barWidth, barColor, valueColor, onClick }: any) => (
  <div onClick={onClick} className="bg-white border border-[#E0D8CC] rounded-[10px] p-[12px_14px] cursor-pointer transition-colors duration-150 hover:border-[#DA7756]">
    <div className="text-[10px] font-medium text-[#798C5E] uppercase tracking-wide mb-1">{title}</div>
    <div className={`text-[22px] font-bold leading-none ${valueColor || 'text-[#2C2C2C]'}`}>{value}</div>
    <div className="text-[10px] mt-[3px] text-[#798C5E]" dangerouslySetInnerHTML={{ __html: sub }} />
    {barWidth !== undefined && (
      <div className="h-[3px] bg-[#E0D8CC] rounded-full overflow-hidden mt-2">
        <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: barColor || '#DA7756' }} />
      </div>
    )}
  </div>
);

export const ModuleCard = ({ title, value, sub, colorClass, chips, onClick }: any) => {
  const colorMap: Record<string, string> = {
    coral: 'bg-[#DA7756]',
    forest: 'bg-[#108C72]',
    amber: 'bg-[#EDC488]',
    crimson: 'bg-[#E7848E]',
    violet: 'bg-[#6B9BCC]',
    sky: 'bg-[#6B9BCC]'
  };
  const topBorderClass = colorMap[colorClass] || 'bg-[#E0D8CC]';

  return (
    <div onClick={onClick} className="bg-white border border-[#E0D8CC] rounded-[10px] p-3 cursor-pointer transition-all duration-150 hover:border-[#DA7756] hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(44,44,44,.07)] relative overflow-hidden group">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${topBorderClass}`}></div>
      <div className="text-[9px] font-semibold text-[#798C5E] uppercase tracking-wide mb-[3px] mt-[2px]">{title}</div>
      <div className="text-[17px] font-bold text-[#2C2C2C] leading-none">{value}</div>
      <div className="text-[10px] text-[#798C5E] mt-[2px]" dangerouslySetInnerHTML={{ __html: sub }}></div>
      {chips && chips.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-1.5">
          {chips.map((c: any, i: number) => {
            const chipClassMap: Record<string, string> = {
              'chip-ok': 'bg-[#108C72]/20 text-[#085041] border border-[#108C72]/50',
              'chip-warn': 'bg-[#EDC488]/25 text-[#8A5A00] border border-[#EDC488]/50',
              'chip-err': 'bg-[#E7848E]/20 text-[#C0303D] border border-[#E7848E]/50',
              'chip-info': 'bg-[#6B9BCC]/20 text-[#2a5f8f] border border-[#6B9BCC]/40',
              'chip-muted': 'bg-[#79795E]/15 text-[#798C5E] border border-[#E0D8CC]',
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

    let datasets;
    if (c.multi) {
      datasets = c.datasets.map((d: any) => ({
        label: d.label,
        data: d.data,
        backgroundColor: d.bg,
        borderColor: d.bc,
        fill: d.fill || false,
        tension: d.tension || 0,
        pointRadius: d.pr !== undefined ? d.pr : 0,
        borderWidth: ct === 'line' ? 2 : (ct === 'bar' ? 0 : 0),
        borderRadius: ct === 'bar' ? 4 : 0,
        borderDash: d.dash
      }));
    } else {
      const isDo = ct === 'doughnut';
      datasets = [{
        data: c.values,
        backgroundColor: c.colors,
        borderWidth: isDo ? 2 : 0,
        borderRadius: ct === 'bar' ? 4 : 0,
        borderColor: isDo ? '#fff' : undefined
      }];
    }

    const isDo = ct === 'doughnut';
    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: ct as any,
      data: { labels: c.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: isDo || (c.multi && !isDo),
            position: 'right',
            labels: { font: { size: 9, family: "'Poppins',sans-serif" }, boxWidth: 8, padding: 6, color: '#2C2C2C' }
          },
          tooltip: { titleFont: { size: 11, family: "'Poppins',sans-serif" }, bodyFont: { size: 10, family: "'Poppins',sans-serif" } }
        },
        ...(isDo ? { cutout: '65%' } : {
          indexAxis: c.h ? 'y' : 'x',
          scales: {
            x: { grid: { color: 'rgba(196,184,157,.15)' }, ticks: { font: { size: 9 }, color: '#798C5E' } },
            y: { grid: { color: 'rgba(196,184,157,.15)' }, ticks: { font: { size: 9 }, color: '#798C5E' } }
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

  if (ct === 'tbl') {
    if (c.multi) {
      return (
        <div className="overflow-x-auto w-full h-full">
          <table className="w-full border-collapse text-[10px] text-left">
            <thead>
              <tr>
                <th className="p-[4px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-medium text-[#798C5E]">Period</th>
                {c.datasets.map((d: any, i: number) => (
                  <th key={i} className="p-[4px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] text-right font-medium text-[#798C5E]">{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.labels.map((l: string, i: number) => (
                <tr key={i}>
                  <td className="p-[4px_8px] border-b border-[#E0D8CC] text-[#2C2C2C]">{l}</td>
                  {c.datasets.map((d: any, j: number) => (
                    <td key={j} className="p-[4px_8px] border-b border-[#E0D8CC] text-right font-semibold text-[#2C2C2C]">{d.data[i].toLocaleString()}</td>
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
                <th className="p-[4px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-medium text-[#798C5E]">Category</th>
                <th className="p-[4px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] text-right font-medium text-[#798C5E]">Value</th>
              </tr>
            </thead>
            <tbody>
              {c.labels.map((l: string, i: number) => (
                <tr key={i}>
                  <td className="p-[4px_8px] border-b border-[#E0D8CC] text-[#2C2C2C]">{l}</td>
                  <td className="p-[4px_8px] border-b border-[#E0D8CC] text-right font-semibold text-[#2C2C2C]">{c.values[i].toLocaleString()}</td>
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
    <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[14px] flex flex-col h-full">
      <div className="flex justify-between items-start mb-2.5">
        <div><div className="text-[12px] font-semibold text-[#2C2C2C]">{title}</div></div>
        {acts && acts.length > 0 && (
          <div className="flex gap-1 items-center flex-wrap">
            {acts.map((act) => (
              <button 
                key={act.type} 
                onClick={() => setActiveType(act.type)} 
                className={`border rounded-[6px] px-2 py-[3px] text-[10px] cursor-pointer font-[Poppins] transition-all duration-150 ${activeType === act.type ? 'bg-[#DA7756] text-white border-[#DA7756]' : 'bg-transparent border-[#E0D8CC] text-[#798C5E] hover:bg-[#DA7756] hover:text-white hover:border-[#DA7756]'}`}
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
          <div className={`p-[6px_10px] rounded-[6px] border-l-[3px] flex-1 min-w-0 transition-colors ${insight.bgClass} ${insight.borderClass} group-hover:bg-[#FFF7EB] group-hover:border-[#DA7756]`}>
            <div className={`text-[9px] font-bold uppercase tracking-wide mb-[2px] transition-colors ${insight.textClass} group-hover:text-[#DA7756]`}>{insight.label}</div>
            <div className="text-[10.5px] leading-relaxed text-[#2C2C2C] line-clamp-2">{insight.text}</div>
          </div>
          <button className="inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-transparent border border-[#C4B89D] text-[#798C5E] cursor-pointer font-[Poppins] transition-all group-hover:border-[#DA7756] group-hover:text-[#DA7756]">{insight.btnText || '✦ Generate'}</button>
        </div>
      )}
    </div>
  );
};
