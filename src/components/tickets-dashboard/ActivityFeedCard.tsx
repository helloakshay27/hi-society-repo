import React, { useEffect, useState } from 'react';
import { ChartCardShell } from './ChartCardShell';
import { ticketAnalyticsAPI, RecentTicket } from '@/services/ticketAnalyticsAPI';

interface ActivityFeedCardProps {
  className?: string;
}

export const ActivityFeedCard: React.FC<ActivityFeedCardProps> = ({ className }) => {
  const [tickets, setTickets] = useState<Partial<RecentTicket>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ticketAnalyticsAPI
      .getRecentTickets()
      .then((res) => {
        if (!cancelled) setTickets(res.complaints ?? []);
      })
      .catch(() => {
        if (!cancelled) setTickets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ChartCardShell
      title="Activity Feed"
      subtitle="Most recently updated tickets"
      loading={loading}
      className={className}
    >
      {tickets.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-brand-body-5 text-brand-text-light">
          No recent tickets for the selected date range.
        </div>
      ) : (
      <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="flex items-start justify-between gap-3 rounded-md border border-brand-border/60 px-3 py-2 hover:bg-brand-selected"
          >
            <div className="min-w-0">
              <div className="truncate text-brand-body-4 font-semibold text-brand-text">{ticket.heading}</div>
              <div className="mt-0.5 text-brand-body-5 text-brand-text-light">
                #{ticket.ticket_number} &middot; {ticket.category_type || 'Uncategorized'} &middot; {ticket.site_name}
              </div>
            </div>
            <span
              className="flex-shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{
                background: `${ticket.status?.color_code ?? '#C4B89D'}22`,
                color: ticket.status?.color_code ?? '#888780',
              }}
            >
              {ticket.status?.name ?? ticket.issue_status}
            </span>
          </div>
        ))}
      </div>
      )}
    </ChartCardShell>
  );
};
