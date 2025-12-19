import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import {
  Bell,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export const CommunicationSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const communicationMenuItems: MenuItem[] = [
    {
      id: "notice",
      label: "Notice",
      icon: <Bell className="w-5 h-5" />,
      path: "/communication/notices",
    },
    {
      id: "events",
      label: "Events",
      icon: <Calendar className="w-5 h-5" />,
      path: "/communication/events",
    },
    {
      id: "polls",
      label: "Polls",
      icon: <BarChart3 className="w-5 h-5" />,
      path: "/communication/polls",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-5 h-5" />,
      path: "/communication/notifications",
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
          Communication
        </h2>
      </div>

      {/* Menu Items */}
      <nav className="p-2">
        {communicationMenuItems.map((item) => {
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
