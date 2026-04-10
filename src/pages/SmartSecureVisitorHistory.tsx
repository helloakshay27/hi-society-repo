import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

// ─── API Types ────────────────────────────────────────────────────────────────

interface FilterOption {
  label: string;
  value: number | string;
}

interface ApiVisitor {
  id: number;
  guest_name: string;
  guest_number: string;
  guest_type: string;
  visit_purpose: string | null;
  guest_entry_time: string | null;
  guest_exit_time: string | null;
  approve: number;
  approve_status: { status: string } | null;
  notes: string;
  guest_vehicle_number: string;
  created_by: string | null;
  created_at: string;
  checkin_time: string | null;
  checkout_time: string | null;
  approval_mode: string | null;
  building: { id: number; name: string } | null;
  tower: { id: number; name: string } | null;
  flat: { id: number; number: string } | null;
  person_to_meet: {
    id: string;
    name: string;
    flat_member_str: string;
    mobile: string;
  } | null;
  entry_gate?: { id: number; name: string } | null;
  exit_gate?: { id: number; name: string } | null;
  marked_in_by: string | null;
  marked_out_by: string | null;
}

interface ApiResponse {
  filters: {
    available_options: {
      buildings: FilterOption[];
      towers: FilterOption[];
      flats: FilterOption[];
      visitor_types: FilterOption[];
      approval_statuses: FilterOption[];
    };
  };
  data: ApiVisitor[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

// ─── Filter State ─────────────────────────────────────────────────────────────

interface FilterState {
  building: string;
  tower: string;
  flat: string;
  visitor_type: string;
  approval_status: string;
  from_date: string;
  to_date: string;
}

const defaultFilters: FilterState = {
  building: "",
  tower: "",
  flat: "",
  visitor_type: "",
  approval_status: "",
  from_date: "",
  to_date: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateTime = (iso: string | null | undefined): string => {
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

const buildQueryString = (page: number, filters: FilterState): string => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", "20");
  if (filters.building) params.set("building_id", filters.building);
  if (filters.tower) params.set("tower_id", filters.tower);
  if (filters.flat) params.set("flat_id", filters.flat);
  if (filters.visitor_type) params.set("visitor_type", filters.visitor_type);
  if (filters.approval_status) params.set("approval_status", filters.approval_status);
  if (filters.from_date) params.set("created_date_range[from]", filters.from_date);
  if (filters.to_date) params.set("created_date_range[to]", filters.to_date);
  return params.toString();
};

// ─── Column Config ────────────────────────────────────────────────────────────

const historyColumns: ColumnConfig[] = [
  // { key: "actions",           label: "Actions",         sortable: false, hideable: false, draggable: false },
  { key: "sr_no",             label: "Sr. No.",         sortable: false, hideable: true,  draggable: true  },
  { key: "visitor_image",     label: "Photo",           sortable: false, hideable: true,  draggable: true  },
  { key: "id",                label: "Id",              sortable: true,  hideable: true,  draggable: true  },
  { key: "guest_name",        label: "Name",            sortable: true,  hideable: true,  draggable: true  },
  { key: "guest_number",      label: "Mobile Number",   sortable: true,  hideable: true,  draggable: true  },
  { key: "building",          label: "Building",        sortable: true,  hideable: true,  draggable: true  },
  { key: "tower",             label: "Tower",           sortable: true,  hideable: true,  draggable: true  },
  { key: "flat",              label: "Flat",            sortable: true,  hideable: true,  draggable: true  },
  { key: "visited_to",        label: "Visited To",      sortable: true,  hideable: true,  draggable: true  },
  { key: "vehicle_number",    label: "Vehicle Number",  sortable: true,  hideable: true,  draggable: true  },
  { key: "visitor_type",      label: "Visitor Type",    sortable: true,  hideable: true,  draggable: true  },
  { key: "visit_purpose",     label: "Purpose",         sortable: true,  hideable: true,  draggable: true  },
  { key: "approve_status",    label: "Host Status",     sortable: true,  hideable: true,  draggable: true  },
  { key: "approval_mode",     label: "Mode of Approval",sortable: true,  hideable: true,  draggable: true  },
  { key: "created_at",        label: "Created Date",    sortable: true,  hideable: true,  draggable: true  },
  { key: "guest_entry_time",  label: "Entry Time",      sortable: true,  hideable: true,  draggable: true  },
  { key: "guest_exit_time",   label: "Exit Time",       sortable: true,  hideable: true,  draggable: true  },
  { key: "entry_gate",        label: "In Gate",         sortable: true,  hideable: true,  draggable: true  },
  { key: "exit_gate",         label: "Out Gate",        sortable: true,  hideable: true,  draggable: true  },
  { key: "marked_in_by",      label: "Marked In By",    sortable: true,  hideable: true,  draggable: true  },
  { key: "marked_out_by",     label: "Marked Out By",   sortable: true,  hideable: true,  draggable: true  },
  { key: "created_by",        label: "Created By",      sortable: true,  hideable: true,  draggable: true  },
];

// ─── Filter Dialog ────────────────────────────────────────────────────────────

interface FilterDialogProps {
  open: boolean;
  filters: FilterState;
  options: ApiResponse["filters"]["available_options"] | null;
  onClose: () => void;
  onApply: (f: FilterState) => void;
  onReset: () => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  open, filters, options, onClose, onApply, onReset,
}) => {
  const [local, setLocal] = useState<FilterState>(filters);

  const set = (key: keyof FilterState, val: string) =>
    setLocal((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Visitor History</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Building */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Building</label>
            <Select value={local.building || "__all__"} onValueChange={(v) => set("building", v === "__all__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="All Buildings" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {options?.buildings.map((b) => (
                  <SelectItem key={b.value} value={String(b.value)}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tower */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tower</label>
            <Select value={local.tower || "__all__"} onValueChange={(v) => set("tower", v === "__all__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="All Towers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {options?.towers.map((t) => (
                  <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flat */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Flat</label>
            <Select value={local.flat || "__all__"} onValueChange={(v) => set("flat", v === "__all__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="All Flats" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {options?.flats.map((f) => (
                  <SelectItem key={f.value} value={String(f.value)}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visitor Type */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Visitor Type</label>
            <Select value={local.visitor_type || "__all__"} onValueChange={(v) => set("visitor_type", v === "__all__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {options?.visitor_types.map((vt) => (
                  <SelectItem key={vt.value} value={String(vt.value)}>{vt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Approval Status */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Approval Status</label>
            <Select value={local.approval_status || "__all__"} onValueChange={(v) => set("approval_status", v === "__all__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {options?.approval_statuses.map((s) => (
                  <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-gray-700">From Date</label>
              <input
                type="date"
                title="From Date"
                value={local.from_date}
                onChange={(e) => set("from_date", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-gray-700">To Date</label>
              <input
                type="date"
                title="To Date"
                value={local.to_date}
                onChange={(e) => set("to_date", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setLocal(defaultFilters); onReset(); }}>
            Reset
          </Button>
          <Button className="bg-[#C72030] text-white hover:bg-[#C72030]/90" onClick={() => onApply(local)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const SmartSecureVisitorHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(defaultFilters);

  const { data: apiData, isLoading, isError, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["visitor-history-list", currentPage, activeFilters],
    queryFn: async () => {
      const qs = buildQueryString(currentPage, activeFilters);
      const res = await fetch(
        getFullUrl(`/crm/admin/visitors_history.json?${qs}`),
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
  const filterOptions = apiData?.filters?.available_options ?? null;

  const handleApplyFilter = (f: FilterState) => {
    setActiveFilters(f);
    setCurrentPage(1);
    setFilterOpen(false);
    toast.success("Filters applied");
  };

  const handleResetFilter = () => {
    setActiveFilters(defaultFilters);
    setCurrentPage(1);
  };

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback((row: ApiVisitor, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <button
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="View"
              onClick={() => toast.info(`Viewing visitor: ${row.guest_name}`)}
            >
              <svg className="w-4 h-4 text-gray-600 hover:text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Flag"
              onClick={() => toast.info(`Flagged: ${row.guest_name}`)}
            >
              <svg className="w-4 h-4 text-gray-600 hover:text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </button>
          </div>
        );

      case "sr_no": {
        const idx = rows.indexOf(row);
        return (
          <span className="text-sm text-gray-500 font-medium">
            {(currentPage - 1) * perPage + idx + 1}
          </span>
        );
      }

      case "visitor_image":
        return (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
        );

      case "id":
        return <span className="text-sm text-gray-700">{row.id}</span>;

      case "guest_name":
        return <span className="font-medium text-gray-900">{row.guest_name || "--"}</span>;

      case "guest_number":
        return <span className="text-sm text-gray-700">{row.guest_number || "--"}</span>;

      case "building":
        return <span className="text-sm text-gray-700">{row.building?.name || "--"}</span>;

      case "tower":
        return <span className="text-sm text-gray-700">{row.tower?.name || "--"}</span>;

      case "flat":
        return <span className="text-sm text-gray-700">{row.flat?.number || "--"}</span>;

      case "visited_to":
        return (
          <span className="text-sm text-gray-700">
            {row.person_to_meet?.flat_member_str || row.person_to_meet?.name || "--"}
          </span>
        );

      case "vehicle_number":
        return <span className="text-sm text-gray-700">{row.guest_vehicle_number || "--"}</span>;

      case "visitor_type":
        return (
          <span className={`px-2 py-1 text-xs rounded font-medium ${
            row.guest_type === "Support Staff" ? "bg-purple-100 text-purple-700" :
            row.guest_type === "Guest"         ? "bg-blue-100 text-blue-700" :
            row.guest_type === "Delivery"      ? "bg-yellow-100 text-yellow-700" :
                                                 "bg-orange-100 text-orange-700"
          }`}>
            {row.guest_type || "--"}
          </span>
        );

      case "visit_purpose":
        return (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
            {row.visit_purpose || "--"}
          </span>
        );

      case "approve_status": {
        const status = row.approve_status?.status ?? "--";
        return (
          <Badge className={
            status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-100" :
            status === "Pending"  ? "bg-orange-100 text-orange-800 hover:bg-orange-100" :
            status === "Rejected" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                    "bg-gray-100 text-gray-800 hover:bg-gray-100"
          }>
            {status}
          </Badge>
        );
      }

      case "approval_mode":
        return <span className="text-sm text-gray-700">{row.approval_mode || "--"}</span>;

      case "created_at":
        return <span className="text-sm text-gray-600">{formatDateTime(row.created_at)}</span>;

      case "guest_entry_time":
        return <span className="text-sm text-gray-600">{formatDateTime(row.guest_entry_time)}</span>;

      case "guest_exit_time":
        return <span className="text-sm text-gray-600">{formatDateTime(row.guest_exit_time)}</span>;

      case "entry_gate":
        return <span className="text-sm text-gray-700">{row.entry_gate?.name || "--"}</span>;

      case "exit_gate":
        return <span className="text-sm text-gray-700">{row.exit_gate?.name || "--"}</span>;

      case "marked_in_by":
        return <span className="text-sm text-gray-700">{row.marked_in_by || "--"}</span>;

      case "marked_out_by":
        return <span className="text-sm text-gray-700">{row.marked_out_by || "--"}</span>;

      case "created_by":
        return <span className="text-sm text-gray-700">{row.created_by || "--"}</span>;

      default: {
        const val = (row as unknown as Record<string, unknown>)[columnKey];
        return val ? String(val) : "--";
      }
    }
  }, [currentPage, perPage, rows]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages <= 7 || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink className="cursor-pointer" onClick={() => setCurrentPage(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if ((i === 2 && currentPage > 4) || (i === totalPages - 1 && currentPage < totalPages - 3)) {
        items.push(<PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>);
      }
    }
    return items;
  };

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading visitor history...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center py-24">
        <p className="text-red-600 font-medium">Error loading visitor history</p>
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
        columns={historyColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="visitor-history-list-table"
        emptyMessage="No visitor history available"
        searchPlaceholder="Search visitors..."
        hideTableExport={false}
        hideColumnsButton={false}
        onFilterClick={() => setFilterOpen(true)}
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

      {/* Filter Dialog */}
      <FilterDialog
        open={filterOpen}
        filters={activeFilters}
        options={filterOptions}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />
    </div>
  );
};

export default SmartSecureVisitorHistory;
