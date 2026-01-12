import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  Layout,
  Image,
  MessageSquare,
  Calendar,
  FileText,
  Building2,
  MapPin,
  HelpCircle,
  UserCheck,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const HomeSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  // Check if current domain is CMS domain
  const isCMSDomain = window.location.hostname === 'ui-cms.lockated.com';
  
  // Show sidebar for BMS/maintenance routes or for home routes on CMS domain
  const shouldShowSidebar = location.pathname.startsWith('/maintenance') || 
                            location.pathname.startsWith('/bms') ||
                            isCMSDomain;

  const homeMenuItems: MenuItem[] = [
    {
      id: "project",
      label: "Project",
      icon: Layout,
      path: "/maintenance/project-details-list",
    },
    {
      id: "banner",
      label: "Banner",
      icon: Image,
      path: "/maintenance/banner-list",
    },
    // {
    //   id: "testimonial",
    //   label: "Testimonial",
    //   icon: MessageSquare,
    //   path: "/maintenance/testimonial-list",
    // },
    {
      id: "event",
      label: "Event",
      icon: Calendar,
      path: "/maintenance/event-list",
    },
    {
      id: "broadcast",
      label: "Broadcast",
      icon: MessageSquare,
      path: "/maintenance/noticeboard-list",
    },
    // {
    //   id: "specification",
    //   label: "Specification",
    //   icon: FileText,
    //   path: "/maintenance/specification-list",
    // },
    // {
    //   id: "organization",
    //   label: "Organization",
    //   icon: Building2,
    //   path: "/maintenance/organization-list",
    // },
    // {
    //   id: "company",
    //   label: "Company",
    //   icon: Building,
    //   path: "/maintenance/company-list",
    // },
    // {
    //   id: "site",
    //   label: "Site",
    //   icon: MapPin,
    //   path: "/maintenance/site-list",
    // },
    {
      id: "press-releases",
      label: "Press Releases",
      icon: FileText,
      path: "/maintenance/press-releases-list",
    },
    {
      id: "faq",
      label: "FAQ",
      icon: HelpCircle,
      path: "/maintenance/faq-list",
    },
    // {
    //   id: "referral-program",
    //   label: "Referral Program",
    //   icon: UserCheck,
    //   path: "/maintenance/referral-program-list",
    // },
  ];

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Don't render sidebar if not on appropriate routes
  if (!shouldShowSidebar) {
    return null;
  }

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto transition-all duration-300 mb-16`}
      style={{ top: "4rem", height: "100%" }}
    >
      <div className={`${isSidebarCollapsed ? "px-2 py-2" : "p-2"}`}>
        {/* Collapse Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute right-2 top-2 p-1 rounded-md hover:bg-[#DBC2A9] z-10"
        >
          {isSidebarCollapsed ? (
            <div className="flex justify-center items-center w-8 h-8 bg-[#f6f4ee] border border-[#e5e1d8] mx-auto">
              <ChevronRight className="w-4 h-4" />
            </div>
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Spacer below toggle */}
        <div className="w-full h-4 bg-[#f6f4ee] border-[#e5e1d8] mb-2 mt-4"  />

        {/* Header */}
        <div className={`mb-4 ${isSidebarCollapsed ? "text-center" : ""}`}>
          <h3
            className={`text-sm font-medium text-[#1a1a1a] opacity-70 uppercase ${
              isSidebarCollapsed ? "" : "tracking-wide"
            }`}
          >
            {isSidebarCollapsed ? "" : "Home"}
          </h3>
        </div>

        {/* Menu */}
        <nav className="space-y-2">
          {homeMenuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <div key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                  title={item.label}
                >
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}

                  {/* Icon */}
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 text-[#1a1a1a]`}
                  />

                  {/* Label */}
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default HomeSidebar;
