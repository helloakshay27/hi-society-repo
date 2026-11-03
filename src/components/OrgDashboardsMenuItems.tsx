import React from "react";
import { LayoutDashboard } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getOrgDashboards } from "@/utils/auth";

// Dashboards configured on the selected organization (saved to localStorage at login)
export const OrgDashboardsMenuItems: React.FC = () => {
  const dashboards = getOrgDashboards().filter(
    (d) => d.active !== false && d.dashboard_url
  );

  if (dashboards.length === 0) return null;

  return (
    <>
      {dashboards.map((dashboard, index) => (
        <DropdownMenuItem
          key={dashboard.id ?? index}
          onClick={() =>
            window.open(dashboard.dashboard_url, "_blank", "noopener,noreferrer")
          }
          className="mx-2 my-1 rounded-md"
        >
          <LayoutDashboard className="w-4 h-4 mr-2 text-gray-500" />
          <span className="font-medium">
            {dashboard.dashboard_name || "Dashboard"}
          </span>
        </DropdownMenuItem>
      ))}
    </>
  );
};
