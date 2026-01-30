import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const AppointmentzSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const menuItems: MenuItem[] = [
    {
      id: "site-visit-requests",
      label: "Site Visit Requests",
      icon: Calendar,
      path: "/appointmentz/site-scheduling",
    },
    {
      id: "rm-cs-config",
      label: "RM/CS Configuration",
      icon: Settings,
      path: "/appointmentz/rm-config",
    },
    {
      id: "slots-config",
      label: "Slots Configuration",
      icon: Settings,
      path: "/appointmentz/slots-config",
    },
    {
      id: "block-days-config",
      label: "Block Days Configuration",
      icon: Settings,
      path: "/appointmentz/block-days-config",
    },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto overflow-x-hidden transition-all duration-300`}
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
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                title={item.label}
              >
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                )}
                <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppointmentzSidebar;
