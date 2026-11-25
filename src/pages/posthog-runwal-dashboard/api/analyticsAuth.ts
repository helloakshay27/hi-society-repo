/**
 * The signed-in user's login token for the usage-analytics API (posthog-api.lockated.com), which checks
 * it on every request: `Authorization: Bearer <token>`. It is the JWT the login backend returns at login
 * (saved as `token`, as every other API call of this app sends it), signed with that backend's secret; the
 * analytics API verifies it with the same secret, so no other login or key is needed. Without it every
 * analytics call answers 401.
 */
export function analyticsToken(): string {
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token') ||
      ''
    );
  } catch {
    return '';
  }
}

/** `{ Authorization: 'Bearer …' }` when the user is signed in, else `{}`. */
export function analyticsAuthHeaders(): Record<string, string> {
  const token = analyticsToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
