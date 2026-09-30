import { useRef } from 'react';
import { INFO } from '../data/constants';
import { useSmartSecureDashboard } from '../context/DashboardContext';

export function InfoButton({ infoKey }: { infoKey: string }) {
  const { infoPopover, openInfoPopover } = useSmartSecureDashboard();
  const btnRef = useRef<HTMLButtonElement>(null);
  if (!(infoKey in INFO)) return null;
  const isOpen = infoPopover?.key === infoKey;
  const showInfo = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) openInfoPopover(infoKey, rect);
  };

  return (
    <span className="info-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`info-btn${isOpen ? ' active' : ''}`}
        title="How this is calculated"
        aria-label="How this is calculated"
        aria-expanded={isOpen}
        aria-describedby={isOpen ? 'ss-info-popover' : undefined}
        onMouseEnter={showInfo}
        onFocus={showInfo}
        onClick={showInfo}
      >
        i
      </button>
    </span>
  );
}
