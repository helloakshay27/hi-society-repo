// Email addresses and phone numbers are never shown in full on the usage dashboards: the first two and the
// last two characters stay, everything between is masked. "suyash@example.com" -> "su**************om",
// "9876543210" -> "98******10". Applied where the data comes in (the API fetchers and the Hi Society account
// rows), so tables, people lists, searches and CSV downloads only ever hold the masked value.

/** The value with all but its first 2 and last 2 characters masked; a value of 4 characters or fewer is fully masked. */
export function maskContact(value: string | null | undefined): string {
  const v = (value ?? '').trim();
  if (!v) return '';
  if (v.length <= 4) return '*'.repeat(v.length);
  return `${v.slice(0, 2)}${'*'.repeat(v.length - 4)}${v.slice(-2)}`;
}

/** The same object with its `email` (and `mobile`, when present) masked. */
export function maskPerson<T extends { email?: string | null; mobile?: string | null }>(p: T): T {
  if (!p) return p;
  const out = { ...p };
  if ('email' in out) out.email = maskContact(out.email) as T['email'];
  if ('mobile' in out) out.mobile = maskContact(out.mobile) as T['mobile'];
  return out;
}
