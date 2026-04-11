import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { StaffHistoryFilterDialog, StaffHistoryFilters } from "@/components/StaffHistoryFilterDialog";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { RefreshCw } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { useQuery } from "@tanstack/react-query";

// ─── API Types (matching /crm/admin/staff_history.json) ────────────────────────

interface AssociatedFlat {
  block_no: string;
  flat_no: string;
  display: string;
}

interface StaffInfo {
  id: number;
  name: string;
  mobile: string;
  staff_type: string;
  work_type: string;
  company_name: string;
  image_url: string;
  associated_flats: AssociatedFlat[];
}

interface TimeDetails {
  date: string | null;
  time: string | null;
  gate?: string | null;
  marked_by?: string | null;
}

interface StaffHistoryRecord {
  id: number;
  staff: StaffInfo;
  in_details: TimeDetails;
  out_details: TimeDetails;
  checkin_details: { date: string | null; time: string | null };
  checkout_details: { date: string | null; time: string | null };
  created_on: string;
}

interface ApiPagination {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

interface StaffHistoryResponse {
  data: StaffHistoryRecord[];
  pagination: ApiPagination;
  message: string;
}

// ─── Column Config ─────────────────────────────────────────────────────────────

const columns = [
  { key: "sr_no", label: "Sr. No.", sortable: false },
  { key: "name", label: "Name", sortable: true },
  { key: "mobile", label: "Mobile Number", sortable: true },
  { key: "staff_type", label: "Staff Type", sortable: true },
  { key: "work_type", label: "Work Type", sortable: true },
  { key: "associated_flats", label: "Associated Flats", sortable: false },
  { key: "company_name", label: "Company Name", sortable: true },
  { key: "in_date", label: "In Date", sortable: true },
  { key: "in_time", label: "In Time", sortable: false },
  { key: "in_gate", label: "In Gate", sortable: true },
  { key: "marked_in_by", label: "Marked In By", sortable: true },
  { key: "out_date", label: "Out Date", sortable: true },
  { key: "out_time", label: "Out Time", sortable: false },
  { key: "out_gate", label: "Out Gate", sortable: true },
  { key: "marked_out_by", label: "Marked Out By", sortable: true },
  { key: "checkin_date", label: "Checkin Date", sortable: true },
  { key: "checkin_time", label: "Checkin Time", sortable: false },
  { key: "checkout_date", label: "Checkout Date", sortable: true },
  { key: "checkout_time", label: "Checkout Time", sortable: false },
  { key: "created_on", label: "Created On", sortable: true },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SmartSecureStaffsHistory: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<StaffHistoryFilters>({});
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const perPage = 20;

  // Build query params from filters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("per_page", String(perPage));

    if (filters.work_type_ids) params.set("work_type_ids", filters.work_type_ids);
    if (filters.staff_types) params.set("staff_types", filters.staff_types);
    if (filters.tower_id) params.set("tower_id", filters.tower_id);
    if (filters.flat_ids) params.set("flat_ids", filters.flat_ids);
    if (filters.company_name) params.set("company_name", filters.company_name);
    if (filters.date_range) params.set("date_range", filters.date_range);

    return params.toString();
  }, [currentPage, filters]);

  // Fetch staff history
  const { data: apiData, isLoading, refetch } = useQuery<StaffHistoryResponse>({
    queryKey: ["staff-history", currentPage, filters],
    queryFn: async () => {
      const res = await fetch(
        getFullUrl(`/crm/admin/staff_history.json?${buildQueryParams()}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      return res.json();
    },
    staleTime: 30000,
  });

  const rows = apiData?.data ?? [];
  const pagination = apiData?.pagination;
  const totalPages = pagination?.total_pages ?? 1;

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    const loadingToastId = sonnerToast.loading("Preparing staff history export...", {
      duration: Infinity,
    });

    try {
      const res = await fetch(
        getFullUrl(`/crm/admin/staff_history.json?${buildQueryParams()}&export=true`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "staff-history.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      sonnerToast.success("Staff history exported successfully!", { id: loadingToastId });
    } catch (error) {
      console.error("Export failed:", error);
      sonnerToast.error("Failed to export staff history", { id: loadingToastId });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Selection ──────────────────────────────────────────────────────────────

  const handleStaffSelection = (staffId: string, isSelected: boolean) => {
    setSelectedStaff((prev) =>
      isSelected ? [...prev, staffId] : prev.filter((id) => id !== staffId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedStaff(rows.map((r) => r.id.toString()));
    } else {
      setSelectedStaff([]);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const handleFilterApply = (newFilters: StaffHistoryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback(
    (record: StaffHistoryRecord, columnKey: string, index: number) => {
      const { staff, in_details, out_details, checkin_details, checkout_details } = record;

      switch (columnKey) {
        case "sr_no":
          return (
            <span className="text-sm text-gray-500 font-medium">
              {(currentPage - 1) * perPage + index + 1}
            </span>
          );

        case "name":
          return <span className="font-medium">{staff.name}</span>;

        case "mobile":
          return <span className="text-sm">{staff.mobile}</span>;

        case "staff_type":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
              {staff.staff_type}
            </span>
          );

        case "work_type":
          return <span className="text-sm">{staff.work_type}</span>;

        case "associated_flats":
          return (
            <span className="text-sm">
              {staff.associated_flats.length > 0
                ? staff.associated_flats.map((f) => f.display).join(", ")
                : "-"}
            </span>
          );

        case "company_name":
          return <span className="text-sm">{staff.company_name || "-"}</span>;

        case "in_date":
          return <span className="text-sm">{in_details.date || "-"}</span>;

        case "in_time":
          return <span className="text-sm">{in_details.time || "-"}</span>;

        case "in_gate":
          return <span className="text-sm">{in_details.gate || "-"}</span>;

        case "marked_in_by":
          return <span className="text-sm">{in_details.marked_by || "-"}</span>;

        case "out_date":
          return <span className="text-sm">{out_details.date || "-"}</span>;

        case "out_time":
          return <span className="text-sm">{out_details.time || "-"}</span>;

        case "out_gate":
          return <span className="text-sm">{out_details.gate || "-"}</span>;

        case "marked_out_by":
          return <span className="text-sm">{out_details.marked_by || "-"}</span>;

        case "checkin_date":
          return <span className="text-sm">{checkin_details.date || "-"}</span>;

        case "checkin_time":
          return <span className="text-sm">{checkin_details.time || "-"}</span>;

        case "checkout_date":
          return <span className="text-sm">{checkout_details.date || "-"}</span>;

        case "checkout_time":
          return <span className="text-sm">{checkout_details.time || "-"}</span>;

        case "created_on":
          return <span className="text-sm">{record.created_on || "-"}</span>;

        default:
          return "-";
      }
    },
    [currentPage]
  );

  // ── Pagination ─────────────────────────────────────────────────────────────

  const renderPagination = () => (
    <div className="flex items-center justify-center mt-6 px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || isLoading}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNumber =
              currentPage <= 3
                ? i + 1
                : currentPage >= totalPages - 2
                  ? totalPages - 4 + i
                  : currentPage - 2 + i;

            if (pageNumber < 1 || pageNumber > totalPages) return null;

            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                disabled={isLoading}
                className={`w-8 h-8 flex items-center justify-center text-sm rounded transition-colors ${
                  currentPage === pageNumber
                    ? "bg-red-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                } disabled:opacity-50`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || isLoading}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="ml-4 text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Staff History</h1>
      </div>

      {/* Total Count */}
      {pagination && (
        <div className="text-sm font-semibold text-gray-700">
          Total staffs : {pagination.total_count}
        </div>
      )}

      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        selectable={true}
        pagination={false}
        enableExport={true}
        exportFileName="staff-history"
        handleExport={handleExport}
        storageKey="staff-history-table"
        enableSelection={true}
        selectedItems={selectedStaff}
        onSelectItem={handleStaffSelection}
        onSelectAll={handleSelectAll}
        getItemId={(record) => record.id.toString()}
        leftActions={
          <div className="flex gap-3">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        }
        onFilterClick={() => setIsFilterOpen(true)}
        rightActions={null}
        searchPlaceholder="Search by name or mobile number"
        enableSearch={true}
        hideTableExport={false}
        hideColumnsButton={false}
        className="transition-all duration-500 ease-in-out"
        loading={isLoading}
        loadingMessage="Loading staff history..."
      />

      {renderPagination()}

      {/* Filter Modal */}
      <StaffHistoryFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleFilterApply}
      />
    </div>
  );
};

export default SmartSecureStaffsHistory;
