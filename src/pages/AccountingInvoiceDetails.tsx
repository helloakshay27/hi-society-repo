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
import { API_CONFIG } from "@/config/apiConfig";
import { Download, Printer } from "lucide-react";

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
    <div className="p-2 sm:p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
        <span
          className={`rounded px-3 py-1 text-sm font-medium text-white ${
            isPaid ? "bg-green-600" : "bg-[#C72030]"
          }`}
        >
          {bill.status || "Pending"}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Raise to Builder:</span>
          <Switch checked={Boolean(bill.publish)} onCheckedChange={handleTogglePublish} />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPaymentOpen(true)}>
            Receive Payment
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/accounting/invoices/add?id=${bill.id}`)}
          >
            Edit
          </Button>
          <Button variant="outline" onClick={handleDownloadInvoice}>
            <Download className="mr-2 h-4 w-4" /> Download Invoice
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrint} title="Print">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-1 text-sm">
        <div>
          <span className="font-medium text-gray-700">Bill Number: </span>
          <span>{bill.bill_number}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Flat: </span>
          <span>{bill.ledger_name || bill.lock_account_ledger?.name || "-"}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Due Date: </span>
          <span>{bill.due_date}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Bill Period: </span>
          <span>{bill.bill_period || ""}</span>
        </div>
      </div>

      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left">Particular</th>
            <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {charges.map((charge) => (
            <tr key={charge.id}>
              <td className="border border-gray-300 px-3 py-2">{charge.name}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">
                {Number(charge.total_amount || 0).toFixed(1)}
              </td>
            </tr>
          ))}
          <tr>
            <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
              Total Amount
            </td>
            <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
              {totalAmount.toFixed(1)}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
              Balance Amount
            </td>
            <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
              {balanceAmount.toFixed(1)}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
              Total Receivable Amount
            </td>
            <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
              {totalReceivable.toFixed(1)}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2 text-right font-semibold" colSpan={2}>
              Amt. in word: {amountInWords}
            </td>
          </tr>
        </tbody>
      </table>

      {bill.note && (
        <div className="mt-4 text-sm">
          <span className="font-medium text-gray-700">Notes: </span>
          {bill.note}
        </div>
      )}

      <h3 className="mt-8 mb-2 text-base font-semibold text-gray-900">Payment details</h3>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left">ID</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Amount</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Payment Mode</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Transaction Number</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                No payments recorded
              </td>
            </tr>
          ) : (
            payments.map((payment) => (
              <tr key={payment.id}>
                <td className="border border-gray-300 px-3 py-2">{payment.id}</td>
                <td className="border border-gray-300 px-3 py-2">{payment.payment_date}</td>
                <td className="border border-gray-300 px-3 py-2">{payment.amount}</td>
                <td className="border border-gray-300 px-3 py-2">{payment.payment_mode}</td>
                <td className="border border-gray-300 px-3 py-2">{payment.transaction_number}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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
