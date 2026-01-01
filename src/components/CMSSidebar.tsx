import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  Building2,
  FileText,
  Users,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const CMSSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();
  const [setupOpen, setSetupOpen] = React.useState(true);

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

        {/* Header */}
        <div className={`mb-4 ${isSidebarCollapsed ? "text-center" : ""}`}>
          <h3
            className={`text-sm font-medium text-[#1a1a1a] opacity-70 uppercase ${
              isSidebarCollapsed ? "" : "tracking-wide"
            }`}
          >
            {isSidebarCollapsed ? "" : "Setup"}
          </h3>
        </div>

        {/* Menu */}
        <nav className="space-y-2">
          {/* Setup parent with sub-items */}
          <div>
            <button
              onClick={() => setSetupOpen((v) => !v)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
              title="Setup"
            >
              <FileText className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
              {!isSidebarCollapsed && <span className="truncate">Setup</span>}
              {!isSidebarCollapsed && (
                <span className="ml-auto">
                  {setupOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              )}
            </button>
            {/* Sub-menu for Setup */}
            {setupOpen && !isSidebarCollapsed && (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation("/cms/facility")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Facility"
                >
                  {isActive("/cms/facility") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Building2 className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Facility</span>
                </button>
                <button
                  onClick={() => handleNavigation("/cms/rules")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Rules"
                >
                  {isActive("/cms/rules") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <FileText className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Rules</span>
                </button>
              </div>
            )}
          </div>
          {/* Other main items */}
          <button
            onClick={() => handleNavigation("/cms/club-members")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Club Members"
          >
            {isActive("/cms/club-members") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <Users className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Club Members</span>}
          </button>
          <button
            onClick={() => handleNavigation("/cms/facility-bookings")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Facility Bookings"
          >
            {isActive("/cms/facility-bookings") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <Calendar className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Facility Bookings</span>}
          </button>
          <button
            onClick={() => handleNavigation("/cms/payments")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Payments"
          >
            {isActive("/cms/payments") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <CreditCard className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Payments</span>}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default CMSSidebar;
