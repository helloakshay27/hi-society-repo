import React from 'react';
import type { TileData } from '../data/types';
import { InfoPopover } from './InfoPopover';

interface TileProps extends TileData {
  className?: string;
}

export const Tile: React.FC<TileProps> = ({ label, val, dir, delta, sub, className = '' }) => {
  const arrowSym = dir === 'up' ? '▲' : dir === 'dn' ? '▼' : '—';

  return (
    <div className={`tile ${className}`}>
      <div className="tophead">
        <div className="lbl">{label}</div>
        <InfoPopover label={label} />
      </div>
      <div className="val">{val}</div>
      {delta != null && (
        <div className={`delta ${dir || 'flat'}`}>
          {arrowSym} {delta}
        </div>
      )}
      {sub && <div className="sub2">{sub}</div>}
    </div>
  );
};
