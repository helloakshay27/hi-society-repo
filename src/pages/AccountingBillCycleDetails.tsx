import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, Pencil, Upload, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CommonImportModal } from "@/components/CommonImportModal";
import { API_CONFIG } from "@/config/apiConfig";

interface SocietyBillCycleDetail {
  name: string;
  start_month: string;
  end_month: string;
  payment_due_in: number;
  frequency: string;
  fine_type?: string;
  fine_rate?: number;
  interest_type?: string;
  interest_rate?: number;
  charge_names?: string[];
  charge_setup_ids?: number[];
  expense_charge_options?: { charge_setup_id: number; name: string }[];
  bill_frequencies?: Record<string, unknown>[];
  expense_bill?: boolean;
  active: number;
}

interface ChargeOption {
  id: number;
  name: string;
}

interface ExpenseChargeRow {
  id: string;
  chargeSetupId: number;
  chargeName: string;
  chargeAmount: number;
}

interface InvoiceFrequencyRow {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  billingDate: string;
  invoiceRaised: boolean;
  expenseCharges: ExpenseChargeRow[];
}

const pick = (obj: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  }
  return undefined;
};

// GET /lock_account_bills/bill_frequencies?bill_cycle_id=... — same endpoint
// used to populate the "Bill Cycle Frequency" dropdown on invoice creation,
// but the individual period records also carry date_start/date_end/ondate/
// invoice_raised/expense_charges, which is what this page's Invoice
// Frequency table needs.
const mapInvoiceFrequencyRow = (item: Record<string, unknown>): InvoiceFrequencyRow => ({
  id: String(pick(item, "id") ?? ""),
  name: String(
    pick(item, "name", "label") ??
      `${pick(item, "date_start", "start_date", "from_date") ?? ""} to ${pick(item, "date_end", "end_date", "to_date") ?? ""}`
  ),
  startDate: String(pick(item, "date_start", "start_date", "from_date") ?? ""),
  endDate: String(pick(item, "date_end", "end_date", "to_date") ?? ""),
  billingDate: String(pick(item, "ondate", "billing_date", "bill_date") ?? ""),
  invoiceRaised: Boolean(pick(item, "invoice_raised", "invoiced", "is_invoiced")),
  expenseCharges: (Array.isArray(item.expense_charges) ? item.expense_charges : []).map(
    (charge: Record<string, unknown>) => ({
      id: String(pick(charge, "id") ?? ""),
      chargeSetupId: Number(pick(charge, "charge_setup_id") ?? 0),
      chargeName: String(pick(charge, "charge_name") ?? ""),
      chargeAmount: Number(pick(charge, "charge_amount") ?? 0),
    })
  ),
});

const formatDate = (value?: string) => {
  if (!value) return "-";
  // API returns start_month/end_month as DD/MM/YYYY — display as-is rather than
  // re-parsing with `new Date()`, which would misread it as MM/DD/YYYY.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
};

const isPercentageType = (value?: string) => !!value && /percent/i.test(value);

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
      <h2 className="text-lg font-medium text-gray-900 flex items-center">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
          style={{ backgroundColor: "#E5E0D3" }}
        >
          <CalendarClock size={16} color="var(--color-primary,#da7756)" />
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start">
    <span className="min-w-[180px] text-sm text-gray-500">{label}</span>
    <span className="mx-2 text-sm text-gray-500">:</span>
    <span className="text-sm font-medium text-gray-900">{value ?? "-"}</span>
  </div>
);

const AccountingBillCycleDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [detail, setDetail] = useState<SocietyBillCycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [chargeOptions, setChargeOptions] = useState<ChargeOption[]>([]);
  const lockAccountId = localStorage.getItem("lock_account_id");

  const fetchDetail = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/account/society_bill_cycles/${id}.json`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      setDetail(response.data?.society_bill_cycle || null);
    } catch (error) {
      console.error("Error fetching bill cycle details:", error);
      toast.error("Failed to fetch bill cycle details");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // bill_frequencies now comes bundled directly inside the bill cycle detail
  // response (GET /account/society_bill_cycles/:id.json) — no separate fetch
  // needed for the Invoice Frequency table.
  const invoiceFrequencies: InvoiceFrequencyRow[] = (detail?.bill_frequencies ?? []).map(
    mapInvoiceFrequencyRow
  );

  // Fallback only — GET /account/society_bill_cycles/form_options.json is the
  // same endpoint the bill cycle create/edit forms use for the charge
  // checklist. The detail response now includes expense_charge_options
  // directly, so this only runs if that's ever missing.
  useEffect(() => {
    if (!detail || detail.expense_charge_options?.length) return;
    const fetchChargeOptions = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/account/society_bill_cycles/form_options.json`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const data = (res.data || {}) as Record<string, unknown>;
        const list =
          (data.charges as unknown[]) ??
          (data.charge_setups as unknown[]) ??
          (data.charge_options as unknown[]) ??
          [];
        setChargeOptions(
          (Array.isArray(list) ? list : []).map((item) => {
            const obj = item as Record<string, unknown>;
            return { id: Number(obj.id ?? obj.value), name: String(obj.name ?? obj.label ?? obj.id ?? "") };
          })
        );
      } catch (error) {
        console.error("Error fetching charge options:", error);
        setChargeOptions([]);
      }
    };
    fetchChargeOptions();
  }, [detail]);

  // The charges that belong to this specific bill cycle — used for the
  // "Charges" summary row and as the row list inside the Add Expense Charge
  // modal. Prefer expense_charge_options (given directly on the detail
  // response); fall back to matching charge_setup_ids/charge_names against
  // the form_options lookup above if that's ever missing.
  const billCycleCharges: ChargeOption[] = detail?.expense_charge_options?.length
    ? detail.expense_charge_options.map((c) => ({ id: c.charge_setup_id, name: c.name }))
    : detail?.charge_setup_ids?.length
      ? chargeOptions.filter((c) => detail.charge_setup_ids!.includes(c.id))
      : detail?.charge_names?.length
        ? detail.charge_names.map((name, index) => ({
            id: chargeOptions.find((c) => c.name === name)?.id ?? -(index + 1),
            name,
          }))
        : [];

  const [expenseChargeRow, setExpenseChargeRow] = useState<InvoiceFrequencyRow | null>(null);
  const [expenseChargeAmounts, setExpenseChargeAmounts] = useState<Record<number, string>>({});
  const [submittingExpenseCharges, setSubmittingExpenseCharges] = useState(false);

  const handleOpenAddExpenseCharges = (row: InvoiceFrequencyRow) => {
    // Prefill with whatever's already been added for this period (matched by
    // charge_setup_id) so re-opening the modal doesn't blank out existing values.
    const prefill: Record<number, string> = {};
    row.expenseCharges.forEach((charge) => {
      prefill[charge.chargeSetupId] = String(charge.chargeAmount);
    });
    setExpenseChargeAmounts(prefill);
    setExpenseChargeRow(row);
  };

  // POST /expense_charges.json
  const handleSubmitExpenseCharges = async () => {
    if (!expenseChargeRow) return;
    const charges = Object.entries(expenseChargeAmounts)
      .filter(([, amount]) => amount !== "")
      .map(([chargeSetupId, amount]) => ({
        charge_setup_id: Number(chargeSetupId),
        charge_amount: Number(amount),
      }));
    if (charges.length === 0) {
      toast.error("Enter at least one charge amount");
      return;
    }
    setSubmittingExpenseCharges(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.post(
        `${baseUrl}/expense_charges.json`,
        { bill_frequency_id: Number(expenseChargeRow.id), charges },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      toast.success("Expense charges added successfully");
      setExpenseChargeRow(null);
      fetchDetail();
    } catch (error) {
      console.error("Error adding expense charges:", error);
      toast.error("Failed to add expense charges");
    } finally {
      setSubmittingExpenseCharges(false);
    }
  };

  const [importRow, setImportRow] = useState<InvoiceFrequencyRow | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);

  const handleImport = (row: InvoiceFrequencyRow) => {
    setImportFile(null);
    setImportRow(row);
  };

  // GET /lock_account_bills/download_sample_bills
  const handleDownloadSampleBills = async () => {
    setIsDownloadingSample(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/lock_account_bills/download_sample_bills`, {
        responseType: "blob",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const contentType = response.headers?.["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bills-sample.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading sample file:", error);
      toast.error("Failed to download sample file");
    } finally {
      setIsDownloadingSample(false);
    }
  };

  // POST /upload_lock_bills.json — upl_file, bill_cycle_id, bill_frequency_id all required.
  const handleSubmitImport = async () => {
    if (!importFile || !importRow) {
      toast.error("Please select a file to import");
      return;
    }
    setIsImporting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const formData = new FormData();
      formData.append("upl_file", importFile);
      formData.append("bill_cycle_id", String(id));
      formData.append("bill_frequency_id", String(importRow.id));
      await axios.post(`${baseUrl}/upload_lock_bills.json`, formData, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      toast.success("Imported successfully");
      setImportRow(null);
      setImportFile(null);
      fetchDetail();
    } catch (error) {
      console.error("Error importing:", error);
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        toast.error(error.response.data?.error || "Failed to import");
      } else {
        toast.error("Failed to import");
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden">
      <button
        onClick={() => navigate("/accounting/bill-cycles")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bill Cycles
      </button>

      {loading ? (
        <div className="py-10 text-center text-brand-text-light">Loading bill cycle...</div>
      ) : !detail ? (
        <div className="py-10 text-center text-brand-text-light">No details found</div>
      ) : (
        <div className="space-y-6">
          <SectionCard title="Bill Cycle Details">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Row label="Bill Cycle Name" value={detail.name} />
              <Row label="Start Date" value={formatDate(detail.start_month)} />
              <Row label="End Date" value={formatDate(detail.end_month)} />
              <Row label="Payment Due in (Days)" value={detail.payment_due_in} />
              <Row label="Bill Cycle Frequency" value={detail.frequency?.replace("_", " ")} />
              <Row
                label="Fine"
                value={
                  detail.fine_rate
                    ? `${detail.fine_rate}${isPercentageType(detail.fine_type) ? "%" : ""} (${detail.fine_type || "-"})`
                    : "-"
                }
              />
              <Row
                label="Interest"
                value={
                  detail.interest_rate
                    ? `${detail.interest_rate}${isPercentageType(detail.interest_type) ? "%" : ""} (${detail.interest_type || "-"})`
                    : "-"
                }
              />
              <Row
                label="Charges"
                value={billCycleCharges.length > 0 ? billCycleCharges.map((c) => c.name).join(", ") : "-"}
              />
              <Row label="Expense" value={detail.expense_bill ? "Yes" : "No"} />
              <Row label="Status" value={detail.active ? "Active" : "Inactive"} />
            </div>
          </SectionCard>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
              <h2 className="text-lg font-medium text-gray-900">Invoice Frequency</h2>
            </div>
            <div className="overflow-x-auto p-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-left">
                    <th className="py-2 pr-4 font-semibold">ID</th>
                    <th className="py-2 pr-4 font-semibold">Name</th>
                    <th className="py-2 pr-4 font-semibold">Start Date</th>
                    <th className="py-2 pr-4 font-semibold">End Date</th>
                    <th className="py-2 pr-4 font-semibold">Billing Date</th>
                    <th className="py-2 pr-4 font-semibold">Invoice Raised</th>
                    {/* <th className="py-2 pr-4 font-semibold">Expense Charges</th> */}
                    <th className="py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceFrequencies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">
                        No invoice frequencies found
                      </td>
                    </tr>
                  ) : (
                    invoiceFrequencies.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4">{row.id}</td>
                        <td className="py-2 pr-4">{row.name}</td>
                        <td className="py-2 pr-4">{formatDate(row.startDate)}</td>
                        <td className="py-2 pr-4">{formatDate(row.endDate)}</td>
                        <td className="py-2 pr-4">{formatDate(row.billingDate)}</td>
                        <td className="py-2 pr-4">
                          <span className={row.invoiceRaised ? "text-[#3b82c4]" : "text-gray-500"}>
                            {row.invoiceRaised ? "Yes" : "No"}
                          </span>
                        </td>
                        {/* <td className="py-2 pr-4">
                          {row.expenseCharges.length === 0 ? (
                            "-"
                          ) : (
                            <ul className="space-y-0.5">
                              {row.expenseCharges.map((charge) => (
                                <li key={charge.id}>
                                  {charge.chargeName}: ₹{charge.chargeAmount.toFixed(2)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td> */}
                        <td className="py-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleImport(row)}
                              className="inline-flex items-center gap-1 text-[#C72030] hover:underline"
                            >
                              <Upload className="h-3.5 w-3.5" /> Import
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAddExpenseCharges(row)}
                              className="inline-flex items-center gap-1 text-[#C72030] hover:underline"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Expense Charges
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Charge modal — same charges list as the "Charges" row above */}
      <Dialog open={Boolean(expenseChargeRow)} onOpenChange={(open) => !open && setExpenseChargeRow(null)}>
        <DialogContent className="sm:max-w-2xl overflow-hidden p-0 [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900">Add Expense Charge</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpenseChargeRow(null)}
              className="h-6 w-6 p-0 hover:!bg-transparent active:!bg-transparent focus:!bg-transparent focus-visible:!bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[65vh] overflow-y-auto px-6 py-4">
            {billCycleCharges.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">No charges found for this bill cycle.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-left">
                    <th className="py-2 pr-4 font-semibold w-10">#</th>
                    <th className="py-2 pr-4 font-semibold">Charge Name</th>
                    <th className="py-2 font-semibold">Charge Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billCycleCharges.map((charge, index) => (
                    <tr key={charge.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{index + 1}</td>
                      <td className="py-2 pr-4">{charge.name}</td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={expenseChargeAmounts[charge.id] || ""}
                          onChange={(e) => {
                            if (e.target.value.startsWith("-")) return;
                            setExpenseChargeAmounts((prev) => ({ ...prev, [charge.id]: e.target.value }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "-") e.preventDefault();
                          }}
                          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[#C72030] focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex justify-center border-t border-gray-200 px-6 py-4">
            <Button
              onClick={handleSubmitExpenseCharges}
              disabled={submittingExpenseCharges}
              className="!bg-[#C72030] !text-white px-8"
            >
              {submittingExpenseCharges ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import modal — same CommonImportModal used in the Receipts module
          (AccountingReceipts.tsx). */}
      <CommonImportModal
        selectedFile={importFile}
        setSelectedFile={setImportFile}
        open={Boolean(importRow)}
        onOpenChange={(open) => {
          if (!open) {
            setImportRow(null);
            setImportFile(null);
          }
        }}
        title="Import Schedule"
        entityType="Bills"
        onImport={handleSubmitImport}
        isUploading={isImporting}
        onSampleDownload={handleDownloadSampleBills}
        isDownloading={isDownloadingSample}
      />
    </div>
  );
};

export default AccountingBillCycleDetails;
