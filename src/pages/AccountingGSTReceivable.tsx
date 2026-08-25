import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";
import { formatAmount } from "@/utils/financialStatement";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";

// Confirmed shape returned by the sibling GET /lock_account_transactions/gst_payable
// endpoint on the same controller — { income: {ledgers}, expense: {ledgers} },
// no tax percentage/amount fields. gst_receivable is assumed to match until a
// live response (it currently times out server-side) confirms otherwise.
interface GstReceivableLedgerAPI {
  id: number;
  name: string;
  account_code?: string | null;
}

interface GstReceivableGroupAPI {
  id: number;
  group_name: string;
  ledgers?: GstReceivableLedgerAPI[];
}

interface GstReceivableApiResponse {
  code?: number;
  report?: string;
  income?: GstReceivableGroupAPI;
  expense?: GstReceivableGroupAPI;
}

interface GstReceivableRow {
  ledgerId: number;
  ledgerName: string;
  taxPercentage: string;
  transactionAmount: number | null;
  taxAmount: number | null;
}

const columns: ColumnConfig[] = [
  { key: "ledgerId", label: "Ledger ID", sortable: true },
  { key: "ledgerName", label: "Ledger & Tax Name", sortable: true },
  { key: "taxPercentage", label: "Tax Percentage", sortable: true },
  { key: "transactionAmount", label: "Transaction Amount", sortable: true },
  { key: "taxAmount", label: "Tax Amount", sortable: true },
];

const AccountingGSTReceivable: React.FC = () => {
  const lock_account_id = localStorage.getItem("lock_account_id") || "3";

  const [rows, setRows] = useState<GstReceivableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });

  const fetchGstReceivable = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get<GstReceivableApiResponse>(
        `${baseUrl}/lock_account_transactions/gst_receivable`,
        {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          params: {
            lock_account_id,
            from_date: filters.fromDate || undefined,
            to_date: filters.toDate || undefined,
          },
        }
      );
      const data = response.data;
      const toRows = (group: GstReceivableGroupAPI | undefined): GstReceivableRow[] =>
        (group?.ledgers || []).map((ledger) => ({
          ledgerId: ledger.id,
          ledgerName: ledger.name,
          taxPercentage: "",
          transactionAmount: null,
          taxAmount: null,
        }));
      setRows([...toRows(data.income), ...toRows(data.expense)]);
    } catch (err) {
      console.error("Error fetching GST receivable:", err);
      setError("Failed to load GST receivable data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGstReceivable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const renderCell = (item: GstReceivableRow, columnKey: string) => {
    switch (columnKey) {
      case "ledgerId":
        return item.ledgerId;
      case "ledgerName":
        return item.ledgerName;
      case "taxPercentage":
        return item.taxPercentage || "-";
      case "transactionAmount":
        return item.transactionAmount !== null ? formatAmount(item.transactionAmount) : "-";
      case "taxAmount":
        return item.taxAmount !== null ? formatAmount(item.taxAmount) : "-";
      default:
        return "";
    }
  };

  return (
    <div className="w-full bg-[#f9f7f2] p-6" style={{ minHeight: "100vh", boxSizing: "border-box" }}>
      <div className="bg-white rounded-lg border-2 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
            <NotepadText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">GST Receivable</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <TextField
            label="From Date"
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />
          <TextField
            label="To Date"
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />
          <Button
            onClick={fetchGstReceivable}
            className="bg-[#C72030] hover:bg-[#A01020] text-white h-[40px]"
          >
            View
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">GST Receivable</h1>
        </div>

        {error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <EnhancedTable
            data={rows}
            columns={columns}
            renderCell={renderCell}
            getItemId={(item) => String(item.ledgerId)}
            pagination
            pageSize={20}
            enableGlobalSearch
            searchPlaceholder="Search ledgers"
            enableExport
            exportFileName="gst-receivable"
            storageKey="gst-receivable-table"
            loading={loading}
            loadingMessage="Loading GST receivable data..."
            emptyMessage="No matching records found"
          />
        )}
      </div>
    </div>
  );
};

export default AccountingGSTReceivable;
