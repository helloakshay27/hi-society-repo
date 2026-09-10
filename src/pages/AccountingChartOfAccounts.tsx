import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Eye, Edit, Plus, Trash2, ListTree, Table2, UploadCloud, DownloadCloud, Folder, Code2 } from "lucide-react";
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
import {
  AddChartOfAccountModal,
  ChartOfAccountLedger,
} from "@/components/AddChartOfAccountModal";

// Shape returned by GET /lock_accounts/:id/lock_account_ledgers.json (table view)
interface LockAccountLedgerAPI {
  id: number;
  name: string;
  fixed_type?: string | null;
  account_code?: string;
  lock_account_group_id?: number;
  account_type?: string;
  group_name?: string;
  lock_account_group?: { id?: number; group_name?: string } | null;
}

// Shape returned by GET /lock_account_ledgers/:id (single ledger detail)
interface LockAccountLedgerDetailAPI {
  id: number;
  lock_account_id?: number;
  lock_account_group_id?: number;
  name: string;
  fixed_type?: string | null;
  active?: boolean;
  account_code?: string;
  description?: string | null;
  budget?: number | string | null;
  watchlist?: boolean | null;
  assoc_cost_centre?: boolean | null;
}

interface LedgerRow {
  sr: number;
  id: number;
  accountName: string;
  accountCode: string;
  accountType: string;
  raw: LockAccountLedgerAPI;
}

interface AccountTreeNodeData {
  id: string | number;
  name: string;
  type: "root" | "group" | "ledger";
  children: AccountTreeNodeData[];
}

// jsTree-style flat node returned by GET /lock_account_ledgers
interface FlatTreeNode {
  id: string | number;
  parent: string | number;
  text: string;
}

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "sr", label: "Sr", sortable: true },
  { key: "accountName", label: "Account Name", sortable: true },
  { key: "accountCode", label: "Account Code", sortable: true },
  { key: "accountType", label: "Account Type", sortable: true },
];

// GET /lock_accounts/:id/lock_account_ledgers/tree.json may return either a
// nested tree ({ text/name, children: [...] }) or a jsTree-style flat list
// ([{ id, parent, text }]). Normalize both into AccountTreeNodeData[].
const normalizeTree = (data: unknown): AccountTreeNodeData[] => {
  const record = data as Record<string, unknown> | null;
  const arr = Array.isArray(data)
    ? data
    : (record?.tree as unknown[]) ?? (record?.children as unknown[]) ?? (record?.nodes as unknown[]) ?? [];
  if (!Array.isArray(arr) || arr.length === 0) return [];

  const looksNested = arr.some((n) => Array.isArray((n as Record<string, unknown>)?.children));
  if (looksNested) {
    const toNode = (n: Record<string, unknown>): AccountTreeNodeData => {
      const rawChildren = Array.isArray(n.children) ? (n.children as Record<string, unknown>[]) : [];
      const children = rawChildren.map(toNode);
      const name = String(n.text ?? n.name ?? n.title ?? n.id ?? "");
      return {
        id: (n.id ?? n.key ?? name) as string | number,
        name,
        type: children.length > 0 ? "group" : "ledger",
        children,
      };
    };
    return arr.map((n) => toNode(n as Record<string, unknown>));
  }
  return buildTreeFromFlat(arr as FlatTreeNode[]);
};

// numeric id → group node; "documents_..._<ledgerId>" string id → ledger node
const buildTreeFromFlat = (flat: FlatTreeNode[]): AccountTreeNodeData[] => {
  const nodeMap = new Map<string, AccountTreeNodeData>();
  flat.forEach((n) => {
    const isLedger = typeof n.id === "string" && n.id.startsWith("documents_");
    nodeMap.set(String(n.id), {
      id: n.id,
      name: n.text,
      type: isLedger ? "ledger" : "group",
      children: [],
    });
  });
  const roots: AccountTreeNodeData[] = [];
  flat.forEach((n) => {
    const node = nodeMap.get(String(n.id));
    if (!node) return;
    if (n.parent === "#") {
      roots.push(node);
      return;
    }
    const parentNode = nodeMap.get(String(n.parent));
    if (parentNode) parentNode.children.push(node);
    else roots.push(node);
  });
  return roots;
};

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
          <Code2 className="h-4 w-4 flex-shrink-0 text-[#da7756]" />
        ) : (
          <Folder className="h-4 w-4 flex-shrink-0 text-[#da7756]" />
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
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<"table" | "tree">("table");
  const [ledgers, setLedgers] = useState<LockAccountLedgerAPI[]>([]);
  const [accountTypes, setAccountTypes] = useState<{ id: number; name: string }[]>([]);
  const [tree, setTree] = useState<AccountTreeNodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState<ChartOfAccountLedger | null>(null);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const authHeaders = () => {
    const token = API_CONFIG.TOKEN;
    return {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // GET /lock_accounts/:id/lock_account_ledgers/account_types.json
  const fetchAccountTypes = useCallback(async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers/account_types.json`,
        { headers: authHeaders() }
      );
      const data = response.data;
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
  }, [lockAccountId]);

  // GET /lock_accounts/:id/lock_account_ledgers.json (table view)
  const fetchLedgers = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers.json`,
        { headers: authHeaders() }
      );
      const data = response.data;
      const list: LockAccountLedgerAPI[] = Array.isArray(data)
        ? data
        : data?.lock_account_ledgers ?? data?.ledgers ?? data?.data ?? [];
      setLedgers(list);
    } catch (error) {
      console.error("Error fetching chart of accounts:", error);
      toast.error("Failed to fetch chart of accounts");
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }, [lockAccountId]);

  // GET /lock_accounts/:id/lock_account_ledgers/tree.json (tree view)
  const fetchTree = useCallback(async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers/tree.json`,
        { headers: authHeaders() }
      );
      setTree(normalizeTree(response.data));
    } catch (error) {
      console.error("Error fetching account tree:", error);
      setTree([]);
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchAccountTypes();
    fetchLedgers();
    fetchTree();
  }, [fetchAccountTypes, fetchLedgers, fetchTree]);

  const accountTypeNameById = useMemo(() => {
    const map = new Map<number, string>();
    accountTypes.forEach((t) => t.id && map.set(t.id, t.name));
    return map;
  }, [accountTypes]);

  const rows = useMemo<LedgerRow[]>(
    () =>
      ledgers.map((ledger, index) => ({
        sr: index + 1,
        id: ledger.id,
        accountName: ledger.name,
        accountCode: ledger.account_code || "",
        accountType:
          ledger.account_type ||
          ledger.group_name ||
          ledger.lock_account_group?.group_name ||
          (ledger.lock_account_group_id
            ? accountTypeNameById.get(ledger.lock_account_group_id) || ""
            : ""),
        raw: ledger,
      })),
    [ledgers, accountTypeNameById]
  );

  // The API's root jsTree node ("Account Ledgers", parent "#") already reads
  // as the tree's single root, so render it directly instead of a synthetic wrapper.
  const rootNode: AccountTreeNodeData =
    tree[0] ?? { id: "root", name: "Account Ledgers", type: "root", children: [] };

  const callLedgerEndpoint = async (
    path: string,
    successMessage: string,
    params?: Record<string, string>
  ) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers/${path}.json`,
        { headers: authHeaders(), params }
      );
      toast.success(successMessage);
      fetchLedgers();
      fetchTree();
    } catch (error) {
      console.error(`Error calling ${path}:`, error);
      toast.error(`Failed: ${successMessage}`);
    }
  };

  // GET /lock_accounts/:id/lock_account_ledgers/sync.json
  const handleSyncUnitLedgers = () => callLedgerEndpoint("sync", "Unit ledgers synced");
  // GET /lock_accounts/:id/lock_account_ledgers/sync_suppliers.json
  const handleSyncVendorLedgers = () => callLedgerEndpoint("sync_suppliers", "Vendor ledgers synced");
  // GET /lock_accounts/:id/lock_account_ledgers/raise_to_builder.json?pids=1,2,3
  const handleRaiseToBuilder = () => {
    const pids = ledgers.map((l) => l.id).filter(Boolean).join(",");
    if (!pids) {
      toast.error("No accounts to raise to builder");
      return;
    }
    callLedgerEndpoint("raise_to_builder", "Raised to builder", { pids });
  };

  const handleAddAccount = () => {
    setEditingLedger(null);
    setIsAddOpen(true);
  };

  const fetchLedgerDetail = async (id: number): Promise<LockAccountLedgerDetailAPI | null> => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await axios.get(`${baseUrl}/lock_account_ledgers/${id}`, {
        params: { lock_account_id: lockAccountId },
        headers: authHeaders(),
      });
      return response.data?.lock_account_ledger || null;
    } catch (error) {
      console.error("Error fetching ledger detail:", error);
      toast.error("Failed to load account details");
      return null;
    }
  };

  const handleEditAccount = async (row: LedgerRow) => {
    const detail = await fetchLedgerDetail(row.id);
    setEditingLedger({
      id: row.id,
      name: detail?.name ?? row.accountName,
      account_code: detail?.account_code ?? row.accountCode,
      lock_account_group_id: detail?.lock_account_group_id ?? row.raw.lock_account_group_id,
      budget: detail?.budget ?? undefined,
      description: detail?.description ?? undefined,
      watchlist: Boolean(detail?.watchlist),
      allow_cost_center: Boolean(detail?.assoc_cost_centre),
    });
    setIsAddOpen(true);
  };

  const handleViewAccount = (row: LedgerRow) => {
    navigate(`/accounting/ledger/${row.id}`);
  };

  const handleDeleteAccount = async (row: LedgerRow) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      await axios.delete(`${baseUrl}/lock_account_ledgers/${row.id}`, {
        headers: authHeaders(),
      });
      toast.success("Account deleted successfully");
      fetchLedgers();
      fetchTree();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  const renderCell = (item: LedgerRow, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="p-1" onClick={() => handleViewAccount(item)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-1" onClick={() => handleEditAccount(item)}>
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
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{item.accountName}</strong>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
                    onClick={() => handleDeleteAccount(item)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      case "sr":
        return item.sr;
      case "accountName":
        return item.accountName;
      case "accountCode":
        return item.accountCode;
      case "accountType":
        return item.accountType;
      default:
        return "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
       

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
           className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
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
          <Button
            variant="outline"
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
            onClick={handleSyncUnitLedgers}
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Sync Unit Ledgers
          </Button>
          <Button
            variant="outline"
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
            onClick={handleSyncVendorLedgers}
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Sync Vendor Ledgers
          </Button>
          <Button
            variant="outline"
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
            onClick={handleRaiseToBuilder}
          >
            <DownloadCloud className="mr-2 h-4 w-4" /> Raise To Builder
          </Button>
        </div>
      </div>
 <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
          Chart of Accounts
        </h1>
      </div>
      {viewType === "table" ? (
        <EnhancedTable
          data={rows}
          columns={columns}
          renderCell={renderCell}
          getItemId={(item) => String(item.id)}
          pagination
          pageSize={20}
          // enableExport
          exportFileName="chart-of-accounts"
          storageKey="chart-of-accounts-table"
          loading={loading}
          loadingMessage="Loading chart of accounts..."
          emptyMessage="No matching records found"
           leftActions={
                    <Button
          onClick={handleAddAccount}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="mr-2 h-4 w-4" /> Account
        </Button>
                  }
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
    </div>
  );
};

export default AccountingChartOfAccounts;
