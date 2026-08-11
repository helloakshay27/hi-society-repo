import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import { API_CONFIG } from "@/config/apiConfig";
import { X } from "lucide-react";

export interface ChartOfAccountLedger {
  id: number;
  name: string;
  account_code?: string;
  lock_account_group_id?: number;
  budget?: number | string;
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

interface AccountGroupAPI {
  id: number;
  group_name: string;
  parent_group_id?: number | null;
}

// lock_account_groups comes back as a flat list (parent_group_id links to a
// parent) rather than nested, so build each option's display name by walking
// its ancestor chain.
const flattenGroups = (groups: AccountGroupAPI[]): AccountGroupOption[] => {
  const byId = new Map(groups.map((g) => [g.id, g]));
  const nameWithAncestry = (group: AccountGroupAPI): string => {
    const names: string[] = [group.group_name];
    const seen = new Set<number>([group.id]);
    let parentId = group.parent_group_id;
    while (parentId && byId.has(parentId) && !seen.has(parentId)) {
      const parent = byId.get(parentId)!;
      names.unshift(parent.group_name);
      seen.add(parentId);
      parentId = parent.parent_group_id;
    }
    return names.join(" > ");
  };
  return groups.map((g) => ({ id: g.id, group_name: nameWithAncestry(g) }));
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
        const res = await axios.get(`${baseUrl}/lock_account_groups`, {
          params: { lock_account_id: lockAccountId },
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const groups: AccountGroupAPI[] = res.data?.lock_account_groups || [];
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
      setDescription(editingLedger.description || "");
      setAddToWatchlist(Boolean(editingLedger.watchlist));
      setAllowCostCenter(Boolean(editingLedger.allow_cost_center));
    } else if (open) {
      setAccountTypeId("");
      setAccountName("");
      setAccountCode("");
      setAccountBudget("");
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

      if (editingLedger) {
        const payload = {
          lock_account_ledger: {
            name: accountName,
            lock_account_group_id: Number(accountTypeId),
            account_code: accountCode || null,
            description: description || null,
            budget: accountBudget || null,
            watchlist: addToWatchlist,
            assoc_cost_centre: allowCostCenter,
          },
        };
        await axios.patch(
          `${baseUrl}/lock_account_ledgers/${editingLedger.id}`,
          payload,
          { headers }
        );
        toast.success("Account updated successfully");
      } else {
        const payload = {
          lock_account_ledger: {
            lock_account_id: lockAccountId,
            lock_account_group_id: Number(accountTypeId),
            name: accountName,
            account_code: accountCode || null,
            description: description || null,
            budget: accountBudget || null,
            watchlist: addToWatchlist,
            assoc_cost_centre: allowCostCenter,
            active: true,
          },
        };
        await axios.post(`${baseUrl}/lock_account_ledgers`, payload, { headers });
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
    <Dialog open={open} modal={false} onOpenChange={handleClose}>
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
          <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
            <legend className="px-1 text-gray-500 font-medium text-sm">
              Account Type <span className="text-red-500">*</span>
            </legend>
            <FormControl variant="standard" fullWidth>
              <Select
                value={accountTypeId}
                onChange={(e) => setAccountTypeId(e.target.value as string)}
                displayEmpty
                disableUnderline
                sx={{
                  height: 36,
                  outline: "none",
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
                  Select Account Type
                </MenuItem>
                {accountTypes.map((type) => (
                  <MenuItem key={type.id} value={String(type.id)}>
                    {type.group_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </fieldset>

          <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
            <legend className="px-1 text-gray-500 font-medium text-sm">
              Account Name <span className="text-red-500">*</span>
            </legend>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter Account Name"
              className="h-9 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:outline-none"
            />
          </fieldset>

          <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
            <legend className="px-1 text-gray-500 font-medium text-sm">Account Code</legend>
            <Input
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value)}
              placeholder="Enter Account Code"
              className="h-9 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:outline-none"
            />
          </fieldset>

          <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
            <legend className="px-1 text-gray-500 font-medium text-sm">Account Budget</legend>
            <Input
              type="number"
              min={0}
              value={accountBudget}
              onChange={(e) => setAccountBudget(e.target.value)}
              placeholder="Enter Account Budget"
              className="h-9 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:outline-none"
            />
          </fieldset>

          <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
            <legend className="px-1 text-gray-500 font-medium text-sm">Description</legend>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Enter Description"
              className="border-0 shadow-none px-0 resize-none focus-visible:ring-0 focus-visible:outline-none"
            />
          </fieldset>

          <div className="flex items-center gap-2">
            <Checkbox
              id="addToWatchlist"
              checked={addToWatchlist}
              onCheckedChange={(checked) => setAddToWatchlist(Boolean(checked))}
            />
            <label htmlFor="addToWatchlist" className="text-sm font-medium text-gray-800">
              Add to the watchlist on my dashboard
            </label>
          </div>

          <div className="flex items-center gap-2">
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
