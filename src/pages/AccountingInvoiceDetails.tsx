import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ArrowLeft, Clock, Download, Printer, FileText, Receipt, Wallet, X } from "lucide-react";
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
}

type LateFeeStatus = "pending" | "part_payment" | "paid" | "reversed";

interface LateFeeRow {
  id: number | string;
  chargeName: string;
  period: string;
  amount: number;
  gst: number;
  total: number;
  paid: number;
  due: number;
  status: LateFeeStatus;
  /** false for pending_charges — calculated by the API but not posted to the invoice yet (no id to waive). */
  applied: boolean;
}

// Theme status pills — theme.css restyles these legacy bg/border pairs into soft tinted pills.
const LATE_FEE_STATUS: Record<LateFeeStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-[#F2EBC9] border-[#F2EBC9]" },
  part_payment: { label: "Part Payment", className: "bg-[#DBE7FF] border-[#DBE7FF]" },
  paid: { label: "Paid", className: "bg-[#C7EDDA] border-[#C7EDDA]" },
  reversed: { label: "Reversed", className: "bg-[#D5DbDB] border-[#D5DbDB]" },
};

const toNumber = (...values: unknown[]): number => {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return 0;
};

// "Part Payment" / "part_payment" / "partially_paid" -> "part_payment"
const normalizeLateFeeStatus = (value: unknown, due: number, paid: number): LateFeeStatus => {
  const s = String(value ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  if (s.includes("revers") || s.includes("waive") || s.includes("cancel")) return "reversed";
  if (s.includes("part")) return "part_payment";
  if (s === "paid") return "paid";
  if (s.includes("pend") || s.includes("unpaid") || s.includes("due")) return "pending";
  // No usable status from the API — derive it from the amounts.
  if (due <= 0 && paid > 0) return "paid";
  if (paid > 0) return "part_payment";
  return "pending";
};

const formatLateFeePeriod = (item: Record<string, unknown>): string => {
  const label = item.period ?? item.period_label ?? item.bill_period;
  if (label) return String(label);
  const from = (item.period_start ?? item.period_from ?? item.from_date ?? item.start_date) as string | undefined;
  const to = (item.period_end ?? item.period_to ?? item.to_date ?? item.end_date) as string | undefined;
  if (from && to) return from === to ? formatDateDMY(from) : `${formatDateDMY(from)} – ${formatDateDMY(to)}`;
  return from || to ? formatDateDMY(from || to) : "-";
};

const toLateFeeRow = (item: Record<string, unknown>, applied: boolean, idx: number): LateFeeRow => {
  // Pending rows carry no amount (base_amount is null), so amount comes first.
  const amount = toNumber(item.amount, item.overdue_amount, item.base_amount);
  const gst = toNumber(item.tax_amount, item.gst_amount, item.gst);
  const total = toNumber(item.total_amount, item.total, amount + gst);
  const paid = toNumber(item.paid_amount, item.paid);
  const due = toNumber(item.due_amount, item.balance_amount, item.due, total - paid);
  return {
    id: (item.id as number | string) ?? `pending-${item.charge_setup_id ?? ""}-${item.period_start ?? idx}`,
    chargeName: String(item.name ?? item.charge_name ?? item.charge_setup_name ?? "Late Fee"),
    period: formatLateFeePeriod(item),
    amount,
    gst,
    total,
    paid,
    due,
    status: normalizeLateFeeStatus(item.status, due, paid),
    applied,
  };
};

// GET /lock_account_bills/:id/overdue_charges.json →
//   overdue_charges: late fees already posted to the invoice
//   pending_charges: late fees calculated as of today but not posted yet
//   total_outstanding: principal + posted late fees; skipped: [{ reason }]
const normalizeLateFees = (
  data: unknown
): { rows: LateFeeRow[]; totalDue: number | null; skippedReasons: string[] } => {
  const obj = (data ?? {}) as Record<string, unknown>;
  const asList = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
  const rows = [
    ...asList(obj.overdue_charges).map((item, idx) => toLateFeeRow(item, true, idx)),
    ...asList(obj.pending_charges).map((item, idx) => toLateFeeRow(item, false, idx)),
  ];
  // total_outstanding only covers posted fees — add the pending ones so the line includes every late fee shown.
  const pendingDue = rows.filter((r) => !r.applied).reduce((sum, r) => sum + r.due, 0);
  const rawTotal = obj.total_outstanding != null ? toNumber(obj.total_outstanding) + pendingDue : obj.total_due;
  const skippedReasons = (Array.isArray(obj.skipped) ? obj.skipped : [])
    .map((s) => (typeof s === "string" ? s : (s as Record<string, unknown>)?.reason))
    .filter((r): r is string => typeof r === "string" && r.trim() !== "");
  return {
    rows,
    totalDue: rawTotal != null && Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : null,
    skippedReasons,
  };
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

  const [lateFees, setLateFees] = useState<LateFeeRow[]>([]);
  const [lateFeesTotalDue, setLateFeesTotalDue] = useState<number | null>(null);
  const [lateFeesLoading, setLateFeesLoading] = useState(true);
  const [lateFeeSkippedReasons, setLateFeeSkippedReasons] = useState<string[]>([]);
  const [waivingId, setWaivingId] = useState<number | string | null>(null);

  const fetchLateFees = useCallback(async () => {
    setLateFeesLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/lock_account_bills/${id}/overdue_charges.json`, {
        params: { lock_account_id: lockAccountId },
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const { rows, totalDue, skippedReasons } = normalizeLateFees(response.data);
      setLateFees(rows);
      setLateFeesTotalDue(totalDue);
      setLateFeeSkippedReasons(skippedReasons);
    } catch (error) {
      console.error("Error fetching late fees:", error);
      setLateFees([]);
      setLateFeesTotalDue(null);
      setLateFeeSkippedReasons([]);
    } finally {
      setLateFeesLoading(false);
    }
  }, [id, lockAccountId]);

  useEffect(() => {
    fetchLateFees();
  }, [fetchLateFees]);

  // ASSUMED endpoint — the late fee spec doesn't name the waive API yet.
  const handleWaiveLateFee = async (row: LateFeeRow) => {
    if (!window.confirm(`Waive ${row.chargeName} (${row.period}) of ₹${row.due.toFixed(2)}?`)) return;
    setWaivingId(row.id);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.post(
        `${baseUrl}/lock_account_bills/${id}/overdue_charges/${row.id}/waive.json`,
        {},
        {
          params: { lock_account_id: lockAccountId },
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );
      toast.success("Late fee waived");
      fetchLateFees();
      fetchBill();
    } catch (error) {
      console.error("Error waiving late fee:", error);
      toast.error("Failed to waive late fee");
    } finally {
      setWaivingId(null);
    }
  };

  const charges = bill?.charges || bill?.lock_account_bill_charges || [];
  const payments = bill?.payments || [];

  const totalAmount = Number(bill?.total_amount) || 0;
  const balanceAmount = Number(bill?.balance_amount) || 0;
  const hasPaidAmount = bill?.paid_amount !== undefined && bill?.paid_amount !== null;
  const paidAmount = Number(bill?.paid_amount) || 0;
  const hasBalanceDue = bill?.balance_due !== undefined && bill?.balance_due !== null;
  const balanceDue = Number(bill?.balance_due) || 0;
  const totalReceivable = Number(bill?.total_receivable_amount ?? totalAmount);
  // Amount pre-filled/validated in the Receive Payment modal — prefer the
  // outstanding balance due over the full bill total when the API provides it.
  const payableAmount = hasBalanceDue ? balanceDue : totalAmount;
  // Prefer the API's own total; otherwise invoice balance due + outstanding (non-reversed) late fees.
  const lateFeesDue = lateFees.reduce((sum, row) => (row.status === "reversed" ? sum : sum + row.due), 0);
  const totalDueInclLateFee = lateFeesTotalDue ?? payableAmount + lateFeesDue;
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
      fetchBill();
      fetchLateFees();
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

  const handleRecordPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Paid amount should be greater than 0.");
      return;
    }
    if (Number(paymentAmount) > payableAmount) {
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

      await axios.post(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_bills/${id}/bill_payment.json`,
        {
          lock_payment: {
            total_amount: Number(paymentAmount),
            payment_method: paymentMode,
            pg_transaction_id: transactionNumber,
            cheque_date: paymentDate,
            notes: paymentNotes,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      toast.success("Payment recorded successfully");
      setIsPaymentOpen(false);
      setPaymentDate("");
      setPaymentAmount("");
      setPaymentMode("");
      setTransactionNumber("");
      setPaymentNotes("");
      fetchBill();
      fetchLateFees();
    } catch (error) {
      console.error("Error recording payment:", error);
      const responseData = axios.isAxiosError(error) ? error.response?.data : undefined;
      const errors = responseData?.errors;
      const apiError = Array.isArray(errors)
        ? errors.filter((message): message is string => typeof message === "string").join(" ")
        : typeof errors === "string"
          ? errors
          : undefined;
      toast.error(apiError || "Failed to record payment");
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
                variant="outline"
                // className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10"
                 className="bg-[#C72030] px-4 py-2 text-white hover:bg-[#A01020]"
              >
                <Download className="mr-2 h-4 w-4" /> Download Receipt
              </Button>
            )}
            <div className="flex flex-wrap gap-2">
              {!isPaid && shouldShow("Invoices", "update") && (
                <Button
                  onClick={() => setIsPaymentOpen(true)}
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
                  <td className="px-6 py-2 text-right font-semibold">Balance Amount</td>
                  <td className="px-6 py-2 text-right font-semibold">{balanceAmount.toFixed(1)}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-2 text-right font-semibold">Total Receivable Amount</td>
                  <td className="px-6 py-2 text-right font-semibold">
                    {totalReceivable.toFixed(1)}
                  </td>
                </tr>
                {hasPaidAmount && (
                  <tr className="border-t border-gray-200">
                    <td className="px-6 py-2 text-right font-semibold">Paid Amount</td>
                    <td className="px-6 py-2 text-right font-semibold">
                      {paidAmount.toFixed(1)}
                    </td>
                  </tr>
                )}
                {hasBalanceDue && (
                  <tr className="border-t border-gray-200">
                    <td className="px-6 py-2 text-right font-semibold">Balance Due</td>
                    <td className="px-6 py-2 text-right font-semibold">
                      {balanceDue.toFixed(1)}
                    </td>
                  </tr>
                )}
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

        {/* Late Fees */}
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
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-600">
                  <th className="px-4 py-2 font-medium">Charge</th>
                  <th className="px-4 py-2 font-medium">Period</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                  <th className="px-4 py-2 text-right font-medium">GST</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                  <th className="px-4 py-2 text-right font-medium">Paid</th>
                  <th className="px-4 py-2 text-right font-medium">Due</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {lateFeesLoading ? (
                  <tr className="border-t border-gray-200">
                    <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                      Loading late fees...
                    </td>
                  </tr>
                ) : lateFees.length === 0 ? (
                  <tr className="border-t border-gray-200">
                    <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                      No late fees on this invoice
                    </td>
                  </tr>
                ) : (
                  lateFees.map((row) => {
                    const status = LATE_FEE_STATUS[row.status];
                    const canWaive =
                      row.applied &&
                      row.status !== "paid" &&
                      row.status !== "reversed" &&
                      row.due > 0 &&
                      shouldShow("Invoices", "update");
                    return (
                      <tr key={row.id} className="border-t border-gray-200">
                        <td className="px-4 py-2">{row.chargeName}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{row.period}</td>
                        <td className="px-4 py-2 text-right">{row.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{row.gst.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{row.total.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{row.paid.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-medium">{row.due.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center whitespace-nowrap border ${status.className}`}>
                            {status.label}
                          </span>
                          {!row.applied && (
                            <span className="mt-1 block text-[11px] text-gray-400">not posted yet</span>
                          )}
                        </td>
                        <td className="px-4 py-2 no-print">
                          {canWaive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={waivingId === row.id}
                              onClick={() => handleWaiveLateFee(row)}
                              className="h-7 border-[#C72030] px-3 text-xs text-[#C72030] hover:bg-[#C72030]/10"
                            >
                              {waivingId === row.id ? "Waiving..." : "Waive"}
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {!lateFeesLoading && lateFeeSkippedReasons.length > 0 && (
              <p className="mt-3 rounded-md bg-[#F5F4F0] px-4 py-2 text-xs text-gray-600">
                Late fee not applied: {lateFeeSkippedReasons.join("; ")}
              </p>
            )}
            <div className="mt-3 flex justify-end border-t border-gray-200 px-4 pt-3 text-sm font-semibold">
              <span className="mr-6">Total Due (incl. late fee)</span>
              <span>{totalDueInclLateFee.toFixed(2)}</span>
            </div>
          </div>
        </div>

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
              label="Total Amount"
              value={payableAmount.toFixed(1)}
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
              inputProps={{ min: 0, max: payableAmount, step: "0.01" }}
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

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AccountingInvoiceDetails;
