import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  Users,
  Shield,
  Database,
  Home,
  Building2,
  BarChart3,
  FileText,
  Settings,
  Gift,
  Building,
  Calendar,
  GraduationCap,
  Headset,
  Mail,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const SetupMemberSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const setupMemberMenuItems: MenuItem[] = [
    {
      id: "user-list",
      label: "User Module",
      icon: Users,
      path: "/setup-member/user-list",
    },
    {
      id: "lock-role-list",
      label: "User Role",
      icon: Shield,
      path: "/setup-member/lock-role-list",
    },
    {
      id: "lock-function-list",
      label: "Lock Function",
      icon: Shield,
      path: "/setup-member/lock-function-list",
    },
    // {
    //   id: "banks-list",
    //   label: "Banks",
    //   icon: Database,
    //   path: "/setup-member/banks-list",
    // },
    // {
    //   id: "home-loan-list",
    //   label: "Home Loans",
    //   icon: Home,
    //   path: "/setup-member/home-loan-list",
    // },
    // {
    //   id: "loan-manager-list",
    //   label: "Loan Managers",
    //   icon: Users,
    //   path: "/setup-member/loan-manager-list",
    // },
    {
      id: "property-type-list",
      label: "Property Types",
      icon: Home,
      path: "/setup-member/property-type-list",
    },
    {
      id: "project-building-type-list",
      label: "Project Building",
      icon: Building2,
      path: "/setup-member/project-building-type-list",
    },
    {
      id: "construction-status-list",
      label: "Construction Status",
      icon: BarChart3,
      path: "/setup-member/construction-status-list",
    },
    // {
    //   id: "construction-updates-list",
    //   label: "Construction Updates",
    //   icon: FileText,
    //   path: "/setup-member/construction-updates-list",
    // },
    {
      id: "project-configuration-list",
      label: "Project Config",
      icon: Settings,
      path: "/setup-member/project-configuration-list",
    },
    {
      id: "amenities-list",
      label: "Amenities",
      icon: Gift,
      path: "/setup-member/amenities-list",
    },
    {
      id: "department-list",
      label: "Department",
      icon: Building,
      path: "/setup-member/department-list",
    },
    {
      id: "visitslot-list",
      label: "Visit Slot",
      icon: Calendar,
      path: "/setup-member/site-visit-slot-config-list",
    },
    // {
    //   id: "tds-tutorials-list",
    //   label: "TDS Tutorials",
    //   icon: GraduationCap,
    //   path: "/setup-member/tds-tutorials-list",
    // },
    // {
    //   id: "plus-services-list",
    //   label: "Plus Services",
    //   icon: Headset,
    //   path: "/setup-member/plus-services-list",
    // },
    // {
    //   id: "smtp-settings-list",
    //   label: "SMTP Settings",
    //   icon: Mail,
    //   path: "/setup-member/smtp-settings-list",
    // },
    {
      id: "faq-category-list",
      label: "FAQ Category",
      icon: HelpCircle,
      path: "/setup-member/faq-category-list",
    },
    {
      id: "faq-subcategory-list",
      label: "FAQ SubCategory",
      icon: HelpCircle,
      path: "/setup-member/faq-subcategory-list",
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
      style={{ top: "4rem", maxHeight: "calc(100% - 4rem)" }}
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

        {/* Spacer */}
        <div className="w-full h-4 bg-[#f6f4ee] border-[#e5e1d8] mb-2 mt-4" />

        {/* Header */}
        <div className={`mb-4 ${isSidebarCollapsed ? "text-center" : ""}`}>
          <h3
            className={`text-sm font-medium text-[#1a1a1a] opacity-70 uppercase ${
              isSidebarCollapsed ? "" : "tracking-wide"
            }`}
          >
            {isSidebarCollapsed ? "" : "Setup Member"}
          </h3>
        </div>

        {/* Menu */}
        <nav className="space-y-2">
          {setupMemberMenuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <div key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                  title={item.label}
                >
                  {/* Active Indicator */}
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

export default SetupMemberSidebar;
