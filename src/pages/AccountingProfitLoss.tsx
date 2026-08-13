import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";
import { formatAmount } from "@/utils/financialStatement";

// Real response shape returned by GET /lock_account_transactions/pnl
interface PnlLedgerAPI {
  id: number;
  name: string;
  total: number;
  display_total: number;
  fixed_type?: string | null;
}

interface PnlGroupAPI {
  id: number;
  group_name: string;
  group_total: number;
  children?: PnlGroupAPI[];
  ledgers?: PnlLedgerAPI[];
}

interface PnlSideAPI {
  groups?: PnlGroupAPI[];
  ledgers?: PnlLedgerAPI[];
}

interface PnlSummaryAPI {
  income_total: number;
  expense_total: number;
  bt: number;
  net_profit: number;
  net_loss: number;
}

interface PnlApiResponse {
  code?: number;
  report?: string;
  lock_account?: { id: number; name: string };
  summary?: PnlSummaryAPI;
  expense?: PnlSideAPI;
  income?: PnlSideAPI;
  totals?: { expense: number; income: number };
}

interface PnlRow {
  level: number;
  label: string;
  amount: number;
  isGroup?: boolean;
  isTotal?: boolean;
}

const ledgerAmount = (ledger: PnlLedgerAPI): number => ledger.display_total ?? ledger.total ?? 0;

const buildGroupRows = (group: PnlGroupAPI, level: number): PnlRow[] => {
  const rows: PnlRow[] = [
    { level, label: group.group_name, amount: group.group_total ?? 0, isGroup: true },
  ];
  (group.children || []).forEach((child) => rows.push(...buildGroupRows(child, level + 1)));
  (group.ledgers || []).forEach((ledger) =>
    rows.push({ level: level + 1, label: ledger.name, amount: ledgerAmount(ledger) })
  );
  return rows;
};

const buildSideRows = (side: PnlSideAPI | undefined, totalAmount: number): PnlRow[] => {
  const rows: PnlRow[] = [];
  (side?.groups || []).forEach((group) => rows.push(...buildGroupRows(group, 0)));
  (side?.ledgers || []).forEach((ledger) =>
    rows.push({ level: 0, label: ledger.name, amount: ledgerAmount(ledger) })
  );
  rows.push({ level: 0, label: "Total", amount: totalAmount, isTotal: true });
  return rows;
};

const AccountingProfitLoss: React.FC = () => {
  const lock_account_id = localStorage.getItem("lock_account_id") || "3";

  const [pnlData, setPnlData] = useState<PnlApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });

  const fetchPnl = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get<PnlApiResponse>(`${baseUrl}/lock_account_transactions/pnl.json`, {
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
      setPnlData(response.data);
    } catch (err) {
      console.error("Error fetching profit and loss:", err);
      setError("Failed to load profit and loss data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const expenseTotal = pnlData?.summary?.expense_total ?? pnlData?.totals?.expense ?? 0;
  const incomeTotal = pnlData?.summary?.income_total ?? pnlData?.totals?.income ?? 0;

  const expenditureRows = buildSideRows(pnlData?.expense, expenseTotal);
  const incomeRows = buildSideRows(pnlData?.income, incomeTotal);

  const rowCount = Math.max(expenditureRows.length, incomeRows.length);

  const renderSideCells = (row?: PnlRow) => {
    if (!row) {
      return (
        <>
          <td className="border border-gray-300 px-3 py-1.5"></td>
          <td className="border border-gray-300 px-3 py-1.5"></td>
          <td className="border border-gray-300 px-3 py-1.5"></td>
          <td className="border border-gray-300 px-3 py-1.5"></td>
        </>
      );
    }

    const showInCurrentYear = row.isTotal;
    const labelClass = row.isGroup || row.isTotal ? "font-bold" : "font-normal";
    const rowBg = row.isTotal ? "bg-gray-100" : "";

    return (
      <>
        <td className={`border border-gray-300 px-3 py-1.5 ${rowBg}`}></td>
        <td
          className={`border border-gray-300 px-3 py-1.5 ${labelClass} ${rowBg}`}
          style={{ paddingLeft: `${12 + row.level * 20}px` }}
        >
          {row.label}
        </td>
        <td className={`border border-gray-300 px-3 py-1.5 text-right ${rowBg}`}>
          {showInCurrentYear ? "" : formatAmount(row.amount)}
        </td>
        <td className={`border border-gray-300 px-3 py-1.5 text-right ${labelClass} ${rowBg}`}>
          {showInCurrentYear ? formatAmount(row.amount) : ""}
        </td>
      </>
    );
  };

  return (
    <div className="w-full bg-[#f9f7f2] p-6" style={{ minHeight: "100vh", boxSizing: "border-box" }}>
      <div className="bg-white rounded-lg border-2 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
            <NotepadText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">Profit and Loss</h3>
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
            onClick={fetchPnl}
            className="bg-[#C72030] hover:bg-[#A01020] text-white h-[40px]"
          >
            View
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">Profit and Loss</h1>
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
                  <th className="border border-gray-300 px-3 py-2">Previous Year</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Expenditure</th>
                  <th className="border border-gray-300 px-3 py-2">Total</th>
                  <th className="border border-gray-300 px-3 py-2">Current Year</th>
                  <th className="border border-gray-300 px-3 py-2">Previous Year</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Income</th>
                  <th className="border border-gray-300 px-3 py-2">Total</th>
                  <th className="border border-gray-300 px-3 py-2">Current Year</th>
                </tr>
              </thead>
              <tbody>
                {rowCount === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      No matching records found
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: rowCount }).map((_, i) => (
                    <tr key={i}>
                      {renderSideCells(expenditureRows[i])}
                      {renderSideCells(incomeRows[i])}
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

export default AccountingProfitLoss;
