import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import MultiSelectBox from "../components/ui/multi-selector";
import SelectBox from "@/components/ui/select-box";
import { API_CONFIG } from "@/config/apiConfig";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import ProjectBannerUpload from "../components/reusable/ProjectBannerUpload";
import ProjectImageVideoUpload from "../components/reusable/ProjectImageVideoUpload";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

const BroadcastCreate = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    notice_heading: "",
    notice_text: "",
    expire_time: "",
    expire_date: "",
    shared: "all",
    group_id: [],
    user_ids: [],
    is_important: false,
    email_trigger_enabled: "",
    publish: "1",
    of_phase: "pms",
    of_atype: "Pms::Site",
    cover_image_1_by_1: [],
    cover_image_9_by_16: [],
    cover_image_3_by_2: [],
    cover_image_16_by_9: [],
    broadcast_images_1_by_1: [],
    broadcast_images_9_by_16: [],
    broadcast_images_3_by_2: [],
    broadcast_images_16_by_9: [],
  });

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAttachmentTooltip, setShowAttachmentTooltip] = useState(false);
  const [showCoverUploader, setShowCoverUploader] = useState(false);
  const [showBroadcastUploader, setShowBroadcastUploader] = useState(false);
  const previewUrlsRef = useRef(new Map());

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

  const coverImageRatios = [
    { key: "cover_image_1_by_1", label: "1:1" },
    { key: "cover_image_16_by_9", label: "16:9" },
    { key: "cover_image_9_by_16", label: "9:16" },
    { key: "cover_image_3_by_2", label: "3:2" },
  ];

  const broadcastImageRatios = [
    { key: "broadcast_images_1_by_1", label: "1:1" },
    { key: "broadcast_images_16_by_9", label: "16:9" },
    { key: "broadcast_images_9_by_16", label: "9:16" },
    { key: "broadcast_images_3_by_2", label: "3:2" },
  ];

  const uploadConfig = {
    "cover image": ["16:9", "1:1", "9:16", "3:2"],
    "broadcast images": ["16:9", "1:1", "9:16", "3:2"],
  };

  const coverImageType = "cover image";
  const selectedCoverRatios = uploadConfig[coverImageType] || [];
  const coverImageLabel = coverImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicCoverDescription = `Supports ${selectedCoverRatios.join(", ")} aspect ratios`;

  const broadcastImageType = "broadcast images";
  const selectedBroadcastRatios = uploadConfig[broadcastImageType] || [];
  const broadcastImageLabel = broadcastImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicBroadcastDescription = `Supports ${selectedBroadcastRatios.join(", ")} aspect ratios`;

  const updateFormData = (key, files) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), ...files],
    }));
  };

  const handleCroppedImages = (validImages, type = "cover") => {
    if (!validImages || validImages.length === 0) {
      toast.error(`No valid ${type} image${["cover", "broadcast"].includes(type) ? "" : "s"} selected.`);
      return;
    }

    validImages.forEach((img) => {
      const formattedRatio = img.ratio.replace(":", "_by_");
      const prefix = type === "cover" ? "cover_image" : "broadcast_images";
      const key = `${prefix}_${formattedRatio}`;
      updateFormData(key, [
        {
          file: img.file,
          name: img.file.name,
          preview: URL.createObjectURL(img.file),
          ratio: img.ratio,
          id: `${key}-${Date.now()}-${Math.random()}`,
        },
      ]);
    });

    if (type === "cover") {
      setShowCoverUploader(false);
    } else {
      setShowBroadcastUploader(false);
    }
  };

  const handleBroadcastCroppedImages = (validImages, videoFiles = [], type = "cover") => {
    if (videoFiles && videoFiles.length > 0) {
      videoFiles.forEach((video) => {
        const formattedRatio = video.ratio.replace(":", "_by_");
        const prefix = type === "cover" ? "cover_image" : "broadcast_images";
        const key = `${prefix}_${formattedRatio}`;

        updateFormData(key, [
          {
            file: video.file,
            name: video.file.name,
            preview: URL.createObjectURL(video.file),
            ratio: video.ratio,
            type: "video",
            id: `${key}-${Date.now()}-${Math.random()}`,
          },
        ]);
      });

      if (type === "cover") {
        setShowCoverUploader(false);
      } else {
        setShowBroadcastUploader(false);
      }
      return;
    }

    if (!validImages || validImages.length === 0) {
      toast.error(`No valid ${type} files selected.`);
      return;
    }

    validImages.forEach((img) => {
      const formattedRatio = img.ratio.replace(":", "_by_");
      const prefix = type === "cover" ? "cover_image" : "broadcast_images";
      const key = `${prefix}_${formattedRatio}`;
      updateFormData(key, [
        {
          file: img.file,
          name: img.file.name,
          preview: URL.createObjectURL(img.file),
          ratio: img.ratio,
          type: "image",
          id: `${key}-${Date.now()}-${Math.random()}`,
        },
      ]);
    });

    if (type === "cover") {
      setShowCoverUploader(false);
    } else {
      setShowBroadcastUploader(false);
    }
  };

  const handleImageRemoval = (key, index) => {
    setFormData((prev) => {
      const updatedArray = (prev[key] || []).filter((_, i) => i !== index);
      return {
        ...prev,
        [key]: updatedArray.length > 0 ? updatedArray : [],
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = (formData) => {
    const errors = [];

    if (!formData.notice_heading) {
      errors.push("Title is required.");
      return errors;
    }
    if (!formData.expire_date) {
      errors.push("End date is required.");
      return errors;
    }
    if (!formData.expire_time) {
      errors.push("End time is required.");
      return errors;
    }
    if (!formData.notice_text) {
      errors.push("Description is required.");
      return errors;
    }
    if (formData.notice_text.length > 255) {
      errors.push("Description cannot exceed 255 characters.");
      return errors;
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.dismiss();

    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append("noticeboard[notice_heading]", formData.notice_heading);
    data.append("noticeboard[expire_time]", `${formData.expire_date}T${formData.expire_time}`);
    data.append("noticeboard[notice_text]", formData.notice_text);
    data.append("noticeboard[shared]", formData.shared === "all" ? "2" : "1");
    data.append("noticeboard[of_phase]", formData.of_phase);
    data.append("noticeboard[of_atype]", formData.of_atype);
    data.append("noticeboard[of_atype_id]", localStorage.getItem("selectedSiteId") || "");
    data.append("noticeboard[publish]", formData.publish);
    data.append("noticeboard[is_important]", formData.is_important ? "1" : "0");

    if (formData.shared === "individual" && formData.user_ids.length > 0) {
      data.append("noticeboard[swusers]", formData.user_ids.join(","));
    }

    if (formData.shared === "group" && formData.group_id.length > 0) {
      data.append("noticeboard[group_id]", formData.group_id.join(","));
    }

    // For coverImageRatios
    coverImageRatios.forEach(({ key }) => {
      const images = formData[key];
      if (Array.isArray(images) && images.length > 0) {
        const img = images[0];
        if (img?.file instanceof File) {
          data.append(`noticeboard[${key}]`, img.file);
        }
      }
    });

    // For broadcastImageRatios
    broadcastImageRatios.forEach(({ key }) => {
      const images = formData[key];
      if (Array.isArray(images) && images.length > 0) {
        images.forEach((img) => {
          if (img?.file instanceof File) {
            data.append(`noticeboard[files_attached][]`, img.file);
          }
        });
      }
    });

    try {
      const response = await axios.post(`${baseURL}noticeboards.json`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Broadcast created successfully!");
      navigate("/maintenance/noticeboard-list");
    } catch (error) {
      console.error("Error submitting the form:", error);
      if (error.response && error.response.data) {
        toast.error(`Error: ${error.response.data.message || "Submission failed"}`);
      } else {
        toast.error("Failed to submit the form. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${baseURL}users/get_users.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });
        setUsers(response?.data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [baseURL]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${baseURL}projects.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });
        setProjects(response.data.projects || []);
      } catch (error) {
        console.error("Error fetching projects:", error.response?.data || error.message);
      }
    };
    fetchProjects();
  }, [baseURL]);

  const handleCancel = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`${baseURL}usergroups.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });
        const groupsData = Array.isArray(response.data) ? response.data : response.data.usergroups || [];
        setGroups(groupsData);
      } catch (error) {
        console.error("Error fetching Groups:", error);
      }
    };

    if (formData.shared === "group" && groups.length === 0) {
      fetchGroups();
    }
  }, [formData.shared, baseURL, groups.length]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen overflow-y-auto">
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
          <span>Broadcast List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create Broadcast</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CREATE BROADCAST</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        {/* Section: Communication Information */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#E5E0D3' }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#C72030' }}>
                <FileText size={16} color="#fff" />
              </span>
              Communication Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Title */}
              <TextField
                label={<span>Title<span className="text-red-500">*</span></span>}
                placeholder="Title"
                value={formData.notice_heading}
                onChange={handleChange}
                name="notice_heading"
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
              />

              {/* End Date */}
              <TextField
                label={<span>End Date<span className="text-red-500">*</span></span>}
                type="date"
                value={formData.expire_date}
                onChange={handleChange}
                name="expire_date"
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
                inputProps={{
                  min: new Date().toISOString().split("T")[0],
                }}
              />

              {/* End Time */}
              <TextField
                label={<span>End Time<span className="text-red-500">*</span></span>}
                type="time"
                value={formData.expire_time}
                onChange={handleChange}
                name="expire_time"
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
              />

              {/* Description */}
              <div className="md:col-span-3 relative">
                <TextField
                  label={<span>Description<span className="text-red-500">*</span></span>}
                  placeholder="Enter Description"
                  value={formData.notice_text}
                  onChange={handleChange}
                  name="notice_text"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      minHeight: '100px',
                      alignItems: 'flex-start',
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
                  }}
                />
                <span className="absolute bottom-2 right-3 text-xs" style={{ color: formData.notice_text.length > 255 ? 'red' : 'gray' }}>
                  {formData.notice_text.length}/255
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Broadcast Settings */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#E5E0D3' }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#C72030' }}>
                <FileText size={16} color="#fff" />
              </span>
              Broadcast Settings
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Share With */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Share with</label>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="shared"
                    value="all"
                    checked={formData.shared === "all"}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        shared: "all",
                        user_ids: [],
                        group_id: [],
                      }))
                    }
                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                  />
                  <span className="ml-2 text-sm text-gray-700">All</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="shared"
                    value="individual"
                    checked={formData.shared === "individual"}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        shared: "individual",
                        group_id: [],
                      }))
                    }
                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Individuals</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="shared"
                    value="group"
                    checked={formData.shared === "group"}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        shared: "group",
                        user_ids: [],
                      }))
                    }
                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Groups</span>
                </label>
              </div>
            </div>

            {/* Individual Select */}
            {formData.shared === "individual" && (
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Individuals</label>
                <MultiSelectBox
                  placeholder="Select Users"
                  options={users.map((user) => ({
                    value: user.id,
                    label: user.full_name || `${user.firstname} ${user.lastname}`,
                  }))}
                  value={
                    formData.user_ids.length > 0
                      ? formData.user_ids.map((id) => {
                          const user = users.find((u) => u.id.toString() === id.toString());
                          return {
                            value: id,
                            label: user?.full_name || `${user?.firstname} ${user?.lastname}`,
                          };
                        })
                      : []
                  }
                  onChange={(selectedOptions) =>
                    setFormData((prev) => ({
                      ...prev,
                      user_ids: selectedOptions.map((option) => option.value),
                    }))
                  }
                />
              </div>
            )}

            {/* Group Select */}
            {formData.shared === "group" && (
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Groups</label>
                <MultiSelectBox
                  placeholder="Select Groups"
                  options={groups.map((group) => ({
                    value: group.id,
                    label: group.name,
                  }))}
                  value={
                    formData.group_id.length > 0
                      ? formData.group_id.map((id) => {
                          const group = groups.find((g) => g.id === id || g.id.toString() === id.toString());
                          return group ? { value: group.id, label: group.name } : null;
                        }).filter(Boolean)
                      : []
                  }
                  onChange={(selectedOptions) =>
                    setFormData((prev) => ({
                      ...prev,
                      group_id: selectedOptions.map((option) => option.value),
                    }))
                  }
                />
              </div>
            )}

            {/* Mark as Important */}
            <div>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_important}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_important: e.target.checked,
                      }))
                    }
                    sx={{
                      '&.Mui-checked': {
                        color: '#C72030',
                      },
                    }}
                  />
                }
                label="Mark as Important"
              />
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#E5E0D3' }}>
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#C72030' }}>
                <FileText size={16} color="#fff" />
              </span>
              Attachments
            </h3>
          </div>
          
          <div className="p-6">
            {/* Broadcast Cover Image */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-base font-semibold">
                  Broadcast Cover Image{" "}
                  <span
                    className="relative inline-block cursor-help"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <span className="text-blue-500">[i]</span>
                    {showTooltip && (
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                        Max Upload Size 3 MB and Required ratio is 16:9
                      </span>
                    )}
                  </span>
                </h5>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                  type="button"
                  onClick={() => setShowCoverUploader(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"></path>
                  </svg>
                  <span>Add</span>
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table className="border-separate">
                  <TableHeader>
                    <TableRow className="hover:bg-gray-50" style={{ backgroundColor: "#e6e2d8" }}>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>File Name</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>Preview</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>Ratio</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4" style={{ borderColor: "#fff" }}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coverImageRatios.flatMap(({ key, label }) => {
                      const files = Array.isArray(formData[key]) ? formData[key] : formData[key] ? [formData[key]] : [];
                      if (files.length === 0) return [];

                      return files.map((file, index) => (
                        <TableRow key={`${key}-${file.id || index}`} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="py-3 px-4 font-medium">{file.name || `Image ${index + 1}`}</TableCell>
                          <TableCell className="py-3 px-4">
                            <img
                              style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                              className="rounded border border-gray-200"
                              src={file.preview}
                              alt={file.name}
                            />
                          </TableCell>
                          <TableCell className="py-3 px-4">{file.ratio || label}</TableCell>
                          <TableCell className="py-3 px-4">
                            <button
                              type="button"
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              onClick={() => handleImageRemoval(key, index)}
                            >
                              ×
                            </button>
                          </TableCell>
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Broadcast Attachment */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-base font-semibold">
                  Broadcast Attachment{" "}
                  <span
                    className="relative inline-block cursor-help"
                    onMouseEnter={() => setShowAttachmentTooltip(true)}
                    onMouseLeave={() => setShowAttachmentTooltip(false)}
                  >
                    <span className="text-blue-500">[i]</span>
                    {showAttachmentTooltip && (
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                        Max Upload Size 3 MB (Images), 10 MB (Videos)
                      </span>
                    )}
                  </span>
                </h5>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                  type="button"
                  onClick={() => setShowBroadcastUploader(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"></path>
                  </svg>
                  <span>Add</span>
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table className="border-separate">
                  <TableHeader>
                    <TableRow className="hover:bg-gray-50" style={{ backgroundColor: "#e6e2d8" }}>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>File Name</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>Preview</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>Ratio</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4" style={{ borderColor: "#fff" }}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcastImageRatios.map(({ key, label }) =>
                      (formData[key] || []).length > 0
                        ? formData[key].map((file, index) => {
                            const isVideo = file.type === "video" || (file.file && file.file.type.startsWith("video/"));
                            return (
                              <TableRow key={`${key}-${file.id}`} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="py-3 px-4 font-medium">{file.name || "Unnamed File"}</TableCell>
                                <TableCell className="py-3 px-4">
                                  {isVideo ? (
                                    <video controls style={{ maxWidth: 100, maxHeight: 100 }} className="rounded border border-gray-200">
                                      <source src={file.preview} type={file.file?.type || "video/mp4"} />
                                    </video>
                                  ) : (
                                    <img
                                      style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                      className="rounded border border-gray-200"
                                      src={file.preview}
                                      alt={file.name}
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">{file.ratio || label}</TableCell>
                                <TableCell className="py-3 px-4">
                                  <button
                                    type="button"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleImageRemoval(key, index)}
                                  >
                                    ×
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        : null
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Modals */}
      {showCoverUploader && (
        <ProjectBannerUpload
          onClose={() => setShowCoverUploader(false)}
          includeInvalidRatios={false}
          selectedRatioProp={selectedCoverRatios}
          showAsModal={true}
          label={coverImageLabel}
          description={dynamicCoverDescription}
          onContinue={(validImages) => handleCroppedImages(validImages, "cover")}
        />
      )}

      {showBroadcastUploader && (
        <ProjectImageVideoUpload
          onClose={() => setShowBroadcastUploader(false)}
          includeInvalidRatios={false}
          selectedRatioProp={selectedBroadcastRatios}
          showAsModal={true}
          label={broadcastImageLabel}
          description={dynamicBroadcastDescription}
          onContinue={(validImages, videoFiles) =>
            handleBroadcastCroppedImages(validImages, videoFiles, "broadcast")
          }
          allowVideos={true}
        />
      )}
    </div>
  );
};

export default BroadcastCreate;
