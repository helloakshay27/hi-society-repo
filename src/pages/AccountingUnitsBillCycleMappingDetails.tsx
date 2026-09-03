import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MappingDetail {
  id: number;
  bill_cycle_name?: string;
  tower_name?: string;
  possession_status?: string;
  flat_names?: string[];
  created_at?: string;
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
          <Building2 size={16} color="var(--color-primary,#da7756)" />
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

const AccountingUnitsBillCycleMappingDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const detail = (location.state as { mapping?: MappingDetail } | null)?.mapping;

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden">
      <button
        onClick={() => navigate("/accounting/units-bill-cycle-mapping")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Units &amp; Bill Cycle Mapping
      </button>

      {!detail ? (
        <div className="py-10 text-center text-brand-text-light">
          No details available for mapping #{id}. Open this page from the list to view details.
        </div>
      ) : (
        <div className="space-y-6">
          <SectionCard title="Bill Cycle Mapping Details">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Row label="Bill Cycle" value={detail.bill_cycle_name} />
              <Row label="Tower" value={detail.tower_name} />
              <Row label="Possession Status" value={detail.possession_status} />
              <Row
                label="Flats"
                value={detail.flat_names && detail.flat_names.length > 0 ? detail.flat_names.join(", ") : "-"}
              />
              <Row label="Created At" value={formatDateTime(detail.created_at)} />
            </div>
          </SectionCard>

          <div className="flex justify-start gap-3">
            <Button
              type="button"
              variant="outline"
              className="min-w-[100px]"
              onClick={() => navigate("/accounting/units-bill-cycle-mapping")}
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingUnitsBillCycleMappingDetails;
