import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus } from "lucide-react";

interface LedgerOption {
  id: number;
  name: string;
}

interface LedgerValue {
  debit: string;
  credit: string;
}

const formatAmount = (value: number) =>
  value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AccountingOpeningBalances: React.FC = () => {
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [date, setDate] = useState("");
  const [ledgers, setLedgers] = useState<LedgerOption[]>([]);
  const [visibleLedgerIds, setVisibleLedgerIds] = useState<number[]>([]);
  const [values, setValues] = useState<Record<number, LedgerValue>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountId, setNewAccountId] = useState("");

  useEffect(() => {
    const fetchLedgers = async () => {
      setLoading(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const url = `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_ledgers.json`;
        const response = await axios.get(url, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const options: LedgerOption[] = Array.isArray(response.data)
          ? response.data.map((item: any) => ({ id: item.id, name: item.name }))
          : [];
        setLedgers(options);
        setVisibleLedgerIds(options.map((option) => option.id));
        setValues(
          options.reduce((acc, option) => {
            acc[option.id] = { debit: "", credit: "" };
            return acc;
          }, {} as Record<number, LedgerValue>)
        );
      } catch (error) {
        console.error("Error fetching ledgers:", error);
        toast.error("Failed to load accounts");
        setLedgers([]);
        setVisibleLedgerIds([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLedgers();
  }, [lockAccountId]);

  const ledgerById = useMemo(() => {
    const map = new Map<number, LedgerOption>();
    ledgers.forEach((ledger) => map.set(ledger.id, ledger));
    return map;
  }, [ledgers]);

  const visibleLedgers = useMemo(
    () => visibleLedgerIds.map((id) => ledgerById.get(id)).filter(Boolean) as LedgerOption[],
    [visibleLedgerIds, ledgerById]
  );

  const remainingLedgers = useMemo(
    () => ledgers.filter((ledger) => !visibleLedgerIds.includes(ledger.id)),
    [ledgers, visibleLedgerIds]
  );

  const adjustmentLedger = useMemo(
    () => ledgers.find((ledger) => ledger.name.trim().toLowerCase() === "opening balance adjustments"),
    [ledgers]
  );

  const handleValueChange = (ledgerId: number, field: "debit" | "credit", value: string) => {
    if (value !== "" && Number.isNaN(Number(value))) return;
    setValues((prev) => ({
      ...prev,
      [ledgerId]: {
        ...prev[ledgerId],
        [field]: value,
      },
    }));
  };

  const totalDebit = visibleLedgers.reduce(
    (sum, ledger) => sum + Number(values[ledger.id]?.debit || 0),
    0
  );
  const totalCredit = visibleLedgers.reduce(
    (sum, ledger) => sum + Number(values[ledger.id]?.credit || 0),
    0
  );
  const adjustment = Math.abs(totalDebit - totalCredit);
  const adjustmentOnCreditSide = totalDebit >= totalCredit;
  const finalDebit = totalDebit + (adjustmentOnCreditSide ? 0 : adjustment);
  const finalCredit = totalCredit + (adjustmentOnCreditSide ? adjustment : 0);

  const handleAddAccount = () => {
    if (!newAccountId) return;
    setVisibleLedgerIds((prev) => [...prev, Number(newAccountId)]);
    setValues((prev) => ({
      ...prev,
      [Number(newAccountId)]: prev[Number(newAccountId)] || { debit: "", credit: "" },
    }));
    setNewAccountId("");
    setIsAddingAccount(false);
  };

  const handleCancel = () => {
    window.history.back();
  };

  const handleContinue = async () => {
    if (!date) {
      toast.error("Opening Balance Date is required");
      return;
    }

    const records = visibleLedgers
      .flatMap((ledger) => {
        const entry = values[ledger.id];
        const rows: { ledger_id: number; dr?: string; cr?: string }[] = [];
        if (entry?.debit && Number(entry.debit) > 0) {
          rows.push({ ledger_id: ledger.id, dr: entry.debit });
        }
        if (entry?.credit && Number(entry.credit) > 0) {
          rows.push({ ledger_id: ledger.id, cr: entry.credit });
        }
        return rows;
      });

    if (records.length === 0) {
      toast.error("Please enter at least one debit or credit amount");
      return;
    }

    if (adjustment > 0 && adjustmentLedger) {
      records.push(
        adjustmentOnCreditSide
          ? { ledger_id: adjustmentLedger.id, cr: String(adjustment) }
          : { ledger_id: adjustmentLedger.id, dr: String(adjustment) }
      );
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const payload = {
        lock_account_transaction: {
          transaction_type: "Opening Balance",
          transaction_date: date,
          description: `Opening balances as on ${date}`,
          publish: true,
          lock_account_id: lockAccountId,
        },
        lock_account_transaction_records: records,
      };

      await axios.post(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_transactions.json`,
        payload,
        { headers }
      );
      toast.success("Opening balance submitted successfully");
    } catch (error) {
      console.error("Error submitting opening balance:", error);
      toast.error("Failed to submit opening balance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex gap-10">
        <div className="flex-1 max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Opening Balance</h1>

          <div className="flex items-center gap-4 bg-gray-100 px-4 py-3 mb-2">
            <label className="text-sm font-medium text-[#a94442] whitespace-nowrap">
              Opening Balance Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-64 bg-white"
              placeholder="DD/MM/YYYY"
            />
          </div>

          <div className="border-t border-gray-200">
            <div className="flex items-center py-2 border-b border-gray-300 text-sm font-semibold text-gray-800">
              <div className="flex-1">Accounts</div>
              <div className="w-40 text-right pr-2">Debit (INR)</div>
              <div className="w-40 text-right">Credit (INR)</div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading accounts...</div>
            ) : (
              visibleLedgers.map((ledger) => (
                <div
                  key={ledger.id}
                  className="flex items-center py-2 border-b border-gray-200 text-sm"
                >
                  <div className="flex-1 text-gray-700">{ledger.name}</div>
                  <div className="w-40 pr-2">
                    <Input
                      type="number"
                      min={0}
                      value={values[ledger.id]?.debit || ""}
                      onChange={(e) => handleValueChange(ledger.id, "debit", e.target.value)}
                      className="h-9 text-right"
                    />
                  </div>
                  <div className="w-40">
                    <Input
                      type="number"
                      min={0}
                      value={values[ledger.id]?.credit || ""}
                      onChange={(e) => handleValueChange(ledger.id, "credit", e.target.value)}
                      className="h-9 text-right"
                    />
                  </div>
                </div>
              ))
            )}

            <div className="py-2 border-b border-gray-200">
              {isAddingAccount ? (
                <div className="flex items-center gap-2">
                  <Select value={newAccountId} onValueChange={setNewAccountId}>
                    <SelectTrigger className="w-64 h-9">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {remainingLedgers.map((ledger) => (
                        <SelectItem key={ledger.id} value={String(ledger.id)}>
                          {ledger.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddAccount} disabled={!newAccountId}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingAccount(false);
                      setNewAccountId("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-3.5 w-3.5" /> New Account
                </button>
              )}
            </div>

            <div className="flex items-center py-2 border-b border-gray-300 text-sm font-semibold text-gray-800">
              <div className="flex-1 text-right pr-4">Total</div>
              <div className="w-40 text-right pr-2">{formatAmount(totalDebit)}</div>
              <div className="w-40 text-right">{formatAmount(totalCredit)}</div>
            </div>

            <div className="py-2 border-b border-gray-200">
              <div className="flex items-center text-sm">
                <div className="flex-1 text-[#a94442] font-medium">Opening Balance Adjustments</div>
                <div className="w-40 text-right pr-2 text-[#a94442]">
                  {!adjustmentOnCreditSide ? formatAmount(adjustment) : ""}
                </div>
                <div className="w-40 text-right text-[#a94442]">
                  {adjustmentOnCreditSide ? formatAmount(adjustment) : ""}
                </div>
              </div>
              <p className="text-xs text-gray-500 italic mt-1">
                This account will hold the difference in the credits and debits.
              </p>
            </div>

            <div className="flex items-center py-2 border-b border-gray-300 text-sm font-bold text-gray-900">
              <div className="flex-1 text-right pr-4">TOTAL AMOUNT</div>
              <div className="w-40 text-right pr-2">{formatAmount(finalDebit)}</div>
              <div className="w-40 text-right">{formatAmount(finalCredit)}</div>
            </div>
            <p className="text-xs text-gray-500 italic py-1">
              including Opening Balance Adjustment account
            </p>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              onClick={handleContinue}
              disabled={submitting || loading}
              className="bg-sky-500 hover:bg-sky-600 text-white min-w-[110px]"
            >
              {submitting ? "Submitting..." : "Continue"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </div>

        <div className="w-64 flex-shrink-0 hidden lg:block">
          <h3 className="text-xs font-bold text-gray-500 tracking-wide mb-3">RELATED TIPS</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <span className="text-blue-600 hover:underline cursor-pointer">
                What is an opening balance?
              </span>
            </li>
            <li>
              <span className="text-blue-600 hover:underline cursor-pointer">
                How do I enter opening balance for my customers and vendors?
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccountingOpeningBalances;
