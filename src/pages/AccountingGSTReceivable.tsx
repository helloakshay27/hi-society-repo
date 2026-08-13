import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";
import { formatAmount } from "@/utils/financialStatement";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";

// Real response shape returned by GET /lock_account_transactions/gst_receivable
interface GstReceivableRecordAPI {
  ledger_id: number;
  ledger_name: string;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

interface GstReceivableApiResponse {
  code?: number;
  report?: string;
  date_range?: [string, string];
  lock_account?: { id: number; name: string };
  records?: GstReceivableRecordAPI[];
}

interface GstReceivableRow {
  ledgerId: number;
  ledgerName: string;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

const columns: ColumnConfig[] = [
  { key: "ledgerId", label: "Ledger ID", sortable: true },
  { key: "ledgerName", label: "Ledger Name", sortable: true },
  { key: "cgst", label: "CGST", sortable: true },
  { key: "sgst", label: "SGST", sortable: true },
  { key: "igst", label: "IGST", sortable: true },
  { key: "total", label: "Total", sortable: true },
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
        `${baseUrl}/lock_account_transactions/gst_receivable.json`,
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
      const records = response.data.records || [];
      setRows(
        records.map((record) => ({
          ledgerId: record.ledger_id,
          ledgerName: record.ledger_name,
          cgst: record.cgst,
          sgst: record.sgst,
          igst: record.igst,
          total: record.total,
        }))
      );
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
      case "cgst":
        return formatAmount(item.cgst);
      case "sgst":
        return formatAmount(item.sgst);
      case "igst":
        return formatAmount(item.igst);
      case "total":
        return formatAmount(item.total);
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
