import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, InputLabel, Select as MuiSelect, MenuItem, TextField } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
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

interface AccountTypeOption {
  id: number;
  name: string;
}

interface AddChartOfAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editingLedger?: ChartOfAccountLedger | null;
}

export const AddChartOfAccountModal: React.FC<AddChartOfAccountModalProps> = ({
  open,
  onOpenChange,
  onSaved,
  editingLedger = null,
}) => {
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [accountTypes, setAccountTypes] = useState<AccountTypeOption[]>([]);
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
        const res = await axios.get(
          `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers/account_types.json`,
          {
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const data = res.data;
        const list: unknown[] = Array.isArray(data)
          ? data
          : data?.account_types ?? data?.lock_account_groups ?? data?.data ?? [];
        setAccountTypes(
          list.map((item) => {
            if (typeof item === "string") return { id: 0, name: item };
            const obj = item as Record<string, unknown>;
            return {
              id: Number(obj.id ?? obj.value ?? 0),
              name: String(obj.name ?? obj.group_name ?? obj.label ?? obj.id ?? ""),
            };
          })
        );
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
        Accept: "application/json",
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
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
              Account Type <span style={{ color: "#C72030" }}>*</span>
            </InputLabel>
            <MuiSelect
              value={accountTypeId}
              onChange={(e) => setAccountTypeId(e.target.value as string)}
              displayEmpty
              label="Account Type *"
              sx={fieldStyles}
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
              <MenuItem value="">
                <em>Select Account Type</em>
              </MenuItem>
              {accountTypes.map((type) => (
                <MenuItem
                  key={type.id}
                  value={String(type.id)}
                  sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                >
                  {type.name}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          <TextField
            label={<>Account Name <span style={{ color: "#C72030" }}>*</span></>}
            placeholder="Enter Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />

          <TextField
            label="Account Code"
            placeholder="Enter Account Code"
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value)}
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />

          <TextField
            label="Account Budget"
            type="number"
            placeholder="Enter Account Budget"
            value={accountBudget}
            onChange={(e) => setAccountBudget(e.target.value)}
            fullWidth
            variant="outlined"
            inputProps={{ min: 0 }}
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />

          <div>
            <div className="relative">
              <textarea
                className="peer w-full rounded-md border border-gray-300 p-3 focus:border-[#DA7756] focus:outline-none focus:ring-1 focus:ring-[#DA7756] resize-y"
                rows={4}
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setDescription(e.target.value);
                }}
                placeholder="Enter Description"
                maxLength={500}
              />
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-normal text-black/60 peer-focus:text-[#DA7756]">
                Description
              </label>
            </div>
            <div className="mt-1 text-right text-xs text-gray-400">{description.length}/500</div>
          </div>

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
