import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Loader2 } from "lucide-react";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AssociatedFlat {
  block_no: string;
  flat_no: string;
  display: string;
}

interface InPayload {
  staff_id: number;
  entry_by_id: number;
  custom_redirect: string;
}

interface StaffInData {
  id: number;
  name: string;
  mobile: string;
  staff_type: string;
  image_url: string;
  associated_flats_count: number;
  associated_flats: AssociatedFlat[];
  in_payload: InPayload;
}

interface Pagination {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

interface StaffInApiResponse {
  data: StaffInData[];
  pagination: Pagination;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const isDefaultImage = (url: string) => !url || url.startsWith("/images/");

// ─── Column Config ─────────────────────────────────────────────────────────────

const staffInColumns: ColumnConfig[] = [
  { key: "sr_no",            label: "Sr. No.",         sortable: false, hideable: true,  draggable: true  },
  { key: "photo",            label: "Photo",           sortable: false, hideable: true,  draggable: true  },
  { key: "name",             label: "Staff Name",      sortable: true,  hideable: true,  draggable: true  },
  { key: "mobile",           label: "Mobile",          sortable: true,  hideable: true,  draggable: true  },
  { key: "staff_type",       label: "Staff Type",      sortable: true,  hideable: true,  draggable: true  },
  { key: "associated_flats", label: "Associated Flats",sortable: false, hideable: true,  draggable: true  },
  { key: "in_button",        label: "Action",          sortable: false, hideable: false, draggable: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SmartSecureStaffsIn: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffInData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingInId, setLoadingInId] = useState<number | null>(null);

  // ── Image Preview State ────────────────────────────────────────────────────
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>("");

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch list ─────────────────────────────────────────────────────────────

  const fetchStaffIn = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    try {
      let url = getFullUrl(`/crm/admin/staff_in.json?page=${page}&per_page=20`);
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
      const data: StaffInApiResponse = await response.json();
      setStaffList(data.data ?? []);
      setTotalPages(data.pagination?.total_pages ?? 1);
      setTotalCount(data.pagination?.total_count ?? 0);
    } catch (error) {
      console.error("Error fetching staff in list:", error);
      toast.error("Failed to load staff list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffIn(currentPage, searchQuery);
  }, [fetchStaffIn, currentPage]);

  // Debounce search — reset to page 1 on new query
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchStaffIn(1, query);
    }, 400);
  }, [fetchStaffIn]);

  // ── Mark staff IN ──────────────────────────────────────────────────────────

  const handleMarkIn = useCallback(async (staff: StaffInData) => {
    setLoadingInId(staff.id);
    try {
      const entryTime = new Date().toISOString().replace("Z", "").replace("T", "T");
      const response = await fetch(getFullUrl("/staff_inouts.json"), {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staff_inout: {
            entry_time: entryTime,
            staff_id: String(staff.in_payload.staff_id),
            entry_by_id: String(staff.in_payload.entry_by_id),
          },
        }),
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      toast.success(`${staff.name} marked IN successfully`);
      fetchStaffIn(currentPage, searchQuery);
    } catch (error) {
      console.error("Error marking staff in:", error);
      toast.error(`Failed to mark ${staff.name} IN`);
    } finally {
      setLoadingInId(null);
    }
  }, [currentPage, fetchStaffIn, searchQuery]);

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback((staff: StaffInData, columnKey: string) => {
    switch (columnKey) {
      case "sr_no": {
        const idx = staffList.indexOf(staff);
        const perPage = 20;
        return (
          <span className="text-sm text-gray-500 font-medium">
            {(currentPage - 1) * perPage + idx + 1}
          </span>
        );
      }

      case "photo":
        return (
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (!isDefaultImage(staff.image_url)) {
                  setPreviewImageUrl(staff.image_url);
                  setPreviewImageName(staff.name || "Staff");
                  setPreviewImageOpen(true);
                }
              }}
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-green-600 cursor-pointer transition-all"
              title={!isDefaultImage(staff.image_url) ? "Click to preview" : "No image"}
              disabled={isDefaultImage(staff.image_url)}
            >
              {!isDefaultImage(staff.image_url) ? (
                <img
                  src={staff.image_url}
                  alt={staff.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(staff.name)}
                  </span>
                </div>
              )}
            </button>
          </div>
        );

      case "name":
        return (
          <span className="font-medium text-gray-900">{staff.name || "--"}</span>
        );

      case "mobile":
        return (
          <span className="text-sm text-gray-700">{staff.mobile || "--"}</span>
        );

      case "staff_type":
        return (
          <span className={`px-2 py-1 text-xs rounded font-medium ${
            staff.staff_type === "Society"
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
          }`}>
            {staff.staff_type || "--"}
          </span>
        );

      case "associated_flats":
        if (!staff.associated_flats_count) {
          return <span className="text-sm text-gray-400">--</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {staff.associated_flats.map((flat) => (
              <span
                key={flat.display}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200"
              >
                {flat.display}
              </span>
            ))}
          </div>
        );

      case "in_button": {
        const isThisLoading = loadingInId === staff.id;
        return (
          <Button
            size="sm"
            onClick={() => handleMarkIn(staff)}
            disabled={isThisLoading || loadingInId !== null}
            className="h-8 px-4 text-xs font-semibold hover:bg-green-600 text-white border-0"
          >
            {isThisLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "IN"
            )}
          </Button>
        );
      }

      default: {
        const val = (staff as unknown as Record<string, unknown>)[columnKey];
        return val ? String(val) : "--";
      }
    }
  }, [staffList, currentPage, loadingInId, handleMarkIn]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <EnhancedTable
        data={staffList}
        columns={staffInColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="staffs-in-table"
        emptyMessage="No staff found"
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
            onClick={() => fetchStaffIn(currentPage, searchQuery)}
            variant="outline"
            className="h-9 px-4 text-sm font-medium border-gray-300"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        }
      />

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

export default SmartSecureStaffsIn;
