import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@mui/material";
import { fieldStyles } from "@/components/ticket-management/fieldStyles";
import { API_CONFIG } from "@/config/apiConfig";
import { X } from "lucide-react";

const getTodayStr = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export interface CostCentre {
  id: number;
  name: string;
  active?: boolean;
  start_date?: string;
  end_date?: string;
  yearly_budget?: number | string;
}

interface AddCostCentreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editingCostCentre?: CostCentre | null;
  readOnly?: boolean;
}

export const AddCostCentreModal: React.FC<AddCostCentreModalProps> = ({
  open,
  onOpenChange,
  onSaved,
  editingCostCentre = null,
  readOnly = false,
}) => {
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetStart, setBudgetStart] = useState("");
  const [budgetEnd, setBudgetEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const todayStr = getTodayStr();

  useEffect(() => {
    if (editingCostCentre) {
      setName(editingCostCentre.name || "");
      setBudget(String(editingCostCentre.yearly_budget ?? ""));
      setBudgetStart(editingCostCentre.start_date || "");
      setBudgetEnd(editingCostCentre.end_date || "");
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
    if (!budget.trim() || Number(budget) < 0) {
      toast.error("Budget is required");
      return;
    }
    if (!budgetStart) {
      toast.error("Budget Start date is required");
      return;
    }
    if (!budgetEnd) {
      toast.error("Budget End date is required");
      return;
    }
    if (budgetStart < todayStr) {
      toast.error("Budget Start date cannot be a back date");
      return;
    }
    if (budgetEnd < todayStr) {
      toast.error("Budget End date cannot be a back date");
      return;
    }
    if (budgetEnd < budgetStart) {
      toast.error("Budget End date cannot be before Budget Start date");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const params = { lock_account_id: lockAccountId };
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const costCentre: Record<string, unknown> = {
        name: name.trim(),
        active: editingCostCentre?.active ?? true,
        start_date: budgetStart || null,
        end_date: budgetEnd || null,
        yearly_budget: budget || null,
      };

      const lockBudget = budget
        ? { budget, start_date: budgetStart || null, end_date: budgetEnd || null }
        : undefined;

      if (editingCostCentre) {
        await axios.patch(
          `${baseUrl}/cost_centres/${editingCostCentre.id}.json`,
          { cost_centre: costCentre, ...(lockBudget ? { lock_budget: lockBudget } : {}) },
          { params, headers }
        );
        toast.success("Cost Centre updated successfully");
      } else {
        await axios.post(
          `${baseUrl}/cost_centres.json`,
          {
            cost_centre: { ...costCentre, lock_account_id: lockAccountId },
            ...(lockBudget ? { lock_budget: lockBudget } : {}),
          },
          { params, headers }
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
    <Dialog open={open} modal={false} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {readOnly ? "View Account" : editingCostCentre ? "Edit Account" : "New Account"}
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
          <TextField
            label={<>Cost Centre Name <span style={{ color: "#C72030" }}>*</span></>}
            placeholder="Enter Cost Centre Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={readOnly}
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />

          <TextField
            label={<>Budget <span style={{ color: "#C72030" }}>*</span></>}
            type="number"
            placeholder="Enter Budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={readOnly}
            fullWidth
            variant="outlined"
            inputProps={{ min: 0 }}
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />

          <TextField
            label={<>Budget Start <span style={{ color: "#C72030" }}>*</span></>}
            type="date"
            value={budgetStart}
            onChange={(e) => setBudgetStart(e.target.value)}
            disabled={readOnly}
            fullWidth
            variant="outlined"
            inputProps={{ min: todayStr }}
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />

          <TextField
            label={<>Budget End <span style={{ color: "#C72030" }}>*</span></>}
            type="date"
            value={budgetEnd}
            onChange={(e) => setBudgetEnd(e.target.value)}
            disabled={readOnly}
            fullWidth
            variant="outlined"
            inputProps={{ min: budgetStart || todayStr }}
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />
        </div>

        <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-200">
          {readOnly ? (
            <Button
              onClick={handleClose}
              className="px-6 sm:px-8 w-full sm:w-auto !bg-white border !border-[#da7756] !text-[#da7756] h-10"
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
              >
                {submitting
                  ? editingCostCentre
                    ? "Updating..."
                    : "Submitting..."
                  : editingCostCentre
                  ? "Update"
                  : "Submit"}
              </Button>
              <Button
                onClick={handleClose}
                disabled={submitting}
                className="px-6 sm:px-8 w-full sm:w-auto !bg-white border !border-[#da7756] !text-[#da7756] h-10"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCostCentreModal;
