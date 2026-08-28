import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Percent, Clock, TrendingDown, TrendingUp, Loader2, Pencil, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  getEncashmentConfig,
  updateEncashmentSettings,
  EncashmentConfig,
  EncashmentConfigStep,
} from "@/services/encashmentService";

const stepColumns: ColumnConfig[] = [
  { key: "step", label: "Step", sortable: true, hideable: false, draggable: false, width: "100px" },
  { key: "title", label: "Title", sortable: false, hideable: true, draggable: true },
  { key: "description", label: "Description", sortable: false, hideable: true, draggable: true },
];

const renderStepCell = (item: EncashmentConfigStep, columnKey: string) => {
  switch (columnKey) {
    case "step":
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#C4B89D54] text-sm font-semibold text-[#C72030]">
          {item.step}
        </span>
      );
    case "title":
      return <span className="font-medium text-[#1A1A1A]">{item.title}</span>;
    case "description":
      return <span className="text-sm text-gray-600">{item.description}</span>;
    default:
      return "-";
  }
};

const pointsLabel = (value: number | null | undefined) => {
  if (value === null || value === undefined || value === 0) return "No Limit";
  return String(value);
};

/** Best-effort read of the org id the app is currently operating as. */
const getCurrentOrganizationId = (): string => {
  const direct =
    localStorage.getItem("org_id") ||
    localStorage.getItem("organisation_id") ||
    localStorage.getItem("organization_id");
  if (direct) return direct;

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.organization_id ? String(user.organization_id) : "";
  } catch {
    return "";
  }
};

/** The `processing_time_label` (e.g. "2-4 business days") is derived server-side
 * from processing_min_days/processing_max_days — there's no dedicated GET for
 * the raw settings, so this recovers a best-effort prefill from that label. */
const parseProcessingDays = (label: string | undefined): { min: string; max: string } => {
  const match = (label || "").match(/(\d+)\D+(\d+)/);
  if (!match) return { min: "", max: "" };
  return { min: match[1], max: match[2] };
};

interface SettingsFormState {
  processing_fee_percent: string;
  processing_min_days: string;
  processing_max_days: string;
  points_to_rupee_ratio: string;
  min_points_per_request: string;
  max_points_per_request: string;
}

const EMPTY_FORM: SettingsFormState = {
  processing_fee_percent: "",
  processing_min_days: "",
  processing_max_days: "",
  points_to_rupee_ratio: "1",
  min_points_per_request: "",
  max_points_per_request: "",
};

const fieldLabelClass = "text-xs font-semibold text-[#1A1A1A]";
const inputClass = "h-9 text-sm border-[#D5DbDB] bg-white";

export const EncashmentConfigPage: React.FC = () => {
  const [config, setConfig] = useState<EncashmentConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<SettingsFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = () => {
    setLoading(true);
    return getEncashmentConfig()
      .then(setConfig)
      .catch((err) => {
        console.warn("Could not fetch encashment config:", err);
        toast.error("Failed to load encashment config");
        setConfig(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleOpenEdit = () => {
    const { min, max } = parseProcessingDays(config?.processing_time_label);
    setForm({
      processing_fee_percent:
        config?.processing_fee_percent != null ? String(config.processing_fee_percent) : "",
      processing_min_days: min,
      processing_max_days: max,
      points_to_rupee_ratio: "1",
      min_points_per_request:
        config?.min_points_per_request != null ? String(config.min_points_per_request) : "",
      max_points_per_request:
        config?.max_points_per_request != null ? String(config.max_points_per_request) : "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const organizationId = getCurrentOrganizationId();
    if (!organizationId) {
      toast.error("Could not determine your organization. Please log in again.");
      return;
    }
    if (
      !form.processing_fee_percent.trim() ||
      !form.processing_min_days.trim() ||
      !form.processing_max_days.trim() ||
      !form.points_to_rupee_ratio.trim()
    ) {
      toast.error("Please fill in Processing Fee, Min/Max Days and Points to Rupee Ratio");
      return;
    }

    setIsSaving(true);
    try {
      await updateEncashmentSettings({
        organization_id: organizationId,
        processing_fee_percent: form.processing_fee_percent,
        processing_min_days: form.processing_min_days,
        processing_max_days: form.processing_max_days,
        points_to_rupee_ratio: form.points_to_rupee_ratio,
        min_points_per_request: form.min_points_per_request,
        max_points_per_request: form.max_points_per_request,
      });
      toast.success("Encashment settings saved successfully");
      setIsModalOpen(false);
      await fetchConfig();
    } catch (err) {
      console.warn("Could not save encashment settings:", err);
      toast.error("Failed to save encashment settings");
    } finally {
      setIsSaving(false);
    }
  };

  const statCards = [
    {
      label: "Processing Fee",
      value: config ? `${config.processing_fee_percent}%` : "-",
      icon: Percent,
    },
    {
      label: "Processing Time",
      value: config?.processing_time_label || "-",
      icon: Clock,
    },
    {
      label: "Min Points / Request",
      value: config ? pointsLabel(config.min_points_per_request) : "-",
      icon: TrendingDown,
    },
    {
      label: "Max Points / Request",
      value: config ? pointsLabel(config.max_points_per_request) : "-",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">Encashment Config</h1>
        <Button onClick={handleOpenEdit} variant="ghost" className="btn-primary h-9 px-4 text-sm font-medium">
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Edit Settings
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <div
              key={i}
              className="bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-[#C72030]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#1A1A1A]">{item.value}</div>
                <div className="text-sm font-medium text-[#1A1A1A]">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Steps Table */}
      <div className="overflow-x-auto animate-fade-in">
        <EnhancedTable
          data={config?.steps || []}
          columns={stepColumns}
          renderCell={renderStepCell}
          pagination={false}
          enableExport={false}
          enableSearch={false}
          hideTableExport
          hideColumnsButton
          storageKey="encashment-config-steps-table"
          className="transition-all duration-500 ease-in-out"
          loading={loading}
          loadingMessage="Loading encashment config..."
          emptyMessage="No encashment steps configured"
        />
      </div>

      {/* Edit Settings Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#F6F4EE] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#C72030]" />
              Edit Encashment Settings
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 bg-white space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Processing Fee (%)</Label>
                <Input
                  type="number"
                  className={inputClass}
                  value={form.processing_fee_percent}
                  onChange={(e) => setForm((prev) => ({ ...prev, processing_fee_percent: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Points to Rupee Ratio</Label>
                <Input
                  type="number"
                  step="0.01"
                  disabled
                  className={`${inputClass} disabled:opacity-100 disabled:bg-gray-100`}
                  value={form.points_to_rupee_ratio}
                  onChange={(e) => setForm((prev) => ({ ...prev, points_to_rupee_ratio: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Processing Min Days</Label>
                <Input
                  type="number"
                  className={inputClass}
                  value={form.processing_min_days}
                  onChange={(e) => setForm((prev) => ({ ...prev, processing_min_days: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Processing Max Days</Label>
                <Input
                  type="number"
                  className={inputClass}
                  value={form.processing_max_days}
                  onChange={(e) => setForm((prev) => ({ ...prev, processing_max_days: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Min Points / Request</Label>
                <Input
                  type="number"
                  className={inputClass}
                  placeholder="No minimum"
                  value={form.min_points_per_request}
                  onChange={(e) => setForm((prev) => ({ ...prev, min_points_per_request: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Max Points / Request</Label>
                <Input
                  type="number"
                  className={inputClass}
                  placeholder="No maximum"
                  value={form.max_points_per_request}
                  onChange={(e) => setForm((prev) => ({ ...prev, max_points_per_request: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F6F4EE] px-6 py-3 border-t border-[#D5DbDB] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-[#D5DbDB] text-[#1A1A1A] hover:bg-[#DBC2A9]"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} variant="ghost" className="btn-primary">
              {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EncashmentConfigPage;
