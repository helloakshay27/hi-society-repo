import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const FieldsetField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ label, required, children, className }) => (
  <fieldset
    className={`rounded border border-[#ddd] px-3 pb-1 pt-0 focus-within:border-[#da7756] ${className || ""}`}
  >
    <legend className="px-1 text-sm font-medium text-gray-500">
      {label}
      {required ? <span className="text-red-500"> *</span> : null}
    </legend>
    {children}
  </fieldset>
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
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";
  const [categories, setCategories] = useState<ChargeCategoryOption[]>([]);
  const [form, setForm] = useState(emptyForm);
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

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
          active: 1,
        },
      };
      await axios.post(`${baseUrl}/account/charge_setups.json`, payload, {
        params: { lock_account_id: lockAccountId },
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

  const handleSaveAndConfigureNew = async () => {
    const ok = await save();
    if (ok) setForm(emptyForm);
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <button
        onClick={() => navigate("/accounting/charges")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Charges
      </button>

      <div className="mb-6">
        <h1 className="text-brand-h2 font-semibold text-brand-text">Add Charge</h1>
      </div>

      <form onSubmit={handleSave}>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
          <FieldsetField label="Charge Name" required>
            <Input
              placeholder="Enter Charge Name"
              value={form.chargeName}
              onChange={(e) => updateField("chargeName", e.target.value)}
              className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
          <FieldsetField label="Description" className="row-span-2">
            <Textarea
              placeholder="Enter Description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="border-0 px-0 shadow-none resize-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
        </div>

        {/* <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldsetField label="Value">
            <Input
              type="number"
              min={0}
              placeholder="Enter Value"
              value={form.value}
              onChange={(e) => updateField("value", e.target.value)}
              className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
          <FieldsetField label="UOM">
            <Input
              placeholder="Enter UOM"
              value={form.uom}
              onChange={(e) => updateField("uom", e.target.value)}
              className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
        </div> */}

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FieldsetField label="Igst Rate (%)">
            <Input
              type="number"
              min={0}
              placeholder="Enter Igst Rate"
              value={form.igstRate}
              onChange={(e) => updateField("igstRate", e.target.value)}
              className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
          <FieldsetField label="Cgst Rate (%)">
            <Input
              type="number"
              min={0}
              placeholder="Enter Cgst Rate"
              value={form.cgstRate}
              onChange={(e) => updateField("cgstRate", e.target.value)}
              className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
          <FieldsetField label="Sgst Rate (%)">
            <Input
              type="number"
              min={0}
              placeholder="Enter Sgst Rate"
              value={form.sgstRate}
              onChange={(e) => updateField("sgstRate", e.target.value)}
              className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 items-start">
          <FieldsetField label="Basis">
            <Input
              placeholder="Enter Basis"
              value={form.basis}
              onChange={(e) => updateField("basis", e.target.value)}
              className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
          <FieldsetField label="HSN Code">
            <Input
              placeholder="Enter HSN Code"
              value={form.hsnCode}
              onChange={(e) => updateField("hsnCode", e.target.value)}
              className="h-9 border-0 px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />
          </FieldsetField>
          <FieldsetField label="Charge Type" required>
            <FormControl variant="standard" fullWidth>
              <Select
                value={form.chargeCategoryId}
                onChange={(e) => updateField("chargeCategoryId", e.target.value as string)}
                displayEmpty
                disableUnderline
                sx={{
                  height: 36,
                  outline: "none",
                  "& .MuiSelect-select": {
                    paddingLeft: 0,
                    color: form.chargeCategoryId ? "#2c2c2c" : "#888780",
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
                  Select Charge Type
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem
                    key={category.id}
                    value={String(category.id)}
                    sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={category.category}
                  >
                    {category.category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FieldsetField>
        </div>

        <div className="sticky bottom-0 -mx-2 sm:-mx-4 lg:-mx-6 flex justify-start gap-3 border-t border-brand-border bg-white px-2 py-4 sm:px-4 lg:px-6">
          <Button
            type="submit"
            variant="ghost"
            disabled={submitting}
            className="btn-primary min-w-[140px] h-9 px-4 text-sm font-medium"
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
          {/* <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={handleSaveAndConfigureNew}
            className="h-9 !bg-[#3b82c4] px-4 text-sm font-medium !text-white hover:!bg-[#2f6ba3]"
          >
            Save &amp; Configure New Charge
          </Button> */}
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => navigate("/accounting/charges")}
            className="h-9 !bg-white border !border-[#da7756] !text-[#da7756] px-4 text-sm font-medium"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AccountingChargeCreation;
