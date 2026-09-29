import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Pins the current URL's `project_code` query param to a fixed value for a
 * dedicated single-tenant dashboard route and removes any conflicting `app_id`.
 */
export function useEnsureProjectCode(projectCode: string): boolean {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let changed = false;

    if (params.get('project_code') !== projectCode) {
      params.set('project_code', projectCode);
      changed = true;
    }
    // Remove app_id when project_code is active
    if (params.has('app_id')) {
      params.delete('app_id');
      changed = true;
    }

    if (changed) {
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      return;
    }
    setReady(true);
  }, [location.pathname, location.search, navigate, projectCode]);

  return ready;
}
