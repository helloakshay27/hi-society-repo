import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import {
  ArrowLeft,
  Eye,
  Edit,
  Plus,
  Download,
  Send,
  FileSpreadsheet,
  CheckSquare,
  Receipt,
  IndianRupee,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  AccountingInvoiceFilterDialog,
  AccountingInvoiceFilters,
} from "@/components/AccountingInvoiceFilterDialog";

interface LockAccountBill {
  id: number;
  bill_number: string;
  irn_no: string | null;
  society_name: string | null;
  society?: { name?: string };
  tower_name: string | null;
  tower?: { name?: string };
  ledger_name: string | null;
  ledger?: { name?: string };
  name_on_bill: string | null;
  due_date: string | null;
  total_amount: number;
  note: string | null;
  bill_cycle: string | null;
  bill_cycle_name?: string;
  status: string;
  publish: boolean;
  mail_sent: boolean;
}

interface InvoiceRow {
  id: number;
  billNumber: string;
  irnNo: string;
  society: string;
  tower: string;
  ledger: string;
  nameOnBill: string;
  dueDate: string;
  totalAmount: number;
  note: string;
  billCycle: string;
  status: string;
  publish: boolean;
  mailSent: boolean;
}

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "id", label: "ID", sortable: true },
  { key: "billNumber", label: "Bill number", sortable: true },
  { key: "irnNo", label: "IRN No", sortable: true },
  { key: "society", label: "Society", sortable: true },
  { key: "tower", label: "Tower", sortable: true },
  { key: "ledger", label: "Ledger", sortable: true },
  { key: "nameOnBill", label: "Name On Bill", sortable: true },
  { key: "dueDate", label: "Due date", sortable: true },
  { key: "totalAmount", label: "Total amount", sortable: true },
  { key: "note", label: "Note", sortable: false },
  { key: "billCycle", label: "Bill cycle", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "publish", label: "Publish", sortable: true },
  { key: "mailSent", label: "Mail sent", sortable: true },
];

const toRow = (bill: LockAccountBill): InvoiceRow => ({
  id: bill.id,
  billNumber: bill.bill_number,
  irnNo: bill.irn_no || "",
  society: bill.society_name || bill.society?.name || "",
  tower: bill.tower_name || bill.tower?.name || "",
  ledger: bill.ledger_name || bill.ledger?.name || "",
  nameOnBill: bill.name_on_bill || "",
  dueDate: bill.due_date || "",
  totalAmount: Number(bill.total_amount) || 0,
  note: bill.note || "",
  billCycle: bill.bill_cycle || bill.bill_cycle_name || "",
  status: bill.status || "Pending",
  publish: Boolean(bill.publish),
  mailSent: Boolean(bill.mail_sent),
});

// Shown only when the API call fails, so the list + row actions (eye button →
// details page) can still be exercised while the backend is unreachable.
const DUMMY_BILL: LockAccountBill = {
  id: 0,
  bill_number: "DUMMY-0001",
  irn_no: null,
  society_name: "Sample Society",
  tower_name: "A",
  ledger_name: "C - 101",
  name_on_bill: "Sample Resident",
  due_date: "2026-09-10",
  total_amount: 1180,
  note: "Dummy record shown because the invoices API is unreachable",
  bill_cycle: "September 2026",
  status: "Pending",
  publish: false,
  mail_sent: false,
};

// GET /lock_account_bills/download_invoices.xlsx?pids=1,2,3 (pids = bill ids)
const downloadInvoicesXlsx = async (ids: number[], fileName: string) => {
  if (ids.length === 0) {
    toast.error("No invoices to export");
    return;
  }
  try {
    const baseUrl = API_CONFIG.BASE_URL;
    const token = API_CONFIG.TOKEN;
    const response = await axios.get(`${baseUrl}/lock_account_bills/download_invoices.xlsx`, {
      params: { pids: ids.join(",") },
      responseType: "blob",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting invoices:", error);
    toast.error("Failed to export invoices");
  }
};

const AccountingInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<LockAccountBill[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AccountingInvoiceFilters>({});

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const url = `${baseUrl}/lock_account_bills.json?lock_account_id=${lockAccountId}`;
      const response = await axios.get(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = response.data;
      setBills(data?.lock_account_bills || data?.data || data || []);
      setSummary(
        (data?.summary ?? data?.kpi ?? data?.kpis ?? data?.stats ?? data?.totals ?? null) as
          | Record<string, unknown>
          | null
      );
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to fetch invoices");
      setBills([DUMMY_BILL]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const rows = useMemo(() => bills.map(toRow), [bills]);

  const towerOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.tower).filter(Boolean))),
    [rows]
  );
  const unitOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.ledger).filter(Boolean))),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (appliedFilters.tower && row.tower !== appliedFilters.tower) return false;
      if (
        appliedFilters.billNumber &&
        !row.billNumber.toLowerCase().includes(appliedFilters.billNumber.trim().toLowerCase())
      )
        return false;
      if (appliedFilters.unit && row.ledger !== appliedFilters.unit) return false;
      if (
        appliedFilters.paymentStatus &&
        row.status.toLowerCase() !== appliedFilters.paymentStatus.toLowerCase()
      )
        return false;
      if (
        appliedFilters.publishStatus &&
        (row.publish ? "Yes" : "No") !== appliedFilters.publishStatus
      )
        return false;
      return true;
    });
  }, [rows, appliedFilters]);

  // KPI cards come from GET /lock_account_bills.json?lock_account_id=... — use a
  // summary block from that response when present, otherwise derive from the list.
  const totals = useMemo(() => {
    const s = summary || {};
    const apiNum = (...keys: string[]): number | null => {
      for (const key of keys) {
        const v = s[key];
        if (v !== undefined && v !== null && v !== "" && Number.isFinite(Number(v))) {
          return Number(v);
        }
      }
      return null;
    };
    const computedTotalBills = rows.length;
    const computedTotalAmount = rows.reduce((sum, r) => sum + r.totalAmount, 0);
    const computedPending = rows
      .filter((r) => r.status.toLowerCase() !== "paid")
      .reduce((sum, r) => sum + r.totalAmount, 0);
    const computedPaid = rows
      .filter((r) => r.status.toLowerCase() === "paid")
      .reduce((sum, r) => sum + r.totalAmount, 0);
    return {
      totalBills: apiNum("total_bills", "total_count", "count", "bills_count") ?? computedTotalBills,
      totalAmount: apiNum("total_amount", "total_bill_amount") ?? computedTotalAmount,
      pendingAmount:
        apiNum("pending_amount", "outstanding_amount", "unpaid_amount") ?? computedPending,
      paidAmount: apiNum("paid_amount", "received_amount", "collected_amount") ?? computedPaid,
    };
  }, [rows, summary]);

  const statCards = [
    { label: "Total Bills", value: totals.totalBills.toLocaleString(), icon: Receipt },
    { label: "Total Amount", value: `₹${totals.totalAmount.toFixed(2)}`, icon: IndianRupee },
    { label: "Pending Amount", value: `₹${totals.pendingAmount.toFixed(2)}`, icon: Clock },
    { label: "Paid Amount", value: `₹${totals.paidAmount.toFixed(2)}`, icon: CheckCircle2 },
  ];

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredRows.map((r) => String(r.id)) : []);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  const handleExport = () => {
    const ids =
      selectedIds.length > 0 ? selectedIds.map(Number) : filteredRows.map((r) => r.id);
    downloadInvoicesXlsx(ids, "invoices");
  };

  const handleExportAll = () => {
    downloadInvoicesXlsx(rows.map((r) => r.id), "invoices-all");
  };

  // POST /lock_account_bills/raise_account_invoices.json?lock_account_id=..&pids=1,2,3
  const handleRaiseInvoices = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one bill to raise.");
      return;
    }
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.post(
        `${baseUrl}/lock_account_bills/raise_account_invoices.json`,
        {},
        {
          params: { lock_account_id: lockAccountId, pids: selectedIds.join(",") },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      toast.success(`${selectedIds.length} invoice(s) raised successfully`);
      setSelectedIds([]);
      fetchBills();
    } catch (error) {
      console.error("Error raising invoices:", error);
      toast.error("Failed to raise selected invoices");
    }
  };

  // POST /lock_account_bills/trigger_invoice_emails.json?lock_account_id=..&invoice_ids=..
  const handleRemind = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one bill to remind.");
      return;
    }
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.post(
        `${baseUrl}/lock_account_bills/trigger_invoice_emails.json`,
        {},
        {
          params: { lock_account_id: lockAccountId, invoice_ids: selectedIds.join(",") },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      toast.success(`Reminder sent for ${selectedIds.length} invoice(s)`);
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Failed to send reminders");
    }
  };

  const renderCell = (item: InvoiceRow, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="p-1"
              onClick={() => navigate(`/accounting/invoices/${item.id}`)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-1"
              onClick={() => navigate(`/accounting/invoices/${item.id}/edit`)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        );
      case "id":
        return item.id || "-";
      case "billNumber":
        return item.billNumber || "-";
      case "irnNo":
        return item.irnNo || "-";
      case "society":
        return item.society || "-";
      case "tower":
        return item.tower || "-";
      case "ledger":
        return item.ledger || "-";
      case "nameOnBill":
        return item.nameOnBill || "-";
      case "dueDate":
        return item.dueDate || "-";
      case "totalAmount":
        return item.totalAmount ? item.totalAmount.toFixed(1) : "-";
      case "note":
        return item.note || "-";
      case "billCycle":
        return item.billCycle || "-";
      case "status":
        return (
          <span className="flex items-center gap-1">
            <span
              className={`inline-block h-3 w-1 rounded ${item.status.toLowerCase() === "paid" ? "bg-green-500" : "bg-orange-400"
                }`}
            />
            {item.status}
          </span>
        );
      case "publish":
        return item.publish ? "Yes" : "No";
      case "mailSent":
        return item.mailSent ? "Yes" : "No";
      default:
        return "-";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
     

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center gap-3 rounded-lg bg-brand-bg p-4 shadow-brand-card transition-shadow hover:shadow-system-md"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-brand-light">
                <Icon className="h-5 w-5 text-brand" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-xl font-semibold text-brand-text">
                  {card.value}
                </div>
                <div className="truncate text-xs font-medium text-brand-text">
                  {card.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">

        <Button
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
          onClick={() => handleSelectAll(selectedIds.length !== filteredRows.length)}
        >
          <CheckSquare className="mr-2 h-4 w-4" /> Select All
        </Button>
        <Button
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
        <Button
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
          onClick={handleExportAll}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Export All
        </Button>
        <Button className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium" onClick={handleRaiseInvoices}>
          <Send className="mr-2 h-4 w-4" /> Raise Invoices
        </Button>
        <Button className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium" onClick={handleRemind}>
          Remind
        </Button>
      </div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
          Invoices
        </h1>
      </div>
      <EnhancedTable
        data={filteredRows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        selectable
        selectedItems={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectItem={handleSelectItem}
        pagination
        pageSize={20}
        enableExport
        onExport={handleExport}
        exportFileName="accounting-invoices"
        storageKey="accounting-invoices-table"
        onFilterClick={() => setIsFilterOpen(true)}
        loading={loading}
        loadingMessage="Loading invoices..."
        emptyMessage="No matching records found"
        leftActions={
          <Button
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
            onClick={() => navigate("/accounting/invoice-creation")}
          >
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        }
      />

      <AccountingInvoiceFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={setAppliedFilters}
        onResetFilters={() => setAppliedFilters({})}
        currentFilters={appliedFilters}
        towerOptions={towerOptions}
        unitOptions={unitOptions}
      />
    </div>
  );
};

export default AccountingInvoices;
