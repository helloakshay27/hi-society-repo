import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";
import { modulesByPackage } from "@/config/navigationConfig";

export const FmDashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
            onClick={() => {
              if (item.href) {
                handleNavigation(item.href);
              }
              toggleExpanded(item.name);
            }}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-200 ${
              isActive
                ? "bg-[#E8D4BE] text-[#C72030] font-medium"
                : "text-[#1A1A1A] hover:bg-[#C4B89D54]"
            }`}
            style={{ paddingLeft: level > 0 ? `${16 + level * 16}px` : undefined }}
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <div className={isActive ? "text-[#C72030]" : "text-[#1A1A1A]"}>
                  <item.icon className="w-5 h-5" />
                </div>
              )}
              <span className="text-sm">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isExpanded && (
            <div className="bg-[#F6F4EE]">
              {item.subItems.map((subItem: any) => renderMenuItem(subItem, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.name}
        onClick={() => item.href && handleNavigation(item.href)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
          isActive
            ? "bg-[#C4B89D54] text-[#C72030] font-medium border-l-4 border-[#C72030]"
            : "text-[#1A1A1A] hover:bg-[#C4B89D54]"
        }`}
        style={{ paddingLeft: level > 0 ? `${16 + level * 16}px` : undefined }}
      >
        {item.icon && (
          <div className={isActive ? "text-[#C72030]" : "text-[#1A1A1A]"}>
            <item.icon className="w-5 h-5" />
          </div>
        )}
        <span className="text-sm">{item.name}</span>
      </button>
    );
  };

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 bg-[#f6f4ee] shadow-lg z-40 overflow-y-auto border-r border-[#DBC2A9]">
      {/* FM Dashboard Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#DBC2A9] bg-[#C4B89D54]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1A1A1A]">FM Dashboard</span>
        </div>
      </div>

      {/* FM Dashboard Menu Items */}
      <nav className="py-2">
        {maintenanceMenuItems.map((item) => renderMenuItem(item))}
      </nav>
    </div>
  );
};
