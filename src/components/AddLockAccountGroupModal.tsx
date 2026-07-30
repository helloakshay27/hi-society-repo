import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface ParentGroupOption {
  id: number;
  group_name: string;
}

interface AddLockAccountGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const flattenGroups = (groups: any[], prefix = ""): ParentGroupOption[] => {
  let result: ParentGroupOption[] = [];
  for (const group of groups) {
    result.push({ id: group.id, group_name: prefix + group.group_name });
    if (Array.isArray(group.children) && group.children.length > 0) {
      result = result.concat(
        flattenGroups(group.children, `${prefix}${group.group_name} > `)
      );
    }
  }
  return result;
};

export const AddLockAccountGroupModal: React.FC<AddLockAccountGroupModalProps> = ({
  open,
  onOpenChange,
  onSaved,
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
        const res = await axios.get(
          `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_groups?format=flat`,
          { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        );
        const groups = res.data?.data || [];
        setParentGroups(flattenGroups(groups));
      } catch (error) {
        console.error("Error fetching parent groups:", error);
        setParentGroups([]);
      }
    };
    fetchParentGroups();
  }, [open, lockAccountId]);

  useEffect(() => {
    if (open) {
      setParentGroupId("");
      setGroupName("");
      setLocked(false);
    }
  }, [open]);

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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const payload = {
        lock_account_group: {
          group_name: groupName.trim(),
          parent_group_id: parentGroupId || null,
          locked,
          credit_rule: "-",
          debit_rule: "+",
          active: true,
        },
      };

      await axios.post(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_groups.json`,
        payload,
        { headers }
      );
      toast.success("Group created successfully");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
        <div className="flex items-center justify-between bg-cyan-500 px-6 py-3">
          <h2 className="text-lg font-medium text-white">New Lock Account Group</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:opacity-80"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[140px_1fr]">
            <label className="text-sm font-medium text-gray-800">Parent Group</label>
            <Select value={parentGroupId} onValueChange={setParentGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                {parentGroups.map((group) => (
                  <SelectItem key={group.id} value={String(group.id)}>
                    {group.group_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[140px_1fr]">
            <label className="text-sm font-medium text-gray-800">Group Name</label>
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 pl-0 sm:pl-[152px]">
            <Checkbox
              id="lockAccountGroupLocked"
              checked={locked}
              onCheckedChange={(checked) => setLocked(Boolean(checked))}
            />
            <label htmlFor="lockAccountGroupLocked" className="text-sm font-medium text-gray-800">
              Locked
            </label>
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

export default AddLockAccountGroupModal;
