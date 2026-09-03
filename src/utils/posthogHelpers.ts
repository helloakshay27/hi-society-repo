import posthog from "posthog-js";
import { getUser } from "@/utils/auth";
import { resolveProjectCode } from "@/utils/posthogContext";

const RELEASE_VERSION = (import.meta.env.VITE_APP_VERSION as string) ?? "dev";

/**
 * Fire a generic PostHog event with standard platform/release context.
 *
 * org -> company -> site -> email are read from localStorage, which is kept
 * in sync by Header.tsx (FM shell) and PulseDynamicHeader.tsx (Pulse shell) —
 * see those files' fetchAllowedCompanies/fetchAllowedSites effects. If a
 * given page hasn't mounted either shell yet this session, the corresponding
 * field is simply omitted rather than sent wrong.
 */
export const capturePostHogEvent = (
  event: string,
  props: Record<string, unknown> = {}
) => {
  const _siteId = localStorage.getItem("selectedSiteId") ?? localStorage.getItem("site_id");
  const _companyId = localStorage.getItem("selectedCompanyId") ?? localStorage.getItem("company_id");
  const siteIdNum = _siteId && !isNaN(Number(_siteId)) ? Number(_siteId) : undefined;
  const companyIdNum = _companyId && !isNaN(Number(_companyId)) ? Number(_companyId) : undefined;
  const _userId = localStorage.getItem("userId") ?? localStorage.getItem("user_id");
  const userIdNum = _userId && !isNaN(Number(_userId)) ? Number(_userId) : undefined;
  const _orgId = localStorage.getItem("selectedOrgId") ?? localStorage.getItem("organization_id") ?? localStorage.getItem("org_id");
  const orgIdNum = _orgId && !isNaN(Number(_orgId)) ? Number(_orgId) : undefined;

  posthog.capture(event, {
    platform: "web",
    release_version: RELEASE_VERSION,
    project_id: "P-223",
    project_code: resolveProjectCode(),
    organization_id: orgIdNum,
    organization_name: localStorage.getItem("selectedOrg") ?? undefined,
    company_id: companyIdNum,
    company_name: localStorage.getItem("selectedCompany") ?? undefined,
    site_id: siteIdNum,
    site_name: localStorage.getItem("selectedSiteName") ?? undefined,
    user_id: userIdNum,
    email: getUser()?.email ?? undefined,
    ...props,
  });
};

/**
 * Fire a Helpdesk product-analytics event with standard platform/release context.
 * Use this for all custom events defined in the Helpdesk Product Analytics Catalogue.
 */
export const captureHelpdeskEvent = (
  event: string,
  props: Record<string, unknown> = {}
) => {
  capturePostHogEvent(event, props);
};

/**
 * Fire a Runwal product-analytics event with static RunwalCPS project code.
 */
export const captureRunwalEvent = (
  event: string,
  props: Record<string, unknown> = {}
) => {
  capturePostHogEvent(event, { project_code: "RunwalCPS", ...props });
};

/**
 * Fire a Hi-Society product-analytics event with standard
 * platform/release context.
 */
export const captureHiSocietyEvent = (
  event: string,
  props: Record<string, unknown> = {}
) => {
  capturePostHogEvent(event, { project_code: "HS-01", ...props });
};

// Re-export standardized module tracking functions and catalogs
export * from "./posthogEvents";


