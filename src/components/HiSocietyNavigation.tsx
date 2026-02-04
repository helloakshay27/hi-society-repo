import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  MessageSquare,
  Settings as SettingsIcon,
  Users,
  Gift,
} from "lucide-react";
import { useLayout } from "../contexts/LayoutContext";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="w-4 h-4" />,
    path: "/maintenance/project-details-list",
  },
  {
    id: "bms",
    label: "BMS",
    icon: <SettingsIcon className="w-4 h-4" />,
    path: "/bms/helpdesk",
  },
  {
    id: "loyalty",
    label: "Loyalty",
    icon: <Gift className="w-4 h-4" />,
    path: "/loyalty/dashboard",
  },
  {
    id: "cms",
    label: "CMS",
    icon: <SettingsIcon className="w-4 h-4" />,
    path: "/cms/facility-setup",
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: <Gift className="w-4 h-4" />,
    path: "/campaigns/referrals",
  },
  {
    id: "fitout",
    label: "Fitout",
    icon: <SettingsIcon className="w-4 h-4" />,
    path: "/fitout/requests",
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: <SettingsIcon className="w-4 h-4" />,
    path: "/accounting/dashboard",
  },
  {
    id: "smartsecure",
    label: "SmartSecure",
    icon: <SettingsIcon className="w-4 h-4" />,
    path: "/smartsecure/visitor-in",
  },
  {
    id: "incidents",
    label: "Incidents",
    icon: <SettingsIcon className="w-4 h-4" />,
    path: "/incidents/setup",
  },
  {
    id: "fb",
    label: "F & B",
    icon: <Users className="w-4 h-4" />,
    path: "/fb/restaurants",
  },
  {
    id: "Appointmentz",
    label: "Appointmentz",
    icon: <Users className="w-4 h-4" />,
    path: "/appointmentz/site-visit-requests",
  },
  {
    id: "osr",
    label: "OSR",
    icon: <MessageSquare className="w-4 h-4" />,
    path: "/osr/setup",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <SettingsIcon className="w-4 h-4" />,
    path: "/settings/special-users-category",
  },
];

export const HiSocietyNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed } = useLayout();
  const [activeNav, setActiveNav] = useState<string>("home");

  // Check if current domain is CMS domain
  const isCMSDomain = window.location.hostname === "ui-cms.lockated.com";

  // Check if current domain is Fitout domain
  const isFitoutDomain =
    window.location.hostname === "web.hisociety.lockated.com";

  // Filter navigation items based on domain
  const filteredNavigationItems = isCMSDomain
    ? navigationItems.filter(
      (item) => item.id === "home" || item.id === "settings"
    )
    : isFitoutDomain
      ? navigationItems.filter(
        (item) => item.id === "fitout" || item.id === "settings"
      )
      : navigationItems; // Show all navigation items including Home, BMS, and Loyalty

  // Detect active navigation based on current path
  useEffect(() => {
    const path = location.pathname;
    
    // Check for Application Setup paths first - these should stay in settings
    if (
      path.startsWith("/campaigns/referral-setup") ||
      path.startsWith("/fitout/setup") ||
      path.startsWith("/accounting/tax-setup") ||
      path.startsWith("/accounting/payment-terms") ||
      path.startsWith("/accounting/vendors") ||
      path.startsWith("/smartsecure/visitor-purpose") ||
      path.startsWith("/smartsecure/vehicle-type") ||
      path.startsWith("/smartsecure/material-type") ||
      path.startsWith("/incidents/setup") ||
      path.startsWith("/osr/setup")
    ) {
      setActiveNav("settings");
    } else if (path.startsWith("/cms")) {
      setActiveNav("cms");
    } else if (path.startsWith("/campaigns")) {
      setActiveNav("campaigns");
    } else if (path.startsWith("/fb")) {
      setActiveNav("fb");
    } else if (path.startsWith("/osr")) {
      setActiveNav("osr");
    } else if (path.startsWith("/fitout")) {
      setActiveNav("fitout");
    } else if (path.startsWith("/accounting")) {
      setActiveNav("accounting");
    } else if (path.startsWith("/smartsecure")) {
      setActiveNav("smartsecure");
    } else if (path.startsWith("/incidents")) {
      setActiveNav("incidents");
    } else if (path.startsWith("/appointmentz")) {
      setActiveNav("Appointmentz");
    } else if (path.startsWith("/settings")) {
      setActiveNav("settings");
    } else if (path.startsWith("/loyalty")) {
      setActiveNav("loyalty");
    } else if (
      path.startsWith("/bms") ||
      path.startsWith("/communication")
    ) {
      setActiveNav("bms");
    } else if (
      path.startsWith("/maintenance") ||
      path.startsWith("/setup-member") ||
      path.startsWith("/setup")
    ) {
      setActiveNav("home");
    } else {
      setActiveNav("home");
    }
  }, [location.pathname, isCMSDomain]);

  const handleNavClick = (item: NavigationItem) => {
    setActiveNav(item.id);
    navigate(item.path);
  };

  return (
    <div
      className={`h-12 border-b border-[#D5DbDB] fixed top-16 right-0 ${isSidebarCollapsed ? "left-16" : "left-64"} z-10 transition-all duration-300`}
      style={{ backgroundColor: "#f6f4ee" }}
    >
      <div className="flex items-center h-full px-4 overflow-x-auto">
        <div className="w-full overflow-x-auto md:overflow-visible no-scrollbar">
          {/* Mobile & Tablet: scroll + spacing; Desktop: full width and justify-between */}
          <div className="flex w-max lg:w-full space-x-4 md:space-x-6 lg:space-x-0 md:justify-start lg:justify-between whitespace-nowrap">
            {filteredNavigationItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`pb-3 text-sm transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${isActive
                      ? "text-[#C72030] border-b-2 border-[#C72030] font-medium"
                      : "text-[#1a1a1a] opacity-70 hover:opacity-100"
                    }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
