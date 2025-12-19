import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  MessageSquare,
  Settings as SettingsIcon,
  Users,
  Gift,
} from "lucide-react";
import { useLayout } from "../contexts/LayoutContext";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="w-4 h-4" />,
    path: "/maintenance/projects",
  },
  {
    id: "communication",
    label: "Communication",
    icon: <MessageSquare className="w-4 h-4" />,
    path: "/communication/notice",
  },
  {
    id: "setup",
    label: "Setup",
    icon: <SettingsIcon className="w-4 h-4" />,
    path: "/setup/special-users-category",
  },
  {
    id: "setup-member",
    label: "Setup Member",
    icon: <Users className="w-4 h-4" />,
    path: "/setup-member/user-list",
  },
  {
    id: "loyalty",
    label: "Loyalty",
    icon: <Gift className="w-4 h-4" />,
    path: "/loyalty/loyalty-members-list",
  },
];

export const HiSocietyNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed } = useLayout();
  const [activeNav, setActiveNav] = useState<string>("home");

  // Detect active navigation based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/communication")) {
      setActiveNav("communication");
    } else if (path.startsWith("/loyalty")) {
      setActiveNav("loyalty");
    } else if (path.startsWith("/setup-member")) {
      setActiveNav("setup-member");
    } else if (path.startsWith("/setup")) {
      setActiveNav("setup");
    } else {
      setActiveNav("home");
    }
  }, [location.pathname]);

  const handleNavClick = (item: NavigationItem) => {
    setActiveNav(item.id);
    navigate(item.path);
  };

  return (
    <div
      className={`h-12 border-b border-[#D5DbDB] fixed top-16 right-0 ${isSidebarCollapsed ? "left-16" : "left-64"} z-10 transition-all duration-300`}
      style={{ backgroundColor: "#f6f4ee" }}
    >
      <div className="flex items-center h-full px-4 overflow-x-auto">
        <div className="w-full overflow-x-auto md:overflow-visible no-scrollbar">
          {/* Mobile & Tablet: scroll + spacing; Desktop: full width and justify-between */}
          <div className="flex w-max lg:w-full space-x-4 md:space-x-6 lg:space-x-0 md:justify-start lg:justify-between whitespace-nowrap">
            {navigationItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`pb-3 text-sm transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                    isActive
                      ? "text-[#C72030] border-b-2 border-[#C72030] font-medium"
                      : "text-[#1a1a1a] opacity-70 hover:opacity-100"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
