import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock } from "lucide-react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import ListItemText from "@mui/material/ListItemText";
import MuiCheckbox from "@mui/material/Checkbox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { API_CONFIG } from "@/config/apiConfig";

interface ChargeSetup {
  id: number;
  name: string;
}

interface OptionItem {
  value: string;
  label: string;
}

const FALLBACK_FREQUENCIES: OptionItem[] = ["monthly", "quarterly", "half_yearly", "yearly"].map((v) => ({
  value: v,
  label: v.replace(/[_-]/g, " "),
}));

const FALLBACK_TYPE_OPTIONS: OptionItem[] = ["flat", "percentage"].map((v) => ({
  value: v,
  label: v === "percentage" ? "Percentage" : "Flat Amount",
}));

const pickList = (data: Record<string, unknown> | undefined, keys: string[]): unknown[] => {
  if (!data) return [];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as unknown[];
  }
  return [];
};

const toOptionList = (raw: unknown): OptionItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string" || typeof item === "number") {
      const value = String(item);
      return { value, label: value.replace(/[_-]/g, " ") };
    }
    const obj = item as Record<string, unknown>;
    const value = obj.value ?? obj.key ?? obj.code ?? obj.id ?? "";
    const label = obj.label ?? obj.name ?? obj.title ?? String(value);
    return { value: String(value), label: String(label) };
  });
};

const toChargeOptions = (raw: unknown): ChargeSetup[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const obj = item as Record<string, unknown>;
    return {
      id: Number(obj.id ?? obj.value),
      name: String(obj.name ?? obj.label ?? obj.id ?? ""),
    };
  });
};

const isPercentageType = (value: string) => /percent/i.test(value);

const toApiDate = (isoDate: string): string => {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
};

const fromApiDate = (value: string): string => {
  if (!value) return "";
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return "";
};

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
          <CalendarClock size={16} color="var(--color-primary,#da7756)" />
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </div>
);

const emptyForm = {
  name: "",
  startDate: "",
  endDate: "",
  paymentDueDays: "",
  frequency: "",
  fineType: "",
  fineRate: "0",
  interestType: "",
  interestRate: "0",
  expense: false,
};

const AccountingBillCycleEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(emptyForm);
  const [chargeIds, setChargeIds] = useState<number[]>([]);
  const [chargeSetups, setChargeSetups] = useState<ChargeSetup[]>([]);
  const [frequencyOptions, setFrequencyOptions] = useState<OptionItem[]>([]);
  const [fineTypeOptions, setFineTypeOptions] = useState<OptionItem[]>([]);
  const [interestTypeOptions, setInterestTypeOptions] = useState<OptionItem[]>([]);
  const [loadingCycle, setLoadingCycle] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchFormOptions = useCallback(async () => {
    const baseUrl = API_CONFIG.BASE_URL;
    const token = API_CONFIG.TOKEN;
    const res = await axios.get(`${baseUrl}/account/society_bill_cycles/form_options.json`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const data = (res.data || {}) as Record<string, unknown>;
    return {
      frequencies: toOptionList(
        pickList(data, ["frequencies", "frequency_options", "cycle_frequencies", "frequency"])
      ),
      fineTypes: toOptionList(pickList(data, ["fine_types", "fine_type_options", "fine_types_options"])),
      interestTypes: toOptionList(
        pickList(data, ["interest_types", "interest_type_options", "interest_types_options"])
      ),
      charges: toChargeOptions(pickList(data, ["charges", "charge_setups", "charge_options"])),
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      setLoadingCycle(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;

        const [options, detailRes] = await Promise.all([
          fetchFormOptions(),
          axios.get(`${baseUrl}/account/society_bill_cycles/${id}.json`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          }),
        ]);

        setFrequencyOptions(options.frequencies);
        setFineTypeOptions(options.fineTypes);
        setInterestTypeOptions(options.interestTypes);
        setChargeSetups(options.charges);

        const data = detailRes.data?.society_bill_cycle || {};
        setForm({
          name: data.name || "",
          startDate: fromApiDate(data.start_month || ""),
          endDate: fromApiDate(data.end_month || ""),
          paymentDueDays: data.payment_due_in?.toString() || "",
          frequency: data.frequency || "",
          fineType: data.fine_type || "",
          fineRate: data.fine_rate?.toString() || "0",
          interestType: data.interest_type || "",
          interestRate: data.interest_rate?.toString() || "0",
          expense: !!data.expense_bill,
        });

        const names: string[] = Array.isArray(data.charge_names) ? data.charge_names : [];
        setChargeIds(
          options.charges.filter((cs) => names.includes(cs.name)).map((cs) => cs.id)
        );
      } catch (error) {
        console.error("Error fetching bill cycle for edit:", error);
        toast.error("Failed to load bill cycle for editing");
      } finally {
        setLoadingCycle(false);
      }
    };
    loadData();
  }, [id, fetchFormOptions]);

  const effectiveFrequencyOptions = frequencyOptions.length > 0 ? frequencyOptions : FALLBACK_FREQUENCIES;
  const effectiveFineTypeOptions = fineTypeOptions.length > 0 ? fineTypeOptions : FALLBACK_TYPE_OPTIONS;
  const effectiveInterestTypeOptions = interestTypeOptions.length > 0 ? interestTypeOptions : FALLBACK_TYPE_OPTIONS;

  const updateField = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!form.name.trim()) {
      toast.error("Bill Cycle Name is required");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Start Date and End Date are required");
      return;
    }
    if (!form.frequency) {
      toast.error("Bill Cycle Frequency is required");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const payload = {
        society_bill_cycle: {
          name: form.name,
          start_month: toApiDate(form.startDate),
          end_month: toApiDate(form.endDate),
          payment_due_in: Number(form.paymentDueDays) || 0,
          frequency: form.frequency,
          fine_type: form.fineType,
          fine_rate: Number(form.fineRate) || 0,
          interest_type: form.interestType,
          interest_rate: Number(form.interestRate) || 0,
          expense_bill: form.expense,
        },
        charges: chargeIds,
      };
      await axios.put(`${baseUrl}/account/society_bill_cycles/${id}.json`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Bill cycle updated successfully");
      navigate("/accounting/bill-cycles");
    } catch (error) {
      console.error("Error updating bill cycle:", error);
      toast.error("Failed to update bill cycle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden bill-cycle-form-page">
      <style>{`.bill-cycle-form-page .MuiFormLabel-asterisk { color: #da7756 !important; }`}</style>
      <button
        onClick={() => navigate("/accounting/bill-cycles")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bill Cycles
      </button>

      {loadingCycle ? (
        <div className="py-10 text-center text-brand-text-light">Loading bill cycle...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <SectionCard title="Editing Bill Cycle">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField
                label="Bill Cycle Name"
                required
                placeholder="Enter Bill Cycle Name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
              <TextField
                label="Start Date"
                required
                type="date"
                placeholder="Select Start Date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
              <TextField
                label="End Date"
                required
                type="date"
                placeholder="Select End Date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
              <TextField
                label="Payment Due in (Days)"
                required
                type="number"
                placeholder="Enter Days"
                value={form.paymentDueDays}
                onChange={(e) => updateField("paymentDueDays", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
              <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
                <InputLabel shrink>Bill Cycle Frequency</InputLabel>
                <Select
                  value={form.frequency}
                  onChange={(e) => updateField("frequency", e.target.value as string)}
                  label="Bill Cycle Frequency"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select</MenuItem>
                  {effectiveFrequencyOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormControl fullWidth sx={{ "& .MuiInputBase-root": fieldStyles }}>
                <InputLabel shrink>Fine</InputLabel>
                <Select
                  value={form.fineType}
                  onChange={(e) => updateField("fineType", e.target.value as string)}
                  label="Fine"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select</MenuItem>
                  {effectiveFineTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={isPercentageType(form.fineType) ? "Fine Percentage (%)" : "Fine Amount"}
                type="number"
                placeholder={isPercentageType(form.fineType) ? "Enter Fine Percentage" : "Enter Fine Amount"}
                value={form.fineRate}
                onChange={(e) => updateField("fineRate", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
              <FormControl fullWidth sx={{ "& .MuiInputBase-root": fieldStyles }}>
                <InputLabel shrink>Interest</InputLabel>
                <Select
                  value={form.interestType}
                  onChange={(e) => updateField("interestType", e.target.value as string)}
                  label="Interest"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select</MenuItem>
                  {effectiveInterestTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={isPercentageType(form.interestType) ? "Interest Percentage (%)" : "Interest Amount"}
                type="number"
                placeholder={isPercentageType(form.interestType) ? "Enter Interest Percentage" : "Enter Interest Amount"}
                value={form.interestRate}
                onChange={(e) => updateField("interestRate", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormControl fullWidth sx={{ "& .MuiInputBase-root": fieldStyles }}>
                <InputLabel shrink>Charges</InputLabel>
                <Select
                  multiple
                  value={chargeIds}
                  onChange={(e) => setChargeIds(e.target.value as number[])}
                  input={<OutlinedInput label="Charges" notched />}
                  renderValue={(selected) => {
                    const names = chargeSetups
                      .filter((cs) => (selected as number[]).includes(cs.id))
                      .map((cs) => cs.name);
                    return names.length > 0 ? (
                      names.join(", ")
                    ) : (
                      <span style={{ color: "#888780" }}>Select Charges</span>
                    );
                  }}
                  displayEmpty
                >
                  {chargeSetups.length === 0 && <MenuItem disabled>No charges found</MenuItem>}
                  {chargeSetups.map((cs) => (
                    <MenuItem key={cs.id} value={cs.id}>
                      <MuiCheckbox checked={chargeIds.includes(cs.id)} />
                      <ListItemText primary={cs.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox checked={form.expense} onCheckedChange={(checked) => updateField("expense", !!checked)} />
                <label className="text-sm font-medium text-gray-800">Expense</label>
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-center gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-[140px] bg-[#C72030] text-white hover:bg-[#A01020]"
            >
              {submitting ? "Updating..." : "Update"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => navigate("/accounting/bill-cycles")}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AccountingBillCycleEdit;
