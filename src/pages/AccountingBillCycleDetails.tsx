import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, Pencil } from "lucide-react";
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

          
        </div>
      )}
    </div>
  );
};

export default AccountingBillCycleDetails;
