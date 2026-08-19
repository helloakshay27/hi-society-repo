import React from 'react';

interface TicketsKpiTileProps {
  label: string;
  value?: number;
  bg: string;
}

/** A single KPI tile. Rendered as its own grid item so it can be dragged/resized independently. */
export const TicketsKpiTile: React.FC<TicketsKpiTileProps> = ({ label, value, bg }) => (
  <div className={`flex h-full w-full flex-col justify-center rounded-lg border border-brand-border p-5 ${bg}`}>
    <div className="text-brand-caption font-semibold uppercase tracking-wide text-black">{label}</div>
    <div className="mt-2 text-brand-h1 font-bold text-black">{value ?? '—'}</div>
  </div>
);