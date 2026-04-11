import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Plus, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

// ─── API Types ─────────────────────────────────────────────────────────────────

interface VisitorHost {
  id: number;
  name: string;
  mobile: string;
  status: string;
  flat_name: string;
  block_name: string;
  building_name: string | null;
}

interface UserFlat {
  id: number;
  id_user: number;
  society_id: number;
  flat: string;
  block: string;
  building_number: string | null;
  society_flat_id: number;
}

interface SocietyGate {
  id: number;
  gate_name: string;
}

interface ApiGatekeeper {
  id: number;
  guest_number: string;
  guest_vehicle_number: string;
  visit_purpose: string | null;
  guest_name: string;
  guest_entry_time: string | null;
  guest_exit_time: string | null;
  expected_at: string | null;
  approve: number;
  created_at: string;
  approval_mode: string | null;
  checkin_time: string | null;
  checkout_time: string | null;
  check_in: boolean;
  check_out: boolean;
  guest_type: string;
  vstatus: string;
  visitor_type: string;
  image: string;
  otp_string: string;
  delivery_service_provider: string | null;
  delivery_service_provider_icon: string | null;
  society_gate: SocietyGate | null;
  visitor_hosts: VisitorHost[];
  user_flat: UserFlat | null;
}

interface ApiResponse {
  code: number;
  gtype: string;
  count: number;
  current_page: number;
  pages: number | null;
  gatekeepers: ApiGatekeeper[];
}

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

const getHostDisplay = (v: ApiGatekeeper): string => {
  if (v.visitor_hosts && v.visitor_hosts.length > 0) {
    const h = v.visitor_hosts[0];
    const block = h.block_name ? `${h.block_name}/` : "";
    return `${block}${h.flat_name} - ${h.name}`;
  }
  if (v.user_flat) {
    return `${v.user_flat.block}/${v.user_flat.flat}`;
  }
  return "--";
};

// ─── API Actions ──────────────────────────────────────────────────────────────

const checkVisitorAction = async (
  id: number,
  checkType: "in" | "out"
): Promise<void> => {
  const res = await fetch(getFullUrl(`/crm/admin/visitors/${id}.json`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({ gatekeeper: { check_type: checkType } }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
};

// ─── Column Config ─────────────────────────────────────────────────────────────

const visitorInColumns: ColumnConfig[] = [
  { key: "sr_no",           label: "Sr. No.",       sortable: false, hideable: true,  draggable: true  },
  { key: "visitor_image",   label: "Photo",          sortable: false, hideable: true,  draggable: true  },
  { key: "guest_name",      label: "Visitor Name",   sortable: true,  hideable: true,  draggable: true  },
  { key: "guest_number",    label: "Mobile",         sortable: true,  hideable: true,  draggable: true  },
  { key: "guest_type",      label: "Guest Type",     sortable: true,  hideable: true,  draggable: true  },
  { key: "visitor_type",    label: "Visit Type",     sortable: true,  hideable: true,  draggable: true  },
  { key: "vstatus",         label: "Status",         sortable: true,  hideable: true,  draggable: true  },
  { key: "primary_host",    label: "Host",           sortable: false, hideable: true,  draggable: true  },
  { key: "visit_purpose",   label: "Purpose",        sortable: true,  hideable: true,  draggable: true  },
  { key: "society_gate",    label: "Gate",           sortable: false, hideable: true,  draggable: true  },
  { key: "guest_entry_time",label: "Entry Time",     sortable: true,  hideable: true,  draggable: true  },
  // { key: "check_in_action", label: "Check In",       sortable: false, hideable: false, draggable: false },
  // { key: "out_action",      label: "OUT",            sortable: false, hideable: false, draggable: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SmartSecureVisitorIn: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const perPage = 20;

  // ── Verify OTP State ───────────────────────────────────────────────────────
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) {
      toast.error("Please enter the OTP");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(getFullUrl("/crm/admin/verify_hour_otp.json"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({ otp: otpValue.trim() }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      toast.success("OTP verified successfully");
      setOtpDialogOpen(false);
      setOtpValue("");
    } catch {
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const { data: apiData, isLoading, isError, refetch } = useQuery<ApiResponse>({
    queryKey: ["visitor-in-list", currentPage],
    queryFn: async () => {
      const res = await fetch(
        getFullUrl(`/crm/admin/visitor_in.json?page=${currentPage}&per_page=${perPage}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      return res.json();
    },
    staleTime: 30000,
  });

  const rows = useMemo(() => apiData?.gatekeepers ?? [], [apiData]);
  const totalCount = apiData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / perPage) || 1;

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback((visitor: ApiGatekeeper, columnKey: string) => {
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
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {visitor.image ? (
                <img
                  src={visitor.image}
                  alt={visitor.guest_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
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

      case "guest_type":
        return (
          <span
            className={`px-2 py-1 text-xs rounded font-medium ${
              visitor.guest_type === "Support Staff"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {visitor.guest_type || "--"}
          </span>
        );

      case "visitor_type": {
        const vt = visitor.visitor_type;
        const isExpected = vt?.toLowerCase() === "expected";
        return (
          <span
            className={`px-2 py-1 text-xs rounded font-medium ${
              isExpected
                ? "bg-teal-100 text-teal-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {vt || "--"}
          </span>
        );
      }

      case "vstatus": {
        const s = visitor.vstatus;
        return (
          <Badge
            className={
              s === "Approved"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : s === "Pending"
                ? "bg-orange-100 text-orange-800 hover:bg-orange-100"
                : "bg-red-100 text-red-800 hover:bg-red-100"
            }
          >
            {s || "--"}
          </Badge>
        );
      }

      case "primary_host":
        return (
          <span className="text-sm text-gray-700">{getHostDisplay(visitor)}</span>
        );

      case "visit_purpose":
        return (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
            {visitor.visit_purpose?.trim() || "--"}
          </span>
        );

      case "society_gate":
        return (
          <span className="text-sm text-gray-700">
            {visitor.society_gate?.gate_name || "--"}
          </span>
        );

      case "guest_entry_time":
        return (
          <span className="text-sm text-gray-700">{formatDateTime(visitor.guest_entry_time)}</span>
        );

      case "check_in_action": {
        const inKey = `in-${visitor.id}`;
        return (
          <Button
            size="sm"
            className="hover:bg-green-600 text-white text-xs px-3 py-1"
            disabled={!!loadingIds[inKey]}
            onClick={async () => {
              setLoadingIds((prev) => ({ ...prev, [inKey]: true }));
              try {
                await checkVisitorAction(visitor.id, "in");
                toast.success(`${visitor.guest_name} checked in successfully`);
                queryClient.invalidateQueries({ queryKey: ["visitor-in-list"] });
              } catch {
                toast.error(`Failed to check in ${visitor.guest_name}`);
              } finally {
                setLoadingIds((prev) => ({ ...prev, [inKey]: false }));
              }
            }}
          >
            {loadingIds[inKey] ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Check In"
            )}
          </Button>
        );
      }

      case "out_action": {
        const outKey = `out-${visitor.id}`;
        return (
          <Button
            size="sm"
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50 text-xs px-3 py-1"
            disabled={!!loadingIds[outKey]}
            onClick={async () => {
              setLoadingIds((prev) => ({ ...prev, [outKey]: true }));
              try {
                await checkVisitorAction(visitor.id, "out");
                toast.success(`${visitor.guest_name} marked as OUT`);
                queryClient.invalidateQueries({ queryKey: ["visitor-in-list"] });
              } catch {
                toast.error(`Failed to mark ${visitor.guest_name} as OUT`);
              } finally {
                setLoadingIds((prev) => ({ ...prev, [outKey]: false }));
              }
            }}
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
        const val = (visitor as unknown as Record<string, unknown>)[columnKey];
        return val ? String(val) : "--";
      }
    }
    }, [currentPage, perPage, rows, loadingIds, queryClient]);

  const leftActions = (
    <div className="flex gap-2">
      <Button
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        onClick={() => navigate("/smartsecure/visitor-in/add")}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add
      </Button>
      <Button
        variant="outline"
        className="h-9 px-4 text-sm font-medium border-gray-300"
        onClick={() => {
          setOtpValue("");
          setOtpDialogOpen(true);
        }}
      >
        <KeyRound className="w-4 h-4 mr-2" />
        Verify OTP
      </Button>
    </div>
  );

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
        <span className="ml-2 text-gray-600">Loading visitors...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-600">Failed to load visitor data.</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <EnhancedTable
        data={rows}
        columns={visitorInColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="visitor-in-table"
        emptyMessage="No visitors found"
        searchPlaceholder="Search visitors..."
        hideTableExport={false}
        hideColumnsButton={false}
        leftActions={leftActions}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page {currentPage} of {totalPages} ({totalCount} total visitors)
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Verify OTP Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={(open) => { if (!otpLoading) { setOtpDialogOpen(open); if (!open) setOtpValue(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#C72030]" />
              Verify OTP
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-500 mb-3">Enter the OTP to verify visitor access.</p>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter OTP"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") handleVerifyOtp(); }}
              className="text-center text-lg tracking-widest font-semibold"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setOtpDialogOpen(false); setOtpValue(""); }}
              disabled={otpLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
              onClick={handleVerifyOtp}
              disabled={otpLoading || !otpValue.trim()}
            >
              {otpLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartSecureVisitorIn;
