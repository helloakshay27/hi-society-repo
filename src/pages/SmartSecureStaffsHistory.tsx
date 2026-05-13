import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { StaffHistoryFilterDialog, StaffHistoryFilters } from "@/components/StaffHistoryFilterDialog";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { RefreshCw, X } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── API Types ─────────────────────────────────────────────────────────────────

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
  { key: "image", label: "Image", sortable: false },
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<StaffHistoryFilters>({});
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');
  const perPage = 20;

  // Build Ransack query params from filters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("per_page", String(perPage));

    if (filters.work_type_id) {
      params.append("q[type_id_in][]", filters.work_type_id);
    }
    if (filters.staff_type) {
      params.append("q[staff_type_in][]", filters.staff_type);
    }
    if (filters.tower_id) {
      params.set("q[staff_workings_society_flat_society_block_id_eq]", filters.tower_id);
    }
    if (filters.flat_id) {
      params.append("q[staff_workings_society_flat_id_in][]", filters.flat_id);
    }
    if (filters.company_name) {
      params.set("q[notes_cont]", filters.company_name);
    }
    if (filters.date_from) {
      params.set("q[created_at_gteq]", filters.date_from);
    }
    if (filters.date_to) {
      params.set("q[created_at_lteq]", filters.date_to);
    }

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

  // Opens the date range modal instead of exporting directly
  const handleExport = () => {
    setExportDateFrom('');
    setExportDateTo('');
    setIsExportModalOpen(true);
  };

  const handleExportConfirm = async () => {
    if (!exportDateFrom || !exportDateTo) {
      sonnerToast.error('Please select both Date From and Date To');
      return;
    }

    // Format YYYY-MM-DD → DD/MM/YYYY for the API
    const formatDate = (iso: string) => {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    };

    const dateRange = `${formatDate(exportDateFrom)} - ${formatDate(exportDateTo)}`;

    setIsExportModalOpen(false);
    setIsExporting(true);
    const loadingToastId = sonnerToast.loading("Preparing staff history export...", { duration: Infinity });

    try {
      const params = new URLSearchParams();
      params.set("q[date_range]", dateRange);

      const res = await fetch(
        getFullUrl(`/crm/admin/staffs_data.xlsx?${params.toString()}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "staffs_data.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      sonnerToast.success("Staff history exported successfully!", { id: loadingToastId });
    } catch {
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
    setSelectedStaff(isSelected ? rows.map((r) => r.id.toString()) : []);
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
        case "image":
          return (
            <button
              onClick={() => {
                const imageUrl = staff.image_url || '/images/male.jpg';
                setPreviewImageUrl(imageUrl);
                setPreviewImageName(staff.name || 'Staff');
                setPreviewImageOpen(true);
              }}
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                minHeight: 36,
                background: "#f3f4f6",
                borderRadius: "50%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid transparent",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#C72030';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
              }}
              title="Click to preview"
            >
              {staff.image_url ? (
                <img
                  src={staff.image_url}
                  alt={staff.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/male.jpg';
                  }}
                />
              ) : (
                <img
                  src="/images/male.jpg"
                  alt={staff.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </button>
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

  // ── Pagination ────────────────────────────────────────────────────────────

  const renderPaginationItems = () => {
    const items = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // First page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => setCurrentPage(1)} isActive={currentPage === 1} className="cursor-pointer">
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink onClick={() => setCurrentPage(i)} isActive={currentPage === i} className="cursor-pointer">
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 3) {
        items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => setCurrentPage(totalPages)} isActive={currentPage === totalPages} className="cursor-pointer">
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-4">
      {/* Total Count */}
      {pagination && (
        <div className="text-sm font-semibold text-gray-700">
          Total staffs: {pagination.total_count}
        </div>
      )}

      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        // selectable={true}
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
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Filter Modal */}
      <StaffHistoryFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleFilterApply}
      />

      {/* Export Date Range Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={(open) => { if (!open) setIsExportModalOpen(false); }}>
        <DialogContent className="sm:max-w-sm bg-white [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
            <DialogTitle className="text-base font-semibold">Select Date Range to Export</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsExportModalOpen(false)} className="h-6 w-6 p-0">
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Date From</Label>
              <Input
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
                className="h-10 border-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Date To</Label>
              <Input
                type="date"
                value={exportDateTo}
                min={exportDateFrom}
                onChange={(e) => setExportDateTo(e.target.value)}
                className="h-10 border-gray-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExportConfirm}
              disabled={!exportDateFrom || !exportDateTo || isExporting}
              className="bg-[#C72030] hover:bg-[#C72030]/90 text-white"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={previewImageOpen} onOpenChange={setPreviewImageOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewImageName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-auto">
            {previewImageUrl && (
              <img
                src={previewImageUrl}
                alt={previewImageName}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartSecureStaffsHistory;
