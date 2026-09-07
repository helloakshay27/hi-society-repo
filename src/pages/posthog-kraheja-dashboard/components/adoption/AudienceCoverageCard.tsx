import React, { useMemo } from 'react';
import { RoleStat } from '../../../posthog-runwal-dashboard/api/types';
import { Card } from '../../../posthog-runwal-dashboard/components/common/Card';
import { EmptyState } from '../../../posthog-runwal-dashboard/components/common/DashboardStates';

interface AudienceCoverageCardProps {
  roles: RoleStat[];
  isLoading?: boolean;
}

/**
 * Pre-Sales (prospects) vs. Post-Sales (homeowners) reference card — matches
 * the wireframe's "Pre-Sales vs. Post-Sales · reference (proposed)" card.
 * PROPOSED, reference-only, not a filter (same as the wireframe itself): the
 * connected PostHog project's role property has no confirmed enumerated
 * pre-sales/post-sales value, so this renders real matching roles when the
 * API happens to return them and an honest empty state otherwise — never
 * fabricated audience-split numbers.
 */
export const AudienceCoverageCard: React.FC<AudienceCoverageCardProps> = ({ roles, isLoading }) => {
  const preSalesRole = useMemo(() => roles.find((r) => /pre.?sales|prospect/i.test(r.role)), [roles]);
  const postSalesRole = useMemo(() => roles.find((r) => /post.?sales|homeowner|owner/i.test(r.role)), [roles]);

  return (
    <Card
      id="card-audienceCoverage"
      eyebrow="Pre-Sales vs. Post-Sales · reference (proposed)"
      title="Which audience is actually using the app"
      purpose="Reference card, not a filter, and PROPOSED rather than as-is. The connected project's role property has no confirmed pre-sales/post-sales distinction — this renders real role data only when the API happens to return matching values."
      style={{ marginTop: '12px' }}
    >
      <div className="bmnote crashnote" style={{ marginBottom: '14px' }}>
        <span>⚠</span>
        <div>
          <b>Proposed, not confirmed instrumentation.</b> There is no catalogue-documented boolean
          distinguishing prospects from homeowners in the connected PostHog project. The figures below only
          populate when the API's role data happens to include matching role names — this card does not
          drive any other number on the dashboard.
        </div>
      </div>

      {isLoading ? (
        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          Loading audience breakdown...
        </div>
      ) : !preSalesRole && !postSalesRole ? (
        <EmptyState
          message="No Pre-Sales / Post-Sales role data returned"
          sub="The connected project's role property doesn't currently include matching values."
        />
      ) : (
        <div className="kv" style={{ marginBottom: '16px' }}>
          <div>
            <div className="k">Pre-Sales — active users (proposed)</div>
            <div className="v" style={{ fontSize: '20px' }}>
              {preSalesRole ? preSalesRole.users.toLocaleString() : '—'}
            </div>
            <div className="u">{preSalesRole ? 'prospect-facing modules' : 'no matching role'}</div>
          </div>
          <div>
            <div className="k">Post-Sales — active users (proposed)</div>
            <div className="v" style={{ fontSize: '20px' }}>
              {postSalesRole ? postSalesRole.users.toLocaleString() : '—'}
            </div>
            <div className="u">{postSalesRole ? 'homeowner-servicing modules' : 'no matching role'}</div>
          </div>
        </div>
      )}
    </Card>
  );
};
