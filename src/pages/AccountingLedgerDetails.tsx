import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_CONFIG } from "@/config/apiConfig";
import { CalendarDays } from "lucide-react";

// Real response shape returned by GET /lock_account_ledgers/:id
interface LedgerDetailAPI {
  id: number;
  name: string;
  account_code?: string;
}

interface TransactionRecordAPI {
  id: number;
  lock_account_transaction_id?: number;
  tr_type: "dr" | "cr" | string;
  ledger_id: number;
  amount: number;
  description?: string | null;
  // Not confirmed present on this endpoint's records; read defensively.
  transaction_date?: string;
  reference?: string;
  transaction_type?: string;
  created_at?: string;
}

interface LedgerDetailResponse {
  lock_account_ledger?: LedgerDetailAPI;
  date_range?: [string, string];
  transaction_records?: TransactionRecordAPI[];
}

// "DD/MM/YYYY" <-> "YYYY-MM-DD" (the date_range comes back DD/MM/YYYY; the
// date inputs need YYYY-MM-DD).
const toInputDate = (ddmmyyyy?: string): string => {
  if (!ddmmyyyy) return "";
  const [day, month, year] = ddmmyyyy.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month}-${day}`;
};

const toApiDate = (isoDate: string): string => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

const formatDisplayDate = (value?: string): string => {
  if (!value) return "";
  // created_at comes back as an ISO timestamp; other date fields are already DD/MM/YYYY.
  if (value.includes("T") || value.includes("-")) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${date.getFullYear()}-${month}-${day}`;
    }
  }
  return value;
};

const formatAmount = (value: number) =>
  value.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const AccountingLedgerDetails: React.FC = () => {
  const { ledgerId } = useParams<{ ledgerId: string }>();
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [ledger, setLedger] = useState<LedgerDetailAPI | null>(null);
  const [records, setRecords] = useState<TransactionRecordAPI[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLedgerDetail = async (from?: string, to?: string) => {
    if (!ledgerId) return;
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get<LedgerDetailResponse>(
        `${baseUrl}/lock_account_ledgers/${ledgerId}`,
        {
          params: {
            lock_account_id: lockAccountId,
            ...(from ? { from_date: toApiDate(from) } : {}),
            ...(to ? { to_date: toApiDate(to) } : {}),
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      const data = response.data;
      setLedger(data.lock_account_ledger || null);
      setRecords(data.transaction_records || []);
      if (!from && data.date_range?.[0]) setFromDate(toInputDate(data.date_range[0]));
      if (!to && data.date_range?.[1]) setToDate(toInputDate(data.date_range[1]));
    } catch (error) {
      console.error("Error fetching ledger detail:", error);
      toast.error("Failed to load ledger details");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerId]);

  const handleSubmit = () => {
    fetchLedgerDetail(fromDate, toDate);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    fetchLedgerDetail();
  };

  const totalDebit = records
    .filter((r) => r.tr_type === "dr")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalCredit = records
    .filter((r) => r.tr_type === "cr")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const openingBalance = 0;
  const closingBalance = openingBalance + totalDebit - totalCredit;

  return (
    <div className="w-full bg-white p-6" style={{ minHeight: "100vh", boxSizing: "border-box" }}>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
        {ledger?.name || "Ledger"}
      </h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 rounded border border-[#ddd] px-3 h-10">
          <CalendarDays className="h-4 w-4 text-gray-500" />
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 border-0 shadow-none px-0 w-[130px] focus-visible:ring-0 focus-visible:outline-none"
          />
          <span className="text-gray-400">-</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 border-0 shadow-none px-0 w-[130px] focus-visible:ring-0 focus-visible:outline-none"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#C72030] hover:bg-[#B8252F] text-white h-10 px-6"
        >
          Submit
        </Button>
        <Button
          onClick={handleReset}
          disabled={loading}
          variant="outline"
          className="h-10 px-6"
        >
          Reset
        </Button>
      </div>

      <div className="flex justify-end mb-3">
        <div className="flex items-center gap-3 bg-gray-100 rounded px-4 py-2 text-sm">
          <span className="text-gray-600">Opening Balance</span>
          <span className="font-semibold">{formatAmount(openingBalance)}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="py-2 pr-4 font-semibold">Date</th>
              <th className="py-2 pr-4 font-semibold">Account</th>
              <th className="py-2 pr-4 font-semibold">Transaction Details</th>
              <th className="py-2 pr-4 font-semibold">Type</th>
              <th className="py-2 pr-4 font-semibold">Transaction ID</th>
              <th className="py-2 pr-4 font-semibold">Reference ID</th>
              <th className="py-2 pr-4 font-semibold text-right">Credit</th>
              <th className="py-2 font-semibold text-right">Debit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{formatDisplayDate(record.transaction_date || record.created_at)}</td>
                  <td className="py-2 pr-4">{ledger?.name || ""}</td>
                  <td className="py-2 pr-4">{record.description || ""}</td>
                  <td className="py-2 pr-4">{record.transaction_type || ""}</td>
                  <td className="py-2 pr-4">{record.lock_account_transaction_id ?? ""}</td>
                  <td className="py-2 pr-4">{record.reference || ""}</td>
                  <td className="py-2 pr-4 text-right">
                    {record.tr_type === "cr" ? formatAmount(-Math.abs(record.amount)) : ""}
                  </td>
                  <td className="py-2 text-right">
                    {record.tr_type === "dr" ? formatAmount(record.amount) : ""}
                  </td>
                </tr>
              ))
            )}
            {!loading && records.length > 0 && (
              <tr className="border-b border-gray-300 font-semibold">
                <td className="py-2 pr-4" colSpan={6}>
                  TOTAL
                </td>
                <td className="py-2 pr-4 text-right">{formatAmount(-totalCredit)}</td>
                <td className="py-2 text-right">{formatAmount(totalDebit)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-3 mb-6">
        <div className="flex items-center gap-3 bg-gray-100 rounded px-4 py-2 text-sm">
          <span className="text-gray-600">Closing Balance</span>
          <span className="font-semibold">{formatAmount(closingBalance)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        **Amount is displayed in your base currency{" "}
        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
          INR
        </span>
      </p>
    </div>
  );
};

export default AccountingLedgerDetails;
