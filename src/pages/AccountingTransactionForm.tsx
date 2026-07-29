import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Trash2, Upload, X } from "lucide-react";

interface LedgerOption {
  id: number;
  name: string;
  formatted_name: string;
}

interface LineItem {
  key: string;
  ledgerId: string;
  amount: string;
}

const emptyLine = (): LineItem => ({
  key: Math.random().toString(36).slice(2),
  ledgerId: "",
  amount: "",
});

const AccountingTransactionForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const transactionType = searchParams.get("type") || "Journal";
  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const [ledgerOptions, setLedgerOptions] = useState<LedgerOption[]>([]);
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [debitRows, setDebitRows] = useState<LineItem[]>([emptyLine()]);
  const [creditRows, setCreditRows] = useState<LineItem[]>([emptyLine()]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLedgers = async () => {
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
        setLedgerOptions(response.data || []);
      } catch (error) {
        console.error("Error fetching ledger options:", error);
        toast.error("Failed to load ledgers");
      }
    };
    fetchLedgers();
  }, [lockAccountId]);

  const totalDebit = debitRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalCredit = creditRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const difference = totalDebit - totalCredit;

  const updateRow = (
    rows: LineItem[],
    setRows: React.Dispatch<React.SetStateAction<LineItem[]>>,
    key: string,
    field: "ledgerId" | "amount",
    value: string
  ) => {
    setRows(rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const addRow = (setRows: React.Dispatch<React.SetStateAction<LineItem[]>>) => {
    setRows((prev) => [...prev, emptyLine()]);
  };

  const removeRow = (
    rows: LineItem[],
    setRows: React.Dispatch<React.SetStateAction<LineItem[]>>,
    key: string
  ) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((row) => row.key !== key));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setDate("");
    setReference("");
    setNarration("");
    setDebitRows([emptyLine()]);
    setCreditRows([emptyLine()]);
    setAttachments([]);
  };

  const buildPayload = () => {
    const debitRecords = debitRows
      .filter((row) => row.ledgerId && Number(row.amount) > 0)
      .map((row) => ({
        ledger_id: Number(row.ledgerId),
        cost_centre_id: 1,
        dr: row.amount,
      }));
    const creditRecords = creditRows
      .filter((row) => row.ledgerId && Number(row.amount) > 0)
      .map((row) => ({
        ledger_id: Number(row.ledgerId),
        cost_centre_id: 1,
        cr: row.amount,
      }));

    return {
      lock_account_transaction: {
        transaction_type: transactionType,
        transaction_date: date,
        description: narration,
        reference,
        publish: false,
        lock_account_id: lockAccountId,
      },
      lock_account_transaction_records: [...debitRecords, ...creditRecords],
    };
  };

  const handleSubmit = async (addAnother: boolean) => {
    if (!date) {
      toast.error("Date is required.");
      return;
    }
    const hasDebit = debitRows.some((row) => row.ledgerId && Number(row.amount) > 0);
    const hasCredit = creditRows.some((row) => row.ledgerId && Number(row.amount) > 0);
    if (!hasDebit || !hasCredit) {
      toast.error("Please add at least one debit and one credit ledger entry.");
      return;
    }
    if (difference !== 0) {
      toast.error("Total Debit and Total Credit must be equal.");
      return;
    }

    const payload = buildPayload();
    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const url = `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_transactions.json`;
      await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Transaction created successfully");
      if (addAnother) {
        resetForm();
      } else {
        navigate("/accounting/transactions");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Failed to create transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const renderLineItemTable = (
    title: string,
    rows: LineItem[],
    setRows: React.Dispatch<React.SetStateAction<LineItem[]>>,
    total: number
  ) => (
    <div className="overflow-hidden rounded-md border border-brand-card-border">
      <div className="flex items-center border-l-4 border-l-brand bg-brand-bg px-4 py-2">
        <h3 className="text-brand-body-3 font-semibold text-brand-text">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-brand-selected text-left text-brand-body-4 text-brand-text-light">
              <th className="px-4 py-2 font-medium">Ledger</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="w-12 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-brand-border">
                <td className="px-4 py-2">
                  <Select
                    value={row.ledgerId}
                    onValueChange={(value) => updateRow(rows, setRows, row.key, "ledgerId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Ledger" />
                    </SelectTrigger>
                    <SelectContent>
                      {ledgerOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.formatted_name || option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={row.amount}
                    onChange={(e) => updateRow(rows, setRows, row.key, "amount", e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(rows, setRows, row.key)}
                    className="rounded bg-brand-error p-1 text-white hover:opacity-90 disabled:opacity-40"
                    disabled={rows.length <= 1}
                    title="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-brand-border px-4 py-3">
        <button
          type="button"
          onClick={() => addRow(setRows)}
          className="rounded bg-brand-green p-1.5 text-white hover:opacity-90"
          title={`Add ${title} row`}
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="text-brand-body-4 font-semibold text-brand-text">
          Total {title} ₹ {total.toFixed(2)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-brand-body-3 font-semibold text-brand-text">Transaction Type :</span>
        <Badge className="bg-brand-purple text-brand-text">{transactionType} Voucher</Badge>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-brand-body-4 font-medium text-brand-text">
            Date<span className="text-brand-error">*</span>
          </label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-brand-body-4 font-medium text-brand-text">
            Reference#
          </label>
          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      </div>

      <div className="mb-6 space-y-6">
        {renderLineItemTable("Debit", debitRows, setDebitRows, totalDebit)}
        {renderLineItemTable("Credit", creditRows, setCreditRows, totalCredit)}
      </div>

      <div className="mb-6 flex justify-end">
        <div className="w-full max-w-xs rounded-md border border-brand-card-border bg-brand-card p-4">
          <div className="flex justify-between py-1 text-brand-body-4">
            <span className="text-brand-text-light">Difference</span>
            <span
              className={`font-semibold ${difference !== 0 ? "text-brand-error" : "text-brand-green"}`}
            >
              {difference.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-brand-body-4 font-medium text-brand-text">
            Narration
          </label>
          <Textarea
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            rows={4}
          />
        </div>
        <div>
          <label className="mb-1 block text-brand-body-4 font-medium text-brand-text">
            Upload Files
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-brand-card-border text-brand-text-light hover:border-brand"
          >
            <Plus className="h-6 w-6" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
          />
          {attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 rounded-sm bg-brand-selected px-2 py-1 text-brand-body-5"
                >
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(index)}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-3 border-t border-brand-border pt-6">
        <Button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="min-w-[120px] bg-brand-green text-white hover:bg-brand-green/90"
        >
          Create
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          variant="outline"
          className="min-w-[160px] border-brand-teal text-brand-teal hover:bg-brand-teal/10"
        >
          Create & Add New
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/accounting/transactions")}
          className="min-w-[100px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AccountingTransactionForm;
