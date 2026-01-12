import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Users,
  FileText,
  Building2,
  Headset,
  Shield,
  Home,
  BarChart3,
  Gift,
  Calendar,
  HelpCircle,
  Building,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const SettingsSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  // State for collapsible parent items
  const [setupOpen, setSetupOpen] = useState(true);
  const [setupMemberOpen, setSetupMemberOpen] = useState(true);

  // Setup sub-items
  const setupItems: MenuItem[] = [
    {
      id: "special-users",
      label: "Special Users Category",
      icon: Users,
      path: "/settings/special-users-category",
    },
    {
      id: "manage-users",
      label: "Manage Users",
      icon: Users,
      path: "/settings/manage-users",
    },
    {
      id: "kyc-details",
      label: "KYC Details",
      icon: FileText,
      path: "/settings/kyc-details",
    },
    {
      id: "manage-flats",
      label: "Manage Flats",
      icon: Building2,
      path: "/settings/manage-flats",
    },
    {
      id: "helpdesk-setup",
      label: "Helpdesk Setup",
      icon: Headset,
      path: "/settings/helpdesk-setup",
    },
    {
      id: "template-list",
      label: "Template",
      icon: FileText,
      path: "/settings/template-list",
    },
  ];

  // Setup Member sub-items
  const setupMemberItems: MenuItem[] = [
    // {
    //   id: "user-list",
    //   label: "User Module",
    //   icon: Users,
    //   path: "/settings/user-list",
    // },
    // {
    //   id: "lock-role-list",
    //   label: "User Role",
    //   icon: Shield,
    //   path: "/settings/lock-role-list",
    // },
    // {
    //   id: "lock-function-list",
    //   label: "Lock Function",
    //   icon: Shield,
    //   path: "/settings/lock-function-list",
    // },
    {
      id: "groups",
      label: "Groups",
      icon: Users,
      path: "/settings/groups-list",
    },
    {
      id: "property-type-list",
      label: "Property Types",
      icon: Home,
      path: "/settings/property-type-list",
    },
    {
      id: "project-building-type-list",
      label: "Project Building",
      icon: Building2,
      path: "/settings/project-building-type-list",
    },
    {
      id: "construction-status-list",
      label: "Construction Status",
      icon: BarChart3,
      path: "/settings/construction-status-list",
    },
    {
      id: "project-configuration-list",
      label: "Project Config",
      icon: Settings,
      path: "/settings/project-configuration-list",
    },
    {
      id: "amenities-list",
      label: "Amenities",
      icon: Gift,
      path: "/settings/amenities-list",
    },
    // {
    //   id: "department-list",
    //   label: "Department",
    //   icon: Building,
    //   path: "/settings/department-list",
    // },
    // {
    //   id: "visitslot-list",
    //   label: "Visit Slot",
    //   icon: Calendar,
    //   path: "/settings/site-visit-slot-config-list",
    // },
    {
      id: "faq-category-list",
      label: "FAQ Category",
      icon: HelpCircle,
      path: "/settings/faq-category-list",
    },
    {
      id: "faq-subcategory-list",
      label: "FAQ SubCategory",
      icon: HelpCircle,
      path: "/settings/faq-subcategory-list",
    },
      {
      id: "image-configuration-list",
      label: "Image Configuration",
      icon: HelpCircle,
      path: "/settings/image-config-list",
    },
  ];

  const isActive = (path: string) => {
    // Exact match
    if (location.pathname === path) return true;
    
    // Check if current path starts with the menu item path followed by a slash
    // This handles nested routes like /settings/special-users-category/create
    if (location.pathname.startsWith(path + "/")) return true;
    
    // Additional check for routes with query parameters or hash
    if (location.pathname.startsWith(path + "?") || location.pathname.startsWith(path + "#")) return true;
    
    // Handle cases where the route might have a different suffix
    // e.g., /settings/property-type should match /settings/property-type-list
    // Extract the base path without the -list, -create, etc.
    const basePath = path.replace(/-list$/, '');
    if (basePath !== path && location.pathname.startsWith(basePath)) {
      return true;
    }
    
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const renderSubItems = (items: MenuItem[]) => {
    return items.map((item) => {
      const active = isActive(item.path);
      const Icon = item.icon;

      return (
        <button
          key={item.id}
          onClick={() => handleNavigation(item.path)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
          title={item.label}
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
          )}
          <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
          {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
        </button>
      );
    });
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto transition-all duration-300`}
      style={{ top: "4rem", height: "calc(100% - 4rem)" }}
    >
      <div className={`${isSidebarCollapsed ? "px-2 py-2" : "p-2"} pb-16`}>
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
        {!isSidebarCollapsed && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-[#1a1a1a] opacity-70 uppercase tracking-wide">
              Settings
            </h3>
          </div>
        )}

        {/* Menu Items */}
        <nav className="space-y-1">
          {/* Setup Parent */}
          <div>
            <button
              onClick={() => setSetupOpen(!setupOpen)}
              className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] text-[#1a1a1a]"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Setup</span>}
              </div>
              {!isSidebarCollapsed && (
                setupOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {setupOpen && !isSidebarCollapsed && (
              <div className="mt-1 space-y-1">
                {renderSubItems(setupItems)}
              </div>
            )}
          </div>

          {/* Setup Member Parent */}
          <div>
            <button
              onClick={() => setSetupMemberOpen(!setupMemberOpen)}
              className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] text-[#1a1a1a]"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Setup Member</span>}
              </div>
              {!isSidebarCollapsed && (
                setupMemberOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {setupMemberOpen && !isSidebarCollapsed && (
              <div className="mt-1 space-y-1">
                {renderSubItems(setupMemberItems)}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default SettingsSidebar;
