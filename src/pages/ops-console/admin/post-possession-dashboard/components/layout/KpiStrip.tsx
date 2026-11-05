import React from 'react';
import { KPI_STRIP } from '../../data/mockData';
import { useDashboard } from '../../context/DashboardContext';

export const KpiStrip: React.FC = () => {
  const { setActiveTab, openDrill, postPossessionApi } = useDashboard();
  const overview = postPossessionApi.overview;
  const kpis = overview?.endpoints.kpis;
  const topStrip =
    typeof kpis?.data === 'object' && kpis.data !== null && 'top_strip' in kpis.data
      ? kpis.data.top_strip
      : undefined;

  const getMetric = (path: string[]): unknown => {
    let value: unknown = topStrip;
    for (const key of path) {
      if (typeof value !== 'object' || value === null || !(key in value)) return undefined;
      value = (value as Record<string, unknown>)[key];
    }
    return value;
  };
  const format = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value)
      ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value)
      : value === null || value === undefined
        ? '—'
        : String(value);
  const metricNumber = (value: unknown, depth = 0): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    if (
      depth >= 3 ||
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value)
    ) {
      return null;
    }

    const record = value as Record<string, unknown>;
    for (const key of [
      'count',
      'total',
      'value',
      'visitors',
      'visitor_count',
      'visitors_in',
      'visitors_out',
      'in_count',
      'out_count',
      'entry_count',
      'exit_count',
      'number',
    ]) {
      const count = metricNumber(record[key], depth + 1);
      if (count !== null) return count;
    }
    return null;
  };
  const formatMetricNumber = (value: unknown) => {
    const count = metricNumber(value);
    return count === null ? '—' : format(count);
  };
  const apiError = kpis?.error;
  const getLiveKpi = (id: string) => {
    if (overview?.loading) return { value: '…', suffix: undefined, trend: 'Loading from API…' };
    if (apiError) return { value: '—', suffix: undefined, trend: `API error: ${apiError}` };
    if (!topStrip) return { value: '—', suffix: undefined, trend: 'Data Not Available' };

    switch (id) {
      case 'csat': {
        const result = getMetric(['possession_csat']);
        return typeof result === 'object' && result !== null && 'available' in result && result.available === false
          ? { value: '0', suffix: undefined, trend: 'Data Not Available' }
          : { value: format(result), suffix: '/5', trend: 'Resident feedback' };
      }
      case 'tickets': {
        const total = getMetric(['total_tickets', 'total']);
        return {
          value: format(total),
          suffix: undefined,
          trend: `${format(getMetric(['total_tickets', 'open']))} open · ${format(getMetric(['total_tickets', 'in_progress']))} in progress`,
        };
      }
      case 'resp': {
        const count = getMetric(['response_breached', 'count']);
        return {
          value: format(count),
          suffix: `/${format(getMetric(['response_breached', 'total']))}`,
          trend: `${format(getMetric(['response_breached', 'breach_rate_percent']))}% breach rate`,
        };
      }
      case 'visitors':
        return {
          value: format(getMetric(['visitors_today', 'total'])),
          suffix: undefined,
          trend: `${formatMetricNumber(getMetric(['visitors_today', 'in']))} in · ${formatMetricNumber(getMetric(['visitors_today', 'out']))} out`,
        };
      case 'pending-vis':
        return {
          value: format(getMetric(['pending_post_approval', 'count'])),
          suffix: undefined,
          trend: `${format(getMetric(['pending_post_approval', 'waiting_70_plus_min']))} waiting 70+ min`,
        };
      case 'club':
        return {
          value: format(getMetric(['club_active', 'active'])),
          suffix: `/${format(getMetric(['club_active', 'total']))}`,
          trend: `${format(getMetric(['club_active', 'pending_activation']))} pending activation`,
        };
      case 'fitout':
        return {
          value: format(getMetric(['fitout_pending', 'pending'])),
          suffix: undefined,
          trend: `${format(getMetric(['fitout_pending', 'closed_this_month']))} closed this month`,
        };
      default:
        return { value: '—', suffix: undefined, trend: 'Data Not Available' };
    }
  };

  return (
    <div
      className="kstrip"
      style={{ gridTemplateColumns: `repeat(${KPI_STRIP.length}, minmax(0, 1fr))` }}
    >
      {KPI_STRIP.map((item) => (
        (() => {
          const live = getLiveKpi(item.id);
          return (
            <div
              key={item.id}
              className={`ks-item alert ${item.alertClass}`}
              onClick={() => {
                setActiveTab(item.tabId);
                window.setTimeout(() => openDrill(item.drillKey), 120);
              }}
              role="button"
              tabIndex={0}
              title={apiError || undefined}
            >
              <div className="ks-label">{item.label}</div>
              <div className="ks-val">
                {live.value}
                {live.suffix && <em>{live.suffix}</em>}
              </div>
              <div className={`ks-trend ${item.trendClass}`}>{live.trend}</div>
            </div>
          );
        })()
      ))}
    </div>
  );
};
