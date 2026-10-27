/** Default chart shapes per chart id; real data is always passed in via chartDataOverride. */
export const CD: Record<string, any> = {
  trend: { labels: [], multi: true, datasets: [], h: false, def: 'bar' },
  tiers: { labels: [], values: [], colors: [], h: false, def: 'doughnut' },
  rulecat: { labels: [], values: [], colors: [], h: false, def: 'bar' },
  dailyfires: { labels: [], values: [], colors: [], h: false, def: 'line' },
  tierdist: { labels: [], values: [], colors: [], h: false, def: 'doughnut' },
  newmem: { labels: [], values: [], colors: [], h: false, def: 'bar' },
  redtype: { labels: [], values: [], colors: [], h: false, def: 'doughnut' },
  redtrend: { labels: [], values: [], colors: [], h: false, def: 'line' },
  walletflow: { labels: [], multi: true, datasets: [], h: false, def: 'bar' },
  orderage: { labels: [], values: [], colors: [], h: false, def: 'bar' },
  orderstatus: { labels: [], values: [], colors: [], h: false, def: 'doughnut' },
  funnel: { labels: [], multi: true, datasets: [], h: true, def: 'bar' },
  catmix: { labels: [], values: [], colors: [], h: false, def: 'doughnut' },
};
