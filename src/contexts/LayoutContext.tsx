import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "@/store/store";
import { LayoutConfig, getCompanyLayout } from "@/config/companyLayouts";

interface SectionRouteConfig {
  section: string;
  prefixes: string[]; // Route prefixes that belong to this section (e.g., ["/loyalty", "/contests"])
  childRoutes?: string[]; // Standalone child routes without parent prefix (e.g., ["contests", "wallet-management"])
}

interface LayoutContextType {
  currentSection: string;
  setCurrentSection: (section: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  getLayoutByCompanyId: (companyId: number | null) => LayoutConfig;
  layoutMode: 'fm-matrix' | 'hi-society';
  toggleLayoutMode: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<string>("");
  const location = useLocation();

  // Section configurations with dynamic route detection
  // Define sections and their associated route patterns
  const sectionConfigs: SectionRouteConfig[] = [
    {
      section: "Dashboard",
      prefixes: ["/dashboard"],
    },
    {
      section: "Utility",
      prefixes: ["/utility"],
    },
    {
      section: "Transitioning",
      prefixes: ["/transitioning"],
    },
    {
      section: "Security",
      prefixes: ["/security"],
    },
    {
      section: "Value Added Services",
      prefixes: ["/vas"],
    },
    {
      section: "Finance",
      prefixes: ["/finance"],
    },
    {
      section: "Maintenance",
      prefixes: ["/maintenance"],
    },
    {
      section: "Safety",
      prefixes: ["/safety"],
    },
    {
      section: "CRM",
      prefixes: ["/crm"],
    },
    {
      section: "Market Place",
      prefixes: ["/market-place"],
    },
    {
      section: "Club Management",
      prefixes: ["/club-management"],
    },
    {
      section: "Master",
      prefixes: ["/master"],
    },
    {
      section: "Settings",
      prefixes: [
        "/settings",
        "/master/communication-template",
        "/master/template",
      ],
    },
    {
      section: "Pulse Privilege",
      prefixes: ["/pulse"],
    },
    {
      section: "Loyalty",
      prefixes: ["/loyalty"],
      // Standalone child routes that belong to Loyalty (without /loyalty prefix)
      childRoutes: [
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
      ],
    },
    {
      section: "Home",
      prefixes: ["/home"],
      childRoutes: [
        "project",
        "banner",
        "event",
        "offers",
        "broadcast",
        "press-releases",
        "faq",
      ],
    },
  ];

  // Dynamic route detection - automatically finds parent section
  const detectSectionFromRoute = (pathname: string): string => {
    // First pass: Check direct prefix matches (e.g., /loyalty/contests)
    for (const config of sectionConfigs) {
      for (const prefix of config.prefixes) {
        if (pathname === prefix || pathname.startsWith(prefix + "/")) {
          return config.section;
        }
      }
    }

    // Second pass: Check standalone child routes (e.g., /contests → Loyalty)
    // Extract first segment after initial slash
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment) {
      for (const config of sectionConfigs) {
        if (config.childRoutes?.includes(firstSegment)) {
          return config.section;
        }
      }
    }

    // Default to Dashboard if no match found
    return "Dashboard";
  };

  // Get initial collapsed state from localStorage, default to false if not set
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    return savedState ? JSON.parse(savedState) : false;
  });

  // Get initial layout mode from localStorage
  // On first visit, auto-detect based on hostname
  // After that, always respect user's manual selection
  const [layoutMode, setLayoutMode] = useState<'fm-matrix' | 'hi-society'>(() => {
    const savedMode = localStorage.getItem("layoutMode");
    
    // If mode already exists, respect it (user has made a choice)
    if (savedMode) {
      console.log('🎨 Loading saved layout mode from localStorage:', savedMode);
      return (savedMode === 'hi-society' ? 'hi-society' : 'fm-matrix') as 'fm-matrix' | 'hi-society';
    }
    
    // First visit - auto-detect based on hostname
    const hostname = window.location.hostname;
    const isHiSocietySite =
      hostname.includes("localhost") ||
      hostname.includes("ui-hisociety.lockated.com") ||
      hostname.includes("web.hisociety.lockated.com");
    
    // Set initial mode based on hostname and save it
    const initialMode = isHiSocietySite ? 'hi-society' : 'fm-matrix';
    console.log('🎨 First visit - Auto-detecting layout mode:', initialMode, '(hostname:', hostname, ')');
    localStorage.setItem("layoutMode", initialMode);
    return initialMode;
  });

  // Toggle between FM Matrix and Hi-Society layouts
  const toggleLayoutMode = () => {
    setLayoutMode(prevMode => {
      const newMode = prevMode === 'fm-matrix' ? 'hi-society' : 'fm-matrix';
      localStorage.setItem('layoutMode', newMode);
      console.log('🔄 Layout mode toggled to:', newMode);
      return newMode;
    });
  };

  // Ensure layoutMode is always synced with localStorage
  useEffect(() => {
    const currentMode = localStorage.getItem('layoutMode');
    if (currentMode !== layoutMode) {
      console.log('💾 Syncing layoutMode to localStorage:', layoutMode);
      localStorage.setItem('layoutMode', layoutMode);
    }
  }, [layoutMode]);

  // Get current selected company from Redux store
  const { selectedCompany } = useSelector((state: RootState) => state.project);

  // Automatic section detection based on current route
  useEffect(() => {
    const path = location.pathname;
    
    // Check if user is in employee mode
    const userType = localStorage.getItem("userType");
    const isEmployeeUser = userType === "pms_occupant";

    console.log(
      `📍 Route changed to: ${path}, Current section: ${currentSection}`
    );
    const hostname = window.location.hostname;

    const isLocalhost =
      hostname.includes("localhost") ||
      hostname.includes("lockated.gophygital.work");

    const isPulseSite =
      hostname.includes("pulse.lockated.com") ||
      hostname.includes("pulse.gophygital.work") ||
      hostname.includes("pulse-uat.panchshil.com");

    // For employee users, don't auto-detect section changes
    // They manually select modules via EmployeeHeader
    if ((isEmployeeUser && isLocalhost) || isPulseSite) {
      console.log(
        `👤 Employee mode: Skipping auto-detection, keeping section: ${currentSection}`
      );

      // Only update for specific routes
      if (path.startsWith("/settings") || path.startsWith("/master")) {
        const newSection = detectSectionFromRoute(path);
        if (newSection !== currentSection) {
          console.log(
            `🔄 Section change: ${currentSection} → ${newSection} (path: ${path})`
          );
          setCurrentSection(newSection);
        }
      }
      return;
    }

    // Use route detection logic for all other cases
    const newSection = detectSectionFromRoute(path);
    
    // Always update the section when route changes
    if (newSection !== currentSection) {
      console.log(
        `🔄 Section change: ${currentSection} → ${newSection} (path: ${path})`
      );
      setCurrentSection(newSection);
    }
  }, [location.pathname]);

  // Save sidebar collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "sidebarCollapsed",
      JSON.stringify(isSidebarCollapsed)
    );
  }, [isSidebarCollapsed]);

  // Company ID to layout mapping function
  const getLayoutByCompanyId = (companyId: number | null): LayoutConfig => {
    return getCompanyLayout(companyId);
  };

  return (
    <LayoutContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        getLayoutByCompanyId,
        layoutMode,
        toggleLayoutMode,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
