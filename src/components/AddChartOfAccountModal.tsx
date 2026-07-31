import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_CONFIG } from "@/config/apiConfig";
import { X } from "lucide-react";

export interface ChartOfAccountLedger {
  id: number;
  name: string;
  account_code?: string;
  lock_account_group_id?: number;
  budget?: number | string;
  budget_start_date?: string;
  budget_end_date?: string;
  description?: string;
  watchlist?: boolean;
  allow_cost_center?: boolean;
}

interface AccountGroupOption {
  id: number;
  group_name: string;
}

interface AddChartOfAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editingLedger?: ChartOfAccountLedger | null;
}

const flattenGroups = (groups: any[], prefix = ""): AccountGroupOption[] => {
  let result: AccountGroupOption[] = [];
  for (const group of groups) {
    result.push({ id: group.id, group_name: prefix + group.group_name });
    if (group.children && group.children.length > 0) {
      result = result.concat(
        flattenGroups(group.children, `${prefix}${group.group_name} > `)
      );
    }
  }
  return result;
};

export const AddChartOfAccountModal: React.FC<AddChartOfAccountModalProps> = ({
  open,
  onOpenChange,
  onSaved,
  editingLedger = null,
}) => {
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [accountTypes, setAccountTypes] = useState<AccountGroupOption[]>([]);
  const [accountTypeId, setAccountTypeId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [accountBudget, setAccountBudget] = useState("");
  const [budgetStart, setBudgetStart] = useState("");
  const [budgetEnd, setBudgetEnd] = useState("");
  const [description, setDescription] = useState("");
  const [addToWatchlist, setAddToWatchlist] = useState(false);
  const [allowCostCenter, setAllowCostCenter] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchAccountTypes = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(
          `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_groups?format=flat`,
          { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        );
        const groups = res.data?.data || [];
        setAccountTypes(flattenGroups(groups));
      } catch (error) {
        console.error("Error fetching account types:", error);
        setAccountTypes([]);
      }
    };
    fetchAccountTypes();
  }, [open, lockAccountId]);

  useEffect(() => {
    if (editingLedger) {
      setAccountTypeId(
        editingLedger.lock_account_group_id ? String(editingLedger.lock_account_group_id) : ""
      );
      setAccountName(editingLedger.name || "");
      setAccountCode(editingLedger.account_code || "");
      setAccountBudget(String(editingLedger.budget ?? ""));
      setBudgetStart(editingLedger.budget_start_date || "");
      setBudgetEnd(editingLedger.budget_end_date || "");
      setDescription(editingLedger.description || "");
      setAddToWatchlist(Boolean(editingLedger.watchlist));
      setAllowCostCenter(Boolean(editingLedger.allow_cost_center));
    } else if (open) {
      setAccountTypeId("");
      setAccountName("");
      setAccountCode("");
      setAccountBudget("");
      setBudgetStart("");
      setBudgetEnd("");
      setDescription("");
      setAddToWatchlist(false);
      setAllowCostCenter(false);
    }
  }, [editingLedger, open]);

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!accountTypeId) {
      toast.error("Account Type is required");
      return;
    }
    if (!accountName.trim()) {
      toast.error("Account Name is required");
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
        lock_account_ledger: {
          lock_account_id: lockAccountId,
          name: accountName,
          lock_account_group_id: accountTypeId,
          account_code: accountCode,
          budget: accountBudget,
          budget_start_date: budgetStart,
          budget_end_date: budgetEnd,
          description,
          watchlist: addToWatchlist,
          allow_cost_center: allowCostCenter,
          active: true,
        },
      };

      if (editingLedger) {
        await axios.patch(
          `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers/${editingLedger.id}.json`,
          payload,
          { headers }
        );
        toast.success("Account updated successfully");
      } else {
        await axios.post(
          `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers.json`,
          payload,
          { headers }
        );
        toast.success("Account created successfully");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Failed to save account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {editingLedger ? "Edit Account" : "New Account"}
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

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Account Type</label>
            <Select value={accountTypeId} onValueChange={setAccountTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.group_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Account Name</label>
            <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Account Code</label>
            <Input value={accountCode} onChange={(e) => setAccountCode(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Account Budget</label>
            <Input
              type="number"
              min={0}
              value={accountBudget}
              onChange={(e) => setAccountBudget(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Budget Start</label>
            <Input type="date" value={budgetStart} onChange={(e) => setBudgetStart(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Budget End</label>
            <Input type="date" value={budgetEnd} onChange={(e) => setBudgetEnd(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-gray-800">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2 pl-0 sm:pl-[172px]">
            <Checkbox
              id="addToWatchlist"
              checked={addToWatchlist}
              onCheckedChange={(checked) => setAddToWatchlist(Boolean(checked))}
            />
            <label htmlFor="addToWatchlist" className="text-sm font-medium text-gray-800">
              Add to the watchlist on my dashboard
            </label>
          </div>

          <div className="flex items-center gap-2 pl-0 sm:pl-[172px]">
            <Checkbox
              id="allowCostCenter"
              checked={allowCostCenter}
              onCheckedChange={(checked) => setAllowCostCenter(Boolean(checked))}
            />
            <label htmlFor="allowCostCenter" className="text-sm font-medium text-gray-800">
              Allow Cost Center
            </label>
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

export default AddChartOfAccountModal;
