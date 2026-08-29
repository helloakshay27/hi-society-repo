import React from 'react';
import { RetentionCohort } from '../../api/types';

interface RetentionCohortTableProps {
  cohorts?: RetentionCohort[];
}

export const RetentionCohortTable: React.FC<RetentionCohortTableProps> = ({ cohorts = [] }) => {
  if (!cohorts || cohorts.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
        No retention cohorts available for this period.
      </div>
    );
  }

  // Find max weeks present across cohorts (week0..week7)
  const maxWeeks = 8;
  const weekCols = Array.from({ length: maxWeeks }, (_, i) => `week${i}`);

  return (
    <div className="tbl-wrap">
      <table className="rt">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Cohort</th>
            <th style={{ textAlign: 'center' }}>Size</th>
            {weekCols.map((_, w) => (
              <th key={w}>W{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c, i) => {
            const label = c.cohort_week || `Cohort ${i + 1}`;
            return (
              <tr key={i}>
                <td className="lbl" style={{ fontWeight: 500 }}>
                  {label}
                </td>
                <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
                  {c.size ? c.size.toLocaleString() : '—'}
                </td>
                {weekCols.map((wkKey, w) => {
                  const rawVal = c[wkKey];
                  if (rawVal === null || rawVal === undefined || rawVal === '') {
                    return (
                      <td
                        key={w}
                        style={{
                          background: 'var(--surface-2)',
                          color: 'var(--faint)',
                          textAlign: 'center',
                        }}
                      >
                        ·
                      </td>
                    );
                  }

                  let num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));
                  if (isNaN(num)) {
                    return (
                      <td key={w} style={{ textAlign: 'center' }}>
                        ·
                      </td>
                    );
                  }

                  // If returned as decimal <= 1, convert to percentage 0-100
                  const pctVal = num <= 1 && num > 0 ? Math.round(num * 100) : Math.round(num);
                  const t = Math.min(1, Math.max(0, pctVal / 100));
                  const bg = `rgba(var(--heat-rgb), ${(0.09 + t * 0.78).toFixed(2)})`;
                  const col = t > 0.55 ? 'var(--on-heat)' : 'var(--ink)';

                  return (
                    <td key={w} style={{ background: bg, color: col, textAlign: 'center', fontWeight: 500 }}>
                      {pctVal}%
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
