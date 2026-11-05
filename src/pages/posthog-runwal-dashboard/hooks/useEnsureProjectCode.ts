import { useEffect, useState } from 'react';
import { clearDashboardScope, pinDashboardScope, stripScopeFromUrl } from '../api/api';

/**
 * Pins a dedicated single-tenant dashboard's project_code in memory (and no app_id), before any data
 * hook mounts, and removes app_id / project_code from the browser URL so the code is never exposed.
 * Returns false (render nothing) until pinned.
 */
export function useEnsureProjectCode(projectCode: string): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pinDashboardScope({ projectCode });
    stripScopeFromUrl();
    setReady(true);
    return () => clearDashboardScope();
  }, [projectCode]);

  return ready;
}
