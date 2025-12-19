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

  const homeMenuItems: MenuItem[] = [
    {
      id: "project",
      label: "Project",
      icon: Layout,
      path: "/setup-member/project-details-list",
    },
    {
      id: "banner",
      label: "Banner",
      icon: Image,
      path: "/setup-member/banner-list",
    },
    {
      id: "testimonial",
      label: "Testimonial",
      icon: MessageSquare,
      path: "/setup-member/testimonial-list",
    },
    {
      id: "event",
      label: "Event",
      icon: Calendar,
      path: "/setup-member/event-list",
    },
    {
      id: "specification",
      label: "Specification",
      icon: FileText,
      path: "/setup-member/specification-list",
    },
    {
      id: "organization",
      label: "Organization",
      icon: Building2,
      path: "/setup-member/organization-list",
    },
    {
      id: "company",
      label: "Company",
      icon: Building,
      path: "/setup-member/company-list",
    },
    {
      id: "site",
      label: "Site",
      icon: MapPin,
      path: "/setup-member/site-list",
    },
    {
      id: "press-releases",
      label: "Press Releases",
      icon: FileText,
      path: "/setup-member/press-releases-list",
    },
    {
      id: "faq",
      label: "FAQ",
      icon: HelpCircle,
      path: "/setup-member/faq-list",
    },
    {
      id: "referral-program",
      label: "Referral Program",
      icon: UserCheck,
      path: "/setup-member/referral-program-list",
    },
  ];

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto transition-all duration-300`}
      style={{ top: "3rem", height: "100%" }}
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
                    className={`w-5 h-5 flex-shrink-0 ${
                      active ? "text-[#C72030]" : "text-[#1a1a1a]"
                    }`}
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
