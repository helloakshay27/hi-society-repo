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
import { Button } from "@/components/ui/button";
import { API_CONFIG } from "@/config/apiConfig";

interface ChargeCategoryOption {
  id: number;
  category: string;
}

const normalizeChargeTypeOptions = (data: unknown): ChargeCategoryOption[] => {
  const list = Array.isArray(data)
    ? data
    : (data as Record<string, unknown>)?.charge_categories ??
      (data as Record<string, unknown>)?.charge_type_options ??
      (data as Record<string, unknown>)?.categories ??
      (data as Record<string, unknown>)?.data ??
      [];
  if (!Array.isArray(list)) return [];
  return list.map((item: Record<string, unknown>) => ({
    id: Number(item.id),
    category: String(item.name ?? item.category ?? item.label ?? item.id ?? ""),
  }));
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

const AccountingChargeEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";
  const [categories, setCategories] = useState<ChargeCategoryOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loadingCharge, setLoadingCharge] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/account/charge_setups/charge_type_options.json`, {
          params: { lock_account_id: lockAccountId },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        setCategories(normalizeChargeTypeOptions(res.data));
      } catch (error) {
        console.error("Error fetching charge categories:", error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, [lockAccountId]);

  useEffect(() => {
    if (!id) return;
    const fetchCharge = async () => {
      setLoadingCharge(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/account/charge_setups/${id}.json`, {
          params: { lock_account_id: lockAccountId },
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
      } catch (error) {
        console.error("Error fetching charge for edit:", error);
        toast.error("Failed to load charge for editing");
      } finally {
        setLoadingCharge(false);
      }
    };
    fetchCharge();
  }, [id, lockAccountId]);

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.chargeName.trim()) {
      toast.error("Charge Name is required");
      return;
    }
    if (!form.chargeCategoryId) {
      toast.error("Charge Type is required");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const payload = {
        charge_setup: {
          name: form.chargeName,
          description: form.description,
          value: form.value !== "" ? Number(form.value) : null,
          charge_category_id: Number(form.chargeCategoryId),
          igst_rate: Number(form.igstRate) || 0,
          cgst_rate: Number(form.cgstRate) || 0,
          sgst_rate: Number(form.sgstRate) || 0,
          basis: form.basis,
          hsn_code: form.hsnCode,
          uom: form.uom,
        },
      };
      await axios.put(`${baseUrl}/account/charge_setups/${id}.json`, payload, {
        params: { lock_account_id: lockAccountId },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Charge updated successfully");
      navigate("/accounting/charges");
    } catch (error) {
      console.error("Error updating charge:", error);
      toast.error("Failed to update charge");
    } finally {
      setSubmitting(false);
    }
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField
                label="Igst Rate (%)"
                type="number"
                placeholder="Enter Igst Rate"
                value={form.igstRate}
                onChange={(e) => updateField("igstRate", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
              <TextField
                label="Cgst Rate (%)"
                type="number"
                placeholder="Enter Cgst Rate"
                value={form.cgstRate}
                onChange={(e) => updateField("cgstRate", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              />
              <TextField
                label="Sgst Rate (%)"
                type="number"
                placeholder="Enter Sgst Rate"
                value={form.sgstRate}
                onChange={(e) => updateField("sgstRate", e.target.value)}
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
              InputProps={{ notched: true }}
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
              <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
                <InputLabel shrink>Charge Type</InputLabel>
                <Select
                  value={form.chargeCategoryId}
                  onChange={(e) => updateField("chargeCategoryId", e.target.value as string)}
                  label="Charge Type"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Charge Type</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={String(category.id)} title={category.category}>
                      {category.category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </SectionCard>

          <div className="flex justify-start gap-3">
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
              onClick={() => navigate("/accounting/charges")}
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

export default AccountingChargeEdit;
