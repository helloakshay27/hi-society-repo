import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { API_CONFIG } from "@/config/apiConfig";
import { ArrowLeft, Download, Printer, FileText, Receipt, Wallet } from "lucide-react";

interface BillCharge {
  id: number;
  name: string;
  charge_type?: string;
  total_amount: number;
}

interface Payment {
  id: number;
  payment_date: string;
  amount: number;
  payment_mode: string;
  transaction_number: string;
}

interface LockAccountBillDetail {
  id: number;
  bill_number: string;
  status: string;
  publish: boolean;
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
  const [submittingPayment, setSubmittingPayment] = useState(false);

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

  const handleTogglePublish = async (checked: boolean) => {
    if (!bill) return;
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.patch(
        `${baseUrl}/lock_account_bills/${id}.json`,
        { lock_account_bill: { publish: checked } },
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      setBill((prev) => (prev ? { ...prev, publish: checked } : prev));
      toast.success(checked ? "Raised to builder" : "Withdrawn from builder");
    } catch (error) {
      console.error("Error updating publish status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDownloadInvoice = () => window.print();
  const handlePrint = () => window.print();

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
      const formData = new FormData();
      formData.append("lock_payment[payment_of]", "LockAccountBill");
      formData.append("lock_payment[payment_of_id]", String(id));
      formData.append("lock_payment[paid_amount]", paymentAmount);
      formData.append("lock_payment[payment_date]", paymentDate);
      formData.append("lock_payment[payment_mode]", paymentMode);
      formData.append("lock_payment[order_number]", transactionNumber);
      formData.append(
        "lock_payment[lock_bill_payments_attributes][0][resource_id]",
        String(id)
      );
      formData.append(
        "lock_payment[lock_bill_payments_attributes][0][resource_type]",
        "LockAccountBill"
      );
      formData.append(
        "lock_payment[lock_bill_payments_attributes][0][amount]",
        paymentAmount
      );
      formData.append(
        "lock_payment[lock_bill_payments_attributes][0][payment_date]",
        paymentDate
      );

      await axios.post(
        `${baseUrl}/lock_payments.json?lock_account_id=${lockAccountId}`,
        formData,
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      toast.success("Payment recorded successfully");
      setIsPaymentOpen(false);
      setPaymentDate("");
      setPaymentAmount("");
      setPaymentMode("");
      setTransactionNumber("");
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

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
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
              <Switch checked={Boolean(bill.publish)} onCheckedChange={handleTogglePublish} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsPaymentOpen(true)}
                size="sm"
                className="bg-[#C72030] px-4 py-2 text-white hover:bg-[#B01C29]"
              >
                Receive Payment
              </Button>
              <Button
                onClick={() => navigate(`/accounting/invoices/${bill.id}/edit`)}
                size="sm"
                className="bg-[#C72030] px-4 py-2 text-white hover:bg-[#B01C29]"
              >
                Edit
              </Button>
              <Button
                onClick={handleDownloadInvoice}
                size="sm"
                className="bg-[#C72030] px-4 py-2 text-white hover:bg-[#B01C29]"
              >
                <Download className="mr-2 h-4 w-4" /> Download Invoice
              </Button>
              <Button
                onClick={handlePrint}
                size="icon"
                title="Print"
                className="bg-[#C72030] text-white hover:bg-[#B01C29]"
              >
                <Printer className="h-4 w-4" />
              </Button>
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
                <FileText className="h-4 w-4" style={{ color: "#C72030" }} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Bill Details</h3>
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
                <Receipt className="h-4 w-4" style={{ color: "#C72030" }} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Charges</h3>
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
                <Wallet className="h-4 w-4" style={{ color: "#C72030" }} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Payment Details</h3>
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
                      <td className="px-6 py-2">{payment.payment_date}</td>
                      <td className="px-6 py-2">{payment.amount}</td>
                      <td className="px-6 py-2">{payment.payment_mode}</td>
                      <td className="px-6 py-2">{payment.transaction_number}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Receive Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Payment Date</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <Input
                type="number"
                min={0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Payment Mode</label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="NEFT">NEFT</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Transaction Number</label>
              <Input
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={submittingPayment}
              className="bg-[#C72030] text-white hover:bg-[#A01B28]"
            >
              Record Payment
            </Button>
          </DialogFooter>
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
