import { useMemo } from 'react';
import { getChartsForTab } from '../charts/chartConfigs';

export function useCharts(tabId: string, initializedTabs: Set<string>) {
  const shouldRender = initializedTabs.has(tabId);

  const charts = useMemo(() => {
    if (!shouldRender) return {};
    return getChartsForTab(tabId);
  }, [tabId, shouldRender]);

  return { charts, shouldRender };
}
