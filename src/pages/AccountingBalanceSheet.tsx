import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import {
  StatementNode,
  StatementRow,
  SectionTemplate,
  formatAmount,
  buildSideRows,
} from "@/utils/financialStatement";

// Real response shape returned by
// GET /lock_accounts/{lock_account_id}/lock_account_transactions/balance_sheet.json
interface BalanceSheetSection {
  node_name: string; // "assets" | "liability_and_equity"
  accounts: StatementNode[];
}

interface BalanceSheetApiResponse {
  balance_sheet?: {
    accounts?: BalanceSheetSection[];
  };
  totals?: {
    total_assets?: number;
    total_liabilities?: number;
  };
}

// Fixed statutory line items (Maharashtra Co-operative Societies "Form N" style
// Balance Sheet). Amounts are populated from the API by matching ledger/group
// names below; anything the society has added beyond this standard template
// (custom groups/ledgers) is appended automatically so no data is dropped.
const LIABILITIES_TEMPLATE: SectionTemplate[] = [
  {
    label: "Share Capital",
    children: [
      "Issued Subscribed & Paid up Capital",
      "Purchased by the Govt.",
      "Purchased by Co-op Societies",
      "Purchased by Individuals",
      "Shares in Advance",
      "Less: Calls in arrears",
      "Add: Calls in advances",
    ],
  },
  { label: "Subscription towards shares", children: [] },
  {
    label: "Reserve Fund and Other Funds",
    children: [
      "Statutory Reserve Funds",
      "Building Fund",
      "Special Development Fund",
      "Bad and Doubtful Debts Reserve",
      "Investment Depreciation Fund",
      "Dividend Equalisation Fund",
      "Bonus Equalisation Fund",
      "Reserve for overdue interest",
      "Other Funds",
      "Net Profit / Loss carried from Balance Sheet",
    ],
  },
  { label: "Staff Provident Fund", children: [] },
  {
    label: "Secured Loans",
    children: [
      "Debentures",
      "Loans, overdrafts and cash credits from banks",
      "Loans from Government",
      "Other secured loans",
    ],
  },
  {
    label: "Unsecured Loans",
    children: [
      "Loans, cash credits and overdrafts from Central Banks",
      "Loans from other Societies",
      "Other unsecured loans",
    ],
  },
  {
    label: "Deposits",
    children: [
      "Fixed Deposits",
      "Savings Bank Deposits",
      "Current Deposits",
      "Deposit at Call",
    ],
  },
  {
    label: "Other Liabilities",
    children: [
      "Bills Payable",
      "Sundry Creditors",
      "Outstanding Liabilities for Expenses",
      "Advance Collection from Members",
      "Statutory Liabilities (TDS/GST Payable)",
      "Other Liabilities",
    ],
  },
  {
    label: "Provisions",
    children: [
      "Provision for Taxation",
      "Provision for Bad and Doubtful Debts",
      "Other Provisions",
    ],
  },
  { label: "Profit and Loss Account (Net Profit for the year)", children: [] },
];

const ASSETS_TEMPLATE: SectionTemplate[] = [
  {
    label: "Cash and Bank balances",
    children: [
      "Cash in banks",
      "Current Account",
      "Savings Banks Account",
      "Call Deposits on Banks",
    ],
  },
  {
    label: "Investments",
    children: [
      "Government Securities",
      "Other Trustee Securities",
      "Non-Trustee Securities",
      "Shares of other co-operative Societies",
      "Shares, Debentures or Bonds of companies registered under the Companies Act",
      "Fixed Deposits",
      "Investment of Staff Provident Fund",
      "Advances against Staff Provident Fund",
    ],
  },
  {
    label: "Loans and Advances",
    children: [
      "Loans",
      "Overdrafts",
      "Cash credits (Against Pledge of Goods, Against Hypothecation of Goods, Clean)",
      "Loans due by Managing Committee Members",
      "Loans due by Secretary and other employees",
    ],
  },
  {
    label: "Sundry Debtors",
    children: ["Credit Sales", "Advances", "Others"],
  },
  {
    label: "Current Assets",
    children: [
      "Stores and spare parts",
      "Stock-in-trade",
      "Interest Receivable",
      "Rent Receivable",
      "Prepaid Expenses",
      "Other Current Assets",
    ],
  },
  {
    label: "Fixed Assets",
    children: [
      "Land",
      "Buildings",
      "Furniture and Fixtures",
      "Office Equipment",
      "Computers",
      "Vehicles",
      "Less: Depreciation",
    ],
  },
  {
    label: "Other Assets",
    children: ["Deferred Revenue Expenditure", "Preliminary Expenses"],
  },
  { label: "Profit and Loss Account (Net Loss for the year)", children: [] },
];

const AccountingBalanceSheet: React.FC = () => {
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");
  const lock_account_id = localStorage.getItem("lock_account_id");

  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });

  const fetchBalanceSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://${baseUrl}/lock_accounts/${lock_account_id}/lock_account_transactions/balance_sheet.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: {
            from_date: filters.fromDate || undefined,
            to_date: filters.toDate || undefined,
          },
        },
      );
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

  const liabilitiesNodes =
    balanceSheetData?.balance_sheet?.accounts?.find((s) => s.node_name === "liability_and_equity")
      ?.accounts || [];
  const assetsNodes =
    balanceSheetData?.balance_sheet?.accounts?.find((s) => s.node_name === "assets")?.accounts ||
    [];

  const { rows: liabilitiesRows } = buildSideRows(LIABILITIES_TEMPLATE, liabilitiesNodes);
  const { rows: assetsRows } = buildSideRows(ASSETS_TEMPLATE, assetsNodes);

  const rowCount = Math.max(liabilitiesRows.length, assetsRows.length);

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
          {row.isHeader || row.isTotal ? "" : formatAmount(row.amount)}
        </td>
        <td className={`border border-gray-300 px-3 py-1.5 text-right ${labelClass} ${rowBg}`}>
          {row.isHeader || row.isTotal ? formatAmount(row.amount) : ""}
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
                  <th className="border border-gray-300 px-3 py-2">Previous Year</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Liabilities</th>
                  <th className="border border-gray-300 px-3 py-2">Amount</th>
                  <th className="border border-gray-300 px-3 py-2">Current Year</th>
                  <th className="border border-gray-300 px-3 py-2">Previous Year</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Assets</th>
                  <th className="border border-gray-300 px-3 py-2">Amount</th>
                  <th className="border border-gray-300 px-3 py-2">Current Year</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rowCount }).map((_, i) => (
                  <tr key={i}>
                    {renderSideCells(liabilitiesRows[i])}
                    {renderSideCells(assetsRows[i])}
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
