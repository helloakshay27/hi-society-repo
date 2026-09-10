import React from 'react';
import { CardDownloadButton } from './CardDownloadButton';

export type KpiTone = 'purple' | 'teal' | 'peach' | 'blue';

/** Soft pastel tones from FM Matrix /dashboard-revamp metric cards. */
export const KPI_TONE_BG: Record<KpiTone, string> = {
  purple: '#EFEFFB',
  teal: '#B7DCD44D',
  peach: '#CDCAF526',
  blue: '#85BDF633',
};

interface TicketsKpiTileProps {
  label: string;
  value?: number | string;
  tone?: KpiTone;
  className?: string;
  /** When set, renders a small XLSX download button in the tile's top-right corner. */
  onDownload?: () => Promise<void>;
}

/**
 * KPI tile matching FM Matrix /dashboard-revamp metric cards:
 * rounded-xl pastel surface, uppercase label, 22px bold value.
 */
export const TicketsKpiTile: React.FC<TicketsKpiTileProps> = ({
  label,
  value,
  tone = 'purple',
  className = '',
  onDownload,
}) => {
  return (
    <div
      className={`relative flex h-full w-full flex-col justify-center rounded-xl p-4 ${className}`}
      style={{ backgroundColor: KPI_TONE_BG[tone] }}
    >
      {onDownload && (
        <div className="absolute right-2 top-2">
          <CardDownloadButton label={`Download ${label}`} onDownload={onDownload} />
        </div>
      )}
      <div className="mb-1 pr-10 text-brand-caption font-medium uppercase tracking-wide text-black">
        {label}
      </div>
      <div className="text-[22px] font-bold leading-none text-brand-text">{value ?? '—'}</div>
    </div>
  );
};
