import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Eye, Pencil, Plus, ListTree, Table2, UploadCloud, DownloadCloud, Folder, Code2 } from "lucide-react";
import {
  AddChartOfAccountModal,
  ChartOfAccountLedger,
} from "@/components/AddChartOfAccountModal";

interface LockAccountLedgerAPI {
  id: number;
  name: string;
  account_code?: string;
  lock_account_group_id?: number;
  lock_account_group_name?: string;
  base_group_type?: string;
  budget?: number | string;
  budget_start_date?: string;
  budget_end_date?: string;
  description?: string;
  watchlist?: boolean;
  allow_cost_center?: boolean;
}

interface LedgerRow {
  sr: number;
  id: number;
  accountName: string;
  accountCode: string;
  budget: string;
  accountType: string;
  raw: LockAccountLedgerAPI;
}

interface AccountTreeNodeData {
  id: string | number;
  name: string;
  type: "root" | "group" | "ledger";
  children: AccountTreeNodeData[];
}

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "sr", label: "Sr", sortable: true },
  { key: "accountName", label: "Account Name", sortable: true },
  { key: "accountCode", label: "Account Code", sortable: true },
  { key: "budget", label: "Budget", sortable: true },
  { key: "accountType", label: "Account Type", sortable: true },
];

const toRow = (ledger: LockAccountLedgerAPI, index: number): LedgerRow => ({
  sr: index + 1,
  id: ledger.id,
  accountName: ledger.name,
  accountCode: ledger.account_code || "",
  budget: ledger.budget !== undefined && ledger.budget !== null ? String(ledger.budget) : "",
  accountType: ledger.base_group_type || ledger.lock_account_group_name || "",
  raw: ledger,
});

const buildGroupTree = (groups: any[]): AccountTreeNodeData[] =>
  groups.map((group) => ({
    id: group.id,
    name: group.group_name,
    type: "group",
    children: [
      ...(Array.isArray(group.ledgers)
        ? group.ledgers.map((ledger: any) => ({
            id: ledger.id,
            name: ledger.name,
            type: "ledger" as const,
            children: [],
          }))
        : []),
      ...(Array.isArray(group.children) ? buildGroupTree(group.children) : []),
    ],
  }));

const AccountTreeNode: React.FC<{ node: AccountTreeNodeData; level: number }> = ({
  node,
  level,
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isLeaf = node.type === "ledger";

  return (
    <div className="relative" style={{ paddingLeft: level > 0 ? 20 : 0 }}>
      {level > 0 && (
        <span className="absolute left-0 top-0 h-full border-l border-dashed border-gray-300" />
      )}
      <div
        className="flex items-center gap-2 py-1.5 cursor-pointer group"
        onClick={() => hasChildren && setExpanded((v) => !v)}
      >
        {level > 0 && <span className="h-px w-4 border-t border-dashed border-gray-300" />}
        {isLeaf ? (
          <Code2 className="h-4 w-4 flex-shrink-0 text-[#3b82c4]" />
        ) : (
          <Folder className="h-4 w-4 flex-shrink-0 text-[#3b82c4]" />
        )}
        <span className="text-sm text-gray-700 group-hover:text-[#C72030]">{node.name}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <AccountTreeNode key={`${child.type}-${child.id}`} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const AccountingChartOfAccounts: React.FC = () => {
  const [viewType, setViewType] = useState<"table" | "tree">("table");
  const [ledgers, setLedgers] = useState<LockAccountLedgerAPI[]>([]);
  const [tree, setTree] = useState<AccountTreeNodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState<ChartOfAccountLedger | null>(null);
  const [previewLedger, setPreviewLedger] = useState<LedgerRow | null>(null);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const fetchLedgers = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const url = `${baseUrl}/lock_accounts.json?access_token=${token}`;
      const response = await axios.get(url);
      setLedgers(response.data?.lock_account_ledgers || []);
    } catch (error) {
      console.error("Error fetching chart of accounts:", error);
      toast.error("Failed to fetch chart of accounts");
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTree = useCallback(async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const url = `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_groups?format=tree&access_token=${token}`;
      const response = await axios.get(url);
      setTree(buildGroupTree(response.data?.data || []));
    } catch (error) {
      console.error("Error fetching account tree:", error);
      setTree([]);
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchLedgers();
    fetchTree();
  }, [fetchLedgers, fetchTree]);

  const rows = useMemo(() => ledgers.map(toRow), [ledgers]);

  const rootNode: AccountTreeNodeData = { id: "root", name: "Account Ledgers", type: "root", children: tree };

  const callSyncEndpoint = async (path: string, successMessage: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.post(
        `${baseUrl}/lock_accounts/${lockAccountId}/${path}.json`,
        {},
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      toast.success(successMessage);
      fetchLedgers();
      fetchTree();
    } catch (error) {
      console.error(`Error calling ${path}:`, error);
      toast.error(`Failed to ${successMessage.toLowerCase()}`);
    }
  };

  const handleSyncFlatLedgers = () => callSyncEndpoint("sync_flat_ledgers", "Flat ledgers synced");
  const handleSyncVendorLedgers = () => callSyncEndpoint("sync_vendor_ledgers", "Vendor ledgers synced");
  const handleRaiseToBuilder = () => callSyncEndpoint("raise_to_builder", "Raised to builder");

  const handleAddAccount = () => {
    setEditingLedger(null);
    setIsAddOpen(true);
  };

  const handleEditAccount = (row: LedgerRow) => {
    setEditingLedger({
      id: row.raw.id,
      name: row.raw.name,
      account_code: row.raw.account_code,
      lock_account_group_id: row.raw.lock_account_group_id,
      budget: row.raw.budget,
      budget_start_date: row.raw.budget_start_date,
      budget_end_date: row.raw.budget_end_date,
      description: row.raw.description,
      watchlist: row.raw.watchlist,
      allow_cost_center: row.raw.allow_cost_center,
    });
    setIsAddOpen(true);
  };

  const renderCell = (item: LedgerRow, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Eye
              className="h-4 w-4 cursor-pointer text-[#3b82c4] hover:text-[#C72030]"
              onClick={() => setPreviewLedger(item)}
            />
            <Pencil
              className="h-4 w-4 cursor-pointer text-[#3b82c4] hover:text-[#C72030]"
              onClick={() => handleEditAccount(item)}
            />
          </div>
        );
      case "sr":
        return item.sr;
      case "accountName":
        return item.accountName;
      case "accountCode":
        return item.accountCode;
      case "budget":
        return item.budget;
      case "accountType":
        return item.accountType;
      default:
        return "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="mb-4 flex flex-wrap gap-3">
        <Button className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90" onClick={handleAddAccount}>
          <Plus className="mr-2 h-4 w-4" /> Account
        </Button>
        <Button
          className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90"
          onClick={() => setViewType(viewType === "tree" ? "table" : "tree")}
        >
          {viewType === "tree" ? (
            <>
              <Table2 className="mr-2 h-4 w-4" /> Table View
            </>
          ) : (
            <>
              <ListTree className="mr-2 h-4 w-4" /> Tree View
            </>
          )}
        </Button>
        <Button className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90" onClick={handleSyncFlatLedgers}>
          <Plus className="mr-2 h-4 w-4" /> Sync Flat Ledgers
        </Button>
        <Button className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90" onClick={handleSyncVendorLedgers}>
          <Plus className="mr-2 h-4 w-4" /> Sync Vendor Ledgers
        </Button>
        <Button className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90" onClick={handleRaiseToBuilder}>
          <DownloadCloud className="mr-2 h-4 w-4" /> Raise To Builder
        </Button>
      </div>

      {viewType === "table" ? (
        <EnhancedTable
          data={rows}
          columns={columns}
          renderCell={renderCell}
          getItemId={(item) => String(item.id)}
          pagination
          pageSize={20}
          enableExport
          exportFileName="chart-of-accounts"
          storageKey="chart-of-accounts-table"
          loading={loading}
          loadingMessage="Loading chart of accounts..."
          emptyMessage="No matching records found"
        />
      ) : (
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <AccountTreeNode node={rootNode} level={0} />
        </div>
      )}

      <AddChartOfAccountModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSaved={() => {
          fetchLedgers();
          fetchTree();
        }}
        editingLedger={editingLedger}
      />

      <Dialog open={Boolean(previewLedger)} onOpenChange={(open) => !open && setPreviewLedger(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{previewLedger?.accountName}</DialogTitle>
          </DialogHeader>
          {previewLedger && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Account Code</span>
                <span className="font-medium">{previewLedger.accountCode || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Budget</span>
                <span className="font-medium">{previewLedger.budget || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Type</span>
                <span className="font-medium">{previewLedger.accountType || "-"}</span>
              </div>
              {previewLedger.raw.description && (
                <div className="pt-2">
                  <span className="text-gray-500">Description</span>
                  <p className="mt-1">{previewLedger.raw.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingChartOfAccounts;
