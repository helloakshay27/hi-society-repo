import { fetchAllSites } from '@/features/posthog-dashboard/api/sitesApi';
import { useQuery } from '@tanstack/react-query';

export interface Site {
  id: string;
  name: string;
  companyId?: string;
  companyName?: string;
}

function ymd(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function dateRangeFor(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  return { from: ymd(from), to: ymd(to) };
}

export function useAllSites() {
  return useQuery({
    queryKey: ['all-sites'],
    queryFn: fetchAllSites,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: false
  });
}
