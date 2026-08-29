import React, { useState, useRef, useEffect } from 'react';

interface CardProps {
  id?: string;
  eyebrow?: string;
  title: string;
  purpose?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  id,
  eyebrow,
  title,
  purpose,
  style,
  children,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="card" id={id} style={style}>
      <div className="card-head">
        <div className="charthead">
          <div>
            {eyebrow && <div className="cr">{eyebrow}</div>}
            <div className="ct">{title}</div>
          </div>
          {purpose && (
            <span
              className="info-wrap"
              ref={infoRef}
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
            >
              <button
                type="button"
                className="info-btn"
                onClick={() => setShowInfo(!showInfo)}
                aria-label="Info"
              >
                i
              </button>
              {showInfo && (
                <div className="info-pop">
                  <b>Purpose</b>
                  {purpose}
                </div>
              )}
            </span>
          )}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
};
