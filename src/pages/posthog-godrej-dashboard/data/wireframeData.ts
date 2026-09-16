/**
 * Godrej Living · Analytics Dashboard — UI-only labels specific to this
 * tenant's dashboard that don't exist in the shared Runwal component
 * library. All actual metric formatting/KPI-info dictionaries are reused
 * directly from ../../posthog-runwal-dashboard/data/constants — no data
 * fabrication happens in this file.
 */

export type AdminScope = 'all' | 'tower' | 'super';

export const SCOPE_LABELS: Record<AdminScope, string> = {
  all: 'Residents & society admins · all societies',
  tower: 'Residents & Tower Admins · one tower/wing (proposed scoping)',
  super: 'Residents & Super Admins · whole society (proposed scoping)',
};
