import React, { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

const BILL_CYCLES = ["April 2026", "May 2026", "June 2026", "July 2026", "August 2026"];
const BILL_FREQUENCIES = ["Monthly", "Quarterly", "Half Yearly", "Yearly"];
const UNITS = ["A-101", "A-102", "B-201", "B-202", "C-301"];
const RESIDENT_TYPES = ["Owner", "Tenant"];
const INVOICE_FORMATS = ["Standard", "GST Invoice", "Simple Receipt"];
const LEDGERS = ["Maintenance", "Water Charges", "Parking", "Electricity", "Club House", "Sinking Fund"];
const CHARGE_TYPES = ["Recurring", "One Time", "Adhoc"];

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
  options: string[];
  bordered?: boolean;
}> = ({ value, onChange, placeholder, options, bordered = false }) => {
  const select = (
    <FormControl variant="standard" fullWidth>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        displayEmpty
        disableUnderline
        sx={{
          height: 36,
          outline: "none",
          "& .MuiSelect-select": { paddingLeft: bordered ? "12px" : "0px", color: value ? "#2c2c2c" : "#888780" },
          "& .MuiSelect-select:focus": { outline: "none", backgroundColor: "transparent" },
        }}
        MenuProps={{
          ...menuProps,
          PaperProps: {
            ...menuProps.PaperProps,
            style: { ...menuProps.PaperProps.style, maxHeight: 300 },
          },
        }}
      >
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
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
  const [billNumber, setBillNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billCycle, setBillCycle] = useState("");
  const [billFrequency, setBillFrequency] = useState("");
  const [unit, setUnit] = useState("");
  const [residentType, setResidentType] = useState("");
  const [otherPreferences, setOtherPreferences] = useState("");
  const [invoiceFormat, setInvoiceFormat] = useState("");
  const [irnNo, setIrnNo] = useState("");
  const [acknowledgementNo, setAcknowledgementNo] = useState("");
  const [acknowledgementDate, setAcknowledgementDate] = useState("");
  const [note, setNote] = useState("");
  const [charges, setCharges] = useState<ChargeRow[]>([emptyCharge()]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber.trim()) {
      toast.error("Bill Number is required.");
      return;
    }
    if (!dueDate) {
      toast.error("Due Date is required.");
      return;
    }
    toast.success("Invoice details captured.");
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-brand-h2 font-semibold text-brand-text">Accounting Invoice Creation</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
              value={billCycle}
              onChange={setBillCycle}
              placeholder="Select Bill Cycle"
              options={BILL_CYCLES}
            />
          </FieldsetField>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FieldsetField label="Bill Frequency">
            <FormSelect
              value={billFrequency}
              onChange={setBillFrequency}
              placeholder="Select Frequency"
              options={BILL_FREQUENCIES}
            />
          </FieldsetField>
          <FieldsetField label="Select Unit">
            <FormSelect
              value={unit}
              onChange={setUnit}
              placeholder="Select Unit"
              options={UNITS}
            />
          </FieldsetField>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FieldsetField label="Resident Type">
            <FormSelect
              value={residentType}
              onChange={setResidentType}
              placeholder="Select Resident Type"
              options={RESIDENT_TYPES}
            />
          </FieldsetField>
          <FieldsetField label="Other Preferences">
            <Textarea
              placeholder="Enter Other Preferences"
              value={otherPreferences}
              onChange={(e) => setOtherPreferences(e.target.value)}
              rows={1}
              className="min-h-9 resize-none border-0 px-0 py-1.5 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
          <FieldsetField label="Invoice Format">
            <FormSelect
              value={invoiceFormat}
              onChange={setInvoiceFormat}
              placeholder="Select Invoice Format"
              options={INVOICE_FORMATS}
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
                          options={LEDGERS}
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
                          options={CHARGE_TYPES}
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

        <div className="mt-6 flex justify-center border-t border-brand-border pt-6">
          <Button type="submit" variant="ghost" className="btn-primary min-w-[140px] h-9 px-4 text-sm font-medium">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AccountingInvoiceCreation;
