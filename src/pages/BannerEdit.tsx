import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { ArrowLeft, FileText, Info, Trash2 } from "lucide-react";
import { ImageCropper } from "../components/reusable/ImageCropper";
import ProjectBannerUpload from "../components/reusable/ProjectBannerUpload";
import ProjectImageVideoUpload from "../components/reusable/ProjectImageVideoUpload";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const BannerEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const baseURL = API_CONFIG.BASE_URL;
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [errors, setErrors] = useState<{title?: string; project_id?: string}>({});
  const [previewImg, setPreviewImg] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [showVideoTooltip, setShowVideoTooltip] = useState(false);
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [videoKey, setVideoKey] = useState(Date.now());
  const [fileType, setFileType] = useState(null);
  const [originalBannerVideo, setOriginalBannerVideo] = useState(null); // Store original preview
  const [showUploader, setShowUploader] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent multiple submissions

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

  const [formData, setFormData] = useState({
    title: "",
    project_id: "",
    banner_video: null,
    active: true,
    banner_video_1_by_1: [],
    banner_video_9_by_16: [],
    banner_video_16_by_9: [],
    banner_video_3_by_2: [],
  });

  const fetchBanner = useCallback(async () => {
    if (!id) return;
    try {
      const response = await axios.get(`${baseURL}/banners/${id}.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (response.data) {
        const bannerData = response.data;
        
        // Helper function to convert banner data to array format with unique IDs
        const convertToArrayFormat = (data, ratio) => {
          if (!data) return [];
          if (Array.isArray(data)) return data;
          
          // If it's an object with document_url, convert to array format
          if (data.document_url || data.url) {
            return [{
              id: data.id || `existing-${ratio}-${Date.now()}`,
              preview: data.document_url || data.url,
              document_url: data.document_url || data.url,
              document_file_name: data.document_file_name || data.file_name || `${ratio} Image`,
              name: data.document_file_name || data.file_name || `${ratio} Image`,
              ratio: ratio,
            }];
          }
          return [];
        };
        
        setFormData({
          title: bannerData.title,
          project_id: bannerData.project_id,
          banner_video: bannerData.banner_video?.document_url || null,
          banner_video_1_by_1: convertToArrayFormat(bannerData.banner_video_1_by_1, "1:1"),
          banner_video_9_by_16: convertToArrayFormat(bannerData.banner_video_9_by_16, "9:16"),
          banner_video_16_by_9: convertToArrayFormat(bannerData.banner_video_16_by_9, "16:9"),
          banner_video_3_by_2: convertToArrayFormat(bannerData.banner_video_3_by_2, "3:2"),
          active: true,
        });
        setOriginalBannerVideo(bannerData.banner_video?.document_url || null);
        if (bannerData.banner_video?.document_url) {
          const isImage = isImageFile(bannerData.banner_video.document_url);
          setFileType(isImage ? "image" : "video");
          if (isImage) {
            setPreviewImg(bannerData.banner_video.document_url);
          } else {
            setPreviewVideo(bannerData.banner_video.document_url);
          }
        } else {
          setPreviewImg(null);
          setPreviewVideo(null);
          setFileType(null);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch banner data");
    } finally {
      setLoading(false);
    }
  }, [id, baseURL]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/projects_for_dropdown.json`, {
        headers: {
                 Authorization: getAuthHeader(),
               },
      });
      setProjects(response.data.projects || []);
    } catch (error) {
      toast.error("Failed to fetch projects");
    }
  }, [baseURL]);

  useEffect(() => {
    if (!id) {
      toast.error("Banner ID is missing");
      navigate("/banner-list");
      return;
    }
    fetchBanner();
    fetchProjects();
  }, [id, fetchBanner, fetchProjects, navigate]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (previewImg && typeof previewImg === 'string' && previewImg.startsWith('blob:')) {
        URL.revokeObjectURL(previewImg);
      }
      if (previewVideo && typeof previewVideo === 'string' && previewVideo.startsWith('blob:')) {
        URL.revokeObjectURL(previewVideo);
      }
      if (image?.data_url) {
        URL.revokeObjectURL(image.data_url);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/gif",
    ];
    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-ms-wmv",
      "video/x-flv",
    ];
    const sizeInMB = file.size / (1024 * 1024);

    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      toast.error("❌ Please upload a valid image or video file.");
      return resetFileState();
    }

    if (isImage && sizeInMB > 3) {
      toast.error("❌ Image size must be less than 3MB.");
      return resetFileState();
    }

    if (isVideo && sizeInMB > 20) {
      toast.error("❌ Video size must be less than 20MB.");
      return resetFileState();
    }

    if (previewVideo) URL.revokeObjectURL(previewVideo);
    if (previewImg) URL.revokeObjectURL(previewImg);
    if (image?.data_url) URL.revokeObjectURL(image.data_url);

    setFileType(isVideo ? "video" : "image");
    const newDataURL = URL.createObjectURL(file);
    setImage({ file, data_url: newDataURL });

    if (isVideo) {
      setPreviewVideo(newDataURL);
      setFormData((prev) => ({ ...prev, banner_video: file }));
      setPreviewImg(null);
      setVideoKey(Date.now());
    } else {
      setDialogOpen(true);
      setPreviewVideo(null);
      setCroppedImage(null);
    }
  };

  const resetFileState = () => {
    setImage(null);
    setPreviewImg(null);
    setPreviewVideo(null);
    setFormData((prev) => ({ ...prev, banner_video: originalBannerVideo }));
    setFileType(
      originalBannerVideo
        ? isImageFile(originalBannerVideo)
          ? "image"
          : "video"
        : null
    );
    if (originalBannerVideo) {
      if (isImageFile(originalBannerVideo)) {
        setPreviewImg(originalBannerVideo);
      } else {
        setPreviewVideo(originalBannerVideo);
      }
    }
  };

  // const handleCropComplete = (cropped) => {
  //   if (cropped) {
  //     setCroppedImage(cropped.base64);
  //     setPreviewImg(cropped.base64);
  //     setFormData((prev) => ({ ...prev, banner_video: cropped.file }));
  //   } else {
  //     if (image?.data_url) URL.revokeObjectURL(image.data_url);
  //     setImage(null);
  //     setPreviewImg(null);
  //     setFormData((prev) => ({ ...prev, banner_video: originalBannerVideo }));
  //     setFileType(originalBannerVideo ? (isImageFile(originalBannerVideo) ? "image" : "video") : null);
  //     if (originalBannerVideo) {
  //       if (isImageFile(originalBannerVideo)) {
  //         setPreviewImg(originalBannerVideo);
  //       } else {
  //         setPreviewVideo(originalBannerVideo);
  //       }
  //     }
  //     const fileInput = document.querySelector('input[type="file"]');
  //     if (fileInput) {
  //       fileInput.value = '';
  //     }
  //   }
  //   setDialogOpen(false);
  // };

  const validateForm = () => {
    const newErrors: {title?: string; project_id?: string} = {};
    if (!formData.title.trim()) newErrors.title = "Title is mandatory";
    if (!formData.project_id) newErrors.project_id = "Project is mandatory";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const bannerUploadConfig = {
    "Banner Attachment": ["1:1", "9:16", "16:9", "3:2"],
  };

  const currentUploadType = "Banner Attachment"; // Can be dynamic
  const selectedRatios = bannerUploadConfig[currentUploadType] || [];
  const dynamicLabel = currentUploadType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicDescription = `Supports ${selectedRatios.join(
    ", "
  )} aspect ratios`;

  // const updateFormData = (key, files) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     [key]: [...(prev[key] || []), ...files],
  //   }));
  // };

  const project_banner = [
    { key: "banner_video_1_by_1", label: "1:1" },
    { key: "banner_video_16_by_9", label: "16:9" },
    { key: "banner_video_9_by_16", label: "9:16" },
    { key: "banner_video_3_by_2", label: "3:2" },
  ];
  // const updateFormData = (key, files) => {
  //   setFormData((prev) => {
  //     const existing = Array.isArray(prev[key]) ? prev[key] : prev[key] ? [prev[key]] : [];
  //     return {
  //       ...prev,
  //       [key]: [...existing, ...files],
  //     };
  //   });
  // };

  const updateFormData = (key, files) => {
    console.log("updateFormData called with:", key, files);
    setFormData((prev) => {
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      const updated = {
        ...prev,
        [key]: [...existing, ...files], // Append new files to existing ones
      };
      console.log("Updated formData:", updated);
      return updated;
    });
  };

  // const handleCropComplete = (validImages) => {
  //   if (!validImages || validImages.length === 0) {
  //     toast.error("No valid images selected.");
  //     setShowUploader(false);
  //     return;
  //   }

  //   validImages.forEach((img) => {
  //     const formattedRatio = img.ratio.replace(':', '_by_'); // e.g., "1:1" -> "1_by_1", "9:16" -> "9_by_16"
  //     const key = `banner_video_${formattedRatio}`; // e.g., banner_video_1_by_1, banner_video_9_by_16
  //     updateFormData(key, [img]); // send as array to preserve consistency
  //   });

  //   // setPreviewImg(validImages[0].preview); // preview first image only
  //   setShowUploader(false);
  // };

  const handleCropComplete = (validMedia) => {
    console.log("handleCropComplete called with:", validMedia);
    
    if (!validMedia || validMedia.length === 0) {
      toast.error("No valid files selected.");
      setShowUploader(false);
      return;
    }

    validMedia.forEach((media) => {
      const formattedRatio = media.ratio.replace(":", "_by_");
      const key = `banner_video_${formattedRatio}`;
      
      // Add unique id to the media object if it doesn't have one
      const mediaWithId = {
        ...media,
        id: media.id || `${key}-${Date.now()}-${Math.random()}`,
      };
      
      console.log("Adding media to key:", key, mediaWithId);
      updateFormData(key, [mediaWithId]);

      // Set preview for the first media
      if (validMedia[0] === media) {
        if (media.type === 'video' && media.file) {
          setPreviewVideo(URL.createObjectURL(media.file));
        } else {
          setPreviewImg(media.preview);
        }
      }
    });

    setShowUploader(false);
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

    // If the removed image is being previewed, reset previewImg
    if (previewImg === imageToRemove.preview) {
      setPreviewImg(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    // const banner1by1 = formData.banner_video_1_by_1;
    // const hasProjectBanner1by1 = Array.isArray(banner1by1)
    //   ? banner1by1.some(
    //       (img) =>
    //         img?.file instanceof File || img?.id || img?.document_file_name
    //     )
    //   : !!(
    //       banner1by1?.file instanceof File ||
    //       banner1by1?.id ||
    //       banner1by1?.document_file_name
    //     );

    // if (!hasProjectBanner1by1) {
    //   toast.error("Banner Attachment with 1:1 ratio is required.");
    //   setLoading(false);
    //   setIsSubmitting(false);
    //   return;
    // }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const sendData = new FormData();

      sendData.append("banner[title]", formData.title);
      sendData.append("banner[project_id]", formData.project_id);

      // Append the main video if it's a File
      if (formData.banner_video instanceof File) {
        sendData.append("banner[banner_video]", formData.banner_video);
      }

      // Handle banner video/image fields like banner_video_1_by_1, banner_video_9_by_16, etc.
      Object.entries(formData).forEach(([key, images]) => {
        if (
          (key.startsWith("banner_video_") ||
            key.startsWith("banner_image_")) &&
          Array.isArray(images)
        ) {
          images.forEach((img) => {
            const backendField =
              key.replace("banner_image_", "banner[banner_image_") + "]";
            if (img.file instanceof File) {
              // sendData.append(backendField, img.file);
              sendData.append(`banner[${key}]`, img.file);
            }
          });
        }
      });

      await axios.put(`${baseURL}/banners/${id}.json`, sendData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Banner updated successfully");
      navigate("/maintenance/banner-list");
    } catch (error) {
      toast.error("Error updating banner");
    } finally {
      setLoading(false);
    }
  };

  const isImageFile = (file) => {
    if (!file) return false;
    if (typeof file === "string") {
      const ext = file.split(".").pop()?.toLowerCase();
      return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"].includes(ext);
    }
    return file.type?.startsWith("image/");
  };

  const handleCancel = () => navigate(-1);

  const handleFetchedDiscardGallery = async (key, index, imageId) => {
    // If no imageId, it's a new image, just remove locally
    if (!imageId) {
      setFormData((prev) => {
        const updatedFiles = Array.isArray(prev[key])
          ? prev[key].filter((_, i) => i !== index)
          : [];
        return { ...prev, [key]: updatedFiles };
      });
      toast.success("Image removed successfully!");
      return;
    }

    // Existing image: delete from server, then remove locally
    try {
      const response = await axios.delete(
        `${baseURL}/banners/${id}/remove_image/${imageId}.json`,
        {
          headers: {
            Authorization: getAuthHeader(),
          },
        }
      );

      // Remove from UI after successful delete
      setFormData((prev) => {
        const updatedFiles = Array.isArray(prev[key])
          ? prev[key].filter((_, i) => i !== index)
          : [];
        return { ...prev, [key]: updatedFiles };
      });

      toast.success("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error);
      
      // If 404, the image doesn't exist on server, still remove from UI
      if (error.response?.status === 404) {
        setFormData((prev) => {
          const updatedFiles = Array.isArray(prev[key])
            ? prev[key].filter((_, i) => i !== index)
            : [];
          return { ...prev, [key]: updatedFiles };
        });
        toast.success("Image removed from UI (already deleted on server).");
      } else {
        toast.error("Failed to delete image. Please try again.");
      }
    }
  };

  // return (
  //   <div className="container-fluid d-flex flex-column" style={{ height: '100vh' }}>
  //     <style>
  //       {`
  //         input[type="file"]::-webkit-file-upload-button {
  //           background: #f1f5f9;
  //           color: #1f2937;
  //           padding: 8px 16px;
  //           margin: 0;
  //           margin-right: 12px;
  //           border: none;
  //           border-right: 1px solid #cbd5e0;
  //           border-radius: 5px 0 0 5px;
  //           cursor: pointer;
  //           font-weight: 500;
  //         }

  //         input[type="file"] {
  //           border: 1px solid #cbd5e0;
  //           border-radius: 6px;
  //           padding: 0;
  //           font-family: sans-serif;
  //           color: #374151;
  //           height: 38px;
  //           margin-left: 10px;
  //         }

  //         .scrollable-content {
  //           overflow-y: auto;
  //           flex-grow: 1;
  //           padding-bottom: 120px; /* space to avoid overlap with sticky footer */
  //         }

  //         .sticky-footer {
  //           background: white;
  //           padding: 12px 0;
  //           box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.1);
  //           position: sticky;
  //           bottom: 0;
  //           z-index: 100;
  //         }
  //       `}
  //     </style>

  //     {/* Scrollable Content Area */}
  //     <div className="scrollable-content">
  //       <div className="row">
  //         <div className="col-12">
  //           <div className="card mt-4">
  //             <div className="card-header">
  //               <h3 className="card-title">Edit Banner</h3>
  //             </div>
  //             <div className="card-body">
  //               {loading ? (
  //                 <p>Loading...</p>
  //               ) : (
  //                 <div className="row">
  //                   <div className="col-md-3">
  //                     <div className="form-group">
  //                       <label>Title <span className="text-danger">*</span></label>
  //                       <input
  //                         className="form-control"
  //                         type="text"
  //                         name="title"
  //                         value={formData.title}
  //                         onChange={handleChange}
  //                       />
  //                       {errors.title && <span className="text-danger">{errors.title}</span>}
  //                     </div>
  //                   </div>

  //                   <div className="col-md-3">
  //                     <div className="form-group">
  //                       <label>Project <span className="text-danger">*</span></label>
  //                       <SelectBox
  //                         options={projects.map((p) => ({ label: p.project_name, value: p.id }))}
  //                         defaultValue={formData.project_id}
  //                         onChange={(value) => setFormData({ ...formData, project_id: value })}
  //                       />
  //                       {errors.project_id && <span className="text-danger">{errors.project_id}</span>}
  //                     </div>
  //                   </div>

  //                   <div className="col-md-3 col-sm-6 col-12">
  //                     <div className="form-group d-flex flex-column">
  //                       <label className="mb-2">
  //                         Banner Attachment{" "}
  //                         <span
  //                           className="tooltip-container"
  //                           onMouseEnter={() => setShowVideoTooltip(true)}
  //                           onMouseLeave={() => setShowVideoTooltip(false)}
  //                         >
  //                           [i]
  //                           {showVideoTooltip && (
  //                             <span className="tooltip-text">
  //                               9:16 or 1:1 Format Should Only Be Allowed
  //                             </span>
  //                           )}
  //                         </span>
  //                       </label>

  //                       <span
  //                         role="button"
  //                         tabIndex={0}
  //                         onClick={() => setShowUploader(true)}
  //                         className="custom-upload-button input-upload-button"
  //                       >
  //                         <span className="upload-button-label">Choose file</span>
  //                         <span className="upload-button-value">No file chosen</span>
  //                       </span>

  //                       {showUploader && (
  //                         <ProjectBannerUpload
  //                           onClose={() => setShowUploader(false)}
  //                           includeInvalidRatios={false}
  //                           selectedRatioProp={selectedRatios}
  //                           showAsModal={true}
  //                           label={dynamicLabel}
  //                           description={dynamicDescription}
  //                           onContinue={handleCropComplete}
  //                         />
  //                       )}
  //                     </div>
  //                   </div>
  //                 </div>
  //               )}

  //               <div className="col-md-12 mt-2">
  //                 <div className="mt-4 tbl-container">
  //                   <table className="w-100 table table-bordered">
  //                     <thead>
  //                       <tr>
  //                         <th>File Name</th>
  //                         <th>Preview</th>
  //                         <th>Ratio</th>
  //                         <th>Action</th>
  //                       </tr>
  //                     </thead>
  //                     <tbody>
  //                       {project_banner.map(({ key, label }) => {
  //                         const files = Array.isArray(formData[key]) ? formData[key] : formData[key] ? [formData[key]] : [];

  //                         return files.map((file, index) => {
  //                           const preview = file.preview || file.document_url || '';
  //                           const name = file.name || file.document_file_name || 'Unnamed';

  //                           return (
  //                             <tr key={`${key}-${index}`}>
  //                               <td>{name}</td>
  //                               <td>
  //                                 <img
  //                                   style={{ maxWidth: 100, maxHeight: 100 }}
  //                                   className="img-fluid rounded"
  //                                   src={preview}
  //                                   alt={name}
  //                                 />
  //                               </td>
  //                               <td>{file.ratio || label}</td>
  //                               <td>
  //                                 <button
  //                                   type="button"
  //                                   className="purple-btn2"
  //                                   onClick={() => handleFetchedDiscardGallery(key, index, file.id)}
  //                                 >
  //                                   x
  //                                 </button>
  //                               </td>
  //                             </tr>
  //                           );
  //                         });
  //                       })}
  //                     </tbody>
  //                   </table>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Sticky Submit/Cancel Button Footer */}
  //     <div className="row sticky-footer justify-content-center">
  //       <div className="col-md-2">
  //         <button onClick={handleSubmit} className="purple-btn2 w-100" disabled={loading}>
  //           Submit
  //         </button>
  //       </div>
  //       <div className="col-md-2">
  //         <button onClick={handleCancel} className="purple-btn2 w-100">
  //           Cancel
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );
  console.log("Current formData in render:", formData);
  console.log("Banner videos in formData:", {
    "1x1": formData.banner_video_1_by_1,
    "16x9": formData.banner_video_16_by_9,
    "9x16": formData.banner_video_9_by_16,
    "3x2": formData.banner_video_3_by_2
  });
  
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
          <span className="text-gray-900 font-medium">Edit Banner</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">EDIT BANNER</h1>
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
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading banner data...</p>
              </div>
            ) : (
              <>
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
                    >
                      <MenuItem value="">Select Project</MenuItem>
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
                        className="relative inline-block cursor-pointer"
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
                            className="font-semibold text-gray-900 py-3 px-4"
                            style={{ borderColor: "#fff" }}
                          >
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {project_banner.flatMap(({ key, label }) => {
                        console.log(`Rendering ${key}:`, formData[key]);
                        const files = Array.isArray(formData[key])
                          ? formData[key]
                          : formData[key]
                          ? [formData[key]]
                          : [];

                        console.log(`Files array for ${key}:`, files);
                        if (files.length === 0) return [];

                        return files.map((file, index) => {
                          const preview = file.preview || file.document_url || "";
                          const name = file.name || file.document_file_name || "Unnamed";
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
                              <TableCell className="py-3 px-4 font-medium">
                                {name}
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                {isVideo ? (
                                  <video
                                    controls
                                    className="rounded border border-gray-200"
                                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                  >
                                    <source
                                      src={preview}
                                      type={
                                        file.file?.type ||
                                        `video/${preview.split(".").pop()}`
                                      }
                                    />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : (
                                  <img
                                    className="rounded border border-gray-200"
                                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
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
                                  onClick={() => handleFetchedDiscardGallery(key, index, file.id)}
                                >
                                   <Trash2 className="w-4 h-4 text-[#C72030]" />
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })}
                      {project_banner.every(
                        ({ key }) =>
                          !formData[key] ||
                          (Array.isArray(formData[key]) && formData[key].length === 0)
                      ) && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-12 text-gray-500"
                          >
                            No files uploaded yet
                          </TableCell>
                        </TableRow>
                      )}
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
              </>
            )}
          </div>
        </div>
      </form>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-6">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BannerEdit;
