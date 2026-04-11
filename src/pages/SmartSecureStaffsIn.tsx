import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Loader2 } from "lucide-react";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { toast } from "sonner";

interface StaffData {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  mobile: string;
  email: string;
  soc_staff_id: string | null;
  staff_image_url: string;
  department_name: string;
  work_type_name: string;
  unit_name: string | null;
  vendor_name: string | null;
  status_text: string;
  number_verified: boolean;
  staff_workings?: StaffWorking[];
}

interface StaffWorking {
  id: number;
  check_in: string;
  check_out: string | null;
  status: string;
}

// Dummy data for UI preview
const dummyStaffData: StaffData[] = [
  {
    id: 1,
    first_name: "Sagar",
    last_name: "Singh",
    full_name: "Sagar Singh",
    mobile: "9850562622",
    email: "sagar.singh@example.com",
    soc_staff_id: "STF001",
    staff_image_url: "",
    department_name: "Security",
    work_type_name: "Guard",
    unit_name: "Tower A",
    vendor_name: "SecureGuard Services",
    status_text: "Active",
    number_verified: true,
    staff_workings: [{ id: 1, check_in: "2026-02-11T08:30:00", check_out: null, status: "in" }],
  },
  {
    id: 2,
    first_name: "Devesh",
    last_name: "J",
    full_name: "Devesh J",
    mobile: "9564292826",
    email: "devesh.j@example.com",
    soc_staff_id: "STF002",
    staff_image_url: "",
    department_name: "Housekeeping",
    work_type_name: "Cleaner",
    unit_name: null,
    vendor_name: "CleanPro Ltd",
    status_text: "Active",
    number_verified: true,
    staff_workings: [{ id: 2, check_in: "2026-02-11T09:00:00", check_out: null, status: "in" }],
  },
  {
    id: 3,
    first_name: "Mathu",
    last_name: "Pol",
    full_name: "Mathu Pol",
    mobile: "8836101019",
    email: "",
    soc_staff_id: "STF003",
    staff_image_url: "",
    department_name: "Maintenance",
    work_type_name: "Electrician",
    unit_name: "Tower B",
    vendor_name: null,
    status_text: "Active",
    number_verified: false,
    staff_workings: [{ id: 3, check_in: "2026-02-11T07:45:00", check_out: null, status: "in" }],
  },
  {
    id: 4,
    first_name: "Santosh",
    last_name: "Yadav",
    full_name: "Santosh Yadav",
    mobile: "0123456789",
    email: "santosh.yadav@example.com",
    soc_staff_id: "STF004",
    staff_image_url: "",
    department_name: "Operations",
    work_type_name: "Plumber",
    unit_name: "Tower C",
    vendor_name: "FixIt Services",
    status_text: "Approved",
    number_verified: true,
    staff_workings: [{ id: 4, check_in: "2026-02-11T08:15:00", check_out: null, status: "in" }],
  },
  {
    id: 5,
    first_name: "Vikarm",
    last_name: "Rathod",
    full_name: "Vikarm Rathod",
    mobile: "9876543210",
    email: "vikarm.rathod@example.com",
    soc_staff_id: "STF005",
    staff_image_url: "",
    department_name: "Security",
    work_type_name: "Supervisor",
    unit_name: "Main Gate",
    vendor_name: null,
    status_text: "Active",
    number_verified: true,
    staff_workings: [{ id: 5, check_in: "2026-02-11T06:00:00", check_out: null, status: "in" }],
  },
  {
    id: 6,
    first_name: "Satyam",
    last_name: "M",
    full_name: "Satyam M",
    mobile: "7895789582",
    email: "satyam.m@example.com",
    soc_staff_id: "STF006",
    staff_image_url: "",
    department_name: "Gardening",
    work_type_name: "Gardener",
    unit_name: null,
    vendor_name: "GreenScape Services",
    status_text: "Active",
    number_verified: false,
    staff_workings: [{ id: 6, check_in: "2026-02-11T07:00:00", check_out: null, status: "in" }],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getStatusBadge = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes("active") || s.includes("approved")) return "bg-green-100 text-green-800 hover:bg-green-100";
  if (s.includes("pending")) return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
  return "bg-gray-100 text-gray-800 hover:bg-gray-100";
};

const formatCheckIn = (iso: string): string => {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ─── Column Config ─────────────────────────────────────────────────────────────

const staffInColumns: ColumnConfig[] = [
  { key: "sr_no",         label: "Sr. No.",      sortable: false, hideable: true,  draggable: true  },
  { key: "photo",         label: "Photo",        sortable: false, hideable: true,  draggable: true  },
  { key: "full_name",     label: "Staff Name",   sortable: true,  hideable: true,  draggable: true  },
  { key: "mobile",        label: "Mobile",       sortable: true,  hideable: true,  draggable: true  },
  { key: "department",    label: "Department",   sortable: true,  hideable: true,  draggable: true  },
  { key: "work_type",     label: "Work Type",    sortable: true,  hideable: true,  draggable: true  },
  { key: "unit",          label: "Unit",         sortable: true,  hideable: true,  draggable: true  },
  { key: "vendor",        label: "Vendor",       sortable: true,  hideable: true,  draggable: true  },
  { key: "status",        label: "Status",       sortable: true,  hideable: true,  draggable: true  },
  { key: "checked_in_at", label: "Check In Time",sortable: true,  hideable: true,  draggable: true  },
  { key: "in_status",     label: "IN/OUT",       sortable: false, hideable: false, draggable: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SmartSecureStaffsIn: React.FC = () => {
  const [staffsIn, setStaffsIn] = useState<StaffData[]>(dummyStaffData);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch staff in data
  const fetchStaffsIn = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getFullUrl("/crm/admin/society_staffs.json"), {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter only staff who are currently checked in
        const staffsInData = (data.society_staffs || []).filter(
          (staff: StaffData) =>
            staff.staff_workings &&
            staff.staff_workings.length > 0 &&
            staff.staff_workings[0].check_out === null
        );
        setStaffsIn(staffsInData);
      }
    } catch (error) {
      console.error("Error fetching staffs in:", error);
      // Using dummy data on error
      setStaffsIn(dummyStaffData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Comment out API call to use dummy data
    // fetchStaffsIn();
  }, []);

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback((staff: StaffData, columnKey: string) => {
    switch (columnKey) {
      case "sr_no": {
        const idx = staffsIn.indexOf(staff);
        return (
          <span className="text-sm text-gray-500 font-medium">{idx + 1}</span>
        );
      }

      case "photo":
        return (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
              {staff.staff_image_url ? (
                <img
                  src={staff.staff_image_url}
                  alt={staff.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(staff.full_name)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case "full_name":
        return (
          <span className="font-medium text-gray-900">{staff.full_name || "--"}</span>
        );

      case "mobile":
        return (
          <span className="text-sm text-gray-700">{staff.mobile || "--"}</span>
        );

      case "department":
        return (
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded font-medium">
            {staff.department_name || "--"}
          </span>
        );

      case "work_type":
        return (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium">
            {staff.work_type_name || "--"}
          </span>
        );

      case "unit":
        return (
          <span className="text-sm text-gray-700">{staff.unit_name || "--"}</span>
        );

      case "vendor":
        return (
          <span className="text-sm text-gray-700">{staff.vendor_name || "--"}</span>
        );

      case "status":
        return (
          <Badge className={getStatusBadge(staff.status_text)}>
            {staff.status_text || "--"}
          </Badge>
        );

      case "checked_in_at": {
        const checkIn = staff.staff_workings?.[0]?.check_in ?? null;
        return (
          <span className="text-sm text-gray-600">{checkIn ? formatCheckIn(checkIn) : "--"}</span>
        );
      }

      case "in_status": {
        const isIn =
          staff.staff_workings &&
          staff.staff_workings.length > 0 &&
          staff.staff_workings[0].check_out === null;
        return (
          <span
            className={`inline-block border-2 px-4 py-1 text-sm font-semibold rounded ${
              isIn
                ? "border-green-400 text-green-600"
                : "border-red-400 text-red-600"
            }`}
          >
            {isIn ? "IN" : "OUT"}
          </span>
        );
      }

      default: {
        const val = (staff as unknown as Record<string, unknown>)[columnKey];
        return val ? String(val) : "--";
      }
    }
  }, [staffsIn]);

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading staffs...</span>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <EnhancedTable
        data={staffsIn}
        columns={staffInColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="staffs-in-table"
        emptyMessage="No staff are currently checked in"
        searchPlaceholder="Search by name, mobile, department..."
        hideTableExport={false}
        hideColumnsButton={false}
        leftActions={
          <Button
            onClick={fetchStaffsIn}
            variant="outline"
            className="h-9 px-4 text-sm font-medium border-gray-300"
          >
            Refresh
          </Button>
        }
      />
    </div>
  );
};

export default SmartSecureStaffsIn;
