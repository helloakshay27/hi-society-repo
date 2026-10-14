import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, FileText, Info, Plus, Trash2, Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import ProjectImageVideoUpload from "../components/reusable/ProjectImageVideoUpload";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";
import { DeleteForeverRounded } from "@mui/icons-material";

const BannerAdd = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{title?: string; project_id?: string}>({});
  const [previewImg, setPreviewImg] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [showVideoTooltip, setShowVideoTooltip] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageConfigurations, setImageConfigurations] = useState({
    BannerAttachment: [],
  });

  const [formData, setFormData] = useState({
    title: "",
    project_id: "",
    banner_video: null,
    active: true,
    banner_video_1_by_1: null,
    banner_video_9_by_16: null,
    banner_video_16_by_9: null,
    banner_video_3_by_2: null,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(getFullUrl('/projects_for_dropdown.json'), {
          headers: {
                   Authorization: getAuthHeader(),
                 },
        });
        setProjects(response.data.projects || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchImageConfigurations = async () => {
      try {
        const response = await axios.get(
          getFullUrl('/system_constants.json?q[description_eq]=ImagesConfiguration'),
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );
        
        if (response.data && Array.isArray(response.data)) {
          const configs = {};
          
          response.data.forEach((config) => {
            const { name, value } = config;
            
            // Extract ratio from value (e.g., "banner_video_1_by_1" -> "1:1")
            const ratioMatch = value.match(/(\d+)_by_(\d+)/);
            if (ratioMatch) {
              const ratio = `${ratioMatch[1]}:${ratioMatch[2]}`;
              
              if (!configs[name]) {
                configs[name] = [];
              }
              
              if (!configs[name].includes(ratio)) {
                configs[name].push(ratio);
              }
            }
          });
          
          setImageConfigurations(configs);
        }
      } catch (error) {
        console.error('Error fetching image configurations:', error);
        // Set default configurations if API fails
        setImageConfigurations({
          BannerAttachment: ['1:1', '9:16', '16:9', '3:2'],
        });
      }
    };

    fetchProjects();
    fetchImageConfigurations();

    return () => {
      if (previewImg) URL.revokeObjectURL(previewImg);
      if (previewVideo) URL.revokeObjectURL(previewVideo);
    };
  }, []);

  // Get dynamic ratios text for tooltips
  const getDynamicRatiosText = (configName) => {
    const ratios = imageConfigurations[configName] || [];
    if (ratios.length === 0) return "No ratios configured";
    return ratios.join(", ");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is mandatory";
    if (!formData.project_id) newErrors.project_id = "Project is mandatory";
    
    // Check if at least one banner attachment exists
    const hasAttachment = project_banner.some(({ key }) => {
      const files = formData[key];
      return Array.isArray(files) && files.length > 0;
    });
    
    if (!hasAttachment) {
      toast.error("Please add at least one banner attachment");
      return false;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const project_banner = [
    { key: "banner_video_1_by_1", label: "1:1" },
    { key: "banner_video_16_by_9", label: "16:9" },
    { key: "banner_video_9_by_16", label: "9:16" },
    { key: "banner_video_3_by_2", label: "3:2" },
  ];

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

  const bannerUploadConfig = {
    "Banner Attachment": ["1:1", "9:16", "16:9", "3:2"],
  };

  const currentUploadType = "Banner Attachment";
  const selectedRatios = bannerUploadConfig[currentUploadType] || [];
  const dynamicLabel = currentUploadType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicDescription = `Supports ${selectedRatios.join(
    ", "
  )} aspect ratios`;

  const updateFormData = (key, files) => {
    setFormData((prev) => {
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      return {
        ...prev,
        [key]: [...existing, ...files], // Append new files to existing ones
      };
    });
  };

  const handleCropComplete = (validImages, videoFiles = []) => {
    // Handle video files first
    if (videoFiles && videoFiles.length > 0) {
      videoFiles.forEach((video) => {
        const formattedRatio = video.ratio.replace(":", "_by_");
        const key = `banner_video_${formattedRatio}`;
        
        // Add unique id to the video object
        const videoWithId = {
          ...video,
          id: `${key}-${Date.now()}-${Math.random()}`,
        };
        
        updateFormData(key, [videoWithId]);

        // Set preview for the first video
        if (videoFiles[0] === video) {
          setPreviewVideo(URL.createObjectURL(video.file));
        }
      });
      setShowUploader(false); // Close modal here
      return;
    }

    // Handle images
    if (!validImages || validImages.length === 0) {
      toast.error("No valid files selected.");
      setShowUploader(false);
      return;
    }

    validImages.forEach((img) => {
      const formattedRatio = img.ratio.replace(":", "_by_");
      const key = `banner_video_${formattedRatio}`;
      
      // Add unique id to the image object if it doesn't have one
      const imgWithId = {
        ...img,
        id: img.id || `${key}-${Date.now()}-${Math.random()}`,
      };
      
      updateFormData(key, [imgWithId]);

      // Set preview for the first image
      if (validImages[0] === img) {
        setPreviewImg(img.preview);
      }
    });

    setShowUploader(false); // Ensure modal closes after image handling
  };

  const discardImage = (key, imageToRemove) => {
    setFormData((prev) => {
      const updatedArray = (prev[key] || []).filter(
        (img) => img.id !== imageToRemove.id
      );

      // Remove the key if the array becomes empty
      const newFormData = { ...prev };
      if (updatedArray.length === 0) {
        delete newFormData[key];
      } else {
        newFormData[key] = updatedArray;
      }

      return newFormData;
    });

    // If the removed image is being previewed, reset preview
    if (previewImg === imageToRemove.preview) {
      setPreviewImg(null);
    }
    if (previewVideo === imageToRemove.preview) {
      setPreviewVideo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const sendData = new FormData();
      sendData.append("banner[title]", formData.title);
      sendData.append("banner[project_id]", formData.project_id);

      // Handle banner video/image fields
      Object.entries(formData).forEach(([key, images]) => {
        if (
          (key.startsWith("banner_video_") ||
            key.startsWith("banner_image_")) &&
          Array.isArray(images)
        ) {
          images.forEach((img) => {
            if (img.file instanceof File) {
              sendData.append(`banner[${key}]`, img.file);
            }
          });
        }
      });

      console.log("data to be sent:", Array.from(sendData.entries()));

      await axios.post(getFullUrl('/banners.json'), sendData, {
         headers: {
                    Authorization: getAuthHeader(),
                  },
      });

      toast.success("Banner created successfully");
      navigate("/maintenance/banner-list");
    } catch (error) {
      console.error(error);
      toast.error(`Error creating banner: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="p-6 min-h-screen banner-add-page">
      <style>{`
        .banner-add-page .MuiFormLabel-asterisk { color: var(--color-primary, #da7756) !important; }
        /* Global "form svg" rule turns every icon black; keep icons on filled buttons white */
        html body #root .banner-add-page form button.btn-primary svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
        /* Info badge: black disc with a white "i" instead of a solid black dot */
        html body #root .banner-add-page form svg.fill-black {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
        /* ---- Reference design: canvas, cards, fields ---- */
        html body #root .banner-add-page {
          background-color: #FDFDFB !important;
        }
        html body #root .banner-add-page .ref-card {
          border: 1px solid rgba(26, 26, 24, 0.09) !important;
          border-radius: 16px !important;
          box-shadow: none !important;
        }
        html body #root .banner-add-page .ref-card > div:first-child {
          padding: 22px 24px 0 !important;
          background: transparent !important;
          border: none !important;
        }
        html body #root .banner-add-page .ref-card > div:first-child h2 {
          font-size: 14px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          color: #1A1A18 !important;
        }
        /* section icon chip — same as Settings module (32px, #F5F4F0, ink icon) */
        html body #root .banner-add-page .ref-card > div:first-child h2 > span:first-child {
          width: 32px !important;
          height: 32px !important;
          margin-right: 12px !important;
          flex: none;
          background-color: #F5F4F0 !important;
        }
        html body #root .banner-add-page .ref-card > div:first-child h2 > span:first-child svg {
          width: 14px !important;
          height: 14px !important;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .banner-add-page .ref-card > div:nth-child(2) {
          background-color: #FFFFFF !important;
          padding: 16px 24px 22px !important;
        }
        html body #root .banner-add-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .banner-add-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .banner-add-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .banner-add-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .banner-add-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .banner-add-page .MuiOutlinedInput-input::placeholder {
          color: rgba(26, 26, 24, 0.3) !important;
          opacity: 1 !important;
        }
        html body #root .banner-add-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
        /* reference dropzone */
        html body #root .banner-add-page .ref-dropzone {
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
        html body #root .banner-add-page .ref-dropzone:hover {
          border-color: rgba(26, 26, 24, 0.28);
          background-color: #FDFDFB;
        }
      `}</style>
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
          <span>Banner List</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold" style={{ color: "#1A1A18" }}>Create New Banner</span>
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em]" style={{ color: "#1A1A18" }}>New Banner</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        {/* Section: Banner Information */}
        <div className="ref-card bg-white overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-white">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center">
              <span className="w-7 h-7 rounded-full flex items-center justify-center mr-3 bg-[#F6F4EE]">
                <FileText size={14} color="#2C2C2C" />
              </span>
              Banner Information
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
                error={!!errors.title}
                helperText={errors.title}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              {/* Project Select */}
              <FormControl
                fullWidth
                variant="outlined"
                required
                error={!!errors.project_id}
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Project</InputLabel>
                <MuiSelect
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  label="Project"
                  notched
                  displayEmpty
                  disabled={loading}
                >
                  <MenuItem value="">
                    {loading ? "Loading projects..." : "Select Project"}
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
                {errors.project_id && (
                  <span className="text-red-500 text-xs mt-1">{errors.project_id}</span>
                )}
              </FormControl>

            </div>

            {/* Banner Attachment Section */}
            <div className="flex flex-col gap-1.5">
              {/* Label */}
              <div className="flex items-center">
                <h5 className="text-[12px] font-semibold inline-flex items-center gap-1" style={{ color: "rgba(26, 26, 24, 0.68)" }}>
                  Banner Attachment{" "}
                  <span
                    className="relative inline-flex items-center cursor-pointer"
                    onMouseEnter={() => setShowVideoTooltip(true)}
                    onMouseLeave={() => setShowVideoTooltip(false)}
                  >
                    <Info className="w-4 h-4 fill-black text-white" />
                    {showVideoTooltip && (
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                        Max Upload Size 5 MB. Supports {getDynamicRatiosText("BannerAttachment")} aspect ratios
                      </span>
                    )}
                  </span>
                  <span className="text-red-500 ml-1">*</span>
                </h5>

              </div>

              {/* Dropzone (reference design) — opens the existing crop/upload modal */}
              <button
                type="button"
                className="ref-dropzone"
                onClick={() => setShowUploader(true)}
              >
                <Upload size={18} strokeWidth={1.8} />
                <span className="text-[12.5px] font-semibold">Choose banner images or videos</span>
                <span className="text-[11px]" style={{ color: "rgba(26, 26, 24, 0.48)" }}>
                  {getDynamicRatiosText("BannerAttachment")} · Max 5 MB
                </span>
              </button>

              {/* Uploaded files */}
              {project_banner.some(({ key }) => (Array.isArray(formData[key]) ? formData[key].length > 0 : !!formData[key])) && (
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
                    {project_banner.flatMap(({ key, label }) => {
                      const files = Array.isArray(formData[key])
                        ? formData[key]
                        : formData[key]
                        ? [formData[key]]
                        : [];

                      if (files.length === 0) return [];

                      return files.map((file, index) => {
                        const preview = file.preview || file.document_url || "";
                        const name = file.name || file.document_file_name || `Image ${index + 1}`;
                        const isVideo =
                          file.type === "video" ||
                          file.file?.type?.startsWith("video/") ||
                          preview.endsWith(".mp4") ||
                          preview.endsWith(".webm") ||
                          preview.endsWith(".gif") ||
                          preview.endsWith(".ogg");

                        return (
                          <TableRow
                            key={`${key}-${file.id || index}`}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="py-3 px-4 font-medium">{name}</TableCell>

                            <TableCell className="py-3 px-4">
                              {isVideo ? (
                                <video
                                  controls
                                  style={{
                                    maxWidth: 100,
                                    maxHeight: 100,
                                    objectFit: "cover",
                                  }}
                                  className="rounded border border-gray-200"
                                >
                                  <source
                                    src={preview}
                                    type={
                                      file.file?.type ||
                                      `video/${preview.split(".").pop()}`
                                    }
                                  />
                                </video>
                              ) : (
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
                              )}
                            </TableCell>

                            <TableCell className="py-3 px-4">
                              {file.ratio || label}
                            </TableCell>

                            <TableCell className="py-3 px-4">
                              <button
                                type="button"
                                // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                onClick={() => discardImage(key, file)}
                              >
                                  <Trash2 className="w-4 h-4 text-[#C72030]" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })}
                  </TableBody>
                </Table>
              </div>
              )}

              {/* Upload Modal */}
              {showUploader && (
                <ProjectImageVideoUpload
                  onClose={() => setShowUploader(false)}
                  includeInvalidRatios={false}
                  selectedRatioProp={selectedRatios}
                  showAsModal
                  label={dynamicLabel}
                  description={dynamicDescription}
                  onContinue={handleCropComplete}
                  allowVideos
                />
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
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
  );
};

export default BannerAdd;
