import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";

// Real response shape returned by GET /lock_account_transactions/balance_sheet
// Only the group scaffold (id/group_name/children) comes back today — no
// per-group amounts — so this page shows exactly that instead of a fabricated
// statutory template.
interface BalanceSheetGroup {
  id: number;
  group_name: string;
  parent_group_id?: number;
}

interface BalanceSheetNode {
  id: number;
  group_name: string;
  ledgers?: unknown[];
  children?: BalanceSheetGroup[];
}

interface BalanceSheetApiResponse {
  code?: number;
  report?: string;
  liability?: BalanceSheetNode;
  asset?: BalanceSheetNode;
}

const AccountingBalanceSheet: React.FC = () => {
  const lock_account_id = localStorage.getItem("lock_account_id") || "3";

  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });

  const fetchBalanceSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/lock_account_transactions/balance_sheet`, {
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
      setBalanceSheetData(response.data);
    } catch (err) {
      console.error("Error fetching balance sheet:", err);
      setError("Failed to load balance sheet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const liabilityGroups = balanceSheetData?.liability?.children || [];
  const assetGroups = balanceSheetData?.asset?.children || [];
  const rowCount = Math.max(liabilityGroups.length, assetGroups.length);

  return (
    <div className="w-full bg-[#f9f7f2] p-6" style={{ minHeight: "100vh", boxSizing: "border-box" }}>
      <div className="bg-white rounded-lg border-2 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
            <NotepadText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">Balance Sheet</h3>
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
            onClick={fetchBalanceSheet}
            className="bg-[#C72030] hover:bg-[#A01020] text-white h-[40px]"
          >
            View
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase">Balance Sheet</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C72030]"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 text-sm">
              <thead className="bg-[#E5E0D3]">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">
                    {balanceSheetData?.liability?.group_name || "Liabilities"}
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left">
                    {balanceSheetData?.asset?.group_name || "Assets"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rowCount === 0 ? (
                  <tr>
                    <td colSpan={2} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      No matching records found
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: rowCount }).map((_, i) => (
                    <tr key={i}>
                      <td className="border border-gray-300 px-3 py-1.5">
                        {liabilityGroups[i]?.group_name || ""}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5">
                        {assetGroups[i]?.group_name || ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingBalanceSheet;
