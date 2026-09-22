import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";
import { StatementRow, formatAmount } from "@/utils/financialStatement";

// Real response shape returned by GET /lock_account_transactions/balance_sheet.
// Unlike Profit & Loss (a flat statutory template filled from one "accounts"
// tree — see AccountingProfitLoss.tsx / utils/financialStatement.ts), this API
// already returns each side's groups in the correct statutory order with real
// amounts, nested up to 3 levels deep (group -> children -> ledgers at any
// level). So rather than forcing it through the P&L page's single-level
// template matcher (which would drop anything past the first nested level),
// this page walks the given tree directly — nothing here is reordered or
// relabelled, just laid out the same visual way as the P&L report.
interface ApiLedger {
  id: number | null;
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
  total: number;
}

interface BalanceSheetApiResponse {
  code?: number;
  report?: string;
  lock_account?: { id: number; name: string };
  liability?: ApiSide;
  assets?: ApiSide;
}

const ledgerAmount = (ledger: ApiLedger): number => ledger.display_total ?? ledger.total ?? 0;

const buildSideRows = (side: ApiSide | undefined): StatementRow[] => {
  if (!side) return [];
  const rows: StatementRow[] = [];

  const walkGroup = (group: ApiGroup, level: number) => {
    rows.push({ level, label: group.group_name, amount: group.group_total, isHeader: level === 0 });
    group.children.forEach((child) => walkGroup(child, level + 1));
    group.ledgers.forEach((ledger) => {
      rows.push({ level: level + 1, label: ledger.name, amount: ledgerAmount(ledger) });
    });
  };

  side.groups.forEach((group) => {
    walkGroup(group, 0);
    rows.push({ level: 0, label: "", amount: null, isSpacer: true });
  });

  side.ledgers.forEach((ledger) => {
    rows.push({ level: 0, label: ledger.name, amount: ledgerAmount(ledger) });
  });

  rows.push({ level: 0, label: "Total", amount: side.total, isTotal: true });

  return rows;
};

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

  const liabilityRows = buildSideRows(balanceSheetData?.liability);
  const assetRows = buildSideRows(balanceSheetData?.assets);
  const rowCount = Math.max(liabilityRows.length, assetRows.length);

  // Same 4-column-per-side layout as AccountingProfitLoss.tsx: Previous Year
  // stays blank (the API doesn't return a prior-period comparison), the
  // "Total" column carries each row's amount, and "Current Year" is only
  // populated on the grand total row — matching the P&L report exactly.
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
          {row.label}
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
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold uppercase">Balance Sheet</h1>
          {/* {balanceSheetData?.lock_account?.name && (
            <p className="text-sm text-gray-500">{balanceSheetData.lock_account.name}</p>
          )} */}
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
                  <th className="border border-gray-300 px-3 py-2 text-left">Liabilities</th>
                  <th className="border border-gray-300 px-3 py-2">Total</th>
                  <th className="border border-gray-300 px-3 py-2">Current Year</th>
                  <th className="border border-gray-300 px-3 py-2">Previous Year</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Assets</th>
                  <th className="border border-gray-300 px-3 py-2">Total</th>
                  <th className="border border-gray-300 px-3 py-2">Current Year</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rowCount }).map((_, i) => (
                  <tr key={i}>
                    {renderSideCells(liabilityRows[i])}
                    {renderSideCells(assetRows[i])}
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

export default AccountingBalanceSheet;
