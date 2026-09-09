import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Plus, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";

const CHARGE_COLUMNS: ColumnConfig[] = [
  { key: "ledgerId", label: "Ledger", sortable: false },
  { key: "description", label: "Description", sortable: false },
  { key: "chargeType", label: "Charge Type", sortable: false },
  { key: "quantity", label: "Quantity", sortable: false },
  { key: "rate", label: "Rate", sortable: false },
  { key: "amount", label: "Amount", sortable: false },
  { key: "igstRate", label: "Igst Rate (%)", sortable: false },
  { key: "igstAmount", label: "Igst Amount", sortable: false },
  { key: "cgstRate", label: "Cgst Rate (%)", sortable: false },
  { key: "cgstAmount", label: "Cgst Amount", sortable: false },
  { key: "sgstRate", label: "Sgst Rate (%)", sortable: false },
  { key: "sgstAmount", label: "Sgst Amount", sortable: false },
  { key: "totalAmount", label: "Total Amount", sortable: false },
];

const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": {
      borderColor: "#ddd",
    },
    "&:hover fieldset": {
      borderColor: "#C72030",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#C72030",
    },
  },
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
      <h2 className="text-lg font-medium text-gray-900 flex items-center">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
          style={{ backgroundColor: "#E5E0D3" }}
        >
          <Receipt size={16} color="var(--color-primary,#da7756)" />
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </div>
);

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

const FormTextArea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}> = ({ label, value, onChange, placeholder, rows = 3, maxLength }) => (
  <div>
    <div className="relative">
      <textarea
        className="peer w-full rounded-md border border-gray-300 p-3 focus:border-[#DA7756] focus:outline-none focus:ring-1 focus:ring-[#DA7756] resize-y"
        rows={rows}
        value={value}
        onChange={(e) => {
          if (!maxLength || e.target.value.length <= maxLength) onChange(e.target.value);
        }}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-normal text-black/60 peer-focus:text-[#DA7756]">
        {label}
      </label>
    </div>
    {maxLength ? (
      <div className="mt-1 text-right text-xs text-gray-400">
        {value.length}/{maxLength}
      </div>
    ) : null}
  </div>
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

const AccountingInvoiceCreation: React.FC = () => {
  const navigate = useNavigate();
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

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
      setBillFrequency("");
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
    setBillFrequency("");
    fetchFrequencies();
  }, [billCycleId, lockAccountId]);

  const total = useMemo(
    () => charges.reduce((sum, row) => sum + computeChargeAmounts(row).totalAmount, 0),
    [charges]
  );

  const updateCharge = (key: string, field: keyof ChargeRow, value: string) => {
    setCharges((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const addCharge = () => setCharges((prev) => [...prev, emptyCharge()]);

  const removeCharge = (key: string) => {
    setCharges((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  };

  const renderChargeCell = (row: ChargeRow, columnKey: string) => {
    const { amount, igstAmount, cgstAmount, sgstAmount, totalAmount } = computeChargeAmounts(row);
    switch (columnKey) {
      case "ledgerId":
        return (
          <FormSelect
            value={row.ledgerId}
            onChange={(value) => updateCharge(row.key, "ledgerId", value)}
            placeholder="Select Ledger"
            options={ledgerOptions}
            bordered
          />
        );
      case "description":
        return (
          <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">
            <Input
              value={row.description}
              onChange={(e) => updateCharge(row.key, "description", e.target.value)}
              placeholder="Description"
              className="border-0 focus-visible:border-0"
            />
          </div>
        );
      case "chargeType":
        return (
          <FormSelect
            value={row.chargeType}
            onChange={(value) => updateCharge(row.key, "chargeType", value)}
            placeholder="Select Type"
            options={chargeTypeOptions}
            bordered
          />
        );
      case "quantity":
        return (
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
        );
      case "rate":
        return (
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
        );
      case "amount":
        return <Input readOnly value={amount.toFixed(2)} className="bg-brand-bg" />;
      case "igstRate":
        return (
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
        );
      case "igstAmount":
        return <Input readOnly value={igstAmount.toFixed(2)} className="bg-brand-bg" />;
      case "cgstRate":
        return (
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
        );
      case "cgstAmount":
        return <Input readOnly value={cgstAmount.toFixed(2)} className="bg-brand-bg" />;
      case "sgstRate":
        return (
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
        );
      case "sgstAmount":
        return <Input readOnly value={sgstAmount.toFixed(2)} className="bg-brand-bg" />;
      case "totalAmount":
        return <Input readOnly value={totalAmount.toFixed(2)} className="bg-brand-bg font-medium" />;
      default:
        return null;
    }
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
      },
      lock_account_bill_charges: validCharges.map((row) => {
        const { amount, igstAmount, cgstAmount, sgstAmount, totalAmount } =
          computeChargeAmounts(row);
        return {
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
      await axios.post(`${baseUrl}/lock_account_bills.json`, payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Invoice created successfully");
      navigate("/accounting/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden invoice-form-page">
      <style>{`.invoice-form-page .MuiFormLabel-asterisk { color: #da7756 !important; }`}</style>
      <button
        onClick={() => navigate("/accounting/invoices")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="Invoice Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <TextField
              label="Bill Number"
              required
              placeholder="Enter bill number"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
            <TextField
              label="Due Date"
              required
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
            <FormControl fullWidth sx={{ "& .MuiInputBase-root": fieldStyles }}>
              <InputLabel shrink>Bill Cycle</InputLabel>
              <Select
                value={billCycleId}
                onChange={(e) => setBillCycleId(e.target.value as string)}
                label="Bill Cycle"
                notched
                displayEmpty
              >
                <MenuItem value="">Select Bill Cycle</MenuItem>
                {billCycleOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id} title={option.label}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <FormControl fullWidth disabled={!billCycleId || frequencyLoading} sx={{ "& .MuiInputBase-root": fieldStyles }}>
              <InputLabel shrink>Bill Frequency</InputLabel>
              <Select
                value={billFrequency}
                onChange={(e) => setBillFrequency(e.target.value as string)}
                label="Bill Frequency"
                notched
                displayEmpty
              >
                <MenuItem value="">
                  {!billCycleId
                    ? "Select Bill Cycle first"
                    : frequencyLoading
                    ? "Loading..."
                    : "Select Frequency"}
                </MenuItem>
                {billFrequencyOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id} title={option.label}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
              <InputLabel shrink>Select Unit</InputLabel>
              <Select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value as string)}
                label="Select Unit"
                notched
                displayEmpty
              >
                <MenuItem value="">Select Unit</MenuItem>
                {unitOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id} title={option.label}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ "& .MuiInputBase-root": fieldStyles }}>
              <InputLabel shrink>Resident Type</InputLabel>
              <Select
                value={residentTypeId}
                onChange={(e) => setResidentTypeId(e.target.value as string)}
                label="Resident Type"
                notched
                displayEmpty
              >
                <MenuItem value="">Select Resident Type</MenuItem>
                {residentTypeOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id} title={option.label}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <FormTextArea
              label="Other Preferences"
              placeholder="Enter Other Preferences"
              value={otherPreferences}
              onChange={setOtherPreferences}
              rows={1}
            />
            <FormControl fullWidth sx={{ "& .MuiInputBase-root": fieldStyles }}>
              <InputLabel shrink>Invoice Format</InputLabel>
              <Select
                value={invoiceFormatId}
                onChange={(e) => setInvoiceFormatId(e.target.value as string)}
                label="Invoice Format"
                notched
                displayEmpty
              >
                <MenuItem value="">Select Invoice Format</MenuItem>
                {invoiceFormatOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id} title={option.label}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="IRN No"
              placeholder="Enter IRN Number"
              value={irnNo}
              onChange={(e) => setIrnNo(e.target.value)}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <TextField
              label="Acknowledgement No"
              placeholder="Enter Acknowledgement Number"
              value={acknowledgementNo}
              onChange={(e) => setAcknowledgementNo(e.target.value)}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
            <TextField
              label="Acknowledgement Date"
              type="date"
              value={acknowledgementDate}
              onChange={(e) => setAcknowledgementDate(e.target.value)}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
          </div>
        </SectionCard>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <Receipt size={16} color="var(--color-primary,#da7756)" />
              </span>
              Charges
            </h2>
          </div>

          <div className="p-4">
            <EnhancedTable
              data={charges}
              columns={CHARGE_COLUMNS}
              getItemId={(item) => item.key}
              renderCell={(item, columnKey) => renderChargeCell(item, columnKey)}
              renderActions={(item) => (
                <button
                  type="button"
                  onClick={() => removeCharge(item.key)}
                  disabled={charges.length <= 1}
                  className="rounded bg-[#C72030] p-1 text-white hover:opacity-90 disabled:opacity-40"
                  title="Remove row"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              hideTableSearch
              hideColumnsButton
              emptyMessage="No charges added"
            />

            <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-3">
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
        </div>

        <SectionCard title="Additional Note">
          <FormTextArea
            label="Note"
            placeholder="Enter note"
            value={note}
            onChange={setNote}
            rows={3}
          />
        </SectionCard>

        <div className="flex justify-center gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="min-w-[140px] bg-[#C72030] text-white hover:bg-[#A01020]"
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => navigate("/accounting/invoices")}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AccountingInvoiceCreation;
