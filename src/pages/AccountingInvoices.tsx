import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Eye, Plus, Download, Send, FileSpreadsheet, CheckSquare } from "lucide-react";
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
  irnNo: bill.irn_no || "N/A",
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

const exportRowsToCsv = (rows: InvoiceRow[], fileName: string) => {
  if (rows.length === 0) {
    toast.error("No data to export");
    return;
  }
  const headers = columns.filter((c) => c.key !== "actions").map((c) => c.label);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.billNumber,
        row.irnNo,
        row.society,
        row.tower,
        row.ledger,
        row.nameOnBill,
        row.dueDate,
        row.totalAmount,
        row.note,
        row.billCycle,
        row.status,
        row.publish ? "Yes" : "No",
        row.mailSent ? "Yes" : "No",
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AccountingInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<LockAccountBill[]>([]);
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
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = response.data;
      setBills(data?.lock_account_bills || data?.data || data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to fetch invoices");
      setBills([]);
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

  const totals = useMemo(() => {
    const totalBills = rows.length;
    const totalAmount = rows.reduce((sum, r) => sum + r.totalAmount, 0);
    const pendingAmount = rows
      .filter((r) => r.status.toLowerCase() !== "paid")
      .reduce((sum, r) => sum + r.totalAmount, 0);
    const paidAmount = rows
      .filter((r) => r.status.toLowerCase() === "paid")
      .reduce((sum, r) => sum + r.totalAmount, 0);
    return { totalBills, totalAmount, pendingAmount, paidAmount };
  }, [rows]);

  const statCards = [
    { label: "Total Bills", value: totals.totalBills, gradient: "from-fuchsia-800 via-rose-700 to-orange-500" },
    { label: "Total Amount", value: totals.totalAmount.toFixed(1), gradient: "from-rose-700 via-orange-500 to-amber-400" },
    { label: "Pending Amount", value: totals.pendingAmount.toFixed(2), gradient: "from-orange-600 to-amber-400" },
    { label: "Paid Amount", value: totals.paidAmount.toFixed(2), gradient: "from-rose-900 via-orange-700 to-amber-600" },
  ];

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredRows.map((r) => String(r.id)) : []);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  const handleRaiseInvoices = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one bill to raise.");
      return;
    }
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await Promise.all(
        selectedIds.map((id) =>
          axios.patch(
            `${baseUrl}/lock_account_bills/${id}.json`,
            { lock_account_bill: { publish: true } },
            {
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            }
          )
        )
      );
      toast.success(`${selectedIds.length} invoice(s) raised successfully`);
      setSelectedIds([]);
      fetchBills();
    } catch (error) {
      console.error("Error raising invoices:", error);
      toast.error("Failed to raise selected invoices");
    }
  };

  const handleRemind = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one bill to remind.");
      return;
    }
    toast.info("Reminder feature coming soon");
  };

  const renderCell = (item: InvoiceRow, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <Eye
            className="h-4 w-4 cursor-pointer text-gray-600 hover:text-[#C72030]"
            onClick={() => navigate(`/accounting/invoices/${item.id}`)}
          />
        );
      case "id":
        return item.id;
      case "billNumber":
        return item.billNumber;
      case "irnNo":
        return item.irnNo;
      case "society":
        return item.society;
      case "tower":
        return item.tower;
      case "ledger":
        return item.ledger;
      case "nameOnBill":
        return item.nameOnBill;
      case "dueDate":
        return item.dueDate;
      case "totalAmount":
        return item.totalAmount.toFixed(1);
      case "note":
        return item.note;
      case "billCycle":
        return item.billCycle;
      case "status":
        return (
          <span className="flex items-center gap-1">
            <span
              className={`inline-block h-3 w-1 rounded ${
                item.status.toLowerCase() === "paid" ? "bg-green-500" : "bg-orange-400"
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
        return "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg bg-gradient-to-r ${card.gradient} p-6 text-white shadow`}
          >
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm opacity-90">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Button
          className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90"
          onClick={() => navigate("/accounting/invoices/add")}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
        <Button
          className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90"
          onClick={() => handleSelectAll(selectedIds.length !== filteredRows.length)}
        >
          <CheckSquare className="mr-2 h-4 w-4" /> Select All
        </Button>
        <Button
          className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90"
          onClick={() => exportRowsToCsv(filteredRows, "invoices")}
        >
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
        <Button
          className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90"
          onClick={() => exportRowsToCsv(rows, "invoices-all")}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Export All
        </Button>
        <Button className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90" onClick={handleRaiseInvoices}>
          <Send className="mr-2 h-4 w-4" /> Raise Invoices
        </Button>
        <Button className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90" onClick={handleRemind}>
          Remind
        </Button>
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
        exportFileName="accounting-invoices"
        storageKey="accounting-invoices-table"
        onFilterClick={() => setIsFilterOpen(true)}
        loading={loading}
        loadingMessage="Loading invoices..."
        emptyMessage="No matching records found"
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
