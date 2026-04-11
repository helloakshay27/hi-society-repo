import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    first_name: "Devesh",
    last_name: "J",
    full_name: "Devesh J",
    mobile: "9564292826",
    email: "devesh.j@example.com",
    soc_staff_id: "STF001",
    staff_image_url: "",
    department_name: "Housekeeping",
    work_type_name: "Cleaner",
    unit_name: "Tower A",
    vendor_name: "CleanPro Ltd",
    status_text: "Active",
    number_verified: true,
    staff_workings: [
      {
        id: 1,
        check_in: "2026-02-11T08:30:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 2,
    first_name: "Deepak",
    last_name: "Gupta",
    full_name: "Deepak Gupta",
    mobile: "7378490762",
    email: "deepak.gupta@example.com",
    soc_staff_id: "STF002",
    staff_image_url: "",
    department_name: "Security",
    work_type_name: "Guard",
    unit_name: "Main Gate",
    vendor_name: null,
    status_text: "Active",
    number_verified: true,
    staff_workings: [
      {
        id: 2,
        check_in: "2026-02-11T07:00:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 3,
    first_name: "Sagar",
    last_name: "Singh",
    full_name: "Sagar Singh",
    mobile: "1145454884",
    email: "sagar.singh@example.com",
    soc_staff_id: "STF003",
    staff_image_url: "",
    department_name: "Maintenance",
    work_type_name: "Electrician",
    unit_name: "Tower B",
    vendor_name: "FixIt Services",
    status_text: "Active",
    number_verified: true,
    staff_workings: [
      {
        id: 3,
        check_in: "2026-02-11T09:15:00",
        check_out: null,
        status: "in",
      },
    ],
  },
  {
    id: 4,
    first_name: "Ubaid",
    last_name: "Hashmat",
    full_name: "Ubaid Hashmat",
    mobile: "9876543210",
    email: "ubaid.hashmat@example.com",
    soc_staff_id: "STF004",
    staff_image_url: "",
    department_name: "Operations",
    work_type_name: "Supervisor",
    unit_name: "Tower C",
    vendor_name: null,
    status_text: "Active",
    number_verified: false,
    staff_workings: [
      {
        id: 4,
        check_in: "2026-02-11T08:00:00",
        check_out: null,
        status: "in",
      },
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatCheckInTime = (iso: string): string => {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ─── Column Config ─────────────────────────────────────────────────────────────

const staffOutColumns: ColumnConfig[] = [
  { key: "sr_no",         label: "Sr. No.",       sortable: false, hideable: true,  draggable: true  },
  { key: "staff_image",   label: "Photo",         sortable: false, hideable: true,  draggable: true  },
  { key: "full_name",     label: "Staff Name",    sortable: true,  hideable: true,  draggable: true  },
  { key: "mobile",        label: "Mobile",        sortable: true,  hideable: true,  draggable: true  },
  { key: "department",    label: "Department",    sortable: true,  hideable: true,  draggable: true  },
  { key: "work_type",     label: "Work Type",     sortable: true,  hideable: true,  draggable: true  },
  { key: "unit",          label: "Unit",          sortable: true,  hideable: true,  draggable: true  },
  { key: "status",        label: "Status",        sortable: true,  hideable: true,  draggable: true  },
  { key: "checked_in_at", label: "Checked In At", sortable: true,  hideable: true,  draggable: true  },
  { key: "out_action",    label: "OUT",           sortable: false, hideable: false, draggable: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SmartSecureStaffsOut: React.FC = () => {
  const [staffsIn, setStaffsIn] = useState<StaffData[]>(dummyStaffData);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  // Fetch staff in data (who need to check out)
  const fetchStaffsIn = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        getFullUrl("/crm/admin/society_staffs.json"),
        {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

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
      setStaffsIn(dummyStaffData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Comment out API call to use dummy data
    // fetchStaffsIn();
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleCheckOut = async (staffId: number, staffName: string) => {
    const outKey = `out-${staffId}`;
    setLoadingIds((prev) => ({ ...prev, [outKey]: true }));
    try {
      // TODO: Implement check out API call
      toast.success(`${staffName} checked out successfully`);
    } catch {
      toast.error(`Failed to check out ${staffName}`);
    } finally {
      setLoadingIds((prev) => ({ ...prev, [outKey]: false }));
    }
  };

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback(
    (staff: StaffData, columnKey: string, index: number) => {
      switch (columnKey) {
        case "sr_no":
          return (
            <span className="text-sm text-gray-500 font-medium">
              {index + 1}
            </span>
          );

        case "staff_image":
          return (
            <div className="flex justify-center">
              {staff.staff_image_url ? (
                <img
                  src={staff.staff_image_url}
                  alt={staff.full_name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(staff.full_name)}
                  </span>
                </div>
              )}
            </div>
          );

        case "full_name":
          return (
            <span className="font-medium text-gray-900">
              {staff.full_name || "--"}
            </span>
          );

        case "mobile":
          return (
            <span className="text-sm text-gray-700">
              {staff.mobile || "--"}
            </span>
          );

        case "department":
          return (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
              {staff.department_name || "--"}
            </Badge>
          );

        case "work_type":
          return (
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded font-medium">
              {staff.work_type_name || "--"}
            </span>
          );

        case "unit":
          return (
            <span className="text-sm text-gray-700">
              {staff.unit_name || "--"}
            </span>
          );

        case "status": {
          const isCheckedIn =
            staff.staff_workings &&
            staff.staff_workings.length > 0 &&
            staff.staff_workings[0].check_out === null;
          return (
            <Badge
              className={
                isCheckedIn
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {isCheckedIn ? "Checked In" : staff.status_text || "--"}
            </Badge>
          );
        }

        case "checked_in_at": {
          const checkIn =
            staff.staff_workings && staff.staff_workings.length > 0
              ? staff.staff_workings[0].check_in
              : "";
          return (
            <span className="text-sm text-gray-600">
              {formatCheckInTime(checkIn)}
            </span>
          );
        }

        case "out_action": {
          const outKey = `out-${staff.id}`;
          return (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50 text-xs px-4 py-1"
              disabled={!!loadingIds[outKey]}
              onClick={() => handleCheckOut(staff.id, staff.full_name)}
            >
              {loadingIds[outKey] ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "OUT"
              )}
            </Button>
          );
        }

        default: {
          const val = (staff as unknown as Record<string, unknown>)[columnKey];
          return val ? String(val) : "--";
        }
      }
    },
    [loadingIds]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading staffs...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <EnhancedTable
        data={staffsIn}
        columns={staffOutColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="staff-out-table"
        emptyMessage="No staff currently checked in"
        searchPlaceholder="Search by staff name or mobile number..."
        hideTableExport={false}
        hideColumnsButton={false}
        leftActions={<div />}
      />
    </div>
  );
};

export default SmartSecureStaffsOut;
