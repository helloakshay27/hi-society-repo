import type { Device, AdminScope } from '../data/types';
import { BOOKED_HOMEBUYERS, ACTIVE_USERS_BASE } from '../data/constants';

export { ACTIVE_USERS_BASE };

export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(key: string, dev: Device, scope: AdminScope): () => number {
  return mulberry32(hashStr(`${key}|${dev}|${scope}`));
}

export function devFactor(dev: Device): number {
  return dev === 'ios' ? 0.58 : dev === 'android' ? 0.42 : 1;
}

export function scopeFactor(scope: AdminScope): number {
  return scope === 'tower' ? 0.3 : 1;
}

export function rangeFactor(range: number): number {
  return range / 30;
}

export function scopedCeiling(scope: AdminScope): number {
  return BOOKED_HOMEBUYERS * scopeFactor(scope);
}

export function fmtC(n: number): string {
  if (n >= 100000) return Math.round(n / 1000) + 'K';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
  return String(Math.round(n));
}

export function pct(x: number, d?: number): string {
  return x.toFixed(d == null ? 0 : d) + '%';
}

export function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
}

export function truncLabel(s: string, max: number): string {
  const str = String(s);
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

export interface ChartPalette {
  ink: string;
  faint: string;
  grid: string;
  line: string;
  blue: string;
  fill: string;
  mint: string;
  amber: string;
  red: string;
  violet: string;
  violetTint: string;
  green: string;
  heatRgb: string;
  onHeat: string;
  heatA0: number;
  heatA1: number;
}

export function getChartPalette(theme: 'light' | 'dark'): ChartPalette {
  if (theme === 'dark') {
    return {
      ink: '#f2f0eb',
      faint: '#7b7871',
      grid: '#33302a',
      line: '#4a463d',
      blue: '#5f9df6',
      fill: '#22344b',
      mint: '#57c496',
      amber: '#dfa63e',
      red: '#e4735c',
      violet: '#9d90e8',
      violetTint: '#292440',
      green: '#4fc07f',
      heatRgb: '95,157,246',
      onHeat: '#101820',
      heatA0: 0.12,
      heatA1: 0.8
    };
  }
  return {
    ink: '#141413',
    faint: '#9b9990',
    grid: '#e6e4de',
    line: '#d9d6ce',
    blue: '#2c7be5',
    fill: '#d3e3f9',
    mint: '#3daf7d',
    amber: '#c98a12',
    red: '#b3402c',
    violet: '#7c6fd6',
    violetTint: '#e7e4f8',
    green: '#0f8a3d',
    heatRgb: '44,123,229',
    onHeat: '#ffffff',
    heatA0: 0.09,
    heatA1: 0.78
  };
}
