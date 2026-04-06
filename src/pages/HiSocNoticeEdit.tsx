import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import ProjectBannerUpload from "../components/reusable/ProjectBannerUpload";
import ProjectImageVideoUpload from "../components/reusable/ProjectImageVideoUpload";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";

const HiSocNoticeEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState({
    notice_heading: "",
    notice_text: "",
    expire_time: "",
    expire_date: "",
    shared: "",
    group_id: [] as any[],
    user_ids: [] as any[],
    is_important: "" as boolean | string,
    email_trigger_enabled: "" as boolean | string,
    active: true,
    publish: "",
    notice_type: "General",
    project_id: "",
    flag_expire: false,
    deny: false,
    IsDelete: false,
    cover_image_1_by_1: [] as any[],
    cover_image_9_by_16: [] as any[],
    cover_image_3_by_2: [] as any[],
    cover_image_16_by_9: [] as any[],
    broadcast_images_1_by_1: [] as any[],
    broadcast_images_9_by_16: [] as any[],
    broadcast_images_3_by_2: [] as any[],
    broadcast_images_16_by_9: [] as any[],
    attached_files: [] as any[],
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showCoverUploader, setShowCoverUploader] = useState(false);
  const [showBroadcastUploader, setShowBroadcastUploader] = useState(false);
  const previewUrlsRef = useRef(new Map());

  // Field styles for Material-UI components
  const fieldStyles = {
    height: "45px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    "& .MuiOutlinedInput-root": {
      height: "45px",
      "& fieldset": { borderColor: "#ddd" },
      "&:hover fieldset": { borderColor: "#C72030" },
      "&.Mui-focused fieldset": { borderColor: "#C72030" },
    },
    "& .MuiInputLabel-root": {
      "&.Mui-focused": { color: "#C72030" },
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
  const dynamicBroadcastDescription = `Supports ${selectedBroadcastRatios.join(
    ", "
  )} aspect ratios`;

  // ─── Fetch notice by ID ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchNotice = async () => {
      if (!id) return;
      setFetchingData(true);
      try {
        const response = await axios.get(
          getFullUrl(`/crm/admin/noticeboards/${id}.json`),
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "application/json",
            },
          }
        );

        const notice = response.data?.noticeboard || response.data;

        if (!notice) {
          toast.error("Notice not found.");
          navigate("/bms/hisoc-notice-list");
          return;
        }

        // Parse expire_time into date + time parts
        let expireDate = "";
        let expireTime = "";
        if (notice.expire_time) {
          const dt = new Date(notice.expire_time);
          if (!isNaN(dt.getTime())) {
            expireDate = dt.toISOString().split("T")[0];
            expireTime = dt.toTimeString().slice(0, 5); // HH:MM
          }
        }

        // Determine shared value
        // API: shared=0 => All, shared=1 with group_id => Groups, shared=1 with swusers => Individuals
        let sharedVal = "0";
        let userIds: any[] = [];
        let groupIds: any[] = [];

        if (notice.shared === 0 || notice.shared === "0") {
          sharedVal = "0";
        } else if (notice.shared === 1 || notice.shared === "1") {
          if (notice.group_id && notice.group_id.length > 0) {
            sharedVal = "2";
            groupIds = notice.group_id.map((g: any) =>
              typeof g === "object" ? g.id : g
            );
          } else if (notice.swusers && notice.swusers.length > 0) {
            sharedVal = "1";
            userIds = notice.swusers.map((u: any) =>
              typeof u === "object" ? u.id : u
            );
          } else if (notice.user_ids && notice.user_ids.length > 0) {
            sharedVal = "1";
            userIds = notice.user_ids;
          }
        }

        // Existing cover image
        const existingCoverImages: any[] = [];
        const coverImageUrl =
          notice.image_url ||
          (typeof notice.image === "string" ? notice.image : null) ||
          notice.image?.document_url ||
          null;
        if (coverImageUrl) {
          existingCoverImages.push({
            file: null,
            name: coverImageUrl.split("/").pop() || "cover_image",
            preview: coverImageUrl,
            ratio: "1:1",
            isExisting: true,
            id: `existing-cover-${Date.now()}`,
          });
        }

        // Existing broadcast attachments
        const existingBroadcastImages: any[] = [];
        if (notice.documents && Array.isArray(notice.documents)) {
          notice.documents.forEach((doc: any, idx: number) => {
            const rawUrl =
              typeof doc === "string" ? doc : doc.url || doc.file_url || "";
            const url = typeof rawUrl === "string" ? rawUrl : "";
            const name =
              typeof doc === "object"
                ? doc.name || doc.filename || (url ? url.split("/").pop() : `Attachment ${idx + 1}`)
                : url.split("/").pop();
            const isVideo =
              typeof url === "string" &&
              (url.includes(".mp4") ||
                url.includes(".mov") ||
                url.includes(".avi") ||
                url.includes(".webm"));
            const isDoc =
              typeof url === "string" &&
              (url.includes(".pdf") ||
                url.includes(".doc") ||
                url.includes(".xls") ||
                url.includes(".txt"));
            existingBroadcastImages.push({
              file: null,
              name: name || `Attachment ${idx + 1}`,
              preview: isDoc ? null : url,
              ratio: "1:1",
              type: isVideo ? "video" : isDoc ? "document" : "image",
              isExisting: true,
              id: `existing-broadcast-${idx}-${Date.now()}`,
            });
          });
        }

        setFormData({
          notice_heading: notice.notice_heading || "",
          notice_text: notice.notice_text || "",
          expire_time: expireTime,
          expire_date: expireDate,
          shared: sharedVal,
          group_id: groupIds,
          user_ids: userIds,
          is_important:
            notice.is_important === true ||
            notice.is_important === 1 ||
            notice.is_important === "true"
              ? true
              : notice.is_important === false ||
                notice.is_important === 0 ||
                notice.is_important === "false"
              ? false
              : "",
          email_trigger_enabled:
            notice.email_trigger_enabled === true ||
            notice.email_trigger_enabled === 1 ||
            notice.email_trigger_enabled === "true"
              ? true
              : notice.email_trigger_enabled === false ||
                notice.email_trigger_enabled === 0 ||
                notice.email_trigger_enabled === "false"
              ? false
              : "",
          active: notice.active !== undefined ? notice.active : true,
          publish: notice.publish || "",
          notice_type: notice.notice_type || "General",
          project_id: notice.project_id || "",
          flag_expire: notice.flag_expire || false,
          deny: notice.deny || false,
          IsDelete: notice.IsDelete || false,
          cover_image_1_by_1: existingCoverImages,
          cover_image_9_by_16: [],
          cover_image_3_by_2: [],
          cover_image_16_by_9: [],
          broadcast_images_1_by_1: existingBroadcastImages,
          broadcast_images_9_by_16: [],
          broadcast_images_3_by_2: [],
          broadcast_images_16_by_9: [],
          attached_files: [],
        });

        if (notice.project_id) {
          setSelectedProjectId(String(notice.project_id));
        }
      } catch (error: any) {
        console.error("Error fetching notice:", error);
        toast.error("Failed to load notice data.");
      } finally {
        setFetchingData(false);
      }
    };

    fetchNotice();
  }, [id]);

  // ─── Fetch users ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          getFullUrl("/usergroups/get_members_list.json"),
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "application/json",
            },
          }
        );
        setUsers(response?.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // ─── Fetch projects ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(
          getFullUrl("/projects_for_dropdown.json"),
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "application/json",
            },
          }
        );
        setProjects(response.data.projects || []);
      } catch (error: any) {
        console.error(
          "Error fetching projects:",
          error.response?.data || error.message
        );
      }
    };
    fetchProjects();
  }, []);

  // ─── Fetch groups (only when Groups option selected) ────────────────────────
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(getFullUrl("/crm/usergroups.json"), {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        });
        const groupsData = Array.isArray(response.data)
          ? response.data
          : response.data.usergroups || [];
        setGroups(groupsData);
      } catch (error) {
        console.error("Error fetching Groups:", error);
      }
    };

    if (formData.shared === "2" && groups.length === 0) {
      fetchGroups();
    }
  }, [formData.shared, groups.length]);

  // ─── Image helpers ───────────────────────────────────────────────────────────
  const updateFormData = (key: string, files: any[]) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: [...(prev[key] || []), ...files],
    }));
  };

  const handleCroppedImages = (validImages: any[], type = "cover") => {
    if (!validImages || validImages.length === 0) {
      toast.error(
        `No valid ${type} image${
          ["cover", "broadcast"].includes(type) ? "" : "s"
        } selected.`
      );
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
    if (type === "cover") setShowCoverUploader(false);
    else setShowBroadcastUploader(false);
  };

  const handleBroadcastCroppedImages = (
    validImages: any[],
    videoFiles: any[] = [],
    type = "cover"
  ) => {
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
      if (type === "cover") setShowCoverUploader(false);
      else setShowBroadcastUploader(false);
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
    if (type === "cover") setShowCoverUploader(false);
    else setShowBroadcastUploader(false);
  };

  const handleImageRemoval = (key: string, index: number) => {
    setFormData((prev: any) => {
      const updatedArray = (prev[key] || []).filter(
        (_: any, i: number) => i !== index
      );
      return { ...prev, [key]: updatedArray };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validateForm = (data: typeof formData) => {
    const errors: string[] = [];
    if (!data.notice_heading) {
      errors.push("Title is required.");
      return errors;
    }
    if (!data.expire_date) {
      errors.push("End date is required.");
      return errors;
    }
    if (!data.expire_time) {
      errors.push("End time is required.");
      return errors;
    }
    if (!data.notice_text) {
      errors.push("Description is required.");
      return errors;
    }
    if (data.is_important === "") {
      errors.push("Mark Important is required.");
      return errors;
    }
    if (data.email_trigger_enabled === "") {
      errors.push("Send Email is required.");
      return errors;
    }
    if (!data.shared) {
      errors.push("Share With is required.");
      return errors;
    }
    if (data.shared === "1" && data.user_ids.length === 0) {
      errors.push("Please select at least one user.");
      return errors;
    }
    if (data.shared === "2" && data.group_id.length === 0) {
      errors.push("Please select at least one group.");
      return errors;
    }
    return errors;
  };

  // ─── Submit (PUT) ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
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
    data.append("noticeboard[notice_text]", formData.notice_text);
    data.append("noticeboard[active]", "1");
    data.append("noticeboard[IsDelete]", formData.IsDelete ? "1" : "0");
    data.append("noticeboard[notice_type]", formData.notice_type || "General");
    data.append("noticeboard[publish]", formData.publish);
    data.append("noticeboard[flag_expire]", formData.flag_expire ? "1" : "0");
    data.append(
      "noticeboard[is_important]",
      formData.is_important ? "1" : "0"
    );
    data.append(
      "noticeboard[email_trigger_enabled]",
      formData.email_trigger_enabled ? "1" : "0"
    );
    data.append("noticeboard[deny]", formData.deny ? "1" : "0");

    if (selectedProjectId) {
      data.append("noticeboard[project_id]", selectedProjectId);
    }

    if (formData.expire_date && formData.expire_time) {
      data.append(
        "noticeboard[expire_time]",
        `${formData.expire_date}T${formData.expire_time}`
      );
    }

    if (formData.shared === "0") {
      data.append("noticeboard[shared]", "0");
    } else if (formData.shared === "1" && formData.user_ids.length > 0) {
      data.append("noticeboard[shared]", "1");
      formData.user_ids.forEach((userId: any) => {
        data.append("noticeboard[swusers][]", userId.toString());
      });
    } else if (formData.shared === "2" && formData.group_id.length > 0) {
      data.append("noticeboard[shared]", "1");
      formData.group_id.forEach((groupId: any) => {
        data.append("noticeboard[group_id][]", groupId.toString());
      });
    }

    // Only upload NEW cover images (file !== null)
    coverImageRatios.forEach(({ key }) => {
      const images = (formData as any)[key];
      if (Array.isArray(images) && images.length > 0) {
        const img = images[0];
        if (img?.file instanceof File) {
          data.append("noticeboard[image]", img.file);
        }
      }
    });

    // Only upload NEW broadcast files (file !== null)
    broadcastImageRatios.forEach(({ key }) => {
      const images = (formData as any)[key];
      if (Array.isArray(images) && images.length > 0) {
        images.forEach((img: any) => {
          if (img?.file instanceof File) {
            data.append("noticeboard[documents][]", img.file);
          }
        });
      }
    });

    try {
      await axios.put(
        getFullUrl(`/crm/admin/noticeboards/${id}.json`),
        data,
        {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Notice updated successfully!");
      navigate("/bms/hisoc-notice-list");
    } catch (error: any) {
      console.error("Error updating notice:", error);
      if (error.response && error.response.data) {
        toast.error(
          `Error: ${error.response.data.message || "Update failed"}`
        );
      } else {
        toast.error("Failed to update the notice. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate(-1);

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (fetchingData) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-[#C72030]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-gray-600 text-sm">Loading notice data...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
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
          <span>Notice</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Notice Edit</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Section: Notice Information */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div
            className="px-6 py-3 border-b border-gray-200"
            style={{ backgroundColor: "#F6F4EE" }}
          >
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span
                className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <FileText size={16} color="#C72030" />
              </span>
              Edit Hi Soc Notice
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Notice Heading */}
              <TextField
                label={
                  <span>
                    Notice Heading<span className="text-red-500"></span>
                  </span>
                }
                placeholder="Enter Title"
                value={formData.notice_heading}
                onChange={handleChange}
                name="notice_heading"
                required
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Notice Type */}
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Notice Type</InputLabel>
                <MuiSelect
                  value={formData.notice_type || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      notice_type: e.target.value,
                    }))
                  }
                  label="Notice Type"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="General">General </MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                  <MenuItem value="Announcement">Announcement</MenuItem>
                  <MenuItem value="Event">Event</MenuItem>
                </MuiSelect>
              </FormControl>

              {/* Expire Date */}
              <TextField
                label={
                  <span>
                    Expire Date<span className="text-red-500">*</span>
                  </span>
                }
                type="date"
                value={formData.expire_date}
                onChange={handleChange}
                name="expire_date"
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                inputProps={{ min: new Date().toISOString().split("T")[0] }}
              />

              {/* Notice Description (2 cols) */}
              <div className="md:col-span-2">
                <TextField
                  label={
                    <span>
                      Notice Description<span className="text-red-500">*</span>
                    </span>
                  }
                  placeholder="Enter Description"
                  value={formData.notice_text}
                  onChange={handleChange}
                  name="notice_text"
                  fullWidth
                  variant="outlined"
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{ sx: fieldStyles }}
                />
              </div>

              {/* Expire Time */}
              <TextField
                label={
                  <span>
                    Expire Time<span className="text-red-500">*</span>
                  </span>
                }
                type="time"
                value={formData.expire_time}
                onChange={handleChange}
                name="expire_time"
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>

            {/* Mark Important + Send Email */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Mark Important */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mark Important <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_important"
                      checked={formData.is_important === true}
                      onChange={() =>
                        setFormData((prev: any) => ({
                          ...prev,
                          is_important: true,
                        }))
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#C72030" }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_important"
                      checked={formData.is_important === false}
                      onChange={() =>
                        setFormData((prev: any) => ({
                          ...prev,
                          is_important: false,
                        }))
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#C72030" }}
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Send Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Email <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="email_trigger_enabled"
                      checked={formData.email_trigger_enabled === true}
                      onChange={() =>
                        setFormData((prev: any) => ({
                          ...prev,
                          email_trigger_enabled: true,
                        }))
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#C72030" }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="email_trigger_enabled"
                      checked={formData.email_trigger_enabled === false}
                      onChange={() =>
                        setFormData((prev: any) => ({
                          ...prev,
                          email_trigger_enabled: false,
                        }))
                      }
                      className="w-4 h-4"
                      style={{ accentColor: "#C72030" }}
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Share With */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share With <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center opacity-60 cursor-not-allowed">
                    <input
                      type="radio"
                      name="shared"
                      value="0"
                      checked={formData.shared === "0"}
                      onChange={() => {}}
                      disabled
                      className="w-4 h-4 cursor-not-allowed"
                      style={{ accentColor: "#C72030" }}
                    />
                    <span className="ml-2 text-sm text-gray-700">All</span>
                  </label>
                  <label className="flex items-center opacity-60 cursor-not-allowed">
                    <input
                      type="radio"
                      name="shared"
                      value="1"
                      checked={formData.shared === "1"}
                      onChange={() => {}}
                      disabled
                      className="w-4 h-4 cursor-not-allowed"
                      style={{ accentColor: "#C72030" }}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Individuals
                    </span>
                  </label>
                  <label className="flex items-center opacity-60 cursor-not-allowed">
                    <input
                      type="radio"
                      name="shared"
                      value="2"
                      checked={formData.shared === "2"}
                      onChange={() => {}}
                      disabled
                      className="w-4 h-4 cursor-not-allowed"
                      style={{ accentColor: "#C72030" }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Groups</span>
                  </label>
                </div>

                {/* Individual Users Select */}
                {formData.shared === "1" && (
                  <FormControl
                    fullWidth
                    variant="outlined"
                    disabled
                    sx={{ "& .MuiInputBase-root": fieldStyles }}
                  >
                    <InputLabel shrink>Select Users</InputLabel>
                    <MuiSelect
                      multiple
                      value={formData.user_ids}
                      onChange={() => {}}
                      label="Select Users"
                      notched
                      displayEmpty
                      renderValue={(selected: any) => {
                        if (!selected || selected.length === 0)
                          return (
                            <span style={{ color: "#999" }}>Select Users</span>
                          );
                        return selected
                          .map((id: any) => {
                            const member = users.find(
                              (u) =>
                                u.id.toString() === id.toString()
                            );
                            if (!member?.user) return "";
                            const name = `${
                              member.user.firstname || ""
                            } ${member.user.lastname || ""}`.trim();
                            const flat = member.user_flat?.flat
                              ? ` - ${member.user_flat.flat}`
                              : "";
                            const block = member.user_flat?.block
                              ? ` (${member.user_flat.block})`
                              : "";
                            return name + flat + block;
                          })
                          .filter(Boolean)
                          .join(", ");
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select Users
                      </MenuItem>
                      {users.map((member) => {
                        if (!member?.user) return null;
                        const name = `${member.user.firstname || ""} ${
                          member.user.lastname || ""
                        }`.trim();
                        const flat = member.user_flat?.flat
                          ? ` - Flat ${member.user_flat.flat}`
                          : "";
                        const block = member.user_flat?.block
                          ? ` (${member.user_flat.block})`
                          : "";
                        return (
                          <MenuItem key={member.id} value={member.id}>
                            {name + flat + block}
                          </MenuItem>
                        );
                      })}
                    </MuiSelect>
                  </FormControl>
                )}

                {/* Groups Select */}
                {formData.shared === "2" && (
                  <FormControl
                    fullWidth
                    variant="outlined"
                    disabled
                    sx={{ "& .MuiInputBase-root": fieldStyles }}
                  >
                    <InputLabel shrink>Select Groups</InputLabel>
                    <MuiSelect
                      multiple
                      value={
                        Array.isArray(formData.group_id)
                          ? formData.group_id
                          : []
                      }
                      onChange={() => {}}
                      label="Select Groups"
                      notched
                      displayEmpty
                      renderValue={(selected: any) => {
                        if (!selected || selected.length === 0)
                          return (
                            <span style={{ color: "#999" }}>
                              Select Groups
                            </span>
                          );
                        return selected
                          .map((id: any) => {
                            const group = groups.find(
                              (g) =>
                                g.id === id ||
                                g.id.toString() === id.toString()
                            );
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
          <div
            className="px-6 py-3 border-b border-gray-200"
            style={{ backgroundColor: "#F6F4EE" }}
          >
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span
                className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <FileText size={16} color="#C72030" />
              </span>
              Notice Attachments
            </h2>
          </div>

          <div className="p-6" style={{ backgroundColor: "#AAB9C50D" }}>
            {/* Cover Image */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-base font-semibold">Notice Cover Image</h5>
                <input
                  type="file"
                  id="coverImageInputEdit"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    const validFiles = files.filter((file) => {
                      const maxSize = 3 * 1024 * 1024;
                      if (file.size > maxSize) {
                        toast.error(`${file.name} exceeds 3MB limit`);
                        return false;
                      }
                      return true;
                    });
                    if (validFiles.length > 0) {
                      const key = "cover_image_1_by_1";
                      const newFiles = validFiles.map((file) => ({
                        file,
                        name: file.name,
                        preview: URL.createObjectURL(file),
                        ratio: "1:1",
                        id: `${key}-${Date.now()}-${Math.random()}`,
                      }));
                      updateFormData(key, newFiles);
                      toast.success(`${validFiles.length} image(s) uploaded`);
                    }
                    e.target.value = "";
                  }}
                />
                <button
                  className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-[45px] px-4 text-sm font-medium rounded-md flex items-center gap-2"
                  type="button"
                  onClick={() =>
                    document.getElementById("coverImageInputEdit")?.click()
                  }
                >
                  <span>Add</span>
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table className="border-separate">
                  <TableHeader>
                    <TableRow
                      className="hover:bg-gray-50"
                      style={{ backgroundColor: "#e6e2d8" }}
                    >
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
                    {coverImageRatios.flatMap(({ key, label }) => {
                      const files = Array.isArray((formData as any)[key])
                        ? (formData as any)[key]
                        : (formData as any)[key]
                        ? [(formData as any)[key]]
                        : [];
                      if (files.length === 0) return [];
                      return files.map((file: any, index: number) => (
                        <TableRow
                          key={`${key}-${file.id || index}`}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="py-3 px-4 font-medium">
                            {file.name || `Image ${index + 1}`}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <img
                              style={{
                                maxWidth: 100,
                                maxHeight: 100,
                                objectFit: "cover",
                              }}
                              className="rounded border border-gray-200"
                              src={file.preview}
                              alt={file.name}
                            />
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {file.ratio || label}
                          </TableCell>
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

            {/* Broadcast Attachments */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-base font-semibold">Notice Attachment</h5>
                <input
                  type="file"
                  id="broadcastAttachmentInputEdit"
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    const validFiles = files.filter((file) => {
                      const isVideo = file.type.startsWith("video/");
                      const isDocument =
                        file.type === "application/pdf" ||
                        file.type.includes("document") ||
                        file.type.includes("word") ||
                        file.type.includes("excel") ||
                        file.type.includes("text");
                      const maxSize =
                        isVideo || isDocument
                          ? 10 * 1024 * 1024
                          : 3 * 1024 * 1024;
                      if (file.size > maxSize) {
                        toast.error(
                          `${file.name} exceeds ${Math.round(
                            maxSize / (1024 * 1024)
                          )}MB limit`
                        );
                        return false;
                      }
                      return true;
                    });
                    if (validFiles.length > 0) {
                      const key = "broadcast_images_1_by_1";
                      const newFiles = validFiles.map((file) => {
                        const isVideo = file.type.startsWith("video/");
                        const isImage = file.type.startsWith("image/");
                        return {
                          file,
                          name: file.name,
                          preview:
                            isImage || isVideo
                              ? URL.createObjectURL(file)
                              : null,
                          ratio: "1:1",
                          type: isVideo
                            ? "video"
                            : isImage
                            ? "image"
                            : "document",
                          id: `${key}-${Date.now()}-${Math.random()}`,
                        };
                      });
                      updateFormData(key, newFiles);
                      toast.success(`${validFiles.length} file(s) uploaded`);
                    }
                    e.target.value = "";
                  }}
                />
                <button
                  className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-[45px] px-4 text-sm font-medium rounded-md flex items-center gap-2"
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("broadcastAttachmentInputEdit")
                      ?.click()
                  }
                >
                  <span>Add</span>
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table className="border-separate">
                  <TableHeader>
                    <TableRow
                      className="hover:bg-gray-50"
                      style={{ backgroundColor: "#e6e2d8" }}
                    >
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
                    {broadcastImageRatios.map(({ key, label }) =>
                      ((formData as any)[key] || []).length > 0
                        ? (formData as any)[key].map(
                            (file: any, index: number) => {
                              const isVideo =
                                file.type === "video" ||
                                (file.file &&
                                  file.file.type.startsWith("video/"));
                              const isDocument =
                                file.type === "document" ||
                                (!isVideo && !file.preview);
                              return (
                                <TableRow
                                  key={`${key}-${file.id || index}`}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <TableCell className="py-3 px-4 font-medium">
                                    {file.name || "Unnamed File"}
                                  </TableCell>
                                  <TableCell className="py-3 px-4">
                                    {isDocument ? (
                                      <div
                                        className="flex items-center justify-center"
                                        style={{ width: 100, height: 100 }}
                                      >
                                        <FileText className="w-12 h-12 text-[#C72030]" />
                                      </div>
                                    ) : isVideo ? (
                                      <video
                                        controls
                                        style={{
                                          maxWidth: 100,
                                          maxHeight: 100,
                                        }}
                                        className="rounded border border-gray-200"
                                      >
                                        <source
                                          src={file.preview}
                                          type={
                                            file.file?.type || "video/mp4"
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
                                        src={file.preview}
                                        alt={file.name}
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell className="py-3 px-4">
                                    {file.ratio || label}
                                  </TableCell>
                                  <TableCell className="py-3 px-4">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleImageRemoval(key, index)
                                      }
                                    >
                                      <Trash2 className="w-4 h-4 text-[#c72030]" />
                                    </button>
                                  </TableCell>
                                </TableRow>
                              );
                            }
                          )
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
            className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-[#C72030]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Updating...
              </>
            ) : (
              "Update"
            )}
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
          onContinue={(validImages: any[]) =>
            handleCroppedImages(validImages, "cover")
          }
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
          onContinue={(validImages: any[], videoFiles: any[]) =>
            handleBroadcastCroppedImages(validImages, videoFiles, "broadcast")
          }
          allowVideos={true}
        />
      )}
    </div>
  );
};

export default HiSocNoticeEdit;
