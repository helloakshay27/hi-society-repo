import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@mui/material";
import { fieldStyles } from "@/components/ticket-management/fieldStyles";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, X } from "lucide-react";

// Flat row shape returned by
// GET /lock_accounts/:id/lock_account_transactions.json → lock_account_transaction_records
interface LedgerRecord {
  id?: number;
  lock_account_id?: number;
  lock_account_transaction_id?: number;
  ledger_id: number;
  ledger_name: string;
  tr_type: "dr" | "cr" | string;
  amount: number;
  cost_centre_id?: number | null;
  description?: string | null;
  created_at?: string;
  // present only when the API also echoes the parent transaction fields
  transaction_type?: string | null;
  reference?: string | null;
  voucher_number?: string | null;
  transaction_date?: string | null;
}

interface LockAccountTransaction {
  id: number;
  lock_account_id: number;
  transaction_type: string;
  reference: string | null;
  voucher_number: string | null;
  transaction_date: string;
  description: string;
  created_at: string;
  updated_at: string;
  records: LedgerRecord[];
}

interface TransactionRow {
  rowId: string;
  transactionId: number;
  particulars: string;
  debit: number | null;
  credit: number | null;
  reference: string | null;
  transactionType: string;
  voucherDate: string;
  createdOn: string;
}

const TABS: { value: string; label: string; type: string | null }[] = [
  { value: "all", label: "All", type: null },
  { value: "journal", label: "Journal", type: "Journal" },
  { value: "contra", label: "Contra", type: "Contra" },
  { value: "payment", label: "Payment", type: "Payment" },
  { value: "receipt", label: "Receipt", type: "Receipt" },
  { value: "debit_note", label: "Debit Note", type: "Debit Note" },
  { value: "credit_note", label: "Credit Note", type: "Credit Note" },
];

const columns: ColumnConfig[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "particulars", label: "Particulars", sortable: true },
  { key: "debit", label: "Debit ₹", sortable: true },
  { key: "credit", label: "Credit ₹", sortable: true },
  { key: "reference", label: "Reference", sortable: true },
  { key: "transactionType", label: "Transaction Type", sortable: true },
  { key: "voucherDate", label: "Voucher Date", sortable: true },
];

const formatAmount = (value: number | null) => {
  if (value === null || value === undefined) return "";
  return value.toFixed(1);
};

const formatDateOnly = (value: string | null | undefined) => {
  if (!value) return "";
  return value.slice(0, 10);
};

// Display helper: "2026-09-09..." → "09/09/2026" (leaves DD/MM/YYYY input untouched).
const formatDateDisplay = (value: string | null | undefined) => {
  if (!value) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return value;
};

const AccountingTransactions: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(() => {
    const fromUrl = searchParams.get("tab");
    return fromUrl && TABS.some((t) => t.value === fromUrl) ? fromUrl : "all";
  });
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterId, setFilterId] = useState("");
  const [filterReference, setFilterReference] = useState("");
  const [filterVoucherDate, setFilterVoucherDate] = useState("");
  const [filterCreatedOn, setFilterCreatedOn] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    id: "",
    reference: "",
    voucherDate: "",
    createdOn: "",
  });

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const url = `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_transactions.json`;
      const tabType = TABS.find((tab) => tab.value === activeTab)?.type;
      const response = await axios.get(url, {
        params: tabType ? { transaction_type: tabType } : {},
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = response.data;
      if (Array.isArray(data?.lock_account_transaction_records)) {
        setRecords(data.lock_account_transaction_records);
      } else if (Array.isArray(data?.lock_account_transactions)) {
        // Fallback for the nested { records: [...] } shape.
        setRecords(
          (data.lock_account_transactions as LockAccountTransaction[]).flatMap((t) =>
            (t.records || []).map((r) => ({
              ...r,
              lock_account_transaction_id: r.lock_account_transaction_id ?? t.id,
              transaction_type: r.transaction_type ?? t.transaction_type,
              reference: r.reference ?? t.reference,
              voucher_number: r.voucher_number ?? t.voucher_number,
              transaction_date: r.transaction_date ?? t.transaction_date,
              created_at: r.created_at ?? t.created_at,
            }))
          )
        );
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [lockAccountId, activeTab]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const rows: TransactionRow[] = useMemo(() => {
    return records.map((record) => {
      const amount = Math.abs(Number(record.amount) || 0);
      return {
        rowId: String(record.id ?? `${record.lock_account_transaction_id}-${record.ledger_id}`),
        transactionId: record.lock_account_transaction_id ?? 0,
        particulars: record.ledger_name || "",
        debit: record.tr_type === "dr" ? amount : null,
        credit: record.tr_type === "cr" ? amount : null,
        reference: record.reference || "",
        transactionType: record.transaction_type || "",
        voucherDate: record.transaction_date || record.created_at || "",
        createdOn: record.created_at || "",
      };
    });
  }, [records]);

  const activeTabConfig = TABS.find((tab) => tab.value === activeTab) ?? TABS[0];

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Records without a transaction_type (flat list API) stay visible on every tab.
      if (
        activeTabConfig.type &&
        row.transactionType &&
        row.transactionType !== activeTabConfig.type
      ) {
        return false;
      }
      if (
        appliedFilters.id &&
        !String(row.transactionId).includes(appliedFilters.id.trim())
      ) {
        return false;
      }
      if (
        appliedFilters.reference &&
        !(row.reference || "")
          .toLowerCase()
          .includes(appliedFilters.reference.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.voucherDate &&
        formatDateOnly(row.voucherDate) !== appliedFilters.voucherDate
      ) {
        return false;
      }
      if (
        appliedFilters.createdOn &&
        formatDateOnly(row.createdOn) !== appliedFilters.createdOn
      ) {
        return false;
      }
      return true;
    });
  }, [rows, activeTabConfig, appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      id: filterId,
      reference: filterReference,
      voucherDate: filterVoucherDate,
      createdOn: filterCreatedOn,
    });
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilterId("");
    setFilterReference("");
    setFilterVoucherDate("");
    setFilterCreatedOn("");
    setAppliedFilters({ id: "", reference: "", voucherDate: "", createdOn: "" });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    handleResetFilters();
    setSearchParams(value === "all" ? {} : { tab: value }, { replace: true });
  };

  const handleAddTransaction = () => {
    const type = activeTabConfig.type ?? "Journal";
    navigate(
      `/accounting/transactions/add?type=${encodeURIComponent(type)}&tab=${encodeURIComponent(activeTab)}`
    );
  };

  const handleImport = () => {
    toast.info("Import feature coming soon");
  };

  const renderCell = (item: TransactionRow, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return item.transactionId ? `#${item.transactionId}` : "-";
      case "particulars":
        return item.particulars || "-";
      case "debit":
        return item.debit === null ? "-" : formatAmount(item.debit);
      case "credit":
        return item.credit === null ? "-" : formatAmount(item.credit);
      case "reference":
        return item.reference || "-";
      case "transactionType":
        return item.transactionType || "-";
      case "voucherDate":
        return formatDateDisplay(item.voucherDate) || "-";
      default:
        return "-";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-brand-border bg-transparent p-0">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent px-1 pb-3 text-brand-body-3 font-medium text-brand-text-light data-[state=active]:border-brand data-[state=active]:text-brand-text data-[state=active]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
 <div className="mb-4 mt-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
          Transactions
        </h1>
      </div>
        <div className="mt-4">
          <EnhancedTable
            data={filteredRows}
            columns={columns}
            renderCell={renderCell}
            getItemId={(item) => item.rowId}
            pagination
            pageSize={20}
            enableExport
            exportFileName={`accounting-transactions-${activeTab}`}
            storageKey={`accounting-transactions-${activeTab}-table`}
            leftActions={
              activeTabConfig.type ? (
                <Button
                  onClick={() => setShowActionPanel(true)}
                  variant="ghost"
                  className="btn-primary h-9 px-4 text-sm font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" /> Action
                </Button>
              ) : undefined
            }
            onFilterClick={() => setIsFilterOpen(true)}
            loading={loading}
            loadingMessage="Loading transactions..."
            emptyMessage="No matching records found"
          />
        </div>
      </Tabs>

      {showActionPanel && (
        <SelectionPanel
          className="selection-panel--end"
          onAdd={() => {
            setShowActionPanel(false);
            handleAddTransaction();
          }}
          onImport={() => {
            setShowActionPanel(false);
            handleImport();
          }}
          onClearSelection={() => setShowActionPanel(false)}
        />
      )}

      <Dialog open={isFilterOpen} modal={false} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-2xl bg-white [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <DialogTitle className="text-xl font-bold text-[hsl(var(--analytics-text))]">
              FILTER BY
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="ID"
                placeholder="ID"
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Reference"
                placeholder="Reference"
                value={filterReference}
                onChange={(e) => setFilterReference(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Voucher Date"
                type="date"
                value={filterVoucherDate}
                onChange={(e) => setFilterVoucherDate(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Created On"
                type="date"
                value={filterCreatedOn}
                onChange={(e) => setFilterCreatedOn(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="text-[hsl(var(--analytics-text))] border-[hsl(var(--analytics-border))]"
            >
              Reset
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="bg-[#C72030] hover:bg-[#C72030]/90 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingTransactions;
