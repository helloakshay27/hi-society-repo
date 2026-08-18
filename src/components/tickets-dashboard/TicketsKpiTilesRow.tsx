import React, { useEffect, useState } from 'react';
import { ticketReportsAPI, TicketOverviewResponse } from '@/services/ticketReportsAPI';
import { TicketsDashboardDateRange } from './types';

interface TicketsKpiTilesRowProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

export const TicketsKpiTilesRow: React.FC<TicketsKpiTilesRowProps> = ({ dateRange, className = '' }) => {
  const [data, setData] = useState<TicketOverviewResponse['response'] | null>(null);

  useEffect(() => {
    let cancelled = false;
    ticketReportsAPI
      .getOverview({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setData(res.response);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  const tiles = [
    { label: 'Open Tickets', value: data?.ticket_status.total_open, bg: 'bg-brand-purple-bg' },
    { label: 'Closed Tickets', value: data?.ticket_status.total_closed, bg: 'bg-brand-teal-bg' },
    { label: 'Total Tickets', value: data?.total_tickets, bg: 'bg-brand-error-bg' },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className={`rounded-lg border border-brand-border p-5 ${tile.bg}`}>
            <div className="text-brand-caption font-semibold uppercase tracking-wide text-brand-text-light">{tile.label}</div>
            <div className="mt-2 text-brand-h1 font-bold text-brand-text">{tile.value ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
