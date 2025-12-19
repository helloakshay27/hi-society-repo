import React, { useState, useEffect } from "react";
import {
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Building2,
  Home,
  MessageSquare,
  SettingsIcon,
  Users,
  Gift,
  Shield,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUser, clearAuth } from "@/utils/auth";
import { permissionService } from "@/services/permissionService";

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

export const HiSocietyHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [userRoleName, setUserRoleName] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeNav, setActiveNav] = useState<string>("home");

  const { selectedCompany } = useSelector((state: RootState) => state.project);

  // Get user data
  const user = getUser() || {
    id: 0,
    firstname: "Guest",
    lastname: "",
    email: "",
  };
  const userFullName = `${user.firstname} ${user.lastname}`.trim();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    navigate("/profile/settings");
  };

  const handleNotificationsClick = () => {
    navigate("/notifications");
  };

  useEffect(() => {
    const loadUserInfo = () => {
      const displayName = permissionService.getDisplayName();
      const roleName = permissionService.getRoleName();
      setUserDisplayName(displayName);
      setUserRoleName(roleName);
    };
    loadUserInfo();
  }, []);

  // Detect active navigation based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/communication")) {
      setActiveNav("communication");
    } else if (path.startsWith("/loyalty")) { // <-- FIXED: loyalty path check
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

  const userType = localStorage.getItem("userType");
  const tempSwitchToAdmin =
    localStorage.getItem("tempType") === "pms_organization_admin";

  const hostname = window.location.hostname;
  const isOmanSite = hostname.includes("oig.gophygital.work");
  const isViSite = hostname.includes("vi-web.gophygital.work");
  const isWebSite = hostname.includes("web.gophygital.work");

  // --- UI/CSS update to match DynamicHeader ---
  return (
    <header
      className="h-12 border-b border-[#D5DbDB] fixed top-0 left-0 right-0 z-10 transition-all duration-300"
      style={{ backgroundColor: "#f6f4ee" }}
    >
      <div className="flex items-center h-full px-4 max-w-[1920px] mx-auto">
        {/* Left Section - Logo */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {isOmanSite ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width={180}
              height={60}
              viewBox="0 0 325 274"
              fill="none"
            >
              <rect width={325} height={274} fill="url(#pattern0_4116_1359)" />
              <defs>
                <pattern
                  id="pattern0_4116_1359"
                  patternContentUnits="objectBoundingBox"
                  width={1}
                  height={1}
                >
                  <use
                    xlinkHref="#image0_4116_1359"
                    transform="matrix(0.0015625 0 0 0.00185386 0 -0.0930132)"
                  />
                </pattern>
                <image
                  id="image0_4116_1359"
                  width={640}
                  height={640}
                  xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAKACAYAAAAMzckjAAAACXBIWXMAAC4jAAAuIwF4pT92AAAgAElEQVR4nOzdd3hUZd7G8XtmkknvhYTeq/QqCIgVsCF2RXEVXbGgq+va+66u2HtZ1F0bu2JBRVEUBOm99947hJBAQnqZef+YYSE9c+aceeb7ua5cQmYy55dzeJ57nnPO8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                />
              </defs>
            </svg>
          ) : isViSite ? (
            <svg
              width="218"
              height="48"
              viewBox="0 0 218 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
            >
              <path
                d="M65.8883 31.5589L59.819 16.6455H61.6721L65.8883 27.6271L70.0848 16.6455H71.9281L65.8883 31.5589Z"
                fill="#2C2C43"
              />
              <circle cx="24" cy="24" r="24" fill="url(#pattern0_4074_3337)" />
            </svg>
          ) : (
            <svg
              width="173"
              height="31"
              viewBox="0 0 173 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <text x="0" y="20" fill="#1a1a1a" fontSize="18" fontWeight="bold">
                Hi Society
              </text>
            </svg>
          )}
        </div>

        {/* Center Section - Navigation (scrollable, like DynamicHeader) */}
        <nav className="flex justify-center h-full w-[500px] mx-auto">
          <div className="w-full overflow-x-auto md:overflow-visible no-scrollbar h-full">
            <ul className="flex w-max lg:w-full space-x-4 md:space-x-6 lg:space-x-0 md:justify-start lg:justify-between whitespace-nowrap items-center h-full">
              {navigationItems.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <li key={item.id} className="flex-shrink-0">
                    <button
                      onClick={() => handleNavClick(item)}
                      className={`pb-3 text-sm transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 h-full ${
                        isActive
                          ? "text-[#C72030] border-b-2 border-[#C72030] font-medium bg-transparent"
                          : "text-[#1a1a1a] opacity-70 hover:opacity-100 bg-transparent"
                      }`}
                      style={{ background: "none", boxShadow: "none", borderRadius: 0, paddingLeft: 16, paddingRight: 16 }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Company Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 text-[#1a1a1a] hover:text-[#C72030] transition-colors">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium max-w-[150px] truncate">
                {selectedCompany?.name || "Select Company"}
              </span>
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-white border border-[#D5DbDB] shadow-lg">
              <DropdownMenuItem>
                <span className="text-sm">{selectedCompany?.name || "No Company"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <button
            onClick={handleNotificationsClick}
            className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notificationCount}
              </Badge>
            )}
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-[#C72030] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-0">
              {/* User Info Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900">
                  {userFullName}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{user.email}</p>

                {/* User Type & Role Pills */}
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200 font-medium"
                  >
                    <User className="w-3 h-3 mr-1" />
                    {userRoleName || "Admin"}
                  </Badge>
                </div>
              </div>

              {/* View Switcher - Only for Admin Users */}
              {tempSwitchToAdmin && (
                <>
                  <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Switch View
                    </p>
                    <button
                      onClick={() => {
                        localStorage.setItem(
                          "userType",
                          "pms_organization_admin"
                        );
                        localStorage.setItem("selectedView", "admin");
                        localStorage.removeItem("tempType");
                        window.location.href = "/maintenance/asset";
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm bg-white hover:bg-[#C72030] text-gray-700 hover:text-white transition-all duration-200 border border-gray-200 hover:border-[#C72030] group shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">Admin View</span>
                      </div>
                      <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <p className="text-xs text-gray-500 mt-2 px-1">
                      Access full system controls and settings
                    </p>
                  </div>
                </>
              )}

              {/* Menu Items */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={handleProfileClick}
                  className="mx-2 my-1 rounded-md"
                >
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSettingsClick}
                  className="mx-2 my-1 rounded-md"
                >
                  <Settings className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-1" />

              {/* Logout Button */}
              <div className="p-2">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
