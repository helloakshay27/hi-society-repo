import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/contexts/PermissionsContext";
import { findFirstAccessibleRoute } from "@/utils/dynamicNavigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUser } from "@/utils/auth";

const Index = () => {
  const navigate = useNavigate();
  const { userRole, loading } = usePermissions();
  const { selectedCompany } = useSelector((state: RootState) => state.project);
  const org_id = localStorage.getItem("org_id");

  useEffect(() => {
    // Wait for permissions to load
    if (loading) return;

    const hostname = window.location.hostname;
    const isViSite = hostname.includes("vi-web.gophygital.work");
    const isUIHiSocietySite = hostname.includes("ui-hisociety.lockated.com") || org_id === "9";
    const isHiSocietySite = hostname === "web.hisociety.lockated.com";
    const userType = localStorage.getItem("userType");
    const currentUser = getUser();
    const userEmail = currentUser?.email || "No email";
    const isLocalhost =
      hostname.includes("lockated.gophygital.work") ||
      hostname.includes("fm-matrix.lockated.com") ||
      userEmail === "deveshjain928@gmail.com" ||
      userEmail === "abdul.ghaffar@lockated.com" ||
      userEmail === "mailroom2@zs.com" ||
      userEmail === "abdul.g@gophygital.work";

    const isPulseSite =
      hostname.includes("pulse.lockated.com") ||
      hostname.includes("pulse.panchshil.com") ||
      hostname.includes("pulse.gophygital.work") ||
      hostname.includes("pulse-uat.panchshil.com");
    const isClubSite = hostname.includes("club.lockated.com");
    const isWebSite = hostname.includes("web.lockated.com");

    // PRIORITY 0: Hi-Society site routing (highest priority for specific domains)
    if (isUIHiSocietySite) {
      navigate("/loyalty/dashboard", { replace: true });
      return;
    }

    if (isHiSocietySite) {
      navigate("/maintenance/project-details-list", { replace: true });
      return;
    }

    // PRIORITY 1: Dynamic route from userRole permissions (highest priority)
    if (userRole) {
      const firstRoute = findFirstAccessibleRoute(userRole);

      if (firstRoute) {
        navigate(firstRoute, { replace: true });
        return;
      }
    }

    // PRIORITY 3: Company ID-based routing for specific companies and domains
    if (
      selectedCompany?.id === 300 ||
      selectedCompany?.id === 295 ||
      selectedCompany?.id === 298 ||
      selectedCompany?.id === 199 ||
      isPulseSite ||
      (isWebSite && userEmail === "deveshjain928@gmail.com") ||
      userEmail === "abdul.ghaffar@lockated.com" ||
      userEmail === "mailroom2@zs.com" ||
      userEmail === "abdul.g@gophygital.work"
    ) {
      // For these companies and domains, use dynamic routing from permissions
      if (userRole) {
        const firstRoute = findFirstAccessibleRoute(userRole);
        if (firstRoute) {
          navigate(firstRoute, { replace: true });
          return;
        }
      }
      // Fallback to default admin route for these companies
      navigate("/maintenance/asset", { replace: true });
      return;
    }

    // PRIORITY 4: Domain-specific fallback routing
    if (isViSite) {
      navigate("/safety/m-safe/internal", { replace: true });
    } else if (isClubSite) {
      navigate("/club-management/membership", { replace: true });
    } else {
      navigate("/maintenance/asset", { replace: true });
    }
  }, [navigate, userRole, loading, selectedCompany, org_id]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index;
