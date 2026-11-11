// Detail/add/edit pages that have no sidebar entry of their own, mapped to the
// sidebar item they belong to (first matching prefix wins).
const SMARTSECURE_ROUTE_ALIASES: [string, string][] = [
  ["/smartsecure/visitor/details", "/smartsecure/visitor-in"],
  ["/smartsecure/visitor-history", "/smartsecure/visitor-history-list"],
  ["/smartsecure/staff/", "/smartsecure/staff-all"],
  ["/smartsecure/vehicles/add", "/smartsecure/vehicles/history"],
  ["/smartsecure/patrolling/response", "/smartsecure/patrolling-response"],
  ["/smartsecure/response", "/smartsecure/patrolling-response"],
  ["/smartsecure/patrolling", "/smartsecure/petrolling"],
];

export const getSidebarEffectivePath = (pathname: string): string => {
  const alias = SMARTSECURE_ROUTE_ALIASES.find(([prefix]) =>
    pathname.startsWith(prefix)
  );
  return alias ? alias[1] : pathname;
};

export const isSidebarPathActive = (pathname: string, link?: string): boolean => {
  if (!link) return false;
  const matches = (p: string) => p === link || p.startsWith(link + "/");
  return matches(pathname) || matches(getSidebarEffectivePath(pathname));
};
