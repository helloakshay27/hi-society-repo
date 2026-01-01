import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  LogIn,
  LogOut,
  History,
  Users,
  Car,
  FileText,
  MapPin,
  Settings,
  UserCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const SmartSecureSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();
  const [staffsOpen, setStaffsOpen] = React.useState(true);
  const [vehiclesOpen, setVehiclesOpen] = React.useState(true);
  const [reportsOpen, setReportsOpen] = React.useState(true);
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

        {/* Menu */}
        <nav className="space-y-2">
          {/* Visitor In */}
          <button
            onClick={() => handleNavigation("/smartsecure/visitor-in")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Visitor In"
          >
            {isActive("/smartsecure/visitor-in") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <LogIn className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Visitor In</span>}
          </button>

          {/* Visitor Out */}
          <button
            onClick={() => handleNavigation("/smartsecure/visitor-out")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Visitor Out"
          >
            {isActive("/smartsecure/visitor-out") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <LogOut className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Visitor Out</span>}
          </button>

          {/* Visitor History */}
          <button
            onClick={() => handleNavigation("/smartsecure/visitor-history")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Visitor History"
          >
            {isActive("/smartsecure/visitor-history") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <History className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Visitor History</span>}
          </button>

          {/* Staffs parent with sub-items */}
          <div>
            <button
              onClick={() => setStaffsOpen((v) => !v)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
              title="Staffs"
            >
              <Users className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
              {!isSidebarCollapsed && <span className="truncate">Staffs</span>}
              {!isSidebarCollapsed && (
                <span className="ml-auto">
                  {staffsOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              )}
            </button>
            {/* Sub-menu for Staffs */}
            {staffsOpen && !isSidebarCollapsed && (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation("/smartsecure/staffs/all")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="All"
                >
                  {isActive("/smartsecure/staffs/all") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Users className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">All</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/staffs/in")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="In"
                >
                  {isActive("/smartsecure/staffs/in") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <LogIn className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">In</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/staffs/out")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Out"
                >
                  {isActive("/smartsecure/staffs/out") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <LogOut className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Out</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/staffs/history")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="History"
                >
                  {isActive("/smartsecure/staffs/history") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <History className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">History</span>
                </button>
              </div>
            )}
          </div>

          {/* Vehicles parent with sub-items */}
          <div>
            <button
              onClick={() => setVehiclesOpen((v) => !v)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
              title="Vehicles"
            >
              <Car className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
              {!isSidebarCollapsed && <span className="truncate">Vehicles</span>}
              {!isSidebarCollapsed && (
                <span className="ml-auto">
                  {vehiclesOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              )}
            </button>
            {/* Sub-menu for Vehicles */}
            {vehiclesOpen && !isSidebarCollapsed && (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation("/smartsecure/vehicles/out")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Out"
                >
                  {isActive("/smartsecure/vehicles/out") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <LogOut className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Out</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/vehicles/history")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="History"
                >
                  {isActive("/smartsecure/vehicles/history") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <History className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">History</span>
                </button>
              </div>
            )}
          </div>

          {/* Reports parent with sub-items */}
          <div>
            <button
              onClick={() => setReportsOpen((v) => !v)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
              title="Reports"
            >
              <FileText className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
              {!isSidebarCollapsed && <span className="truncate">Reports</span>}
              {!isSidebarCollapsed && (
                <span className="ml-auto">
                  {reportsOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              )}
            </button>
            {/* Sub-menu for Reports */}
            {reportsOpen && !isSidebarCollapsed && (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation("/smartsecure/reports/visitors")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Visitors"
                >
                  {isActive("/smartsecure/reports/visitors") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Users className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Visitors</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/reports/staffs")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Staffs"
                >
                  {isActive("/smartsecure/reports/staffs") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Users className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Staffs</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/reports/member-vehicles")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Member Vehicles"
                >
                  {isActive("/smartsecure/reports/member-vehicles") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Car className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Member Vehicles</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/reports/guest-vehicles")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Guest Vehicles"
                >
                  {isActive("/smartsecure/reports/guest-vehicles") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Car className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Guest Vehicles</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/reports/patrolling")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Patrolling"
                >
                  {isActive("/smartsecure/reports/patrolling") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <MapPin className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Patrolling</span>
                </button>
              </div>
            )}
          </div>

          {/* Patrolling */}
          <button
            onClick={() => handleNavigation("/smartsecure/patrolling")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title="Patrolling"
          >
            {isActive("/smartsecure/patrolling") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <MapPin className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
            {!isSidebarCollapsed && <span className="truncate">Patrolling</span>}
          </button>

          {/* Setup parent with sub-items */}
          <div>
            <button
              onClick={() => setSetupOpen((v) => !v)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
              title="Setup"
            >
              <Settings className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
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
                  onClick={() => handleNavigation("/smartsecure/setup/general")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="General"
                >
                  {isActive("/smartsecure/setup/general") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Settings className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">General</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/setup/visitor-parking")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Visitor Parking"
                >
                  {isActive("/smartsecure/setup/visitor-parking") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <Car className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Visitor Parking</span>
                </button>
                <button
                  onClick={() => handleNavigation("/smartsecure/setup/support-staff")}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
                  title="Support Staff"
                >
                  {isActive("/smartsecure/setup/support-staff") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <UserCircle className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">Support Staff</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default SmartSecureSidebar;
