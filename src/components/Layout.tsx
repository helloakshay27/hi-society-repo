import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Sidebar } from "./Sidebar";
import { DynamicHeader } from "./DynamicHeader";
import { Header } from "./Header";
import { useLayout } from "../contexts/LayoutContext";
import { OmanSidebar } from "./OmanSidebar";
import { OmanDynamicHeader } from "./OmanDynamicHeader";
import ViSidebar from "./ViSidebar";
import ViDynamicHeader from "./ViDynamicHeader";
import { StaticDynamicHeader } from "./StaticDynamicHeader";
import { StacticSidebar } from "./StacticSidebar";
import ViSidebarWithToken from "./ViSidebarWithToken";
import { ZxSidebar } from "./ZxSidebar";
import { ZxDynamicHeader } from "./ZxDynamicHeader";
import { saveToken, saveUser, saveBaseUrl, getUser } from "../utils/auth";
import { ProtectionLayer } from "./ProtectionLayer";

import { SetupHeader } from "./SetupHeader";
import { SetupSidebar } from "./SetupSidebar";
import { HiSocietyHeader } from "./HiSocietyHeader";
import { HiSocietyNavigation } from "./HiSocietyNavigation";
import { HiSocietySidebar } from "./HiSocietySidebar";
import { PrimeSupportSidebar } from "./PrimeSupportSidebar";
import { PrimeSupportDynamicHeader } from "./PrimeSupportDynamicHeader";
import { EmployeeSidebar } from "./EmployeeSidebar";
import { EmployeeSidebarStatic } from "./EmployeeSidebarStatic";
import { EmployeeDynamicHeader } from "./EmployeeDynamicHeader";
import { EmployeeHeader } from "./EmployeeHeader";
import { EmployeeHeaderStatic } from "./EmployeeHeaderStatic";
import { ViewSelectionModal } from "./ViewSelectionModal";
import { PulseSidebar } from "./PulseSidebar";
import { PulseDynamicHeader } from "./PulseDynamicHeader";
import { ZycusSidebar } from "./ZycusSidebar";
import { ZycusDynamicHeader } from "./ZycusDynamicHeader";
import { ActionSidebar } from "./ActionSidebar";
import { ActionHeader } from "./ActionHeader";
import { useActionLayout } from "../contexts/ActionLayoutContext";

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    isSidebarCollapsed,
    getLayoutByCompanyId,
    currentSection,
    setCurrentSection,
    layoutMode,
  } = useLayout();
  const { isActionSidebarVisible } = useActionLayout();
  const { selectedCompany } = useSelector((state: RootState) => state.project);
  const { selectedSite } = useSelector((state: RootState) => state.site);
  const location = useLocation();
  const currentUser = getUser();
  const userEmail = currentUser?.email || "No email";
  const hostname = window.location.hostname;

  // Detect Club Management routes
  const isClubManagementRoute = hostname === "club.lockated.com" || location.pathname.startsWith("/club-management");

  // Debug layoutMode state and localStorage sync
  useEffect(() => {
    const storedMode = localStorage.getItem('layoutMode');
    console.log('🎨 Layout Component - layoutMode:', layoutMode, '| localStorage:', storedMode);
    if (!storedMode) {
      console.warn('⚠️ layoutMode missing in localStorage! Setting it now...');
      localStorage.setItem('layoutMode', layoutMode);
    }
  }, [layoutMode]);

  /**
   * ADMIN VIEW ONLY - EMPLOYEE VIEW DISABLED
   *
   * Force admin view for all users.
   * Employee view has been disabled.
   */
  const isEmployeeRoute = false; // Disable employee route detection
  const userType = localStorage.getItem("userType") || "admin"; // Default to admin
  const isEmployeeUser = false; // Always use admin view

  // Check if user needs to select a view (Admin or Employee)
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    // Always force admin view - disable view selection
    const storedUserType = localStorage.getItem("userType");
    
    // Set to admin if not already set
    if (!storedUserType || storedUserType === "pms_occupant") {
      localStorage.setItem("userType", "admin");
      localStorage.setItem("selectedView", "admin");
      console.log("🔧 Forced userType to admin");
    }
    
    // Never show view modal - always use admin view
    setShowViewModal(false);
  }, []);

  // // Auto-detect Hi-Society site and set layout mode (only on initial load)
  // const { toggleLayoutMode } = useLayout();
  // useEffect(() => {
  //   const hostname = window.location.hostname;
  //   const isHiSocietySite =
  //     hostname.includes("localhost") ||
  //     hostname.includes("ui-hisociety.lockated.com") ||
  //     hostname.includes("web.hisociety.lockated.com");

  //   // Only auto-set Hi-Society mode on initial load if no mode is explicitly set
  //   // Don't override user's manual mode selection
  //   if (isHiSocietySite) {
  //     const currentMode = localStorage.getItem("layoutMode");
  //     // Only set to hi-society if no mode exists (first time visit)
  //     if (!currentMode) {
  //       localStorage.setItem("layoutMode", "hi-society");
  //     }
  //   }
  // }, []); // Empty dependency array - only run once on mount

  // Check if non-employee user needs to select project/site
  const isViSite = hostname.includes("vi-web.gophygital.work") ||
    hostname.includes("localhost:5174");

  // Removed project selection modal logic - now handled by view selection

  // Handle token-based authentication from URL parameters
  // Get current domain for backward compatibility
  const isOmanSite = hostname.includes("oig.gophygital.work");

  const isFMSite = hostname === "fm-matrix.lockated.com" || hostname === "web.gophygital.work" || hostname === "lockated.gophygital.work" || hostname === "localhost";

  const isLockatedSite =
    hostname.includes("lockated.gophygital.work") ||
    hostname.includes("localhost:5174");

  // Get layout configuration based on company ID
  const layoutConfig = getLayoutByCompanyId(
    selectedCompany?.id === 295 || selectedCompany?.id === 199
      ? selectedCompany.id
      : null
  );

  // Detect Pulse site - used for fallback when no API role exists
  const isPulseSite =
    hostname.includes("pulse.lockated.com") ||
    hostname.includes("pulse.gophygital.work") ||
    hostname.includes("pulse-uat.panchshil.com") ||
    location.pathname.startsWith("/pulse");
  const isLocalhost =
    hostname.includes("localhost") ||
    hostname.includes("lockated.gophygital.work") ||
    hostname.includes("fm-matrix.lockated.com") ||
    userEmail === "ubaid.hashmat@lockated.com";

  // Layout behavior:
  // - Company ID 189 (Lockated HO): Default layout (Sidebar + DynamicHeader)
  // - Company ID 199 (Customer Support): Default layout (Sidebar + DynamicHeader)
  // - Other companies (193, 204): Static layout (Sidebar + StaticDynamicHeader)
  // - No company selected: Static layout (fallback)
  // - Club Management routes: Separate Club Management layout

  // Render sidebar component based on configuration
  const renderSidebar = () => {
    // If Hi-Society mode is active, use the unified HiSocietySidebar
    if (layoutMode === 'hi-society') {
      return <HiSocietySidebar />;
    }

    // FM Matrix mode (default) - original logic
    // Check if user is employee (pms_occupant) - Employee layout takes priority
    // Use specific sidebars for different sections
    if (isEmployeeUser) {
      // For localhost, check module-based logic
      if (isLocalhost && currentSection === "Project Task") {
        // Use EmployeeSidebar for specific companies, otherwise EmployeeSidebarStatic
        if (
          selectedCompany?.id === 300 ||
          selectedCompany?.id === 295 ||
          selectedCompany?.id === 298 ||
          selectedCompany?.id === 199
        ) {
          return <EmployeeSidebar />;
        }
        return <EmployeeSidebarStatic />;
      }

      // For localhost other modules (Ticket, MOM, Visitors), don't render sidebar
      if (isLocalhost && currentSection !== "Project Task") {
        return null;
      }

      // All other routes use HiSocietySidebar for employee users
      return <HiSocietySidebar />;
    }

    // Check for token-based VI access first
    const urlParams = new URLSearchParams(window.location.search);
    const hasTokenParam = urlParams.has("access_token");
    const storedToken = localStorage.getItem("token");
    const hasToken = hasTokenParam || storedToken;

    if (
      selectedCompany?.id === 300 ||
      selectedCompany?.id === 295 ||
      selectedCompany?.id === 298 ||
      selectedCompany?.id === 199 ||
      userEmail === "ubaid.hashmat@lockated.com"
    ) {
      return <ActionSidebar />;
    }

    // Domain-based logic takes precedence for backward compatibility
    if (isOmanSite) {
      return <OmanSidebar />;
    }

    // Check for VI site with token parameter or stored token
    if (isViSite && hasToken) {
      return <ViSidebarWithToken />;
    }

    if (isViSite) {
      return <ViSidebar />;
    }

    // Company-specific logic (Admin layout)
    if (selectedCompany?.id === 189) {
      return <ZxSidebar />;
    }

    if (selectedCompany?.id === 294) {
      return <ZycusSidebar />;
    }

    if (selectedCompany?.id === 304) {
      return <PrimeSupportSidebar />;
    }

    // Pulse Privilege - Company ID 305 OR isPulseSite fallback
    if (selectedCompany?.id === 305 || isPulseSite) {
      return <PulseSidebar />;
    }

    // Use company ID-based layout
    switch (layoutConfig.sidebarComponent) {
      case "oman":
        return <OmanSidebar />;
      case "vi":
        return <ViSidebar />;
      case "static":
        return <StacticSidebar />;
      case "default":
      default:
        return <StacticSidebar />; // Changed from ActionSidebar to StacticSidebar as fallback
    }
  };

  // Render header component based on configuration
  const renderDynamicHeader = () => {
    // If Hi-Society mode is active, show HiSocietyNavigation
    if (layoutMode === 'hi-society') {
      return <HiSocietyNavigation />;
    }

    // FM Matrix mode (default) - original logic
    // Check if user is employee (pms_occupant) - Employee layout takes priority
    // Employees don't need dynamic header, they use HiSocietyHeader instead
    if (isEmployeeUser) {
      return null; // No dynamic header for Hi Society dashboard
    }

    if (
      selectedCompany?.id === 300 ||
      selectedCompany?.id === 295 ||
      selectedCompany?.id === 298 ||
      selectedCompany?.id === 199 ||
      userEmail === "ubaid.hashmat@lockated.com"
    ) {
      return <ActionHeader />;
    }

    if (isFMSite) {
      return <StaticDynamicHeader />
    }

    // Domain-based logic takes precedence for backward compatibility
    if (isOmanSite) {
      return <OmanDynamicHeader />;
    }
    if (isViSite) {
      return <ViDynamicHeader />;
    }

    // Company-specific logic (Admin layout)
    if (selectedCompany?.id === 189) {
      return <ZxDynamicHeader />;
    }

    if (selectedCompany?.id === 294) {
      return <ZycusDynamicHeader />;
    }

    if (selectedCompany?.id === 304) {
      return <PrimeSupportDynamicHeader />;
    }

    // Pulse Privilege - Company ID 305 OR isPulseSite fallback
    if (selectedCompany?.id === 305 || isPulseSite) {
      return <PulseDynamicHeader />;
    }

    if (
      selectedCompany?.id === 300 ||
      selectedCompany?.id === 295 ||
      selectedCompany?.id === 298 ||
      selectedCompany?.id === 199
    ) {
      return <DynamicHeader />;
    }

    // Use company ID-based layout
    switch (layoutConfig.headerComponent) {
      case "oman":
        return <OmanDynamicHeader />;
      case "vi":
        return <ViDynamicHeader />;
      case "static":
        return <StaticDynamicHeader />;
      case "default":
      default:
        return <DynamicHeader />;
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const access_token = urlParams.get("access_token");
    const company_id = urlParams.get("company_id");
    const user_id = urlParams.get("user_id");

    console.log("Layout Token Check:", {
      access_token: access_token ? "Present" : "Missing",
      company_id,
      user_id,
      currentPath: location.pathname,
    });

    // If token is present in URL, store it immediately for authentication
    if (access_token) {
      console.log("Storing token from URL parameters");

      // Save token using auth utility
      saveToken(access_token);

      // Save base URL for API calls (detect from current hostname)
      const hostname = window.location.hostname;
      if (hostname.includes("vi-web.gophygital.work")) {
        saveBaseUrl("live-api.gophygital.work/");
      } else if (hostname.includes("localhost")) {
        saveBaseUrl("live-api.gophygital.work/"); // Default for local development
      }

      // Store company and user data
      if (company_id) {
        localStorage.setItem("selectedCompanyId", String(company_id));
      }

      if (user_id) {
        localStorage.setItem("user_id", String(user_id));

        // Create a user object for VI token access
        const viUser = {
          id: parseInt(user_id),
          email: "", // VI access might not have email
          firstname: "VI",
          lastname: "User",
          access_token: access_token,
          user_type: "vi_token_user",
        };
        saveUser(viUser);

        console.log("VI User created and stored:", viUser);
      }
    }
  }, [location.search]);

  return (
    <div
      className="min-h-screen bg-[#fafafa]"
      style={{ backgroundColor: layoutConfig.theme?.backgroundColor }}
    >
      {/* Content protection for specified domains */}
      <ProtectionLayer
        enabled={true}
        allowedDomains={["vi-web.gophygital.work"]}
      />

      {/* View Selection Modal - Choose Admin or Employee View */}
      <ViewSelectionModal
        isOpen={!isEmployeeUser && isLocalhost ? showViewModal : false}
        onComplete={() => { setShowViewModal(false); }}
      />
      {console.log("layoutMode:", layoutMode)}

      {/* Conditional Header - Hi-Society mode shows HiSocietyHeader, FM Matrix mode shows admin Header */}
      {layoutMode === 'hi-society' ? (
        <HiSocietyHeader />
      ) : (
        <Header />
      )}

      {renderSidebar()}

      {/* Navigation - Conditional based on layoutMode */}
      {layoutMode === 'hi-society' ? (
        <HiSocietyNavigation />
      ) : (
        renderDynamicHeader()
      )}

      {/* Action-based navigation - only shown when action context is active */}

      <main
        className={`${
          // Hi-Society mode styling
          layoutMode === 'hi-society'
            ? isSidebarCollapsed
              ? "ml-16"
              : "ml-64"
            : // FM Matrix mode - always show sidebar margin for admin users
              isActionSidebarVisible
                ? "ml-64 pt-28" // ActionSidebar is visible (fixed width 64)
                : isSidebarCollapsed
                  ? "ml-16"
                  : "ml-64"
          } ${
          // Top padding based on mode
          layoutMode === 'hi-society'
            ? "pt-28" // Header (16) + Navigation (12) = 28
            : isActionSidebarVisible
                ? ""
                : "pt-28"
          } transition-all duration-300`}
      >
        <Outlet />
      </main>
    </div>
  );
};
