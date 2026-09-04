import React, { CSSProperties, ReactNode, useState, useRef, useEffect } from 'react';
import { InfoButton } from './InfoButton';

interface CardProps {
  id?: string;
  eyebrow?: string;
  title: string;
  infoKey?: string;
  purpose?: string;
  className?: string;
  style?: CSSProperties;
  headExtra?: ReactNode;
  children: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  id,
  eyebrow,
  title,
  infoKey,
  purpose,
  className = '',
  style,
  headExtra,
  children,
}) => {
  const [showPurpose, setShowPurpose] = useState(false);
  const purposeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (purposeRef.current && !purposeRef.current.contains(event.target as Node)) {
        setShowPurpose(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`card ${className}`.trim()} id={id} style={style}>
      <div className="card-head">
        <div className="charthead">
          <div>
            {eyebrow && <div className="cr">{eyebrow}</div>}
            <div className="ct">{title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {headExtra}
            {infoKey && <InfoButton infoKey={infoKey} />}
            {!infoKey && purpose && (
              <span
                className="info-wrap"
                ref={purposeRef}
                onMouseEnter={() => setShowPurpose(true)}
                onMouseLeave={() => setShowPurpose(false)}
              >
                <button
                  type="button"
                  className="info-btn"
                  onClick={() => setShowPurpose(!showPurpose)}
                  aria-label="Info"
                >
                  i
                </button>
                {showPurpose && (
                  <div className="info-pop" style={{ display: 'block' }}>
                    <div className="ipt">Purpose</div>
                    <div className="ipd">{purpose}</div>
                  </div>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
};

