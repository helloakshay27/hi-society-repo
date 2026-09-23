import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, Pencil, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  expense_bill?: boolean;
  active: number;
}

interface InvoiceFrequencyRow {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  billingDate: string;
  invoiceRaised: boolean;
}

const pick = (obj: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  }
  return undefined;
};

// GET /lock_account_bills/bill_frequencies?bill_cycle_id=... — same endpoint
// used to populate the "Bill Cycle Frequency" dropdown on invoice creation,
// but the individual period records also carry billing_date/invoice_raised,
// which is what this page's Invoice Frequency table needs.
const mapInvoiceFrequencyRow = (item: Record<string, unknown>): InvoiceFrequencyRow => ({
  id: String(pick(item, "id") ?? ""),
  name: String(
    pick(item, "name", "label") ??
      `${pick(item, "start_date", "from_date") ?? ""} to ${pick(item, "end_date", "to_date") ?? ""}`
  ),
  startDate: String(pick(item, "start_date", "from_date") ?? ""),
  endDate: String(pick(item, "end_date", "to_date") ?? ""),
  billingDate: String(pick(item, "billing_date", "bill_date") ?? ""),
  invoiceRaised: Boolean(pick(item, "invoice_raised", "invoiced", "is_invoiced")),
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
  const [invoiceFrequencies, setInvoiceFrequencies] = useState<InvoiceFrequencyRow[]>([]);
  const [frequenciesLoading, setFrequenciesLoading] = useState(false);
  const lockAccountId = localStorage.getItem("lock_account_id");

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
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
    };
    fetchDetail();
  }, [id]);

  // GET /lock_account_bills/bill_frequencies?bill_cycle_id=... — the same
  // endpoint invoice creation uses for its "Bill Cycle Frequency" dropdown;
  // here the fuller per-period fields (billing_date, invoice_raised) drive
  // the Invoice Frequency table instead.
  useEffect(() => {
    if (!id) return;
    const fetchFrequencies = async () => {
      setFrequenciesLoading(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/lock_account_bills/bill_frequencies`, {
          params: { bill_cycle_id: id, ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = res.data;
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? data
          : data?.bill_frequencies ?? data?.data ?? [];
        setInvoiceFrequencies(list.map(mapInvoiceFrequencyRow));
      } catch (error) {
        console.error("Error fetching invoice frequencies:", error);
        setInvoiceFrequencies([]);
      } finally {
        setFrequenciesLoading(false);
      }
    };
    fetchFrequencies();
  }, [id, lockAccountId]);

  // No API given yet for these row actions — surface that clearly instead of
  // silently doing nothing or faking a navigation that doesn't exist.
  const handleImport = (row: InvoiceFrequencyRow) => {
    toast.info(`Import for "${row.name}" isn't wired up yet.`);
  };
  const handleAddExpenseCharges = (row: InvoiceFrequencyRow) => {
    toast.info(`Add Expense Charges for "${row.name}" isn't wired up yet.`);
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
                value={detail.charge_names && detail.charge_names.length > 0 ? detail.charge_names.join(", ") : "-"}
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
                    <th className="py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {frequenciesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : invoiceFrequencies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
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
                        <td className="py-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleImport(row)}
                              className="inline-flex items-center gap-1 text-[#3b82c4] hover:underline"
                            >
                              <Upload className="h-3.5 w-3.5" /> Import
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddExpenseCharges(row)}
                              className="inline-flex items-center gap-1 text-[#3b82c4] hover:underline"
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
    </div>
  );
};

export default AccountingBillCycleDetails;
