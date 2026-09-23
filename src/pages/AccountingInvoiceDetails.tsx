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
import { ArrowLeft, Download, Printer, FileText, Receipt, Wallet, X } from "lucide-react";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

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
  total_receivable_amount?: number;
  charges?: BillCharge[];
  lock_account_bill_charges?: BillCharge[];
  payments?: Payment[];
}

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

  const charges = bill?.charges || bill?.lock_account_bill_charges || [];
  const payments = bill?.payments || [];

  const totalAmount = Number(bill?.total_amount) || 0;
  const balanceAmount = Number(bill?.balance_amount) || 0;
  const totalReceivable = Number(bill?.total_receivable_amount ?? totalAmount);
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

      setBill((prev) => (prev ? { ...prev, publish: true } : prev));
      toast.success("Invoice published successfully");
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
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
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
              <button
                type="button"
                onClick={() => handleToggleRaiseToBuilder(!isRaisedToBuilder)}
                disabled={isRaiseToBuilderLocked}
                aria-pressed={isRaisedToBuilder}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${isRaisedToBuilder ? "bg-brand" : "bg-gray-300"
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRaisedToBuilder ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
            {!bill.publish && (
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
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-3" style={{ backgroundColor: "#F6F4EE" }}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <FileText size={16} color="var(--color-primary,#da7756)" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">Bill Details</h2>
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
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-3" style={{ backgroundColor: "#F6F4EE" }}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <Receipt size={16} color="var(--color-primary,#da7756)" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">Charges</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
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

        {/* Payment Details */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-3" style={{ backgroundColor: "#F6F4EE" }}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <Wallet size={16} color="var(--color-primary,#da7756)" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">Payment Details</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                      <td className="px-6 py-2">{payment.transaction_id}</td>
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
              value={totalAmount.toFixed(1)}
              fullWidth
              variant="outlined"
              disabled
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <TextField
              label={<>Amount Paid <span style={{ color: "#C72030" }}>*</span></>}
              type="number"
              placeholder="Enter Amount Paid"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              variant="outlined"
              inputProps={{ min: 0 }}
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                Payment Mode <span style={{ color: "#C72030" }}>*</span>
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
              label={<>Payment Date <span style={{ color: "#C72030" }}>*</span></>}
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

          <div className="flex justify-center gap-3 border-t border-gray-200 px-6 py-4">
            <Button
              onClick={handleRecordPayment}
              disabled={submittingPayment}
              className="bg-[#C72030] hover:bg-[#B8252F] px-8 text-white"
            >
              {submittingPayment ? "Submitting..." : "Submit"}
            </Button>
            <Button
              onClick={() => setIsPaymentOpen(false)}
              disabled={submittingPayment}
              className="h-10 w-full !border !border-[#da7756] !bg-white px-6 !text-[#da7756] sm:w-auto sm:px-8"
            >
              Cancel
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
