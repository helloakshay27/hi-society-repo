import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { ChevronRight, ArrowLeft, Upload, X, FileText, Info, Plus } from "lucide-react";
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
    height: '44px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    '& .MuiOutlinedInput-root': {
      height: '44px',
      borderRadius: '12px',
      '& fieldset': {
        borderColor: 'rgba(26, 26, 24, 0.08)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(26, 26, 24, 0.28)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1A1A18',
      },
    },
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: '#1A1A18',
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

      await axios.post(getFullUrl('/press_releases.json'), sendData, {
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
    <div className="h-full press-releases-create-page">
      <style>{`
        .press-releases-create-page .MuiFormLabel-asterisk { color: var(--color-primary, #da7756) !important; }
        /* Global "form svg" rule turns every icon black; keep icons on filled buttons white */
        html body #root .press-releases-create-page form button.btn-primary svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
        /* Info badge: black disc with a white "i" instead of a solid black dot */
        html body #root .press-releases-create-page form svg.fill-black {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* ---- Reference design: canvas, cards, fields ---- */
        html body #root .press-releases-create-page {
          background-color: #FDFDFB !important;
        }
        html body #root .press-releases-create-page .ref-card {
          border: 1px solid rgba(26, 26, 24, 0.09) !important;
          border-radius: 16px !important;
          box-shadow: none !important;
        }
        html body #root .press-releases-create-page .ref-card > div:first-child {
          padding: 22px 24px 0 !important;
          background: transparent !important;
          border: none !important;
        }
        html body #root .press-releases-create-page .ref-card > div:first-child h2 {
          font-size: 14px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          color: #1A1A18 !important;
        }
        /* section icon chip — same as Settings module (32px, #F5F4F0, ink icon) */
        html body #root .press-releases-create-page .ref-card > div:first-child h2 > span:first-child {
          width: 32px !important;
          height: 32px !important;
          margin-right: 12px !important;
          flex: none;
          background-color: #F5F4F0 !important;
        }
        html body #root .press-releases-create-page .ref-card > div:first-child h2 > span:first-child svg {
          width: 14px !important;
          height: 14px !important;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .press-releases-create-page .ref-card > div:nth-child(2) {
          background-color: #FFFFFF !important;
          padding: 16px 24px 22px !important;
        }
        html body #root .press-releases-create-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .press-releases-create-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .press-releases-create-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .press-releases-create-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .press-releases-create-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .press-releases-create-page .MuiOutlinedInput-input::placeholder {
          color: rgba(26, 26, 24, 0.3) !important;
          opacity: 1 !important;
        }
        html body #root .press-releases-create-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
        /* reference dropzone */
        html body #root .press-releases-create-page .ref-dropzone {
          width: 100%;
          border: 2px dashed #EBE9E2;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
          background: transparent;
          color: #1A1A18;
          cursor: pointer;
          transition: border-color 0.16s ease, background-color 0.16s ease;
        }
        html body #root .press-releases-create-page .ref-dropzone:hover {
          border-color: rgba(26, 26, 24, 0.28);
          background-color: #FDFDFB;
        }
      `}</style>
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        {/* Header */}
        <div className="mb-[22px]">
          <div className="flex items-center gap-2 text-[13px] font-medium mb-3" style={{ color: "rgba(26, 26, 24, 0.48)" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span>Press Releases List</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold" style={{ color: "#1A1A18" }}>Create New Press Release</span>
          </div>
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em]" style={{ color: "#1A1A18" }}>New Press Release</h1>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
          {/* Section: Press Release Information */}
          <div className="ref-card bg-white overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                <span className="w-7 h-7 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: "#F6F4EE" }}>
                  <FileText size={14} color="#2C2C2C" />
                </span>
                Press Release Information
              </h2>
            </div>
            <div className="p-6 space-y-6 bg-white">
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
              <div className="flex flex-col gap-1.5">
                {/* Label */}
                <div className="flex items-center">
                  <h5 className="text-[12px] font-semibold inline-flex items-center gap-1" style={{ color: "rgba(26, 26, 24, 0.68)" }}>
                    Press Release Attachment{" "}
                    <span
                      className="relative inline-flex items-center cursor-pointer"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                        <Info className="w-4 h-4 fill-black text-white" />
                      {showTooltip && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 5 MB. Supports 16:9, 9:16, 1:1 aspect ratios
                        </span>
                      )}
                    </span>
                    <span style={{ color: 'var(--color-primary, #da7756)', marginLeft: '4px' }}>*</span>
                  </h5>

                </div>

                {/* Dropzone (reference design) — opens the existing crop/upload modal */}
                <button
                  type="button"
                  className="ref-dropzone"
                  onClick={() => setShowUploader(true)}
                >
                  <Upload size={18} strokeWidth={1.8} />
                  <span className="text-[12.5px] font-semibold">Choose press release images</span>
                  <span className="text-[11px]" style={{ color: "rgba(26, 26, 24, 0.48)" }}>16:9, 9:16, 1:1 · Max 5 MB</span>
                </button>

                {/* Uploaded files */}
                {allUploadedImages.length > 0 && (
                <div className="mt-3 rounded-xl border border-[rgba(26,26,24,0.09)] overflow-hidden">
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
                )}

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
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/maintenance/press-releases-list")}
              className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary h-9 px-4 text-sm font-medium"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PressReleasesCreate;