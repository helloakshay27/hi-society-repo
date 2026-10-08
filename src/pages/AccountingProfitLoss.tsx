import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";
import { StatementRow, formatAmount } from "@/utils/financialStatement";

// Real response shape returned by GET /lock_account_transactions/pnl —
// mirrors the Balance Sheet API (AccountingBalanceSheet.tsx): each side
// (expense/income) has its own groups (nested, with child groups/ledgers)
// and a flat ledgers list for anything with no group.
interface ApiLedger {
  id: number;
  name: string;
  total: number;
  display_total: number;
  fixed_type: string | null;
}

interface ApiGroup {
  id: number;
  group_name: string;
  group_total: number;
  children: ApiGroup[];
  ledgers: ApiLedger[];
}

interface ApiSide {
  groups: ApiGroup[];
  ledgers: ApiLedger[];
}

interface PnlApiResponse {
  code?: number;
  report?: string;
  lock_account?: { id: number; name: string };
  summary?: {
    income_total: number;
    expense_total: number;
    bt: number;
    net_profit: number;
    net_loss: number;
  };
  expense?: ApiSide;
  income?: ApiSide;
  totals?: { expense: number; income: number };
}

const ledgerAmount = (ledger: ApiLedger): number => ledger.display_total ?? ledger.total ?? 0;

const buildSideRows = (side: ApiSide | undefined, total: number): StatementRow[] => {
  if (!side) return [];
  const rows: StatementRow[] = [];

  const walkGroup = (group: ApiGroup, level: number) => {
    rows.push({ level, label: group.group_name, amount: group.group_total, isHeader: level === 0 });
    (group.children || []).forEach((child) => walkGroup(child, level + 1));
    (group.ledgers || []).forEach((ledger) => {
      rows.push({
        level: level + 1,
        label: ledger.name,
        amount: ledgerAmount(ledger),
        ledgerId: ledger.id,
      });
    });
  };

  (side.groups || []).forEach((group) => {
    walkGroup(group, 0);
    rows.push({ level: 0, label: "", amount: null, isSpacer: true });
  });

  (side.ledgers || []).forEach((ledger) => {
    rows.push({ level: 0, label: ledger.name, amount: ledgerAmount(ledger), ledgerId: ledger.id });
  });

  rows.push({ level: 0, label: "Total", amount: total, isTotal: true });

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
      const response = await axios.get<PnlApiResponse>(`${baseUrl}/lock_account_transactions/pnl`, {
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

  const expenditureRows = buildSideRows(pnlData?.expense, pnlData?.totals?.expense ?? 0);
  const incomeRows = buildSideRows(pnlData?.income, pnlData?.totals?.income ?? 0);

  const rowCount = Math.max(expenditureRows.length, incomeRows.length);

  const renderSideCells = (row?: StatementRow) => {
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
    const labelClass = row.isHeader || row.isTotal ? "font-bold" : "font-normal";
    const rowBg = row.isTotal ? "bg-gray-100" : "";

    return (
      <>
        <td className={`border border-gray-300 px-3 py-1.5 ${rowBg}`}></td>
        <td
          className={`border border-gray-300 px-3 py-1.5 ${labelClass} ${rowBg}`}
          style={{ paddingLeft: `${12 + row.level * 20}px` }}
        >
          {row.ledgerId ? (
            <Link
              to={`/accounting/profit-loss/ledger/${row.ledgerId}`}
              className="text-[#da7756] hover:underline"
            >
              {row.label}
            </Link>
          ) : (
            row.label
          )}
        </td>
        <td className={`border border-gray-300 px-3 py-1.5 text-right ${rowBg}`}>
          {row.isSpacer || showInCurrentYear ? "" : formatAmount(row.amount)}
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
        ) : rowCount === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No matching records found
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
                {Array.from({ length: rowCount }).map((_, i) => (
                  <tr key={i}>
                    {renderSideCells(expenditureRows[i])}
                    {renderSideCells(incomeRows[i])}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingProfitLoss;
