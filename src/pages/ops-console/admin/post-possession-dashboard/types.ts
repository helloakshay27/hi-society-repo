import type { ChartConfiguration } from 'chart.js';
import type { LucideIcon } from 'lucide-react';

export type TabId =
  | 't-lb'
  | 't-ov'
  | 't-op'
  | 't-sc'
  | 't-st'
  | 't-cl'
  | 't-ft'
  | 't-pk'
  | 't-co';

export type ToastType = 'd' | 'ok' | 'w' | 'e';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface InfoTooltipContent {
  what: string;
  formula?: string;
  note?: string;
}

export interface DrillContent {
  t: string;
  s?: string;
  b: string;
  f?: string;
}

export interface KpiStripItem {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  trend: string;
  trendClass: 'up' | 'dn' | 'ok' | 'wa' | 'nt';
  alertClass: 'alert-r' | 'alert-a' | 'alert-g';
  tabId: TabId;
  drillKey: string;
}

export interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'a' | 'ok';
}

export interface FilterChipConfig {
  key: string;
  label: string;
  chipClass: string;
  tabId: TabId;
  drillKey: string;
  flashId?: string;
}

export type DateGrain = 'today' | 'week' | 'month' | 'range';

export interface ChartDefinition {
  id: string;
  config: ChartConfiguration;
}

export interface DashboardEvent {
  time: string;
  title: string;
  sub: string;
  domain: string;
  color: string;
  drill: string;
}

export interface DirectoryVendor {
  company: string;
  cat: string;
  status: 'Active' | 'Inactive';
}
