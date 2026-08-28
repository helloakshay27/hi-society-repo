import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { ShieldCheck, Eye, ChevronDown, Loader2, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  getUserKycVerifications,
  verifyKycRequest,
  rejectKycRequest,
  UserKycVerification,
  PaginationMeta,
} from "@/services/encashmentService";

/** Surfaces the API's own `{ error: "..." }` message (e.g. 422s) instead of a generic one. */
const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  }
  return fallback;
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusVariant = (status: string): string => {
  const s = (status || "").toLowerCase();
  if (s === "verified" || s === "approved") return "accepted";
  if (s === "rejected" || s === "failed") return "rejected";
  return "pending";
};

// The two transitions the admin can push a request through, per the
// /admin/user_kyc_verifications/:id/{verify,reject} APIs.
const STATUS_ACTIONS: { key: "verified" | "rejected"; label: string }[] = [
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Reject" },
];

const columns: ColumnConfig[] = [
  { key: "actions", label: "Action", sortable: false, hideable: false, draggable: false },
  { key: "id", label: "Request ID", sortable: false, hideable: true, draggable: true },
  { key: "user", label: "User", sortable: false, hideable: true, draggable: true },
  { key: "document", label: "Document", sortable: false, hideable: true, draggable: true },
  { key: "status", label: "Status", sortable: false, hideable: true, draggable: true },
  { key: "created_at", label: "Submitted On", sortable: false, hideable: true, draggable: true },
  { key: "verified_at", label: "Reviewed On", sortable: false, hideable: true, draggable: true },
];

const DetailField: React.FC<{ label: string; value: string | null | undefined }> = ({
  label,
  value,
}) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-[#1A1A1A] font-medium break-words">{value || "-"}</div>
  </div>
);

const AttachmentThumb: React.FC<{ url: string; label: string }> = ({ url, label }) => {
  const [broken, setBroken] = useState(false);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="flex flex-col items-center justify-center w-20 h-20 rounded border border-[#D5DbDB] bg-gray-50 overflow-hidden hover:opacity-80 transition-opacity"
    >
      {broken ? (
        <FileText className="w-6 h-6 text-gray-400" />
      ) : (
        <img
          src={url}
          alt={label}
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
    </a>
  );
};

const AttachmentGroup: React.FC<{ label: string; urls: string[] | undefined }> = ({ label, urls }) => {
  if (!urls || urls.length === 0) return null;
  return (
    <div className="col-span-2">
      <div className="text-xs text-gray-500 mb-1.5">
        {label} ({urls.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <AttachmentThumb key={`${url}-${i}`} url={url} label={`${label} ${i + 1}`} />
        ))}
      </div>
    </div>
  );
};

interface RejectDialogState {
  open: boolean;
  request: UserKycVerification | null;
  reason: string;
}

export const KycRequestsPage: React.FC = () => {
  const [items, setItems] = useState<UserKycVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    per_page: 10,
    total_count: 0,
    total_pages: 1,
  });

  const [selected, setSelected] = useState<UserKycVerification | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Status-change state
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [rejectDialog, setRejectDialog] = useState<RejectDialogState>({
    open: false,
    request: null,
    reason: "",
  });

  const handleView = (item: UserKycVerification) => {
    setSelected(item);
    setIsDetailsModalOpen(true);
  };

  const fetchItems = (page: number) => {
    setLoading(true);
    getUserKycVerifications(page, pageSize)
      .then(({ items: data, pagination: meta }) => {
        setItems(data);
        setPagination(meta);
      })
      .catch((err) => {
        console.warn("Could not fetch KYC verification requests:", err);
        toast.error("Failed to load KYC requests");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleStatusSelect = (item: UserKycVerification, action: "verified" | "rejected") => {
    if (action === "rejected") {
      setRejectDialog({ open: true, request: item, reason: "" });
      return;
    }

    // "verified" needs no extra input — fire immediately.
    setUpdatingId(item.id);
    verifyKycRequest(item.id)
      .then(() => {
        toast.success("KYC request verified");
        fetchItems(currentPage);
      })
      .catch((err) => {
        console.warn("Could not verify KYC request:", err);
        toast.error(getApiErrorMessage(err, "Failed to update KYC status"));
      })
      .finally(() => setUpdatingId(null));
  };

  const handleConfirmReject = async () => {
    if (!rejectDialog.request) return;
    if (!rejectDialog.reason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    const id = rejectDialog.request.id;
    setUpdatingId(id);
    try {
      await rejectKycRequest(id, rejectDialog.reason.trim());
      toast.success("KYC request rejected");
      setRejectDialog({ open: false, request: null, reason: "" });
      fetchItems(currentPage);
    } catch (err) {
      console.warn("Could not reject KYC request:", err);
      toast.error(getApiErrorMessage(err, "Failed to reject KYC request"));
    } finally {
      setUpdatingId(null);
    }
  };

  const renderCell = (item: UserKycVerification, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <Button variant="ghost" size="sm" onClick={() => handleView(item)} title="View Details">
            <Eye className="w-4 h-4 text-gray-700" />
          </Button>
        );
      case "id":
        return <span className="font-medium text-[#1A1A1A]">#{item.id}</span>;
      case "user":
        return (
          <div>
            <div className="text-[#1A1A1A] text-sm">{item.full_name || "-"}</div>
            <div className="text-xs text-gray-500">User #{item.user_id}</div>
          </div>
        );
      case "document":
        return (
          <div className="text-sm">
            <div className="text-[#1A1A1A]">PAN: {item.pan_number || "-"}</div>
            <div className="text-xs text-gray-500">Aadhaar: {item.aadhaar_number || "-"}</div>
          </div>
        );
      case "status":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={updatingId === item.id}>
              <button
                type="button"
                className="inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={updatingId === item.id}
              >
                <StatusBadge status={statusVariant(item.status)} className="flex items-center gap-1.5">
                  {item.status}
                  {updatingId === item.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </StatusBadge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {STATUS_ACTIONS.map((option) => (
                <DropdownMenuItem key={option.key} onClick={() => handleStatusSelect(item, option.key)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      case "created_at":
        return <span className="whitespace-nowrap">{formatDateTime(item.created_at)}</span>;
      case "verified_at":
        return <span className="whitespace-nowrap">{formatDateTime(item.verified_at)}</span>;
      default:
        return "-";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">KYC Requests</h1>
      </div>

      <div className="overflow-x-auto animate-fade-in">
        <EnhancedTable
          data={items}
          columns={columns}
          renderCell={renderCell}
          pagination
          manualPagination
          pageSize={pageSize}
          currentPage={currentPage}
          totalPages={pagination.total_pages}
          onPageChange={setCurrentPage}
          enableExport={false}
          enableSearch={false}
          hideTableExport
          hideColumnsButton={false}
          storageKey="kyc-requests-table"
          className="transition-all duration-500 ease-in-out"
          loading={loading}
          loadingMessage="Loading KYC requests..."
          emptyMessage="No KYC requests found"
        />
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#F6F4EE] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#C72030]" />
              KYC Request Details
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="p-6 bg-white space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1A1A1A]">Request #{selected.id}</span>
                <StatusBadge status={statusVariant(selected.status)}>{selected.status}</StatusBadge>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <DetailField label="Full Name" value={selected.full_name} />
                <DetailField label="User ID" value={String(selected.user_id)} />
                <DetailField label="Date of Birth" value={selected.date_of_birth} />
                <DetailField label="Verification Method" value={selected.verification_method} />
                <DetailField label="PAN Number" value={selected.pan_number} />
                <DetailField label="Aadhaar Number" value={selected.aadhaar_number} />
                <div className="col-span-2">
                  <DetailField label="Address" value={selected.address} />
                </div>
                <DetailField label="Submitted On" value={formatDateTime(selected.created_at)} />
                <DetailField label="Reviewed On" value={formatDateTime(selected.verified_at)} />
                {selected.rejected_reason && (
                  <div className="col-span-2">
                    <DetailField label="Rejection Reason" value={selected.rejected_reason} />
                  </div>
                )}
                <AttachmentGroup label="PAN Attachment" urls={selected.pan_attachment_urls} />
                <AttachmentGroup label="Aadhaar Attachment" urls={selected.aadhaar_attachment_urls} />
                <AttachmentGroup label="ID Proof Attachment" urls={selected.id_proof_attachment_urls} />
              </div>
            </div>
          )}

          <DialogFooter className="bg-[#F6F4EE] px-6 py-3 border-t border-[#D5DbDB] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
              className="border-[#D5DbDB] text-[#1A1A1A] hover:bg-[#DBC2A9]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Modal */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#F6F4EE] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[#C72030]" />
              Reject KYC Request
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 bg-white space-y-2">
            {rejectDialog.request && (
              <p className="text-sm text-gray-600">
                Rejecting <span className="font-medium text-[#1A1A1A]">{rejectDialog.request.full_name}</span>'s
                KYC request
              </p>
            )}
            <Label className="text-xs font-semibold text-[#1A1A1A]">Rejection Reason</Label>
            <Textarea
              className="min-h-[90px] text-sm border-[#D5DbDB] bg-white"
              placeholder="Enter the reason for rejecting this request"
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </div>

          <DialogFooter className="bg-[#F6F4EE] px-6 py-3 border-t border-[#D5DbDB] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, request: null, reason: "" })}
              className="border-[#D5DbDB] text-[#1A1A1A] hover:bg-[#DBC2A9]"
            >
              Close
            </Button>
            <Button
              onClick={handleConfirmReject}
              disabled={updatingId === rejectDialog.request?.id}
              variant="ghost"
              className="btn-primary"
            >
              {updatingId === rejectDialog.request?.id && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KycRequestsPage;
