import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { formatAmount } from "@/utils/financialStatement";
import { DUMMY_TAX_SUMMARY_ROWS, formatLedgerTaxName } from "@/utils/taxSummary";

const AccountingTaxSummary: React.FC = () => {
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });

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
          <Button className="bg-[#C72030] hover:bg-[#A01020] text-white h-[40px]">View</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">Tax Summary</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-[#E5E0D3]">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Ledger ID</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Ledger & Tax Name</th>
                <th className="border border-gray-300 px-3 py-2">Tax Percentage</th>
                <th className="border border-gray-300 px-3 py-2">Transaction Amount</th>
                <th className="border border-gray-300 px-3 py-2">Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_TAX_SUMMARY_ROWS.map((row) => (
                <tr key={row.ledgerId}>
                  <td className="border border-gray-300 px-3 py-1.5">{row.ledgerId}</td>
                  <td className="border border-gray-300 px-3 py-1.5">{formatLedgerTaxName(row)}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right">{row.taxPercentage}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right">
                    {formatAmount(row.transactionAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right">{row.taxAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountingTaxSummary;
