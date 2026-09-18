import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Wallet, Clock, CheckCircle2, XCircle, Eye, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getEncashRequests,
  getEncashRequestDetail,
  startProcessingEncashRequest,
  lockatedApproveEncashRequest,
  lockatedRejectEncashRequest,
  EncashRequest,
  EncashRequestCounts,
  PaginationMeta,
} from "@/services/encashmentService";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

/** Surfaces the API's own `{ error: "..." }` message (e.g. 422s) instead of a generic one. */
const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  }
  return fallback;
};

// Substring match, not exact equality — the resulting status string after
// lockated_approve/lockated_reject isn't documented (could be "approved",
// "lockated_approved", "approved_by_lockated", etc.), so this has to catch
// whatever comes back rather than an exact list of known values.
const statusVariant = (status: string): string => {
  const s = (status || "").toLowerCase();
  if (s.includes("successful") || s.includes("completed") || s.includes("approved")) return "accepted";
  if (s.includes("cancelled") || s.includes("failed") || s.includes("rejected")) return "rejected";
  return "pending";
};

type StatusAction = "processing" | "cancelled" | "successful";

// "Processing" moves the request into processing (/start_processing).
// "Successful" approves the request at the Lockated (superadmin) level
// (/lockated_approve). "Cancelled" is the Lockated reject gate
// (/lockated_reject) — reason required.
const STATUS_ACTIONS: { key: StatusAction; label: string }[] = [
  // { key: "processing", label: "Processing" },
  { key: "cancelled", label: "Cancelled" },
  { key: "successful", label: "Successful" },
];

const requestColumns: ColumnConfig[] = [
  { key: "actions", label: "Action", sortable: false, hideable: false, draggable: false },
  { key: "request_reference", label: "Reference", sortable: false, hideable: true, draggable: true },
  { key: "person_name", label: "Requested By", sortable: false, hideable: true, draggable: true },
  { key: "bank", label: "Bank Details", sortable: false, hideable: true, draggable: true },
  { key: "branch_name", label: "Branch Name", sortable: false, hideable: true, draggable: true },
  { key: "points_to_encash", label: "Points", sortable: false, hideable: true, draggable: true },
  { key: "processing_fee_percent", label: "Fee %", sortable: false, hideable: true, draggable: true },
  { key: "amount_payable", label: "Amount Payable", sortable: false, hideable: true, draggable: true },
  { key: "status", label: "Overall Status", sortable: false, hideable: true, draggable: true },
  { key: "requested_at", label: "Requested On", sortable: false, hideable: true, draggable: true },
  { key: "resolution", label: "Resolved On", sortable: false, hideable: true, draggable: true },
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

/**
 * Cancelled-cheque proof images from `cancelled_cheque_urls`. These are the KYC
 * document for the bank account, so they're the thing an admin checks before paying
 * out — shown inline, with each thumbnail opening the full-size image in a new tab.
 */
const ChequeImages: React.FC<{ urls: string[] | null | undefined }> = ({ urls }) => {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const images = (urls ?? []).filter((url) => typeof url === "string" && url.trim() !== "");

  if (images.length === 0) return null;

  return (
    <div className="border-t border-[#D5DbDB] pt-4">
      <div className="text-xs text-gray-500 mb-2">
        Cancelled Cheque{images.length > 1 ? ` (${images.length})` : ""}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open full size"
            className="block overflow-hidden rounded-md border border-[#D5DbDB] bg-[#F6F4EE] transition-shadow hover:shadow-md"
          >
            {failed[url] ? (
              <div className="flex h-28 items-center justify-center px-2 text-center text-xs text-gray-500">
                Image unavailable — open original
              </div>
            ) : (
              <img
                src={url}
                alt="Cancelled cheque"
                loading="lazy"
                className="h-28 w-full object-cover"
                onError={() => setFailed((prev) => ({ ...prev, [url]: true }))}
              />
            )}
          </a>
        ))}
      </div>
    </div>
  );
};

interface CancelDialogState {
  open: boolean;
  request: EncashRequest | null;
  reason: string;
}

interface ApproveDialogState {
  open: boolean;
  request: EncashRequest | null;
  utr: string;
}

export const EncashmentRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<EncashRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    per_page: 10,
    total_count: 0,
    total_pages: 1,
  });
  // Status counts across all pages (from the API's `counts`), not just the
  // current page's 10 rows — powers the stats cards below.
  const [counts, setCounts] = useState<EncashRequestCounts | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<EncashRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status-change state
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [cancelDialog, setCancelDialog] = useState<CancelDialogState>({
    open: false,
    request: null,
    reason: "",
  });
  const [approveDialog, setApproveDialog] = useState<ApproveDialogState>({
    open: false,
    request: null,
    utr: "",
  });

  const handleViewRequest = (item: EncashRequest) => {
    // Open immediately with the row's data so the modal isn't blank while
    // loading, then replace it with the full record from the detail endpoint
    // (GET /admin/encash_requests/:id), which may carry fields the paginated
    // list response doesn't.
    setSelectedRequest(item);
    setIsDetailsModalOpen(true);
    setDetailLoading(true);
    getEncashRequestDetail(item.id)
      .then((detail) => setSelectedRequest(detail))
      .catch((err) => {
        console.warn("Could not fetch encashment request detail:", err);
        toast.error(getApiErrorMessage(err, "Failed to load full request details"));
      })
      .finally(() => setDetailLoading(false));
  };

  const fetchRequests = (page: number) => {
    setLoading(true);
    getEncashRequests(page, pageSize)
      .then(({ items, pagination: meta, counts: statusCounts }) => {
        setRequests(items);
        setPagination(meta);
        if (statusCounts) setCounts(statusCounts);
      })
      .catch((err) => {
        console.warn("Could not fetch encash requests:", err);
        toast.error("Failed to load encashment requests");
        setRequests([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleStatusSelect = (item: EncashRequest, action: StatusAction) => {
    if (action === "cancelled") {
      // "Cancelled" is the Lockated (superadmin) reject gate — reason required,
      // reuses this same dialog; handleConfirmCancel calls lockated_reject.
      setCancelDialog({ open: true, request: item, reason: "" });
      return;
    }
    if (action === "successful") {
      // "Successful" is the Lockated (superadmin) approve gate — the admin
      // enters the bank UTR number in the popup, then lockated_approve is
      // called with it.
      setApproveDialog({ open: true, request: item, utr: "" });
      return;
    }

    // "Processing" needs no extra input — fire immediately.
    setUpdatingId(item.id);
    startProcessingEncashRequest(item.id)
      .then(() => {
        toast.success("Request moved to processing");
        fetchRequests(currentPage);
      })
      .catch((err) => {
        console.warn("Could not start processing request:", err);
        toast.error(getApiErrorMessage(err, "Failed to update request status"));
      })
      .finally(() => setUpdatingId(null));
  };

  const handleConfirmApprove = async () => {
    if (!approveDialog.request) return;
    if (!approveDialog.utr.trim()) {
      toast.error("Please enter the bank UTR number");
      return;
    }
    const id = approveDialog.request.id;
    setUpdatingId(id);
    try {
      await lockatedApproveEncashRequest(id, approveDialog.utr.trim());
      toast.success("Request approved");
      setApproveDialog({ open: false, request: null, utr: "" });
      fetchRequests(currentPage);
    } catch (err) {
      console.warn("Could not approve request:", err);
      toast.error(getApiErrorMessage(err, "Failed to approve request"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelDialog.request) return;
    if (!cancelDialog.reason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }
    const id = cancelDialog.request.id;
    setUpdatingId(id);
    try {
      await lockatedRejectEncashRequest(id, cancelDialog.reason.trim());
      toast.success("Request rejected");
      setCancelDialog({ open: false, request: null, reason: "" });
      fetchRequests(currentPage);
    } catch (err) {
      console.warn("Could not reject request:", err);
      toast.error(getApiErrorMessage(err, "Failed to reject request"));
    } finally {
      setUpdatingId(null);
    }
  };

  const renderRequestCell = (item: EncashRequest, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <Button variant="ghost" size="sm" onClick={() => handleViewRequest(item)} title="View Details">
            <Eye className="w-4 h-4 text-gray-700" />
          </Button>
        );
      case "request_reference":
        return <span className="font-medium text-[#1A1A1A]">{item.request_reference || "-"}</span>;
      case "person_name":
        return (
          <div>
            <div className="text-[#1A1A1A] text-sm">{item.person_name || "-"}</div>
            <div className="text-xs text-gray-500">User #{item.user_id}</div>
          </div>
        );
      case "bank":
        return (
          <div className="text-sm">
            <div className="text-[#1A1A1A]">{item.bank_name || "-"}</div>
            <div className="text-xs text-gray-500">
              {item.account_number} · {item.ifsc_code}
            </div>
          </div>
        );
      case "branch_name":
        return <span className="text-sm text-gray-600">{item.branch_name || "-"}</span>;
      case "points_to_encash":
        return <span>{item.points_to_encash}</span>;
      case "processing_fee_percent":
        return <span>{item.processing_fee_percent}%</span>;
      case "amount_payable":
        return <span className="font-semibold text-[#1A1A1A]">₹{item.amount_payable}</span>;
      case "status": {
        // This page's actions (lockated_approve/lockated_reject) mutate
        // `lockated_status`, not `status` — so that's the field shown/tracked
        // here, falling back to `status` for older records that predate it.
        const displayStatus = item.lockated_status || item.status;
        // Once a request is resolved (approved/rejected), it's final — the
        // dropdown is disabled/grayed out so the status can't be changed again.
        const isLocked = statusVariant(displayStatus) !== "pending";
        const isDisabled = updatingId === item.id || isLocked;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isDisabled}>
              <button
                type="button"
                className="inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isDisabled}
              >
                <StatusBadge status={statusVariant(displayStatus)} className="flex items-center gap-1.5">
                  {displayStatus}
                  {updatingId === item.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isLocked ? null : (
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
      }
      case "requested_at":
        return <span className="whitespace-nowrap">{formatDateTime(item.requested_at)}</span>;
      case "resolution":
        return (
          <span className="whitespace-nowrap">
            {item.completed_at
              ? formatDateTime(item.completed_at)
              : item.cancelled_at
              ? formatDateTime(item.cancelled_at)
              : item.expected_credit_date
              ? `Expected ${item.expected_credit_date}`
              : "-"}
          </span>
        );
      default:
        return "-";
    }
  };

  // The API's `counts` covers every page, not just the current 10 rows — used
  // whenever present; falls back to a page-only tally (bucketed the same way
  // the status badge is, off `lockated_status`/`status`) if it's ever absent.
  const pendingCount =
    counts?.pending ?? requests.filter((r) => statusVariant(r.lockated_status || r.status) === "pending").length;
  const successfulCount =
    counts?.successful ?? requests.filter((r) => statusVariant(r.lockated_status || r.status) === "accepted").length;
  const cancelledCount =
    counts?.cancelled ?? requests.filter((r) => statusVariant(r.lockated_status || r.status) === "rejected").length;
  const totalCount = counts?.total ?? pagination.total_count;

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">Encashment Requests</h1>
      </div>

      {/* Stats Cards (across all pages) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Requests", value: totalCount, icon: Wallet },
          { label: "Pending", value: pendingCount, icon: Clock },
          { label: "Successful", value: successfulCount, icon: CheckCircle2 },
          { label: "Cancelled", value: cancelledCount, icon: XCircle },
        ].map((item, i) => {
          const IconComponent = item.icon;
          return (
            <div
              key={i}
              className="bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-[#C72030]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#1A1A1A]">{item.value}</div>
                <div className="text-sm font-medium text-[#1A1A1A]">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Encashment Requests Table */}
      <div className="overflow-x-auto animate-fade-in">
        <EnhancedTable
          data={requests}
          columns={requestColumns}
          renderCell={renderRequestCell}
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
          storageKey="encashment-requests-table"
          className="transition-all duration-500 ease-in-out"
          loading={loading}
          loadingMessage="Loading encashment requests..."
          emptyMessage="No encashment requests found"
        />
      </div>

      {/* Request Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#F6F4EE] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#C72030]" />
              Request Details
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="p-6 bg-white space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                  {selectedRequest.request_reference}
                  {detailLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                </span>
                <StatusBadge status={statusVariant(selectedRequest.lockated_status || selectedRequest.status)}>
                  {selectedRequest.lockated_status || selectedRequest.status}
                </StatusBadge>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <DetailField label="Requested By" value={selectedRequest.person_name} />
                <DetailField label="User ID" value={String(selectedRequest.user_id)} />
                <DetailField label="Bank Name" value={selectedRequest.bank_name} />
                <DetailField label="Branch Name" value={selectedRequest.branch_name} />
                <DetailField label="Account Number" value={selectedRequest.account_number} />
                <DetailField label="IFSC Code" value={selectedRequest.ifsc_code} />
                <DetailField label="Points to Encash" value={String(selectedRequest.points_to_encash)} />
                <DetailField label="Processing Fee" value={`${selectedRequest.processing_fee_percent}%`} />
                <DetailField label="Facilitation Fee" value={`₹${selectedRequest.facilitation_fee}`} />
                <DetailField label="Amount Payable" value={`₹${selectedRequest.amount_payable}`} />
                <DetailField label="Expected Credit Date" value={selectedRequest.expected_credit_date} />
                <DetailField label="UTR Number" value={selectedRequest.utr_number} />
                <DetailField
                  label="Terms Accepted"
                  value={selectedRequest.terms_accepted ? "Yes" : "No"}
                />
                <DetailField label="Requested On" value={formatDateTime(selectedRequest.requested_at)} />
                <DetailField
                  label="Processing Started"
                  value={formatDateTime(selectedRequest.processing_started_at)}
                />
                <DetailField label="Completed On" value={formatDateTime(selectedRequest.completed_at)} />
                <DetailField label="Cancelled On" value={formatDateTime(selectedRequest.cancelled_at)} />
                {selectedRequest.cancelled_reason && (
                  <div className="col-span-2">
                    <DetailField label="Cancellation Reason" value={selectedRequest.cancelled_reason} />
                  </div>
                )}
              </div>

              <ChequeImages urls={selectedRequest.cancelled_cheque_urls} />
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

      {/* Cancellation Reason Modal */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#F6F4EE] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[#C72030]" />
              Cancel Request
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 bg-white space-y-2">
            {cancelDialog.request && (
              <p className="text-sm text-gray-600">
                Cancelling <span className="font-medium text-[#1A1A1A]">{cancelDialog.request.request_reference}</span>
              </p>
            )}
            <Label className="text-xs font-semibold text-[#1A1A1A]">Cancellation Reason</Label>
            <Textarea
              className="min-h-[90px] text-sm border-[#D5DbDB] bg-white"
              placeholder="Enter the reason for rejecting this request"
              value={cancelDialog.reason}
              onChange={(e) => setCancelDialog((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </div>

          <DialogFooter className="bg-[#F6F4EE] px-6 py-3 border-t border-[#D5DbDB] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, request: null, reason: "" })}
              className="border-[#D5DbDB] text-[#1A1A1A] hover:bg-[#DBC2A9]"
            >
              Close
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={updatingId === cancelDialog.request?.id}
              variant="ghost"
              className="btn-primary"
            >
              {updatingId === cancelDialog.request?.id && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Successful (Approve) Modal */}
      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) => setApproveDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#F6F4EE] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#C72030]" />
              Mark as Successful
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 bg-white space-y-2">
            {approveDialog.request && (
              <p className="text-sm text-gray-600">
                Marking{" "}
                <span className="font-medium text-[#1A1A1A]">
                  {approveDialog.request.request_reference}
                </span>{" "}
                as paid
              </p>
            )}
            <Label className="text-xs font-semibold text-[#1A1A1A]">Bank UTR Number</Label>
            <Input
              className="h-9 text-sm border-[#D5DbDB] bg-white"
              placeholder="Enter the bank UTR / transaction number"
              value={approveDialog.utr}
              onChange={(e) => setApproveDialog((prev) => ({ ...prev, utr: e.target.value }))}
            />
          </div>

          <DialogFooter className="bg-[#F6F4EE] px-6 py-3 border-t border-[#D5DbDB] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setApproveDialog({ open: false, request: null, utr: "" })}
              className="border-[#D5DbDB] text-[#1A1A1A] hover:bg-[#DBC2A9]"
            >
              Close
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={updatingId === approveDialog.request?.id}
              variant="ghost"
              className="btn-primary"
            >
              {updatingId === approveDialog.request?.id && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EncashmentRequestsPage;
