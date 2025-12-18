import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import { 
  Settings,
  Users,
  FileText,
  Building2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Headset,
  MessageCircle,
  Bell,
  Calendar,
  BarChart3,
  Wrench,
  Database,
  Image,
  Globe,
  MapPin,
  Mail,
  Tags,
  GraduationCap,
  MessageSquare,
  Briefcase,
  Shield,
  Gift,
  Home,
  HomeIcon,
  UserPlus,
  Layout,
  HelpCircle,
  UserCheck,
  Award,
  Building
} from 'lucide-react';
import { hasPermission } from '../utils/permission';
import { API_CONFIG } from '@/config/apiConfig';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: MenuItem[];
}

export const SetupSidebar = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();
  const [isHomeExpanded, setIsHomeExpanded] = useState(false);
  const [isSetupExpanded, setIsSetupExpanded] = useState(false);
  const [isCommunicationExpanded, setIsCommunicationExpanded] = useState(false);
  const [isSetupMemberExpanded, setIsSetupMemberExpanded] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Auto-expand sections based on current route
  useEffect(() => {
    const path = location.pathname;
    
    // Check which section should be expanded
    if (path.startsWith('/setup-member')) {
      // Check if it's a home menu item or setup member item
      const isHomeItem = homeMenuItems.some(item => {
        if (!item.path) return false;
        return isActive(item.path);
      });
      
      if (isHomeItem) {
        setIsHomeExpanded(true);
        setIsSetupExpanded(false);
        setIsCommunicationExpanded(false);
        setIsSetupMemberExpanded(false);
      } else {
        setIsHomeExpanded(false);
        setIsSetupExpanded(false);
        setIsCommunicationExpanded(false);
        setIsSetupMemberExpanded(true);
        
        // Auto-expand loyalty submenu if on a loyalty page
        setupMemberMenuItems.forEach(item => {
          if (item.subItems && isParentActive(item.subItems)) {
            setExpandedMenus(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
          }
        });
      }
    } else if (path.startsWith('/setup')) {
      setIsHomeExpanded(false);
      setIsSetupExpanded(true);
      setIsCommunicationExpanded(false);
      setIsSetupMemberExpanded(false);
    } else if (path.startsWith('/communication')) {
      setIsHomeExpanded(false);
      setIsSetupExpanded(false);
      setIsCommunicationExpanded(true);
      setIsSetupMemberExpanded(false);
    }
  }, [location.pathname]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const setupMenuItems: MenuItem[] = [
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

  const communicationMenuItems: MenuItem[] = [
    {
      id: "notice",
      label: "Notice",
      icon: <Bell className="w-5 h-5" />,
      path: "/communication/notice",
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
  console.log("hasPermission:--",hasPermission);
  
  // Home menu items with permissions
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
    // {
    //   id: "broadcast",
    //   label: "Broadcast",
    //   icon: <Bell className="w-5 h-5" />,
    //   path: "/setup-member/noticeboard-list",
    // },
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
    // {
    //   id: "support-service",
    //   label: "Support Service",
    //   icon: <Headset className="w-5 h-5" />,
    //   path: "/setup-member/support-service-list",
    // },
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
  ].filter(Boolean);

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
    // Loyalty submenu
    {
      id: "loyalty",
      label: "Loyalty",
      icon: <Gift className="w-5 h-5" />,
      subItems: [
        { id: "loyalty-members", label: "Members", icon: <Users className="w-4 h-4" />, path: "/setup-member/loyalty-members-list" },
        { id: "loyalty-tiers", label: "Tiers", icon: <Award className="w-4 h-4" />, path: "/setup-member/loyalty-tiers-list" },
        { id: "rule-engine", label: "Rule Engine", icon: <Settings className="w-4 h-4" />, path: "/setup-member/rule-engine-list" },
        { id: "loyalty-referral", label: "Referrals", icon: <UserCheck className="w-4 h-4" />, path: "/setup-member/referral-list" },
        { id: "lock-payments", label: "Lock Payments", icon: <Shield className="w-4 h-4" />, path: "/setup-member/lock-payments-list" },
        { id: "home-loan-requests", label: "Home Loan Requests", icon: <Home className="w-4 h-4" />, path: "/setup-member/home-loan-requests-list" },
        { id: "demand-notes", label: "Demand Notes", icon: <FileText className="w-4 h-4" />, path: "/setup-member/demand-notes-list" },
        { id: "orders", label: "Orders", icon: <Briefcase className="w-4 h-4" />, path: "/setup-member/orders-list" },
        { id: "encash", label: "Encash", icon: <Gift className="w-4 h-4" />, path: "/setup-member/encash-list" },
      ]
    },
  ];

  const isActive = (path: string) => {
    // Exact match
    if (location.pathname === path) return true;
    
    // Check if current path is a child route of the menu item
    // For example: /setup-member/banner-add or /setup-member/banner-edit/:id should activate /setup-member/banner-list
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const menuPathSegments = path.split('/').filter(Boolean);
    
    // If the base segments match, consider it active
    // This handles cases like:
    // - /setup-member/banner-list (list page)
    // - /setup-member/banner-add (create page)
    // - /setup-member/banner-edit/123 (edit page)
    if (menuPathSegments.length >= 2 && pathSegments.length >= 2) {
      const menuBase = menuPathSegments.slice(0, 2).join('/'); // e.g., "setup-member/banner"
      const currentBase = pathSegments.slice(0, 2).join('/');
      
      // Extract the module name (e.g., "banner" from "banner-list")
      const menuModule = menuPathSegments[1].replace(/-list$/, '').replace(/-create$/, '').replace(/-add$/, '');
      const currentModule = pathSegments[1].split('-')[0]; // Get first part before hyphen
      
      // Check if the modules match
      if (menuPathSegments[0] === pathSegments[0] && menuModule === currentModule) {
        return true;
      }
    }
    
    return false;
  };

  const isParentActive = (subItems?: MenuItem[]) => {
    if (!subItems) return false;
    return subItems.some(item => {
      if (!item.path) return false;
      
      // Check exact match
      if (location.pathname === item.path) return true;
      
      // Check if current path is related to the menu item
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const menuPathSegments = item.path.split('/').filter(Boolean);
      
      if (menuPathSegments.length >= 2 && pathSegments.length >= 2) {
        const menuModule = menuPathSegments[1].replace(/-list$/, '').replace(/-create$/, '').replace(/-add$/, '');
        const currentModule = pathSegments[1].split('-')[0];
        
        if (menuPathSegments[0] === pathSegments[0] && menuModule === currentModule) {
          return true;
        }
      }
      
      return false;
    });
  };

  const CollapsedMenuItem = ({ item }: { item: MenuItem }) => (
    <div key={item.id} className="relative group">
      <button
        onClick={() => item.path && navigate(item.path)}
        className={`flex items-center justify-center !w-full h-12 rounded-lg transition-colors hover:bg-[#DBC2A9] relative ${
          "text-[#1a1a1a]"
        }`}
      >
        {item.path && isActive(item.path) && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
        )}
        <div className={item.path && isActive(item.path) ? "text-[#C72030]" : "text-[#1a1a1a]"}>
          {item.icon}
        </div>
      </button>
      
      {/* Tooltip */}
      <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
        {item.label}
      </div>
    </div>
  );

  const renderMenuItem = (item: MenuItem) => {
    if (isSidebarCollapsed) {
      return <CollapsedMenuItem key={item.id} item={item} />;
    }

    if (item.subItems) {
      const isMenuExpanded = expandedMenus.includes(item.id);
      const hasActiveChild = isParentActive(item.subItems);

      return (
        <div key={item.id}>
          <button
            onClick={() => toggleMenu(item.id)}
            className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
          >
            {hasActiveChild && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
            )}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`flex-shrink-0 ${hasActiveChild ? "text-[#C72030]" : "text-[#1a1a1a]"}`}>
                {item.icon}
              </div>
              <span className="truncate">{item.label}</span>
            </div>
            {isMenuExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </button>

          {isMenuExpanded && item.subItems && (
            <div className="space-y-1 mt-1">
              {item.subItems.map((subItem) => (
                <button
                  key={subItem.id}
                  onClick={() => navigate(subItem.path!)}
                  className="flex items-center gap-2 w-full pl-11 pr-3 py-2 rounded-lg text-sm font-normal transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                >
                  {isActive(subItem.path!) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
                  )}
                  <div className={`flex-shrink-0 ${isActive(subItem.path!) ? "text-[#C72030]" : "text-[#1a1a1a]"}`}>
                    {subItem.icon}
                  </div>
                  <span className="truncate">{subItem.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.id}>
        <button
          onClick={() => navigate(item.path!)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
        >
          {isActive(item.path!) && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
          )}
          <div className={`flex-shrink-0 ${isActive(item.path!) ? "text-[#C72030]" : "text-[#1a1a1a]"}`}>
            {item.icon}
          </div>
          <span className="truncate">{item.label}</span>
        </button>
      </div>
    );
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto transition-all duration-300`}
      style={{ top: "4rem", height: "91vh" }}
    >
      <div className={`${isSidebarCollapsed ? "px-2 py-2" : "p-2"}`}>
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
        {/* Add background and border below the collapse button */}
        <div className="w-full h-4 bg-[#f6f4ee] border-[#e5e1d8] mb-2"></div>

        <div className={`mb-4 ${isSidebarCollapsed ? "text-center" : ""}`}>
          <h3
            className={`text-sm font-medium text-[#1a1a1a] opacity-70 uppercase ${
              isSidebarCollapsed ? "text-center" : "tracking-wide"
            }`}
          >
            {isSidebarCollapsed ? "" : "Hi-Society Dashboard"}
          </h3>
        </div>

        <nav className="space-y-2">
          {/* Home Section */}
          {homeMenuItems.length > 0 && (
            <>
              <button
                onClick={() => !isSidebarCollapsed && setIsHomeExpanded(!isHomeExpanded)}
                className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
              >
                {isParentActive(homeMenuItems) && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
                )}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {isSidebarCollapsed ? (
                    <HomeIcon className={`w-5 h-5 flex-shrink-0 ${isParentActive(homeMenuItems) ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
                  ) : (
                    <>
                      <HomeIcon className={`w-5 h-5 flex-shrink-0 ${isParentActive(homeMenuItems) ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
                      <span className="truncate">Home</span>
                    </>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  isHomeExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )
                )}
              </button>

              {(isHomeExpanded || isSidebarCollapsed) && (
                <div className="space-y-1">
                  {homeMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path!)}
                      className="flex items-center gap-3 w-full pl-11 pr-3 py-2 rounded-lg text-sm font-normal transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                    >
                      {isActive(item.path!) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
                      )}
                      <div className={`flex-shrink-0 ${isActive(item.path!) ? "text-[#C72030]" : "text-[#1a1a1a]"}`}>
                        {item.icon}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Setup Section */}
          <button
            onClick={() => !isSidebarCollapsed && setIsSetupExpanded(!isSetupExpanded)}
            className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
          >
            {isParentActive(setupMenuItems) && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
            )}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {isSidebarCollapsed ? (
                <Settings className={`w-5 h-5 flex-shrink-0 ${isParentActive(setupMenuItems) ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
              ) : (
                <>
                  <Settings className={`w-5 h-5 flex-shrink-0 ${isParentActive(setupMenuItems) ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
                  <span className="truncate">Setup</span>
                </>
              )}
            </div>
            {!isSidebarCollapsed && (
              isSetupExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )
            )}
          </button>

          {(isSetupExpanded || isSidebarCollapsed) && (
            <div className="space-y-1">
              {setupMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path!)}
                  className="flex items-center gap-3 w-full pl-11 pr-3 py-2 rounded-lg text-sm font-normal transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                >
                  {isActive(item.path!) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
                  )}
                  <div className={`flex-shrink-0 ${isActive(item.path!) ? "text-[#C72030]" : "text-[#1a1a1a]"}`}>
                    {item.icon}
                  </div>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Communication Section */}
          <button
            onClick={() => !isSidebarCollapsed && setIsCommunicationExpanded(!isCommunicationExpanded)}
            className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
          >
            {isParentActive(communicationMenuItems) && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
            )}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {isSidebarCollapsed ? (
                <MessageCircle className={`w-5 h-5 flex-shrink-0 ${isParentActive(communicationMenuItems) ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
              ) : (
                <>
                  <MessageCircle className={`w-5 h-5 flex-shrink-0 ${isParentActive(communicationMenuItems) ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
                  <span className="truncate">Communication</span>
                </>
              )}
            </div>
            {!isSidebarCollapsed && (
              isCommunicationExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )
            )}
          </button>

          {(isCommunicationExpanded || isSidebarCollapsed) && (
            <div className="space-y-1">
              {communicationMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path!)}
                  className="flex items-center gap-3 w-full pl-11 pr-3 py-2 rounded-lg text-sm font-normal transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                >
                  {isActive(item.path!) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
                  )}
                  <div className={`flex-shrink-0 ${isActive(item.path!) ? "text-[#C72030]" : "text-[#1a1a1a]"}`}>
                    {item.icon}
                  </div>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Setup Member Section */}
          <button
            onClick={() => !isSidebarCollapsed && setIsSetupMemberExpanded(!isSetupMemberExpanded)}
            className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
          >
            {isParentActive(setupMemberMenuItems) && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
            )}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {isSidebarCollapsed ? (
                <Wrench className={`w-5 h-5 flex-shrink-0 ${isParentActive(setupMemberMenuItems) ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
              ) : (
                <>
                  <Wrench className={`w-5 h-5 flex-shrink-0 ${isParentActive(setupMemberMenuItems) ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
                  <span className="truncate">Setup Member</span>
                </>
              )}
            </div>
            {!isSidebarCollapsed && (
              isSetupMemberExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )
            )}
          </button>

          {(isSetupMemberExpanded || isSidebarCollapsed) && (
            <div className="space-y-1">
              {setupMemberMenuItems.map((item) => renderMenuItem(item))}
            </div>
          )}
        </nav>
      </div>
      </div>
  );
}
