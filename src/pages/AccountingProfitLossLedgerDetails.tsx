import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import TextField from "@mui/material/TextField";
import { API_CONFIG } from "@/config/apiConfig";
import { ArrowLeft } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";

// Real, flat response shape returned by GET /lock_account_ledgers/:id — the
// ledger's own fields at the top level, plus a nested "statement" object
// carrying the date range, opening/closing balances, totals and entries.
interface StatementEntryAPI {
  id: number;
  lock_account_transaction_id?: number;
  tr_type?: "dr" | "cr" | string;
  amount?: number;
  description?: string | null;
  transaction_date?: string;
  reference?: string;
  transaction_type?: string;
  created_at?: string;
}

interface LedgerStatementAPI {
  from?: string;
  to?: string;
  opening_balance?: number;
  entries?: StatementEntryAPI[];
  closing_balance?: number;
  total_debit?: number;
  total_credit?: number;
}

interface LedgerDetailResponse {
  id: number;
  name: string;
  account_code?: string | null;
  statement?: LedgerStatementAPI;
}

const formatDisplayDate = (value?: string): string => {
  if (!value) return "";
  if (value.includes("T")) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${date.getFullYear()}-${month}-${day}`;
    }
  }
  return value;
};

const formatAmount = (value: number) =>
  value.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// One row per statement entry, plus a synthetic "TOTAL" row appended at the
// end so EnhancedTable (no built-in footer) can render it like any other row.
interface LedgerTableRow {
  id: string;
  isTotal?: boolean;
  date?: string;
  account?: string;
  description?: string;
  type?: string;
  transactionId?: number | string;
  reference?: string;
  credit?: string;
  debit?: string;
}

const LEDGER_COLUMNS: ColumnConfig[] = [
  { key: "date", label: "Date", sortable: false },
  { key: "account", label: "Account", sortable: false },
  { key: "description", label: "Transaction Details", sortable: false },
  { key: "type", label: "Type", sortable: false },
  { key: "transactionId", label: "Transaction ID", sortable: false },
  { key: "reference", label: "Reference ID", sortable: false },
  { key: "credit", label: "Credit", sortable: false },
  { key: "debit", label: "Debit", sortable: false },
];

// Same UI/API as AccountingLedgerDetails.tsx (opened from Chart of Accounts),
// kept as a separate page so the back link and breadcrumb return to Profit
// and Loss instead of Chart of Accounts.
const AccountingProfitLossLedgerDetails: React.FC = () => {
  const { ledgerId } = useParams<{ ledgerId: string }>();
  const navigate = useNavigate();
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [ledgerName, setLedgerName] = useState("");
  const [statement, setStatement] = useState<LedgerStatementAPI | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLedgerDetail = async (from?: string, to?: string) => {
    if (!ledgerId) return;
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get<LedgerDetailResponse>(
        `${baseUrl}/lock_account_ledgers/${ledgerId}`,
        {
          params: {
            lock_account_id: lockAccountId,
            ...(from ? { from_date: from } : {}),
            ...(to ? { to_date: to } : {}),
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      const data = response.data;
      setLedgerName(data.name || "");
      setStatement(data.statement || null);
      if (!from && data.statement?.from) setFromDate(data.statement.from);
      if (!to && data.statement?.to) setToDate(data.statement.to);
    } catch (error) {
      console.error("Error fetching ledger detail:", error);
      toast.error("Failed to load ledger details");
      setStatement(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerId]);

  const handleSubmit = () => {
    fetchLedgerDetail(fromDate, toDate);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    fetchLedgerDetail();
  };

  const records = statement?.entries || [];
  const totalDebit =
    statement?.total_debit ??
    records.filter((r) => r.tr_type === "dr").reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalCredit =
    statement?.total_credit ??
    records.filter((r) => r.tr_type === "cr").reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const openingBalance = statement?.opening_balance ?? 0;
  const closingBalance = statement?.closing_balance ?? openingBalance + totalDebit - totalCredit;

  const tableRows: LedgerTableRow[] = records.map((record) => ({
    id: String(record.id),
    date: formatDisplayDate(record.transaction_date || record.created_at),
    account: ledgerName,
    description: record.description || "",
    type: record.transaction_type || "",
    transactionId: record.lock_account_transaction_id ?? "",
    reference: record.reference || "",
    credit: record.tr_type === "cr" ? formatAmount(-Math.abs(record.amount || 0)) : "",
    debit: record.tr_type === "dr" ? formatAmount(record.amount || 0) : "",
  }));
  if (records.length > 0) {
    tableRows.push({
      id: "total",
      isTotal: true,
      credit: formatAmount(-totalCredit),
      debit: formatAmount(totalDebit),
    });
  }

  const renderLedgerCell = (row: LedgerTableRow, columnKey: string) => {
    if (row.isTotal) {
      if (columnKey === "description") return "TOTAL";
      if (columnKey === "credit" || columnKey === "debit") return row[columnKey];
      return "";
    }
    switch (columnKey) {
      case "credit":
      case "debit":
        return <span className="block text-right">{row[columnKey]}</span>;
      default:
        return row[columnKey as keyof LedgerTableRow] ?? "";
    }
  };

  return (
    <div className="w-full bg-white p-6" style={{ minHeight: "100vh", boxSizing: "border-box" }}>
      <button
        onClick={() => navigate("/accounting/profit-loss")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profit and Loss
      </button>

      <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
        {ledgerName || "Ledger"}
      </h1>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <TextField
          label="From Date"
          type="date"
          name="fromDate"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ width: 200 }}
        />
        <TextField
          label="To Date"
          type="date"
          name="toDate"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ width: 200 }}
        />
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#C72030] hover:bg-[#A01020] text-white h-[40px] px-6"
        >
          View
        </Button>
        <Button
          onClick={handleReset}
          disabled={loading}
          variant="outline"
          className="h-[40px] px-6"
        >
          Reset
        </Button>
      </div>

      <div className="flex justify-end mb-3">
        <div className="flex items-center gap-3 bg-gray-100 rounded px-4 py-2 text-sm">
          <span className="text-gray-600">Opening Balance</span>
          <span className="font-semibold">{formatAmount(openingBalance)}</span>
        </div>
      </div>

      <EnhancedTable
        data={tableRows}
        columns={LEDGER_COLUMNS}
        renderCell={renderLedgerCell}
        getItemId={(item) => item.id}
        pagination={false}
        hideTableSearch
        hideColumnsButton
        rowClassName={(item) => (item.isTotal ? "font-semibold bg-gray-50" : "")}
        loading={loading}
        loadingMessage="Loading..."
        emptyMessage="No transactions found"
      />

      <div className="flex justify-end mt-3 mb-6">
        <div className="flex items-center gap-3 bg-gray-100 rounded px-4 py-2 text-sm">
          <span className="text-gray-600">Closing Balance</span>
          <span className="font-semibold">{formatAmount(closingBalance)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        **Amount is displayed in your base currency{" "}
        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
          INR
        </span>
      </p>
    </div>
  );
};

export default AccountingProfitLossLedgerDetails;
