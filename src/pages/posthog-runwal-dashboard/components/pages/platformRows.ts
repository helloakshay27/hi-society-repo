// Rows of the Device / platform split card (Runwal issues 5461 / 5462). The API's platform_usage counts
// each active user once, on the platform they used last, so the platforms' users add up to Active Users.
// Each share is platform users ÷ active users × 100: the formula in the card's (i).
import type { UsageDistributionResponse } from '../../api/types';

export interface PlatformRow {
  platform: string;
  users: number;
  share: number;
}

export function platformRows(usage?: UsageDistributionResponse | null): {
  rows: PlatformRow[];
  totalUsers: number;
  /** "= Android 4,405 + iOS 2,077": how the active users split. */
  sumLabel: string;
} {
  const pu = usage?.platform_usage;
  const total = pu?.total_users || 0;
  if (!pu || !Array.isArray(pu.platforms) || total <= 0) return { rows: [], totalUsers: 0, sumLabel: '' };

  const rows: PlatformRow[] = pu.platforms.map((p) => ({
    platform: p.platform,
    users: p.users || 0,
    share: ((p.users || 0) / total) * 100,
  }));
  // Android and iOS always show, at 0 when nobody used one in the period (or the other is toggled).
  for (const name of ['Android', 'iOS']) {
    if (!rows.some((r) => r.platform === name)) rows.push({ platform: name, users: 0, share: 0 });
  }
  const sumLabel = `= ${rows.map((r) => `${r.platform} ${r.users.toLocaleString()}`).join(' + ')}`;
  return { rows, totalUsers: total, sumLabel };
}
