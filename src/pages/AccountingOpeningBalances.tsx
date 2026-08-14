import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, X, CalendarDays, Wallet } from "lucide-react";

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
        const url = `${baseUrl}/lock_account_ledgers/opening.json`;
        const response = await axios.get(url, {
          params: { lock_account_id: lockAccountId },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const rawLedgers = response.data?.lock_account_ledgers || [];
        const options: LedgerOption[] = rawLedgers.map((item: any) => ({
          id: item.id,
          name: item.name,
        }));
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

    const ledgerPayload: Record<string, { dr_amount: string; cr_amount: string }> = {};
    visibleLedgers.forEach((ledger) => {
      const entry = values[ledger.id];
      const debit = entry?.debit && Number(entry.debit) > 0 ? entry.debit : "";
      const credit = entry?.credit && Number(entry.credit) > 0 ? entry.credit : "";
      if (debit || credit) {
        ledgerPayload[String(ledger.id)] = { dr_amount: debit, cr_amount: credit };
      }
    });

    if (Object.keys(ledgerPayload).length === 0) {
      toast.error("Please enter at least one debit or credit amount");
      return;
    }

    if (adjustment > 0 && adjustmentLedger) {
      ledgerPayload[String(adjustmentLedger.id)] = adjustmentOnCreditSide
        ? { dr_amount: "", cr_amount: String(adjustment) }
        : { dr_amount: String(adjustment), cr_amount: "" };
    }

    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const payload = {
        lock_account_id: Number(lockAccountId),
        tr_date: date,
        ledger: ledgerPayload,
      };

      await axios.post(`${baseUrl}/lock_account_ledgers/create_opening.json`, payload, {
        params: { lock_account_id: lockAccountId },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Opening balance submitted successfully");
    } catch (error) {
      console.error("Error submitting opening balance:", error);
      toast.error("Failed to submit opening balance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white p-6" style={{ minHeight: "100vh", boxSizing: "border-box" }}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Opening Balance</h1>

      {/* Opening Balance Date Section */}
      <div className="bg-white rounded-lg border-2 p-6 space-y-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">Opening Balance Date</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Opening Balance Date <span className="text-[#da7756]">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-9 md:h-[45px]"
            />
          </div>
        </div>
      </div>

      {/* Accounts Section */}
      <div className="bg-white rounded-lg border-2 p-6 space-y-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">Accounts</h3>
        </div>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="flex items-center py-2 px-3 border-b border-gray-300 bg-gray-50 text-sm font-semibold text-gray-800">
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
                className="flex items-center py-2 px-3 border-b border-gray-200 text-sm"
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

          <div className="py-2 px-3 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setIsAddingAccount(true)}
              className="flex items-center gap-1 text-sm text-[#C72030] hover:text-[#A01020] font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> New Account
            </button>
          </div>

          <div className="flex items-center py-2 px-3 border-b border-gray-300 bg-gray-50 text-sm font-semibold text-gray-800">
            <div className="flex-1 text-right pr-4">Total</div>
            <div className="w-40 text-right pr-2">{formatAmount(totalDebit)}</div>
            <div className="w-40 text-right">{formatAmount(totalCredit)}</div>
          </div>

          <div className="py-2 px-3 border-b border-gray-200">
            <div className="flex items-center text-sm">
              <div className="flex-1 text-[#da7756] font-medium">Opening Balance Adjustments</div>
              <div className="w-40 text-right pr-2 text-[#da7756]">
                {!adjustmentOnCreditSide ? formatAmount(adjustment) : ""}
              </div>
              <div className="w-40 text-right text-[#da7756]">
                {adjustmentOnCreditSide ? formatAmount(adjustment) : ""}
              </div>
            </div>
            <p className="text-xs text-gray-500 italic mt-1">
              This account will hold the difference in the credits and debits.
            </p>
          </div>

          <div className="flex items-center py-2 px-3 border-b border-gray-300 bg-gray-50 text-sm font-bold text-gray-900">
            <div className="flex-1 text-right pr-4">TOTAL AMOUNT</div>
            <div className="w-40 text-right pr-2">{formatAmount(finalDebit)}</div>
            <div className="w-40 text-right">{formatAmount(finalCredit)}</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 italic">
          including Opening Balance Adjustment account
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-5 mt-5 mb-5 justify-center">
        <Button
          onClick={handleContinue}
          disabled={submitting || loading}
variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium"     
              >
          {submitting ? "Submitting..." : "Continue"}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={submitting}
          className="min-w-[100px]"
        >
          Cancel
        </Button>
      </div>

      <Dialog
        open={isAddingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingAccount(false);
            setNewAccountId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">New Account</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingAccount(false);
                setNewAccountId("");
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 px-6 py-4">
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[160px_1fr]">
              <label className="text-sm font-medium text-gray-800">Select Account</label>
              <Select value={newAccountId} onValueChange={setNewAccountId}>
                <SelectTrigger className="h-9">
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
            </div>
          </div>

          <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-200">
            <Button
              onClick={handleAddAccount}
              disabled={!newAccountId}
              className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
            >
              Add
            </Button>
            <Button
              onClick={() => {
                setIsAddingAccount(false);
                setNewAccountId("");
              }}
              className="px-6 sm:px-8 w-full sm:w-auto !bg-white border !border-[#da7756] !text-[#da7756] h-10"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingOpeningBalances;
