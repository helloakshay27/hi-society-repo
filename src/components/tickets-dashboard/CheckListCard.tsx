import React from 'react';
import { ChartCardShell } from './ChartCardShell';
import { ACHIEVED_COLOR, BREACHED_COLOR } from './colors';

// No checklist API exists yet — show zeros rather than fabricated numbers
// until this is wired to a real endpoint.
const total = 0;
const completed = 0;
const pending = 0;

export const CheckListCard: React.FC<{ className?: string }> = ({ className }) => {
  const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <ChartCardShell
      title="CheckList"
      subtitle="Checklist compliance linked to tickets"
      className={className}
    >
      <div className="space-y-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-brand-bg">
          <div className="h-full rounded-full" style={{ width: `${completedPercent}%`, background: ACHIEVED_COLOR }} />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-brand-h2 font-bold text-brand-text">{total}</div>
            <div className="text-brand-body-5 text-brand-text-light">Total</div>
          </div>
          <div>
            <div className="text-brand-h2 font-bold" style={{ color: ACHIEVED_COLOR }}>
              {completed}
            </div>
            <div className="text-brand-body-5 text-brand-text-light">Completed</div>
          </div>
          <div>
            <div className="text-brand-h2 font-bold" style={{ color: BREACHED_COLOR }}>
              {pending}
            </div>
            <div className="text-brand-body-5 text-brand-text-light">Pending</div>
          </div>
        </div>
      </div>
    </ChartCardShell>
  );
};
