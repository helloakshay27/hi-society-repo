import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import { Button } from "@/components/ui/button";
import { LateFeeRuleFields, LateFeeToggle, ServerErrorList } from "@/components/accounting/LateFeeRule";
import {
  BACKDATE_CONFIRM_MESSAGE,
  LATE_FEE_CHARGE_CATEGORY_ID,
  LateFeeState,
  apiErrorMessages,
  buildOverduePayload,
  emptyLateFee,
  lateFeeFromCharge,
  needsBackdateConfirm,
  validateLateFee,
  withLateFeeField,
} from "@/components/accounting/lateFeeRuleUtils";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import { API_CONFIG } from "@/config/apiConfig";
import { useAccountingEvents } from '@/components/PostHogAccountingEvents';

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

// The existing charge's breakup/ledger data isn't confirmed against a real
// GET response shape yet — try the same field-name variants the create
// payload uses, plus a couple of likely synonyms.
const extractFlatAmounts = (charge: Record<string, unknown>): Record<string, string> => {
  const list =
    (charge.charge_setup_flat as unknown[]) ??
    (charge.charge_setup_flats as unknown[]) ??
    (charge.flat_amounts as unknown[]) ??
    [];
  if (!Array.isArray(list)) return {};
  const result: Record<string, string> = {};
  list.forEach((item) => {
    const obj = item as Record<string, unknown>;
    const flatTypeId = obj.flat_type_id ?? obj.flatTypeId;
    if (flatTypeId !== undefined && flatTypeId !== null) {
      result[String(flatTypeId)] = String(obj.amount ?? "");
    }
  });
  return result;
};

const extractLedgerIds = (charge: Record<string, unknown>): number[] => {
  // Confirmed real shape: charge_setup.expense_charge.assigned_ledger_ids
  // (plain id array) / .assigned_ledgers ({id, name} objects).
  const expenseCharge = charge.expense_charge as Record<string, unknown> | undefined;
  const list =
    (expenseCharge?.assigned_ledger_ids as unknown[]) ??
    (expenseCharge?.assigned_ledgers as unknown[]) ??
    (charge.ledger_ids as unknown[]) ??
    (charge.assigned_ledgers as unknown[]) ??
    (charge.ledgers as unknown[]) ??
    [];
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => (typeof item === "object" ? Number((item as Record<string, unknown>).id) : Number(item)))
    .filter((id) => Number.isFinite(id));
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
      borderColor: "#000000",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#000000",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#000000",
    },
  },
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
    <div className="px-6 pt-[22px]">
      <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
          style={{ backgroundColor: "#F5F4F0" }}
        >
          <Receipt size={14} color="#1A1A18" />
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

const AccountingChargeEdit: React.FC = () => {
  const { onAccountingViewed, onAccountingUpdated } = useAccountingEvents();
  useEffect(() => {
    onAccountingViewed({ accounting_id: 'charge_edit', screen_name: 'AccountingChargeEdit' });
  }, [onAccountingViewed]);

  const navigate = useNavigate();
  const { id } = useParams();
  const lockAccountId = localStorage.getItem("lock_account_id");
  const [categories, setCategories] = useState<ChargeCategoryOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loadingCharge, setLoadingCharge] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flatTypeOptions, setFlatTypeOptions] = useState<FlatTypeOption[]>([]);
  const [flatTypeAmounts, setFlatTypeAmounts] = useState<Record<string, string>>({});
  const [ledgerOptions, setLedgerOptions] = useState<LedgerOption[]>([]);
  const [ledgerIds, setLedgerIds] = useState<number[]>([]);
  const [gstApplicable, setGstApplicable] = useState(false);
  const [lateFee, setLateFee] = useState<LateFeeState>(emptyLateFee);
  const [showLateFeeErrors, setShowLateFeeErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  // The charge_setup as loaded — the late fee payload only sends overdue_* fields that differ from it.
  const [originalCharge, setOriginalCharge] = useState<Record<string, unknown> | null>(null);

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

  useEffect(() => {
    if (!id) return;
    const fetchCharge = async () => {
      setLoadingCharge(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/account/charge_setups/${id}.json`, {
          params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const charge = res.data?.charge_setup || res.data;
        setForm({
          chargeName: charge.name || "",
          description: charge.description || "",
          value: charge.value !== null && charge.value !== undefined ? String(charge.value) : "",
          igstRate: charge.igst_rate !== undefined ? String(charge.igst_rate) : "",
          cgstRate: charge.cgst_rate !== undefined ? String(charge.cgst_rate) : "",
          sgstRate: charge.sgst_rate !== undefined ? String(charge.sgst_rate) : "",
          basis: charge.basis || "",
          hsnCode: charge.hsn_code || "",
          uom: charge.uom || "",
          chargeCategoryId: charge.charge_category_id ? String(charge.charge_category_id) : "",
        });
        setFlatTypeAmounts(extractFlatAmounts(charge));
        setLedgerIds(extractLedgerIds(charge));
        // Charges saved before the GST switch existed have no gst_applicable — treat any rate as GST on.
        setGstApplicable(
          charge.gst_applicable != null
            ? !!charge.gst_applicable
            : [charge.igst_rate, charge.cgst_rate, charge.sgst_rate].some((r) => Number(r) > 0)
        );
        setLateFee(lateFeeFromCharge(charge));
        setOriginalCharge(charge);
      } catch (error) {
        console.error("Error fetching charge for edit:", error);
        toast.error("Failed to load charge for editing");
      } finally {
        setLoadingCharge(false);
      }
    };
    fetchCharge();
  }, [id, lockAccountId]);

  const selectedCategory = categories.find(
    (category) => String(category.id) === form.chargeCategoryId
  );
  // const isAmountCategory = selectedCategory?.inputType === "amount";
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

  const updateLateFee = <K extends keyof LateFeeState>(field: K, value: LateFeeState[K]) => {
    setLateFee((prev) => withLateFeeField(prev, field, value));
  };

  const isLateFee = lateFee.enabled;
  const visibleLateFeeErrors = showLateFeeErrors && isLateFee ? validateLateFee(lateFee) : {};

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.chargeName.trim()) {
      toast.error("Charge Name is required");
      return;
    }
    if (isLateFee) {
      const firstError = Object.values(validateLateFee(lateFee))[0];
      if (firstError) {
        setShowLateFeeErrors(true);
        toast.error(`Late fee rule: ${firstError}`);
        return;
      }
      if (!lateFee.effectiveFrom && originalCharge?.overdue_effective_from) {
        toast.error("Effective date can't be removed while the late fee rule is on - switch the rule off instead");
        return;
      }
      if (needsBackdateConfirm(lateFee) && !window.confirm(BACKDATE_CONFIRM_MESSAGE)) return;
    } else {
      if (!form.chargeCategoryId) {
        toast.error("Charge Type is required");
        return;
      }
      if (isAmountCategory && !form.value.trim()) {
        toast.error("Value is required");
        return;
      }
      if (isExpenseBasedCategory && ledgerIds.length === 0) {
        toast.error("Please select at least one Ledger");
        return;
      }
    }

    setSubmitting(true);
    setServerErrors([]);
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
      const chargeSetup: Record<string, unknown> = {
        name: form.chargeName,
        description: form.description,
        value: isLateFee ? 0 : isAmountCategory && form.value !== "" ? Number(form.value) : null,
        charge_category_id: isLateFee ? LATE_FEE_CHARGE_CATEGORY_ID : Number(form.chargeCategoryId),
        igst_rate: Number(form.igstRate) || 0,
        cgst_rate: Number(form.cgstRate) || 0,
        sgst_rate: Number(form.sgstRate) || 0,
        hsn_code: form.hsnCode,
        gst_applicable: gstApplicable,
        basis: form.basis,
        uom: form.uom,
      };
      // Only changed overdue_* fields go out; turning the toggle off sends overdue_trigger "" to switch the rule off.
      Object.assign(chargeSetup, buildOverduePayload(lateFee, originalCharge ?? {}));
      const payload = {
        charge_setup: chargeSetup,
        ...(!isLateFee && isUnitTypeCategory ? { charge_setup_flat: chargeSetupFlat } : {}),
        ...(!isLateFee && isExpenseBasedCategory ? { ledger_ids: ledgerIds } : {}),
      };
      await axios.patch(`${baseUrl}/account/charge_setups/${id}.json`, payload, {
        params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Charge updated successfully");
      onAccountingUpdated({
        accounting_id: String(id ?? form.chargeName ?? 'charge'),
        status: 'success',
        screen_name: 'AccountingChargeEdit',
      });
      navigate("/accounting/charges");
    } catch (error) {
      console.error("Error updating charge:", error);
      const messages = apiErrorMessages(error);
      setServerErrors(messages);
      toast.error(messages[0] || "Failed to update charge");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden charge-form-page">
      <style>{`html body #root .charge-form-page .MuiFormControl-root .MuiFormLabel-asterisk { color: #000000 !important; }`}</style>
      <button
        onClick={() => navigate("/accounting/charges")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Charges
      </button>

      {loadingCharge ? (
        <div className="py-10 text-center text-brand-text-light">Loading charge...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <SectionCard title="Editing Charge">
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
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div>
                  <textarea
                    className="w-full rounded-md border border-gray-300 p-3 focus:border-[#DA7756] focus:outline-none focus:ring-1 focus:ring-[#DA7756] resize-y"
                    rows={4}
                    value={form.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) updateField("description", e.target.value);
                    }}
                    placeholder="Enter Description"
                    maxLength={500}
                  />
                </div>
                <div className="mt-1 text-right text-xs text-gray-400">{form.description.length}/500</div>
              </div>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Value"
                type="number"
                placeholder="Enter Value"
                value={form.value}
                onChange={(e) => updateField("value", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
              <TextField
                label="UOM"
                placeholder="Enter UOM"
                value={form.uom}
                onChange={(e) => updateField("uom", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
            </div> */}

            <div>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={gstApplicable}
                    onChange={(e) => setGstApplicable(e.target.checked)}
                    sx={{ "&.Mui-checked": { color: "#C72030" } }}
                  />
                }
                label={<span className="text-sm font-medium text-[#1A1A18]">GST Applicable</span>}
              />
              <p className="text-xs text-gray-500">
                GST is added to this charge only when ticked. The rate and HSN fields unlock when it is on.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField
                label="Igst Rate (%)"
                disabled={!gstApplicable}
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
                disabled={!gstApplicable}
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
                disabled={!gstApplicable}
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
                disabled={!gstApplicable}
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
              <FormControl
                fullWidth
                required={!isLateFee}
                disabled={isLateFee}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Charge Type</InputLabel>
                <Select
                  value={isLateFee ? "" : form.chargeCategoryId}
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
                {isLateFee && <FormHelperText>Not used for late fee rules. Saved as Fixed with value 0.</FormHelperText>}
              </FormControl>

              {!isLateFee && isAmountCategory && (
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

              {!isLateFee && isExpenseBasedCategory && (
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

            <LateFeeToggle
              checked={lateFee.enabled}
              onCheckedChange={(checked) => {
                setLateFee((prev) => ({ ...prev, enabled: checked }));
                setShowLateFeeErrors(false);
              }}
            />

            {!isLateFee && isUnitTypeCategory && (
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

            {isLateFee && (
              <LateFeeRuleFields
                lateFee={lateFee}
                onChange={updateLateFee}
                errors={visibleLateFeeErrors}
                fieldStyles={fieldStyles}
              />
            )}
          </SectionCard>

          <ServerErrorList messages={serverErrors} />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              disabled={submitting}
              onClick={() => navigate("/accounting/charges")}
              className="min-w-[100px] !rounded-lg !border !border-black/10 !bg-white !text-black/70 hover:!border-black/30 hover:!text-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-[140px] bg-[#C72030] text-white hover:bg-[#A01020]"
            >
              {submitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AccountingChargeEdit;
