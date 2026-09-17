import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";
import { usePermissions } from "./PermissionsContext";
import { getModuleForFunction } from "../utils/moduleDetection";
import { getUser } from "../utils/auth";

interface LockFunction {
  function_id: number;
  function_name: string;
  react_link: string;
  action_name: string;
  parent_function: string;
  function_active: number;
  sub_functions: SubFunction[];
}

interface SubFunction {
  sub_function_id: number;
  sub_function_name: string;
  sub_function_display_name: string;
  sub_function_active: number;
  enabled: boolean;
}

interface LockModule {
  module_id: number;
  module_name: string;
  lock_functions: LockFunction[];
  module_active: number;
}

interface ActionLayoutContextType {
  currentModule: string;
  setCurrentModule: (module: string) => void;
  currentFunction: string;
  setCurrentFunction: (func: string) => void;
  availableModules: LockModule[];
  getModuleFunctions: (moduleName: string) => LockFunction[];
  isActionSidebarVisible: boolean;
}

const ActionLayoutContext = createContext<ActionLayoutContextType | undefined>(
  undefined
);

export const useActionLayout = () => {
  const context = useContext(ActionLayoutContext);
  if (context === undefined) {
    // Return safe defaults instead of throwing — prevents crashes during HMR
    // and when Layout is momentarily rendered outside the provider tree
    return {
      currentModule: "",
      setCurrentModule: () => { },
      currentFunction: "",
      setCurrentFunction: () => { },
      availableModules: [],
      getModuleFunctions: () => [],
      isActionSidebarVisible: false,
    } as ActionLayoutContextType;
  }
  return context;
};

interface ActionLayoutProviderProps {
  children: ReactNode;
}

export const ActionLayoutProvider: React.FC<ActionLayoutProviderProps> = ({
  children,
}) => {
  const [currentModule, setCurrentModule] = useState<string>("");
  const [currentFunction, setCurrentFunction] = useState<string>("");
  const [availableModules, setAvailableModules] = useState<LockModule[]>([]);
  const [isActionSidebarVisible, setIsActionSidebarVisible] =
    useState<boolean>(false);
  const location = useLocation();
  const { userRole } = usePermissions();

  // Extract available modules from userRole
  useEffect(() => {
    if (userRole && userRole.lock_modules) {
      // Helper function to recursively check if a function has any active descendants
      const hasActiveDescendant = (
        func: LockFunction,
        allFunctions: LockFunction[]
      ): boolean => {
        // Check if the function itself is active
        if (func.function_active === 1) {
          return true;
        }

        // Check if any sub_functions are active
        if (func.sub_functions && func.sub_functions.length > 0) {
          if (func.sub_functions.some((sf) => sf.sub_function_active === 1)) {
            return true;
          }
        }

        // Recursively check child functions (functions with parent_function matching this action_name)
        const childFunctions = allFunctions.filter(
          (cf) => cf.parent_function === func.action_name
        );

        for (const child of childFunctions) {
          if (hasActiveDescendant(child, allFunctions)) {
            return true;
          }
        }

        return false;
      };

      // Filter modules that have at least one active function (including descendants)
      const modulesWithActiveFunctions = userRole.lock_modules.filter(
        (module: LockModule) => {
          return module.lock_functions.some((func) =>
            hasActiveDescendant(func, module.lock_functions)
          );
        }
      );

      setAvailableModules(modulesWithActiveFunctions);

      console.log(
        "🎯 ActionLayout - Available modules with active functions:",
        modulesWithActiveFunctions.map((m: LockModule) => m.module_name)
      );
    }
  }, [userRole]);

  // Auto-detect module and function from current route
  useEffect(() => {
    const path = location.pathname;
    const userType = localStorage.getItem("userType");

    const orgId = localStorage.getItem("org_id");
    const userEmail = getUser()?.email;
    const isActionOrgAccount =
      orgId === "109" ||
      orgId === "324" ||
      userEmail === "dineshshinde6666@gmail.com";

    if (!userRole || !userRole.lock_modules) {
      setIsActionSidebarVisible(false);
      return;
    }

    let foundModule: string = "";
    let foundFunction: string = "";
    let foundMatch = false;

    // Search through all modules to find matching route
    for (const module of userRole.lock_modules) {
      // Skip Employee Sidebar and Employee Projects Sidebar modules if user is admin
      if (
        userType !== "pms_occupant" &&
        (module.module_name === "Employee Sidebar" ||
          module.module_name === "Employee Projects Sidebar" ||
          module.module_name === "Employee Business Compass" ||
          module.module_name === "Employee Admin Compass")
      ) {
        continue;
      }

      for (const func of module.lock_functions) {
        if (func.function_active === 1 && func.react_link) {
          // Check if current path matches or starts with the function's react_link
          if (
            path === func.react_link ||
            path.startsWith(func.react_link + "/")
          ) {
            foundModule = module.module_name;
            foundFunction = func.function_name;
            foundMatch = true;
            break;
          }
        }
      }
      if (foundMatch) break;
    }

    // Fallback for accounts pinned to the ActionSidebar/ActionHeader (org 109/324,
    // see Layout.tsx) whose role data has no active function with a react_link
    // matching the current route exactly. Derive the module from the URL itself
    // (same mapping the static sidebars use) so the sidebar still shows instead
    // of silently staying blank.
    if (!foundMatch) {
      if (isActionOrgAccount) {
        // Strategy 1: match this page to its sibling route's module using the
        // user's OWN role data (no guessing). "/bms/hisoc-event-create" and
        // "/bms/hisoc-event-list" aren't nested under each other, so the exact
        // react_link check above never matches the create/edit/details pages —
        // but they normalize to the same base once a trailing numeric id and a
        // trailing CRUD verb are stripped, so we can find the module via the
        // list page's own active react_link.
        const normalizeRoute = (route: string): string => {
          const parts = route.split("/").filter(Boolean);

          // Drop a trailing numeric id segment (e.g. ".../edit/123")
          if (parts.length && /^\d+$/.test(parts[parts.length - 1])) {
            parts.pop();
          }

          // Drop a trailing segment that IS a CRUD verb on its own
          // (e.g. "/loyalty/offer/add" -> "/loyalty/offer")
          if (
            parts.length > 1 &&
            /^(create|add|edit|details?|list|view|new)$/i.test(
              parts[parts.length - 1]
            )
          ) {
            parts.pop();
          }

          // Strip a CRUD-verb suffix glued onto the last word
          // (e.g. "offers-list" -> "offers", "hisoc-event-create" -> "hisoc-event")
          if (parts.length) {
            const last = parts.pop() as string;
            const stripped = last.replace(
              /[-_]?(create|add|edit|details?|list|view|new)$/i,
              ""
            );
            parts.push(stripped || last);
          }

          // Normalize a trailing plural so "offer" and "offers" collapse
          // together (e.g. "offers-list" -> "offers" -> "offer", matching
          // "/loyalty/offer/add" -> "offer")
          if (parts.length) {
            const last = parts.pop() as string;
            parts.push(last.endsWith("s") ? last.slice(0, -1) : last);
          }

          return parts.join("/");
        };

        const normalizedPath = normalizeRoute(path);

        outer: for (const module of userRole.lock_modules) {
          if (module.module_active !== 1) continue;
          for (const func of module.lock_functions) {
            if (
              func.function_active === 1 &&
              func.react_link &&
              normalizeRoute(func.react_link) === normalizedPath
            ) {
              foundModule = module.module_name;
              foundFunction = func.function_name;
              foundMatch = true;
              break outer;
            }
          }
        }

        if (foundMatch) {
          console.log(
            `🔄 ActionLayout - Sibling-route match: Module="${foundModule}", Function="${foundFunction}" for path "${path}" (normalized "${normalizedPath}")`
          );
        }

        // Strategy 2: derive the module from the URL's own words via the
        // generic moduleDetection.ts map, for pages with no sibling route
        // permission entry at all.
        const segments = path
          .split("/")
          .filter((segment) => segment && !/^\d+$/.test(segment));

        const triedCandidates: string[] = [];

        for (let start = 1; start < segments.length && !foundMatch; start++) {
          const rawCandidate = segments.slice(start).join("_");

          // Also try a "core noun" candidate: strip a leading "hisoc" prefix
          // and a trailing CRUD verb (create/add/edit/list/details/view), e.g.
          // "hisoc_event_create" -> "event" -> "events", so bespoke Hi-Society
          // route names still resolve to the same module as their list page.
          const coreNoun = rawCandidate
            .replace(/^hisoc[-_]?/i, "")
            .replace(/[-_]?(create|add|edit|details?|list|view)$/i, "");

          const candidates = new Set<string>([rawCandidate]);
          if (coreNoun && coreNoun !== rawCandidate) {
            candidates.add(coreNoun);
            candidates.add(coreNoun.endsWith("s") ? coreNoun : `${coreNoun}s`);
          }

          for (const candidate of candidates) {
            triedCandidates.push(candidate);
            const mappedModule = getModuleForFunction(candidate);
            if (!mappedModule) continue;

            const matchedModule = userRole.lock_modules.find(
              (module) =>
                module.module_active === 1 &&
                module.module_name.toLowerCase() === mappedModule.toLowerCase()
            );
            if (matchedModule) {
              foundModule = matchedModule.module_name;
              foundFunction = candidate;
              foundMatch = true;
              break;
            }
          }
        }

        if (foundMatch) {
          console.log(
            `🔄 ActionLayout - Fallback route match: Module="${foundModule}", Function="${foundFunction}" for path "${path}"`
          );
        } else {
          console.log(
            `🔍 ActionLayout - Fallback found no module for path "${path}". Tried candidates:`,
            triedCandidates,
            "Available module names in role:",
            userRole.lock_modules.map((m) => `${m.module_name} (active=${m.module_active})`)
          );
        }
      }
    }

    if (foundMatch) {
      console.log(
        `🔄 ActionLayout - Route matched: Module="${foundModule}", Function="${foundFunction}"`
      );
      setCurrentModule(foundModule);
      setCurrentFunction(foundFunction);
      setIsActionSidebarVisible(true);
    } else if (isActionOrgAccount && currentModule) {
      // No route/derived match for this page (e.g. a "+ Add" sibling page
      // whose exact URL isn't separately registered in the role data), but
      // the user was already viewing a matched module — keep the sidebar/
      // header showing that module instead of blanking out mid-flow. This
      // covers every such sibling page generically, regardless of its URL
      // naming convention.
      console.log(
        `🔄 ActionLayout - No match for "${path}"; keeping previous module "${currentModule}"`
      );
    } else {
      // No match found - hide action sidebar
      setIsActionSidebarVisible(false);
      console.log(
        `🔍 ActionLayout - No matching module/function for path: ${path}`
      );
    }
  }, [location.pathname, userRole]);

  // Get all functions for a specific module (including inactive parents with active children)
  const getModuleFunctions = (moduleName: string): LockFunction[] => {
    const module = availableModules.find(
      (m) => m.module_name.toLowerCase() === moduleName.toLowerCase()
    );

    if (!module) {
      return [];
    }

    // Return all functions - the sidebar will handle filtering based on active descendants
    return module.lock_functions;
  };

  return (
    <ActionLayoutContext.Provider
      value={{
        currentModule,
        setCurrentModule,
        currentFunction,
        setCurrentFunction,
        availableModules,
        getModuleFunctions,
        isActionSidebarVisible,
      }}
    >
      {children}
    </ActionLayoutContext.Provider>
  );
};
