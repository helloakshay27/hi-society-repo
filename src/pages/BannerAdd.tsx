import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, FileText, Info, Trash2 } from "lucide-react";
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
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{title?: string; project_id?: string}>({});
  const [previewImg, setPreviewImg] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [showVideoTooltip, setShowVideoTooltip] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const response = await axios.get(`${baseURL}/projects_for_dropdown.json`, {
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

    fetchProjects();

    return () => {
      if (previewImg) URL.revokeObjectURL(previewImg);
      if (previewVideo) URL.revokeObjectURL(previewVideo);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is mandatory";
    if (!formData.project_id) newErrors.project_id = "Project is mandatory";
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

      await axios.post(`${baseURL}/banners.json`, sendData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
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
    <div className="p-6 bg-gray-50 min-h-screen">
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
          <span>Banner List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create New Banner</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CREATE BANNER</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        {/* Section: Banner Information */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <FileText size={16} color="#C72030" />
              </span>
              Banner Information
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
            <div className="mb-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                 <h5 className="font-semibold inline-flex items-center gap-1">
                  Banner Attachment{" "}
                  <span
                    className="relative inline-block cursor-help"
                    onMouseEnter={() => setShowVideoTooltip(true)}
                    onMouseLeave={() => setShowVideoTooltip(false)}
                  >
                     <Info className="w-5 h-5 fill-black text-white" />
                    {showVideoTooltip && (
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                        Max Upload Size 5 MB. Supports 1:1, 9:16, 16:9, 3:2 aspect ratios
                      </span>
                    )}
                  </span>
                  <span className="text-red-500 ml-1">*</span>
                </h5>

                <button
                  type="button"
                  className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-[45px] px-4 text-sm font-medium rounded-md flex items-center gap-2"
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
            onClick={handleCancel}
             className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BannerAdd;
