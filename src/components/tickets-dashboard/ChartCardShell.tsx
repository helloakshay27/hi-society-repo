import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ChartCardShellProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  rightSlot?: React.ReactNode;
}

export const SampleDataBadge: React.FC = () => (
  <span className="flex-shrink-0 whitespace-nowrap rounded-full bg-brand-warning-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8A5A00]">
    Sample data
  </span>
);

/** Chart card shell matching FM Matrix /dashboard-revamp white analytics cards. */
export const ChartCardShell: React.FC<ChartCardShellProps> = ({
  title,
  subtitle,
  loading = false,
  error = null,
  children,
  className = '',
  rightSlot,
}) => {
  return (
    <Card
      className={`flex h-full flex-col rounded-xl border border-brand-border bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-brand-body-4 font-bold text-brand-text">{title}</CardTitle>
            {subtitle && <p className="mt-0.5 text-brand-body-5 text-brand-text-light">{subtitle}</p>}
          </div>
          {rightSlot}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full min-h-48 items-center justify-center text-brand-text-light">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-1 text-center text-brand-body-5 text-brand">
            <span>Failed to load this card.</span>
            <span className="text-brand-text-light">{error}</span>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};
