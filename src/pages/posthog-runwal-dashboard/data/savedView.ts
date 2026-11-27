// What the viewer picked on a Runwal usage dashboard (date range, platform, society, resident segment,
// page), kept in sessionStorage so a page refresh shows the same view instead of falling back to
// "Last 30 days" (issue 5460). One entry per dashboard, so Connect, Realty and CP each keep their own.
//
// A preset range is saved as its length and recomputed from today when the page loads, so "Last 7 days"
// stays the last 7 days on a later day. A custom range is saved as its two dates.
import type { DevicePlatform, PageId } from '../types';

export interface SavedView {
  range: { days: number; label: string; from: string; to: string; custom: boolean };
  dev: DevicePlatform;
  societyId: string;
  segment: 'all' | 'pre' | 'post';
  page: PageId;
}

const PRESETS: Record<number, string> = { 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days' };
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const SOCIETY = /^[\w-]+$/;

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The last `days` days, today included, as YYYY-MM-DD in the viewer's local time. */
export function presetRange(days: number, today: Date = new Date()) {
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));
  return { from: ymd(from), to: ymd(today) };
}

/** Days in a custom range, both ends included. */
export function daysBetween(from: string, to: string): number {
  return Math.max(1, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1);
}

export function customRangeLabel(from: string, to: string): string {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(from)} – ${fmt(to)}`;
}

export function defaultView(today: Date = new Date()): SavedView {
  return {
    range: { days: 30, label: PRESETS[30], ...presetRange(30, today), custom: false },
    dev: 'all',
    societyId: 'all',
    segment: 'all',
    page: 'pgTraffic',
  };
}

const storageKey = (dashboard: string) => `runwal-usage-view:${dashboard}`;

/** The saved view for this dashboard, or the default one. Anything unreadable or out of range is dropped. */
export function loadView(dashboard: string, today: Date = new Date()): SavedView {
  const view = defaultView(today);
  let saved: any = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(storageKey(dashboard)) || 'null');
  } catch {
    return view;
  }
  if (!saved || typeof saved !== 'object') return view;

  const r = saved.range;
  const todayYmd = ymd(today);
  if (r && r.custom === true && YMD.test(r.from) && YMD.test(r.to) && r.from <= r.to) {
    const to = r.to > todayYmd ? todayYmd : r.to;
    const from = r.from > to ? to : r.from;
    view.range = { days: daysBetween(from, to), label: customRangeLabel(from, to), from, to, custom: true };
  } else if (r && PRESETS[r.days]) {
    view.range = { days: r.days, label: PRESETS[r.days], ...presetRange(r.days, today), custom: false };
  }
  if (['all', 'ios', 'android'].includes(saved.dev)) view.dev = saved.dev;
  if (typeof saved.societyId === 'string' && (saved.societyId === 'all' || SOCIETY.test(saved.societyId))) {
    view.societyId = saved.societyId;
  }
  if (['all', 'pre', 'post'].includes(saved.segment)) view.segment = saved.segment;
  if (['pgTraffic', 'pgAdopt', 'pgFlows'].includes(saved.page)) view.page = saved.page;
  return view;
}

export function saveView(dashboard: string, view: SavedView): void {
  try {
    sessionStorage.setItem(storageKey(dashboard), JSON.stringify(view));
  } catch {
    // Storage blocked (private mode, quota): the dashboard still works, it just won't survive a refresh.
  }
}
