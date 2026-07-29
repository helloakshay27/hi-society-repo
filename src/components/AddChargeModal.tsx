import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { X } from "lucide-react";

interface ChargeCategoryOption {
  id: number;
  category: string;
}

interface AddChargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const AddChargeModal: React.FC<AddChargeModalProps> = ({
  open,
  onOpenChange,
  onSaved,
}) => {
  const [categories, setCategories] = useState<ChargeCategoryOption[]>([]);
  const [chargeName, setChargeName] = useState("");
  const [chargeCategoryId, setChargeCategoryId] = useState("");
  const [value, setValue] = useState("");
  const [igstRate, setIgstRate] = useState("0");
  const [cgstRate, setCgstRate] = useState("0");
  const [sgstRate, setSgstRate] = useState("0");
  const [basis, setBasis] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [uom, setUom] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchCategories = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/account/charge_setups/charge_categories.json`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        setCategories(Array.isArray(res.data?.categories) ? res.data.categories : []);
      } catch (error) {
        console.error("Error fetching charge categories:", error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, [open]);

  const resetForm = () => {
    setChargeName("");
    setChargeCategoryId("");
    setValue("");
    setIgstRate("0");
    setCgstRate("0");
    setSgstRate("0");
    setBasis("");
    setHsnCode("");
    setUom("");
    setDescription("");
  };

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!chargeName.trim()) {
      toast.error("Charge Name is required");
      return;
    }
    if (!chargeCategoryId) {
      toast.error("Charge Type is required");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const payload = {
        charge_setup: {
          name: chargeName,
          value: value !== "" ? Number(value) : null,
          charge_category_id: Number(chargeCategoryId),
          gst_applicable: true,
          basis,
          hsn_code: hsnCode,
          igst_rate: Number(igstRate) || 0,
          cgst_rate: Number(cgstRate) || 0,
          sgst_rate: Number(sgstRate) || 0,
          uom,
          description,
        },
        charge_setup_flats: [],
      };
      await axios.post(`${baseUrl}/account/charge_setups.json`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Charge created successfully");
      resetForm();
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating charge:", error);
      toast.error("Failed to create charge");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
        <div className="flex items-center justify-between bg-cyan-500 px-6 py-3">
          <h2 className="text-lg font-medium text-white">New Charge</h2>
          <button type="button" onClick={handleClose} className="text-white hover:opacity-80" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Charge Name</label>
            <Input value={chargeName} onChange={(e) => setChargeName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Charge Type</label>
            <Select value={chargeCategoryId} onValueChange={setChargeCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Value</label>
            <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Igst Rate (%)</label>
              <Input type="number" min={0} value={igstRate} onChange={(e) => setIgstRate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Cgst Rate (%)</label>
              <Input type="number" min={0} value={cgstRate} onChange={(e) => setCgstRate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Sgst Rate (%)</label>
              <Input type="number" min={0} value={sgstRate} onChange={(e) => setSgstRate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Basis</label>
              <Input value={basis} onChange={(e) => setBasis(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">HSN Code</label>
              <Input value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">UOM</label>
              <Input value={uom} onChange={(e) => setUom(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="flex justify-center border-t border-gray-200 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="min-w-[140px] bg-green-600 text-white hover:bg-green-700"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddChargeModal;
