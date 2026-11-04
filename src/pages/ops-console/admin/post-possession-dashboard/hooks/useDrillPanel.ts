import { useCallback, useState } from 'react';
import { DRILL_CONTENT } from '../data/drillContent';
import type { DrillContent } from '../types';

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

  const content = drillKey
    ? liveContent ?? DRILL_CONTENT[drillKey] ?? DRILL_CONTENT.default
    : null;

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
