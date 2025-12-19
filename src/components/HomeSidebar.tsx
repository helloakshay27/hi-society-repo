import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import {
  Layout,
  Image,
  MessageSquare,
  Calendar,
  FileText,
  Building2,
  MapPin,
  HelpCircle,
  UserCheck,
  Building,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export const HomeSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  const homeMenuItems: MenuItem[] = [
    {
      id: "project",
      label: "Project",
      icon: <Layout className="w-5 h-5" />,
      path: "/setup-member/project-details-list",
    },
    {
      id: "banner",
      label: "Banner",
      icon: <Image className="w-5 h-5" />,
      path: "/setup-member/banner-list",
    },
    {
      id: "testimonial",
      label: "Testimonial",
      icon: <MessageSquare className="w-5 h-5" />,
      path: "/setup-member/testimonial-list",
    },
    {
      id: "event",
      label: "Event",
      icon: <Calendar className="w-5 h-5" />,
      path: "/setup-member/event-list",
    },
    {
      id: "specification",
      label: "Specification",
      icon: <FileText className="w-5 h-5" />,
      path: "/setup-member/specification-list",
    },
    {
      id: "organization",
      label: "Organization",
      icon: <Building2 className="w-5 h-5" />,
      path: "/setup-member/organization-list",
    },
    {
      id: "company",
      label: "Company",
      icon: <Building className="w-5 h-5" />,
      path: "/setup-member/company-list",
    },
    {
      id: "site",
      label: "Site",
      icon: <MapPin className="w-5 h-5" />,
      path: "/setup-member/site-list",
    },
    {
      id: "press-releases",
      label: "Press Releases",
      icon: <FileText className="w-5 h-5" />,
      path: "/setup-member/press-releases-list",
    },
    {
      id: "faq",
      label: "FAQ",
      icon: <HelpCircle className="w-5 h-5" />,
      path: "/setup-member/faq-list",
    },
    {
      id: "referral-program",
      label: "Referral Program",
      icon: <UserCheck className="w-5 h-5" />,
      path: "/setup-member/referral-program-list",
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
          Home
        </h2>
      </div>

      {/* Menu Items */}
      <nav className="p-2">
        {homeMenuItems.map((item) => {
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
