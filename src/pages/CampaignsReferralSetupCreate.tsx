import React, { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Upload, X, FileImage, Gift } from "lucide-react";
import { createReferralSetup } from "@/services/referralService";

const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": {
      borderColor: "#ddd",
    },
    "&:hover fieldset": {
      borderColor: "#1A1A18",
    },
  },
};

const CampaignsReferralSetupCreate: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const horizontalFileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bannerEnabled: false,
    referralBannerEnabled: false,
    projectName: "",
    projectReferenceId: "",
    title: "",
    description: "",
    geoLink: "",
    details: "",
    mobileNo: "",
    banner: null as File | null,
    horizontalBanners: [] as File[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        society_banner: {
          project_name: formData.projectName,
          project_reference_id: parseInt(formData.projectReferenceId, 10) || 0,
          active: formData.bannerEnabled ? "on" : "off",
          is_referral: formData.referralBannerEnabled ? "on" : "off",
          title: formData.title,
          description: formData.description,
          geo_link: formData.geoLink,
          details: formData.details,
          mobile_no: formData.mobileNo,
          banner: formData.banner,
        },
        attachments: formData.horizontalBanners,
      };

      await createReferralSetup(payload);
      navigate("/campaigns/referral-setup");
    } catch (err) {
      console.error("Failed to create referral setup:", err);
      setError("Failed to create referral setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleChange = (field: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, banner: file }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, banner: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleHorizontalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        horizontalBanners: [...prev.horizontalBanners, ...files],
      }));
    }
    if (horizontalFileInputRef.current) {
      horizontalFileInputRef.current.value = "";
    }
  };

  const handleRemoveHorizontalFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      horizontalBanners: prev.horizontalBanners.filter((_, i) => i !== index),
    }));
  };

  const handleHorizontalBrowseClick = () => {
    horizontalFileInputRef.current?.click();
  };

  return (
    <div className="bg-[#FDFDFB] min-h-screen p-6">
      <div className="mx-auto">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-[22px]">
            <h1 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                <Gift size={14} color="#1A1A18" />
              </span>
              Referral Setup
            </h1>
          </div>

          {/* Form */}
          <form id="referral-setup-create-form" onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Toggle Switches Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Banner */}
            <div className="space-y-2">
              <Label htmlFor="banner" className="text-gray-600 text-sm">
                Banner
              </Label>
              <div className="flex items-center space-x-3">
                <Switch
                  id="banner"
                  checked={formData.bannerEnabled}
                  onCheckedChange={(checked) =>
                    handleToggleChange("bannerEnabled", checked)
                  }
                  className="data-[state=checked]:!bg-[#798c5e] data-[state=unchecked]:!bg-[#e7848e]"
                />
                <span className="text-sm text-gray-600">
                  {formData.bannerEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

              {/* Referral Banner */}
              <div className="space-y-2">
                <Label
                  htmlFor="referralBanner"
                  className="text-gray-600 text-sm"
                >
                  Referral banner
                </Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="referralBanner"
                    checked={formData.referralBannerEnabled}
                    onCheckedChange={(checked) =>
                      handleToggleChange("referralBannerEnabled", checked)
                    }
                    className="data-[state=checked]:!bg-[#798c5e] data-[state=unchecked]:!bg-[#e7848e]"
                  />
                  <span className="text-sm text-gray-600">
                    {formData.referralBannerEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Text Inputs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Project Name */}
              <TextField
                label="Project Name"
                placeholder="Enter project name"
                value={formData.projectName}
                onChange={(e) => handleInputChange("projectName", e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Project Reference Id */}
              <TextField
                label="Project Reference Id"
                placeholder="Enter project reference id"
                value={formData.projectReferenceId}
                onChange={(e) =>
                  handleInputChange("projectReferenceId", e.target.value)
                }
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>

            {/* Additional Text Inputs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Title */}
              <TextField
                label="Title"
                placeholder="Enter title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Description */}
              <div className="relative w-full md:col-span-2">
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  name="description"
                  rows={3}
                  placeholder=" "
                  className="peer block w-full appearance-none rounded border border-[#ddd] bg-white px-3 pt-6 pb-2 text-base text-gray-900 placeholder-transparent
      focus:outline-none
      focus:border-[1px] hover:border-[#1A1A18]
      focus:border-[#1A1A18]
      resize-vertical"
                />
                <label
                  htmlFor="description"
                  className="absolute left-3 -top-[10px] bg-white px-1 text-sm text-gray-500 z-[1] transition-all duration-200
      peer-placeholder-shown:top-4
      peer-placeholder-shown:text-base
      peer-placeholder-shown:text-gray-400
      peer-focus:-top-[10px]
      peer-focus:text-sm
      peer-focus:text-[#1A1A18]"
                >
                  Description
                </label>
              </div>

              {/* Geo Link */}
              <TextField
                label="Geo Link"
                placeholder="Enter geo link"
                value={formData.geoLink}
                onChange={(e) => handleInputChange("geoLink", e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Details */}
              <div className="relative w-full md:col-span-2">
                <textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) =>
                    handleInputChange("details", e.target.value)
                  }
                  name="details"
                  rows={3}
                  placeholder=" "
                  className="peer block w-full appearance-none rounded border border-[#ddd] bg-white px-3 pt-6 pb-2 text-base text-gray-900 placeholder-transparent
      focus:outline-none
      focus:border-[1px] hover:border-[#1A1A18]
      focus:border-[#1A1A18]
      resize-vertical"
                />
                <label
                  htmlFor="details"
                  className="absolute left-3 -top-[10px] bg-white px-1 text-sm text-gray-500 z-[1] transition-all duration-200
      peer-placeholder-shown:top-4
      peer-placeholder-shown:text-base
      peer-placeholder-shown:text-gray-400
      peer-focus:-top-[10px]
      peer-focus:text-sm
      peer-focus:text-[#1A1A18]"
                >
                  Details
                </label>
              </div>

              {/* Mobile No */}
              <TextField
                label="Mobile No"
                placeholder="Enter mobile no"
                value={formData.mobileNo}
                onChange={(e) => handleInputChange("mobileNo", e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>

            {/* Banner Upload */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="banner" className="text-gray-600 text-sm">
                Banner
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex-1">
                  {formData.banner ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      <FileImage className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {formData.banner.name}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-[45px] flex items-center px-3 bg-white border border-[#ddd] rounded text-sm text-gray-400">
                      No file selected
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="inline-flex h-[45px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[18px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
                >
                  <Upload className="w-4 h-4" />
                  Browse
                </button>
              </div>
            </div>

            {/* Horizontal Banner Upload */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="horizontalBanner" className="text-gray-600 text-sm">
                Horizontal Banner
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={horizontalFileInputRef}
                  onChange={handleHorizontalFileSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <div className="flex-1">
                  {formData.horizontalBanners.length === 0 && (
                    <div className="h-[45px] flex items-center px-3 bg-white border border-[#ddd] rounded text-sm text-gray-400">
                      No file selected
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleHorizontalBrowseClick}
                  className="inline-flex h-[45px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[18px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
                >
                  <Upload className="w-4 h-4" />
                  Browse
                </button>
              </div>
              {formData.horizontalBanners.length > 0 && (
                <div className="space-y-2">
                  {formData.horizontalBanners.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                    >
                      <FileImage className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHorizontalFile(index)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="referral-setup-create-form"
            disabled={isSubmitting}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignsReferralSetupCreate;
