import React, { useMemo } from 'react';
import { RoleStat } from '../../../posthog-runwal-dashboard/api/types';
import { Card } from '../../../posthog-runwal-dashboard/components/common/Card';
import { EmptyState } from '../../../posthog-runwal-dashboard/components/common/DashboardStates';
import { AdminScope } from '../../data/wireframeData';

interface AdminTiersCardProps {
  roles: RoleStat[];
  isLoading?: boolean;
  adminScope: AdminScope;
}

/**
 * Tower Admin vs. Super Admin comparison — matches the wireframe's
 * "Admin tiers" card. PROPOSED scoping: the real PostHog role property does
 * not currently carry a confirmed tower-vs-society distinction (same caveat
 * the wireframe itself calls out), so this renders real matching roles when
 * the connected project's role values happen to include them, and an honest
 * empty state otherwise — never fabricated Tower/Super numbers.
 */
export const AdminTiersCard: React.FC<AdminTiersCardProps> = ({ roles, isLoading, adminScope }) => {
  const towerRole = useMemo(() => roles.find((r) => /tower/i.test(r.role)), [roles]);
  const superRole = useMemo(() => roles.find((r) => /super/i.test(r.role)), [roles]);

  const showTower = adminScope !== 'super';
  const showSuper = adminScope !== 'tower';

  return (
    <Card
      id="card-adminTiers"
      eyebrow="Admin tiers · proposed scoping"
      title="Tower Admin vs. Super Admin"
      purpose="Compares the two admin personas — Tower/wing admins (access limited to their own tower or wing) and Super admins (access to the whole society, all towers/wings). Use the Admin Scope filter above to isolate one tier."
      style={{ marginTop: '12px' }}
    >
      <div className="bmnote crashnote" style={{ marginBottom: '14px' }}>
        <span>⚠</span>
        <div>
          <b>Proposed scoping — not yet a confirmed event/property.</b> The connected PostHog project's role
          property does not currently distinguish a tower/wing-scoped admin from a society-wide super admin.
          The numbers below only populate when the API's role data happens to include matching role names —
          engineers would need to confirm the actual role values (or add a tower_id/wing_id property) for this
          to run reliably off real data.
        </div>
      </div>

      {isLoading ? (
        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          Loading admin role breakdown...
        </div>
      ) : !towerRole && !superRole ? (
        <EmptyState
          message="No Tower Admin / Super Admin role data returned"
          sub="The connected project's role property doesn't currently include matching values."
        />
      ) : (
        <div className="kv" style={{ marginBottom: '16px' }}>
          {showTower && (
            <div>
              <div className="k">Registered Tower Admins</div>
              <div className="v" style={{ fontSize: '20px' }}>
                {towerRole ? towerRole.users.toLocaleString() : '—'}
              </div>
              <div className="u">
                {towerRole ? `${Math.round((towerRole.active_share <= 1 ? towerRole.active_share * 100 : towerRole.active_share))}% active this period` : 'no matching role'}
              </div>
            </div>
          )}
          {showSuper && (
            <div>
              <div className="k">Registered Super Admins</div>
              <div className="v" style={{ fontSize: '20px' }}>
                {superRole ? superRole.users.toLocaleString() : '—'}
              </div>
              <div className="u">
                {superRole ? `${Math.round((superRole.active_share <= 1 ? superRole.active_share * 100 : superRole.active_share))}% active this period` : 'no matching role'}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
