import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import MultiSelectBox from "../../components/ui/multi-selector";
import SelectBox from "@/components/ui/select-box";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import ProjectBannerUpload from "../../components/reusable/ProjectBannerUpload";
import ProjectImageVideoUpload from "../../components/reusable/ProjectImageVideoUpload";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

const NoticePageCreate = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    notice_heading: "",
    notice_text: "",
    expire_time: "",
    expire_date: "",
    shared: "",
    group_id: [],
    user_ids: [],
    is_important: "",
    email_trigger_enabled: "",
    active: "",
    publish: "",
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
    attached_files: [],
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
      const response = await axios.post(`${baseURL}/crm/admin/noticeboards.json`, data, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Notice created successfully!");
      navigate("/communication/notice");
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
        const response = await axios.get(`${baseURL}/usergroups/cp_members_list.json`, {
          headers: {
            Authorization: getAuthHeader(),
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
        const response = await axios.get(`${baseURL}/crm/usergroups.json`, {
          headers: {
            Authorization: getAuthHeader(),
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
          <span>Notice List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create Notice</span>
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
              Create Notice
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

              {/* Title */}
              <TextField
                label={<span>Notice Heading<span className="text-red-500"></span></span>}
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

              {/* Notice Type */}
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Notice Type</InputLabel>
                <MuiSelect
                  value={formData.notice_type || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notice_type: e.target.value }))}
                  label="Notice Type"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="General ">General </MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                  <MenuItem value="Announcement">Announcement</MenuItem>
                  <MenuItem value="Event">Event</MenuItem>
                </MuiSelect>
              </FormControl>

              {/* Description spanning 2 columns */}
              <div className="md:col-span-2">
                <TextField
                  label={<span>Notice Description<span className="text-red-500">*</span></span>}
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

              {/* Broadcast From */}
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
              {/* Broadcast To */}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Mark Important</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_important"
                      checked={formData.is_important === true}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          is_important: true,
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_important"
                      checked={formData.is_important === false}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          is_important: false,
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Send Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send Email</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="email_trigger_enabled"
                      checked={formData.email_trigger_enabled === true}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          email_trigger_enabled: true,
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="email_trigger_enabled"
                      checked={formData.email_trigger_enabled === false}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          email_trigger_enabled: false,
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="active"
                      checked={formData.active === true}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          active: true,
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="active"
                      checked={formData.active === false}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          active: false,
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

           

            {/* Share With */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Share With</label>
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shared"
                      value="0"
                      checked={formData.shared === "0"}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          shared: "0",
                          user_ids: [],
                          group_id: [],
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">All</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shared"
                      value="1"
                      checked={formData.shared === "1"}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          shared: "1",
                          group_id: [],
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Individuals</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shared"
                      value="2"
                      checked={formData.shared === "2"}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          shared: "2",
                          user_ids: [],
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Groups</span>
                  </label>
                </div>

                {/* Individual Select */}
                {formData.shared === "1" && (
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiInputBase-root': fieldStyles }}
                  >
                    <InputLabel shrink>Select Users</InputLabel>
                    <MuiSelect
                      multiple
                      value={formData.user_ids}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          user_ids: Array.isArray(e.target.value) ? e.target.value : [],
                        }))
                      }
                      label="Select Users"
                      notched
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected || selected.length === 0) {
                          return <span style={{ color: '#999' }}>Select Users</span>;
                        }
                        return selected
                          .map((id) => {
                            const member = users.find((u) => u.id.toString() === id.toString());
                            return member ? `${member.firstname || ''} ${member.lastname || ''}`.trim() : '';
                          })
                          .filter(Boolean)
                          .join(", ");
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select Users
                      </MenuItem>
                      {users.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          {`${member.firstname || ''} ${member.lastname || ''}`.trim()}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                )}

                {/* Group Select */}
                {formData.shared === "2" && (
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiInputBase-root': fieldStyles }}
                  >
                    <InputLabel shrink>Select Groups</InputLabel>
                    <MuiSelect
                      multiple
                      value={Array.isArray(formData.group_id) ? formData.group_id : []}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          group_id: Array.isArray(e.target.value) ? e.target.value : [],
                        }))
                      }
                      label="Select Groups"
                      notched
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected || selected.length === 0) {
                          return <span style={{ color: '#999' }}>Select Groups</span>;
                        }
                        return selected
                          .map((id) => {
                            const group = groups.find((g) => g.id === id || g.id.toString() === id.toString());
                            return group ? group.name : id;
                          })
                          .join(", ");
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select Groups
                      </MenuItem>
                      {groups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
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
            {/* Notice Cover Image */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-base font-semibold">
                  Notice Cover Image{" "}
                </h5>
                <input
                  type="file"
                  id="coverImageInput"
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
                      // Add to first available ratio (1:1 by default)
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
                  className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-[45px] px-4 text-sm font-medium rounded-md flex items-center gap-2"
                  type="button"
                  onClick={() => document.getElementById('coverImageInput')?.click()}
                >
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
                              onClick={() => handleImageRemoval(key, index)}
                            >
                              <Trash2 className="w-4 h-4 text-[#c72030]" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Notice Attachment */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-base font-semibold">
                  Notice Attachment{" "}
                </h5>
                <input
                  type="file"
                  id="noticeAttachmentInput"
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
                  className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-[45px] px-4 text-sm font-medium rounded-md flex items-center gap-2"
                  type="button"
                  onClick={() => document.getElementById('noticeAttachmentInput')?.click()}
                >
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
                            const isDocument = file.type === "document" || (!isVideo && !file.preview);
                            return (
                              <TableRow key={`${key}-${file.id}`} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="py-3 px-4 font-medium">{file.name || "Unnamed File"}</TableCell>
                                <TableCell className="py-3 px-4">
                                  {isDocument ? (
                                    <div className="flex items-center justify-center" style={{ width: 100, height: 100 }}>
                                      <FileText className="w-12 h-12 text-[#C72030]" />
                                    </div>
                                  ) : isVideo ? (
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
                                    onClick={() => handleImageRemoval(key, index)}
                                  >
                                     <Trash2 className="w-4 h-4 text-[#c72030]" />
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

export default NoticePageCreate;
