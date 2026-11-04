import type { ChartConfiguration } from 'chart.js';
import { BG_DONUT_PALETTE } from './bgDonut';

export type BgColSeries = {
  label: string;
  values: number[];
  color: string;
};

export type BgColsSpec = {
  labels: string[];
  /** Single-series values (ignored when `series` is set) */
  values?: number[];
  /** Optional “sent” totals — draws a white ghost bar behind the fill */
  totals?: number[];
  /** Grouped side-by-side series (e.g. Member vs Guest) */
  series?: BgColSeries[];
  max: number;
  ticks: number[];
  maxXTicks?: number;
  unit?: string;
  avg?: number;
};

function niceMax(n: number): number {
  if (n <= 5) return 5;
  if (n <= 10) return 10;
  if (n <= 20) return 20;
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  if (n <= 100) return 100;
  return Math.ceil(n / 10) * 10;
}

function ticksFor(max: number): number[] {
  if (max === 100) return [0, 50, 100];
  if (max <= 5) return [0, 1, 2, 3, 4, 5].filter((t) => t <= max);
  if (max <= 10) return [0, 5, 10];
  if (max <= 20) return [0, 10, 20];
  if (max <= 25) return [0, 10, 20];
  return [0, max / 2, max];
}

function resolveSeriesColor(
  dataset: { backgroundColor?: unknown; label?: unknown },
  index: number
): string {
  const bg = dataset.backgroundColor;
  if (typeof bg === 'string' && bg.startsWith('#')) return bg;
  // Prefer theme palette indices over translucent rgba so twin bars stay vivid
  return BG_DONUT_PALETTE[index % BG_DONUT_PALETTE.length];
}

/** Vertical column chart matching veda-gardens-vertical-bars.html (+ grouped twin bars) */
export function renderBusinessGenieCols(host: HTMLElement, c: BgColsSpec): void {
  const unit = c.unit || '';
  const pct = (v: number) => `${(v / c.max) * 100}%`;
  const maxXTicks = c.maxXTicks && c.maxXTicks > 1 ? Math.floor(c.maxXTicks) : undefined;
  const visibleLabelIndexes =
    maxXTicks && c.labels.length > maxXTicks
      ? new Set(
          Array.from({ length: maxXTicks }, (_, index) =>
            Math.round((index * (c.labels.length - 1)) / (maxXTicks - 1))
          )
        )
      : undefined;
  const grid = c.ticks
    .map((t) => `<div class="gl" style="bottom:${pct(t)}"><span>${t}${unit}</span></div>`)
    .join('');
  const avg =
    c.avg != null
      ? `<div class="avg" style="bottom:${pct(c.avg)}"><span>Avg ${c.avg}${unit}</span></div>`
      : '';

  let groups: string;
  let legend = '';

  if (c.series && c.series.length >= 2) {
    legend = `<div class="leg">${c.series
      .map((s) => `<span><i style="background:${s.color}"></i>${s.label}</span>`)
      .join('')}</div>`;
    groups = c.labels
      .map((label, i) => {
        const bars = c.series!
          .map((s) => {
            const v = s.values[i] ?? 0;
            const h = Math.max((v / c.max) * 100, v > 0 ? 2 : 0);
            return `<div class="col twin" title="${s.label} · ${label}: ${v}${unit}" style="height:${h}%;background:${s.color}"><b>${v}${unit}</b></div>`;
          })
          .join('');
        return `<div class="grp twin">${bars}</div>`;
      })
      .join('');
  } else {
    const values = c.values || [];
    groups = c.labels
      .map((label, i) => {
        const v = values[i] ?? 0;
        const t = c.totals?.[i];
        const color = BG_DONUT_PALETTE[i % BG_DONUT_PALETTE.length];
        if (t != null) {
          const fillPct = t ? (v / t) * 100 : 0;
          return `<div class="grp"><div class="col ghost" title="${label} · ${v} of ${t} delivered" style="height:${pct(t)}"><i style="height:${fillPct}%;background:${color}"></i><b>${v}/${t}</b></div></div>`;
        }
        return `<div class="grp"><div class="col" title="${label} · ${v}${unit}" style="height:${pct(v)};background:${color}"><b>${v}${unit}</b></div></div>`;
      })
      .join('');
  }

  host.classList.add('cols', 'num');
  host.style.height = 'auto';
  host.innerHTML = `${legend}<div class="plot">${grid}${avg}${groups}</div><div class="xl">${c.labels
    .map((label, index) => `<span>${!visibleLabelIndexes || visibleLabelIndexes.has(index) ? label : ''}</span>`)
    .join('')}</div>`;
}

/** Build a BG column spec from a Chart.js vertical bar config */
export function colsSpecFromBarConfig(
  chartId: string,
  config: ChartConfiguration
): BgColsSpec | null {
  if (config.type !== 'bar') return null;
  const opts = config.options as
    | {
        indexAxis?: string;
        scales?: { x?: { ticks?: { maxTicksLimit?: number } } };
      }
    | undefined;
  if (opts?.indexAxis === 'y') return null; // horizontal — not a column chart

  const labels = (config.data.labels || []).map(String);
  const datasets = config.data.datasets || [];
  if (!datasets.length || !labels.length) return null;
  const maxXTicks = opts?.scales?.x?.ticks?.maxTicksLimit;

  // Grouped twin bars (Sent vs Delivered, Scheduled vs Present, Onboarded vs Not, …)
  if (datasets.length >= 2) {
    const series: BgColSeries[] = datasets.map((d, i) => ({
      label: String(d.label || `Series ${i + 1}`),
      values: ((d.data as number[]) || []).map(Number),
      color: resolveSeriesColor(d, i),
    }));
    const all = series.flatMap((s) => s.values);
    const yMax = (config.options as { scales?: { y?: { max?: number } } })?.scales?.y?.max;
    const max = niceMax(Number(yMax ?? Math.max(...all, 1)));
    const unit =
      chartId.includes('adoption') ||
      chartId.includes('Rejection') ||
      chartId.toLowerCase().includes('rate')
        ? '%'
        : '';
    const avg = chartId === 'adoptionChart' ? 48 : undefined;
    return {
      labels,
      series,
      max,
      ticks: ticksFor(max),
      ...(typeof maxXTicks === 'number' ? { maxXTicks } : {}),
      unit,
      avg,
    };
  }

  const values = ((datasets[0].data as number[]) || []).map(Number);
  const yScale = (config.options as { scales?: { y?: { max?: number } } })?.scales?.y;
  const isPct =
    chartId.includes('adoption') ||
    chartId.includes('Rejection') ||
    chartId.toLowerCase().includes('rate') ||
    chartId.includes('escalation') ||
    chartId.includes('category');
  const max = niceMax(Number(yScale?.max ?? (isPct ? 100 : Math.max(...values, 1))));
  const unit = isPct ? '%' : '';

  let avg: number | undefined;
  return {
    labels,
    values,
    max,
    ticks: ticksFor(max),
    ...(typeof maxXTicks === 'number' ? { maxXTicks } : {}),
    unit,
  };
}
