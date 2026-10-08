import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Receipt } from "lucide-react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import { Button } from "@/components/ui/button";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import { API_CONFIG } from "@/config/apiConfig";

// input_type drives which extra field(s) render for the selected charge type:
// "amount" -> a single Value field, "flat_amounts" -> a per-flat-type breakup
// table, "ledger_select" -> a multi-select of expense ledgers.
interface ChargeCategoryOption {
  id: number;
  category: string;
  inputType: string;
}

interface FlatTypeOption {
  id: number;
  label: string;
}

interface LedgerOption {
  id: number;
  label: string;
}

// GET /account/charge_setups/charge_type_options.json bundles all three lists
// (charge_categories, flat_types, expense_ledgers) into one response.
const normalizeChargeTypeOptionsResponse = (
  data: unknown
): { categories: ChargeCategoryOption[]; flatTypes: FlatTypeOption[]; ledgers: LedgerOption[] } => {
  const obj = (data as Record<string, unknown>) ?? {};
  const categoryList = Array.isArray(obj.charge_categories) ? obj.charge_categories : [];
  const flatTypeList = Array.isArray(obj.flat_types) ? obj.flat_types : [];
  const ledgerList = Array.isArray(obj.expense_ledgers) ? obj.expense_ledgers : [];

  return {
    categories: categoryList.map((item: Record<string, unknown>) => ({
      id: Number(item.id),
      category: String(item.category ?? item.name ?? item.label ?? item.id ?? ""),
      inputType: String(item.input_type ?? ""),
    })),
    flatTypes: flatTypeList.map((item: Record<string, unknown>) => ({
      id: Number(item.id),
      label: String(item.name ?? item.society_flat_type ?? item.id ?? ""),
    })),
    ledgers: ledgerList.map((item: Record<string, unknown>) => ({
      id: Number(item.id),
      label: String(item.label ?? item.name ?? item.id ?? ""),
    })),
  };
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
          <Receipt size={16} color="var(--color-primary,#da7756)" />
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </div>
);

const emptyForm = {
  chargeName: "",
  description: "",
  value: "",
  igstRate: "",
  cgstRate: "",
  sgstRate: "",
  basis: "",
  hsnCode: "",
  uom: "",
  chargeCategoryId: "",
};

const AccountingChargeCreation: React.FC = () => {
  const navigate = useNavigate();
  const lockAccountId = localStorage.getItem("lock_account_id");
  const [categories, setCategories] = useState<ChargeCategoryOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [flatTypeOptions, setFlatTypeOptions] = useState<FlatTypeOption[]>([]);
  const [flatTypeAmounts, setFlatTypeAmounts] = useState<Record<string, string>>({});
  const [ledgerOptions, setLedgerOptions] = useState<LedgerOption[]>([]);
  const [ledgerIds, setLedgerIds] = useState<number[]>([]);

  // charge_type_options.json bundles charge_categories, flat_types, and
  // expense_ledgers into a single response — fetch once and derive whichever
  // extra field the selected category needs from what's already in memory.
  useEffect(() => {
    // Guard against a stale response (e.g. React StrictMode's double-invoke
    // in dev, or a fast remount) landing after a newer one and wiping out
    // the options that were just rendered — this was showing as ledger
    // options flashing in then disappearing a second later.
    let ignore = false;
    const fetchChargeTypeOptions = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/account/charge_setups/charge_type_options.json`, {
          params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (ignore) return;
        const { categories: fetchedCategories, flatTypes, ledgers } =
          normalizeChargeTypeOptionsResponse(res.data);
        setCategories(fetchedCategories);
        setFlatTypeOptions(flatTypes);
        setLedgerOptions(ledgers);
      } catch (error) {
        if (ignore) return;
        console.error("Error fetching charge type options:", error);
        setCategories([]);
        setFlatTypeOptions([]);
        setLedgerOptions([]);
      }
    };
    fetchChargeTypeOptions();
    return () => {
      ignore = true;
    };
  }, [lockAccountId]);

  const selectedCategory = categories.find(
    (category) => String(category.id) === form.chargeCategoryId
  );
  const isAmountCategory =
    selectedCategory?.inputType === "amount" &&
    selectedCategory.category !== "No. of Water Inlets";
  const isUnitTypeCategory = selectedCategory?.inputType === "flat_amounts";
  const isExpenseBasedCategory = selectedCategory?.inputType === "ledger_select";

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChargeCategoryChange = (value: string) => {
    // Switching charge type invalidates whichever value the previous type
    // captured (flat amount / per-flat-type breakup / ledger) — clear all of
    // them so a stale value can't be submitted under the new type.
    setForm((prev) => ({ ...prev, chargeCategoryId: value, value: "" }));
    setFlatTypeAmounts({});
    setLedgerIds([]);
  };

  const save = async (): Promise<boolean> => {
    if (!form.chargeName.trim()) {
      toast.error("Charge Name is required");
      return false;
    }
    if (!form.chargeCategoryId) {
      toast.error("Charge Type is required");
      return false;
    }
    if (isAmountCategory && !form.value.trim()) {
      toast.error("Value is required");
      return false;
    }
    if (isExpenseBasedCategory && ledgerIds.length === 0) {
      toast.error("Please select at least one Ledger");
      return false;
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const chargeSetupFlat = isUnitTypeCategory
        ? Object.entries(flatTypeAmounts)
            .filter(([, amount]) => amount !== "")
            .map(([flatTypeId, amount]) => ({
              flat_type_id: Number(flatTypeId),
              amount: Number(amount),
            }))
        : [];
      const payload = {
        charge_setup: {
          name: form.chargeName,
          description: form.description,
          value: isAmountCategory && form.value !== "" ? Number(form.value) : null,
          charge_category_id: Number(form.chargeCategoryId),
          igst_rate: Number(form.igstRate) || 0,
          cgst_rate: Number(form.cgstRate) || 0,
          sgst_rate: Number(form.sgstRate) || 0,
          basis: form.basis,
          hsn_code: form.hsnCode,
          uom: form.uom,
          active: 1,
        },
        ...(isUnitTypeCategory ? { charge_setup_flat: chargeSetupFlat } : {}),
        ...(isExpenseBasedCategory ? { ledger_ids: ledgerIds } : {}),
      };
      await axios.post(`${baseUrl}/account/charge_setups.json`, payload, {
        params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Charge created successfully");
      return true;
    } catch (error) {
      console.error("Error creating charge:", error);
      toast.error("Failed to create charge");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await save();
    if (ok) navigate("/accounting/charges");
  };

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden charge-form-page">
      <style>{`.charge-form-page .MuiFormLabel-asterisk { color: #da7756 !important; }`}</style>
      <button
        onClick={() => navigate("/accounting/charges")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Charges
      </button>

      <form onSubmit={handleSave} className="space-y-6">
        <SectionCard title="Charge Setup">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 items-start">
            <TextField
              label="Charge Name"
              required
              placeholder="Enter Charge Name"
              value={form.chargeName}
              onChange={(e) => updateField("chargeName", e.target.value)}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
            <div>
              <div className="relative">
                <textarea
                  className="peer w-full rounded-md border border-gray-300 p-3 focus:border-[#DA7756] focus:outline-none focus:ring-1 focus:ring-[#DA7756] resize-y"
                  rows={4}
                  value={form.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) updateField("description", e.target.value);
                  }}
                  placeholder="Enter Description"
                  maxLength={500}
                />
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-normal text-black/60 peer-focus:text-[#DA7756]">
                  Description
                </label>
              </div>
              <div className="mt-1 text-right text-xs text-gray-400">{form.description.length}/500</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Igst Rate (%)"
              type="number"
              placeholder="Enter Igst Rate"
              value={form.igstRate}
              onChange={(e) => {
                if (e.target.value.startsWith("-")) return;
                updateField("igstRate", e.target.value);
              }}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              inputProps={{ min: 0, step: "0.01", onKeyDown: (e) => { if (e.key === "-") e.preventDefault(); } }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
            <TextField
              label="Cgst Rate (%)"
              type="number"
              placeholder="Enter Cgst Rate"
              value={form.cgstRate}
              onChange={(e) => {
                if (e.target.value.startsWith("-")) return;
                updateField("cgstRate", e.target.value);
              }}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              inputProps={{ min: 0, step: "0.01", onKeyDown: (e) => { if (e.key === "-") e.preventDefault(); } }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
            <TextField
              label="Sgst Rate (%)"
              type="number"
              placeholder="Enter Sgst Rate"
              value={form.sgstRate}
              onChange={(e) => {
                if (e.target.value.startsWith("-")) return;
                updateField("sgstRate", e.target.value);
              }}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              inputProps={{ min: 0, step: "0.01", onKeyDown: (e) => { if (e.key === "-") e.preventDefault(); } }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <TextField
              label="Basis"
              placeholder="Enter Basis"
              value={form.basis}
              onChange={(e) => updateField("basis", e.target.value)}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
            <TextField
              label="HSN Code"
              placeholder="Enter HSN Code"
              value={form.hsnCode}
              onChange={(e) => updateField("hsnCode", e.target.value)}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
              sx={{ "& .MuiInputBase-root": fieldStyles }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
              <InputLabel shrink>Charge Type</InputLabel>
              <Select
                value={form.chargeCategoryId}
                onChange={(e) => handleChargeCategoryChange(e.target.value as string)}
                label="Charge Type"
                notched
                displayEmpty
                MenuProps={menuProps}
              >
                <MenuItem value="">Select Charge Type</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={String(category.id)} title={category.category}>
                    {category.category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {isAmountCategory && (
              <TextField
                label="Value"
                required
                type="number"
                placeholder="Enter Value"
                value={form.value}
                onChange={(e) => {
                  if (e.target.value.startsWith("-")) return;
                  updateField("value", e.target.value);
                }}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ notched: true }}
                inputProps={{ min: 0, step: "0.01", onKeyDown: (e) => { if (e.key === "-") e.preventDefault(); } }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
            )}

            {isExpenseBasedCategory && (
              <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
                <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                  Select Ledger
                </InputLabel>
                <Select
                  multiple
                  value={ledgerIds.map(String)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLedgerIds((Array.isArray(value) ? value : [value]).map(Number));
                  }}
                  displayEmpty
                  label="Select Ledger"
                  renderValue={(selected) => {
                    const ids = (selected as string[]).map(Number);
                    const labels = ledgerOptions
                      .filter((ledger) => ids.includes(ledger.id))
                      .map((ledger) => ledger.label);
                    return labels.length > 0 ? labels.join(", ") : "Select Ledger";
                  }}
                  MenuProps={{
                    ...menuProps,
                    anchorOrigin: { vertical: "bottom", horizontal: "left" },
                    transformOrigin: { vertical: "top", horizontal: "left" },
                    PaperProps: {
                      ...menuProps.PaperProps,
                      style: { ...menuProps.PaperProps.style, maxHeight: 300 },
                      sx: {
                        width: "min(464px, calc(100vw - 3rem))",
                        maxWidth: "calc(100vw - 3rem)",
                        boxSizing: "border-box",
                      },
                    },
                    MenuListProps: {
                      sx: {
                        "& .MuiMenuItem-root": {
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        },
                      },
                    },
                  }}
                >
                  {ledgerOptions.map((ledger) => (
                    <MenuItem
                      key={ledger.id}
                      value={String(ledger.id)}
                      sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                    >
                      <Checkbox checked={ledgerIds.includes(ledger.id)} sx={{ mr: 1 }} />
                      <ListItemText primary={ledger.label} sx={{ "& .MuiTypography-root": { whiteSpace: "normal", wordBreak: "break-word" } }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </div>

          {isUnitTypeCategory && (
            <div className="overflow-x-auto">
              {flatTypeOptions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No flat types configured yet. Add them from Manage Flats → Configure Flat Type.
                </p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      {flatTypeOptions.map((flatType) => (
                        <th
                          key={flatType.id}
                          className="border border-gray-300 px-3 py-2 text-left font-semibold"
                        >
                          {flatType.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {flatTypeOptions.map((flatType) => (
                        <td key={flatType.id} className="border border-gray-300 px-2 py-2">
                          <TextField
                            type="number"
                            placeholder="Enter Amount"
                            value={flatTypeAmounts[flatType.id] || ""}
                            onChange={(e) => {
                              if (e.target.value.startsWith("-")) return;
                              setFlatTypeAmounts((prev) => ({
                                ...prev,
                                [flatType.id]: e.target.value,
                              }));
                            }}
                            variant="outlined"
                            fullWidth
                            size="small"
                            inputProps={{
                              min: 0,
                              step: "0.01",
                              onKeyDown: (e) => { if (e.key === "-") e.preventDefault(); },
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </SectionCard>

        <div className="flex justify-center gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="min-w-[140px] bg-[#C72030] text-white hover:bg-[#A01020]"
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => navigate("/accounting/charges")}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AccountingChargeCreation;
