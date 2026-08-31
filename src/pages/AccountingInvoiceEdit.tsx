import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { API_CONFIG } from "@/config/apiConfig";

interface ChargeRow {
  key: string;
  id?: string;
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
  quantity: "0.00",
  rate: "0.00",
  igstRate: "0",
  cgstRate: "0",
  sgstRate: "0",
});

interface SelectOption {
  id: string;
  label: string;
}

// The invoice_form_options / bill_frequencies APIs are expected to return
// arrays of either plain strings or objects — normalize both shapes into
// {id, label} so FormSelect never has to care which one it got.
const normalizeOptions = (list: unknown): SelectOption[] => {
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const rawId = obj.id ?? obj.value ?? obj.code ?? obj.name ?? obj.label;
      const rawLabel =
        obj.name ?? obj.label ?? obj.title ?? obj.formatted_name ?? obj.text ?? rawId ?? "";
      return { id: String(rawId ?? ""), label: String(rawLabel) };
    }
    return { id: String(item), label: String(item) };
  });
};

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

const FieldsetField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <fieldset className="rounded border border-[#ddd] px-3 pb-1 pt-0 focus-within:border-[#da7756]">
    <legend className="px-1 text-sm font-medium text-gray-500">
      {label}
      {required ? <span className="text-red-500"> *</span> : null}
    </legend>
    {children}
  </fieldset>
);

const FormSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
  bordered?: boolean;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, options, bordered = false, disabled = false }) => {
  const select = (
    <FormControl variant="standard" fullWidth disabled={disabled}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        displayEmpty
        disableUnderline
        sx={{
          height: 36,
          outline: "none",
          "& .MuiSelect-select": {
            paddingLeft: bordered ? "12px" : "0px",
            color: value ? "#2c2c2c" : "#888780",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          "& .MuiSelect-select:focus": { outline: "none", backgroundColor: "transparent" },
        }}
        MenuProps={{
          ...menuProps,
          PaperProps: {
            ...menuProps.PaperProps,
            style: { ...menuProps.PaperProps.style, maxHeight: 300, maxWidth: 260 },
          },
        }}
      >
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
        {options.map((option) => (
          <MenuItem
            key={option.id}
            value={option.id}
            sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            title={option.label}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  if (!bordered) return select;

  return (
    <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">{select}</div>
  );
};

const AccountingInvoiceEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";
  const [loadingBill, setLoadingBill] = useState(true);

  const [billNumber, setBillNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billCycleId, setBillCycleId] = useState("");
  const [billFrequency, setBillFrequency] = useState("");
  const [unitId, setUnitId] = useState("");
  const [residentTypeId, setResidentTypeId] = useState("");
  const [otherPreferences, setOtherPreferences] = useState("");
  const [invoiceFormatId, setInvoiceFormatId] = useState("");
  const [irnNo, setIrnNo] = useState("");
  const [acknowledgementNo, setAcknowledgementNo] = useState("");
  const [acknowledgementDate, setAcknowledgementDate] = useState("");
  const [note, setNote] = useState("");
  const [charges, setCharges] = useState<ChargeRow[]>([emptyCharge()]);
  const [deletedChargeIds, setDeletedChargeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [billCycleOptions, setBillCycleOptions] = useState<SelectOption[]>([]);
  const [billFrequencyOptions, setBillFrequencyOptions] = useState<SelectOption[]>([]);
  const [unitOptions, setUnitOptions] = useState<SelectOption[]>([]);
  const [residentTypeOptions, setResidentTypeOptions] = useState<SelectOption[]>([]);
  const [invoiceFormatOptions, setInvoiceFormatOptions] = useState<SelectOption[]>([]);
  const [ledgerOptions, setLedgerOptions] = useState<SelectOption[]>([]);
  const [chargeTypeOptions, setChargeTypeOptions] = useState<SelectOption[]>([]);
  const [frequencyLoading, setFrequencyLoading] = useState(false);

  // GET /lock_account_bills/invoice_form_options?lock_account_id=... — bundles
  // every static dropdown this form needs (bill cycles, units, resident types,
  // invoice formats, ledgers, charge types) into one response.
  useEffect(() => {
    const fetchFormOptions = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/lock_account_bills/invoice_form_options`, {
          params: { lock_account_id: lockAccountId },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = res.data || {};
        setBillCycleOptions(normalizeOptions(data.bill_cycles));
        setUnitOptions(normalizeOptions(data.units ?? data.ledgers ?? data.unit_ledgers));
        setResidentTypeOptions(normalizeOptions(data.resident_types));
        setInvoiceFormatOptions(normalizeOptions(data.invoice_formats));
        setChargeTypeOptions(normalizeOptions(data.charge_types));
      } catch (error) {
        console.error("Error fetching invoice form options:", error);
        toast.error("Failed to load invoice form options");
      }
    };
    fetchFormOptions();
  }, [lockAccountId]);

  // GET /lock_account_ledgers?lock_account_id=... — list of ledgers selectable
  // as charges on the invoice.
  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/lock_account_ledgers`, {
          params: { lock_account_id: lockAccountId },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.lock_account_ledgers ?? data?.data ?? [];
        setLedgerOptions(normalizeOptions(list));
      } catch (error) {
        console.error("Error fetching ledgers:", error);
        setLedgerOptions([]);
      }
    };
    fetchLedgers();
  }, [lockAccountId]);

  // GET /lock_account_bills/bill_frequencies?bill_cycle_id=... — frequencies
  // depend on the selected bill cycle, so re-fetch whenever it changes.
  useEffect(() => {
    if (!billCycleId) {
      setBillFrequencyOptions([]);
      return;
    }
    const fetchFrequencies = async () => {
      setFrequencyLoading(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/lock_account_bills/bill_frequencies`, {
          params: { bill_cycle_id: billCycleId, lock_account_id: lockAccountId },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.bill_frequencies ?? data?.data ?? [];
        setBillFrequencyOptions(normalizeOptions(list));
      } catch (error) {
        console.error("Error fetching bill frequencies:", error);
        setBillFrequencyOptions([]);
      } finally {
        setFrequencyLoading(false);
      }
    };
    fetchFrequencies();
  }, [billCycleId, lockAccountId]);

  // GET /lock_account_bills/:id — load the existing invoice being edited.
  useEffect(() => {
    if (!id) return;
    const fetchBill = async () => {
      setLoadingBill(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/lock_account_bills/${id}.json`, {
          params: { lock_account_id: lockAccountId },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const bill = res.data?.lock_account_bill || res.data;
        setBillNumber(bill.bill_number || "");
        setDueDate(bill.due_date || "");
        setBillCycleId(bill.bill_cycle_id ? String(bill.bill_cycle_id) : "");
        setBillFrequency(bill.frequency || "");
        setUnitId(bill.ledger_id ? String(bill.ledger_id) : "");
        setResidentTypeId(bill.resident_type || "");
        setOtherPreferences(bill.other_preferences || "");
        setInvoiceFormatId(bill.invoice_format || "");
        setIrnNo(bill.irn_no || "");
        setAcknowledgementNo(bill.acknowledgement_no || "");
        setAcknowledgementDate(bill.acknowledgement_date || "");
        setNote(bill.note || "");

        const existingCharges = bill.lock_account_bill_charges || bill.charges || [];
        if (existingCharges.length > 0) {
          setCharges(
            existingCharges.map((charge: Record<string, unknown>) => ({
              key: Math.random().toString(36).slice(2),
              id: charge.id !== undefined && charge.id !== null ? String(charge.id) : undefined,
              ledgerId: charge.ledger_id ? String(charge.ledger_id) : "",
              description: String(charge.description ?? charge.name ?? ""),
              chargeType: String(charge.charge_type ?? ""),
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
      } finally {
        setLoadingBill(false);
      }
    };
    fetchBill();
  }, [id, lockAccountId]);

  const total = useMemo(
    () => charges.reduce((sum, row) => sum + computeChargeAmounts(row).totalAmount, 0),
    [charges]
  );

  const updateCharge = (key: string, field: keyof ChargeRow, value: string) => {
    setCharges((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const addCharge = () => setCharges((prev) => [...prev, emptyCharge()]);

  const removeCharge = (key: string) => {
    setCharges((prev) => {
      if (prev.length <= 1) return prev;
      const removed = prev.find((row) => row.key === key);
      if (removed?.id) {
        setDeletedChargeIds((ids) => [...ids, removed.id as string]);
      }
      return prev.filter((row) => row.key !== key);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber.trim()) {
      toast.error("Bill Number is required.");
      return;
    }
    if (!dueDate) {
      toast.error("Due Date is required.");
      return;
    }
    if (!unitId) {
      toast.error("Select Unit is required.");
      return;
    }
    const validCharges = charges.filter((row) => row.ledgerId);
    if (validCharges.length === 0) {
      toast.error("Please add at least one charge with a ledger selected.");
      return;
    }

    const societyId =
      localStorage.getItem("society_id") || localStorage.getItem("selectedSocietyId") || "";

    const payload = {
      lock_account_id: Number(lockAccountId),
      lock_account_bill: {
        bill_number: billNumber,
        ledger_id: Number(unitId),
        society_id: Number(societyId) || undefined,
        due_date: dueDate,
        bill_cycle_id: billCycleId ? Number(billCycleId) : undefined,
        frequency: billFrequency || undefined,
        resident_type: residentTypeId,
        other_preferences: otherPreferences || undefined,
        invoice_format: invoiceFormatId || undefined,
        irn_no: irnNo || undefined,
        acknowledgement_no: acknowledgementNo || undefined,
        acknowledgement_date: acknowledgementDate || undefined,
        note,
        delete_charge_ids: deletedChargeIds.map((chargeId) => Number(chargeId)),
      },
      lock_account_bill_charges: validCharges.map((row) => {
        const { amount, igstAmount, cgstAmount, sgstAmount, totalAmount } =
          computeChargeAmounts(row);
        return {
          id: row.id ? Number(row.id) : undefined,
          ledger_id: Number(row.ledgerId),
          description: row.description,
          quantity: Number(row.quantity) || 0,
          rate: Number(row.rate) || 0,
          amount,
          igst_rate: Number(row.igstRate) || 0,
          igst_amount: igstAmount,
          cgst_rate: Number(row.cgstRate) || 0,
          cgst_amount: cgstAmount,
          sgst_rate: Number(row.sgstRate) || 0,
          sgst_amount: sgstAmount,
          total_amount: totalAmount,
        };
      }),
    };

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.put(`${baseUrl}/lock_account_bills/${id}.json`, payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Invoice updated successfully");
      navigate("/accounting/invoices");
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <button
        onClick={() => navigate("/accounting/invoices")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </button>

      <div className="mb-6">
        <h1 className="text-brand-h2 font-semibold text-brand-text">Editing Invoice</h1>
      </div>

      {loadingBill ? (
        <div className="py-10 text-center text-brand-text-light">Loading invoice...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3 items-start">
            <FieldsetField label="Bill Number" required>
              <Input
                placeholder="Enter bill number"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
              />
            </FieldsetField>
            <FieldsetField label="Due Date" required>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
              />
            </FieldsetField>
            <FieldsetField label="Bill Cycle">
              <FormSelect
                value={billCycleId}
                onChange={setBillCycleId}
                placeholder="Select Bill Cycle"
                options={billCycleOptions}
              />
            </FieldsetField>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <FieldsetField label="Bill Frequency">
              <FormSelect
                value={billFrequency}
                onChange={setBillFrequency}
                placeholder={
                  !billCycleId
                    ? "Select Bill Cycle first"
                    : frequencyLoading
                    ? "Loading..."
                    : "Select Frequency"
                }
                options={billFrequencyOptions}
                disabled={!billCycleId || frequencyLoading}
              />
            </FieldsetField>
            <FieldsetField label="Select Unit">
              <FormSelect
                value={unitId}
                onChange={setUnitId}
                placeholder="Select Unit"
                options={unitOptions}
              />
            </FieldsetField>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3 items-start">
            <FieldsetField label="Resident Type">
              <FormSelect
                value={residentTypeId}
                onChange={setResidentTypeId}
                placeholder="Select Resident Type"
                options={residentTypeOptions}
              />
            </FieldsetField>
            <FieldsetField label="Other Preferences">
              <Textarea
                placeholder="Enter Other Preferences"
                value={otherPreferences}
                onChange={(e) => setOtherPreferences(e.target.value)}
                rows={1}
                className="h-9 min-h-0 resize-none overflow-hidden border-0 px-0 py-1.5 shadow-none focus-visible:outline-none focus-visible:ring-0"
              />
            </FieldsetField>
            <FieldsetField label="Invoice Format">
              <FormSelect
                value={invoiceFormatId}
                onChange={setInvoiceFormatId}
                placeholder="Select Invoice Format"
                options={invoiceFormatOptions}
              />
            </FieldsetField>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <FieldsetField label="IRN No">
              <Input
                placeholder="Enter IRN Number"
                value={irnNo}
                onChange={(e) => setIrnNo(e.target.value)}
                className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
              />
            </FieldsetField>
            <FieldsetField label="Acknowledgement No">
              <Input
                placeholder="Enter Acknowledgement Number"
                value={acknowledgementNo}
                onChange={(e) => setAcknowledgementNo(e.target.value)}
                className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
              />
            </FieldsetField>
            <FieldsetField label="Acknowledgement Date">
              <Input
                type="date"
                value={acknowledgementDate}
                onChange={(e) => setAcknowledgementDate(e.target.value)}
                className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
              />
            </FieldsetField>
          </div>

          <div className="overflow-hidden rounded-md border border-brand-card-border bg-white">
            <div className="flex items-center bg-brand-bg px-4 py-2">
              <h3 className="text-brand-body-3 font-semibold text-brand-text">Charges</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] border-collapse">
                <thead>
                  <tr className="bg-brand-selected text-left text-brand-body-5 text-brand-text-light">
                    <th className="px-2 py-2 font-medium">Ledger</th>
                    <th className="px-2 py-2 font-medium">Description</th>
                    <th className="px-2 py-2 font-medium">Charge Type</th>
                    <th className="px-2 py-2 font-medium">Quantity</th>
                    <th className="px-2 py-2 font-medium">Rate</th>
                    <th className="px-2 py-2 font-medium">Amount</th>
                    <th className="px-2 py-2 font-medium">Igst Rate (%)</th>
                    <th className="px-2 py-2 font-medium">Igst Amount</th>
                    <th className="px-2 py-2 font-medium">Cgst Rate (%)</th>
                    <th className="px-2 py-2 font-medium">Cgst Amount</th>
                    <th className="px-2 py-2 font-medium">Sgst Rate (%)</th>
                    <th className="px-2 py-2 font-medium">Sgst Amount</th>
                    <th className="px-2 py-2 font-medium">Total Amount</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {charges.map((row) => {
                    const { amount, igstAmount, cgstAmount, sgstAmount, totalAmount } =
                      computeChargeAmounts(row);
                    return (
                      <tr key={row.key} className="border-t border-brand-border">
                        <td className="min-w-[160px] p-1.5">
                          <FormSelect
                            value={row.ledgerId}
                            onChange={(value) => updateCharge(row.key, "ledgerId", value)}
                            placeholder="Select Ledger"
                            options={ledgerOptions}
                            bordered
                          />
                        </td>
                        <td className="min-w-[140px] p-1.5">
                          <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">
                            <Input
                              value={row.description}
                              onChange={(e) => updateCharge(row.key, "description", e.target.value)}
                              placeholder="Description"
                              className="border-0 focus-visible:border-0"
                            />
                          </div>
                        </td>
                        <td className="min-w-[140px] p-1.5">
                          <FormSelect
                            value={row.chargeType}
                            onChange={(value) => updateCharge(row.key, "chargeType", value)}
                            placeholder="Select Type"
                            options={chargeTypeOptions}
                            bordered
                          />
                        </td>
                        <td className="min-w-[90px] p-1.5">
                          <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.quantity}
                              onChange={(e) => updateCharge(row.key, "quantity", e.target.value)}
                              className="border-0 focus-visible:border-0"
                            />
                          </div>
                        </td>
                        <td className="min-w-[90px] p-1.5">
                          <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.rate}
                              onChange={(e) => updateCharge(row.key, "rate", e.target.value)}
                              className="border-0 focus-visible:border-0"
                            />
                          </div>
                        </td>
                        <td className="min-w-[90px] p-1.5">
                          <Input readOnly value={amount.toFixed(2)} className="bg-brand-bg" />
                        </td>
                        <td className="min-w-[90px] p-1.5">
                          <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.igstRate}
                              onChange={(e) => updateCharge(row.key, "igstRate", e.target.value)}
                              className="border-0 focus-visible:border-0"
                            />
                          </div>
                        </td>
                        <td className="min-w-[90px] p-1.5">
                          <Input readOnly value={igstAmount.toFixed(2)} className="bg-brand-bg" />
                        </td>
                        <td className="min-w-[90px] p-1.5">
                          <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.cgstRate}
                              onChange={(e) => updateCharge(row.key, "cgstRate", e.target.value)}
                              className="border-0 focus-visible:border-0"
                            />
                          </div>
                        </td>
                        <td className="min-w-[90px] p-1.5">
                          <Input readOnly value={cgstAmount.toFixed(2)} className="bg-brand-bg" />
                        </td>
                        <td className="min-w-[90px] p-1.5">
                          <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.sgstRate}
                              onChange={(e) => updateCharge(row.key, "sgstRate", e.target.value)}
                              className="border-0 focus-visible:border-0"
                            />
                          </div>
                        </td>
                        <td className="min-w-[90px] p-1.5">
                          <Input readOnly value={sgstAmount.toFixed(2)} className="bg-brand-bg" />
                        </td>
                        <td className="min-w-[110px] p-1.5">
                          <Input readOnly value={totalAmount.toFixed(2)} className="bg-brand-bg font-medium" />
                        </td>
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeCharge(row.key)}
                            disabled={charges.length <= 1}
                            className="rounded bg-[#C72030] p-1 text-white hover:opacity-90 disabled:opacity-40"
                            title="Remove row"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-brand-border bg-white px-3 py-3">
              <button
                type="button"
                onClick={addCharge}
                className="rounded bg-[#C72030] p-1.5 text-white hover:opacity-90"
                title="Add charge row"
              >
                <Plus className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <span className="whitespace-nowrap text-brand-body-4 font-semibold text-brand-text">
                  Total ₹
                </span>
                <span className="text-brand-body-3 font-semibold text-brand-text">{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <FieldsetField label="Note">
              <Textarea
                placeholder="Enter note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
              />
            </FieldsetField>
          </div>

          <div className="mt-6 flex justify-center gap-3 border-t border-brand-border pt-6">
            <Button
              type="submit"
              variant="ghost"
              disabled={submitting}
              className="btn-primary min-w-[140px] h-9 px-4 text-sm font-medium"
            >
              {submitting ? "Updating..." : "Update"}
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => navigate("/accounting/invoices")}
              className="min-w-[140px] h-9 !bg-white border !border-[#da7756] !text-[#da7756] px-4 text-sm font-medium"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AccountingInvoiceEdit;
