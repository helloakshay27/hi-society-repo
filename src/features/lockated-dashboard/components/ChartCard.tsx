import React from 'react';
import { InfoPopover } from './InfoPopover';

interface ChartCardProps {
  eyebrow: string;
  title: string;
  purpose?: string;
  description?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  eyebrow,
  title,
  purpose,
  description,
  headerRight,
  children,
  className = '',
  style
}) => {
  return (
    <div className={`card ${className}`} style={style}>
      <div className="card-head">
        <div className="charthead">
          <div>
            <div className="cr">{eyebrow}</div>
            <div className="ct">{title}</div>
            {description && <div className="cd">{description}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {headerRight}
            {purpose && <InfoPopover purpose={purpose} />}
          </div>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
};
