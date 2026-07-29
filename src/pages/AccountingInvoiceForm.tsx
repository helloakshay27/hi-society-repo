import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Trash2 } from "lucide-react";

interface LedgerOption {
  id: number;
  name: string;
  formatted_name: string;
}

interface BillCycleOption {
  id: number;
  name: string;
  frequency: string;
}

interface ChargeRow {
  key: string;
  ledgerId: string;
  description: string;
  chargeType: string;
  quantity: string;
  rate: string;
  igstRate: string;
  cgstRate: string;
  sgstRate: string;
}

const emptyCharge = (): ChargeRow => ({
  key: Math.random().toString(36).slice(2),
  ledgerId: "",
  description: "",
  chargeType: "",
  quantity: "1",
  rate: "0",
  igstRate: "0",
  cgstRate: "0",
  sgstRate: "0",
});

const RESIDENT_TYPES = ["Owner", "Tenant"];
const INVOICE_FORMATS = ["Standard", "GST Invoice", "Simple Receipt"];
const BILL_FREQUENCIES = ["Monthly", "Quarterly", "Half Yearly", "Yearly"];

const computeChargeAmounts = (row: ChargeRow) => {
  const quantity = Number(row.quantity) || 0;
  const rate = Number(row.rate) || 0;
  const amount = quantity * rate;
  const igstAmount = (amount * (Number(row.igstRate) || 0)) / 100;
  const cgstAmount = (amount * (Number(row.cgstRate) || 0)) / 100;
  const sgstAmount = (amount * (Number(row.sgstRate) || 0)) / 100;
  const totalAmount = amount + igstAmount + cgstAmount + sgstAmount;
  return { amount, igstAmount, cgstAmount, sgstAmount, totalAmount };
};

const AccountingInvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [ledgerOptions, setLedgerOptions] = useState<LedgerOption[]>([]);
  const [billCycleOptions, setBillCycleOptions] = useState<BillCycleOption[]>([]);

  const [billNumber, setBillNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billCycleId, setBillCycleId] = useState("");
  const [billFrequency, setBillFrequency] = useState("");
  const [unitLedgerId, setUnitLedgerId] = useState("");
  const [residentType, setResidentType] = useState("");
  const [otherPreferences, setOtherPreferences] = useState("");
  const [invoiceFormat, setInvoiceFormat] = useState("");
  const [irnNo, setIrnNo] = useState("");
  const [acknowledgementNo, setAcknowledgementNo] = useState("");
  const [acknowledgementDate, setAcknowledgementDate] = useState("");
  const [note, setNote] = useState("");
  const [charges, setCharges] = useState<ChargeRow[]>([emptyCharge()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      try {
        const ledgerRes = await axios.get(
          `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers.json`,
          { headers }
        );
        setLedgerOptions(ledgerRes.data || []);
      } catch (error) {
        console.error("Error fetching ledgers:", error);
      }
      try {
        const cycleRes = await axios.get(`${baseUrl}/account/society_bill_cycles.json`, {
          headers,
        });
        setBillCycleOptions(cycleRes.data?.society_bill_cycles || []);
      } catch (error) {
        console.error("Error fetching bill cycles:", error);
      }
    };
    fetchLookups();
  }, [lockAccountId]);

  useEffect(() => {
    if (!editId) return;
    const fetchBill = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const url = `${baseUrl}/lock_account_bills/${editId}.json?lock_account_id=${lockAccountId}`;
        const response = await axios.get(url, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const bill = response.data?.lock_account_bill || response.data;
        setBillNumber(bill.bill_number || "");
        setDueDate(bill.due_date || "");
        setBillCycleId(bill.bill_cycle_id ? String(bill.bill_cycle_id) : "");
        setBillFrequency(bill.frequency || "");
        setUnitLedgerId(bill.lock_account_ledger_id ? String(bill.lock_account_ledger_id) : "");
        setResidentType(bill.resident_type || "");
        setOtherPreferences(bill.other_preferences || "");
        setInvoiceFormat(bill.invoice_format || "");
        setIrnNo(bill.irn_no || "");
        setAcknowledgementNo(bill.acknowledgement_no || "");
        setAcknowledgementDate(bill.acknowledgement_date || "");
        setNote(bill.note || "");
        const existingCharges =
          bill.lock_account_bill_charges || bill.charges || [];
        if (existingCharges.length > 0) {
          setCharges(
            existingCharges.map((charge: any) => ({
              key: Math.random().toString(36).slice(2),
              ledgerId: charge.lock_account_ledger_id ? String(charge.lock_account_ledger_id) : "",
              description: charge.name || "",
              chargeType: charge.charge_type || "",
              quantity: String(charge.quantity ?? "1"),
              rate: String(charge.rate ?? "0"),
              igstRate: String(charge.igst_rate ?? "0"),
              cgstRate: String(charge.cgst_rate ?? "0"),
              sgstRate: String(charge.sgst_rate ?? "0"),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching invoice for edit:", error);
        toast.error("Failed to load invoice for editing");
      }
    };
    fetchBill();
  }, [editId, lockAccountId]);

  const total = useMemo(
    () => charges.reduce((sum, row) => sum + computeChargeAmounts(row).totalAmount, 0),
    [charges]
  );

  const updateCharge = (key: string, field: keyof ChargeRow, value: string) => {
    setCharges((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  const addCharge = () => setCharges((prev) => [...prev, emptyCharge()]);

  const removeCharge = (key: string) => {
    setCharges((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  };

  const handleSubmit = async () => {
    if (!billNumber) {
      toast.error("Bill Number is required.");
      return;
    }
    if (!dueDate) {
      toast.error("Due Date is required.");
      return;
    }
    const validCharges = charges.filter((row) => row.ledgerId);
    if (validCharges.length === 0) {
      toast.error("Please add at least one charge with a ledger selected.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("lock_account_bill[bill_number]", billNumber);
      formData.append("lock_account_bill[due_date]", dueDate);
      formData.append("lock_account_bill[bill_cycle_id]", billCycleId);
      formData.append("lock_account_bill[frequency]", billFrequency);
      formData.append("lock_account_bill[lock_account_ledger_id]", unitLedgerId);
      formData.append("lock_account_bill[resident_type]", residentType);
      formData.append("lock_account_bill[other_preferences]", otherPreferences);
      formData.append("lock_account_bill[invoice_format]", invoiceFormat);
      formData.append("lock_account_bill[irn_no]", irnNo);
      formData.append("lock_account_bill[acknowledgement_no]", acknowledgementNo);
      formData.append("lock_account_bill[acknowledgement_date]", acknowledgementDate);
      formData.append("lock_account_bill[note]", note);

      validCharges.forEach((row, idx) => {
        const { amount, igstAmount, cgstAmount, sgstAmount, totalAmount } =
          computeChargeAmounts(row);
        const prefix = `lock_account_bill[lock_account_bill_charges_attributes][${idx}]`;
        formData.append(`${prefix}[lock_account_ledger_id]`, row.ledgerId);
        formData.append(`${prefix}[name]`, row.description);
        formData.append(`${prefix}[charge_type]`, row.chargeType);
        formData.append(`${prefix}[quantity]`, row.quantity);
        formData.append(`${prefix}[rate]`, row.rate);
        formData.append(`${prefix}[amount]`, String(amount));
        formData.append(`${prefix}[igst_rate]`, row.igstRate);
        formData.append(`${prefix}[igst_amount]`, String(igstAmount));
        formData.append(`${prefix}[cgst_rate]`, row.cgstRate);
        formData.append(`${prefix}[cgst_amount]`, String(cgstAmount));
        formData.append(`${prefix}[sgst_rate]`, row.sgstRate);
        formData.append(`${prefix}[sgst_amount]`, String(sgstAmount));
        formData.append(`${prefix}[total_amount]`, String(totalAmount));
      });

      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      if (editId) {
        await axios.patch(
          `${baseUrl}/lock_account_bills/${editId}.json?lock_account_id=${lockAccountId}`,
          formData,
          { headers }
        );
        toast.success("Invoice updated successfully");
      } else {
        await axios.post(
          `${baseUrl}/lock_account_bills.json?lock_account_id=${lockAccountId}`,
          formData,
          { headers }
        );
        toast.success("Invoice created successfully");
      }
      navigate("/accounting/invoices");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Bill Number</label>
          <Input
            placeholder="Enter bill number"
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Bill Cycle</label>
          <Select value={billCycleId} onValueChange={setBillCycleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Bill Cycle" />
            </SelectTrigger>
            <SelectContent>
              {billCycleOptions.map((cycle) => (
                <SelectItem key={cycle.id} value={String(cycle.id)}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Bill Frequency</label>
          <Select value={billFrequency} onValueChange={setBillFrequency}>
            <SelectTrigger>
              <SelectValue placeholder="Select Frequency" />
            </SelectTrigger>
            <SelectContent>
              {BILL_FREQUENCIES.map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Select Unit</label>
          <Select value={unitLedgerId} onValueChange={setUnitLedgerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Unit" />
            </SelectTrigger>
            <SelectContent>
              {ledgerOptions.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.formatted_name || option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Resident Type</label>
          <Select value={residentType} onValueChange={setResidentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select Resident Type" />
            </SelectTrigger>
            <SelectContent>
              {RESIDENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Other Preferences</label>
          <Textarea
            placeholder="Enter Other Preferences"
            value={otherPreferences}
            onChange={(e) => setOtherPreferences(e.target.value)}
            rows={1}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Invoice Format</label>
          <Select value={invoiceFormat} onValueChange={setInvoiceFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Select Invoice Format" />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">IRN No</label>
          <Input
            placeholder="Enter IRN Number"
            value={irnNo}
            onChange={(e) => setIrnNo(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Acknowledgement No
          </label>
          <Input
            placeholder="Enter Acknowledgement Number"
            value={acknowledgementNo}
            onChange={(e) => setAcknowledgementNo(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Acknowledgement Date
          </label>
          <Input
            type="date"
            value={acknowledgementDate}
            onChange={(e) => setAcknowledgementDate(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-2 flex items-center border-l-4 border-l-[#C72030] bg-gray-100 px-4 py-2">
        <h3 className="text-base font-semibold text-gray-900">Charges</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-600">
              <th className="border border-gray-300 px-2 py-2">Ledger</th>
              <th className="border border-gray-300 px-2 py-2">Description</th>
              <th className="border border-gray-300 px-2 py-2">Charge Type</th>
              <th className="border border-gray-300 px-2 py-2">Quantity</th>
              <th className="border border-gray-300 px-2 py-2">Rate</th>
              <th className="border border-gray-300 px-2 py-2">Amount</th>
              <th className="border border-gray-300 px-2 py-2">Igst Rate (%)</th>
              <th className="border border-gray-300 px-2 py-2">Igst Amount</th>
              <th className="border border-gray-300 px-2 py-2">Cgst Rate (%)</th>
              <th className="border border-gray-300 px-2 py-2">Cgst Amount</th>
              <th className="border border-gray-300 px-2 py-2">Sgst Rate (%)</th>
              <th className="border border-gray-300 px-2 py-2">Sgst Amount</th>
              <th className="border border-gray-300 px-2 py-2">Total Amount</th>
              <th className="border border-gray-300 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {charges.map((row) => {
              const { amount, igstAmount, cgstAmount, sgstAmount, totalAmount } =
                computeChargeAmounts(row);
              return (
                <tr key={row.key}>
                  <td className="border border-gray-300 p-1" style={{ minWidth: 180 }}>
                    <Select
                      value={row.ledgerId}
                      onValueChange={(value) => updateCharge(row.key, "ledgerId", value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Ledger" />
                      </SelectTrigger>
                      <SelectContent>
                        {ledgerOptions.map((option) => (
                          <SelectItem key={option.id} value={String(option.id)}>
                            {option.formatted_name || option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      className="h-9"
                      value={row.description}
                      onChange={(e) => updateCharge(row.key, "description", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input className="h-9 bg-gray-100" value={row.chargeType} disabled />
                  </td>
                  <td className="border border-gray-300 p-1" style={{ minWidth: 90 }}>
                    <Input
                      className="h-9"
                      type="number"
                      min={0}
                      value={row.quantity}
                      onChange={(e) => updateCharge(row.key, "quantity", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-1" style={{ minWidth: 90 }}>
                    <Input
                      className="h-9"
                      type="number"
                      min={0}
                      value={row.rate}
                      onChange={(e) => updateCharge(row.key, "rate", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-1 text-right text-sm">
                    {amount.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-1" style={{ minWidth: 80 }}>
                    <Input
                      className="h-9"
                      type="number"
                      min={0}
                      value={row.igstRate}
                      onChange={(e) => updateCharge(row.key, "igstRate", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-1 text-right text-sm">
                    {igstAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-1" style={{ minWidth: 80 }}>
                    <Input
                      className="h-9"
                      type="number"
                      min={0}
                      value={row.cgstRate}
                      onChange={(e) => updateCharge(row.key, "cgstRate", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-1 text-right text-sm">
                    {cgstAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-1" style={{ minWidth: 80 }}>
                    <Input
                      className="h-9"
                      type="number"
                      min={0}
                      value={row.sgstRate}
                      onChange={(e) => updateCharge(row.key, "sgstRate", e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 p-1 text-right text-sm">
                    {sgstAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-1 text-right text-sm font-medium">
                    {totalAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeCharge(row.key)}
                      disabled={charges.length <= 1}
                      className="rounded bg-red-500 p-1 text-white hover:opacity-90 disabled:opacity-40"
                      title="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          type="button"
          onClick={addCharge}
          className="mt-2 rounded bg-green-600 p-1.5 text-white hover:opacity-90"
          title="Add charge row"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex justify-end border-t border-gray-200 pt-3">
        <div className="text-base font-semibold text-gray-900">Total ₹ {total.toFixed(2)}</div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">Note</label>
        <Textarea placeholder="Enter note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </div>

      <div className="mt-6 flex justify-center gap-3 border-t border-gray-200 pt-6">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="min-w-[140px] bg-green-600 text-white hover:bg-green-700"
        >
          Submit
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/accounting/invoices")}
          className="min-w-[100px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AccountingInvoiceForm;
