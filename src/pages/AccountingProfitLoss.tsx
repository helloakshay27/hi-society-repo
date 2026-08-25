import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { API_CONFIG } from "@/config/apiConfig";
import {
  StatementNode,
  StatementRow,
  SectionTemplate,
  formatAmount,
  buildSideRows,
} from "@/utils/financialStatement";

// Real response shape returned by GET /lock_account_transactions/pnl
interface PnlSection {
  node_name: string; // "expenditure" | "income"
  accounts: StatementNode[];
}

interface PnlApiResponse {
  pnl?: {
    accounts?: PnlSection[];
  };
}

// Fixed statutory line items (Maharashtra Co-operative Societies "Form N" style
// Profit and Loss / Income & Expenditure account). Amounts are populated from
// the API by matching ledger/group names below; anything the society has
// added beyond this standard template (custom groups/ledgers) is appended
// automatically so no data is dropped.
const EXPENDITURE_TEMPLATE: SectionTemplate[] = [
  {
    label: "Indirect Expense",
    children: [
      "Interest Paid",
      "Interest Payable",
      "Bank Charges",
      "Salaries and Allowances of Staff",
      "Contribution to Staff Provident Fund",
      "Salary and Allowances of Managing Director",
      "Attendance fees and travelling expenses of Directors and Committee Members",
      "Travelling expenses of staff",
      "Rent, rates and taxes",
      "Postage, Telegram and Telephone charges",
      "Printing and Stationery",
      "Audit fees",
      "General expenses",
      "Bad Debts written off or provision made for bad debts",
      "Depreciation on fixed assets",
      "Land Income and Expenditure account",
      "Other Items",
      { label: "Net Profit carried to Balance Sheet", summary: true },
    ],
  },
];

interface PnlGroupAPI {
  id: number;
  group_name: string;
  group_total: number;
  children?: PnlGroupAPI[];
  ledgers?: PnlLedgerAPI[];
}

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
      const response = await axios.get(`${baseUrl}/lock_account_transactions/pnl`, {
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

  const expenditureNodes =
    pnlData?.pnl?.accounts?.find((s) => s.node_name === "expenditure")?.accounts || [];
  const incomeNodes =
    pnlData?.pnl?.accounts?.find((s) => s.node_name === "income")?.accounts || [];

  const { rows: expenditureRows } = buildSideRows(EXPENDITURE_TEMPLATE, expenditureNodes);
  const { rows: incomeRows } = buildSideRows(INCOME_TEMPLATE, incomeNodes);

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
