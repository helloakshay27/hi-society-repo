import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  Users,
  Shield,
  Award,
  Settings,
  UserCheck,
  Home,
  FileText,
  Briefcase,
  Gift,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const LoyaltySidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const loyaltyMenuItems: MenuItem[] = [
    {
      id: "loyalty-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/loyalty/dashboard",
    },
    {
      id: "loyalty-members",
      label: "Members",
      icon: Users,
      path: "/loyalty/loyalty-members-list",
    },
    {
      id: "loyalty-tiers",
      label: "Tiers",
      icon: Award,
      path: "/loyalty/loyalty-tiers-list",
    },
    {
      id: "rule-engine",
      label: "Rule Engine",
      icon: Settings,
      path: "/loyalty/rule-engine-list",
    },
    {
      id: "loyalty-referral",
      label: "Referrals",
      icon: UserCheck,
      path: "/loyalty/referral-list",
    },
    {
      id: "lock-payments",
      label: "Lock Payments",
      icon: Shield,
      path: "/loyalty/lock-payments-list",
    },
    {
      id: "home-loan-requests",
      label: "Home Loan Requests",
      icon: Home,
      path: "/loyalty/home-loan-requests-list",
    },
    {
      id: "demand-notes",
      label: "Demand Notes",
      icon: FileText,
      path: "/loyalty/demand-notes-list",
    },
    {
      id: "demand-notes",
      label: "Demand Notes",
      icon: FileText,
      path: "/loyalty/demand-notes-list",
    },
    {
      id: "orders",
      label: "Orders",
      icon: Briefcase,
      path: "/loyalty/orders-list",
    },
    {
      id: "encash",
      label: "Encash",
      icon: Gift,
      path: "/loyalty/encash-list",
    },
  ];

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(path + "/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto transition-all duration-300`}
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

        {/* Spacer */}
        <div className="w-full h-4 bg-[#f6f4ee] border-[#e5e1d8] mb-2 mt-4" />

        {/* Header */}
        <div className={`mb-4 ${isSidebarCollapsed ? "text-center" : ""}`}>
          <h3
            className={`text-sm font-medium text-[#1a1a1a] opacity-70 uppercase ${
              isSidebarCollapsed ? "" : "tracking-wide"
            }`}
          >
            {isSidebarCollapsed ? "" : "Loyalty"}
          </h3>
        </div>

        {/* Menu */}
        <nav className="space-y-2">
          {loyaltyMenuItems.map((item) => {
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
                  <Icon className={`w-5 h-5 flex-shrink-0 text-[#1a1a1a]`} />

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

export default LoyaltySidebar;
