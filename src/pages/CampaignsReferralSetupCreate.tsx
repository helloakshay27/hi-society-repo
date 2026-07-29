import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Upload, X, FileImage } from "lucide-react";
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
      borderColor: "#C72030",
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
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="mx-auto">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-lg font-normal text-gray-700">
              Referral Setup
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
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
                  className="data-[state=checked]:bg-[#da7756] data-[state=unchecked]:bg-gray-300"
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
                    className="data-[state=checked]:bg-[#da7756] data-[state=unchecked]:bg-gray-300"
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
                  className="peer block w-full appearance-none rounded border border-gray-300 bg-white px-3 pt-6 pb-2 text-base text-gray-900 placeholder-transparent
      focus:outline-none
      focus:border-[2px]
      focus:border-[rgb(25,118,210)]
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
      peer-focus:text-[rgb(25,118,210)]"
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
              <TextField
                label="Details"
                placeholder="Enter details"
                value={formData.details}
                onChange={(e) => handleInputChange("details", e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBrowseClick}
                  className="bg-[#C72030] hover:bg-[#A01828] !text-white flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Browse
                </Button>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleHorizontalBrowseClick}
                  className="bg-[#C72030] hover:bg-[#A01828] !text-white flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Browse
                </Button>
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

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 my-6"></div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="outline"
                className="bg-[#C72030] hover:bg-[#A01828] !text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CampaignsReferralSetupCreate;
