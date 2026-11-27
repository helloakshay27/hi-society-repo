import React from 'react';
import type { PreviousCoverage } from '../../data/previousPeriod';

/** One line under the filter bar when the previous period has no data, or only part of it. */
export const PreviousPeriodNote: React.FC<{ coverage: PreviousCoverage }> = ({ coverage }) =>
  coverage.note ? (
    <div className={`prev-note prev-note-${coverage.state}`} role="note">
      <span className="ic" aria-hidden="true">ⓘ</span> {coverage.note}
    </div>
  ) : null;
