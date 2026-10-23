export type ActivePage = 'pgTraffic' | 'pgAdopt' | 'pgFlows';

export type Device = 'all' | 'ios' | 'android';

export type AdminScope = 'all' | 'tower' | 'super';

export type UsageTab = 'visitors' | 'views' | 'sessions';

export interface WorkflowItem {
  key: string;
  name: string;
  bucket: string;
  steps: string[];
  adoption: number;
  completionRate: number;
  dropoffRate: number;
  avgTime: string;
  completions: string;
  incompleteNote?: string;
}

export interface TileData {
  label: string;
  val: string;
  dir?: 'up' | 'dn' | 'flat';
  delta?: string | null;
  sub?: string;
}

export interface DashboardState {
  dev: Device;
  scope: AdminScope;
  prev: boolean;
  wf: string;
  bucket: string;
  page: ActivePage;
  range: number;
  rangeLabel: string;
  rangeFrom: string;
  rangeTo: string;
  project: string;
  theme: 'light' | 'dark';
  navCollapsed: boolean;
}
