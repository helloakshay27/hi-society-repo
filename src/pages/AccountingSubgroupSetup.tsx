import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  AddLockAccountGroupModal,
  EditableLockAccountGroup,
} from "@/components/AddLockAccountGroupModal";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface LockAccountGroupAPI {
  id: number;
  lock_account_id?: number;
  group_name: string;
  parent_group_id?: number | null;
  base_group_id?: number | null;
  locked?: boolean | null;
}

interface SubgroupRow {
  id: number;
  accountName: string;
  groupName: string;
  parentGroup: string;
  baseGroup: string;
  raw: LockAccountGroupAPI;
}

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "id", label: "Id", sortable: true },
  { key: "accountName", label: "Account Name", sortable: true },
  { key: "groupName", label: "Group Name", sortable: true },
  { key: "parentGroup", label: "Parent Group", sortable: true },
  { key: "baseGroup", label: "Base Group", sortable: true },
];

// The 4 fundamental account types (base_group_id) are fixed system roots that
// never appear as their own entries in GET /lock_account_groups.
const ROOT_GROUP_NAMES: Record<number, string> = {
  1: "Assets",
  2: "Liabilities",
  3: "Income",
  4: "Expenditure",
};

const AccountingSubgroupSetup: React.FC = () => {
  const [rows, setRows] = useState<SubgroupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EditableLockAccountGroup | null>(null);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const authHeaders = () => {
    const token = API_CONFIG.TOKEN;
    return {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const res = await axios.get(`${baseUrl}/lock_account_groups`, {
        params: { lock_account_id: lockAccountId },
        headers: { ...authHeaders(), "Content-Type": "application/json" },
      });
      const groups: LockAccountGroupAPI[] = res.data?.lock_account_groups || [];
      const nameById = new Map(groups.map((g) => [g.id, g.group_name]));
      const resolveName = (id?: number | null) => {
        if (!id) return "-";
        return nameById.get(id) || ROOT_GROUP_NAMES[id] || "-";
      };
      setRows(
        groups.map((g) => ({
          id: g.id,
          accountName: "",
          groupName: g.group_name,
          parentGroup: resolveName(g.parent_group_id),
          baseGroup: resolveName(g.base_group_id),
          raw: g,
        }))
      );
    } catch (error) {
      console.error("Error fetching account groups:", error);
      toast.error("Failed to fetch account groups");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleAdd = () => {
    setEditingGroup(null);
    setIsAddOpen(true);
  };

  // GET /lock_account_groups/:id currently 404s server-side even for ids that
  // exist (confirmed against this list), so edit uses the already-fetched row
  // data instead of a detail round-trip that can't succeed.
  const handleEdit = (item: SubgroupRow) => {
    setEditingGroup({
      id: item.raw.id,
      group_name: item.raw.group_name,
      parent_group_id: item.raw.parent_group_id,
      locked: item.raw.locked,
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (item: SubgroupRow) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      await axios.delete(`${baseUrl}/lock_account_groups/${item.id}`, {
        headers: authHeaders(),
      });
      toast.success("Group deleted successfully");
      fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    }
  };

  const renderCell = (item: SubgroupRow, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="p-1" onClick={() => handleEdit(item)}>
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="p-1">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{item.groupName}</strong>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
                    onClick={() => handleDelete(item)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      case "id":
        return item.id;
      case "accountName":
        return item.accountName || "-";
      case "groupName":
        return item.groupName;
      case "parentGroup":
        return item.parentGroup;
      case "baseGroup":
        return item.baseGroup;
      default:
        return "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination
        pageSize={20}
        enableGlobalSearch
        searchPlaceholder="Search"
        enableExport
        exportFileName="subgroup-setup"
        storageKey="subgroup-setup-table"
        loading={loading}
        loadingMessage="Loading account groups..."
        emptyMessage="No matching records found"
        leftActions={
          <Button
            onClick={handleAdd}
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        }
      />

      <AddLockAccountGroupModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSaved={fetchGroups}
        editingGroup={editingGroup}
      />
    </div>
  );
};

export default AccountingSubgroupSetup;
