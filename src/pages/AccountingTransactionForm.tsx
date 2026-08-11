import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import { API_CONFIG } from "@/config/apiConfig";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";

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

// <input type="date"> gives "YYYY-MM-DD"; the API expects "DD/MM/YYYY".
const toApiDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

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
            Accept: "application/json",
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
        cost_centre_id: null,
        dr: row.amount,
      }));
    const creditRecords = creditRows
      .filter((row) => row.ledgerId && Number(row.amount) > 0)
      .map((row) => ({
        ledger_id: Number(row.ledgerId),
        cost_centre_id: null,
        cr: row.amount,
      }));

    const createdBy = localStorage.getItem("userId");

    return {
      lock_account_transaction: {
        lock_account_id: Number(lockAccountId),
        transaction_type: transactionType,
        transaction_date: toApiDate(date),
        description: narration,
        reference,
        ...(createdBy ? { created_by: Number(createdBy) } : {}),
      },
      lock_account_transaction_records: [...debitRecords, ...creditRecords],
      attachments: [],
    };
  };

  // File objects can't be JSON-encoded, so when attachments are present the
  // whole request goes as multipart/form-data with Rails-style bracket keys
  // instead of the plain JSON body buildPayload() produces.
  const buildFormData = () => {
    const formData = new FormData();
    const createdBy = localStorage.getItem("userId");

    formData.append("lock_account_transaction[lock_account_id]", lockAccountId);
    formData.append("lock_account_transaction[transaction_type]", transactionType);
    formData.append("lock_account_transaction[transaction_date]", toApiDate(date));
    formData.append("lock_account_transaction[description]", narration);
    formData.append("lock_account_transaction[reference]", reference);
    if (createdBy) {
      formData.append("lock_account_transaction[created_by]", createdBy);
    }

    const debitRecords = debitRows
      .filter((row) => row.ledgerId && Number(row.amount) > 0)
      .map((row) => ({ ledgerId: row.ledgerId, field: "dr" as const, amount: row.amount }));
    const creditRecords = creditRows
      .filter((row) => row.ledgerId && Number(row.amount) > 0)
      .map((row) => ({ ledgerId: row.ledgerId, field: "cr" as const, amount: row.amount }));

    [...debitRecords, ...creditRecords].forEach((record, index) => {
      formData.append(`lock_account_transaction_records[${index}][ledger_id]`, record.ledgerId);
      formData.append(`lock_account_transaction_records[${index}][${record.field}]`, record.amount);
    });

    attachments.forEach((file) => {
      formData.append("attachments[]", file);
    });

    return formData;
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

    const hasAttachments = attachments.length > 0;
    setSubmitting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const url = `${baseUrl}/lock_account_transactions`;
      const authHeader = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      if (hasAttachments) {
        await axios.post(url, buildFormData(), { headers: authHeader });
      } else {
        await axios.post(url, buildPayload(), {
          headers: { "Content-Type": "application/json", ...authHeader },
        });
      }
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
                  <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">
                    <FormControl variant="standard" fullWidth>
                      <Select
                        value={row.ledgerId}
                        onChange={(e) => updateRow(rows, setRows, row.key, "ledgerId", e.target.value as string)}
                        displayEmpty
                        disableUnderline
                        sx={{
                          height: 36,
                          outline: "none",
                          "& .MuiSelect-select": { paddingLeft: "12px" },
                          "& .MuiSelect-select:focus": { outline: "none", backgroundColor: "transparent" },
                        }}
                        MenuProps={{
                          ...menuProps,
                          PaperProps: {
                            ...menuProps.PaperProps,
                            style: { ...menuProps.PaperProps.style, maxHeight: 300 },
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          Select Ledger
                        </MenuItem>
                        {ledgerOptions.map((option) => (
                          <MenuItem key={option.id} value={String(option.id)}>
                            {option.formatted_name || option.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="rounded border border-[#ddd] focus-within:border-[#da7756]">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) => updateRow(rows, setRows, row.key, "amount", e.target.value)}
                      className="border-0 focus-visible:border-0"
                    />
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(rows, setRows, row.key)}
                    className="rounded bg-[#C72030] p-1 text-white hover:opacity-90 disabled:opacity-40"
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
          className="rounded bg-[#C72030] p-1.5 text-white hover:opacity-90"
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
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="mb-4 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/accounting/transactions")}
          className="text-[#1a1a1a] w-10 h-10 rounded-lg p-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-brand-body-3 font-semibold text-brand-text">Back</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-brand-body-3 font-semibold text-brand-text">Transaction Type :</span>
        <Badge className="bg-[#C72030] text-white">{transactionType} Voucher</Badge>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
          <legend className="px-1 text-gray-500 font-medium text-sm">
            Date <span className="text-red-500">*</span>
          </legend>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:outline-none"
          />
        </fieldset>
        <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
          <legend className="px-1 text-gray-500 font-medium text-sm">Reference#</legend>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Enter Reference Number"
            className="h-9 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:outline-none"
          />
        </fieldset>
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
              className={`font-semibold ${difference !== 0 ? "text-[#C72030]" : "text-brand-text"}`}
            >
              {difference.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <fieldset className="border border-[#ddd] rounded px-3 pb-1 pt-0 focus-within:border-[#da7756]">
          <legend className="px-1 text-gray-500 font-medium text-sm">Narration</legend>
          <Textarea
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            rows={4}
            placeholder="Enter Narration"
            className="border-0 shadow-none px-0 resize-none focus-visible:ring-0 focus-visible:outline-none"
          />
        </fieldset>
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
          className="min-w-[120px] bg-[#C72030] hover:bg-[#B8252F] text-white"
        >
          Create
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="min-w-[160px] !bg-white border !border-[#da7756] !text-[#da7756]"
        >
          Create & Add New
        </Button>
        <Button
          type="button"
          onClick={() => navigate("/accounting/transactions")}
          className="min-w-[100px] !bg-white border !border-[#da7756] !text-[#da7756]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AccountingTransactionForm;
