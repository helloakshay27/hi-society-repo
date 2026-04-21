import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
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

// ─── API Types ─────────────────────────────────────────────────────────────────

interface ApiVehicleOut {
  id: number;
  gatekeeper_id: number | null;
  entry_gate_id: number | null;
  exit_gate_id: number | null;
  user_society_id: number | null;
  in_time: string | null;
  out_time: string | null;
  created_by_id: number | null;
  visitor_parking_slot_id: number | null;
  visitor_slot_number: string | null;
  vehicle_number: string | null;
  vehicle_type: string | null;
  created_by: string | null;
  guest_name: string | null;
  in_out_vehicle_number: string | null;
  host_name: string | null;
  visitor_type: "H" | "G" | string | null;
  delivery_service_provider: string | null;
  delivery_service_provider_icon: string | null;
}

interface ApiResponse {
  visitor_vehicle_in_out: ApiVehicleOut[];
  pagination?: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

interface ExitGateOption {
  id: number;
  name: string;
}

// ─── Column Config ─────────────────────────────────────────────────────────────

const columns: ColumnConfig[] = [
  { key: "sr_no",            label: "Sr. No.",        sortable: false, hideable: true,  draggable: true },
  { key: "vehicle_number",   label: "Vehicle Number", sortable: true,  hideable: true,  draggable: true },
  { key: "name",             label: "Name",           sortable: true,  hideable: true,  draggable: true },
  { key: "visitor_type",     label: "Type",           sortable: true,  hideable: true,  draggable: true },
  { key: "in_time",          label: "In Time",        sortable: true,  hideable: true,  draggable: true },
  { key: "out_time",         label: "Out Time",       sortable: true,  hideable: true,  draggable: true },
  { key: "service_provider", label: "Service",        sortable: true,  hideable: true,  draggable: true },
  { key: "action",           label: "Action",         sortable: false, hideable: false, draggable: false },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── Vehicle Out Modal ─────────────────────────────────────────────────────────

interface VehicleOutModalProps {
  open: boolean;
  vehicle: ApiVehicleOut | null;
  exitGates: ExitGateOption[];
  onClose: () => void;
  onSuccess: () => void;
}

const VehicleOutModal: React.FC<VehicleOutModalProps> = ({
  open, vehicle, exitGates, onClose, onSuccess,
}) => {
  const [selectedGate, setSelectedGate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setSelectedGate("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedGate) { toast.error("Please select an exit gate"); return; }
    if (!vehicle) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("visitor_vehicle_in_out[exit_gate_id]", selectedGate);
      fd.append("visitor_vehicle_in_out[out_time]", new Date().toISOString());

      const res = await fetch(
        getFullUrl(`/crm/admin/visitor_vehicle_out/${vehicle.id}.json`),
        { method: "PUT", headers: { Authorization: getAuthHeader() }, body: fd }
      );
      if (res.ok) {
        toast.success("Vehicle marked as out successfully!");
        setSelectedGate("");
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.message || "Failed to mark vehicle out");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Visitor Vehicle Out</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          {vehicle && (
            <div className="bg-gray-50 rounded px-3 py-2 text-sm">
              <span className="text-gray-500">Vehicle: </span>
              <span className="font-semibold text-gray-800">{vehicle.in_out_vehicle_number || "--"}</span>
              {(vehicle.host_name || vehicle.guest_name) && (
                <>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-gray-600">{vehicle.host_name || vehicle.guest_name}</span>
                </>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Exit Gate</label>
            <select
              title="Exit Gate"
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-[#C72030]"
            >
              <option value="" disabled>Select Exit Gate</option>
              {exitGates.map((gate) => (
                <option key={gate.id} value={String(gate.id)}>{gate.name}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button
            className="bg-[#C72030] hover:bg-[#C72030]/90 text-white min-w-[90px]"
            onClick={handleSubmit}
            disabled={submitting || !selectedGate}
          >
            {submitting
              ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Submitting...</span>
              : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const SmartSecureVehiclesOut: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [outModalOpen, setOutModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<ApiVehicleOut | null>(null);

  const { data: apiData, isLoading, isError, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["vehicle-out-list", currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("per_page", "20");
      const res = await fetch(
        getFullUrl(`/crm/admin/visitor_vehicle_out.json?${params.toString()}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      return res.json();
    },
    staleTime: 30000,
  });

  const { data: exitGatesData } = useQuery<ExitGateOption[]>({
    queryKey: ["exit-gates"],
    queryFn: async () => {
      const res = await fetch(getFullUrl("/crm/admin/exit_gates.json"), {
        headers: { Authorization: getAuthHeader() },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.exit_gates || data || [];
    },
    staleTime: 60000,
  });

  const rows = useMemo(() => apiData?.visitor_vehicle_in_out ?? [], [apiData]);
  const pagination = apiData?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const totalCount = pagination?.total_count ?? rows.length;
  const perPage = pagination?.per_page ?? 20;
  const exitGates: ExitGateOption[] = exitGatesData ?? [];

  const handleOutClick = (vehicle: ApiVehicleOut) => {
    setSelectedVehicle(vehicle);
    setOutModalOpen(true);
  };

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback(
    (row: ApiVehicleOut, columnKey: string, index: number) => {
      switch (columnKey) {
        case "sr_no":
          return (
            <span className="text-sm text-gray-500 font-medium">
              {(currentPage - 1) * perPage + index + 1}
            </span>
          );

        case "vehicle_number":
          return (
            <span className="font-semibold text-blue-600">
              {row.in_out_vehicle_number || row.vehicle_number || "--"}
            </span>
          );

        case "name":
          return (
            <span className="text-sm text-gray-800">
              {row.visitor_type === "H"
                ? (row.host_name || "--")
                : (row.guest_name || "--")}
            </span>
          );

        case "visitor_type":
          return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              row.visitor_type === "H"
                ? "bg-blue-100 text-blue-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {row.visitor_type === "H" ? "Host" : row.visitor_type === "G" ? "Guest" : (row.visitor_type || "--")}
            </span>
          );

        case "in_time":
          return <span className="text-sm text-gray-600">{formatDateTime(row.in_time)}</span>;

        case "out_time":
          return row.out_time
            ? <span className="text-sm text-gray-600">{formatDateTime(row.out_time)}</span>
            : <span className="text-xs text-orange-500 font-medium">Still Inside</span>;

        case "service_provider":
          return <span className="text-sm text-gray-600">{row.delivery_service_provider || "--"}</span>;

        case "action":
          return row.out_time ? (
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
              Exited
            </span>
          ) : (
            <Button
              size="sm"
              className="bg-[#C72030] hover:bg-[#C72030]/90 text-white text-xs px-3 py-1 h-7"
              onClick={() => handleOutClick(row)}
            >
              Out
            </Button>
          );

        default: {
          const val = (row as unknown as Record<string, unknown>)[columnKey];
          return val ? String(val) : "--";
        }
      }
    },
    [currentPage, perPage]
  );

  // ── Pagination ─────────────────────────────────────────────────────────────

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages <= 7 || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
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
          <PaginationItem key={`e-${i}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return items;
  };

  if (isError) {
    return (
      <div className="p-6 text-center py-24">
        <p className="text-red-600 font-medium">Error loading vehicle out data</p>
        <p className="text-sm text-gray-500 mt-1">{(error as Error)?.message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="vehicles-out-table"
        emptyMessage="No vehicles currently inside"
        searchPlaceholder="Search by vehicle number, name..."
        hideTableExport={false}
        hideColumnsButton={false}
        loading={isLoading}
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

      {/* Vehicle Out Modal */}
      <VehicleOutModal
        open={outModalOpen}
        vehicle={selectedVehicle}
        exitGates={exitGates}
        onClose={() => { setOutModalOpen(false); setSelectedVehicle(null); }}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default SmartSecureVehiclesOut;