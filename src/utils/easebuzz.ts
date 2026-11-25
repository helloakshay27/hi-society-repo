// Easebuzz payment gateway is currently rolled out only on this frontend host.
// Gates both the org-level config card and the booking "Pay Now" button.
const EASEBUZZ_ENABLED_HOSTS = ["ui-hisociety.lockated.com"];

export const isEasebuzzEnabledHost = (): boolean =>
  typeof window !== "undefined" &&
  EASEBUZZ_ENABLED_HOSTS.includes(window.location.hostname);
