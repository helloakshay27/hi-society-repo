import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

// ─── API Types ─────────────────────────────────────────────────────────────────

interface ApiVisitor {
  id: number;
  guest_name: string;
  guest_number: string;
  guest_vehicle_number: string;
  guest_type: string;
  visit_purpose: string | null;
  guest_entry_time: string;
  guest_exit_time: string | null;
  approve: number;
  approve_status: { status: string; badge_class: string };
  checkin_status: {
    has_checkin: boolean;
    checkin_time: string | null;
    has_checkout: boolean;
    checkout_time: string | null;
  };
  action_status: {
    next_action: string;
    action_label: string;
    action_color: string;
    action_available: boolean;
  };
  support_staff_category: string | null;
  overdue: {
    is_overdue: boolean;
    overdue_type: string | null;
    exceeded_by_minutes: number | null;
  };
  person_to_meet: {
    id: string;
    name: string;
    flat_member_str: string;
    mobile: string;
  };
  building: { id: number; name: string };
  tower: { id: number; name: string };
  flat: { id: number; number: string };
}

interface ApiResponse {
  data: ApiVisitor[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatEntryTime = (iso: string): string => {
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

const visitorOutColumns: ColumnConfig[] = [
  { key: "sr_no",          label: "Sr. No.",       sortable: false, hideable: true,  draggable: true  },
  { key: "visitor_image",  label: "Photo",        sortable: false, hideable: true,  draggable: true  },
  { key: "guest_name",     label: "Visitor Name",  sortable: true,  hideable: true,  draggable: true  },
  { key: "guest_number",   label: "Guest Number",  sortable: true,  hideable: true,  draggable: true  },
  { key: "visitor_type",   label: "Type",          sortable: true,  hideable: true,  draggable: true  },
  { key: "status",         label: "Status",        sortable: true,  hideable: true,  draggable: true  },
  { key: "primary_host",   label: "Host",          sortable: true,  hideable: true,  draggable: true  },
  { key: "visit_purpose",  label: "Purpose",       sortable: true,  hideable: true,  draggable: true  },
  { key: "checked_in_at",  label: "Checked In At", sortable: true,  hideable: true,  draggable: true  },
  { key: "check_in_action",label: "Check In",      sortable: false, hideable: false, draggable: false },
  { key: "out_action",     label: "OUT",           sortable: false, hideable: false, draggable: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SmartSecureVisitorOut: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiData, isLoading, isError, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["visitor-out-list", currentPage],
    queryFn: async () => {
      const res = await fetch(
        getFullUrl(`/crm/admin/visitor_out.json?page=${currentPage}&per_page=20`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      return res.json();
    },
    staleTime: 30000,
  });

  const rows = useMemo(() => apiData?.data ?? [], [apiData]);
  const pagination = apiData?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const totalCount = pagination?.total_count ?? 0;
  const perPage = pagination?.per_page ?? 20;

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback((visitor: ApiVisitor, columnKey: string) => {
    switch (columnKey) {
      case "sr_no": {
        const idx = rows.indexOf(visitor);
        return (
          <span className="text-sm text-gray-500 font-medium">
            {(currentPage - 1) * perPage + idx + 1}
          </span>
        );
      }

      case "visitor_image":
        return (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
        );

      case "guest_name":
        return (
          <span className="font-medium text-gray-900">{visitor.guest_name || "--"}</span>
        );

      case "guest_number":
        return (
          <span className="text-sm text-gray-700">{visitor.guest_number || "--"}</span>
        );

      case "visitor_type":
        return (
          <span
            className={`px-2 py-1 text-xs rounded font-medium ${
              visitor.guest_type === "Support Staff"
                ? "bg-purple-100 text-purple-700"
                : visitor.guest_type === "Delivery"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {visitor.guest_type || "--"}
          </span>
        );

      case "status": {
        const status = visitor.approve_status?.status ?? "--";
        return (
          <Badge
            className={
              status === "Approved"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : status === "Pending"
                ? "bg-orange-100 text-orange-800 hover:bg-orange-100"
                : "bg-red-100 text-red-800 hover:bg-red-100"
            }
          >
            {status}
          </Badge>
        );
      }

      case "primary_host":
        return (
          <span className="text-sm text-gray-700">
            {visitor.person_to_meet?.flat_member_str || "--"}
          </span>
        );

      case "visit_purpose":
        return (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
            {visitor.visit_purpose || visitor.support_staff_category || "--"}
          </span>
        );

      case "checked_in_at":
        return (
          <span className="text-sm text-gray-600">
            {formatEntryTime(visitor.guest_entry_time)}
          </span>
        );

      case "check_in_action":
        return (
          <Button
            size="sm"
            className=" hover:bg-green-600 text-white text-xs px-3 py-1"
            disabled={!visitor.action_status?.action_available}
            onClick={() => toast.success(`${visitor.guest_name} checked in successfully`)}
          >
            {visitor.action_status?.action_label ?? "Check In"}
          </Button>
        );

      case "out_action":
        return (
          <div className="flex flex-col items-center gap-1">
            {visitor.overdue?.is_overdue && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-500 text-white rounded">
                Overdue
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50 text-xs px-3 py-1"
              onClick={() => toast.info(`${visitor.guest_name} marked as OUT`)}
            >
              OUT
            </Button>
          </div>
        );

      default: {
        const val = (visitor as unknown as Record<string, unknown>)[columnKey];
        return val ? String(val) : "--";
      }
    }
  }, [currentPage, perPage, rows]);

  // ── Pagination helpers ─────────────────────────────────────────────────────

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        totalPages <= 7 ||
        i === 1 ||
        i === totalPages ||
        Math.abs(i - currentPage) <= 1
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              className="cursor-pointer"
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (
        (i === 2 && currentPage > 4) ||
        (i === totalPages - 1 && currentPage < totalPages - 3)
      ) {
        items.push(
          <PaginationItem key={`ellipsis-${i}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return items;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading visitors...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center py-24">
        <p className="text-red-600 font-medium">Error loading visitors</p>
        <p className="text-sm text-gray-500 mt-1">{(error as Error)?.message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <EnhancedTable
        data={rows}
        columns={visitorOutColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="visitor-out-table"
        emptyMessage="No visitors to check out"
        searchPlaceholder="Search visitors..."
        hideTableExport={false}
        hideColumnsButton={false}
        leftActions={<div />}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-gray-500">
            Showing {(currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, totalCount)} of {totalCount} records
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default SmartSecureVisitorOut;
