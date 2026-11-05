import { useCallback, useState } from 'react';
import type { DrillContent } from '../types';

const NO_LIVE_DETAILS: DrillContent = {
  t: 'Details not available yet',
  s: 'No live detail view is connected for this card',
  b: '<div class="dsec"><div style="font-size:11px;line-height:1.7;background:var(--surface);padding:10px;border-radius:8px">This card\'s numbers come from the live API, but its detailed breakdown is not available yet. Use the filter chips above for live breakdowns.</div></div>',
};

export function useDrillPanel(onAction?: (message: string, type?: 'd' | 'ok' | 'w' | 'e') => void) {
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const [liveContent, setLiveContent] = useState<DrillContent | null>(null);

  const openDrill = useCallback((key: string) => {
    setLiveContent(null);
    setDrillKey(key);
  }, []);

  /** Open the panel with content built at runtime (e.g. from API data). */
  const openLiveDrill = useCallback((next: DrillContent) => {
    setLiveContent(next);
    setDrillKey('__live__');
  }, []);

  const closeDrill = useCallback(() => {
    setDrillKey(null);
    setLiveContent(null);
  }, []);

  // Only live (API-built) content is shown. Cards without a live detail view get a notice
  // rather than the sample figures that used to ship in the static drill content.
  const content = drillKey ? liveContent ?? NO_LIVE_DETAILS : null;

  const handleFooterAction = useCallback(
    (action: string) => {
      if (action === 'toast' && onAction) {
        onAction('Action completed', 'ok');
      }
    },
    [onAction]
  );

  return {
    drillKey,
    isOpen: drillKey !== null,
    content,
    openDrill,
    openLiveDrill,
    closeDrill,
    handleFooterAction,
  };
}
