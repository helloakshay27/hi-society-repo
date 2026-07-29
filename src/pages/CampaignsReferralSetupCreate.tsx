import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Upload, X, FileImage } from "lucide-react";
import { createReferralSetup } from "@/services/referralService";

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
                    className={
                      formData.bannerEnabled
                        ? "data-[state=checked]:bg-green-500"
                        : "data-[state=unchecked]:bg-red-500"
                    }
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
                    className={
                      formData.referralBannerEnabled
                        ? "data-[state=checked]:bg-green-500"
                        : "data-[state=unchecked]:bg-red-500"
                    }
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
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-gray-600 text-sm">
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  type="text"
                  placeholder=""
                  className="bg-white"
                  value={formData.projectName}
                  onChange={(e) =>
                    handleInputChange("projectName", e.target.value)
                  }
                />
              </div>

              {/* Project Reference Id */}
              <div className="space-y-2">
                <Label
                  htmlFor="projectReferenceId"
                  className="text-gray-600 text-sm"
                >
                  Project Reference Id
                </Label>
                <Input
                  id="projectReferenceId"
                  type="text"
                  placeholder=""
                  className="bg-white"
                  value={formData.projectReferenceId}
                  onChange={(e) =>
                    handleInputChange("projectReferenceId", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Additional Text Inputs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-600 text-sm">
                  Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder=""
                  className="bg-white"
                  value={formData.title}
                  onChange={(e) =>
                    handleInputChange("title", e.target.value)
                  }
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-600 text-sm">
                  Description
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder=""
                  className="bg-white"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>

              {/* Geo Link */}
              <div className="space-y-2">
                <Label htmlFor="geoLink" className="text-gray-600 text-sm">
                  Geo Link
                </Label>
                <Input
                  id="geoLink"
                  type="text"
                  placeholder=""
                  className="bg-white"
                  value={formData.geoLink}
                  onChange={(e) =>
                    handleInputChange("geoLink", e.target.value)
                  }
                />
              </div>

              {/* Details */}
              <div className="space-y-2">
                <Label htmlFor="details" className="text-gray-600 text-sm">
                  Details
                </Label>
                <Input
                  id="details"
                  type="text"
                  placeholder=""
                  className="bg-white"
                  value={formData.details}
                  onChange={(e) =>
                    handleInputChange("details", e.target.value)
                  }
                />
              </div>

              {/* Mobile No */}
              <div className="space-y-2">
                <Label htmlFor="mobileNo" className="text-gray-600 text-sm">
                  Mobile No
                </Label>
                <Input
                  id="mobileNo"
                  type="text"
                  placeholder=""
                  className="bg-white"
                  value={formData.mobileNo}
                  onChange={(e) =>
                    handleInputChange("mobileNo", e.target.value)
                  }
                />
              </div>
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
                    <Input
                      type="text"
                      placeholder="No file selected"
                      readOnly
                      className="bg-gray-50 cursor-default"
                    />
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
                    <Input
                      type="text"
                      placeholder="No file selected"
                      readOnly
                      className="bg-gray-50 cursor-default"
                    />
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
