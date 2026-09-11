import React from 'react';
import { KPI_TONE_BG } from './TicketsKpiTilesRow';

interface AssetAmcCardProps {
  underAmc?: number;
  missingAmc?: number;
  className?: string;
}

/**
 * AMC Assets tile — the one KPI on the FM Matrix Analytics tab that shows two
 * numbers side by side ("Assets Under AMC" / "Assets Missing AMC"), so it can't
 * reuse the single-value `TicketsKpiTile`.
 */
export const AssetAmcCard: React.FC<AssetAmcCardProps> = ({
  underAmc,
  missingAmc,
  className = '',
}) => {
  return (
    <div
      className={`relative flex h-full w-full flex-col justify-center rounded-xl p-5 ${className}`}
      style={{ backgroundColor: KPI_TONE_BG.blue }}
    >
      <div className="mb-2 text-brand-body-4 font-medium uppercase tracking-wide text-black">
        AMC Assets
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="border-r border-brand-divider pr-3">
          <div className="mb-1 text-brand-body-5 text-brand-text-light">Under AMC</div>
          <div className="text-[30px] font-bold leading-none text-brand-text sm:text-[38px]">
            {underAmc != null ? underAmc.toLocaleString() : '—'}
          </div>
        </div>
        <div className="pl-1">
          <div className="mb-1 text-brand-body-5 text-brand-text-light">Missing AMC</div>
          <div className="text-[30px] font-bold leading-none text-brand-text sm:text-[38px]">
            {missingAmc != null ? missingAmc.toLocaleString() : '—'}
          </div>
        </div>
      </div>
    </div>
  );
};
