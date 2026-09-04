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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Panel 1: Schedule Setup (D1 / D2 Days) */}
      <div className={panelClass}>
        <div className={panelTitleClass}>Schedule Setup</div>

        {/* D1 Days */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="text-brand-body-5 font-semibold text-brand-text">D1</span>
            <div className="text-center">
              <span className={fieldLabelClass}>Start Days</span>
              <Input
                type="number"
                value={formData.d1_start_days}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    d1_start_days: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
            <div className="text-center">
              <span className={fieldLabelClass}>End Days</span>
              <Input
                type="number"
                value={formData.d1_end_days}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    d1_end_days: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* D2 Days */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="text-brand-body-5 font-semibold text-brand-text">D2</span>
            <div className="text-center">
              <span className={fieldLabelClass}>Start Days</span>
              <Input
                type="number"
                value={formData.d2_start_days}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    d2_start_days: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
            <div className="text-center">
              <span className={fieldLabelClass}>End Days</span>
              <Input
                type="number"
                value={formData.d2_end_days}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    d2_end_days: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={handleSaveSchedule} disabled={isSavingSchedule} className={saveButtonClass}>
            {isSavingSchedule && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            <span>Save</span>
          </Button>
        </div>
      </div>

      {/* Panel 2: RM Slot Days limit */}
      <div className={panelClass}>
        <div className={panelTitleClass}>RM Slot Days limit:</div>

        <div className="space-y-1.5">
          <Label className={fieldLabelClass}>Days</Label>
          <Input
            type="number"
            value={formData.rm_slot_days_limit}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                rm_slot_days_limit: e.target.value,
              }))
            }
            className="h-8 text-xs border-brand-border focus-visible:ring-brand max-w-[240px]"
          />
        </div>

        <div className="pt-2">
          <Button onClick={handleSaveRMLimit} disabled={isSavingRMLimit} className={saveButtonClass}>
            {isSavingRMLimit && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            <span>Save</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSetupPanel;
