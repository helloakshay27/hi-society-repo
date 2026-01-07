import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
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

const NoticeboardEdit = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const { id } = useParams();
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
    status: "active",
    publish: "1",
    of_phase: "pms",
    of_atype: "Pms::Site",
    notice_type: "",
    from_time: "",
    to_time: "",
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
    data.append("noticeboard[publish]", formData.status === "active" ? "1" : "0");
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
      const response = await axios.put(`${baseURL}noticeboards/${id}.json`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Broadcast updated successfully!");
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

  // Fetch noticeboard data
  useEffect(() => {
    const fetchNoticeboard = async () => {
      try {
        const response = await axios.get(`${baseURL}noticeboards/${id}.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });
        
        const noticeboard = response.data.noticeboard || response.data;
        
        // Extract date and time from expire_time
        let expireDate = "";
        let expireTime = "";
        if (noticeboard.expire_time) {
          const dateObj = new Date(noticeboard.expire_time);
          expireDate = dateObj.toISOString().split('T')[0];
          expireTime = dateObj.toTimeString().slice(0, 5);
        }

        setFormData({
          notice_heading: noticeboard.notice_heading || "",
          notice_text: noticeboard.notice_text || "",
          expire_time: expireTime,
          expire_date: expireDate,
          shared: noticeboard.shared === "2" || noticeboard.shared === 2 ? "all" : 
                  noticeboard.shared === "1" || noticeboard.shared === 1 ? "individual" : "all",
          group_id: noticeboard.group_id ? (Array.isArray(noticeboard.group_id) ? noticeboard.group_id : [noticeboard.group_id]) : [],
          user_ids: noticeboard.swusers ? (typeof noticeboard.swusers === 'string' ? noticeboard.swusers.split(',').map(Number) : noticeboard.swusers) : [],
          is_important: noticeboard.is_important === "1" || noticeboard.is_important === 1 || noticeboard.is_important === true,
          email_trigger_enabled: noticeboard.email_trigger_enabled || "",
          status: noticeboard.publish === "1" || noticeboard.publish === 1 ? "active" : "inactive",
          publish: noticeboard.publish || "1",
          of_phase: noticeboard.of_phase || "pms",
          of_atype: noticeboard.of_atype || "Pms::Site",
          notice_type: noticeboard.notice_type || "",
          from_time: noticeboard.from_time || "",
          to_time: noticeboard.to_time || "",
          cover_image_1_by_1: [],
          cover_image_9_by_16: [],
          cover_image_3_by_2: [],
          cover_image_16_by_9: [],
          broadcast_images_1_by_1: [],
          broadcast_images_9_by_16: [],
          broadcast_images_3_by_2: [],
          broadcast_images_16_by_9: [],
        });

        if (noticeboard.of_atype_id) {
          setSelectedProjectId(noticeboard.of_atype_id);
        }

      } catch (error) {
        console.error("Error fetching noticeboard:", error);
        toast.error("Failed to fetch broadcast details");
      }
    };

    if (id) {
      fetchNoticeboard();
    }
  }, [id, baseURL]);

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
          <span className="text-gray-900 font-medium">Edit Broadcast</span>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        {/* Section: Communication Information */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <FileText size={16} color="#C72030" />
              </span>
              Edit Broadcast
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Project Select */}
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Project</InputLabel>
                <MuiSelect
                  value={selectedProjectId || ""}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                  }}
                  label="Project"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Project</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.project_name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Notice Heading */}
              <TextField
                label={<span>Notice Heading<span className="text-red-500">*</span></span>}
                placeholder="Enter Title"
                value={formData.notice_heading}
                onChange={handleChange}
                name="notice_heading"
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
              />

              {/* Status */}
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Status</InputLabel>
                <MuiSelect
                  value={formData.status}
                  onChange={handleChange}
                  name="status"
                  label="Status"
                  notched
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </MuiSelect>
              </FormControl>

              {/* Notice Text */}
              <div className="md:col-span-2">
                <TextField
                  label={<span>Notice Text<span className="text-red-500">*</span></span>}
                  placeholder="Enter Description"
                  value={formData.notice_text}
                  onChange={handleChange}
                  name="notice_text"
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
              </div>

              {/* Expire Date */}
              <TextField
                label={<span>Expire Date<span className="text-red-500">*</span></span>}
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
            </div>

            {/* 4-column grid for Broadcast To, Mark Important, Send Email, End Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Expire Time */}
               <TextField
                label={<span>Expire Time<span className="text-red-500">*</span></span>}
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

              {/* Mark Important */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mark Important
                </label>
                <div className="flex items-center space-x-4 h-[45px]">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="is_important"
                      value="yes"
                      checked={formData.is_important === true}
                      onChange={() =>
                        setFormData({ ...formData, is_important: true })
                      }
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="is_important"
                      value="no"
                      checked={formData.is_important === false}
                      onChange={() =>
                        setFormData({ ...formData, is_important: false })
                      }
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Send Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Email
                </label>
                <div className="flex items-center space-x-4 h-[45px]">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="email_trigger_enabled"
                      value="yes"
                      checked={formData.email_trigger_enabled === "yes"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="email_trigger_enabled"
                      value="no"
                      checked={formData.email_trigger_enabled === "no"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Broadcast To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Broadcast To
                </label>
                <div className="flex items-center space-x-4 h-[45px]">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="shared"
                      value="all"
                      checked={formData.shared === "all"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">All</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Share With */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Share With
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="shared"
                      value="all"
                      checked={formData.shared === "all"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">All</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="shared"
                      value="individual"
                      checked={formData.shared === "individual"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Individual</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="shared"
                      value="group"
                      checked={formData.shared === "group"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Group</span>
                  </label>
                </div>

                {/* Conditional Individual Dropdown */}
                {formData.shared === "individual" && (
                  <div className="mt-4">
                    <MultiSelectBox
                      options={users.map((user) => ({
                        value: user.id,
                        label: `${user.first_name} ${user.last_name}`,
                      }))}
                      selectedValues={formData.user_ids}
                      onChange={(selectedIds) =>
                        setFormData({ ...formData, user_ids: selectedIds })
                      }
                      placeholder="Select Individuals"
                    />
                  </div>
                )}

                {/* Conditional Group Dropdown */}
                {formData.shared === "group" && (
                  <div className="mt-4">
                    <MultiSelectBox
                      options={groups.map((group) => ({
                        value: group.id,
                        label: group.name,
                      }))}
                      selectedValues={formData.group_id}
                      onChange={(selectedIds) =>
                        setFormData({ ...formData, group_id: selectedIds })
                      }
                      placeholder="Select Groups"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <FileText size={16} color="#C72030" />
              </span>
              Notice Attachments
            </h2>
          </div>
          
          <div className="p-6" style={{ backgroundColor: "#AAB9C50D" }}>
            {/* Broadcast Cover Image */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Broadcast Cover Image
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCoverUploader(true)}
                  className="text-sm text-[#C72030] hover:underline font-medium"
                >
                  + Upload
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16 text-center">Sr. No</TableHead>
                      <TableHead>Aspect Ratio</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead className="w-24 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coverImageRatios.map(({ key, label }, idx) => {
                      const images = formData[key] || [];
                      return images.length > 0 ? (
                        images.map((img, imgIdx) => (
                          <TableRow key={`${key}-${imgIdx}`}>
                            <TableCell className="text-center">{idx + 1}</TableCell>
                            <TableCell>{label}</TableCell>
                            <TableCell>
                              <img
                                src={img.preview}
                                alt={`${label} preview`}
                                className="w-16 h-16 object-cover rounded"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={() => handleImageRemoval(key, imgIdx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : null;
                    })}
                    {coverImageRatios.every(({ key }) => !formData[key] || formData[key].length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          No cover images uploaded
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Broadcast Attachment */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Broadcast Attachment
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBroadcastUploader(true)}
                  className="text-sm text-[#C72030] hover:underline font-medium"
                >
                  + Upload
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16 text-center">Sr. No</TableHead>
                      <TableHead>Aspect Ratio</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead className="w-24 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcastImageRatios.map(({ key, label }, idx) => {
                      const images = formData[key] || [];
                      return images.length > 0 ? (
                        images.map((img, imgIdx) => (
                          <TableRow key={`${key}-${imgIdx}`}>
                            <TableCell className="text-center">
                              {broadcastImageRatios.slice(0, idx).reduce((acc, { key: k }) => acc + (formData[k]?.length || 0), 0) + imgIdx + 1}
                            </TableCell>
                            <TableCell>{label}</TableCell>
                            <TableCell>
                              {img.type === "video" ? (
                                <video
                                  src={img.preview}
                                  className="w-16 h-16 object-cover rounded"
                                  controls={false}
                                />
                              ) : (
                                <img
                                  src={img.preview}
                                  alt={`${label} preview`}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={() => handleImageRemoval(key, imgIdx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : null;
                    })}
                    {broadcastImageRatios.every(({ key }) => !formData[key] || formData[key].length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          No broadcast attachments uploaded
                        </TableCell>
                      </TableRow>
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
            className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
          >
            {loading ? 'Updating...' : 'Update'}
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

export default NoticeboardEdit;
