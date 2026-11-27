// What the "vs prev" comparisons have to compare against. Every change vs prev compares the range with
// the previous period: the same number of days just before it (the API's meta.previous_period). Before
// an app went live that period has no data (Runwal Connect: before mid-October 2026), so:
//   none     no day of it has data: there is nothing to compare, and the tiles say so instead of a blank
//   partial  fewer of its days have data than the range's: every change vs prev looks bigger than it is
//   full     as many days of data as the range (or more)
import type { TrafficSessionResponse } from '../api/types';
import { trunc2 } from './constants';

export type CoverageState = 'none' | 'partial' | 'full' | 'unknown';

export interface PreviousCoverage {
  state: CoverageState;
  /** "May 31 – Aug 28" */
  dates: string;
  /** For the tiles: what to show instead of a change when there is none. */
  tileText: string | null;
  /** One line for the page, null when the previous period is fully covered. */
  note: string | null;
}

const fmtDay = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function previousCoverage(traffic?: TrafficSessionResponse | null): PreviousCoverage {
  const meta = traffic?.meta;
  const prev = meta?.previous_period;
  if (!prev || meta?.days_with_data == null) return { state: 'unknown', dates: '', tileText: null, note: null };

  const dates = `${fmtDay(prev.from)} – ${fmtDay(prev.to)}`;
  if (prev.days_with_data === 0) {
    return {
      state: 'none',
      dates,
      tileText: 'No data in previous period',
      note: `No comparison with the previous period: it (${dates}) has no data, as the app was not sending any yet. Pick a range that starts later to compare.`,
    };
  }
  if (prev.days_with_data < meta.days_with_data) {
    const from = prev.first_day_with_data ? `, from ${fmtDay(prev.first_day_with_data)}` : '';
    return {
      state: 'partial',
      dates,
      tileText: null,
      note: `* The previous period (${dates}) has data on only ${prev.days_with_data} of its ${prev.days} days${from}, so the changes vs prev look bigger than they are.`,
    };
  }
  return { state: 'full', dates, tileText: null, note: null };
}

/**
 * A tile's change vs the previous period, two decimals cut, with the previous value in brackets.
 * With no previous data it says so; with a partly covered previous period it carries a "*".
 */
export function deltaText(
  d: number | null | undefined,
  coverage: PreviousCoverage,
  prevText?: string | null
): { text: string | null; dir: 'up' | 'dn' | 'flat' } {
  if (d == null || !Number.isFinite(d)) return { text: coverage.tileText, dir: 'flat' };
  const star = coverage.state === 'partial' ? ' *' : '';
  const prev = prevText ? ` (${prevText})` : '';
  const abs = trunc2(Math.abs(d));
  if (abs === '0.00') return { text: `0.00% vs prev${prev}${star}`, dir: 'flat' };
  if (d > 0) return { text: `+${abs}% vs prev${prev}${star}`, dir: 'up' };
  return { text: `-${abs}% vs prev${prev}${star}`, dir: 'dn' };
}
