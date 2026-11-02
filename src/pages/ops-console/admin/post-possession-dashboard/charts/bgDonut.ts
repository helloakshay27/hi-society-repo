import type { ChartConfiguration } from 'chart.js';

/** Business Genie categorical palette (index-assigned) */
export const BG_DONUT_PALETTE = [
  '#5A4BE0',
  '#2F6FE0',
  '#12A150',
  '#798C5E',
  '#7FD6AE',
  '#4839C4',
  '#F2A312',
  '#E5484D',
] as const;

export type BgDonutRow = [label: string, value: number];

/** SVG donut + side legend matching veda-gardens-business-genie.html */
export function renderBusinessGenieDonut(
  host: HTMLElement,
  rows: BgDonutRow[],
  centerLabel = 'tickets'
): void {
  const sum = rows.reduce((s, [, v]) => s + v, 0);
  const total = sum || 1;
  const R = 54;
  const C = 2 * Math.PI * R;
  const GAP = 2;
  let off = 0;
  const arcs = rows
    .map(([, v], i) => {
      const len = (v / total) * C;
      const seg = Math.max(len - GAP, 0.5);
      const stroke = BG_DONUT_PALETTE[i % BG_DONUT_PALETTE.length];
      const a = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${stroke}" stroke-width="10" stroke-dasharray="${seg} ${C - seg}" stroke-dashoffset="${-off}" stroke-linecap="butt"/>`;
      off += len;
      return a;
    })
    .join('');

  const legend = rows
    .map(([label, v], i) => {
      const pct = sum ? Math.round((v / sum) * 100) : 0;
      const color = BG_DONUT_PALETTE[i % BG_DONUT_PALETTE.length];
      return `<div><i style="background:${color}"></i><span>${label}</span><b>${v}</b><em>${pct}%</em></div>`;
    })
    .join('');

  host.classList.add('donut-wrap');
  host.style.height = 'auto';
  host.innerHTML = `
    <div class="donut">
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r="${R}" fill="none" stroke="#FFFFFF" stroke-width="10"/>
        ${arcs}
      </svg>
      <div class="c"><div><b class="num">${sum}</b><small>${centerLabel}</small></div></div>
    </div>
    <div class="dl num">${legend}</div>
  `;
}

export function doughnutRowsFromConfig(config: ChartConfiguration): BgDonutRow[] {
  const labels = (config.data.labels || []) as string[];
  const values = (config.data.datasets[0]?.data || []) as number[];
  return labels.map((label, i) => [String(label), Number(values[i] || 0)]);
}

export function centerLabelForChart(chartId: string): string {
  if (chartId.includes('member') || chartId.includes('plan')) return 'members';
  if (chartId.includes('visit') || chartId.includes('guest')) return 'visitors';
  if (chartId.includes('parking') || chartId.includes('vehicle')) return 'vehicles';
  if (chartId.includes('fitout') || chartId.includes('deviation')) return 'requests';
  if (chartId.includes('proactive')) return 'tickets';
  if (chartId.includes('quarantine')) return 'cases';
  return 'tickets';
}
