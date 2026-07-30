import React, { useState } from "react";
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

const INCOME_TEMPLATE: SectionTemplate[] = [
  {
    label: "Members Contribution",
    children: [
      "Electricity Charges",
      "Maintenance Charges",
      "Municipal Taxes",
      "Parking Charges",
      "Sub-letting Charges",
      "Water Charges",
      "Building Repair Fund",
      "Municipal Tax Arrears",
      "Sinking Fund",
    ],
  },
  {
    label: "Interest Received",
    children: [
      "On loans and advances",
      "On investments",
      "Dividend received on shares",
      "Commission",
    ],
  },
  {
    label: "Miscellaneous Income",
    children: [
      "Share Transfer fees",
      "Rent",
      "Rebate in interest",
      "Sale of forms",
      "Other items",
      "Land Income and Expenditure accounts",
    ],
  },
];

// TODO: replace with a real fetch (same tree shape) once the Profit & Loss
// API endpoint is available; wired up the same way as AccountingBalanceSheet.
const DUMMY_EXPENDITURE_NODES: StatementNode[] = [
  {
    name: "Indirect Expense",
    values: [{ total: 0 }],
    accounts: [
      { name: "Lift Pvt Ltd", values: [{ total: 0 }] },
      { name: "KALESHWARI ENGINEERS PRIVATE LIMITED", values: [{ total: 0 }] },
      { name: "ACHLA CORPORATION", values: [{ total: 0 }] },
      { name: "CNW property solutions", values: [{ total: 0 }] },
      { name: "Unify Facility Management Pvt Ltd", values: [{ total: 0 }] },
      { name: "Cosmos Integrated Solutions Pvt. Ltd.", values: [{ total: 0 }] },
      { name: "ANSEC H.R.SERVICES LTD.", values: [{ total: 0 }] },
      { name: "TATA", values: [{ total: 0 }] },
    ],
  },
];

const DUMMY_INCOME_NODES: StatementNode[] = [
  {
    name: "Miscellaneous Income",
    values: [{ total: 0 }],
    accounts: [
      { name: "Sinking Fund", values: [{ total: 0 }] },
      { name: "Repair Fund", values: [{ total: 0 }] },
      { name: "Common Maintenance Charges", values: [{ total: 0 }] },
      { name: "Common Electricity Charges", values: [{ total: 0 }] },
      { name: "Common Insurance", values: [{ total: 0 }] },
      { name: "Statutory, Water and Other Expenses", values: [{ total: 0 }] },
      { name: "Non Occupancy Charges", values: [{ total: 0 }] },
    ],
  },
];

const AccountingProfitLoss: React.FC = () => {
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const { rows: expenditureRows } = buildSideRows(EXPENDITURE_TEMPLATE, DUMMY_EXPENDITURE_NODES);
  const { rows: incomeRows } = buildSideRows(INCOME_TEMPLATE, DUMMY_INCOME_NODES);

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

    const showInCurrentYear = row.isHeader || row.isTotal || row.isSummary;
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
          <Button className="bg-[#C72030] hover:bg-[#A01020] text-white h-[40px]">View</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">Profit and Loss</h1>
        </div>

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
      </div>
    </div>
  );
};

export default AccountingProfitLoss;
