/**
 * Shared request scoping for the Hi-Society FM report APIs behind the Tickets
 * Dashboard (tickets / escalation / visitor / utility tabs).
 *
 * Reports are scoped by `society_id` only — `site_id` is intentionally not
 * sent, so a report always covers the whole society in the user's current
 * context regardless of any site switcher selection.
 */

/** Current `society_id` for report calls. */
export const getReportSocietyId = (): string | null =>
  localStorage.getItem('selectedSocietyId') || localStorage.getItem('selectedUserSociety') || null;

/** `{ society_id? }` scope params shared by every Tickets Dashboard report call. */
export const getDynamicScopeParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  const societyId = getReportSocietyId();
  if (societyId) params.society_id = societyId;
  return params;
};
