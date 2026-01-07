import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { ChevronRight, ArrowLeft, Upload, X, FileText } from "lucide-react";
import ProjectBannerUpload from "../components/reusable/ProjectBannerUpload";
import { TextField } from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { DeleteForeverRounded } from "@mui/icons-material";

const PressReleasesCreate = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    release_date: "",
    pr_image_16_by_9: [],
    pr_image_9_by_16: [],
    pr_image_1_by_1: [],
    attachment_url: "",
    press_source: "",
  });

  // Field styles for Material-UI components
  const fieldStyles = {
    height: '45px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      height: '45px',
      '& fieldset': {
        borderColor: '#ddd',
      },
      '&:hover fieldset': {
        borderColor: '#C72030',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#C72030',
      },
    },
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: '#C72030',
      },
    },
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Title is mandatory");
      return false;
    }

    if (!formData.release_date) {
      toast.error("Press Releases Date is mandatory");
      return false;
    }

    if (!formData.description.trim()) {
      toast.error("Description is mandatory");
      return false;
    }

    // Check if at least one image ratio is uploaded
    const hasAnyImage =
      (formData.pr_image_16_by_9 && formData.pr_image_16_by_9.length > 0) ||
      (formData.pr_image_9_by_16 && formData.pr_image_9_by_16.length > 0) ||
      (formData.pr_image_1_by_1 && formData.pr_image_1_by_1.length > 0);

    if (!hasAnyImage) {
      toast.error("At least one image attachment is mandatory");
      return false;
    }

    if (!formData.attachment_url.trim()) {
      toast.error("Attachment URL is mandatory");
      return false;
    }

    return true;
  };

  const pressUploadConfig = {
    "pr image": ["16:9", "9:16", "1:1"],
  };

  const currentUploadType = "pr image";
  const selectedRatios = pressUploadConfig[currentUploadType] || [];
  const dynamicLabel = currentUploadType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicDescription = `Supports ${selectedRatios.join(", ")} aspect ratios`;

  const updateFormData = (key, files) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), ...files],
    }));
  };

  const handleCropComplete = (validImages) => {
    if (!validImages || validImages.length === 0) {
      toast.error("No valid images selected.");
      setShowUploader(false);
      return;
    }

    validImages.forEach((img) => {
      const formattedRatio = img.ratio.replace(":", "_by_");
      const key = `${currentUploadType}_${formattedRatio}`
        .replace(/\s+/g, "_")
        .toLowerCase();

      updateFormData(key, [img]);
    });

    setShowUploader(false);
    toast.success("Images uploaded successfully");
  };

  const discardImage = (key, imageToRemove) => {
    setFormData((prev) => {
      const updatedArray = (prev[key] || []).filter(
        (img) => img.id !== imageToRemove.id
      );

      const newFormData = { ...prev };
      if (updatedArray.length === 0) {
        delete newFormData[key];
      } else {
        newFormData[key] = updatedArray;
      }

      return newFormData;
    });
    toast.success("Image removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const sendData = new FormData();
      sendData.append("press_release[title]", formData.title);
      sendData.append("press_release[release_date]", formData.release_date);
      sendData.append("press_release[press_source]", formData.press_source);
      sendData.append("press_release[description]", formData.description);

      if (formData.attachment_url) {
        sendData.append("press_release[attachment_url]", formData.attachment_url);
      }

      // Append all image ratios
      Object.entries(formData).forEach(([key, images]) => {
        if (key.startsWith("pr_image_") && Array.isArray(images)) {
          images.forEach((img) => {
            const backendField = key.replace("pr_image_", "press_release[pr_image_") + "]";
            if (img.file instanceof File) {
              sendData.append(backendField, img.file);
            }
          });
        }
      });

      await axios.post(`${baseURL}/press_releases.json`, sendData, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Press release created successfully!");
      navigate("/maintenance/press-releases-list");
    } catch (error) {
      console.error("Error response:", error.response);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get all uploaded images for display
  const allUploadedImages = [
    ...(formData.pr_image_16_by_9 || []).map((file) => ({
      ...file,
      type: "pr_image_16_by_9",
    })),
    ...(formData.pr_image_9_by_16 || []).map((file) => ({
      ...file,
      type: "pr_image_9_by_16",
    })),
    ...(formData.pr_image_1_by_1 || []).map((file) => ({
      ...file,
      type: "pr_image_1_by_1",
    })),
  ];

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span>Press Releases List</span>
            <span>{">"}</span>
            <span className="text-gray-900 font-medium">Create New Press Release</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CREATE PRESS RELEASE</h1>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
          {/* Section: Press Release Information */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                  <FileText size={16} color="#C72030" />
                </span>
                Press Release Information
              </h2>
            </div>
            <div className="p-6 space-y-6" style={{ backgroundColor: "#AAB9C50D" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Title Input */}
                <TextField
                  label="Title"
                  placeholder="Enter title"
                  value={formData.title}
                  onChange={handleChange}
                  name="title"
                  required
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  InputProps={{
                    sx: fieldStyles,
                  }}
                  disabled={loading}
                />

                {/* Release Date */}
                <TextField
                  label="Press Releases Date"
                  type="date"
                  value={formData.release_date}
                  onChange={handleChange}
                  name="release_date"
                  required
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  InputProps={{
                    sx: fieldStyles,
                  }}
                  disabled={loading}
                />

                {/* Description */}
                <TextField
                  label="Description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={handleChange}
                  name="description"
                  required
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  InputProps={{
                    sx: fieldStyles,
                  }}
                  disabled={loading}
                />

                {/* Source Details */}
                <TextField
                  label="Source Details"
                  placeholder="Enter source details"
                  value={formData.press_source}
                  onChange={handleChange}
                  name="press_source"
                  required
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  InputProps={{
                    sx: fieldStyles,
                  }}
                  disabled={loading}
                />

                {/* Attachment URL */}
                <TextField
                  label="Attachment URL"
                  type="url"
                  placeholder="Enter URL"
                  value={formData.attachment_url}
                  onChange={handleChange}
                  name="attachment_url"
                  required
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  InputProps={{
                    sx: fieldStyles,
                  }}
                  disabled={loading}
                />
              </div>

              {/* Banner Attachment Section */}
              <div className="mb-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-semibold">
                    Press Release Attachment{" "}
                    <span
                      className="relative inline-block cursor-help"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <span className="text-red-500">[i]</span>
                      {showTooltip && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 5 MB. Supports 16:9, 9:16, 1:1 aspect ratios
                        </span>
                      )}
                    </span>
                    <span className="text-red-500 ml-1">*</span>
                  </h5>

                  <button
                    className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-[45px] px-4 text-sm font-medium rounded-md flex items-center gap-2"
                    type="button"
                    onClick={() => setShowUploader(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
                    <span>Add</span>
                  </button>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table className="w-full border-separate">
                    <TableHeader>
                      <TableRow style={{ backgroundColor: "#e6e2d8" }}>
                        <TableHead
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          File Name
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Preview
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Ratio
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {allUploadedImages.length > 0 ? (
                        allUploadedImages.map((file, index) => {
                          const preview = file.preview || "";
                          const name = file.name || `Image ${index + 1}`;

                          return (
                            <TableRow
                              key={`${file.type}-${file.id || index}`}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell className="py-3 px-4 font-medium">{name}</TableCell>

                              <TableCell className="py-3 px-4">
                                <img
                                  style={{
                                    maxWidth: 100,
                                    maxHeight: 100,
                                    objectFit: "cover",
                                  }}
                                  className="rounded border border-gray-200"
                                  src={preview}
                                  alt={name}
                                />
                              </TableCell>

                              <TableCell className="py-3 px-4">
                                {file.ratio || "N/A"}
                              </TableCell>

                              <TableCell className="py-3 px-4">
                                <button
                                  type="button"
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  onClick={() => discardImage(file.type, file)}
                                >
                                  <DeleteForeverRounded fontSize="small" />
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                            No images uploaded yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Upload Modal */}
                {showUploader && (
                  <ProjectBannerUpload
                    onClose={() => setShowUploader(false)}
                    includeInvalidRatios={false}
                    selectedRatioProp={selectedRatios}
                    showAsModal
                    label={dynamicLabel}
                    description={dynamicDescription}
                    onContinue={handleCropComplete}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
            >
              {loading ? 'Submit' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => navigate("/maintenance/press-releases-list")}
              className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PressReleasesCreate;