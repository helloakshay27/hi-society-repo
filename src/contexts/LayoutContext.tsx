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

  // Get initial layout mode from localStorage, default to 'fm-matrix'
  // Auto-detect Hi-Society sites on first visit only
  const [layoutMode, setLayoutMode] = useState<'fm-matrix' | 'hi-society'>(() => {
    const hostname = window.location.hostname;
    const isHiSocietySite =
      hostname.includes("localhost") ||
      hostname.includes("ui-hisociety.lockated.com") ||
      hostname.includes("web.hisociety.lockated.com");
    
    // Check saved mode first (respect user's manual selection)
    const savedMode = localStorage.getItem("layoutMode");
    
    // If on Hi-Society domain and no mode is set, default to hi-society
    // But if user has manually set a mode, respect that choice
    if (isHiSocietySite && !savedMode) {
      localStorage.setItem("layoutMode", "hi-society");
      return "hi-society";
    }
    
    // Return saved mode or default to fm-matrix
    return (savedMode === 'hi-society' ? 'hi-society' : 'fm-matrix') as 'fm-matrix' | 'hi-society';
  });

  // Toggle between FM Matrix and Hi-Society layouts
  const toggleLayoutMode = () => {
    setLayoutMode(prevMode => {
      const newMode = prevMode === 'fm-matrix' ? 'hi-society' : 'fm-matrix';
      localStorage.setItem('layoutMode', newMode);
      return newMode;
    });
  };

  // Get current selected company from Redux store
  const { selectedCompany } = useSelector((state: RootState) => state.project);

  // Automatic section detection based on current route
  useEffect(() => {
    const path = location.pathname;
    let newSection = "";

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
      hostname.includes("pulse.lockated.com") || hostname.includes("localhost");

   
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
    if (path.startsWith("/utility")) {
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
    } else if (path.startsWith("/master")) {
      newSection = "Master";
    } else if (path.startsWith("/settings")) {
      newSection = "Settings";
    } else if (path.startsWith("/dashboard")) {
      newSection = "Dashboard";
    } else if (path.startsWith("/pulse")) {
      newSection = "Pulse Privilege";
    }

    // Always update the section when route changes
    console.log(
      `🔄 Section change: ${currentSection} → ${newSection} (path: ${path})`
    );
    setCurrentSection(newSection);
  }, [location.pathname]); // Removed currentSection from dependency to prevent circular updates

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
