import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  getScheduleSetup,
  updateScheduleSetup,
  ScheduleSetupData,
} from "@/services/appointmentzService";

export const AppointmentzScheduleSetup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isSavingRMLimit, setIsSavingRMLimit] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBackdrop, setIsUploadingBackdrop] = useState(false);

  const [formData, setFormData] = useState<ScheduleSetupData>({
    d1_start_days: 8,
    d1_end_days: 28,
    d2_start_days: 1,
    d2_end_days: 14,
    rm_slot_days_limit: 7,
    logo_url: "",
    backdrop_url: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [backdropPreview, setBackdropPreview] = useState<string>("");

  useEffect(() => {
    const fetchSetup = async () => {
      setLoading(true);
      try {
        const data = await getScheduleSetup();
        if (data) {
          setFormData(data);
          if (data.logo_url) setLogoPreview(data.logo_url);
          if (data.backdrop_url) setBackdropPreview(data.backdrop_url);
        }
      } catch (err) {
        console.warn("Could not fetch schedule setup:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSetup();
  }, []);

  // Save Schedule Setup (D1 / D2)
  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      await updateScheduleSetup({
        d1_start_days: formData.d1_start_days,
        d1_end_days: formData.d1_end_days,
        d2_start_days: formData.d2_start_days,
        d2_end_days: formData.d2_end_days,
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
      await updateScheduleSetup({
        rm_slot_days_limit: formData.rm_slot_days_limit,
      });
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
    if (!logoFile && !logoPreview) {
      toast.error("Please select an image first");
      return;
    }
    setIsUploadingLogo(true);
    try {
      await updateScheduleSetup({
        logo_url: logoPreview,
      });
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
    if (!backdropFile && !backdropPreview) {
      toast.error("Please select an image first");
      return;
    }
    setIsUploadingBackdrop(true);
    try {
      await updateScheduleSetup({
        backdrop_url: backdropPreview,
      });
      toast.success("Backdrop image uploaded successfully");
    } catch {
      toast.error("Failed to upload backdrop image");
    } finally {
      setIsUploadingBackdrop(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-[#fbfbfa] min-h-screen">
      {/* Top Header Card */}
      <div className="bg-white border border-[#D5DbDB] rounded-lg p-5 mb-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/appointmentz/slots-config")}
              className="p-1.5 rounded-md hover:bg-[#f6f4ee] border border-[#D5DbDB] bg-white text-[#1A1A1A] transition-colors cursor-pointer"
              title="Back to Slots Configuration"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-bold text-[#1A1A1A]">Schedule Setup</h1>
          </div>
        </div>

        {/* 4 Setup Panels Grid matching Screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-2">
          {/* Panel 1: Schedule Setup (D1 / D2 Days) */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-[#1A1A1A]">
              Schedule Setup
            </div>

            {/* D1 Days */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 items-center gap-2 text-xs">
                <span className="font-semibold text-gray-700">D1</span>
                <div className="text-center">
                  <span className="text-[11px] text-gray-500 block">Start Days</span>
                  <Input
                    type="number"
                    value={formData.d1_start_days}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        d1_start_days: e.target.value,
                      }))
                    }
                    className="h-8 text-xs text-center border-[#D5DbDB] mt-1"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-gray-500 block">End Days</span>
                  <Input
                    type="number"
                    value={formData.d1_end_days}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        d1_end_days: e.target.value,
                      }))
                    }
                    className="h-8 text-xs text-center border-[#D5DbDB] mt-1"
                  />
                </div>
              </div>
            </div>

            {/* D2 Days */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 items-center gap-2 text-xs">
                <span className="font-semibold text-gray-700">D2</span>
                <div className="text-center">
                  <span className="text-[11px] text-gray-500 block">Start Days</span>
                  <Input
                    type="number"
                    value={formData.d2_start_days}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        d2_start_days: e.target.value,
                      }))
                    }
                    className="h-8 text-xs text-center border-[#D5DbDB] mt-1"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-gray-500 block">End Days</span>
                  <Input
                    type="number"
                    value={formData.d2_end_days}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        d2_end_days: e.target.value,
                      }))
                    }
                    className="h-8 text-xs text-center border-[#D5DbDB] mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Save Button for Schedule Setup */}
            <div className="pt-2">
              <Button
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="bg-[#1c7e46] hover:bg-[#156337] text-white px-4 py-1.5 rounded text-xs font-semibold h-8 shadow-xs"
              >
                {isSavingSchedule && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                <span>Save</span>
              </Button>
            </div>
          </div>

          {/* Panel 2: RM Slot Days limit */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-[#1A1A1A]">
              RM Slot Days limit:
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600 block">Days</Label>
              <Input
                type="number"
                value={formData.rm_slot_days_limit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rm_slot_days_limit: e.target.value,
                  }))
                }
                className="h-8 text-xs border-[#D5DbDB] max-w-[240px]"
              />
            </div>

            {/* Save Button for RM Slot Days limit */}
            <div className="pt-2">
              <Button
                onClick={handleSaveRMLimit}
                disabled={isSavingRMLimit}
                className="bg-[#1c7e46] hover:bg-[#156337] text-white px-4 py-1.5 rounded text-xs font-semibold h-8 shadow-xs"
              >
                {isSavingRMLimit && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                <span>Save</span>
              </Button>
            </div>
          </div>

          {/* Panel 3: Site Scheduler (Email) Logo */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-[#1A1A1A]">
              Site Scheduler (Email) Logo:
            </div>

            {/* Preview Box */}
            <div className="w-32 h-32 bg-[#2d3748] border border-[#D5DbDB] rounded flex items-center justify-center overflow-hidden shadow-2xs">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Scheduler Logo"
                  className="max-h-full max-w-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400 text-[10px]">
                  <ImageIcon className="w-8 h-8 mb-1 text-gray-400" />
                  <span>No Logo</span>
                </div>
              )}
            </div>

            {/* File selection & Upload */}
            <div className="space-y-2">
              <span className="text-xs text-gray-600 block">Select image</span>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-[#D5DbDB] file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                <div>
                  <Button
                    onClick={handleUploadLogo}
                    disabled={isUploadingLogo}
                    className="bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] border border-[#D5DbDB] px-3 py-1 rounded text-xs font-medium h-7 shadow-2xs"
                  >
                    {isUploadingLogo && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    <span>Upload</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 4: Backdrop Image */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-[#1A1A1A]">
              Backdrop Image
            </div>

            {/* Preview Box */}
            <div className="w-32 h-32 bg-[#2d3748] border border-[#D5DbDB] rounded flex items-center justify-center overflow-hidden shadow-2xs">
              {backdropPreview ? (
                <img
                  src={backdropPreview}
                  alt="Backdrop"
                  className="max-h-full max-w-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400 text-[10px]">
                  <ImageIcon className="w-8 h-8 mb-1 text-gray-400" />
                  <span>No Image</span>
                </div>
              )}
            </div>

            {/* File selection & Upload */}
            <div className="space-y-2">
              <span className="text-xs text-gray-600 block">Select image</span>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackdropFileChange}
                  className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-[#D5DbDB] file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                <div>
                  <Button
                    onClick={handleUploadBackdrop}
                    disabled={isUploadingBackdrop}
                    className="bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] border border-[#D5DbDB] px-3 py-1 rounded text-xs font-medium h-7 shadow-2xs"
                  >
                    {isUploadingBackdrop && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    <span>Upload</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentzScheduleSetup;
