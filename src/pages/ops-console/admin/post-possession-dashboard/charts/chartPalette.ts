import type { Chart, Plugin } from 'chart.js';
import { ANALYTICS_PALETTE } from '@/styles/chartPalette';

/**
 * Asset-management analytics chart series (from asset-management HTML).
 * Used for all categorical pie/donut/bar charts on the admin dashboard.
 */
/** Business Genie chart palette (veda-gardens-business-genie.html) */
export const ASSET_CHART_SERIES = [
  '#5A4BE0', // Purple
  '#2F6FE0', // Blue
  '#12A150', // Green
  '#798C5E', // Olive
  '#7FD6AE', // Mint
  '#4839C4', // Deep purple
  '#F2A312', // Amber / bar accent
  '#E5484D', // Danger
] as const;

export const ASSET_CHART_BAR = {
  solid: '#5A4BE0',
  muted: 'rgba(90,75,224,0.55)',
  track: 'rgba(26,26,24,0.05)',
} as const;

/** Brand-aligned palette for post-possession dashboard charts & dynamic UI */
export const PP_PALETTE = {
  coral: ANALYTICS_PALETTE[0],
  for: '#12A150',
  lavender: ASSET_CHART_SERIES[0],
  teal: ASSET_CHART_SERIES[2],
  sand: ANALYTICS_PALETTE[4],
  amb: ANALYTICS_PALETTE[5],
  crim: '#E5484D',
  sky: ASSET_CHART_SERIES[1],
  /** Categorical accent — asset-analytics purple */
  vio: ASSET_CHART_SERIES[0],
  sto: '#888780',
  /** Chart series shortcuts */
  chart1: ASSET_CHART_SERIES[0],
  chart2: ASSET_CHART_SERIES[1],
  chart3: ASSET_CHART_SERIES[2],
} as const;

export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function seriesColor(index: number, alpha = 1): string {
  const hex = ASSET_CHART_SERIES[index % ASSET_CHART_SERIES.length];
  return alpha >= 1 ? hex : rgba(hex, alpha);
}

export const PP_AXIS = {
  border: { display: false },
  ticks: { padding: 6 },
  grid: { color: 'rgba(196,184,157,.18)', drawTicks: false },
};

/** Shared doughnut options matching asset-management analytics UI */
export const DOUGHNUT_OPTIONS = {
  cutout: '65%' as const,
  plugins: {
    legend: {
      display: true,
      position: 'right' as const,
      labels: {
        boxWidth: 10,
        usePointStyle: true,
        pointStyle: 'rectRounded' as const,
        padding: 12,
        font: { size: 11, family: 'Poppins' },
        color: 'rgba(26,26,24,.68)',
        generateLabels: (chart: Chart) => {
          const data = chart.data;
          const ds = data.datasets[0];
          const values = (ds.data as number[]) || [];
          const total = values.reduce((s, v) => s + Number(v || 0), 0) || 1;
          const colors = (ds.backgroundColor as string[]) || [];
          return (data.labels || []).map((label, i) => {
            const val = Number(values[i] || 0);
            const pct = Math.round((val / total) * 100);
            return {
              text: `${label}  ${val}  ${pct}%`,
              fillStyle: colors[i],
              strokeStyle: colors[i],
              lineWidth: 0,
              hidden: false,
              index: i,
              datasetIndex: 0,
            };
          });
        },
      },
    },
  },
};

/** Draws "N / Total" in the donut hole — same layout as asset-management analytics */
export const doughnutCenterPlugin: Plugin<'doughnut'> = {
  id: 'ppDoughnutCenter',
  afterDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const values = (chart.data.datasets[0]?.data as number[]) || [];
    const total = values.reduce((s, v) => s + Number(v || 0), 0);
    const first = meta.data[0] as unknown as { x: number; y: number };
    const { x, y } = first;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1A1A18';
    ctx.font = '600 22px Poppins, system-ui, sans-serif';
    ctx.fillText(String(total), x, y - 6);
    ctx.fillStyle = 'rgba(26,26,24,.48)';
    ctx.font = '500 10px Poppins, system-ui, sans-serif';
    ctx.fillText('Total', x, y + 12);
    ctx.restore();
  },
};

/** Maps legacy HTML mock hex values → asset-analytics chart colors */
export const LEGACY_HEX_TO_BRAND: Record<string, string> = {
  '#085041': ASSET_CHART_SERIES[2], // forest → green
  '#534AB7': ASSET_CHART_SERIES[0], // violet → purple
  '#185FA5': ASSET_CHART_SERIES[1], // sky → blue
  '#BA7517': ASSET_CHART_SERIES[3], // amber → soft purple
  '#A32D2D': '#E5484D', // deep crimson → chart red
  '#108C72': ASSET_CHART_SERIES[2],
  '#798C5E': ASSET_CHART_SERIES[2],
  '#6B9BCC': ASSET_CHART_SERIES[1],
  '#9EC8BA': ASSET_CHART_SERIES[2],
  '#CECBF6': ASSET_CHART_SERIES[0],
  '#E7848E': '#E5484D',
};

export function applyBrandHexRemap(html: string): string {
  let out = html;
  for (const [legacy, brand] of Object.entries(LEGACY_HEX_TO_BRAND)) {
    out = out.replaceAll(legacy, brand);
    out = out.replaceAll(legacy.toLowerCase(), brand);
  }
  return out;
}
