import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, ChevronLeft } from "lucide-react";
import { modulesByPackage } from "@/config/navigationConfig";
import { useLayout } from "../contexts/LayoutContext";

export const FmDashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useLayout();

  // Get only Maintenance menu items from navigationConfig
  const maintenanceMenuItems = modulesByPackage.Maintenance || [];

  // Reset expanded items on page load/refresh
  useEffect(() => {
    setExpandedItems([]);
  }, []);

  // Auto-expand functionality based on current route
  useEffect(() => {
    const path = location.pathname;
    const itemsToExpand: string[] = [];

    maintenanceMenuItems.forEach((item) => {
      if (item.subItems && item.subItems.length > 0) {
        // Check if current path matches any sub-item
        const hasActiveSubItem = item.subItems.some((subItem) => {
          if (subItem.href && path.startsWith(subItem.href)) {
            return true;
          }
          // Check nested sub-items
          if (subItem.subItems && subItem.subItems.length > 0) {
            return subItem.subItems.some((nestedItem) => 
              nestedItem.href && path.startsWith(nestedItem.href)
            );
          }
          return false;
        });

        if (hasActiveSubItem) {
          itemsToExpand.push(item.name);
          
          // Also expand the parent sub-item if it has nested items
          item.subItems.forEach((subItem) => {
            if (subItem.subItems && subItem.subItems.length > 0) {
              const hasActiveNested = subItem.subItems.some((nestedItem) => 
                nestedItem.href && path.startsWith(nestedItem.href)
              );
              if (hasActiveNested) {
                itemsToExpand.push(subItem.name);
              }
            }
          });
        }
      }
    });

    if (itemsToExpand.length > 0) {
      setExpandedItems(itemsToExpand);
    }
  }, [location.pathname, maintenanceMenuItems]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const isActiveRoute = (href: string) => {
    const currentPath = location.pathname;
    return currentPath === href || currentPath.startsWith(href + "/");
  };

  const renderMenuItem = (item: any, level: number = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isActive = item.href ? isActiveRoute(item.href) : false;

    if (hasSubItems) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
            )}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {level === 0 && (
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
              )}
              <span className="truncate">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </button>
          {isExpanded && (
            <div className="space-y-1">
              {item.subItems.map((subItem: any) => (
                <div
                  key={subItem.name}
                  className={level === 0 ? "ml-8" : "ml-4"}
                >
                  {subItem.subItems && subItem.subItems.length > 0 ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(subItem.name)}
                        className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                      >
                        {subItem.href && isActiveRoute(subItem.href) && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
                        )}
                        <span className="truncate">{subItem.name}</span>
                        {expandedItems.includes(subItem.name) ? (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        )}
                      </button>
                      {expandedItems.includes(subItem.name) && (
                        <div className="ml-4 mt-1 space-y-1">
                          {subItem.subItems.map((nestedItem: any) => (
                            <button
                              key={nestedItem.name}
                              onClick={() => handleNavigation(nestedItem.href)}
                              className="flex items-center gap-2 w-full pl-11 pr-3 py-2 rounded-lg text-sm font-normal transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                            >
                              {isActiveRoute(nestedItem.href) && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
                              )}
                              <span className="truncate">{nestedItem.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleNavigation(subItem.href)}
                      className="flex items-center gap-2 w-full pl-11 pr-3 py-2 rounded-lg text-sm font-normal transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                    >
                      {isActiveRoute(subItem.href) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
                      )}
                      <span className="truncate">{subItem.name}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.name}>
        <button
          onClick={() => item.href && handleNavigation(item.href)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
        >
          {isActive && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]"></div>
          )}
          {level === 0 && (
            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#C72030]" : "text-[#1a1a1a]"}`} />
          )}
          <span className="truncate">{item.name}</span>
        </button>
      </div>
    );
  };

  const CollapsedMenuItem = ({ module, level = 0 }) => {
    const hasSubItems = module.subItems && module.subItems.length > 0;
    const isExpanded = expandedItems.includes(module.name);
    const active = module.href ? isActiveRoute(module.href) : false;

    const findDeepestNavigableItem = (item: any): string | null => {
      if (!item.subItems || item.subItems.length === 0) {
        return item.href || null;
      }
      for (const subItem of item.subItems) {
        if (subItem.subItems && subItem.subItems.length > 0) {
          const deepest = findDeepestNavigableItem(subItem);
          if (deepest) return deepest;
        }
      }
      return item.subItems[0]?.href || null;
    };

    return (
      <>
        <button
          key={module.name}
          onClick={() => {
            if (hasSubItems) {
              const deepestHref = findDeepestNavigableItem(module);
              if (deepestHref) {
                handleNavigation(deepestHref);
              } else {
                toggleExpanded(module.name);
              }
            } else if (module.href) {
              handleNavigation(module.href);
            }
          }}
          className={`flex items-center justify-center p-2 rounded-lg relative transition-all duration-200 ${
            active || isExpanded
              ? "bg-[#f0e8dc] shadow-inner"
              : "hover:bg-[#DBC2A9]"
          }`}
          title={module.name}
        >
          {(active || isExpanded) && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#C72030]"></div>
          )}
          {level === 0 ? (
            <module.icon
              className={`w-5 h-5 ${
                active || isExpanded ? "text-[#C72030]" : "text-[#1a1a1a]"
              }`}
            />
          ) : (
            <div
              className={`w-${3 - level} h-${
                3 - level
              } rounded-full bg-[#1a1a1a]`}
            ></div>
          )}
        </button>
        {isExpanded &&
          hasSubItems &&
          module.subItems.map((subItem) => (
            <CollapsedMenuItem
              key={`${module.name}-${subItem.name}`}
              module={subItem}
              level={level + 1}
            />
          ))}
      </>
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
            {isSidebarCollapsed ? "" : "FM Dashboard"}
          </h3>
        </div>

        <nav className="space-y-2">
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center space-y-5 pt-4">
              {maintenanceMenuItems.map((module) => (
                <button
                  key={module.name}
                  onClick={() => {
                    if (module.subItems && module.subItems.length > 0) {
                      const deepestHref = module.subItems[0]?.href;
                      if (deepestHref) {
                        handleNavigation(deepestHref);
                      }
                    } else if (module.href) {
                      handleNavigation(module.href);
                    }
                  }}
                  className={`flex items-center justify-center p-2 rounded-lg relative transition-all duration-200 ${
                    isActiveRoute(module.href)
                      ? "bg-[#f0e8dc] shadow-inner"
                      : "hover:bg-[#DBC2A9]"
                  }`}
                  title={module.name}
                >
                  {isActiveRoute(module.href) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#C72030]"></div>
                  )}
                  <module.icon
                    className={`w-5 h-5 ${
                      isActiveRoute(module.href)
                        ? "text-[#C72030]"
                        : "text-[#1a1a1a]"
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : (
            maintenanceMenuItems.map((module) => renderMenuItem(module))
          )}
        </nav>
      </div>
    </div>
  );
};
