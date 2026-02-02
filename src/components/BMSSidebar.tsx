import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
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
  ChevronDown,
  ChevronUp,
  Bell,
  BarChart3,
  Users,
  Headset,
  Shield,
  Award,
  Settings,
  Home,
  Gift,
  Briefcase,
  Car,
  UsersRound,
  Clipboard,
  Tag,
  Cloud,
  File,
  TrendingUp,
  Package,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const BMSSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  // Check if current domain is CMS domain
  const isCMSDomain = window.location.hostname === 'ui-cms.lockated.com';

  // State for collapsible parent items
  const [communicationOpen, setCommunicationOpen] = useState(false);
  const [helpdeskOpen, setHelpdeskOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  // Loyalty removed from BMS sidebar
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [businessDirectoryOpen, setBusinessDirectoryOpen] = useState(false);

  // Communication sub-items
  const communicationItems: MenuItem[] = [
    {
      id: "notice",
      label: "Notice",
      icon: Bell,
      path: "/communication/notice",
    },
    {
      id: "events",
      label: "Events",
      icon: Calendar,
      path: "/communication/events",
    },
    {
      id: "polls",
      label: "Polls",
      icon: BarChart3,
      path: "/communication/polls",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      path: "/communication/notifications",
    },
  ];

  // Helpdesk sub-items
  const helpdeskItems: MenuItem[] = [
    {
      id: "helpdesk",
      label: "Helpdesk",
      icon: Headset,
      path: "/bms/helpdesk",
    },
    {
      id: "communication-template",
      label: "Communication Template",
      icon: MessageSquare,
      path: "/bms/communication-template",
    },
  ];

  // Home sub-items
  let homeItems: MenuItem[] = [
    {
      id: "project",
      label: "Project",
      icon: Layout,
      path: "/maintenance/project-details-list",
    },
    {
      id: "banner",
      label: "Banner",
      icon: Image,
      path: "/maintenance/banner-list",
    },
    {
      id: "event",
      label: "Event",
      icon: Calendar,
      path: "/maintenance/event-list",
    },
    {
      id: "offers",
      label: "Offers",
      icon: Tag,
      path: "/maintenance/offers-list",
    },
    {
      id: "broadcast",
      label: "Broadcast",
      icon: MessageSquare,
      path: "/maintenance/noticeboard-list",
    },
    {
      id: "press-releases",
      label: "Press Releases",
      icon: FileText,
      path: "/maintenance/press-releases-list",
    },
    {
      id: "faq",
      label: "FAQ",
      icon: HelpCircle,
      path: "/maintenance/faq-list",
    },
  ];

  // Loyalty menu removed from BMS sidebar

  // Documents sub-items
  const documentsItems: MenuItem[] = [
    {
      id: "flat-related",
      label: "Flat Related",
      icon: Building2,
      path: "/bms/documents/flat-related",
    },
    {
      id: "common-files",
      label: "Common Files",
      icon: File,
      path: "/bms/documents/common-files",
    },
  ];

  // Business Directory sub-items
  const businessDirectoryItems: MenuItem[] = [
    {
      id: "business-setup",
      label: "Setup",
      icon: Settings,
      path: "/bms/business-directory/setup",
    },
    {
      id: "business-directory",
      label: "Business Directory",
      icon: Building,
      path: "/bms/business-directory/list",
    },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const renderSubItems = (items: MenuItem[]) => {
    return items.map((item) => {
      const active = isActive(item.path);
      const Icon = item.icon;

      return (
        <button
          key={item.id}
          onClick={() => handleNavigation(item.path)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a] ml-6"
          title={item.label}
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
          )}
          <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
          {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
        </button>
      );
    });
  };

  const renderDirectItems = (items: MenuItem[]) => {
    return items.map((item) => {
      const active = isActive(item.path);
      const Icon = item.icon;

      return (
        <button
          key={item.id}
          onClick={() => handleNavigation(item.path)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
          title={item.label}
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
          )}
          <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
          {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
        </button>
      );
    });
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto overflow-x-hidden transition-all duration-300`}
      style={{ top: "4rem", height: "calc(100% - 4rem)" }}
    >
      <div className={`${isSidebarCollapsed ? "px-2 py-2" : "p-2"} pb-16`}>
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
        {!isSidebarCollapsed && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-[#1a1a1a] opacity-70 uppercase tracking-wide">
              BMS
            </h3>
          </div>
        )}

        {/* Menu Items */}
        <nav className="space-y-1">
          {/* Only show these items when NOT on CMS domain */}
          {!isCMSDomain && (
            <>
              {/* Communication Parent */}
              <div>
                <button
                  onClick={() => setCommunicationOpen(!communicationOpen)}
                  className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] text-[#1a1a1a]"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>Communication</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    communicationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {communicationOpen && !isSidebarCollapsed && (
                  <div className="mt-1 space-y-1">
                    {renderSubItems(communicationItems)}
                  </div>
                )}
              </div>

              {/* Helpdesk Parent */}
              <div>
                <button
                  onClick={() => setHelpdeskOpen(!helpdeskOpen)}
                  className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] text-[#1a1a1a]"
                >
                  <div className="flex items-center gap-3">
                    <Headset className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>Helpdesk</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    helpdeskOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {helpdeskOpen && !isSidebarCollapsed && (
                  <div className="mt-1 space-y-1">
                    {renderSubItems(helpdeskItems)}
                  </div>
                )}
              </div>

              {/* Feedback Standalone */}
              <button
                onClick={() => handleNavigation("/bms/feedbacks")}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"  
                title="Feedbacks"
              >
                {isActive("/bms/feedbacks") && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                )}
                <TrendingUp className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Feedbacks</span>}
              </button>

              {/* Parking Standalone */}
              <button
                onClick={() => handleNavigation("/bms/parking")}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                title="Parking"
              >
                {isActive("/bms/parking") && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                )}
                <Car className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Parking</span>}
              </button>

              {/* Groups Standalone */}
              <button
                onClick={() => handleNavigation("/bms/groups")}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                title="Groups"
              >
                {isActive("/bms/groups") && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                )}
                <UsersRound className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Groups</span>}
              </button>

              {/* Quarantine Tracker Standalone */}
              <button
                onClick={() => handleNavigation("/bms/quarantine-tracker")}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                title="Quarantine Tracker"
              >
                {isActive("/bms/quarantine-tracker") && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                )}
                <Clipboard className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Quarantine Tracker</span>}
              </button>

              {/* Offers Standalone */}
              <button
                onClick={() => handleNavigation("/bms/offers")}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                title="Offers"
              >
                {isActive("/bms/offers") && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                )}
                <Tag className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Offers</span>}
              </button>

              {/* Documents Parent */}
              <div>
                <button
                  onClick={() => setDocumentsOpen(!documentsOpen)}
                  className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] text-[#1a1a1a]"
                >
                  <div className="flex items-center gap-3">
                    <Cloud className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>Documents</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    documentsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {documentsOpen && !isSidebarCollapsed && (
                  <div className="mt-1 space-y-1">
                    {renderSubItems(documentsItems)}
                  </div>
                )}
              </div>

              {/* Business Directory Parent */}
              <div>
                <button
                  onClick={() => setBusinessDirectoryOpen(!businessDirectoryOpen)}
                  className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] text-[#1a1a1a]"
                >
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>Business Directory</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    businessDirectoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {businessDirectoryOpen && !isSidebarCollapsed && (
                  <div className="mt-1 space-y-1">
                    {renderSubItems(businessDirectoryItems)}
                  </div>
                )}
              </div>

              {/* MIS Standalone */}
              <button
                onClick={() => handleNavigation("/bms/mis")}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                title="MIS"
              >
                {isActive("/bms/mis") && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                )}
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>MIS</span>}
              </button>

              {/* Helpdesk Report Standalone */}
              <button
                onClick={() => handleNavigation("/bms/helpdesk-report")}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                title="Helpdesk Report"
              >
                {isActive("/bms/helpdesk-report") && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                )}
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Helpdesk Report</span>}
              </button>

              {/* Invoice Report Standalone */}
              <button
                onClick={() => handleNavigation("/bms/invoice-report")}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                title="Invoice Report"
              >
                {isActive("/bms/invoice-report") && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                )}
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Invoice Report</span>}
              </button>
            </>
          )}

          {/* Home items - Show directly on CMS domain, as parent on non-CMS domain */}
          {isCMSDomain ? (
            <>
              {renderDirectItems(homeItems)}
            </>
          ) : (
            <div>
              <button
                onClick={() => setHomeOpen(!homeOpen)}
                className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] text-[#1a1a1a]"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span>Home</span>}
                </div>
                {!isSidebarCollapsed && (
                  homeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {homeOpen && !isSidebarCollapsed && (
                <div className="mt-1 space-y-1">
                  {renderSubItems(homeItems)}
                </div>
              )}
            </div>
          )}

          {/* Loyalty menu removed from BMS sidebar */}
        </nav>
      </div>
    </div>
  );
};

export default BMSSidebar;
