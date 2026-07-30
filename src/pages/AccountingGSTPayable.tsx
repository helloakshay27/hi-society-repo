import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
import { formatAmount } from "@/utils/financialStatement";

interface GstPayableRow {
  ledgerName: string;
  gstPercent: string;
  totalAmount: number;
  gstAmount: number;
}

// TODO: replace with a real fetch once the GST Payable API endpoint is
// available; wire it the same way as AccountingBalanceSheet.
const DUMMY_GST_PAYABLE_ROWS: GstPayableRow[] = [
  { ledgerName: "CGST Payable", gstPercent: "9%", totalAmount: 10000, gstAmount: 900 },
  { ledgerName: "SGST Payable", gstPercent: "9%", totalAmount: 10000, gstAmount: 900 },
  { ledgerName: "IGST Payable", gstPercent: "18%", totalAmount: 5000, gstAmount: 900 },
  { ledgerName: "GST Payable - Reverse Charge", gstPercent: "18%", totalAmount: 2000, gstAmount: 360 },
];

const AccountingGSTPayable: React.FC = () => {
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
          <Button className="bg-[#C72030] hover:bg-[#A01020] text-white h-[40px]">View</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">GST Payable</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-[#E5E0D3]">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Ledger Name</th>
                <th className="border border-gray-300 px-3 py-2">GST %</th>
                <th className="border border-gray-300 px-3 py-2">Total Amount</th>
                <th className="border border-gray-300 px-3 py-2">GST Amount</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_GST_PAYABLE_ROWS.map((row) => (
                <tr key={row.ledgerName}>
                  <td className="border border-gray-300 px-3 py-1.5">{row.ledgerName}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right">{row.gstPercent}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right">
                    {formatAmount(row.totalAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right">
                    {formatAmount(row.gstAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountingGSTPayable;
