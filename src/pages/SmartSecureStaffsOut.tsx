import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Loader2 } from "lucide-react";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StaffInfo {
  first_name: string;
  last_name: string;
  mobile: string;
  document: string;
}

interface StaffInoutRecord {
  id: number;
  staff_id: number;
  entry_time: string;
  exit_time: string | null;
  entry_gate_id: number | null;
  exit_gate_id: number | null;
  checkin_time: string | null;
  checkout_time: string | null;
  check_in: boolean;
  check_out: boolean;
  entry_gate: string;
  exit_gate: string;
  staff: StaffInfo;
}

interface StaffOutApiResponse {
  data: StaffInoutRecord[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (firstName: string, lastName: string): string => {
  const f = firstName.trim();
  const l = lastName.trim();
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f) return f.substring(0, 2).toUpperCase();
  return "??";
};

const formatTime = (iso: string | null): string => {
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

const staffOutColumns: ColumnConfig[] = [
  { key: "sr_no",          label: "Sr. No.",        sortable: false, hideable: true,  draggable: true  },
  { key: "photo",          label: "Photo",          sortable: false, hideable: true,  draggable: true  },
  { key: "full_name",      label: "Staff Name",     sortable: true,  hideable: true,  draggable: true  },
  { key: "mobile",         label: "Mobile",         sortable: true,  hideable: true,  draggable: true  },
  { key: "entry_gate",     label: "Entry Gate",     sortable: true,  hideable: true,  draggable: true  },
  { key: "checkin_time",   label: "Check In Time",  sortable: true,  hideable: true,  draggable: true  },
  { key: "checkout_time",  label: "Check Out Time", sortable: true,  hideable: true,  draggable: true  },
  { key: "status",         label: "Status",         sortable: false, hideable: true,  draggable: true  },
  { key: "action",         label: "Action",         sortable: false, hideable: false, draggable: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SmartSecureStaffsOut: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffInoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch list ─────────────────────────────────────────────────────────────

  const fetchStaffOut = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    try {
      let url = getFullUrl(`/crm/admin/staff_out.json?page=${page}&per_page=20`);
      if (search.trim()) {
        url += `&q[first_name_or_last_name_or_mobile_or_full_name_cont]=${encodeURIComponent(search.trim())}`;
      }
      const response = await fetch(url, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const data: StaffOutApiResponse = await response.json();
      setStaffList(data.data ?? []);
      setTotalPages(data.pagination?.total_pages ?? 1);
      setTotalCount(data.pagination?.total_count ?? 0);
    } catch (error) {
      console.error("Error fetching staff out list:", error);
      toast.error("Failed to load staff list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffOut(currentPage, searchQuery);
  }, [fetchStaffOut, currentPage]);

  // Debounce search — reset to page 1
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchStaffOut(1, query);
    }, 400);
  }, [fetchStaffOut]);

  // ── PATCH check_type ───────────────────────────────────────────────────────

  const handleCheckAction = useCallback(async (record: StaffInoutRecord) => {
    const checkType: "in" | "out" = record.check_in ? "out" : "in";
    const staffName = `${record.staff.first_name} ${record.staff.last_name}`.trim();

    setLoadingIds((prev) => ({ ...prev, [record.id]: true }));
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/staff_inouts/${record.id}.json`),
        {
          method: "PATCH",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ staff_inout: { check_type: checkType } }),
        }
      );
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      toast.success(
        checkType === "in"
          ? `${staffName} checked in successfully`
          : `${staffName} checked out successfully`
      );
      fetchStaffOut(currentPage, searchQuery);
    } catch (error) {
      console.error("Error updating staff check:", error);
      toast.error(`Failed to update status for ${staffName}`);
    } finally {
      setLoadingIds((prev) => ({ ...prev, [record.id]: false }));
    }
  }, [currentPage, fetchStaffOut, searchQuery]);

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback(
    (record: StaffInoutRecord, columnKey: string, index: number) => {
      switch (columnKey) {
        case "sr_no":
          return (
            <span className="text-sm text-gray-500 font-medium">
              {(currentPage - 1) * 20 + index + 1}
            </span>
          );

        case "photo":
          return (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {getInitials(record.staff.first_name, record.staff.last_name)}
                </span>
              </div>
            </div>
          );

        case "full_name":
          return (
            <span className="font-medium text-gray-900">
              {`${record.staff.first_name} ${record.staff.last_name}`.trim() || "--"}
            </span>
          );

        case "mobile":
          return (
            <span className="text-sm text-gray-700">
              {record.staff.mobile || "--"}
            </span>
          );

        case "entry_gate":
          return (
            <span className="text-sm text-gray-700">
              {record.entry_gate || "--"}
            </span>
          );

        case "checkin_time":
          return (
            <span className="text-sm text-gray-600">
              {formatTime(record.checkin_time)}
            </span>
          );

        case "checkout_time":
          return (
            <span className="text-sm text-gray-600">
              {formatTime(record.checkout_time)}
            </span>
          );

        case "status": {
          if (record.check_out) {
            return (
              <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs">
                Completed
              </Badge>
            );
          }
          if (record.check_in) {
            return (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                Checked In
              </Badge>
            );
          }
          return (
            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
              Pending
            </Badge>
          );
        }

        case "action": {
          const isLoading = !!loadingIds[record.id];

          // Completed — both in and out done
          if (record.check_out) {
            return (
              <span className="inline-block px-3 py-1 text-xs font-semibold text-gray-400 border border-gray-200 rounded">
                Completed
              </span>
            );
          }

          // check_in = true → next action is Check Out (orange/red)
          if (record.check_in) {
            return (
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50 text-xs px-4 h-8"
                disabled={isLoading}
                onClick={() => handleCheckAction(record)}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Check Out"
                )}
              </Button>
            );
          }

          // check_in = false → next action is Check In (green)
          return (
            <Button
              size="sm"
              className=" hover:bg-green-600 text-white border-0 text-xs px-4 h-8"
              disabled={isLoading}
              onClick={() => handleCheckAction(record)}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Check In"
              )}
            </Button>
          );
        }

        default: {
          const val = (record as unknown as Record<string, unknown>)[columnKey];
          return val ? String(val) : "--";
        }
      }
    },
    [currentPage, loadingIds, handleCheckAction]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <EnhancedTable
        data={staffList}
        columns={staffOutColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="staff-out-table"
        emptyMessage="No staff records found"
        searchPlaceholder="Search by name or mobile..."
        hideTableExport={false}
        hideColumnsButton={false}
        loading={isLoading}
        onSearchChange={handleSearch}
        searchValue={searchQuery}
        pagination={totalPages > 1}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        leftActions={
          <Button
            onClick={() => fetchStaffOut(currentPage, searchQuery)}
            variant="outline"
            className="h-9 px-4 text-sm font-medium border-gray-300"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        }
      />
    </div>
  );
};

export default SmartSecureStaffsOut;
