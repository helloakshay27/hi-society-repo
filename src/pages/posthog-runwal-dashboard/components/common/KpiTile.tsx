import React from 'react';
import { KpiTileProps } from '../../types';
import { InfoButton } from './InfoButton';

export const KpiTile: React.FC<KpiTileProps> = ({
  id,
  label,
  val,
  dir = 'flat',
  delta,
  sub,
  raw,
  unit = '',
  goodUp = true,
  noTarget = false,
  benchmark,
  onBenchmarkChange,
  isLoading = false,
  infoKey,
}) => {
  const arrowSym = dir === 'up' ? '▲' : dir === 'dn' ? '▼' : '—';
  const resolvedInfoKey = infoKey || id || label;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !onBenchmarkChange) return;
    const v = e.target.value.trim();
    onBenchmarkChange(id, v === '' ? null : parseFloat(v));
  };

  let targetBadge: React.ReactNode = null;
  if (!noTarget && id) {
    if (benchmark == null || isNaN(benchmark)) {
      targetBadge = <span className="bb unset">set a target</span>;
    } else if (raw != null) {
      const met = goodUp ? raw >= benchmark : raw <= benchmark;
      targetBadge = (
        <span className={`bb ${met ? 'met' : 'miss'}`}>
          {met ? '✓ on target' : '✕ off target'}
        </span>
      );
    }
  }

  if (isLoading) {
    return (
      <div className="tile loading-tile" style={{ minHeight: '120px' }}>
        <div className="tophead">
          <div className="lbl" style={{ opacity: 0.7 }}>{label}</div>
        </div>
        <div
          style={{
            height: '28px',
            width: '60%',
            background: 'var(--surface-3)',
            borderRadius: '4px',
            margin: '8px 0',
            animation: 'kpi-pulse 1.4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: '14px',
            width: '40%',
            background: 'var(--surface-3)',
            borderRadius: '3px',
            animation: 'kpi-pulse 1.4s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes kpi-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.9; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="tile" data-raw={raw} data-goodup={goodUp}>
      <div className="tophead">
        <div className="lbl">{label}</div>
        {resolvedInfoKey && <InfoButton infoKey={resolvedInfoKey} />}
      </div>

      <div className="val">{val}</div>

      {delta != null && (
        <div className={`delta ${dir}`}>
          {arrowSym} {delta}
        </div>
      )}

      {sub && <div className="sub2">{sub}</div>}

      {!noTarget && id && (
        <div className="bm">
          <span className="bl">Target</span>
          <input
            className="bmin"
            type="text"
            inputMode="decimal"
            value={benchmark != null && !isNaN(benchmark) ? benchmark : ''}
            onChange={handleInputChange}
            placeholder="—"
            title="Set your own target for this KPI"
          />
          {unit && <span className="bu">{unit}</span>}
          {targetBadge}
        </div>
      )}
    </div>
  );
};
