import { useEffect, useState } from 'react';
import { hiSocietyLegacyCardsAPI } from '@/services/hiSocietyLegacyCardsAPI';

export interface LegacyIncidentMetrics {
  ltir: number | null;
  safeManHours: number | null;
  nearMiss: number | null;
  loading: boolean;
}

const EMPTY: LegacyIncidentMetrics = {
  ltir: null,
  safeManHours: null,
  nearMiss: null,
  loading: false,
};

/**
 * LTIR, Safe Man Hours, and Near Miss / Good Catch.
 * These three endpoints ignore the dashboard date range.
 */
export const useLegacyIncidentMetrics = (enabled = true): LegacyIncidentMetrics => {
  const [metrics, setMetrics] = useState<LegacyIncidentMetrics>(EMPTY);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setMetrics((prev) => ({ ...prev, loading: true }));

    Promise.allSettled([
      hiSocietyLegacyCardsAPI.getLtir(),
      hiSocietyLegacyCardsAPI.getSafeManHours(),
      hiSocietyLegacyCardsAPI.getNearMiss(),
    ]).then(([ltir, safeManHours, nearMiss]) => {
      if (cancelled) return;
      setSettled(true);
      setMetrics({
        ltir: ltir.status === 'fulfilled' ? ltir.value.value : null,
        safeManHours: safeManHours.status === 'fulfilled' ? safeManHours.value.value : null,
        nearMiss: nearMiss.status === 'fulfilled' ? nearMiss.value.value : null,
        loading: false,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { ...metrics, loading: enabled && !settled };
};
