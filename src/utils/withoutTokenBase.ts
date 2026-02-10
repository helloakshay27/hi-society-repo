import axios from "axios";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { getBaseUrl } from "@/utils/auth";

// Organization type for API response
interface Organization {
  id: number;
  name: string;
  backend_domain: string;
  frontend_domain: string;
  active: boolean;
}

// Create configured axios instance
// Don't set default Content-Type to allow FormData to set its own headers
export const baseClient = axios.create({});

baseClient.interceptors.request.use(
  async (config) => {
    try {
      // If baseURL is already set (e.g. per-request override), respect it
      if (config.baseURL && config.baseURL !== "undefined" && config.baseURL !== "") {
        console.log("🎯 Using pre-set Base URL:", config.baseURL);
        return config;
      }
      // Check if running locally
      const hostname = window.location.hostname;
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      const email = urlParams.get("email");
      const organizationId = urlParams.get("organization_id");
      const orgId = urlParams.get("org_id");

      // If org_id is present in URL, this takes priority over logged-in state
      // This allows public survey access even when user is logged in
      const hasOrgIdParam = !!(organizationId || orgId);

      // If NO org_id parameter, use cached/stored URLs
      // if (!hasOrgIdParam) {
      //   // Check session cache first to avoid re-fetching
      //   const cachedBaseUrl = sessionStorage.getItem('apiBaseUrl');
      //   if (cachedBaseUrl) {
      //     config.baseURL = cachedBaseUrl;
      //     console.log("✅ Base URL set from session cache:", cachedBaseUrl);
      //     return config;
      //   }

      //   // First preference: use base URL saved via auth utilities (e.g., Mobile pages)
      //   try {
      //     const storedBaseUrl = getBaseUrl();
      //     if (storedBaseUrl) {
      //       config.baseURL = storedBaseUrl;
      //       sessionStorage.setItem('apiBaseUrl', storedBaseUrl);
      //       console.log("✅ Base URL set from stored baseUrl:", storedBaseUrl);
      //       return config;
      //     }
      //   } catch (storageError) {
      //     console.warn("⚠️ Unable to read stored baseUrl:", storageError);
      //   }
      // } else {
      //   console.log("🔓 org_id parameter detected - fetching organization data:", organizationId || orgId);
      // }

      // Store token in session storage if available
      if (token) {
        sessionStorage.setItem("token", token);
        console.log("✅ Token stored in session storage");
      }

      // Determine site type based on hostname
      const isOmanSite = hostname.includes("oig.gophygital.work");
      const isViSite =
        hostname.includes("vi-web.gophygital.work") ||
        hostname.includes("web.gophygital.work") ||
        hostname.includes("lockated.gophygital.work");
      const isFmSite =
        hostname === "fm-uat.gophygital.work" ||
        hostname === "fm.gophygital.work" ||
        hostname === "fm-matrix.lockated.com" ||
        hostname === "localhost";
      const isClubSite =
        hostname.includes("club-uat-api.lockated.com") ||
        hostname.includes("club.lockated.com");

      const isDevSite = hostname === "dev-fm-matrix.lockated.com";

      // Hi-Society specific hosts and their API base URLs (strict equality check)
      const isHiSocietyWebHost = hostname === "web.hisociety.lockated.com";
      const isHiSocietyUIHost = hostname === "ui-hisociety.lockated.com";
      const isHiSocietyUATHost = hostname === "uat-hi-society.lockated.com" || hostname === "localhost";
      const isHiSocietySite = isHiSocietyWebHost || isHiSocietyUIHost || isHiSocietyUATHost;
      
      // Runwal specific host
      const isRunwalSite = hostname === "runwal-cp.lockated.com";

      let hiSocietyApiBase = "https://hi-society.lockated.com";
      if (isHiSocietyUIHost || isHiSocietyUATHost) {
        hiSocietyApiBase = "https://uat-hi-society.lockated.com";
      }

      // Build API URL based on site type and available parameters
      let apiUrl = "";

      if (isRunwalSite) {
        // Runwal: prefer org_id, fallback to email
        if (organizationId) {
          apiUrl = `https://runwal-cp-api.lockated.com/api/users/get_organizations_by_email.json?org_id=${organizationId}`;
          console.log("🔍 Runwal using organizationId:", organizationId);
        } else if (orgId) {
          apiUrl = `https://runwal-cp-api.lockated.com/api/users/get_organizations_by_email.json?org_id=${orgId}`;
          console.log("🔍 Runwal using orgId:", orgId);
        } else if (email) {
          apiUrl = `https://runwal-cp-api.lockated.com/api/users/get_organizations_by_email.json?email=${email}`;
          console.log("🔍 Runwal using email:", email);
        } else {
          throw new Error("Either org_id or email is required for Runwal site");
        }
      } else if (isHiSocietySite) {
        // Hi-Society: prefer org_id, fallback to email
        if (organizationId) {
          apiUrl = `${hiSocietyApiBase}/api/users/get_organizations_by_email.json?org_id=${organizationId}`;
          console.log("🔍 Hi-Society using organizationId:", organizationId);
        } else if (orgId || 10) {
          apiUrl = `${hiSocietyApiBase}/api/users/get_organizations_by_email.json?org_id=${orgId}`;
          console.log("🔍 Hi-Society using orgId:", orgId);
        } else if (email) {
          apiUrl = `${hiSocietyApiBase}/api/users/get_organizations_by_email.json?email=${email}`;
          console.log("🔍 Hi-Society using email:", email);
        } else {
          throw new Error("Either org_id or email is required for Hi-Society sites");
        }
      } else if (isOmanSite || isFmSite) {
        // FM/Oman sites: prefer org_id, fallback to email
        if (organizationId) {
          apiUrl = `https://fm-uat-api.lockated.com/api/users/get_organizations_by_email.json?org_id=${organizationId}`;
          console.log("🔍 Using org_id for FM/Oman site:", organizationId);
        } else if (orgId) {
          apiUrl = `https://fm-uat-api.lockated.com/api/users/get_organizations_by_email.json?org_id=${orgId}`;
          console.log("🔍 Using org_id for FM/Oman site:", orgId);
        } else if (email) {
          apiUrl = `https://fm-uat-api.lockated.com/api/users/get_organizations_by_email.json?email=${email}`;
          console.log("🔍 Using email for FM/Oman site:", email);
        } else {
          throw new Error(
            "Either org_id or email is required for FM/Oman sites"
          );
        }
      } else if (isViSite) {
        // VI sites: use email
        if (organizationId) {
          apiUrl = `https://live-api.gophygital.work/api/users/get_organizations_by_email.json?org_id=${organizationId}`;
          console.log("🔍 Using org_id for VI site:", organizationId);
        } else if (orgId) {
          apiUrl = `https://live-api.gophygital.work/api/users/get_organizations_by_email.json?org_id=${orgId}`;
          console.log("🔍 Using org_id for VI site:", orgId);
        } else if (email) {
          apiUrl = `https://live-api.gophygital.work/api/users/get_organizations_by_email.json?email=${email}`;
          console.log("🔍 Using email for VI site:", email);
        } else {
          throw new Error("Either org_id or email is required for VI sites");
        }
      } else if (isDevSite) {
        // Dev sites: use email
        if (organizationId) {
          apiUrl = `https://dev-api.lockated.com/api/users/get_organizations_by_email.json?org_id=${organizationId}`;
          console.log("🔍 Using org_id for Dev site:", organizationId);
        } else if (orgId) {
          apiUrl = `https://dev-api.lockated.com/api/users/get_organizations_by_email.json?org_id=${orgId}`;
          console.log("🔍 Using org_id for Dev site:", orgId);
        } else if (email) {
          apiUrl = `https://dev-api.lockated.com/api/users/get_organizations_by_email.json?email=${email}`;
          console.log("🔍 Using email for Dev site:", email);
        }
      } else {
        // Default fallback: prefer org_id, fallback to email
        if (organizationId) {
          apiUrl = `https://fm-uat-api.lockated.com/api/users/get_organizations_by_email.json?org_id=${organizationId}`;
          console.log("🔍 Using org_id for default site:", organizationId);
        } else if (orgId) {
          apiUrl = `https://live-api.gophygital.work/api/users/get_organizations_by_email.json?org_id=${orgId}`;
          console.log("🔍 Using org_id for default site:", orgId);
        } else if (email) {
          apiUrl = `https://fm-uat-api.lockated.com/api/users/get_organizations_by_email.json?email=${email}`;
          console.log("🔍 Using email for default site:", email);
        }
      }

      // Fetch organizations from API
      console.log("📡 Fetching organizations from:", apiUrl);
      const response = await axios.get(apiUrl);
      const { organizations, backend_url } = response.data;

      // Priority 1: Use backend_url from API response (highest priority)
      if (backend_url) {
        config.baseURL = backend_url;
        sessionStorage.setItem('apiBaseUrl', backend_url);
        console.log(
          "✅ Base URL set from API response backend_url:",
          backend_url
        );
        return config;
      }

      // Priority 2: Find organization by organizationId and use its backend_domain
      if (organizations && organizations.length > 0) {
        if (organizationId) {
          const selectedOrg = organizations.find(
            (org: Organization) => org.id === parseInt(organizationId)
          );

          if (selectedOrg && selectedOrg.backend_domain) {
            config.baseURL = selectedOrg.backend_domain;
            sessionStorage.setItem('apiBaseUrl', selectedOrg.backend_domain);
            console.log(
              "✅ Base URL set from organization backend_domain:",
              selectedOrg.backend_domain
            );
            return config;
          } else if (selectedOrg) {
            console.warn(
              "⚠️ Organization found but no backend_domain available"
            );
          } else {
            console.warn(
              "⚠️ Organization with ID",
              organizationId,
              "not found in response"
            );
          }
        }

        // Priority 3: Use first organization's backend_domain if available
        const firstOrg = organizations[0];
        if (firstOrg.backend_domain) {
          config.baseURL = firstOrg.backend_domain;
          sessionStorage.setItem('apiBaseUrl', firstOrg.backend_domain);
          console.log(
            "✅ Base URL set from first organization backend_domain:",
            firstOrg.backend_domain
          );
          return config;
        }
      }

      // Priority 4: Fallback URL
      if (isRunwalSite) {
        config.baseURL = "https://runwal-cp-api.lockated.com/";
        console.warn("⚠️ Using Runwal fallback URL:", config.baseURL);
      }
      // } else if (isHiSocietySite) {
      //   config.baseURL = `${hiSocietyApiBase}/`;
      //   console.warn("⚠️ Using Hi-Society fallback URL:", config.baseURL);
      // } else {
      //   config.baseURL = "https://uat-hi-society.lockated.com/";
      //   console.warn("⚠️ Using fallback URL:", config.baseURL);
      // }
    } catch (error) {
      console.error("❌ Error in request interceptor:", error);
      // Always set a fallback URL on error
      const hostname = window.location.hostname;
      if (hostname === "runwal-cp.lockated.com") {
        config.baseURL = "https://runwal-cp-api.lockated.com/";
        console.warn("⚠️ Using Runwal fallback URL due to error:", config.baseURL);
      } else if (typeof isHiSocietySite !== 'undefined' && isHiSocietySite) {
        config.baseURL = `${hiSocietyApiBase}/`;
        console.warn("⚠️ Using Hi-Society fallback URL due to error:", config.baseURL);
      } else {
        config.baseURL = "https://fm-uat-api.lockated.com/";
        console.warn("⚠️ Using fallback URL due to error:", config.baseURL);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* 
baseClient.interceptors.request.use(
  (config) => {
    // Get current frontend base URL
    const baseUrl = window.location.origin + '/';
    
    // Dynamically set backend API URL based on frontend URL
    let backendUrl: string;
    if (baseUrl === 'https://fm-matrix.lockated.com/') {
      backendUrl = 'https://fm-uat-api.lockated.com/';
    } else if (baseUrl === 'https://oig.gophygital.work/') {
      backendUrl = 'https://oig.gophygital.work/';
    } else {
      // Default fallback to OIG API
      backendUrl = 'https://fm-uat-api.lockated.com/';
    }
    
    config.baseURL = backendUrl;
    // config.baseURL = "https://fm-uat-api.lockated.com"
    // Dynamically set auth header from localStorage
    // config.headers.Authorization = getAuthHeader()
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
*/

// Response interceptor for error handling
baseClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default baseClient;