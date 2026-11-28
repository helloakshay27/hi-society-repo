// Email addresses and phone numbers are never part of the usage dashboards (28 Nov 2026): not shown, not in
// any people list, search, CSV or Excel download. The usage API no longer sends them; anything that still
// carries them (Hi Society's Manage Users answer, or an API not yet updated) has them dropped the moment it
// arrives, in the fetchers, so they never reach the page, its cache or a download.

const CONTACT_KEYS = ['email', 'mobile', 'phone', 'mobile_number', 'phone_number', 'alternate_email1', 'alternate_email2'] as const;

/** The same object without any email or phone field. */
export function withoutContact<T extends object>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const out: any = { ...row };
  for (const k of CONTACT_KEYS) delete out[k];
  return out as T;
}
