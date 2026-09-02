import { ANALYTICS_PALETTE } from '@/styles/chartPalette';

/** Brand-aligned palette for post-possession dashboard charts & dynamic UI */
export const PP_PALETTE = {
  coral: ANALYTICS_PALETTE[0],
  for: ANALYTICS_PALETTE[1],
  lavender: ANALYTICS_PALETTE[2],
  teal: ANALYTICS_PALETTE[3],
  sand: ANALYTICS_PALETTE[4],
  amb: ANALYTICS_PALETTE[5],
  crim: ANALYTICS_PALETTE[6],
  sky: ANALYTICS_PALETTE[7],
  /** Accent — teal (replaces legacy purple in categorical charts) */
  vio: ANALYTICS_PALETTE[3],
  sto: '#888780',
} as const;

export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const PP_AXIS = {
  border: { display: false },
  ticks: { padding: 6 },
  grid: { color: 'rgba(196,184,157,.18)', drawTicks: false },
};

/** Maps legacy HTML mock hex values to FM Matrix brand colors */
export const LEGACY_HEX_TO_BRAND: Record<string, string> = {
  '#085041': PP_PALETTE.for,
  '#534AB7': PP_PALETTE.teal,
  '#185FA5': PP_PALETTE.sky,
  '#BA7517': '#108C72',
  '#A32D2D': PP_PALETTE.crim,
};

export function applyBrandHexRemap(html: string): string {
  let out = html;
  for (const [legacy, brand] of Object.entries(LEGACY_HEX_TO_BRAND)) {
    out = out.replaceAll(legacy, brand);
    out = out.replaceAll(legacy.toLowerCase(), brand);
  }
  return out;
}
