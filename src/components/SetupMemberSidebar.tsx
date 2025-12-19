import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import {
  Users,
  Shield,
  Database,
  Home,
  Building2,
  BarChart3,
  FileText,
  Settings,
  Gift,
  Building,
  Calendar,
  GraduationCap,
  Headset,
  Mail,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export const SetupMemberSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const setupMemberMenuItems: MenuItem[] = [
    {
      id: "user-list",
      label: "User Module",
      icon: <Users className="w-5 h-5" />,
      path: "/setup-member/user-list",
    },
    {
      id: "lock-role-list",
      label: "User Role",
      icon: <Shield className="w-5 h-5" />,
      path: "/setup-member/lock-role-list",
    },
    {
      id: "lock-function-list",
      label: "Lock Function",
      icon: <Shield className="w-5 h-5" />,
      path: "/setup-member/lock-function-list",
    },
    {
      id: "banks-list",
      label: "Banks",
      icon: <Database className="w-5 h-5" />,
      path: "/setup-member/banks-list",
    },
    {
      id: "home-loan-list",
      label: "Home Loans",
      icon: <Home className="w-5 h-5" />,
      path: "/setup-member/home-loan-list",
    },
    {
      id: "loan-manager-list",
      label: "Loan Managers",
      icon: <Users className="w-5 h-5" />,
      path: "/setup-member/loan-manager-list",
    },
    {
      id: "property-type-list",
      label: "Property Types",
      icon: <Home className="w-5 h-5" />,
      path: "/setup-member/property-type-list",
    },
    {
      id: "project-building-type-list",
      label: "Project Building",
      icon: <Building2 className="w-5 h-5" />,
      path: "/setup-member/project-building-type-list",
    },
    {
      id: "construction-status-list",
      label: "Construction Status",
      icon: <BarChart3 className="w-5 h-5" />,
      path: "/setup-member/construction-status-list",
    },
    {
      id: "construction-updates-list",
      label: "Construction Updates",
      icon: <FileText className="w-5 h-5" />,
      path: "/setup-member/construction-updates-list",
    },
    {
      id: "project-configuration-list",
      label: "Project Config",
      icon: <Settings className="w-5 h-5" />,
      path: "/setup-member/project-configuration-list",
    },
    {
      id: "amenities-list",
      label: "Amenities",
      icon: <Gift className="w-5 h-5" />,
      path: "/setup-member/amenities-list",
    },
    {
      id: "department-list",
      label: "Department",
      icon: <Building className="w-5 h-5" />,
      path: "/setup-member/department-list",
    },
    {
      id: "visitslot-list",
      label: "Visit Slot",
      icon: <Calendar className="w-5 h-5" />,
      path: "/setup-member/site-visit-slot-config-list",
    },
    {
      id: "tds-tutorials-list",
      label: "TDS Tutorials",
      icon: <GraduationCap className="w-5 h-5" />,
      path: "/setup-member/tds-tutorials-list",
    },
    {
      id: "plus-services-list",
      label: "Plus Services",
      icon: <Headset className="w-5 h-5" />,
      path: "/setup-member/plus-services-list",
    },
    {
      id: "smtp-settings-list",
      label: "SMTP Settings",
      icon: <Mail className="w-5 h-5" />,
      path: "/setup-member/smtp-settings-list",
    },
    {
      id: "faq-category-list",
      label: "FAQ Category",
      icon: <HelpCircle className="w-5 h-5" />,
      path: "/setup-member/faq-category-list",
    },
    {
      id: "faq-subcategory-list",
      label: "FAQ SubCategory",
      icon: <HelpCircle className="w-5 h-5" />,
      path: "/setup-member/faq-subcategory-list",
    },
  ];

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const menuPathSegments = path.split('/').filter(Boolean);
    
    if (pathSegments.length >= 2 && menuPathSegments.length >= 2) {
      return pathSegments[0] === menuPathSegments[0] && 
             pathSegments[1].includes(menuPathSegments[1].replace('-list', ''));
    }
    
    return false;
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
          Setup Member
        </h2>
      </div>

      {/* Menu Items */}
      <nav className="p-2">
        {setupMemberMenuItems.map((item) => {
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
