import React, { useRef } from 'react';
import { INFO } from '../../data/constants';
import { useDashboard } from '../../context/DashboardContext';

export interface InfoButtonProps {
  infoKey: string;
}

export const InfoButton: React.FC<InfoButtonProps> = ({ infoKey }) => {
  const { infoPopover, openInfoPopover, closeInfoPopover } = useDashboard();
  const btnRef = useRef<HTMLButtonElement>(null);

  // Only render button if info exists for this key
  if (!infoKey || !(infoKey in INFO)) return null;

  const isOpen = infoPopover?.key === infoKey;

  return (
    <button
      ref={btnRef}
      type="button"
      className={`info-btn ${isOpen ? 'active' : ''}`}
      title="How this is calculated"
      aria-label="How this is calculated"
      onClick={(e) => {
        e.stopPropagation();
        if (isOpen) {
          closeInfoPopover();
          return;
        }
        if (btnRef.current) {
          const rect = btnRef.current.getBoundingClientRect();
          openInfoPopover(infoKey, rect);
        }
      }}
    >
      i
    </button>
  );
};
