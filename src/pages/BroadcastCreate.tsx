import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
        {/* <h1 className="text-2xl font-bold text-gray-900">CREATE BROADCAST</h1> */}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        {/* Section: Communication Information */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <FileText size={16} color="#C72030" />
              </span>
              Create Broadcast
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
                  onChange={(e) => setSelectedProjectId(e.target.value)}
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
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="announcement">Announcement</MenuItem>
                  <MenuItem value="event">Event</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
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
                      value="true"
                      checked={formData.email_trigger_enabled === "true"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email_trigger_enabled: e.target.value,
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
                      value="false"
                      checked={formData.email_trigger_enabled === "false"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email_trigger_enabled: e.target.value,
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
                      name="status"
                      value="active"
                      checked={formData.status === "active"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value,
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
                      name="status"
                      value="inactive"
                      checked={formData.status === "inactive"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value,
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
                      style={{ accentColor: '#C72030' }}
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
                      style={{ accentColor: '#C72030' }}
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
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Groups</span>
                  </label>
                </div>

                {/* Individual Select */}
                {formData.shared === "individual" && (
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
                          user_ids: e.target.value,
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
                            const user = users.find((u) => u.id.toString() === id.toString());
                            return user?.full_name || `${user?.firstname} ${user?.lastname}`;
                          })
                          .join(", ");
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select Users
                      </MenuItem>
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.full_name || `${user.firstname} ${user.lastname}`}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                )}

                {/* Group Select */}
                {formData.shared === "group" && (
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
                          group_id: e.target.value,
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
                  className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-[45px] px-4 text-sm font-medium rounded-md flex items-center gap-2"
                  type="button"
                  onClick={() => setShowCoverUploader(true)}
                >
                  {/* <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"></path>
                  </svg> */}
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
                              // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
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
                  className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-[45px] px-4 text-sm font-medium rounded-md flex items-center gap-2"
                  type="button"
                  onClick={() => setShowBroadcastUploader(true)}
                >
                  {/* <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"></path>
                  </svg> */}
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
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
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

export default BroadcastCreate;
