import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@mui/material";
import { X, Upload, FileImage } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getReferralSetupById,
  updateReferralSetup,
  ReferralDocument,
} from "@/services/referralService";

// Field styles for Material-UI components (matches BMS/AddHelpdeskTicket.tsx)
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
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#C72030",
    },
  },
};

const CampaignsReferralSetupEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const horizontalFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    existingBannerUrl: null as string | null,
    existingDocuments: [] as ReferralDocument[],
  });

  // Fetch referral setup data on load
  useEffect(() => {
    const fetchReferralSetup = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await getReferralSetupById(parseInt(id, 10));
        
        setFormData({
          bannerEnabled: data.active === 1,
          referralBannerEnabled: false,
          projectName: data.project_name || "",
          projectReferenceId: data.project_reference_id?.toString() || "",
          title: data.title || "",
          description: data.description || "",
          geoLink: data.geo_link || "",
          details: data.details || "",
          mobileNo: data.mobile_no || "",
          banner: null,
          horizontalBanners: [],
          existingBannerUrl: data.banner || null,
          existingDocuments: data.documents || [],
        });
      } catch (err) {
        console.error("Failed to fetch referral setup:", err);
        setError("Failed to load referral setup. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralSetup();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

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

      await updateReferralSetup(parseInt(id, 10), payload);
      navigate("/campaigns/referral-setup");
    } catch (err) {
      console.error("Failed to update referral setup:", err);
      setError("Failed to update referral setup. Please try again.");
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

  const handleRemoveExistingDocument = (documentId: number) => {
    setFormData((prev) => ({
      ...prev,
      existingDocuments: prev.existingDocuments.filter((doc) => doc.id !== documentId),
    }));
  };

  const handleHorizontalBrowseClick = () => {
    horizontalFileInputRef.current?.click();
  };

  const handleRemove = async () => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this referral setup?")) {
      try {
        const { deleteReferralSetup } = await import("@/services/referralService");
        await deleteReferralSetup(parseInt(id, 10));
        navigate("/campaigns/referral-setup");
      } catch (err) {
        console.error("Failed to delete referral setup:", err);
        setError("Failed to delete referral setup. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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

            {/* Remove Button */}
            <div className="flex justify-center mb-6">
              {/* <Button
                type="button"
                onClick={handleRemove}
                className="bg-red-500 hover:bg-red-600 text-white px-6"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button> */}
            </div>

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
                        ? "data-[state=checked]:!bg-green-500"
                        : "data-[state=unchecked]:!bg-gray-300"
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
                        ? "data-[state=checked]:!bg-green-500"
                        : "data-[state=unchecked]:!bg-gray-300"
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
                onChange={(e) => handleInputChange("projectReferenceId", e.target.value)}
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
              <TextField
                label="Description"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

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
                  ) : formData.existingBannerUrl ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      <FileImage className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        Existing banner available
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, existingBannerUrl: null }))}
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
                  {formData.horizontalBanners.length === 0 &&
                    formData.existingDocuments.length === 0 && (
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

              {formData.existingDocuments.length > 0 && (
                <div className="space-y-2">
                  {formData.existingDocuments.map((doc) => {
                    const url = doc.document || doc.document_url || doc.url;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                      >
                        <FileImage className="w-4 h-4 text-gray-500" />
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:underline flex-1 truncate"
                          >
                            {doc.document_file_name || "Existing horizontal banner"}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-700 flex-1 truncate">
                            {doc.document_file_name || "Existing horizontal banner"}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingDocument(doc.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

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

export default CampaignsReferralSetupEdit;
