import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  TextField,
} from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { API_CONFIG } from "@/config/apiConfig";
import { ArrowLeft, Ban, Clock, Download, Printer, FileText, Receipt, Wallet, X } from "lucide-react";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
import { useAccountingEvents } from '@/components/PostHogAccountingEvents';

import { Switch } from "@/components/ui/switch";
interface BillCharge {
  id: number;
  name: string;
  charge_type?: string;
  total_amount: number;
}

interface Payment {
  id: number;
  amount: string;
  method: string;
  transaction_id: string;
  date: string;
  sap_response?: unknown[];
}

interface BillActions {
  show_actions?: boolean;
  can_publish?: boolean;
  can_receive_payment?: boolean;
  receipt_url?: string;
  can_download_invoice?: boolean;
  can_cancel?: boolean;
}

interface LockAccountBillDetail {
  id: number;
  bill_number: string;
  status: string;
  publish: boolean;
  raise_to_builder?: boolean;
  ledger_name?: string;
  lock_account_ledger?: { name?: string };
  due_date: string;
  bill_period?: string;
  note?: string;
  total_amount: number;
  balance_amount?: number;
  paid_amount?: number;
  balance_due?: number;
  total_receivable_amount?: number;
  charges?: BillCharge[];
  lock_account_bill_charges?: BillCharge[];
  payments?: Payment[];
  bill_actions?: BillActions;
  // Late fee keys — the backend calculates all of these; never add them together here.
  principal_amount?: number;
  principal_paid?: number;
  principal_balance_due?: number;
  late_fee_payable_total?: number;
  total_payable_with_late_fees?: number;
  overdue_charges?: OverdueCharge[];
  previous_late_fees?: PreviousLateFee[];
  previous_late_fee_total?: number;
  late_fee_carried_forward_to?: BillRef | null;
}

interface BillRef {
  lock_account_bill_id: number;
  bill_number: string | null;
}

/** A late fee posted on this invoice. */
interface OverdueCharge {
  id: number;
  name: string;
  period_start?: string | null;
  period_end?: string | null;
  amount?: number;
  tax_amount?: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  /** null on a reversed fee. */
  payment_status?: string | null;
  status?: string;
  reverse_reason?: string | null;
  /** Set when the fee is payable on a newer invoice of the flat. */
  carried_to?: BillRef | null;
}

/** An unpaid late fee of an older invoice, payable on this (latest) invoice. Has no `id`. */
interface PreviousLateFee {
  overdue_charge_id: number;
  lock_account_bill_id: number;
  bill_number: string | null;
  name: string;
  period_start?: string | null;
  period_end?: string | null;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
}

/** Preview from GET /lock_account_bills/:id/overdue_charges.json — not saved, never part of a total. */
interface PendingCharge {
  name: string;
  period_start?: string | null;
  total_amount?: number | null;
}

/** The fee being waived: the invoice it belongs to and its overdue charge id. */
interface WaiveTarget {
  invoiceId: number | string;
  overdueChargeId: number;
  label: string;
}

// Theme status pills — theme.css restyles these legacy bg/border pairs into soft tinted pills.
const LATE_FEE_STATUS_CLASS: Record<string, string> = {
  Pending: "bg-[#F2EBC9] border-[#F2EBC9]",
  "Part Payment": "bg-[#DBE7FF] border-[#DBE7FF]",
  Paid: "bg-[#C7EDDA] border-[#C7EDDA]",
};

const money = (value: unknown) => (Number(value) || 0).toFixed(2);

const formatLateFeePeriod = (start?: string | null, end?: string | null): string => {
  if (start && end) return start === end ? formatDateDMY(start) : `${formatDateDMY(start)} – ${formatDateDMY(end)}`;
  return formatDateDMY(start || end);
};

// order_number for bill_payment — the backend uses it to drop duplicate submits.
const newRequestId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const apiErrors = (error: unknown): string[] => {
  const errors = axios.isAxiosError(error) ? error.response?.data?.errors : undefined;
  if (Array.isArray(errors)) return errors.filter((m): m is string => typeof m === "string");
  return typeof errors === "string" ? [errors] : [];
};

// "2026-09-18" -> "18/09/2026"
const formatDateDMY = (value?: string | null): string => {
  if (!value) return "-";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const numberToWords = (num: number): string => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = [
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  if (num === 0) return "Zero";

  const convertHundreds = (n: number): string => {
    let str = "";
    if (n >= 100) {
      str += `${ones[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }
    if (n >= 20) {
      str += `${tens[Math.floor(n / 10)]} `;
      n %= 10;
    } else if (n >= 10) {
      str += `${teens[n - 10]} `;
      return str;
    }
    if (n > 0) str += `${ones[n]} `;
    return str;
  };

  let n = Math.floor(num);
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  let result = "";
  if (crore > 0) result += `${convertHundreds(crore)}Crore `;
  if (lakh > 0) result += `${convertHundreds(lakh)}Lakh `;
  if (thousand > 0) result += `${convertHundreds(thousand)}Thousand `;
  if (hundred > 0) result += convertHundreds(hundred);
  return result.trim();
};

const InvoiceLink: React.FC<{ target: BillRef }> = ({ target }) => (
  <Link
    to={`/accounting/invoices/${target.lock_account_bill_id}`}
    className="font-medium text-[#C72030] hover:underline"
  >
    {target.bill_number || `#${target.lock_account_bill_id}`}
  </Link>
);

const LateFeeStatusPill: React.FC<{ status?: string | null }> = ({ status }) =>
  status ? (
    <span className={`inline-flex items-center whitespace-nowrap border ${LATE_FEE_STATUS_CLASS[status] ?? ""}`}>
      {status}
    </span>
  ) : (
    <span className="text-gray-400">-</span>
  );

const WaiveButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    size="sm"
    variant="ghost"
    onClick={onClick}
    title="Waive late fee"
    aria-label="Waive late fee"
    className="h-8 gap-1.5 whitespace-nowrap px-2 text-xs font-medium !text-[#C72030] hover:!bg-[#C72030]/10 hover:!text-[#A01020] [&_svg]:!text-[#C72030]"
  >
    <Ban className="h-4 w-4" />
    Waive
  </Button>
);

const AccountingInvoiceDetails: React.FC = () => {
  const { onAccountingViewed } = useAccountingEvents();
  useEffect(() => {
    onAccountingViewed({ accounting_id: 'invoice_details', screen_name: 'AccountingInvoiceDetails' });
  }, [onAccountingViewed]);

  const { shouldShow } = useDynamicPermissions();
  const { id } = useParams();
  const navigate = useNavigate();
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [bill, setBill] = useState<LockAccountBillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fetchBill = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const url = `${baseUrl}/lock_account_bills/${id}.json?lock_account_id=${lockAccountId}`;
      const response = await axios.get(url, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      setBill(response.data?.lock_account_bill || response.data);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      toast.error("Failed to load invoice details");
      setBill(null);
    } finally {
      setLoading(false);
    }
  }, [id, lockAccountId]);

  useEffect(() => {
    fetchBill();
  }, [fetchBill]);

  // Optional "upcoming late fee" hint — only pending_charges is used from this API, never in a total.
  const [pendingCharges, setPendingCharges] = useState<PendingCharge[]>([]);

  const fetchPendingCharges = useCallback(async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/lock_account_bills/${id}/overdue_charges.json`, {
        params: { lock_account_id: lockAccountId },
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const list = response.data?.pending_charges;
      setPendingCharges(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching upcoming late fees:", error);
      setPendingCharges([]);
    }
  }, [id, lockAccountId]);

  useEffect(() => {
    fetchPendingCharges();
  }, [fetchPendingCharges]);

  const reloadInvoice = () => {
    fetchBill();
    fetchPendingCharges();
  };

  const [waiveTarget, setWaiveTarget] = useState<WaiveTarget | null>(null);
  const [waiveReason, setWaiveReason] = useState("");
  const [waiving, setWaiving] = useState(false);
  const [confirmWaiveOpen, setConfirmWaiveOpen] = useState(false);

  // Step 1: the reason modal's Waive button — check the reason, then ask for confirmation.
  const requestWaive = () => {
    if (!waiveReason.trim()) {
      toast.error("Please enter a reason for waiving this late fee.");
      return;
    }
    setConfirmWaiveOpen(true);
  };

  const openWaive = (target: WaiveTarget) => {
    setWaiveReason("");
    setWaiveTarget(target);
  };

  // POST /lock_account_bills/:invoiceId/reverse_overdue_charge.json — :invoiceId is the invoice the fee was
  // posted on (the current one for this invoice's fees, the older one for "earlier invoices" rows).
  const handleWaiveLateFee = async () => {
    if (!waiveTarget) return;
    const reason = waiveReason.trim();
    if (!reason) {
      toast.error("Please enter a reason for waiving this late fee.");
      return;
    }
    setWaiving(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.post(
        `${baseUrl}/lock_account_bills/${waiveTarget.invoiceId}/reverse_overdue_charge.json`,
        { overdue_charge_id: waiveTarget.overdueChargeId, reason },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      toast.success("Late fee waived");
      setConfirmWaiveOpen(false);
      setWaiveTarget(null);
      reloadInvoice();
    } catch (error) {
      console.error("Error waiving late fee:", error);
      setConfirmWaiveOpen(false);
      toast.error(apiErrors(error)[0] || "Failed to waive late fee");
    } finally {
      setWaiving(false);
    }
  };

  const charges = bill?.charges || bill?.lock_account_bill_charges || [];
  const payments = bill?.payments || [];
  const overdueCharges = bill?.overdue_charges || [];
  const previousLateFees = bill?.previous_late_fees || [];

  const totalAmount = Number(bill?.total_amount) || 0;
  const totalReceivable = Number(bill?.total_receivable_amount ?? totalAmount);
  const principalAmount = Number(bill?.principal_amount ?? totalAmount) || 0;
  const principalPaid = Number(bill?.principal_paid ?? bill?.paid_amount) || 0;
  const principalBalanceDue = Number(bill?.principal_balance_due ?? bill?.balance_due) || 0;
  const lateFeePayable = Number(bill?.late_fee_payable_total) || 0;
  // The invoice's payable amount and the payment prefill. Already includes every late fee — never add to it.
  const totalPayable = Number(bill?.total_payable_with_late_fees ?? principalBalanceDue) || 0;
  const canReceivePayment = Boolean(bill?.bill_actions?.can_receive_payment);
  const canWaive = shouldShow("Invoices", "update");
  const amountInWords = useMemo(
    () => `${numberToWords(totalAmount)} Rupees Only`,
    [totalAmount]
  );

  const handleToggleRaiseToBuilder = async (checked: boolean) => {
    if (!bill) return;
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.patch(
        `${baseUrl}/lock_account_bills/${id}.json`,
        { lock_account_bill: { raise_to_builder: checked } },
        { headers }
      );

      setBill((prev) =>
        prev ? { ...prev, raise_to_builder: checked } : prev
      );
      toast.success(checked ? "Raised to builder" : "Withdrawn from builder");
    } catch (error) {
      console.error("Error updating raise to builder status:", error);
      toast.error("Failed to update status");
    }
  };

  const handlePublishInvoice = async () => {
    if (!bill) return;
    setPublishing(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.patch(
        `${baseUrl}/lock_account_bills/${id}.json`,
        { lock_account_bill: { publish: true } },
        { headers }
      );

      setBill((prev) =>
        prev
          ? {
              ...prev,
              publish: true,
              bill_actions: prev.bill_actions
                ? { ...prev.bill_actions, can_publish: false }
                : prev.bill_actions,
            }
          : prev
      );
      toast.success("Invoice published successfully");
      // Publishing makes the invoice eligible for late fees — reload the bill and its late fees.
      reloadInvoice();
    } catch (error) {
      console.error("Error publishing invoice:", error);
      toast.error("Failed to publish invoice");
    } finally {
      setPublishing(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_bills/${id}/generate_pdf.pdf`,
        {
          responseType: "blob",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Invoice-${bill?.bill_number || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };
  const handlePrint = () => window.print();

  // GET /lock_account_bills/:id/receipt_pdf?pid=<payment_id> — pid is the
  // specific payment's own id from the Payment Details table below, not the
  // bill id, since a bill can have more than one payment recorded against it.
  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(
        `${baseUrl}/lock_account_bills/${id}/receipt_pdf`,
        {
          params: { pid: paymentId },
          responseType: "blob",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    }
  };

  // One request id per payment: kept across retries after a timeout / network error so the
  // backend can drop the duplicate, and replaced only once a payment went through or was rejected.
  const [orderNumber, setOrderNumber] = useState("");
  const [retryPending, setRetryPending] = useState(false);

  const openPaymentDialog = () => {
    if (!retryPending || !orderNumber) {
      setOrderNumber(newRequestId());
      setPaymentAmount(totalPayable > 0 ? totalPayable.toFixed(2) : "");
    }
    setIsPaymentOpen(true);
  };

  const resetPaymentForm = () => {
    setIsPaymentOpen(false);
    setPaymentDate("");
    setPaymentAmount("");
    setPaymentMode("");
    setTransactionNumber("");
    setPaymentNotes("");
    setOrderNumber("");
    setRetryPending(false);
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Paid amount should be greater than 0.");
      return;
    }
    if (Number(paymentAmount) > totalPayable) {
      toast.error("Amount paid cannot be greater than the total amount.");
      return;
    }
    if (!paymentMode) {
      toast.error("Please select payment mode.");
      return;
    }
    if (!paymentDate) {
      toast.error("Please select payment date.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;

      const requestId = orderNumber || newRequestId();
      if (!orderNumber) setOrderNumber(requestId);
      const response = await axios.post(
        `${baseUrl}/lock_account_bills/${id}/bill_payment.json`,
        {
          lock_payment: {
            paid_amount: Number(paymentAmount),
            payment_method: paymentMode,
            order_number: requestId,
            pg_transaction_id: transactionNumber,
            cheque_date: paymentDate,
            notes: paymentNotes,
          },
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = response.data || {};
      if (data.duplicate_request) {
        toast.success("This payment was already recorded");
      } else {
        toast.success("Payment recorded successfully");
        const applied = Array.isArray(data.late_fees_applied) ? data.late_fees_applied : [];
        applied.forEach((fee: { name?: string; total_amount?: number }) =>
          toast.info(`Late fee ₹${money(fee.total_amount)} was added${fee.name ? ` (${fee.name})` : ""}`)
        );
      }
      resetPaymentForm();
      reloadInvoice();
    } catch (error) {
      console.error("Error recording payment:", error);
      // No response (timeout / network): the payment may have gone through — keep the same
      // order_number so pressing Submit again can't record it twice.
      const noResponse = axios.isAxiosError(error) && !error.response;
      setRetryPending(noResponse);
      if (!noResponse) setOrderNumber(newRequestId());
      toast.error(
        noResponse
          ? "Network error – please submit again; the payment won't be recorded twice."
          : apiErrors(error)[0] || "Failed to record payment"
      );
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600">Loading invoice...</div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600">Invoice not found</div>
      </div>
    );
  }

  const isPaid = bill.status?.toLowerCase() === "paid";
  const isRaisedToBuilder = Boolean(bill.raise_to_builder);
  const isRaiseToBuilderLocked = Boolean(bill.raise_to_builder);
  // const isPartPayment = bill.status?.toLowerCase() === "part payment";

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden">
      <div className="mb-6 no-print">
        <button
          onClick={() => navigate("/accounting/invoices")}
          className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a]">
              Invoice #{bill.bill_number}
            </h1>
            <Badge
              className="text-xs text-white"
              style={{ backgroundColor: isPaid ? "#16a34a" : "#C72030" }}
            >
              {bill.status || "Pending"}
            </Badge>
            {isPaid && lateFeePayable > 0 && (
              <span className="ml-2 inline-flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-[#C7EDDA] px-2 py-0.5 font-medium text-[#1A6B44]">Principal paid</span>
                <span className="rounded-full bg-[#F2EBC9] px-2 py-0.5 font-medium text-[#7A5B00]">
                  Late fees due ₹{money(lateFeePayable)}
                </span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Raise to Builder:</span>
              <Switch checked={!!(isRaisedToBuilder)} onCheckedChange={() => handleToggleRaiseToBuilder(!isRaisedToBuilder)} disabled={isRaiseToBuilderLocked} />
            </div>
            {bill.bill_actions?.can_publish && (
              <Button
                onClick={handlePublishInvoice}
                disabled={publishing}
                size="sm"
                className="bg-[#C72030] px-4 py-2 text-white hover:bg-[#A01020] disabled:opacity-70"
              >
                {publishing ? "Publishing..." : "Publish"}
              </Button>
            )}
            {isPaid && payments.length > 0 && (
              <Button
                onClick={() => handleDownloadReceipt(payments[payments.length - 1].id)}
                size="sm"
                className="!bg-[#C72030] px-4 py-2 !text-white hover:!bg-[#A01020] [&_svg]:!text-white"
              >
                <Download className="mr-2 h-4 w-4" /> Download Receipt
              </Button>
            )}
            <div className="flex flex-wrap gap-2">
              {/* From bill_actions only — stays true on a Paid invoice while late fees are due. */}
              {canReceivePayment && shouldShow("Invoices", "update") && (
                <Button
                  onClick={openPaymentDialog}
                  size="sm"
                  className="bg-[#C72030] px-4 py-2 text-white hover:bg-[#A01020]"
                >
                  Receive Payment
                </Button>
              )}
              {/* <Button
                onClick={() => navigate(`/accounting/invoices/${bill.id}/edit`)}
                size="sm"
                className="bg-[#C72030] px-4 py-2 text-white hover:bg-[#A01020]"
              >
                Edit
              </Button> */}
              {shouldShow("Invoices", "show") && (
                <Button
                  onClick={handleDownloadInvoice}
                  size="sm"
                  className="bg-[#C72030] px-4 py-2 text-white hover:bg-[#A01020]"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Invoice
                </Button>
              )}
              {/* <Button
                onClick={handlePrint}
                size="icon"
                title="Print"
                className="bg-[#C72030] text-white hover:bg-[#A01020]"
              >
                <Printer className="h-4 w-4" />
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Bill Details */}
        <div className="overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white">
          <div className="px-6 pt-[22px]">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "#F5F4F0" }}
              >
                <FileText size={14} color="#1A1A18" />
              </div>
              <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18]">Bill Details</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col">
                <span className="mb-1 text-xs text-gray-600">Bill Number</span>
                <span className="font-medium text-gray-900">{bill.bill_number}</span>
              </div>
              <div className="flex flex-col">
                <span className="mb-1 text-xs text-gray-600">Flat</span>
                <span className="font-medium text-gray-900">
                  {bill.ledger_name || bill.lock_account_ledger?.name || "-"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="mb-1 text-xs text-gray-600">Due Date</span>
                <span className="font-medium text-gray-900">{bill.due_date}</span>
              </div>
              <div className="flex flex-col">
                <span className="mb-1 text-xs text-gray-600">Bill Period</span>
                <span className="font-medium text-gray-900">{bill.bill_period || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charges */}
        <div className="overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white">
          <div className="px-6 pt-[22px]">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "#F5F4F0" }}
              >
                <Receipt size={14} color="#1A1A18" />
              </div>
              <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18]">Charges</h2>
            </div>
          </div>
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-600">
                  <th className="px-6 py-2 font-medium">Particular</th>
                  <th className="px-6 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} className="border-t border-gray-200">
                    <td className="px-6 py-2">{charge.name}</td>
                    <td className="px-6 py-2 text-right">
                      {Number(charge.total_amount || 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-2 text-right font-semibold">Total Amount</td>
                  <td className="px-6 py-2 text-right font-semibold">{totalAmount.toFixed(1)}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-2 text-right font-semibold">Total Receivable Amount</td>
                  <td className="px-6 py-2 text-right font-semibold">
                    {totalReceivable.toFixed(1)}
                  </td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-2 text-right font-semibold">Invoice Amount</td>
                  <td className="px-6 py-2 text-right font-semibold">{money(principalAmount)}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-2 text-right font-semibold">Principal Paid</td>
                  <td className="px-6 py-2 text-right font-semibold">{money(principalPaid)}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-2 text-right font-semibold">Principal Outstanding</td>
                  <td className="px-6 py-2 text-right font-semibold">{money(principalBalanceDue)}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-2 text-right font-semibold">Late Fees Payable</td>
                  <td className="px-6 py-2 text-right font-semibold">{money(lateFeePayable)}</td>
                </tr>
                <tr className="border-t-2 border-gray-300 bg-[#F5F4F0]">
                  <td className="px-6 py-3 text-right text-base font-bold">Total Payable</td>
                  <td className="px-6 py-3 text-right text-base font-bold">₹{money(totalPayable)}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-2 text-right font-semibold" colSpan={2}>
                    Amt. in word: {amountInWords}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {bill.note && (
            <div className="border-t border-gray-200 px-6 py-3 text-sm">
              <span className="font-medium text-gray-700">Notes: </span>
              {bill.note}
            </div>
          )}
        </div>

        {/* Late Fees — every amount comes from GET /lock_account_bills/:id.json as is. */}
        {(overdueCharges.length > 0 || previousLateFees.length > 0 || pendingCharges.length > 0 || bill.late_fee_carried_forward_to) && (
          <div className="overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white">
            <div className="px-6 pt-[22px]">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#F5F4F0" }}
                >
                  <Clock size={14} color="#1A1A18" />
                </div>
                <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18]">Late Fees</h2>
              </div>
            </div>
            <div className="space-y-6 p-5">
              {bill.late_fee_carried_forward_to && (
                <p className="rounded-md border border-[#F2EBC9] bg-[#FBF7E6] px-4 py-2 text-sm text-gray-700">
                  Unpaid late fees of this invoice are payable on invoice{" "}
                  <InvoiceLink target={bill.late_fee_carried_forward_to} />
                </p>
              )}

              {overdueCharges.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="mb-2 text-sm font-semibold text-[#1A1A18]">Late fees on this invoice</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-600">
                        <th className="px-4 py-2 font-medium">Fee</th>
                        <th className="px-4 py-2 font-medium">Period</th>
                        <th className="px-4 py-2 text-right font-medium">Amount</th>
                        <th className="px-4 py-2 text-right font-medium">Paid</th>
                        <th className="px-4 py-2 text-right font-medium">Outstanding</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        {canWaive && <th className="px-4 py-2 font-medium no-print">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {overdueCharges.map((fee) => {
                        const reversed = fee.status === "reversed";
                        const tax = Number(fee.tax_amount) || 0;
                        const period = formatLateFeePeriod(fee.period_start, fee.period_end);
                        const showWaive =
                          canWaive && !reversed && !fee.carried_to && fee.payment_status !== "Paid";
                        return (
                          <tr
                            key={fee.id}
                            className={`border-t border-gray-200 ${reversed ? "text-gray-400" : ""}`}
                          >
                            <td className={`px-4 py-2 ${reversed ? "line-through" : ""}`}>{fee.name}</td>
                            <td className={`px-4 py-2 whitespace-nowrap ${reversed ? "line-through" : ""}`}>{period}</td>
                            <td className={`px-4 py-2 text-right ${reversed ? "line-through" : ""}`}>
                              {money(fee.total_amount)}
                              {tax > 0 && (
                                <span className="block text-[11px] text-gray-400">
                                  {money(fee.amount)} + {money(tax)} tax
                                </span>
                              )}
                            </td>
                            <td className={`px-4 py-2 text-right ${reversed ? "line-through" : ""}`}>{money(fee.paid_amount)}</td>
                            <td className={`px-4 py-2 text-right font-medium ${reversed ? "line-through" : ""}`}>
                              {money(fee.outstanding_amount)}
                            </td>
                            <td className="px-4 py-2">
                              {reversed ? (
                                <span className="text-xs text-gray-500">
                                  Waived{fee.reverse_reason ? ` – ${fee.reverse_reason}` : ""}
                                </span>
                              ) : fee.carried_to ? (
                                <span className="text-xs text-gray-600">
                                  Payable on invoice <InvoiceLink target={fee.carried_to} />
                                </span>
                              ) : (
                                <LateFeeStatusPill status={fee.payment_status} />
                              )}
                            </td>
                            {canWaive && (
                              <td className="px-4 py-2 no-print">
                                {showWaive ? (
                                  <WaiveButton
                                    onClick={() =>
                                      openWaive({
                                        invoiceId: bill.id,
                                        overdueChargeId: fee.id,
                                        label: `${fee.name} (${period}) of ₹${money(fee.outstanding_amount)}`,
                                      })
                                    }
                                  />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {previousLateFees.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="mb-2 text-sm font-semibold text-[#1A1A18]">Late fees from earlier invoices</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-600">
                        <th className="px-4 py-2 font-medium">Invoice</th>
                        <th className="px-4 py-2 font-medium">Fee</th>
                        <th className="px-4 py-2 font-medium">Period</th>
                        <th className="px-4 py-2 text-right font-medium">Amount</th>
                        <th className="px-4 py-2 text-right font-medium">Paid</th>
                        <th className="px-4 py-2 text-right font-medium">Outstanding</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        {canWaive && <th className="px-4 py-2 font-medium no-print">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {previousLateFees.map((fee) => {
                        const period = formatLateFeePeriod(fee.period_start, fee.period_end);
                        return (
                          <tr key={fee.overdue_charge_id} className="border-t border-gray-200">
                            <td className="px-4 py-2">
                              <InvoiceLink target={fee} />
                            </td>
                            <td className="px-4 py-2">{fee.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{period}</td>
                            <td className="px-4 py-2 text-right">{money(fee.total_amount)}</td>
                            <td className="px-4 py-2 text-right">{money(fee.paid_amount)}</td>
                            <td className="px-4 py-2 text-right font-medium">{money(fee.outstanding_amount)}</td>
                            <td className="px-4 py-2">
                              <LateFeeStatusPill status={Number(fee.paid_amount) > 0 ? "Part Payment" : "Pending"} />
                            </td>
                            {canWaive && (
                              <td className="px-4 py-2 no-print">
                                <WaiveButton
                                  onClick={() =>
                                    openWaive({
                                      invoiceId: fee.lock_account_bill_id,
                                      overdueChargeId: fee.overdue_charge_id,
                                      label: `${fee.name} (${period}) of ₹${money(fee.outstanding_amount)}`,
                                    })
                                  }
                                />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-3 flex justify-end border-t border-gray-200 px-4 pt-3 text-sm font-semibold">
                    <span className="mr-6">Earlier late fees total</span>
                    <span>{money(bill.previous_late_fee_total)}</span>
                  </div>
                </div>
              )}

              {pendingCharges.length > 0 && (
                <ul className="space-y-1 text-xs text-gray-400">
                  {pendingCharges.map((fee, idx) => (
                    <li key={`${fee.name}-${fee.period_start ?? idx}`}>
                      {fee.name}: late fee ₹{money(fee.total_amount)} will be added from{" "}
                      {formatDateDMY(fee.period_start)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white">
          <div className="px-6 pt-[22px]">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "#F5F4F0" }}
              >
                <Wallet size={14} color="#1A1A18" />
              </div>
              <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18]">Payment Details</h2>
            </div>
          </div>
          <div className="overflow-x-auto p-5 ">
            <table className="w-full text-sm ">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-600">
                  <th className="px-6 py-2 font-medium">ID</th>
                  <th className="px-6 py-2 font-medium">Date</th>
                  <th className="px-6 py-2 font-medium">Amount</th>
                  <th className="px-6 py-2 font-medium">Payment Mode</th>
                  <th className="px-6 py-2 font-medium">Transaction Number</th>
                  {/* <th className="px-6 py-2 font-medium">Receipt</th> */}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr className="border-t border-gray-200">
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No payments recorded
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-t border-gray-200">
                      <td className="px-6 py-2">{payment.id}</td>
                      <td className="px-6 py-2">{formatDateDMY(payment.date)}</td>
                      <td className="px-6 py-2">{payment.amount}</td>
                      <td className="px-6 py-2">{payment.method}</td>
                      <td className="px-6 py-2">{payment.transaction_id || "-"}</td>
                      {/* Moved to a single "Download Receipt" button next to
                      Raise to Builder at the top, shown once the bill is
                      fully paid, instead of a per-payment download here. */}
                      {/* <td className="px-6 py-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(payment.id)}
                          title="Download Receipt"
                          className="inline-flex items-center gap-1 text-[#C72030] hover:underline"
                        >
                          <Download className="h-4 w-4" /> Receipt
                        </button>
                      </td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isPaymentOpen} modal={false} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Receive Payment</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaymentOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-4">
            <TextField
              label="Total Payable (incl. late fees)"
              value={money(totalPayable)}
              fullWidth
              variant="outlined"
              disabled
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <TextField
              label={<>Amount Paid <span style={{ color: "#000000" }}>*</span></>}
              type="number"
              placeholder="Enter Amount Paid"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              variant="outlined"
              inputProps={{ min: 0, max: totalPayable, step: "0.01" }}
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                Payment Mode <span style={{ color: "#000000" }}>*</span>
              </InputLabel>
              <MuiSelect
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as string)}
                displayEmpty
                label="Payment Mode *"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="">
                  <em>Select Mode</em>
                </MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="neft">NEFT</MenuItem>
                <MenuItem value="card_swipe">Card Swipe</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="rtgs">RTGS</MenuItem>
              </MuiSelect>
            </FormControl>

            <TextField
              label="Cheque/Transaction Number"
              placeholder="Enter Cheque/Transaction Number"
              value={transactionNumber}
              onChange={(e) => setTransactionNumber(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <TextField
              label={<>Payment Date <span style={{ color: "#000000" }}>*</span></>}
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <div>
              <div className="relative">
                <textarea
                  className="peer w-full rounded-md border border-gray-300 p-3 focus:border-[#DA7756] focus:outline-none focus:ring-1 focus:ring-[#DA7756] resize-y"
                  rows={4}
                  value={paymentNotes}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setPaymentNotes(e.target.value);
                  }}
                  placeholder="Write note"
                  maxLength={500}
                />
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-normal text-black/60 peer-focus:text-[#DA7756]">
                  Notes
                </label>
              </div>
              <div className="mt-1 text-right text-xs text-gray-400">{paymentNotes.length}/500</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <Button
              onClick={() => setIsPaymentOpen(false)}
              disabled={submittingPayment}
              className="h-10 w-full px-6 sm:w-auto sm:px-8 !rounded-lg !border !border-black/10 !bg-white !text-black/70 hover:!border-black/30 hover:!text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={submittingPayment}
              className="!rounded-lg bg-[#C72030] hover:bg-[#B8252F] px-8 text-white"
            >
              {submittingPayment ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!waiveTarget} onOpenChange={(open) => !open && !waiving && setWaiveTarget(null)}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0 [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Waive Late Fee</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWaiveTarget(null)}
              disabled={waiving}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4 px-6 py-4">
            <p className="text-sm text-gray-700">{waiveTarget?.label}</p>
            <div>
              <div className="relative">
                <textarea
                  className="peer w-full rounded-md border border-gray-300 p-3 focus:border-[#DA7756] focus:outline-none focus:ring-1 focus:ring-[#DA7756] resize-y"
                  rows={4}
                  value={waiveReason}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setWaiveReason(e.target.value);
                  }}
                  placeholder="Enter Reason"
                  maxLength={500}
                />
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-normal text-black/60 peer-focus:text-[#DA7756]">
                  Reason <span style={{ color: "#000000" }}>*</span>
                </label>
              </div>
              <div className="mt-1 text-right text-xs text-gray-400">{waiveReason.length}/500</div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <Button
              onClick={() => setWaiveTarget(null)}
              disabled={waiving}
              className="h-10 px-6 !rounded-lg !border !border-black/10 !bg-white !text-black/70 hover:!border-black/30 hover:!text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={requestWaive}
              disabled={waiving || !waiveReason.trim()}
              className="!rounded-lg bg-[#C72030] hover:bg-[#B8252F] px-8 text-white"
            >
              Waive
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation popup before the waive request is sent. */}
      <Dialog open={confirmWaiveOpen} onOpenChange={(open) => !open && !waiving && setConfirmWaiveOpen(false)}>
        <DialogContent className="sm:max-w-sm overflow-hidden p-0 [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Confirm Waive</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmWaiveOpen(false)}
              disabled={waiving}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 px-6 py-4 text-sm text-gray-700">
            <p>
              Are you sure you want to waive <span className="font-medium">{waiveTarget?.label}</span>?
            </p>
            <p className="text-xs text-gray-500">This cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <Button
              onClick={() => setConfirmWaiveOpen(false)}
              disabled={waiving}
              className="h-10 px-6 !rounded-lg !border !border-black/10 !bg-white !text-black/70 hover:!border-black/30 hover:!text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWaiveLateFee}
              disabled={waiving}
              className="!rounded-lg bg-[#C72030] hover:bg-[#B8252F] px-8 text-white"
            >
              {waiving ? "Waiving..." : "Yes, Waive"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AccountingInvoiceDetails;
