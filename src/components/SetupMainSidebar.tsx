import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import {
  Users,
  FileText,
  Building2,
  Headset,
  ChevronLeft,
  ChevronRight,
  Info,
  Building,
  MapPin,
  Home,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export const SetupMainSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const setupMenuItems: MenuItem[] = [
    {
      id: "society-info",
      label: "Society Info",
      icon: <Info className="w-5 h-5" />,
      path: "/setup/society-info",
    },
    {
      id: "tower-management",
      label: "Tower Management",
      icon: <Building className="w-5 h-5" />,
      path: "/setup/tower-management",
    },
    {
      id: "flat-management",
      label: "Flat Management",
      icon: <Home className="w-5 h-5" />,
      path: "/setup/flat-management",
    },
    {
      id: "special-users",
      label: "Special Users Category",
      icon: <Users className="w-5 h-5" />,
      path: "/setup/special-users-category",
    },
    {
      id: "manage-users",
      label: "Manage Users",
      icon: <Users className="w-5 h-5" />,
      path: "/setup/manage-users",
    },
    {
      id: "kyc-details",
      label: "KYC Details",
      icon: <FileText className="w-5 h-5" />,
      path: "/setup/kyc-details",
    },
    {
      id: "manage-flats",
      label: "Manage Flats",
      icon: <Building2 className="w-5 h-5" />,
      path: "/setup/manage-flats",
    },
    {
      id: "helpdesk-setup",
      label: "Helpdesk Setup",
      icon: <Headset className="w-5 h-5" />,
      path: "/setup/helpdesk-setup",
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      } z-30 overflow-y-auto`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50 transition-colors z-10 shadow-sm"
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <h2
          className={`text-sm font-semibold text-gray-700 uppercase tracking-wide ${
            isSidebarCollapsed ? 'hidden' : 'block'
          }`}
        >
          Setup
        </h2>
      </div>

      {/* Menu Items */}
      <nav className="p-2">
        {setupMenuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 ${
                active
                  ? 'bg-[#C72030] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              {item.icon}
              {!isSidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
