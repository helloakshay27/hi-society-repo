import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_CONFIG } from "@/config/apiConfig";
import { X } from "lucide-react";

export interface CostCentre {
  id: number;
  name: string;
  budget?: number | string;
  budget_start_date?: string;
  budget_end_date?: string;
}

interface AddCostCentreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editingCostCentre?: CostCentre | null;
}

export const AddCostCentreModal: React.FC<AddCostCentreModalProps> = ({
  open,
  onOpenChange,
  onSaved,
  editingCostCentre = null,
}) => {
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetStart, setBudgetStart] = useState("");
  const [budgetEnd, setBudgetEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCostCentre) {
      setName(editingCostCentre.name || "");
      setBudget(String(editingCostCentre.budget ?? ""));
      setBudgetStart(editingCostCentre.budget_start_date || "");
      setBudgetEnd(editingCostCentre.budget_end_date || "");
    } else if (open) {
      setName("");
      setBudget("");
      setBudgetStart("");
      setBudgetEnd("");
    }
  }, [editingCostCentre, open]);

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Cost Centre Name is required");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const payload = {
        lock_account_cost_centre: {
          name: name.trim(),
          budget,
          budget_start_date: budgetStart,
          budget_end_date: budgetEnd,
          active: true,
        },
      };

      if (editingCostCentre) {
        await axios.patch(
          `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_cost_centres/${editingCostCentre.id}.json`,
          payload,
          { headers }
        );
        toast.success("Cost Centre updated successfully");
      } else {
        await axios.post(
          `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_cost_centres.json`,
          payload,
          { headers }
        );
        toast.success("Cost Centre created successfully");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving cost centre:", error);
      toast.error("Failed to save cost centre");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {editingCostCentre ? "Edit Account" : "New Account"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Cost Centre Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Budget</label>
            <Input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Budget Start</label>
            <Input type="date" value={budgetStart} onChange={(e) => setBudgetStart(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Budget End</label>
            <Input type="date" value={budgetEnd} onChange={(e) => setBudgetEnd(e.target.value)} />
          </div>

        </div>

        <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
          <Button
            onClick={handleClose}
            disabled={submitting}
            className="px-6 sm:px-8 w-full sm:w-auto !bg-white border !border-[#da7756] !text-[#da7756] h-10"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCostCentreModal;
