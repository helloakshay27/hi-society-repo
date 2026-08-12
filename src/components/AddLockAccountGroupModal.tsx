import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import { API_CONFIG } from "@/config/apiConfig";
import { X } from "lucide-react";

interface ParentGroupOption {
  id: number;
  group_name: string;
}

export interface EditableLockAccountGroup {
  id: number;
  group_name: string;
  parent_group_id?: number | null;
  locked?: boolean | null;
}

interface AddLockAccountGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editingGroup?: EditableLockAccountGroup | null;
}

// Shape returned by the dedicated GET /lock_account_groups/parent_groups
// endpoint — every group is a valid parent choice, each pre-labeled with its
// own parent ("<group_name> - <parent_group_name>").
interface ParentGroupAPI {
  id: number;
  group_name: string;
  parent_group_id?: number | null;
  parent_group_name?: string | null;
  label?: string;
}

// The 4 fundamental account types are fixed system roots that never appear as
// their own entries in GET /lock_account_groups/parent_groups, but plenty of
// real subgroups point directly to one of them as parent_group_id — without
// these, that value can't be preselected because it matches no option.
const ROOT_GROUPS: ParentGroupOption[] = [
  { id: 1, group_name: "Assets" },
  { id: 2, group_name: "Liabilities" },
  { id: 3, group_name: "Income" },
  { id: 4, group_name: "Expenditure" },
];

export const AddLockAccountGroupModal: React.FC<AddLockAccountGroupModalProps> = ({
  open,
  onOpenChange,
  onSaved,
  editingGroup = null,
}) => {
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [parentGroups, setParentGroups] = useState<ParentGroupOption[]>([]);
  const [parentGroupId, setParentGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchParentGroups = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/lock_account_groups/parent_groups`, {
          params: { lock_account_id: lockAccountId },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const groups: ParentGroupAPI[] = res.data?.lock_account_groups || [];
        const options = groups
          .filter((g) => g.id !== editingGroup?.id)
          .map((g) => ({ id: g.id, group_name: g.label || g.group_name }));
        setParentGroups([
          ...ROOT_GROUPS.filter((g) => g.id !== editingGroup?.id),
          ...options,
        ]);
      } catch (error) {
        console.error("Error fetching parent groups:", error);
        setParentGroups([]);
      }
    };
    fetchParentGroups();
  }, [open, lockAccountId, editingGroup]);

  useEffect(() => {
    if (editingGroup) {
      setParentGroupId(editingGroup.parent_group_id ? String(editingGroup.parent_group_id) : "");
      setGroupName(editingGroup.group_name || "");
      setLocked(Boolean(editingGroup.locked));
    } else if (open) {
      setParentGroupId("");
      setGroupName("");
      setLocked(false);
    }
  }, [open, editingGroup]);

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      toast.error("Group Name is required");
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
      if (editingGroup) {
        const payload = {
          lock_account_group: {
            group_name: groupName.trim(),
            parent_group_id: parentGroupId ? Number(parentGroupId) : null,
            locked,
          },
        };
        await axios.patch(`${baseUrl}/lock_account_groups/${editingGroup.id}`, payload, { headers });
        toast.success("Group updated successfully");
      } else {
        const payload = {
          lock_account_group: {
            lock_account_id: lockAccountId,
            group_name: groupName.trim(),
            parent_group_id: parentGroupId ? Number(parentGroupId) : null,
            locked,
            credit_rule: "-",
            debit_rule: "+",
            active: true,
          },
        };
        await axios.post(`${baseUrl}/lock_account_groups`, payload, { headers });
        toast.success("Group created successfully");
      }
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving group:", error);
      const apiErrors = error?.response?.data?.errors;
      const apiError = error?.response?.data?.error;
      const message = Array.isArray(apiErrors)
        ? apiErrors.join(", ")
        : apiError || "Failed to save group";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} modal={false} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {editingGroup ? "Edit Lock Account Group" : "New Lock Account Group"}
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
          <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
            <legend className="px-1 text-gray-500 font-medium text-sm">Parent Group</legend>
            <FormControl variant="standard" fullWidth>
              <Select
                value={parentGroupId}
                onChange={(e) => setParentGroupId(e.target.value as string)}
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
                    style: { ...menuProps.PaperProps.style, maxHeight: 300, maxWidth: 420 },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select Group
                </MenuItem>
                {parentGroups.map((group) => (
                  <MenuItem
                    key={group.id}
                    value={String(group.id)}
                    sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                  >
                    {group.group_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </fieldset>

          <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
            <legend className="px-1 text-gray-500 font-medium text-sm">
              Group Name <span className="text-red-500">*</span>
            </legend>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter Group Name"
              className="h-9 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:outline-none"
            />
          </fieldset>

          <div className="flex items-center gap-2">
            <Checkbox
              id="lockAccountGroupLocked"
              checked={locked}
              onCheckedChange={(checked) => setLocked(Boolean(checked))}
            />
            <label htmlFor="lockAccountGroupLocked" className="text-sm font-medium text-gray-800">
              Locked
            </label>
          </div>

        </div>

        <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
          >
            {submitting
              ? editingGroup
                ? "Updating..."
                : "Submitting..."
              : editingGroup
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLockAccountGroupModal;
