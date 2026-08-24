import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Headphones,
  Video,
  Building2,
  Calendar,
  Clock,
  CalendarDays,
} from "lucide-react";

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  subItems?: SubMenuItem[];
}

export const AppointmentzSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed, isMobileSidebarOpen, setIsMobileSidebarOpen } = useLayout();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    setup: true,
  });

  const menuItems: MenuItem[] = [
    {
      id: "request",
      label: "Request",
      icon: Headphones,
      path: "/appointmentz/request",
    },
    {
      id: "site-visit-requests",
      label: "Site Visit Requests",
      icon: Calendar,
      path: "/appointmentz/site-scheduling",
    },
    {
      id: "virtual-requests",
      label: "virtual Requests",
      icon: Video,
      path: "/appointmentz/virtual-requests",
    },
    {
      id: "manage-flats",
      label: "Manage Flats",
      icon: Building2,
      path: "/appointmentz/manage-flats",
    },
    {
      id: "setup",
      label: "Setup",
      icon: Settings,
      subItems: [
        {
          id: "rm-cs-config",
          label: "RM/CS Configuration",
          icon: Settings,
          path: "/appointmentz/rm-config",
        },
        {
          id: "slots-config",
          label: "Slots Configuration",
          icon: Clock,
          path: "/appointmentz/slots-config",
        },
        {
          id: "block-days-config",
          label: "Block Days Configuration",
          icon: CalendarDays,
          path: "/appointmentz/block-days-config",
        },
      ],
    },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === "/appointmentz/request") {
      return location.pathname === "/appointmentz/request";
    }
    if (path === "/appointmentz/site-scheduling") {
      return (
        location.pathname === "/appointmentz/site-scheduling" ||
        location.pathname === "/appointmentz/site-visit-requests"
      );
    }
    if (path === "/appointmentz/virtual-requests") {
      return (
        location.pathname === "/appointmentz/virtual-requests" ||
        location.pathname === "/appointmentz/virtual-request"
      );
    }
    if (path === "/appointmentz/manage-flats") {
      return (
        location.pathname === "/appointmentz/manage-flats" ||
        location.pathname.startsWith("/appointmentz/manage-flats")
      );
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const isParentActive = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false;
    return subItems.some((sub) => isActive(sub.path));
  };

  const handleNavigation = (path: string) => {
    if (setIsMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
    navigate(path);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto overflow-x-hidden transition-all duration-300 z-40`}
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
              Appointmentz
            </h3>
          </div>
        )}

        {/* Menu Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedSections[item.id] ?? false;
            const Icon = item.icon;
            const active = hasSubItems ? isParentActive(item.subItems) : isActive(item.path);

            if (isSidebarCollapsed) {
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (hasSubItems) {
                        const firstSub = item.subItems![0];
                        handleNavigation(firstSub.path);
                      } else if (item.path) {
                        handleNavigation(item.path);
                      }
                    }}
                    className={`flex items-center justify-center w-full p-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ${
                      active ? "bg-[#fbeeed]" : ""
                    }`}
                    title={item.label}
                  >
                    {active && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                    )}
                    <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  </button>
                </div>
              );
            }

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleSection(item.id);
                    } else if (item.path) {
                      handleNavigation(item.path);
                    }
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ${
                    active && !hasSubItems ? "bg-[#fbeeed]" : ""
                  }`}
                >
                  {active && !hasSubItems && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {hasSubItems &&
                    (isExpanded ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    ))}
                </button>

                {hasSubItems && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems!.map((subItem) => {
                      const subActive = isActive(subItem.path);
                      const SubIcon = subItem.icon;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => handleNavigation(subItem.path)}
                          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ${
                            subActive ? "bg-[#fbeeed] text-[#C72030] font-semibold" : ""
                          }`}
                        >
                          {subActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                          )}
                          <SubIcon className="w-4 h-4 flex-shrink-0 text-[#1a1a1a]" />
                          <span className="truncate">{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppointmentzSidebar;
