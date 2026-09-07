import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Pins the current URL's `app_id` query param to a fixed value for a
 * dedicated single-tenant dashboard route. Every PostHog/FM Matrix API call
 * in this product family reads `app_id` straight off `window.location.search`
 * (see `getAppIdFromUrl()` in `api/api.ts`), so the URL must carry the right
 * value *before* any data-fetching hook mounts. Returns `false` (render
 * nothing) until the URL has been corrected, then `true` once it's pinned.
 */
export function useEnsureAppId(appId: string): boolean {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('app_id') !== appId) {
      params.set('app_id', appId);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      return;
    }
    setReady(true);
  }, [location.pathname, location.search, navigate, appId]);

  return ready;
}
