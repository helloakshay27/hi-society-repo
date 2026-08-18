import React, { useEffect, useState } from 'react';
import { ChartCardShell } from './ChartCardShell';
import { ticketReportsAPI, TicketPerformanceResponse } from '@/services/ticketReportsAPI';
import { TicketsDashboardDateRange } from './types';

const DEFAULT_PRIORITIES = ['P1', 'P2', 'P3', 'P4', 'P5'];
const DEFAULT_BUCKETS = ['T1', 'T2', 'T3', 'T4', 'T5'];

interface TicketsAgeingMatrixCardProps {
  dateRange: TicketsDashboardDateRange;
  className?: string;
}

export const TicketsAgeingMatrixCard: React.FC<TicketsAgeingMatrixCardProps> = ({ dateRange, className }) => {
  const [data, setData] = useState<TicketPerformanceResponse['response']['ageing'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ticketReportsAPI
      .getPerformance({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setData(res.response.ageing);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  const matrix = data?.matrix ?? {};
  const priorities = Object.keys(matrix).length > 0 ? Object.keys(matrix) : DEFAULT_PRIORITIES;
  const buckets = priorities.length > 0 && matrix[priorities[0]] ? Object.keys(matrix[priorities[0]]) : DEFAULT_BUCKETS;

  return (
    <ChartCardShell title="Tickets Ageing Matrix" loading={loading} className={className}>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-brand-body-5">
            <thead>
              <tr className="bg-brand-bg">
                <th className="border border-brand-border p-2 text-left font-semibold text-brand-text">Priority</th>
                {buckets.map((bucket) => (
                  <th key={bucket} className="border border-brand-border p-2 text-center font-semibold text-brand-text">
                    {bucket}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {priorities.map((priority) => (
                <tr key={priority} className="bg-white">
                  <td className="border border-brand-border p-2 font-medium text-brand-text">{priority}</td>
                  {buckets.map((bucket) => (
                    <td key={bucket} className="border border-brand-border p-2 text-center text-brand-text">
                      {matrix[priority]?.[bucket] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-brand-bg p-4 text-center">
          <div className="text-brand-h2 font-bold text-brand-text">{data?.average_days ?? 0} days</div>
          <div className="text-brand-body-5 text-brand-text-light">Average Time Taken To Resolve A Ticket</div>
        </div>
      </div>
    </ChartCardShell>
  );
};
