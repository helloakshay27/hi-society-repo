import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import {
  getScheduleSetup,
  updateScheduleSetupDays,
  updateRMSlotDaysLimit,
  uploadSiteSchedulerAsset,
} from "@/services/appointmentzService";

interface ScheduleSetupFormState {
  d1_start_days: number | string;
  d1_end_days: number | string;
  d2_start_days: number | string;
  d2_end_days: number | string;
  rm_slot_days_limit: number | string;
}

const panelClass =
  "space-y-4 rounded-lg border border-brand-border bg-white p-4";
const panelTitleClass = "text-brand-body-4 font-bold text-brand-text";
const fieldLabelClass =
  "block text-brand-body-5 text-brand-text-light";
const inputClass =
  "h-8 text-xs text-center border-brand-border focus-visible:ring-brand mt-1";
const saveButtonClass =
  "bg-brand hover:bg-brand-hover text-white px-4 py-1.5 rounded-md text-xs font-semibold h-8 shadow-system-sm";
const uploadButtonClass =
  "bg-brand-bg hover:bg-brand-light text-brand-text border border-brand-border px-3 py-1 rounded-md text-xs font-medium h-7 shadow-system-sm";
const fileInputClass =
  "text-xs text-brand-text-light file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-brand-border file:text-xs file:bg-brand-bg file:text-brand-text hover:file:bg-brand-light";

/** The 4-panel Schedule Setup form (days config, RM slot limit, logo, backdrop) — shared by the standalone page and the Slots Configuration list. */
export const ScheduleSetupPanel: React.FC = () => {
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isSavingRMLimit, setIsSavingRMLimit] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBackdrop, setIsUploadingBackdrop] = useState(false);

  const [formData, setFormData] = useState<ScheduleSetupFormState>({
    d1_start_days: 8,
    d1_end_days: 28,
    d2_start_days: 1,
    d2_end_days: 14,
    rm_slot_days_limit: 7,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [backdropPreview, setBackdropPreview] = useState<string>("");

  useEffect(() => {
    const fetchSetup = async () => {
      try {
        const data = await getScheduleSetup();
        if (data?.settings) {
          setFormData({
            d1_start_days: data.settings.d1_start_days,
            d1_end_days: data.settings.d1_end_days,
            d2_start_days: data.settings.d2_start_days,
            d2_end_days: data.settings.d2_end_days,
            rm_slot_days_limit: data.settings.site_schedule_start_days,
          });
        }
        if (data?.assets?.logo_url) setLogoPreview(data.assets.logo_url);
        if (data?.assets?.backdrop_url) setBackdropPreview(data.assets.backdrop_url);
      } catch (err) {
        console.warn("Could not fetch schedule setup:", err);
      }
    };

    fetchSetup();
  }, []);

  // Save Schedule Setup (D1 / D2)
  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      await updateScheduleSetupDays({
        start_days: formData.d1_start_days,
        end_days: formData.d1_end_days,
        start_days2: formData.d2_start_days,
        end_days2: formData.d2_end_days,
      });
      toast.success("Schedule Setup days saved successfully");
    } catch {
      toast.error("Failed to save Schedule Setup");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Save RM Slot Days limit
  const handleSaveRMLimit = async () => {
    setIsSavingRMLimit(true);
    try {
      await updateRMSlotDaysLimit(formData.rm_slot_days_limit);
      toast.success("RM Slot Days limit saved successfully");
    } catch {
      toast.error("Failed to save RM Slot Days limit");
    } finally {
      setIsSavingRMLimit(false);
    }
  };

  // Handle Logo file change
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Upload Logo
  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error("Please select an image first");
      return;
    }
    setIsUploadingLogo(true);
    try {
      await uploadSiteSchedulerAsset(logoFile, "SiteSchedulerLogo");
      toast.success("Site Scheduler Logo uploaded successfully");
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Backdrop file change
  const handleBackdropFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackdropFile(file);
      setBackdropPreview(URL.createObjectURL(file));
    }
  };

  // Upload Backdrop
  const handleUploadBackdrop = async () => {
    if (!backdropFile) {
      toast.error("Please select an image first");
      return;
    }
    setIsUploadingBackdrop(true);
    try {
      await uploadSiteSchedulerAsset(backdropFile, "SiteSchedulerBackdrop");
      toast.success("Backdrop image uploaded successfully");
    } catch {
      toast.error("Failed to upload backdrop image");
    } finally {
      setIsUploadingBackdrop(false);
    }
  };

  // Unified Save All Schedule & Exception Rules
  const handleSaveAllRules = async () => {
    setIsSavingSchedule(true);
    setIsSavingRMLimit(true);
    try {
      await Promise.all([
        updateScheduleSetupDays({
          start_days: formData.d1_start_days,
          end_days: formData.d1_end_days,
          start_days2: formData.d2_start_days,
          end_days2: formData.d2_end_days,
        }),
        updateRMSlotDaysLimit(formData.rm_slot_days_limit),
      ]);
      toast.success("Schedule rules and booking limits saved successfully");
    } catch {
      toast.error("Failed to save schedule rules");
    } finally {
      setIsSavingSchedule(false);
      setIsSavingRMLimit(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* One Coherent Schedule & Exception Rules Editor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#DA7756]/10 flex items-center justify-center shrink-0">
            <Loader2 className="hidden" />
            <span className="text-base font-bold text-[#DA7756]">📅</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Schedule Setup & Booking Window Rules
            </h3>
            <p className="text-xs text-gray-500">
              Define standard advance booking periods, revisit exception windows, and RM scheduling days limits
            </p>
          </div>
        </div>

        <Button
          onClick={handleSaveAllRules}
          disabled={isSavingSchedule || isSavingRMLimit}
          className="schedule-rules-save-action !bg-[#1a1a18] hover:!bg-[#12100e] !text-white px-4 py-1.5 rounded-md text-xs font-semibold h-8.5 shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          {(isSavingSchedule || isSavingRMLimit) && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          <span>Save Schedule Rules</span>
        </Button>
      </div>

      {/* 3 Unified Rule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rule 1: Standard Booking Window (D1) */}
        <div className="bg-[#FAF9F6] border border-[#EBE8E1] rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-bold text-gray-900">
              Primary Booking Window (D1)
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            Standard advance booking range for initial resident site inspection visits.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 block mb-1">
                Min Notice (Days)
              </Label>
              <Input
                type="number"
                value={formData.d1_start_days}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, d1_start_days: e.target.value }))
                }
                className="h-8 text-xs text-center bg-white border-gray-300 font-semibold focus-visible:ring-[#DA7756]"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 block mb-1">
                Max Advance (Days)
              </Label>
              <Input
                type="number"
                value={formData.d1_end_days}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, d1_end_days: e.target.value }))
                }
                className="h-8 text-xs text-center bg-white border-gray-300 font-semibold focus-visible:ring-[#DA7756]"
              />
            </div>
          </div>
        </div>

        {/* Rule 2: Revisit & Urgent Booking Window (D2 Exception Rules) */}
        <div className="bg-[#FAF9F6] border border-[#EBE8E1] rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs font-bold text-gray-900">
              Revisit Exception Window (D2)
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            Accelerated notice window allowed for re-inspections or follow-up visits.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 block mb-1">
                Min Notice (Days)
              </Label>
              <Input
                type="number"
                value={formData.d2_start_days}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, d2_start_days: e.target.value }))
                }
                className="h-8 text-xs text-center bg-white border-gray-300 font-semibold focus-visible:ring-[#DA7756]"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 block mb-1">
                Max Advance (Days)
              </Label>
              <Input
                type="number"
                value={formData.d2_end_days}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, d2_end_days: e.target.value }))
                }
                className="h-8 text-xs text-center bg-white border-gray-300 font-semibold focus-visible:ring-[#DA7756]"
              />
            </div>
          </div>
        </div>

        {/* Rule 3: RM Advance Slot Booking Limit */}
        <div className="bg-[#FAF9F6] border border-[#EBE8E1] rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
            <span className="text-xs font-bold text-gray-900">
              RM Advance Days Limit
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            Maximum calendar days ahead Relationship Managers can book slots on behalf of users.
          </p>
          <div className="pt-1">
            <Label className="text-[11px] font-semibold text-gray-600 block mb-1">
              Max Advance Limit (Days)
            </Label>
            <Input
              type="number"
              value={formData.rm_slot_days_limit}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, rm_slot_days_limit: e.target.value }))
              }
              className="h-8 text-xs text-center bg-white border-gray-300 font-semibold max-w-[140px] focus-visible:ring-[#DA7756]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSetupPanel;
