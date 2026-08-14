import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { formatAmount } from "@/utils/financialStatement";

// Real response shape returned by GET /lock_account_transactions/gst_payable
interface GstPayableRecordAPI {
  ledger_id: number;
  ledger_name: string;
  gst_percentage: number | null;
  total_amount: number;
  gst_amount: number;
}

interface GstPayableApiResponse {
  code?: number;
  report?: string;
  date_range?: [string, string];
  lock_account?: { id: number; name: string };
  records?: GstPayableRecordAPI[];
}

interface GstPayableRow {
  id: number;
  ledgerName: string;
  gstPercent: number | null;
  totalAmount: number;
  gstAmount: number;
}

const columns: ColumnConfig[] = [
  { key: "ledgerName", label: "Ledger Name", sortable: true },
  { key: "gstPercent", label: "GST %", sortable: true },
  { key: "totalAmount", label: "Total Amount", sortable: true },
  { key: "gstAmount", label: "GST Amount", sortable: true },
];

const AccountingGSTPayable: React.FC = () => {
  const lock_account_id = localStorage.getItem("lock_account_id") || "3";

  const [rows, setRows] = useState<GstPayableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });

  const fetchGstPayable = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get<GstPayableApiResponse>(
        `${baseUrl}/lock_account_transactions/gst_payable.json`,
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
          id: record.ledger_id,
          ledgerName: record.ledger_name,
          gstPercent: record.gst_percentage,
          totalAmount: record.total_amount,
          gstAmount: record.gst_amount,
        }))
      );
    } catch (err) {
      console.error("Error fetching GST payable:", err);
      setError("Failed to load GST payable data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGstPayable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const renderCell = (item: GstPayableRow, columnKey: string) => {
    switch (columnKey) {
      case "ledgerName":
        return item.ledgerName;
      case "gstPercent":
        return item.gstPercent !== null ? `${item.gstPercent}%` : "-";
      case "totalAmount":
        return formatAmount(item.totalAmount);
      case "gstAmount":
        return formatAmount(item.gstAmount);
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
          <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">GST Payable</h3>
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
            onClick={fetchGstPayable}
            className="bg-[#C72030] hover:bg-[#A01020] text-white h-[40px]"
          >
            View
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">GST Payable</h1>
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
            getItemId={(item) => String(item.id)}
            pagination
            pageSize={20}
            enableGlobalSearch
            searchPlaceholder="Search ledgers"
            enableExport
            exportFileName="gst-payable"
            storageKey="gst-payable-table"
            loading={loading}
            loadingMessage="Loading GST payable data..."
            emptyMessage="No matching records found"
          />
        )}
      </div>
    </div>
  );
};

export default AccountingGSTPayable;
