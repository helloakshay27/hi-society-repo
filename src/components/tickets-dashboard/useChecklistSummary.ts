import { useEffect, useState } from 'react';
import { ChecklistSummary, hiSocietyLegacyCardsAPI } from '@/services/hiSocietyLegacyCardsAPI';
import { TicketsDashboardDateRange } from './types';

export interface ChecklistSummaryState {
  summary: ChecklistSummary | null;
  loading: boolean;
  error: string | null;
}

/** Checklist status totals for the Checklist tab, from the legacy summary endpoint. */
export const useChecklistSummary = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): ChecklistSummaryState => {
  const [state, setState] = useState<ChecklistSummaryState>({
    summary: null,
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    hiSocietyLegacyCardsAPI
      .getChecklistSummary({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((summary) => {
        if (!cancelled) setState({ summary, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            summary: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load checklist',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  // Treat "enabled but not yet settled" as loading so the tab doesn't flash an empty state
  // before the effect starts the request.
  const loading = enabled && (state.loading || (state.summary == null && state.error == null));

  return { ...state, loading: enabled ? loading : false };
};
