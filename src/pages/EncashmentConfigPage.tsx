import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Percent, Clock, TrendingDown, TrendingUp, Loader2, Pencil, Settings, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  getEncashmentConfig,
  getEncashmentSettings,
  updateEncashmentSettings,
  EncashmentConfig,
  EncashmentConfigStep,
  EncashmentSettings,
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
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F5F4F0] text-xs font-semibold text-[#1A1A18]">
          {item.step}
        </span>
      );
    case "title":
      return <span className="font-medium text-[#1A1A18]">{item.title}</span>;
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
 * from processing_min_days/processing_max_days — used as a fallback prefill
 * when the raw settings (getEncashmentSettings) haven't loaded yet. */
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
  terms_and_conditions: string;
  privacy_policy: string;
}

const EMPTY_FORM: SettingsFormState = {
  processing_fee_percent: "",
  processing_min_days: "",
  processing_max_days: "",
  points_to_rupee_ratio: "1",
  min_points_per_request: "",
  max_points_per_request: "",
  terms_and_conditions: "",
  privacy_policy: "",
};

const fieldLabelClass = "text-[12.5px] font-semibold text-[rgba(26,26,24,0.68)]";
const inputClass =
  "h-11 rounded-xl text-[13.5px] font-medium text-[#1A1A18] border-[rgba(26,26,24,0.08)] bg-white hover:border-[rgba(26,26,24,0.28)] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1A1A18] focus-visible:shadow-[0_0_0_4px_rgba(26,26,24,0.1)]";
const textareaClass =
  "min-h-[90px] rounded-xl text-[13.5px] font-medium text-[#1A1A18] border-[rgba(26,26,24,0.08)] bg-white hover:border-[rgba(26,26,24,0.28)] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#1A1A18] focus-visible:shadow-[0_0_0_4px_rgba(26,26,24,0.1)]";

export const EncashmentConfigPage: React.FC = () => {
  const [config, setConfig] = useState<EncashmentConfig | null>(null);
  const [settings, setSettings] = useState<EncashmentSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<SettingsFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = () => {
    setLoading(true);
    const organizationId = getCurrentOrganizationId();
    return Promise.all([
      getEncashmentConfig().catch((err) => {
        console.warn("Could not fetch encashment config:", err);
        toast.error("Failed to load encashment config");
        return null;
      }),
      getEncashmentSettings(organizationId || undefined).catch((err) => {
        console.warn("Could not fetch encashment settings:", err);
        return null;
      }),
    ])
      .then(([configResult, settingsResult]) => {
        setConfig(configResult);
        setSettings(settingsResult);
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
        settings?.processing_fee_percent ??
        (config?.processing_fee_percent != null ? String(config.processing_fee_percent) : ""),
      processing_min_days: settings?.processing_min_days != null ? String(settings.processing_min_days) : min,
      processing_max_days: settings?.processing_max_days != null ? String(settings.processing_max_days) : max,
      points_to_rupee_ratio: "1",
      min_points_per_request:
        config?.min_points_per_request != null ? String(config.min_points_per_request) : "",
      max_points_per_request:
        config?.max_points_per_request != null ? String(config.max_points_per_request) : "",
      terms_and_conditions: settings?.terms_and_conditions || "",
      privacy_policy: settings?.privacy_policy || "",
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
        terms_and_conditions: form.terms_and_conditions,
        privacy_policy: form.privacy_policy,
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
      <div className="flex items-center justify-between gap-3 mb-[22px]">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
          Encashment Config
        </h1>
        <button
          type="button"
          onClick={handleOpenEdit}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium text-[#1A1A18] bg-white border border-[rgba(26,26,24,0.12)] rounded-[10px] hover:bg-[#F5F4F0] transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit Settings
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <div
              key={i}
              className="bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl px-5 py-[18px] flex items-start justify-between gap-3 min-w-0"
            >
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-[rgba(26,26,24,0.55)]">{item.label}</div>
                <div
                  className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18] truncate"
                  title={String(item.value)}
                >
                  {item.value}
                </div>
              </div>
              <div className="w-9 h-9 flex-none rounded-xl bg-[#F5F4F0] flex items-center justify-center">
                <IconComponent className="w-4 h-4 text-[#1A1A18]" />
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

      {/* Terms & Conditions / Privacy Policy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,0.09)] px-6 py-[22px]">
          <h2 className="text-sm font-semibold text-[#1A1A18] flex items-center gap-3 mb-4">
            <span className="w-8 h-8 flex-none rounded-full bg-[#F5F4F0] flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-[#1A1A18]" />
            </span>
            Terms &amp; Conditions
          </h2>
          <p className="text-[13.5px] text-[rgba(26,26,24,0.68)] whitespace-pre-wrap">
            {settings?.terms_and_conditions || "Not set"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,0.09)] px-6 py-[22px]">
          <h2 className="text-sm font-semibold text-[#1A1A18] flex items-center gap-3 mb-4">
            <span className="w-8 h-8 flex-none rounded-full bg-[#F5F4F0] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1A1A18]" />
            </span>
            Privacy Policy
          </h2>
          <p className="text-[13.5px] text-[rgba(26,26,24,0.68)] whitespace-pre-wrap">
            {settings?.privacy_policy || "Not set"}
          </p>
        </div>
      </div>

      {/* Edit Settings Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl border-[rgba(26,26,24,0.09)] shadow-xl">
          <DialogHeader className="px-6 py-5 border-b border-[rgba(26,26,24,0.08)]">
            <DialogTitle className="text-lg font-semibold text-[#1A1A18] flex items-center gap-3">
              <span className="w-8 h-8 flex-none rounded-full bg-[#F5F4F0] flex items-center justify-center">
                <Settings className="w-3.5 h-3.5 text-[#1A1A18]" />
              </span>
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
                  className={`${inputClass} disabled:opacity-100 disabled:bg-[#F5F4F0] disabled:text-[rgba(26,26,24,0.55)]`}
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
                <Label className={fieldLabelClass}>Min Points / Request (Keep blank for No Limit)</Label>
                <Input
                  type="number"
                  className={inputClass}
                  placeholder="No minimum"
                  value={form.min_points_per_request}
                  onChange={(e) => setForm((prev) => ({ ...prev, min_points_per_request: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Max Points / Request (Keep blank for No Limit)</Label>
                <Input
                  type="number"
                  className={inputClass}
                  placeholder="No maximum"
                  value={form.max_points_per_request}
                  onChange={(e) => setForm((prev) => ({ ...prev, max_points_per_request: e.target.value }))}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className={fieldLabelClass}>Terms &amp; Conditions</Label>
                <Textarea
                  className={textareaClass}
                  placeholder="Enter terms & conditions"
                  value={form.terms_and_conditions}
                  onChange={(e) => setForm((prev) => ({ ...prev, terms_and_conditions: e.target.value }))}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className={fieldLabelClass}>Privacy Policy</Label>
                <Textarea
                  className={textareaClass}
                  placeholder="Enter privacy policy"
                  value={form.privacy_policy}
                  onChange={(e) => setForm((prev) => ({ ...prev, privacy_policy: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-[rgba(26,26,24,0.08)] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="btn-cancel h-9 px-4 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="btn-primary h-9 px-4 text-sm font-medium">
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
