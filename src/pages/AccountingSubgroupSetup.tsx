import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, RotateCw } from "lucide-react";
import { AddLockAccountGroupModal } from "@/components/AddLockAccountGroupModal";

interface LockAccountGroupNode {
  id: number;
  group_name: string;
  children?: LockAccountGroupNode[];
}

interface SubgroupRow {
  id: number;
  accountName: string;
  groupName: string;
  parentGroup: string;
  baseGroup: string;
}

const columns: ColumnConfig[] = [
  { key: "id", label: "Id", sortable: true },
  { key: "accountName", label: "Account Name", sortable: true },
  { key: "groupName", label: "Group Name", sortable: true },
  { key: "parentGroup", label: "Parent Group", sortable: true },
  { key: "baseGroup", label: "Base Group", sortable: true },
];

const flattenTreeToRows = (
  nodes: LockAccountGroupNode[],
  parentName: string,
  baseName: string
): SubgroupRow[] => {
  let rows: SubgroupRow[] = [];
  for (const node of nodes) {
    rows.push({
      id: node.id,
      accountName: "",
      groupName: node.group_name,
      parentGroup: parentName,
      baseGroup: baseName,
    });
    if (Array.isArray(node.children) && node.children.length > 0) {
      rows = rows.concat(flattenTreeToRows(node.children, node.group_name, baseName));
    }
  }
  return rows;
};

const AccountingSubgroupSetup: React.FC = () => {
  const [rows, setRows] = useState<SubgroupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const res = await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_groups?format=tree`,
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      const rootGroups: LockAccountGroupNode[] = res.data?.data || [];
      const flattened = rootGroups.flatMap((root) =>
        Array.isArray(root.children)
          ? flattenTreeToRows(root.children, root.group_name, root.group_name)
          : []
      );
      setRows(flattened);
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

  const renderCell = (item: SubgroupRow, columnKey: string) => {
    switch (columnKey) {
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
            className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        }
        rightActions={
          <Button variant="outline" size="icon" onClick={fetchGroups} title="Refresh">
            <RotateCw className="h-4 w-4" />
          </Button>
        }
      />

      <AddLockAccountGroupModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSaved={fetchGroups}
      />
    </div>
  );
};

export default AccountingSubgroupSetup;
