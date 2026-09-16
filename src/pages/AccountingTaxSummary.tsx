import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";
import { formatAmount } from "@/utils/financialStatement";
import { TaxSummaryApiRow, TaxSummaryRow, mapTaxSummaryRow, formatLedgerTaxName } from "@/utils/taxSummary";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";

const columns: ColumnConfig[] = [
  { key: "ledgerId", label: "Ledger ID", sortable: true },
  { key: "ledgerTaxName", label: "Ledger & Tax Name", sortable: true },
  { key: "taxPercentage", label: "Tax Percentage", sortable: false },
  { key: "transactionAmount", label: "Transaction Amount", sortable: true },
  { key: "taxAmount", label: "Tax Amount", sortable: true },
];

const renderCell = (row: TaxSummaryRow, columnKey: string) => {
  switch (columnKey) {
    case "ledgerId":
      return row.ledgerId || "-";
    case "ledgerTaxName":
      return formatLedgerTaxName(row) || "-";
    case "taxPercentage":
      return row.taxPercentage ? row.taxPercentage : "-";
    case "transactionAmount":
      return formatAmount(row.transactionAmount) || "-";
    case "taxAmount":
      return formatAmount(row.taxAmount) || "-";
    default:
      return "-";
  }
};

const AccountingTaxSummary: React.FC = () => {
  const lock_account_id = localStorage.getItem("lock_account_id") || "3";

  const [rows, setRows] = useState<TaxSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });

  const fetchTaxSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/lock_account_transactions/tax_summary`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        params: {
          lock_account_id,
          from_date: filters.fromDate || undefined,
          to_date: filters.toDate || undefined,
        },
      });
      const data = response.data;
      const list: TaxSummaryApiRow[] = Array.isArray(data)
        ? data
        : data?.records || data?.tax_summary || data?.data || [];
      setRows(list.map(mapTaxSummaryRow));
    } catch (err) {
      console.error("Error fetching tax summary:", err);
      setError("Failed to load tax summary data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full bg-[#f9f7f2] p-6" style={{ minHeight: "100vh", boxSizing: "border-box" }}>
      <div className="bg-white rounded-lg border-2 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
            <NotepadText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">Tax Summary</h3>
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
            onClick={fetchTaxSummary}
            className="bg-[#C72030] hover:bg-[#A01020] text-white h-[40px]"
          >
            View
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">Tax Summary</h1>
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
            loading={loading}
            loadingMessage="Loading tax summary..."
            emptyMessage="No matching records found"
            hideTableSearch
            hideColumnsButton
          />
        )}
      </div>
    </div>
  );
};

export default AccountingTaxSummary;
