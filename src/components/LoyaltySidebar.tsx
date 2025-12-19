import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export const LoyaltySidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const loyaltyMenuItems: SubMenuItem[] = [
    {
      id: "loyalty-dashboard",
      label: "Dashboard",
      icon: <Gift className="w-5 h-5" />,
      path: "/setup-member/loyalty/dashboard",
    },
    {
      id: "loyalty-members",
      label: "Members",
      icon: <Users className="w-5 h-5" />,
      path: "/setup-member/loyalty-members-list",
    },
    {
      id: "loyalty-tiers",
      label: "Tiers",
      icon: <Award className="w-5 h-5" />,
      path: "/setup-member/loyalty-tiers-list",
    },
    {
      id: "rule-engine",
      label: "Rule Engine",
      icon: <Settings className="w-5 h-5" />,
      path: "/setup-member/rule-engine-list",
    },
    {
      id: "loyalty-referral",
      label: "Referrals",
      icon: <UserCheck className="w-5 h-5" />,
      path: "/setup-member/referral-list",
    },
    {
      id: "lock-payments",
      label: "Lock Payments",
      icon: <Shield className="w-5 h-5" />,
      path: "/setup-member/lock-payments-list",
    },
    {
      id: "home-loan-requests",
      label: "Home Loan Requests",
      icon: <Home className="w-5 h-5" />,
      path: "/setup-member/home-loan-requests-list",
    },
    {
      id: "demand-notes",
      label: "Demand Notes",
      icon: <FileText className="w-5 h-5" />,
      path: "/setup-member/demand-notes-list",
    },
    {
      id: "orders",
      label: "Orders",
      icon: <Briefcase className="w-5 h-5" />,
      path: "/setup-member/orders-list",
    },
    {
      id: "encash",
      label: "Encash",
      icon: <Gift className="w-5 h-5" />,
      path: "/setup-member/encash-list",
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
          Loyalty
        </h2>
      </div>

      {/* Menu Items */}
      <nav className="p-2">
        {loyaltyMenuItems.map((item) => {
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
