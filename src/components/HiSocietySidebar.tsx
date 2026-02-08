import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import {
  Home,
  Settings as SettingsIcon,
  Gift,
  Users,
  MessageSquare,
  Bell,
  Calendar,
  BarChart3,
  Headset,
  Layout,
  Image,
  Tag,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Award,
  UserCheck,
  Shield,
  Briefcase,
  Building2,
  CreditCard,
  Receipt,
  Calculator,
  PieChart,
  Database,
  Zap,
  LogIn,
  LogOut,
  History,
  Car,
  Truck,
  AlertTriangle,
  FileInput,
  Utensils,
  FolderKanban,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  subItems?: MenuItem[];
}

interface SectionConfig {
  title: string;
  items: MenuItem[];
}

export const HiSocietySidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  // Domain detection
  const hostname = window.location.hostname;
  const isCMSDomain = hostname === "ui-cms.lockated.com";
  const isFitoutDomain = hostname === "web.hisociety.lockated.com";

  // Collapsible state management
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    communication: false,
    helpdesk: false,
    home: false,
    loyalty: false,
    documents: false,
    businessDirectory: false,
    setup: true,
    setupMember: true,
    applicationSetup: true,
    accountant: true,
    configuration: true,
    reports: true,
    staffs: true,
    vehicles: true,
    smartsecureReports: true,
    smartsecureSetup: true,
  });

  // Determine active section based on route
  const getActiveSection = (): string => {
    const path = location.pathname;

    // Define child routes for each section (routes without parent prefix)
    const loyaltyChildRoutes = [
      "contests",
      "wallet-management",
      "customers",
      "inventory-section",
      "members",
      "tiers",
      "rule-engine",
      "referrals",
      "lock-payments",
      "home-loan-requests",
      "demand-notes",
      "orders",
      "encash",
    ];

    const homeChildRoutes = [
      "project",
      "banner",
      "event",
      "offers",
      "broadcast",
      "press-releases",
      "faq",
    ];

    // Extract first segment from path
    const segments = path.split('/').filter(Boolean);
    const firstSegment = segments[0];

    // Check for Application Setup paths first - these should stay in settings
    if (
      path.startsWith("/campaigns/referral-setup") ||
      path.startsWith("/fitout/setup") ||
      path.startsWith("/accounting/tax-setup") ||
      path.startsWith("/accounting/payment-terms") ||
      path.startsWith("/accounting/vendors") ||
      path.startsWith("/smartsecure/visitor-purpose") ||
      path.startsWith("/smartsecure/vehicle-type") ||
      path.startsWith("/smartsecure/material-type") ||
      path.startsWith("/incidents/setup") ||
      path.startsWith("/osr/setup")
    ) {
      return "settings";
    }

    if (path.startsWith("/cms")) return "cms";
    if (path.startsWith("/campaigns")) return "campaigns";
    if (path.startsWith("/fb")) return "fb";
    if (path.startsWith("/osr")) return "osr";
    if (path.startsWith("/fitout")) return "fitout";
    if (path.startsWith("/accounting")) return "accounting";
    if (path.startsWith("/smartsecure")) return "smartsecure";
    if (path.startsWith("/incidents")) return "incidents";
    if (path.startsWith("/appointmentz")) return "appointmentz";
    if (path.startsWith("/settings")) return "settings";
    if (path.startsWith("/loyalty") || loyaltyChildRoutes.includes(firstSegment)) return "loyalty";
    if (path.startsWith("/bms") || path.startsWith("/communication"))
      return "bms";
    if (path.startsWith("/maintenance") || homeChildRoutes.includes(firstSegment)) return "home";
    return "home";
  };

  const activeSection = getActiveSection();

  // All menu configurations
  const menuConfigurations: Record<string, SectionConfig> = {
    bms: {
      title: "BMS",
      items: [
        {
          id: "communication",
          label: "Communication",
          icon: MessageSquare,
          subItems: [
            {
              id: "notice",
              label: "Notice",
              icon: Bell,
              path: "/bms/hisoc-notice-list",
            },
            {
              id: "events",
              label: "Events",
              icon: Calendar,
              path: "/bms/hisoc-event-list",
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
          ],
        },
        {
          id: "helpdesk",
          label: "Helpdesk",
          icon: Headset,
          subItems: [
            {
              id: "helpdesk-main",
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
          ],
        },
        {
          id: "feedbacks",
          label: "Feedbacks",
          icon: BarChart3,
          path: "/bms/feedbacks",
        },
        { id: "parking", label: "Parking", icon: Car, path: "/bms/parking" },
        { id: "groups", label: "Groups", icon: Users, path: "/bms/groups" },
        {
          id: "quarantine-tracker",
          label: "Quarantine Tracker",
          icon: ClipboardCheck,
          path: "/bms/quarantine-tracker",
        },
        { id: "offers-bms", label: "Offers", icon: Tag, path: "/bms/offers" },
        {
          id: "documents",
          label: "Documents",
          icon: FileText,
          subItems: [
            {
              id: "flat-related",
              label: "Flat Related",
              icon: Building2,
              path: "/bms/documents/flat-related",
            },
            {
              id: "common-files",
              label: "Common Files",
              icon: FileText,
              path: "/bms/documents/common-files",
            },
          ],
        },
        {
          id: "business-directory",
          label: "Business Directory",
          icon: Building2,
          subItems: [
            {
              id: "business-setup",
              label: "Setup",
              icon: SettingsIcon,
              path: "/bms/business-directory/setup",
            },
            {
              id: "business-list",
              label: "Business Directory",
              icon: Building2,
              path: "/bms/business-directory/list",
            },
          ],
        },
        { id: "mis", label: "MIS", icon: BarChart3, path: "/bms/mis" },
        {
          id: "helpdesk-report",
          label: "Helpdesk Report",
          icon: BarChart3,
          path: "/bms/helpdesk-report",
        },
        {
          id: "invoice-report",
          label: "Invoice Report",
          icon: BarChart3,
          path: "/bms/invoice-report",
        },
      ],
    },
    home: {
      title: "Home",
      items: [
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
          icon: Gift,
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
      ],
    },
    loyalty: {
      title: "Loyalty",
      items: [
        {
          id: "loyalty-dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          path: "/loyalty/dashboard",
        },
        {
          id: "wallet-management",
          label: "Wallet Management",
          icon: Database,
          path: "/loyalty/wallet-management",
        },
        {
          id: "loyalty-customers",
          label: "Customers",
          icon: Users,
          path: "/loyalty/customers",
        },
        {
          id: "loyalty-inventory",
          label: "Inventory Section",
          icon: Database,
          path: "/loyalty/inventory-section",
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
          icon: SettingsIcon,
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
          id: "orders",
          label: "Orders",
          icon: Briefcase,
          path: "/loyalty/orders-list",
        },
        {
          id: "Contest",
          label: "Contest",
          icon: Briefcase,
          path: "/contests",
        },

        {
          id: "encash",
          label: "Encash",
          icon: Gift,
          path: "/loyalty/encash-list",
        },
      ],
    },
    cms: {
      title: "CMS",
      items: [
        {
          id: "setup",
          label: "Setup",
          icon: SettingsIcon,
          subItems: [
            {
              id: "facility-setup",
              label: "Facility Setup",
              icon: SettingsIcon,
              path: "/cms/facility-setup",
            },
            { id: "rules", label: "Rules", icon: FileText, path: "/cms/rules" },
            {
              id: "membership-plan-setup",
              label: "Membership Plan Setup",
              icon: FileText,
              path: "/cms/membership-plan-setup",
            },
          ],
        },
        {
          id: "club-members",
          label: "Club Members",
          icon: Users,
          path: "/cms/club-members",
        },
        {
          id: "facility-bookings",
          label: "Facility Bookings",
          icon: Calendar,
          path: "/cms/facility-bookings",
        },
        {
          id: "payments",
          label: "Payments",
          icon: CreditCard,
          path: "/cms/payments",
        },
      ],
    },
    campaigns: {
      title: "Campaigns",
      items: [
        {
          id: "referrals",
          label: "Referrals",
          icon: Gift,
          path: "/campaigns/referrals",
        },
        {
          id: "other-project",
          label: "Other Project",
          icon: FolderKanban,
          path: "/campaigns/other-project",
        },
      ],
    },
    fitout: {
      title: "Fitout",
      items: [
        {
          id: "fitout-requests",
          label: "Fitout Requests",
          icon: Home,
          path: "/fitout/requests",
        },
        {
          id: "fitout-checklists",
          label: "Fitout Checklists",
          icon: ClipboardCheck,
          path: "/fitout/checklists",
        },
        {
          id: "fitout-deviations",
          label: "Fitout Deviations",
          icon: AlertTriangle,
          path: "/fitout/deviations",
        },
        {
          id: "fitout-report",
          label: "Fitout Report",
          icon: FileText,
          path: "/fitout/report",
        },
      ],
    },
    accounting: {
      title: "Accounting",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          path: "/accounting/dashboard",
        },
        {
          id: "accountant",
          label: "Accountant",
          icon: Users,
          subItems: [
            {
              id: "chart-of-accounts",
              label: "Chart of Accounts",
              icon: PieChart,
              path: "/accounting/chart-of-accounts",
            },
            {
              id: "ledger",
              label: "Ledger",
              icon: FileText,
              path: "/accounting/ledger",
            },
            {
              id: "journal",
              label: "Journal",
              icon: FileText,
              path: "/accounting/journal",
            },
            {
              id: "trial-balance",
              label: "Trial Balance",
              icon: Calculator,
              path: "/accounting/trial-balance",
            },
          ],
        },
        {
          id: "transactions",
          label: "Transactions",
          icon: CreditCard,
          path: "/accounting/transactions",
        },
        {
          id: "invoices",
          label: "Invoices",
          icon: FileText,
          path: "/accounting/invoices",
        },
        {
          id: "receipts",
          label: "Receipts",
          icon: Receipt,
          path: "/accounting/receipts",
        },
        {
          id: "reports",
          label: "Reports",
          icon: BarChart3,
          subItems: [
            {
              id: "profit-loss",
              label: "Profit & Loss",
              icon: PieChart,
              path: "/accounting/profit-loss",
            },
            {
              id: "balance-sheet",
              label: "Balance Sheet",
              icon: FileText,
              path: "/accounting/balance-sheet",
            },
            {
              id: "cash-flow",
              label: "Cash Flow",
              icon: Database,
              path: "/accounting/cash-flow",
            },
          ],
        },
      ],
    },
    smartsecure: {
      title: "SmartSecure",
      items: [
        {
          id: "visitor-in",
          label: "Visitor In",
          icon: LogIn,
          path: "/smartsecure/visitor-in",
        },
        {
          id: "visitor-out",
          label: "Visitor Out",
          icon: LogOut,
          path: "/smartsecure/visitor-out",
        },
        {
          id: "visitor-history",
          label: "Visitor History",
          icon: History,
          path: "/smartsecure/visitor-history",
        },
        {
          id: "staffs",
          label: "Staffs",
          icon: Users,
          subItems: [
            {
              id: "staff-in",
              label: "Staff In",
              icon: LogIn,
              path: "/smartsecure/staff-in",
            },
            {
              id: "staff-out",
              label: "Staff Out",
              icon: LogOut,
              path: "/smartsecure/staff-out",
            },
            {
              id: "staff-history",
              label: "Staff History",
              icon: History,
              path: "/smartsecure/staff-history",
            },
          ],
        },
        {
          id: "vehicles",
          label: "Vehicles",
          icon: Car,
          subItems: [
            {
              id: "vehicle-in",
              label: "Vehicle In",
              icon: LogIn,
              path: "/smartsecure/vehicle-in",
            },
            {
              id: "vehicle-out",
              label: "Vehicle Out",
              icon: LogOut,
              path: "/smartsecure/vehicle-out",
            },
          ],
        },
        {
          id: "smartsecure-reports",
          label: "Reports",
          icon: BarChart3,
          subItems: [
            {
              id: "visitor-report",
              label: "Visitor Report",
              icon: FileText,
              path: "/smartsecure/visitor-report",
            },
            {
              id: "staff-report",
              label: "Staff Report",
              icon: FileText,
              path: "/smartsecure/staff-report",
            },
            {
              id: "vehicle-report",
              label: "Vehicle Report",
              icon: FileText,
              path: "/smartsecure/vehicle-report",
            },
            {
              id: "material-report",
              label: "Material Report",
              icon: FileText,
              path: "/smartsecure/material-report",
            },
          ],
        },
        {
          id: "patrolling",
          label: "Patrolling",
          icon: BarChart3,
          subItems: [
            {
              id: "patrolling-info",
              label: "Patrolling Info",
              icon: FileText,
              path: "/smartsecure/patrolling-info",
            },
            {
              id: "response",
              label: "Response",
              icon: FileText,
              path: "/smartsecure/response",
            },
          ],
        },
      ],
    },
    incidents: {
      title: "Incidents",
      items: [
        {
          id: "incidents",
          label: "Incidents",
          icon: AlertTriangle,
          path: "/incidents/incidents",
        },
        {
          id: "design-inputs",
          label: "Design Inputs",
          icon: FileInput,
          path: "/incidents/design-inputs",
        },
      ],
    },
    fb: {
      title: "F & B",
      items: [
        {
          id: "restaurants",
          label: "Restaurants",
          icon: Utensils,
          path: "/fb/restaurants",
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          path: "/fb/notifications",
        },
      ],
    },
    appointmentz: {
      title: "Appointmentz",
      items: [
        {
          id: "site-visit-requests",
          label: "Site Visit Requests",
          icon: Calendar,
          path: "/appointmentz/site-scheduling",
        },
        {
          id: "rm-cs-config",
          label: "RM/CS Configuration",
          icon: SettingsIcon,
          path: "/appointmentz/rm-config",
        },
        {
          id: "slots-config",
          label: "Slots Configuration",
          icon: SettingsIcon,
          path: "/appointmentz/slots-config",
        },
        {
          id: "block-days-config",
          label: "Block Days Configuration",
          icon: SettingsIcon,
          path: "/appointmentz/block-days-config",
        },
      ],
    },
    osr: {
      title: "OSR",
      items: [
        {
          id: "manage-bookings",
          label: "Manage Bookings",
          icon: Calendar,
          path: "/osr/manage-bookings",
        },
      ],
    },
    settings: {
      title: "Settings",
      items: [
        {
          id: "setup",
          label: "Setup",
          icon: SettingsIcon,
          subItems: [
            {
              id: "special-users",
              label: "Special Users Category",
              icon: Users,
              path: "/settings/special-users-category",
            },
            {
              id: "manage-users",
              label: "Manage Users",
              icon: Users,
              path: "/settings/manage-users",
            },
            {
              id: "kyc-details",
              label: "KYC Details",
              icon: FileText,
              path: "/settings/kyc-details",
            },
            {
              id: "manage-flats",
              label: "Manage Flats",
              icon: Building2,
              path: "/settings/manage-flats",
            },
            {
              id: "helpdesk-setup",
              label: "Helpdesk Setup",
              icon: Headset,
              path: "/settings/helpdesk-setup",
            },
          ],
        },
        {
          id: "setup-member",
          label: "Setup Member",
          icon: Users,
          subItems: [
            {
              id: "template-list",
              label: "Template",
              icon: FileText,
              path: "/settings/template-list",
            },
            {
              id: "groups",
              label: "Groups",
              icon: Users,
              path: "/settings/groups-list",
            },
            {
              id: "property-type-list",
              label: "Property Types",
              icon: Home,
              path: "/settings/property-type-list",
            },
            {
              id: "project-building-type-list",
              label: "Project Building",
              icon: Building2,
              path: "/settings/project-building-type-list",
            },
            {
              id: "construction-status-list",
              label: "Construction Status",
              icon: BarChart3,
              path: "/settings/construction-status-list",
            },
            {
              id: "project-configuration-list",
              label: "Project Config",
              icon: SettingsIcon,
              path: "/settings/project-configuration-list",
            },
            {
              id: "amenities-list",
              label: "Amenities",
              icon: Gift,
              path: "/settings/amenities-list",
            },
            {
              id: "connectivity-type-list",
              label: "Connectivity Type",
              icon: Calendar,
              path: "/settings/connectivity-type-list",
            },
            {
              id: "faq-category-list",
              label: "FAQ Category",
              icon: HelpCircle,
              path: "/settings/faq-category-list",
            },
            {
              id: "faq-subcategory-list",
              label: "FAQ SubCategory",
              icon: HelpCircle,
              path: "/settings/faq-subcategory-list",
            },
            {
              id: "image-configuration-list",
              label: "Image Configuration",
              icon: HelpCircle,
              path: "/settings/image-config-list",
            },
          ],
        },
        {
          id: "application-setup",
          label: "Application Setup",
          icon: SettingsIcon,
          subItems: [
            {
              id: "referral-setup",
              label: "Referral Setup",
              icon: Gift,
              path: "/campaigns/referral-setup",
            },
            {
              id: "fitout-setup",
              label: "Fitout Setup",
              icon: Home,
              path: "/fitout/setup",
            },
            {
              id: "tax-setup",
              label: "Tax Setup",
              icon: Calculator,
              path: "/accounting/tax-setup",
            },
            {
              id: "payment-terms",
              label: "Payment Terms",
              icon: Calendar,
              path: "/accounting/payment-terms",
            },
            {
              id: "vendors",
              label: "Vendors",
              icon: Users,
              path: "/accounting/vendors",
            },
            {
              id: "smartsecure-setup",
              label: "SmartSecure Setup",
              icon: SettingsIcon,
              subItems: [
                {
                  id: "visitor-purpose",
                  label: "Visitor Purpose",
                  icon: SettingsIcon,
                  path: "/smartsecure/visitor-purpose",
                },
                {
                  id: "vehicle-type",
                  label: "Vehicle Type",
                  icon: Car,
                  path: "/smartsecure/vehicle-type",
                },
                {
                  id: "material-type",
                  label: "Material Type",
                  icon: Truck,
                  path: "/smartsecure/material-type",
                },
              ],
            },
            {
              id: "incidents-setup",
              label: "Incidents Setup",
              icon: AlertTriangle,
              path: "/incidents/setup",
            },
            {
              id: "osr-setup",
              label: "OSR Setup",
              icon: Calendar,
              path: "/osr/setup",
            },
          ],
        },
      ],
    },
  };

  // Get current menu items based on active section
  const currentConfig = menuConfigurations[activeSection] || {
    title: "",
    items: [],
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Check if path is active
  const isActive = (path?: string) => {
    if (!path) return false;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Render menu item
  const renderMenuItem = (
    item: MenuItem,
    level: number = 0
  ): React.ReactNode => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedSections[item.id] || false;
    const Icon = item.icon;
    const active = isActive(item.path);

    if (isSidebarCollapsed) {
      // Collapsed view - show only icons
      return (
        <div key={item.id}>
          <button
            onClick={() => {
              if (hasSubItems) {
                // Navigate to first sub-item
                const firstSubItem = item.subItems![0];
                if (firstSubItem.path) {
                  handleNavigation(firstSubItem.path);
                }
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            className="flex items-center justify-center w-full p-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
            title={item.label}
          >
            {active && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
            )}
            <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
          </button>
        </div>
      );
    }

    // Expanded view
    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasSubItems) {
              toggleSection(item.id);
            } else if (item.path) {
              handleNavigation(item.path);
            }
          }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
        >
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
          )}
          <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
          <span className="truncate flex-1 text-left">{item.label}</span>
          {hasSubItems &&
            (isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            ))}
        </button>

        {/* Render sub-items */}
        {hasSubItems && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.subItems!.map((subItem) => {
              const subActive = isActive(subItem.path);
              const SubIcon = subItem.icon;

              return (
                <button
                  key={subItem.id}
                  onClick={() => subItem.path && handleNavigation(subItem.path)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                >
                  {subActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                  )}
                  <SubIcon className="w-4 h-4 flex-shrink-0 text-[#1a1a1a]" />
                  <span className="truncate">{subItem.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Don't render if no items
  if (currentConfig.items.length === 0) {
    return null;
  }

  return (
    <div
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto transition-all duration-300`}
      style={{ top: "4rem", height: "calc(100% - 4rem)" }}
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
        {!isSidebarCollapsed && currentConfig.title && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-[#1a1a1a] opacity-70 uppercase tracking-wide">
              {currentConfig.title}
            </h3>
          </div>
        )}

        {/* Menu */}
        <nav className="space-y-2">
          {currentConfig.items.map((item) => renderMenuItem(item))}
        </nav>
      </div>
    </div>
  );
};

export default HiSocietySidebar;
