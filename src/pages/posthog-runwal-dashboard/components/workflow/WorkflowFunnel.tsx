import React, { useState } from 'react';
import { FunnelStep } from '../../api/types';

interface WorkflowFunnelProps {
  funnel?: FunnelStep[];
}

export const WorkflowFunnel: React.FC<WorkflowFunnelProps> = ({ funnel = [] }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!funnel || funnel.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
        No funnel steps recorded for this workflow.
      </div>
    );
  }

  const maxReach = Math.max(...funnel.map((s) => s.reach || 0), 1);
  const firstStepReach = funnel[0]?.reach || maxReach;

  return (
    <div className="funnel" style={{ position: 'relative' }}>
      {funnel.map((s, i) => {
        const pct2 = Math.round((s.reach / maxReach) * 100);
        const overallConv = Math.round((s.reach / firstStepReach) * 100);
        const width = Math.max(35, Math.min(100, 35 + (pct2 / 100) * 65));
        const drop = s.drop_pct;
        const isHovered = hoverIdx === i;

        return (
          <React.Fragment key={s.step || i}>
            {i > 0 && drop != null && (
              <div
                className="fdrop"
                style={{
                  color: s.biggest ? 'var(--neg, #b3402c)' : 'var(--muted)',
                  fontWeight: s.biggest ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '2px 4px',
                }}
              >
                <span>▼ {Math.round(Math.abs(drop))}% drop-off</span>
                {s.biggest && (
                  <span
                    style={{
                      background: 'var(--red-tint, #f6e2dd)',
                      color: 'var(--neg, #b3402c)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    Biggest Friction Point
                  </span>
                )}
              </div>
            )}
            <div
              className="fstep"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                width: `${width}%`,
                background: s.biggest
                  ? 'var(--chart-violet, #7c6fd6)'
                  : isHovered
                  ? 'var(--blue, #2c7be5)'
                  : 'var(--blue, #2c7be5)',
                opacity: isHovered ? 1 : Math.max(0.55, 1 - i * 0.08),
                borderRadius: '8px',
                transform: isHovered ? 'scale(1.01)' : 'none',
                boxShadow: isHovered ? 'var(--shadow-pop, 0 6px 16px rgba(0,0,0,0.12))' : 'none',
                transition: 'all 0.18s ease',
                cursor: 'pointer',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>
                  {i + 1}. {s.step}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.22)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {s.reach.toLocaleString()} users
                </span>
              </div>
              <span className="fsub" style={{ opacity: 0.9, marginTop: '3px', fontSize: '11px' }}>
                {overallConv}% of initial users {i > 0 && drop != null && ` · ${Math.round(Math.abs(drop))}% drop from prior step`}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

