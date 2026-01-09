import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import MultiSelectBox from "../components/ui/multi-selector";
import SelectBox from "@/components/ui/select-box";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
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
    shared: "0",
    group_id: [],
    user_ids: [],
    is_important: false,
    email_trigger_enabled: false,
    active: true,
    publish: "1",
    notice_type: "General",
    project_id: "",
    flag_expire: false,
    deny: false,
    IsDelete: false,
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

    // Prepare FormData for file uploads
    const data = new FormData();
    
    // Basic fields
    data.append("noticeboard[notice_heading]", formData.notice_heading);
    data.append("noticeboard[notice_text]", formData.notice_text);
    data.append("noticeboard[active]", formData.active ? "1" : "0");
    data.append("noticeboard[IsDelete]", formData.IsDelete ? "1" : "0");
    data.append("noticeboard[notice_type]", formData.notice_type || "General");
    data.append("noticeboard[publish]", formData.publish);
    data.append("noticeboard[flag_expire]", formData.flag_expire ? "1" : "0");
    data.append("noticeboard[is_important]", formData.is_important ? "1" : "0");
    data.append("noticeboard[email_trigger_enabled]", formData.email_trigger_enabled ? "1" : "0");
    data.append("noticeboard[deny]", formData.deny ? "1" : "0");

    // Project ID
    if (selectedProjectId) {
      data.append("noticeboard[project_id]", selectedProjectId);
    }

    // Expire time
    if (formData.expire_date && formData.expire_time) {
      data.append("noticeboard[expire_time]", `${formData.expire_date}T${formData.expire_time}`);
    }

    // Shared logic: 0 for all, 1 for individuals/groups
    if (formData.shared === "0") {
      // All users
      data.append("noticeboard[shared]", "0");
    } else if (formData.shared === "1" && formData.user_ids.length > 0) {
      // Individuals
      data.append("noticeboard[shared]", "1");
      formData.user_ids.forEach((userId) => {
        data.append("noticeboard[cpusers][]", userId.toString());
      });
    } else if (formData.shared === "2" && formData.group_id.length > 0) {
      // Groups
      data.append("noticeboard[shared]", "1");
      formData.group_id.forEach((groupId) => {
        data.append("noticeboard[cp_group_id][]", groupId.toString());
      });
    }

    // Cover image (single image)
    coverImageRatios.forEach(({ key }) => {
      const images = formData[key];
      if (Array.isArray(images) && images.length > 0) {
        const img = images[0];
        if (img?.file instanceof File) {
          data.append("noticeboard[image]", img.file);
        }
      }
    });

    // Broadcast images (multiple files)
    broadcastImageRatios.forEach(({ key }) => {
      const images = formData[key];
      if (Array.isArray(images) && images.length > 0) {
        images.forEach((img) => {
          if (img?.file instanceof File) {
            data.append("noticeboard[files_attached][]", img.file);
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
        const response = await axios.get(`${baseURL}/crm/admin/noticeboards/${id}.json`, {
          headers: {
                   Authorization: getAuthHeader(),
                   "Content-Type": "multipart/form-data",
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

        // Map shared value: API returns 0 for all, 1 for individuals/groups
        let sharedValue = "0";
        if (noticeboard.shared === 1 || noticeboard.shared === "1") {
          // Check if it's individuals or groups based on ppusers or group_id
          if (noticeboard.ppusers && noticeboard.ppusers.length > 0) {
            sharedValue = "1"; // Individuals
          } else if (noticeboard.group_id) {
            sharedValue = "2"; // Groups
          }
        }

        setFormData({
          notice_heading: noticeboard.notice_heading || "",
          notice_text: noticeboard.notice_text || "",
          expire_time: expireTime,
          expire_date: expireDate,
          shared: sharedValue,
          group_id: noticeboard.group_id ? (Array.isArray(noticeboard.group_id) ? noticeboard.group_id : [noticeboard.group_id]) : [],
          user_ids: noticeboard.ppusers ? (Array.isArray(noticeboard.ppusers) ? noticeboard.ppusers.map(Number) : [Number(noticeboard.ppusers)]) : [],
          is_important: noticeboard.is_important === "1" || noticeboard.is_important === 1 || noticeboard.is_important === true,
          email_trigger_enabled: noticeboard.email_trigger_enabled === "1" || noticeboard.email_trigger_enabled === 1 || noticeboard.email_trigger_enabled === true,
          active: noticeboard.active === "1" || noticeboard.active === 1 || noticeboard.active === true,
          publish: noticeboard.publish ? noticeboard.publish.toString() : "1",
          notice_type: noticeboard.notice_type || "General",
          project_id: noticeboard.project_id || "",
          flag_expire: noticeboard.flag_expire === "1" || noticeboard.flag_expire === 1 || noticeboard.flag_expire === true,
          deny: noticeboard.deny === "1" || noticeboard.deny === 1 || noticeboard.deny === true,
          IsDelete: noticeboard.IsDelete === "1" || noticeboard.IsDelete === 1 || noticeboard.IsDelete === true,
          cover_image_1_by_1: [],
          cover_image_9_by_16: [],
          cover_image_3_by_2: [],
          cover_image_16_by_9: [],
          broadcast_images_1_by_1: [],
          broadcast_images_9_by_16: [],
          broadcast_images_3_by_2: [],
          broadcast_images_16_by_9: [],
        });

        if (noticeboard.project_id) {
          setSelectedProjectId(noticeboard.project_id.toString());
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
        const response = await axios.get(`${baseURL}/crm/usergroups/get_members_list.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });
        setUsers(response?.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [baseURL]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${baseURL}/projects_for_dropdown.json`, {
           headers: {
                                            Authorization: getAuthHeader(),
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

    if (formData.shared === "2" && groups.length === 0) {
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
                    setFormData((prev) => ({ ...prev, project_id: e.target.value }));
                  }}
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
                  value={formData.active ? "active" : "inactive"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.value === "active" }))}
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
                      checked={formData.email_trigger_enabled === true}
                      onChange={() => setFormData((prev) => ({ ...prev, email_trigger_enabled: true }))}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="email_trigger_enabled"
                      value="no"
                      checked={formData.email_trigger_enabled === false}
                      onChange={() => setFormData((prev) => ({ ...prev, email_trigger_enabled: false }))}
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
                      value="0"
                      checked={formData.shared === "0"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">All</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="shared"
                      value="1"
                      checked={formData.shared === "1"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Individuals</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="shared"
                      value="2"
                      checked={formData.shared === "2"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Groups</span>
                  </label>
                </div>

                {/* Conditional Individual Dropdown */}
                {formData.shared === "1" && (
                  <div className="mt-4">
                    <MultiSelectBox
                      options={users.map((member) => ({
                        value: member.id,
                        label: `${member.user?.firstname || ''} ${member.user?.lastname || ''}`.trim(),
                      }))}
                      value={formData.user_ids}
                      onChange={(selectedIds) =>
                        setFormData({ ...formData, user_ids: selectedIds })
                      }
                      placeholder="Select Individuals"
                    />
                  </div>
                )}

                {/* Conditional Group Dropdown */}
                {formData.shared === "2" && (
                  <div className="mt-4">
                    <MultiSelectBox
                      options={groups.map((group) => ({
                        value: group.id,
                        label: group.name,
                      }))}
                      value={formData.group_id}
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
                <input
                  type="file"
                  id="editCoverImageInput"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    
                    const validFiles = files.filter(file => {
                      const maxSize = 3 * 1024 * 1024; // 3MB
                      if (file.size > maxSize) {
                        toast.error(`${file.name} exceeds 3MB limit`);
                        return false;
                      }
                      return true;
                    });

                    if (validFiles.length > 0) {
                      const key = 'cover_image_1_by_1';
                      const newFiles = validFiles.map(file => ({
                        file,
                        name: file.name,
                        preview: URL.createObjectURL(file),
                        ratio: '1:1',
                        id: `${key}-${Date.now()}-${Math.random()}`,
                      }));
                      updateFormData(key, newFiles);
                      toast.success(`${validFiles.length} image(s) uploaded`);
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('editCoverImageInput')?.click()}
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
                <input
                  type="file"
                  id="editBroadcastAttachmentInput"
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    
                    const validFiles = files.filter(file => {
                      const isVideo = file.type.startsWith('video/');
                      const isDocument = file.type === 'application/pdf' || 
                                       file.type.includes('document') || 
                                       file.type.includes('word') || 
                                       file.type.includes('excel') || 
                                       file.type.includes('text');
                      const maxSize = isVideo ? 10 * 1024 * 1024 : (isDocument ? 10 * 1024 * 1024 : 3 * 1024 * 1024);
                      
                      if (file.size > maxSize) {
                        const sizeMB = Math.round(maxSize / (1024 * 1024));
                        toast.error(`${file.name} exceeds ${sizeMB}MB limit`);
                        return false;
                      }
                      return true;
                    });

                    if (validFiles.length > 0) {
                      const key = 'broadcast_images_1_by_1';
                      const newFiles = validFiles.map(file => {
                        const isVideo = file.type.startsWith('video/');
                        const isImage = file.type.startsWith('image/');
                        return {
                          file,
                          name: file.name,
                          preview: isImage || isVideo ? URL.createObjectURL(file) : null,
                          ratio: '1:1',
                          type: isVideo ? 'video' : (isImage ? 'image' : 'document'),
                          id: `${key}-${Date.now()}-${Math.random()}`,
                        };
                      });
                      updateFormData(key, newFiles);
                      toast.success(`${validFiles.length} file(s) uploaded`);
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('editBroadcastAttachmentInput')?.click()}
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
                              {img.type === "document" || (!img.type && !img.preview) ? (
                                <div className="flex items-center justify-center w-16 h-16">
                                  <FileText className="w-8 h-8 text-[#C72030]" />
                                </div>
                              ) : img.type === "video" ? (
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
