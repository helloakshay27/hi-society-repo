import type { ChartConfiguration } from 'chart.js';
import { BG_DONUT_PALETTE } from './bgDonut';

export type BgColsSpec = {
  labels: string[];
  values: number[];
  /** Optional “sent” totals — draws a white ghost bar behind the fill */
  totals?: number[];
  max: number;
  ticks: number[];
  unit?: string;
  avg?: number;
};

/** Vertical column chart matching veda-gardens-vertical-bars.html */
export function renderBusinessGenieCols(host: HTMLElement, c: BgColsSpec): void {
  const unit = c.unit || '';
  const pct = (v: number) => `${(v / c.max) * 100}%`;
  const grid = c.ticks
    .map((t) => `<div class="gl" style="bottom:${pct(t)}"><span>${t}${unit}</span></div>`)
    .join('');
  const avg =
    c.avg != null
      ? `<div class="avg" style="bottom:${pct(c.avg)}"><span>Avg ${c.avg}${unit}</span></div>`
      : '';
  const groups = c.labels
    .map((label, i) => {
      const v = c.values[i] ?? 0;
      const t = c.totals?.[i];
      const color = BG_DONUT_PALETTE[i % BG_DONUT_PALETTE.length];
      if (t != null) {
        const fillPct = t ? (v / t) * 100 : 0;
        return `<div class="grp"><div class="col ghost" title="${label} · ${v} of ${t} delivered" style="height:${pct(t)}"><i style="height:${fillPct}%;background:${color}"></i><b>${v}/${t}</b></div></div>`;
      }
      return `<div class="grp"><div class="col" title="${label} · ${v}${unit}" style="height:${pct(v)};background:${color}"><b>${v}${unit}</b></div></div>`;
    })
    .join('');

  host.classList.add('cols', 'num');
  host.style.height = 'auto';
  host.innerHTML = `<div class="plot">${grid}${avg}${groups}</div><div class="xl">${c.labels.map((l) => `<span>${l}</span>`).join('')}</div>`;
}

/** Build a BG column spec from a Chart.js vertical bar config */
export function colsSpecFromBarConfig(
  chartId: string,
  config: ChartConfiguration
): BgColsSpec | null {
  if (config.type !== 'bar') return null;
  const opts = config.options as { indexAxis?: string } | undefined;
  if (opts?.indexAxis === 'y') return null; // horizontal — not a column chart

  const labels = (config.data.labels || []).map(String);
  const datasets = config.data.datasets || [];
  if (!datasets.length || !labels.length) return null;

  // Ghost bars: 2 datasets where first = totals (sent) and second = values (delivered)
  if (chartId === 'notifChannelChart' && datasets.length >= 2) {
    const totals = (datasets[0].data as number[]) || [];
    const values = (datasets[1].data as number[]) || [];
    const maxVal = Math.max(...totals, ...values, 1);
    const niceMax = maxVal <= 25 ? 25 : Math.ceil(maxVal / 10) * 10;
    return {
      labels,
      values,
      totals,
      max: niceMax,
      ticks: niceMax <= 25 ? [0, 10, 20] : [0, niceMax / 2, niceMax],
    };
  }

  const values = (datasets[0].data as number[]) || [];
  const yScale = (config.options as { scales?: { y?: { max?: number } } })?.scales?.y;
  const isPct =
    chartId.includes('adoption') ||
    chartId.includes('Rejection') ||
    chartId.toLowerCase().includes('rate') ||
    chartId.includes('escalation') ||
    chartId.includes('category');
  const max = yScale?.max ?? (isPct ? 100 : Math.max(...values.map(Number), 1));
  const unit = isPct ? '%' : '';
  const ticks =
    max === 100 ? [0, 50, 100] : max <= 5 ? [0, 1, 2, 3, 4, 5].filter((t) => t <= max) : [0, max / 2, max];

  let avg: number | undefined;
  // Society-wide adoption (not a simple mean of tower rates)
  if (chartId === 'adoptionChart') avg = 48;

  return {
    labels,
    values: values.map(Number),
    max: Number(max),
    ticks: ticks.map(Number),
    unit,
    avg,
  };
}
