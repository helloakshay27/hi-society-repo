import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import {
  UserRoleResponse,
  permissionService,
} from "@/services/permissionService";
import { permissionCache } from "@/services/simplePermissionCache";
import { isAuthenticated } from "@/utils/auth";
import { toast } from "sonner";

interface PermissionsContextType {
  userRole: UserRoleResponse | null;
  loading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  isModuleEnabled: (moduleName: string) => boolean;
  isFunctionEnabled: (moduleName: string, functionName: string) => boolean;
  isSubFunctionEnabled: (
    moduleName: string,
    functionName: string,
    subFunctionName: string
  ) => boolean;
  hasPermissionForPath: (path: string) => boolean;
  // NEW: Function-only methods (ignoring module)
  isFunctionEnabledAnywhere: (functionName: string) => boolean;
  isSubFunctionEnabledAnywhere: (
    functionName: string,
    subFunctionName: string
  ) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({
  children,
}) => {
  const [userRole, setUserRole] = useState<UserRoleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Track if error toast has been shown to prevent duplicate toasts
  const errorShownRef = useRef<string | null>(null);
  // Use a ref so the callback never needs userRole as a dependency
  const userRoleRef = useRef<UserRoleResponse | null>(null);
  userRoleRef.current = userRole;

  const fetchUserPermissions = useCallback(async (forceRefresh = false) => {
    // Don't fetch permissions if user is not authenticated
    if (!isAuthenticated()) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    // Use cached permissions if still fresh and not forcing a refresh
    if (!forceRefresh) {
      const cached = permissionCache.get();
      if (cached) {
        // If we already have userRole in state, no need to even parse cache again
        if (userRoleRef.current) return;
        // Reconstruct a minimal UserRoleResponse from cache so state is populated
        const cachedRole = localStorage.getItem("cached_user_role");
        if (cachedRole) {
          try {
            const parsed = JSON.parse(cachedRole) as UserRoleResponse;
            setUserRole(parsed);
            return;
          } catch { /* fall through to API */ }
        }
      }
    }

    setLoading(true);
    setError(null);

    try {
      const role = await permissionService.getUserRole();
      if (role) {
        setUserRole(role);
        // Store in cache for fast access
        permissionCache.store(role);
        // Reset error shown flag on success
        errorShownRef.current = null;
      }
    } catch (err: any) {
      // Improved error handling for 500 errors and Axios errors
      let errorMessage = "Failed to fetch user permissions";
      if (err?.response?.status === 500) {
        errorMessage = "Server error (500) while fetching user role. Please try again later.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error("Error fetching user permissions:", err);

      // Show toast only once per error type to prevent spam
      if (errorShownRef.current !== errorMessage) {
        errorShownRef.current = errorMessage;

        if (errorMessage === "NO_ROLE_ASSIGNED") {
          toast.error("No role assigned to your account. Please contact administrator.", {
            duration: 5000,
          });
        } else if (errorMessage === "SERVER_ERROR_500") {
          toast.error("Server error (500). Unable to fetch user permissions. Please assign role and try again later.", {
            duration: 5000,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load — use cache if fresh, otherwise fetch
  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  // Route change — only fetch if cache is stale (no extra API call on navigation)
  useEffect(() => {
    if (isAuthenticated()) {
      fetchUserPermissions();
    }
  }, [location.pathname, fetchUserPermissions]);

  // Force refresh (called explicitly after login/role change)
  const refreshPermissions = useCallback(async () => {
    await fetchUserPermissions(true);
  }, [fetchUserPermissions]);

  const isModuleEnabled = useCallback(
    (moduleName: string): boolean => {
      // Prioritize fresh data if available
      if (userRole) {
        return permissionService.isModuleEnabled(userRole, moduleName);
      }

      // Fallback to cache if loading
      const cached = permissionCache.isModuleEnabled(moduleName);
      return cached;
    },
    [userRole]
  );

  const isFunctionEnabled = useCallback(
    (moduleName: string, functionName: string): boolean => {
      // Prioritize fresh data if available
      if (userRole) {
        return permissionService.isFunctionEnabled(
          userRole,
          moduleName,
          functionName
        );
      }

      // Fallback to cache if loading
      const cached = permissionCache.isFunctionEnabled(
        moduleName,
        functionName
      );
      return cached;
    },
    [userRole]
  );

  const isSubFunctionEnabled = useCallback(
    (
      moduleName: string,
      functionName: string,
      subFunctionName: string
    ): boolean => {
      // Prioritize fresh data if available
      if (userRole) {
        return permissionService.isSubFunctionEnabled(
          userRole,
          moduleName,
          functionName,
          subFunctionName
        );
      }

      // Fallback to cache if loading
      const cached = permissionCache.isSubFunctionEnabled(
        moduleName,
        functionName,
        subFunctionName
      );
      return cached;
    },
    [userRole]
  );

  const isFunctionEnabledAnywhere = useCallback(
    (functionName: string): boolean => {
      // Try cache first for better performance
      // TODO: Add cache support for function-only checks
      if (!userRole) return false;

      // Use new service method
      return permissionService.isFunctionEnabledAnywhere(
        userRole,
        functionName
      );
    },
    [userRole]
  );

  const isSubFunctionEnabledAnywhere = useCallback(
    (functionName: string, subFunctionName: string): boolean => {
      // Try cache first for better performance
      // TODO: Add cache support for sub-function-only checks
      if (!userRole) return true; // Fallback when no role data

      // Use new service method
      return permissionService.isSubFunctionEnabledAnywhere(
        userRole,
        functionName,
        subFunctionName
      );
    },
    [userRole]
  );

  const hasPermissionForPath = useCallback(
    (path: string): boolean => {
      return permissionService.hasPermissionForPath(userRole, path);
    },
    [userRole]
  );

  return (
    <PermissionsContext.Provider
      value={{
        userRole,
        loading,
        error,
        refreshPermissions,
        isModuleEnabled,
        isFunctionEnabled,
        isSubFunctionEnabled,
        hasPermissionForPath,
        isFunctionEnabledAnywhere,
        isSubFunctionEnabledAnywhere,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
