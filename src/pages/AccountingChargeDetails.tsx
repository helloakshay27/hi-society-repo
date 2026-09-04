import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from "@/config/apiConfig";

interface ChargeSetupDetail {
  name: string;
  description?: string;
  value?: number | null;
  charge_category?: string;
  igst_rate?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  basis?: string;
  hsn_code?: string;
  uom?: string;
  gst_applicable?: boolean;
  created_by?: string | number;
  created_at?: string;
  active?: number;
}

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString()}`;
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
      <h2 className="text-lg font-medium text-gray-900 flex items-center">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
          style={{ backgroundColor: "#E5E0D3" }}
        >
          <Receipt size={16} color="var(--color-primary,#da7756)" />
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start">
    <span className="min-w-[160px] text-sm text-gray-500">{label}</span>
    <span className="mx-2 text-sm text-gray-500">:</span>
    <span className="text-sm font-medium text-gray-900">{value ?? "-"}</span>
  </div>
);

const AccountingChargeDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const lockAccountId = localStorage.getItem("lock_account_id");
  const [detail, setDetail] = useState<ChargeSetupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const response = await axios.get(`${baseUrl}/account/charge_setups/${id}.json`, {
          params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        setDetail(response.data?.charge_setup || response.data || null);
      } catch (error) {
        console.error("Error fetching charge details:", error);
        toast.error("Failed to fetch charge details");
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, lockAccountId]);

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden">
      <button
        onClick={() => navigate("/accounting/charges")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Charges
      </button>

      {loading ? (
        <div className="py-10 text-center text-brand-text-light">Loading charge...</div>
      ) : !detail ? (
        <div className="py-10 text-center text-brand-text-light">No details found</div>
      ) : (
        <div className="space-y-6">
          <SectionCard title="Charge Details">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Row label="Charge Name" value={detail.name} />
              <Row label="Description" value={detail.description} />
              <Row label="Value" value={detail.value ?? "-"} />
              <Row label="Category" value={detail.charge_category} />
              <Row label="Basis" value={detail.basis} />
              <Row label="HSN Code" value={detail.hsn_code} />
              <Row label="UOM" value={detail.uom} />
              <Row label="Igst Rate (%)" value={detail.igst_rate ?? "-"} />
              <Row label="Cgst Rate (%)" value={detail.cgst_rate ?? "-"} />
              <Row label="Sgst Rate (%)" value={detail.sgst_rate ?? "-"} />
              <Row label="GST Applicable" value={detail.gst_applicable ? "Yes" : "No"} />
              <Row label="Created By" value={detail.created_by} />
              <Row label="Created At" value={formatDateTime(detail.created_at)} />
              <Row label="Status" value={detail.active ? "Active" : "Inactive"} />
            </div>
          </SectionCard>

          <div className="flex justify-start gap-3">
            <Button
              className="min-w-[140px] bg-[#C72030] text-white hover:bg-[#A01020]"
              onClick={() => navigate(`/accounting/charges/${id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-[100px]"
              onClick={() => navigate("/accounting/charges")}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingChargeDetails;
