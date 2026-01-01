import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  Home,
  Settings,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const FitoutSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const fitoutMenuItems: MenuItem[] = [
    {
      id: "fitout-requests",
      label: "Fitout Requests",
      icon: Home,
      path: "/fitout/requests",
    },
    {
      id: "fitout-setup",
      label: "Fitout Setup",
      icon: Settings,
      path: "/fitout/setup",
    },
    {
      id: "fitout-checklists",
      label: "Fitout Checklists",
      icon: ClipboardCheck,
      path: "/fitout/checklists",
    },
    {
      id: "fitout-deviations",
      label: "Fitout Deviations",
      icon: AlertTriangle,
      path: "/fitout/deviations",
    },
    {
      id: "fitout-report",
      label: "Fitout Report",
      icon: FileText,
      path: "/fitout/report",
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
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto transition-all duration-300`}
      style={{ top: "4rem", height: "calc(100% - 4rem)" }}
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

        {/* Menu */}
        <nav className="space-y-2">
          {fitoutMenuItems.map((item) => {
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
                  <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />

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

export default FitoutSidebar;
