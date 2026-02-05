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
    let newSection = "";

    // Force admin mode - disable employee detection
    const userType = localStorage.getItem("userType") || "admin";
    const isEmployeeUser = false; // Always use admin view

    console.log(
      `📍 Route changed to: ${path}, Current section: ${currentSection}`
    );
    const hostname = window.location.hostname;

    const isLocalhost =
      hostname.includes("localhost") ||
      hostname.includes("lockated.gophygital.work");

    const isPulseSite =
      hostname.includes("pulse.lockated.com") ||
      hostname.includes("localhost") ||
      hostname.includes("pulse.gophygital.work") ||
      hostname.includes("pulse-uat.panchshil.com");

    // Template routes should be treated as Settings
    const templatePaths = [
      '/master/communication-template',
      '/master/template/root-cause-analysis',
      '/master/template/preventive-action',
      '/master/template/short-term-impact',
      '/master/template/long-term-impact',
      '/master/template/corrective-action'
    ];
    const isTemplatePath = templatePaths.some(t => path.startsWith(t));

    // For employee users, don't auto-detect section changes
    // They manually select modules via EmployeeHeader
    if ((isEmployeeUser && isLocalhost) || isPulseSite) {
      console.log(
        `👤 Employee mode: Skipping auto-detection, keeping section: ${currentSection}`
      );

      if (path.startsWith("/settings")) {
        newSection = "Settings";
      } else if (path.startsWith("/master")) {
        newSection = "Master";
      } else {
        return;
      }
    }

    // Define route patterns and their corresponding sections
    // Keep this in sync with the sidebar logic
    if (isTemplatePath) {
      newSection = "Settings";
    } else if (path.startsWith("/utility")) {
      newSection = "Utility";
    } else if (path.startsWith("/transitioning")) {
      newSection = "Transitioning";
    } else if (path.startsWith("/security")) {
      newSection = "Security";
    } else if (path.startsWith("/vas")) {
      newSection = "Value Added Services";
    } else if (path.startsWith("/finance")) {
      newSection = "Finance";
    } else if (path.startsWith("/maintenance")) {
      newSection = "Maintenance";
    } else if (path.startsWith("/safety")) {
      newSection = "Safety";
    } else if (path.startsWith("/crm")) {
      newSection = "CRM";
    } else if (path.startsWith("/market-place")) {
      newSection = "Market Place";
    } else if (path.startsWith("/club-management")) {
      newSection = "Club Management";
    } else if (path.startsWith("/master")) {
      newSection = "Master";
    } else if (path.startsWith("/settings")) {
      newSection = "Settings";
    } else if (path.startsWith("/dashboard")) {
      newSection = "Dashboard";
    } else if (path.startsWith("/pulse")) {
      newSection = "Pulse Privilege";
    } else {
      // For any other route, default to Dashboard
      newSection = "Dashboard";
    }

    // Always update the section when route changes
    console.log(
      `🔄 Section change: ${currentSection} → ${newSection} (path: ${path})`
    );
    setCurrentSection(newSection);
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
