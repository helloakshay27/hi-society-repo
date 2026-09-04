import { useCallback, useState } from 'react';
import { DRILL_CONTENT } from '../data/drillContent';

export function useDrillPanel(onAction?: (message: string, type?: 'd' | 'ok' | 'w' | 'e') => void) {
  const [drillKey, setDrillKey] = useState<string | null>(null);

  const openDrill = useCallback((key: string) => {
    setDrillKey(key);
  }, []);

  const closeDrill = useCallback(() => {
    setDrillKey(null);
  }, []);

  const content = drillKey ? DRILL_CONTENT[drillKey] ?? DRILL_CONTENT.default : null;

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
    closeDrill,
    handleFooterAction,
  };
}
