import React, { startTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../contexts/LayoutContext";
import { Calendar, Video, Building2, Settings as SettingsIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
}

// CS (Customer Service) users only need access to these selective modules
const menuItems: MenuItem[] = [
    {
        id: "requests",
        label: "Requests",
        icon: Calendar,
        path: "/appointmentz/site-scheduling",
    },
    {
        id: "virtual-request",
        label: "Virtual Request",
        icon: Video,
        path: "/appointmentz/virtual-request",
    },
    {
        id: "manage-flats",
        label: "Manage Flats",
        icon: Building2,
        path: "/settings/manage-flats",
    },
    {
        id: "setup",
        label: "Setup",
        icon: SettingsIcon,
        path: "/appointmentz/rm-config",
    },
];

export const CSSidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isSidebarCollapsed, setIsSidebarCollapsed, isMobileSidebarOpen, setIsMobileSidebarOpen } = useLayout();

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + "/");

    const handleNavigation = (path: string) => {
        setIsMobileSidebarOpen(false);
        startTransition(() => {
            navigate(path);
        });
    };

    // On mobile (sidebar open as overlay), always show expanded regardless of isSidebarCollapsed
    const showCollapsed = isSidebarCollapsed && !isMobileSidebarOpen;

    return (
        <div
            className={`${showCollapsed ? "w-16" : "w-64"
                } bg-[#f6f4ee] border-r border-[#D5DbDB] fixed left-0 top-0 overflow-y-auto transition-all duration-300 z-40
        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            style={{ top: "4rem", height: "calc(100% - 4rem)" }}
        >
            <div className={`${showCollapsed ? "px-2 py-2" : "p-2"}`}>
                {/* Collapse Button — hidden on mobile */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden md:block absolute right-2 top-2 p-1 rounded-md hover:bg-[#DBC2A9] z-10"
                >
                    {showCollapsed ? (
                        <div className="flex justify-center items-center w-8 h-8 bg-[#f6f4ee] border border-[#e5e1d8] mx-auto">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>

                {/* Spacer */}
                <div className="w-full h-4 bg-[#f6f4ee] border-[#e5e1d8] mb-2 mt-4" />

                {/* Menu */}
                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        if (showCollapsed) {
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigation(item.path)}
                                    className="flex items-center justify-center w-full p-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                                    title={item.label}
                                >
                                    {active && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                                    )}
                                    <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                                </button>
                            );
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.path)}
                                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#DBC2A9] relative overflow-hidden text-[#1a1a1a]"
                            >
                                {active && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C72030]" />
                                )}
                                <Icon className="w-5 h-5 flex-shrink-0 text-[#1a1a1a]" />
                                <span className="truncate flex-1 text-left">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default CSSidebar;
