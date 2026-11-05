import { useEffect, useState } from 'react';
import { clearDashboardScope, pinDashboardScope, stripScopeFromUrl } from '../api/api';

/**
 * Pins a dedicated single-tenant dashboard's app_id in memory (see pinDashboardScope) before any
 * data hook mounts, and removes app_id / project_code from the browser URL so the code is never
 * exposed. Returns false (render nothing) until pinned.
 */
export function useEnsureAppId(appId: string): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pinDashboardScope({ appId });
    stripScopeFromUrl();
    setReady(true);
    return () => clearDashboardScope();
  }, [appId]);

  return ready;
}
