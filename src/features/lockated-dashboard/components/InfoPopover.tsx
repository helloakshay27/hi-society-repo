import React, { useState } from 'react';
import { getKpiInfo } from '../data/kpiInfo';

interface InfoPopoverProps {
  label?: string;
  purpose?: string;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({ label, purpose }) => {
  const [isOpen, setIsOpen] = useState(false);

  const info = label ? getKpiInfo(label) : null;

  return (
    <span
      className={`info-wrap ${isOpen ? 'is-open' : ''}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="info-btn"
        aria-label={label ? `Information about ${label}` : 'Card purpose information'}
        title="Hover to view details"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        i
      </button>
      <div className="info-pop" role="tooltip">
        {purpose ? (
          <div>
            <b>Purpose</b>
            {purpose}
          </div>
        ) : info ? (
          <div>
            <b>Formula</b>
            {info.f}
            <div className="sep">
              <b>Business meaning</b>
              {info.m}
            </div>
          </div>
        ) : (
          <div>
            <b>Information</b>
            {label || 'Metrics & parameters for this view.'}
          </div>
        )}
      </div>
    </span>
  );
};
