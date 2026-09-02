export type PageId = 'pgTraffic' | 'pgAdopt' | 'pgFlows';
export type DevicePlatform = 'all' | 'ios' | 'android';
export type TrendDirection = 'up' | 'dn' | 'flat';

export interface DashboardState {
  dev: DevicePlatform;
  prev: boolean;
  wf: string;
  bucket: string;
  page: PageId;
  ovTab: 'weekly' | 'monthly';
  range: number;
  rangeLabel: string;
  rangeFrom: string;
  rangeTo: string;
  project: string;
}

export interface KpiInfo {
  f: string; // Formula
  m: string; // Business meaning
}

export interface KpiTileProps {
  id?: string;
  label: string;
  val: string;
  dir?: TrendDirection;
  delta?: string | null;
  sub?: string;
  raw?: number;
  unit?: string;
  goodUp?: boolean;
  noTarget?: boolean;
  benchmark?: number | null;
  onBenchmarkChange?: (id: string, value: number | null) => void;
  isLoading?: boolean;
  infoKey?: string;
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
  greenTint: string;
  heatRgb: string;
  onHeat: string;
  heatA0: number;
  heatA1: number;
}
