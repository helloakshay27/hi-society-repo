import axios from 'axios';
import { API_CONFIG, getHiSocietyBaseUrl } from '@/config/apiConfig';

/** Distinct series colours from the shared theme (resolved at draw time by ChartViewer). */
export const CHART_COLORS = [
  '#5A4BE0', // Purple (Business Genie AI)
  '#2F6FE0', // Blue
  '#12A150', // Green / Growth
  '#798C5E', // Olive
  '#7FD6AE', // Mint
  '#4839C4', // Deep Purple
  '#F2A312', // Warning Amber
  '#E5484D', // Danger Red
];

export const getLoyaltyBaseUrl = (): string => API_CONFIG.BASE_URL || getHiSocietyBaseUrl();

/** GET a loyalty dashboard endpoint with the logged-in user's token (header + query, as the backend accepts either). */
export const fetchLoyalty = async <T = any>(endpoint: string, params: Record<string, string | undefined> = {}): Promise<T> => {
  const token = API_CONFIG.TOKEN;
  if (!token) throw new Error('You are not logged in. Please log in again to load the dashboard.');

  const response = await axios.get<T>(`${getLoyaltyBaseUrl()}${endpoint}`, {
    params: { token, ...params },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getLoyaltyErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return 'Your session has expired. Please log in again.';
    if (error.response) return `The server returned an error (${error.response.status}).`;
    return 'Could not reach the server. Check your connection and try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong while loading the dashboard.';
};

const pad = (n: number) => String(n).padStart(2, '0');
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export type DatePreset = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Last Month' | 'Custom';
export const DATE_PRESETS: DatePreset[] = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom'];

/** Local-date from/to range for a preset (Custom uses the supplied dates). */
export const getDateRange = (preset: DatePreset, custom?: { from: string; to: string }): { from?: string; to?: string } => {
  const today = new Date();
  if (preset === 'Today') return { from: toIsoDate(today), to: toIsoDate(today) };
  if (preset === 'Last 7 Days' || preset === 'Last 30 Days') {
    const past = new Date(today);
    past.setDate(today.getDate() - (preset === 'Last 7 Days' ? 6 : 29));
    return { from: toIsoDate(past), to: toIsoDate(today) };
  }
  if (preset === 'This Month') {
    return {
      from: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: toIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    };
  }
  if (preset === 'Last Month') {
    return {
      from: toIsoDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      to: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 0)),
    };
  }
  if (custom?.from && custom?.to) return { from: custom.from, to: custom.to };
  return {};
};

/** "2026-06" → "Jun 2026"; passes anything else through. */
export const formatMonth = (value: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value || '');
  if (!match) return value;
  return new Date(Number(match[1]), Number(match[2]) - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

export const fmtNum = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : '0';
};

export const getUserInitials = (): string => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return `${user?.firstname?.[0] ?? ''}${user?.lastname?.[0] ?? ''}`.toUpperCase();
  } catch {
    return '';
  }
};
