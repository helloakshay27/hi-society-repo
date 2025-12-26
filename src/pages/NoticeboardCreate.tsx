import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem, Radio, RadioGroup, FormControlLabel, Checkbox } from "@mui/material";
import MultiSelectBox from "../components/ui/multi-selector";
import SelectBox from "@/components/ui/select-box";
import { API_CONFIG } from "@/config/apiConfig";
import ProjectBannerUpload from "../components/reusable/ProjectBannerUpload";
import ProjectImageVideoUpload from "../components/reusable/ProjectImageVideoUpload";

const fieldStyles = {
  height: '45px',
  backgroundColor: '#fff',
  '& .MuiOutlinedInput-root': {
    height: '45px',
    '& fieldset': {
      borderColor: '#d1d5db',
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

const NoticeboardForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  // Get baseURL
  const baseURL = API_CONFIG.BASE_URL;
  
  const [formData, setFormData] = useState({
    project_id: "",
    notice_heading: "",
    notice_text: "",
    active: "1",
    IsDelete: "0",
    expire_time: "",
    user_id: "",
    publish: "1",
    notice_type: "",
    deny: "0",
    flag_expire: "1",
    canceled_by: "",
    canceler_id: "",
    comment: "",
    shared: "all",
    group_id: [],
    of_phase: "",
    of_atype: "",
    of_atype_id: "",
    is_important: "",
    email_trigger_enabled: "",
    set_reminders_attributes: [],
    cover_image: [],
    noticeboard_images: [],
    cover_image_1_by_1: [],
    cover_image_9_by_16: [],
    cover_image_3_by_2: [],
    cover_image_16_by_9: [],
    noticeboard_images_1_by_1: [],
    noticeboard_images_9_by_16: [],
    noticeboard_images_3_by_2: [],
    noticeboard_images_16_by_9: [],
  });

  console.log("formData", formData);
  const [noticeTypes, setNoticeTypes] = useState([]);
  const [eventUserID, setEventUserID] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [groups, setGroups] = useState([]);

  // Enhanced reminder state
  const [reminderValue, setReminderValue] = useState("");
  const [reminderUnit, setReminderUnit] = useState("");
  const [image, setImage] = useState([]);
  const [croppedImage, setCroppedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showAttachmentTooltip, setShowAttachmentTooltip] = useState(false);
  const [showCoverUploader, setShowCoverUploader] = useState(false);
  const [showEventUploader, setShowEventUploader] = useState(false);
  const [removingImageId, setRemovingImageId] = useState(null); // Track which image is being removed
  const previewUrlsRef = useRef(new Map()); // Store preview URLs for cleanup

  const timeOptions = [
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
    { value: "weeks", label: "Weeks" },
  ];

  const timeConstraints = {
    minutes: { min: 0, max: 40320 },
    hours: { min: 0, max: 672 },
    days: { min: 0, max: 28 },
    weeks: { min: 0, max: 4 },
  };

  const noticeTypeOptions = [
    { value: "maintenance", label: "Maintenance" },
    { value: "general", label: "General" },
    { value: "emergency", label: "Emergency" },
    { value: "announcement", label: "Announcement" },
    { value: "event", label: "Event" },
  ];

  const phaseOptions = [
    { value: "A", label: "Phase A" },
    { value: "B", label: "Phase B" },
    { value: "C", label: "Phase C" },
    { value: "D", label: "Phase D" },
  ];

  const atypeOptions = [
    { value: "tower", label: "Tower" },
    { value: "building", label: "Building" },
    { value: "wing", label: "Wing" },
  ];

  const coverImageRatios = [
    { key: "cover_image_1_by_1", label: "1:1" },
    { key: "cover_image_16_by_9", label: "16:9" },
    { key: "cover_image_9_by_16", label: "9:16" },
    { key: "cover_image_3_by_2", label: "3:2" },
  ];

  const noticeboardImageRatios = [
    { key: "noticeboard_images_1_by_1", label: "1:1" },
    { key: "noticeboard_images_16_by_9", label: "16:9" },
    { key: "noticeboard_images_9_by_16", label: "9:16" },
    { key: "noticeboard_images_3_by_2", label: "3:2" },
  ];

  const eventUploadConfig = {
    "cover image": ["16:9", "1:1", "9:16", "3:2"],
    "notice images": ["16:9", "1:1", "9:16", "3:2"],
  };

  const coverImageType = "cover image";
  const selectedCoverRatios = eventUploadConfig[coverImageType] || [];
  const coverImageLabel = coverImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicCoverDescription = `Supports ${selectedCoverRatios.join(
    ", "
  )} aspect ratios`;

  const noticeImageType = "notice images";
  const selectedNoticeRatios = eventUploadConfig[noticeImageType] || [];
  const noticeImageLabel = noticeImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicNoticeDescription = `Supports ${selectedNoticeRatios.join(
    ", "
  )} aspect ratios`;

  const updateFormData = (key, files) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), ...files],
    }));
  };

  const handleCroppedImages = (validImages, type = "cover") => {
    if (!validImages || validImages.length === 0) {
      toast.error(
        `No valid ${type} image${
          ["cover", "notice"].includes(type) ? "" : "s"
        } selected.`
      );
      return;
    }

    try {
      validImages.forEach((img) => {
        const ratioKey = img.ratio.replace(":", "_by_");
        let specificKey;
        
        if (type === "cover") {
          specificKey = `cover_image_${ratioKey}`;
        } else {
          specificKey = `noticeboard_images_${ratioKey}`;
        }

        const generalKey = type === "cover" ? "cover_image" : "noticeboard_images";
        
        const newImageData = {
          file: img.file,
          name: img.file.name,
          preview: URL.createObjectURL(img.file),
          ratio: img.ratio,
          id: `${specificKey}-${Date.now()}-${Math.random()}`,
        };

        if (type === "cover") {
          // For cover images: Replace existing image (single image only)
          setFormData(prev => ({
            ...prev,
            [generalKey]: [newImageData],
            [specificKey]: [newImageData], // Single image per ratio
          }));
          toast.success(`Cover image (${img.ratio}) uploaded successfully!`);
        } else {
          // For noticeboard images: Add to existing images (multiple images allowed)
          updateFormData(generalKey, [newImageData]);
          updateFormData(specificKey, [newImageData]);
          toast.success(`Broadcast image (${img.ratio}) uploaded successfully!`);
        }
      });

      if (type === "cover") {
        setShowCoverUploader(false);
      } else if (type === "notice") {
        setShowEventUploader(false);
      } else {
        setShowEventUploader(false);
      }
    } catch (error) {
      console.error("Error handling cropped images:", error);
      toast.error("Failed to process uploaded images");
    }
  };

  const handleNoticeImageUpload = (
    validImages,
    videoFiles = [],
    type = "cover"
  ) => {
    // Handle video files first
    if (videoFiles && videoFiles.length > 0) {
      videoFiles.forEach((video) => {
        const key = type === "cover" ? "cover_image" : "noticeboard_images";

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
        setShowEventUploader(false);
      }
      return;
    }

    // Handle images
    if (!validImages || validImages.length === 0) {
      toast.error(`No valid ${type} files selected.`);
      return;
    }

    validImages.forEach((img) => {
      const ratioKey = img.ratio.replace(":", "_by_");
      let specificKey;
      
      if (type === "cover") {
        specificKey = `cover_image_${ratioKey}`;
      } else {
        specificKey = `noticeboard_images_${ratioKey}`;
      }

      const generalKey = type === "cover" ? "cover_image" : "noticeboard_images";
      
      const newImageData = {
        file: img.file,
        name: img.file.name,
        preview: URL.createObjectURL(img.file),
        ratio: img.ratio,
        type: "image",
        id: `${specificKey}-${Date.now()}-${Math.random()}`,
      };

      if (type === "cover") {
        // For cover images: Replace existing image (single image only)
        setFormData(prev => ({
          ...prev,
          [generalKey]: [newImageData],
          [specificKey]: [newImageData], // Single image per ratio
        }));
      } else {
        // For noticeboard images: Add to existing images (multiple images allowed)
        updateFormData(generalKey, [newImageData]);
        updateFormData(specificKey, [newImageData]);
      }
    });

    if (type === "cover") {
      setShowCoverUploader(false);
    } else {
      setShowEventUploader(false);
    }
  };

  // Function to remove image from server in edit mode
  const removeImageFromServer = async (imageId) => {
    if (!isEdit || !id || !imageId) return false;

    try {
      setRemovingImageId(imageId); // Set loading state
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return false;
      }

      console.log(`Removing image ${imageId} from noticeboard ${id}`);
      
      const response = await axios.delete(
        `${baseURL}noticeboards/${id}/remove_image/${imageId}.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        toast.success("Image removed successfully");
        return true;
      } else {
        console.error("Failed to remove image from server:", response);
        toast.error("Failed to remove image from server");
        return false;
      }
    } catch (error) {
      console.error("Error removing image from server:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
        navigate("/login");
      } else if (error.response?.status === 404) {
        toast.error("Image not found on server");
      } else {
        toast.error("Failed to remove image from server");
      }
      return false;
    } finally {
      setRemovingImageId(null); // Clear loading state
    }
  };

  const handleImageRemoval = async (key, index) => {
    const imageToRemove = formData[key]?.[index];
    
    // If in edit mode and image has an ID, remove from server first
    if (isEdit && imageToRemove?.id) {
      const serverRemovalSuccess = await removeImageFromServer(imageToRemove.id);
      if (!serverRemovalSuccess) {
        // If server removal failed, don't remove from UI
        return;
      }
    }

    setFormData((prev) => {
      const updatedArray = (prev[key] || []).filter((_, i) => i !== index);
      const newFormData = {
        ...prev,
        [key]: updatedArray.length > 0 ? updatedArray : [],
      };

      // Also remove from ratio-specific arrays if it's a general key
      if (key === "cover_image" || key === "noticeboard_images") {
        const itemToRemove = prev[key][index];
        if (itemToRemove?.ratio) {
          const ratioKey = itemToRemove.ratio.replace(":", "_by_");
          const specificKey = key === "cover_image" 
            ? `cover_image_${ratioKey}` 
            : `noticeboard_images_${ratioKey}`;
          
          // Remove from specific ratio array
          newFormData[specificKey] = (prev[specificKey] || []).filter(
            item => item.id !== itemToRemove.id
          );
        }
      }
      
      // If it's a ratio-specific key, also remove from general array
      if (key.includes("_1_by_1") || key.includes("_16_by_9") || 
          key.includes("_9_by_16") || key.includes("_3_by_2")) {
        const itemToRemove = prev[key][index];
        const generalKey = key.startsWith("cover_image") ? "cover_image" : "noticeboard_images";
        
        newFormData[generalKey] = (prev[generalKey] || []).filter(
          item => item.id !== itemToRemove.id
        );
      }

      return newFormData;
    });
  };

  const discardImage = async (key, imageToRemove) => {
    try {
      // If in edit mode and image has an ID, remove from server first
      if (isEdit && imageToRemove?.id) {
        const serverRemovalSuccess = await removeImageFromServer(imageToRemove.id);
        if (!serverRemovalSuccess) {
          // If server removal failed, don't remove from UI
          return;
        }
      }

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

        // Also remove from ratio-specific arrays if it's a general key
        if (key === "cover_image" || key === "noticeboard_images") {
          if (imageToRemove?.ratio) {
            const ratioKey = imageToRemove.ratio.replace(":", "_by_");
            const specificKey = key === "cover_image" 
              ? `cover_image_${ratioKey}` 
              : `noticeboard_images_${ratioKey}`;
            
            // Remove from specific ratio array
            const specificUpdated = (prev[specificKey] || []).filter(
              item => item.id !== imageToRemove.id
            );
            
            if (specificUpdated.length === 0) {
              delete newFormData[specificKey];
            } else {
              newFormData[specificKey] = specificUpdated;
            }
          }
        }
        
        // If it's a ratio-specific key, also remove from general array
        if (key.includes("_1_by_1") || key.includes("_16_by_9") || 
            key.includes("_9_by_16") || key.includes("_3_by_2")) {
          const generalKey = key.startsWith("cover_image") ? "cover_image" : "noticeboard_images";
          
          const generalUpdated = (prev[generalKey] || []).filter(
            item => item.id !== imageToRemove.id
          );
          
          if (generalUpdated.length === 0) {
            delete newFormData[generalKey];
          } else {
            newFormData[generalKey] = generalUpdated;
          }
        }

        return newFormData;
      });
      
      // Show success message
      const imageType = key.includes("cover_image") ? "Cover" : "Broadcast";
      toast.success(`${imageType} image removed successfully!`);
      
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    }
  };

  // Set Reminders
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [reminders, setReminders] = useState([]);

  const handleAddReminder = () => {
    if (!reminderValue || !reminderUnit) return;

    const newReminder = {
      value: reminderValue,
      unit: reminderUnit,
    };

    setFormData((prevFormData) => ({
      ...prevFormData,
      set_reminders_attributes: [
        ...prevFormData.set_reminders_attributes,
        newReminder,
      ],
    }));

    setReminderValue("");
    setReminderUnit("");
  };

  const handleRemoveReminder = (index) => {
    setFormData((prevFormData) => {
      const reminders = [...prevFormData.set_reminders_attributes];

      if (reminders[index]?.id) {
        reminders[index]._destroy = true;
      } else {
        reminders.splice(index, 1);
      }

      return {
        ...prevFormData,
        set_reminders_attributes: reminders,
      };
    });
  };

  // Convert reminders to API format before submission
  const prepareRemindersForSubmission = () => {
    return formData.set_reminders_attributes
      .map((reminder) => {
        if (reminder._destroy) {
          return { id: reminder.id, _destroy: true };
        }
        const baseReminder = { id: reminder.id };
        if (reminder.unit === "days") {
          baseReminder.days = Number(reminder.value);
        } else if (reminder.unit === "hours") {
          baseReminder.hours = Number(reminder.value);
        } else if (reminder.unit === "minutes") {
          baseReminder.minutes = Number(reminder.value);
        } else if (reminder.unit === "weeks") {
          baseReminder.weeks = Number(reminder.value);
        }
        return baseReminder;
      })
      .filter((r) => !r._destroy || r.id);
  };

  console.log("eventUserID", eventUserID);
  console.log("groups", groups);

  // Handle input change for form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRadioChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateForm = (formData) => {
    toast.dismiss();
    const errors = [];

    if (!formData.notice_heading) {
      errors.push("Broadcast Heading is required.");
      return errors;
    }
    if (!formData.notice_text) {
      errors.push("Broadcast Text is required.");
      return errors;
    }
    // if (!selectedProjectId) {
    //   errors.push("Project selection is required.");
    // }
    if (!formData.comment) {
      errors.push("Comment is required.");
    }
    if (!formData.expire_time) {
      errors.push("Expire Time is required.");
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    toast.dismiss();
    e.preventDefault();
    setLoading(true);
    toast.dismiss();

    const preparedReminders = prepareRemindersForSubmission();

    // Use backend value for shared
    const backendSharedValue = formData.shared === "all" ? "0" : "1";

    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append("noticeboard[project_id]", selectedProjectId);
    data.append("noticeboard[notice_heading]", formData.notice_heading);
    data.append("noticeboard[notice_text]", formData.notice_text);
    data.append("noticeboard[active]", formData.active);
    data.append("noticeboard[IsDelete]", formData.IsDelete);
    data.append("noticeboard[expire_time]", formData.expire_time);
    data.append("noticeboard[user_id]", formData.user_id);
    data.append("noticeboard[publish]", formData.publish);
    data.append("noticeboard[notice_type]", formData.notice_type);
    data.append("noticeboard[deny]", formData.deny);
    data.append("noticeboard[flag_expire]", formData.flag_expire);
    data.append("noticeboard[canceled_by]", formData.canceled_by);
    data.append("noticeboard[canceler_id]", formData.canceler_id);
    data.append("noticeboard[comment]", formData.comment);
    data.append("noticeboard[shared]", backendSharedValue); // <-- use backend value here
    data.append("noticeboard[of_phase]", formData.of_phase);
    data.append("noticeboard[of_atype]", formData.of_atype);
    data.append("noticeboard[of_atype_id]", formData.of_atype_id);
    data.append("noticeboard[is_important]", formData.is_important);
    data.append("noticeboard[email_trigger_enabled]", formData.email_trigger_enabled);

    // Handle cover image
    // if (formData.cover_image && formData.cover_image.length > 0) {
    //   const img = formData.cover_image[0];
    //   if (img?.file instanceof File) {
    //     data.append("noticeboard[cover_image]", img.file);
    //   }
    // }

    // Handle ratio-wise cover images (single images only)
    coverImageRatios.forEach(({ key }) => {
      if (formData[key] && formData[key].length > 0) {
        const img = formData[key][0]; // Only take the first image
        if (img?.file instanceof File) {
          data.append(`noticeboard[${key}]`, img.file); // No [] brackets for single images
        }
      }
    });

    // // Handle noticeboard images
    // if (formData.noticeboard_images && formData.noticeboard_images.length > 0) {
    //   formData.noticeboard_images.forEach((img) => {
    //     if (img?.file instanceof File) {
    //       data.append("noticeboard[noticeboard_images][]", img.file);
    //     }
    //   });
    // }

    // Handle ratio-wise noticeboard images
    noticeboardImageRatios.forEach(({ key }) => {
      if (formData[key] && formData[key].length > 0) {
        formData[key].forEach((img) => {
          if (img?.file instanceof File) {
            data.append(`noticeboard[${key}][]`, img.file);
          }
        });
      }
    });

    // Handle group IDs
    if (Array.isArray(formData.group_id)) {
      formData.group_id.forEach((id) => {
        data.append("noticeboard[group_id][]", id);
      });
    } else if (formData.group_id) {
      data.append("noticeboard[group_id][]", formData.group_id);
    }

    // Updated reminder data appending
    preparedReminders.forEach((reminder, index) => {
      if (reminder.id)
        data.append(
          `noticeboard[set_reminders_attributes][${index}][id]`,
          reminder.id
        );
      if (reminder._destroy) {
        data.append(`noticeboard[set_reminders_attributes][${index}][_destroy]`, "1");
      } else {
        if (reminder.days)
          data.append(
            `noticeboard[set_reminders_attributes][${index}][days]`,
            reminder.days
          );
        if (reminder.hours)
          data.append(
            `noticeboard[set_reminders_attributes][${index}][hours]`,
            reminder.hours
          );
        if (reminder.minutes)
          data.append(
            `noticeboard[set_reminders_attributes][${index}][minutes]`,
            reminder.minutes
          );
        if (reminder.weeks)
          data.append(
            `noticeboard[set_reminders_attributes][${index}][weeks]`,
            reminder.weeks
          );
      }
    });

    console.log("Data to be sent:", Array.from(data.entries()));

    try {
      const url = isEdit ? `${baseURL}noticeboards/${id}.json` : `${baseURL}noticeboards.json`;
      const method = isEdit ? 'put' : 'post';
      
      const response = await axios({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      toast.success(`Broadcast ${isEdit ? 'updated' : 'created'} successfully!`);
      
      if (!isEdit) {
        // Reset form only for create mode
        setFormData({
          project_id: "",
          notice_heading: "",
          notice_text: "",
          active: "1",
          IsDelete: "0",
          expire_time: "",
          user_id: "",
          publish: "1",
          notice_type: "",
          deny: "0",
          flag_expire: "1",
          canceled_by: "",
          canceler_id: "",
          comment: "",
          shared: "all", // Fixed: should be "all" not "1"
          of_phase: "",
          of_atype: "",
          of_atype_id: "",
          is_important: "",
          email_trigger_enabled: "",
          user_ids: [],
          set_reminders_attributes: [],
          cover_image: [],
          noticeboard_images: [],
          cover_image_1_by_1: [],
          cover_image_9_by_16: [],
          cover_image_3_by_2: [],
          cover_image_16_by_9: [],
          noticeboard_images_1_by_1: [],
          noticeboard_images_9_by_16: [],
          noticeboard_images_3_by_2: [],
          noticeboard_images_16_by_9: [],
        });
        
        // Reset additional states
        setSelectedProjectId("");
        setReminderValue("");
        setReminderUnit("");
        
        setTimeout(() => {
          toast.success("Form reset for new broadcast creation!");
        }, 1000);
      }

      navigate("/maintenance/noticeboard-list");
    } catch (error) {
      console.error("Error submitting the form:", error);
      if (error.response && error.response.data) {
        toast.error(
          `Error: ${error.response.data.message || "Submission failed"}`
        );
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
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.error("No access token found");
          return;
        }

        const response = await axios.get(
          `${baseURL}users/get_users.json`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        setEventUserID(response?.data.users || []);
      } catch (error) {
        console.error("Error fetching Users:", error);
        if (error.response?.status === 401) {
          toast.error("Authentication failed. Please login again.");
          navigate("/login");
        }
      }
    };
    fetchUsers();
  }, [baseURL, navigate]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("access_token");
        
        if (!token) {
          console.error("No access token found");
          toast.error("Authentication required. Please login.");
          navigate("/login");
          return;
        }

        const response = await axios.get(`${baseURL}projects.json`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        setProjects(response.data.projects || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
        
        if (error.response?.status === 401) {
          toast.error("Authentication failed. Please login again.");
          navigate("/login");
        }
      }
    };

    fetchProjects();
  }, [baseURL, navigate]);

  // Fetch noticeboard data for edit mode
  useEffect(() => {
    const fetchNoticeboardData = async () => {
      if (!isEdit || !id) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        
        if (!token) {
          toast.error("Authentication required. Please login again.");
          navigate("/login");
          return;
        }
        
        const response = await axios.get(`${baseURL}noticeboards/${id}.json`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("API Response:", response);
        console.log("Response data:", response.data);

        if (!response.data || !response.data.noticeboard) {
          console.error("Invalid response structure:", response.data);
          toast.error("Invalid data received from server");
          return;
        }

        const noticeboardData = response.data.noticeboard;
        console.log("Fetched noticeboard data:", noticeboardData);

        // Map backend shared value to frontend values
        let frontendSharedValue = "all";
        if (noticeboardData.shared === 1 || noticeboardData.shared === "1") {
          // If shared is 1, check if we have group_ids or user_ids to determine individual vs group
          if (noticeboardData.group_ids && noticeboardData.group_ids.length > 0) {
            frontendSharedValue = "group";
          } else {
            frontendSharedValue = "individual";
          }
        }

        // Enhanced image data processing with better error handling
        const processImageData = (imageData) => {
          if (!imageData) return [];
          
          if (Array.isArray(imageData)) {
            return imageData.map((img, index) => ({
              ...img,
              // Ensure we have required fields with fallbacks
              id: img.id || `temp-${Date.now()}-${index}`,
              name: img.name || img.document_file_name || img.filename || `Image ${index + 1}`,
              preview: img.preview || img.document_url || img.url || img.file_url || '',
              ratio: img.ratio || 'unknown',
              type: img.type || 'image'
            }));
          }
          
          // Single image object
          return [{
            ...imageData,
            id: imageData.id || `temp-${Date.now()}`,
            name: imageData.name || imageData.document_file_name || imageData.filename || 'Image',
            preview: imageData.preview || imageData.document_url || imageData.url || imageData.file_url || '',
            ratio: imageData.ratio || 'unknown',
            type: imageData.type || 'image'
          }];
        };

        // Set form data from fetched noticeboard
        const newFormData = {
          project_id: noticeboardData.project_id || "",
          notice_heading: noticeboardData.notice_heading || "",
          notice_text: noticeboardData.notice_text || "",
          active: noticeboardData.active?.toString() || "1",
          IsDelete: noticeboardData.IsDelete?.toString() || "0",
          expire_time: noticeboardData.expire_time ? new Date(noticeboardData.expire_time).toISOString().slice(0, 16) : "",
          user_id: noticeboardData.user_ids ? noticeboardData.user_ids.join(",") : "",
          publish: noticeboardData.publish?.toString() || "1",
          notice_type: noticeboardData.notice_type || "",
          deny: noticeboardData.deny?.toString() || "0",
          flag_expire: noticeboardData.flag_expire?.toString() || "1",
          canceled_by: noticeboardData.canceled_by || "",
          canceler_id: noticeboardData.canceler_id || "",
          comment: noticeboardData.comment || "",
          shared: frontendSharedValue,
          group_id: noticeboardData.group_ids || [],
          of_phase: noticeboardData.of_phase || "",
          of_atype: noticeboardData.of_atype || "",
          of_atype_id: noticeboardData.of_atype_id || "",
          is_important: noticeboardData.is_important?.toString() || "",
          email_trigger_enabled: noticeboardData.email_trigger_enabled?.toString() || "",
          set_reminders_attributes: noticeboardData.set_reminders_attributes || [],
          cover_image: processImageData(noticeboardData.cover_image),
          noticeboard_images: processImageData(noticeboardData.noticeboard_images),
          // Initialize ratio-wise fields for edit mode with robust handling
          cover_image_1_by_1: processImageData(noticeboardData.cover_image_1_by_1),
          cover_image_9_by_16: processImageData(noticeboardData.cover_image_9_by_16),
          cover_image_3_by_2: processImageData(noticeboardData.cover_image_3_by_2),
          cover_image_16_by_9: processImageData(noticeboardData.cover_image_16_by_9),
          noticeboard_images_1_by_1: processImageData(noticeboardData.noticeboard_images_1_by_1),
          noticeboard_images_9_by_16: processImageData(noticeboardData.noticeboard_images_9_by_16),
          noticeboard_images_3_by_2: processImageData(noticeboardData.noticeboard_images_3_by_2),
          noticeboard_images_16_by_9: processImageData(noticeboardData.noticeboard_images_16_by_9),
        };

        console.log("Setting form data:", newFormData);
        setFormData(newFormData);
        setSelectedProjectId(noticeboardData.project_id || "");
        
        toast.success("Broadcast data loaded successfully!");

      } catch (error) {
        console.error("Error fetching noticeboard data:", error);
        
        if (error.response) {
          console.error("Error response:", error.response);
          console.error("Error status:", error.response.status);
          console.error("Error data:", error.response.data);
          
          if (error.response.status === 401) {
            toast.error("Authentication failed. Please login again.");
            navigate("/login");
          } else if (error.response.status === 404) {
            toast.error("Broadcast not found.");
            navigate("/maintenance/noticeboard-list");
          } else {
            toast.error(`Failed to fetch broadcast data: ${error.response.data?.message || error.message}`);
          }
        } else if (error.request) {
          console.error("Error request:", error.request);
          toast.error("Network error. Please check your connection.");
        } else {
          console.error("Error message:", error.message);
          toast.error(`Error: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNoticeboardData();
  }, [id, isEdit, navigate]);

  const handleCancel = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.error("No access token found");
          return;
        }

        const response = await axios.get(`${baseURL}usergroups.json`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const groupsData = Array.isArray(response.data)
          ? response.data
          : response.data.usergroups || [];
        setGroups(groupsData);
        console.log("Fetched Groups:", groupsData);
      } catch (error) {
        console.error("Error fetching Groups:", error);
      }
    };

    if (formData.shared === "group" && groups.length === 0) {
      fetchGroups();
    }
  }, [formData.shared, groups.length, baseURL]);

  const handleCoverImageUpload = (newImageList) => {
    if (!newImageList || newImageList.length === 0) return;

    const file = newImageList[0].file;
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size must be less than 3MB");
      return;
    }

    setImage(newImageList);
    setDialogOpen(true);
  };

  // Validate edit mode parameters
  useEffect(() => {
    if (isEdit && !id) {
      toast.error("Invalid broadcast ID provided");
      navigate("/maintenance/noticeboard-list");
      return;
    }
    
    if (isEdit && isNaN(parseInt(id))) {
      toast.error("Invalid broadcast ID format");
      navigate("/maintenance/noticeboard-list");
      return;
    }
  }, [id, isEdit, navigate]);

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
          <span>Broadcast List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">{isEdit ? 'Edit Broadcast' : 'Create New Broadcast'}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'EDIT BROADCAST' : 'CREATE BROADCAST'}</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        {/* Section: Broadcast Information */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <FileText size={16} color="#C72030" />
              </span>
              Broadcast Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C72030]"></div>
                <p className="mt-3 text-gray-600">{isEdit ? 'Loading broadcast data...' : 'Loading...'}</p>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <SelectBox
                  label="Select Project"
                  options={projects.map((proj) => ({
                    value: proj.id,
                    label: proj.project_name,
                  }))}
                  defaultValue={selectedProjectId || ""}
                  onChange={(value) => setSelectedProjectId(value)}
                />
              </div>

              {/* Notice Heading */}
              <div>
                <TextField
                  fullWidth
                  label="Notice Heading"
                  name="notice_heading"
                  placeholder="Enter Notice Heading"
                  value={formData.notice_heading}
                  onChange={handleChange}
                  required
                  sx={fieldStyles}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </div>

              {/* Notice Text */}
              <div>
                <TextField
                  fullWidth
                  label="Notice Text"
                  name="notice_text"
                  placeholder="Enter Notice Text"
                  value={formData.notice_text}
                  onChange={handleChange}
                  required
                  multiline
                  rows={1}
                  sx={fieldStyles}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </div>

              {/* Notice Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notice Type
                </label>
                <SelectBox
                  label="Select Notice Type"
                  options={noticeTypeOptions}
                  defaultValue={formData.notice_type || ""}
                  onChange={(value) => setFormData(prev => ({...prev, notice_type: value}))}
                />
              </div>

              {/* Expire Time */}
              <div>
                <TextField
                  fullWidth
                  label="Expire Time"
                  name="expire_time"
                  type="datetime-local"
                  placeholder="Enter Expire Time"
                  value={formData.expire_time}
                  onChange={handleChange}
                  required
                  sx={fieldStyles}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </div>

              {/* Comment */}
              <div>
                <TextField
                  fullWidth
                  label="Comment"
                  name="comment"
                  placeholder="Enter Comment"
                  value={formData.comment}
                  onChange={handleChange}
                  required
                  multiline
                  rows={1}
                  sx={fieldStyles}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </div>

              {/* Mark Important */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mark Important
                </label>
                <RadioGroup
                  row
                  name="is_important"
                  value={formData.is_important}
                  onChange={handleChange}
                  className="mt-1"
                >
                  <FormControlLabel
                    value="1"
                    control={<Radio sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }} />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="0"
                    control={<Radio sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }} />}
                    label="No"
                  />
                </RadioGroup>
              </div>

              {/* Send Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Email
                </label>
                <RadioGroup
                  row
                  name="email_trigger_enabled"
                  value={formData.email_trigger_enabled}
                  onChange={handleChange}
                  className="mt-1"
                >
                  <FormControlLabel
                    value="1"
                    control={<Radio sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }} />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="0"
                    control={<Radio sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }} />}
                    label="No"
                  />
                </RadioGroup>
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Status
                </label>
                <RadioGroup
                  row
                  name="active"
                  value={formData.active}
                  onChange={handleChange}
                  className="mt-1"
                >
                  <FormControlLabel
                    value="1"
                    control={<Radio sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }} />}
                    label="Active"
                  />
                  <FormControlLabel
                    value="0"
                    control={<Radio sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }} />}
                    label="Inactive"
                  />
                </RadioGroup>
              </div>

              {/* Set Reminders - Full Width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Set Reminders</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                  <div>
                    <SelectBox
                      label="Time Unit"
                      options={timeOptions}
                      defaultValue={reminderUnit || ""}
                      onChange={(value) => {
                        setReminderUnit(value);
                        setReminderValue("");
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="Value"
                      value={reminderValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        const constraints = timeConstraints[reminderUnit];
                        if (constraints && (value < constraints.min || value > constraints.max)) {
                          return;
                        }
                        setReminderValue(value);
                      }}
                      inputProps={{
                        min: timeConstraints[reminderUnit]?.min || 0,
                        max: timeConstraints[reminderUnit]?.max || "",
                      }}
                      title={
                        reminderUnit
                          ? `Must be between ${timeConstraints[reminderUnit].min} to ${timeConstraints[reminderUnit].max} ${reminderUnit}`
                          : "Please select a time unit first"
                      }
                      disabled={!reminderUnit}
                      sx={fieldStyles}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="w-full h-[45px] bg-[#C72030] hover:bg-[#B8252F] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleAddReminder}
                      disabled={!reminderValue || !reminderUnit}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Display added reminders */}
                <div className="space-y-2">
                  {formData.set_reminders_attributes
                    .filter((reminder) => !reminder._destroy)
                    .map((reminder, index) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" key={index}>
                        <div>
                          <FormControl fullWidth sx={fieldStyles}>
                            <MuiSelect
                              value={reminder.unit}
                              disabled
                              sx={{ backgroundColor: "#f8f9fa" }}
                            >
                              {timeOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </MuiSelect>
                          </FormControl>
                        </div>
                        <div>
                          <TextField
                            fullWidth
                            type="number"
                            value={reminder.value}
                            disabled
                            sx={{ ...fieldStyles, backgroundColor: "#f8f9fa" }}
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            className="w-full h-[45px] bg-[#C72030] hover:bg-[#B8252F] text-white font-medium rounded-md transition-colors"
                            onClick={() => handleRemoveReminder(index)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Share With - Full Width */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Share With</label>
                <RadioGroup
                  row
                  name="shared"
                  value={formData.shared}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "all") {
                      setFormData((prev) => ({
                        ...prev,
                        shared: "all",
                        user_id: "",
                        group_id: [],
                      }));
                    } else if (value === "individual") {
                      setFormData((prev) => ({
                        ...prev,
                        shared: "individual",
                        group_id: [],
                      }));
                    } else if (value === "group") {
                      setFormData((prev) => ({
                        ...prev,
                        shared: "group",
                        user_id: "",
                      }));
                    }
                  }}
                  className="mb-3"
                >
                  <FormControlLabel
                    value="all"
                    control={<Radio sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }} />}
                    label="All"
                  />
                  <FormControlLabel
                    value="individual"
                    control={<Radio sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }} />}
                    label="Individuals"
                  />
                  <FormControlLabel
                    value="group"
                    control={<Radio sx={{ color: '#C72030', '&.Mui-checked': { color: '#C72030' } }} />}
                    label="Groups"
                  />
                </RadioGroup>

                {/* Conditional: Individual Users */}
                {formData.shared === "individual" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Broadcast User ID
                    </label>
                    <MultiSelectBox
                      options={eventUserID.map((user) => ({
                        value: user.id,
                        label: `${user.firstname} ${user.lastname}`,
                      }))}
                      value={
                        formData.user_id
                          ? formData.user_id.split(",").map((id) => {
                              const user = eventUserID.find(
                                (u) => u.id.toString() === id
                              );
                              return {
                                value: id,
                                label: `${user?.firstname} ${user?.lastname}`,
                              };
                            })
                          : []
                      }
                      onChange={(selectedOptions) =>
                        setFormData((prev) => ({
                          ...prev,
                          user_id: selectedOptions
                            .map((option) => option.value)
                            .join(","),
                        }))
                      }
                      placeholder="Select Users"
                    />
                  </div>
                )}

                {/* Conditional: Groups */}
                {formData.shared === "group" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Share with Groups
                    </label>
                    <MultiSelectBox
                      options={groups.map((group) => ({
                        value: group.id,
                        label: group.name,
                      }))}
                      value={
                        Array.isArray(formData.group_id)
                          ? formData.group_id
                              .map((id) => {
                                const group = groups.find(
                                  (g) =>
                                    g.id === id ||
                                    g.id.toString() === id.toString()
                                );
                                return group
                                  ? { value: group.id, label: group.name }
                                  : null;
                              })
                              .filter(Boolean)
                          : []
                      }
                      onChange={(selectedOptions) =>
                        setFormData((prev) => ({
                          ...prev,
                          group_id: selectedOptions.map(
                            (option) => option.value
                          ),
                        }))
                      }
                      placeholder="Select Groups"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section: File Upload */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#C72030' }}>
                <FileText size={16} color="#fff" />
              </span>
              File Upload
            </h2>
          </div>
                <div className="p-6 space-y-6">
            {/* Cover Images Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-medium text-gray-900 flex items-center">
                  Broadcast Cover Image
                  <span
                    className="ml-2 text-xs text-gray-500 cursor-help relative group"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    [i]
                    {showTooltip && (
                      <span className="absolute left-0 top-6 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Max Upload Size 3 MB. Single image per aspect ratio (16:9, 1:1, 9:16, 3:2)
                      </span>
                    )}
                  </span>
                </h3>
                <button
                  className="px-4 py-2 bg-[#C72030] hover:bg-[#B8252F] text-white rounded-md flex items-center gap-2 transition-colors"
                  type="button"
                  onClick={() => setShowCoverUploader(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={16}
                    height={16}
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"></path>
                  </svg>
                  <span>Add</span>
                </button>
              </div>

              {showCoverUploader && (
                <ProjectBannerUpload
                  onClose={() => setShowCoverUploader(false)}
                  includeInvalidRatios={false}
                  selectedRatioProp={selectedCoverRatios}
                  showAsModal={true}
                  label={coverImageLabel}
                  description={dynamicCoverDescription}
                  onContinue={(validImages) =>
                    handleCroppedImages(validImages, "cover")
                  }
                  allowVideos={false}
                />
              )}

              <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                <p className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200 bg-white">
                  <i className="bi bi-info-circle mr-1"></i> Cover images: Single image per aspect ratio
                </p>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">File Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Preview</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Ratio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {coverImageRatios.flatMap(({ key, label }) => {
                        const files = Array.isArray(formData[key])
                          ? formData[key]
                          : formData[key]
                          ? [formData[key]]
                          : [];

                        if (files.length === 0) return [];

                        return files.map((file, index) => {
                          const preview =
                            file.preview || file.document_url || file.url || file.file_url || "";
                          const name =
                            file.name ||
                            file.document_file_name ||
                            file.filename ||
                            `Cover Image ${index + 1}`;
                          const ratio = file.ratio || label;

                          return (
                            <tr key={`${key}-${index}`} className="border-b border-gray-100">
                              <td className="px-4 py-3 text-sm text-gray-900">{name}</td>
                              <td className="px-4 py-3">
                                {preview ? (
                                  <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-12 h-12 object-cover rounded"
                                    onError={(e) => {
                                      console.error(`Failed to load cover image: ${preview}`);
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      if (target.nextSibling) {
                                        (target.nextSibling as HTMLElement).style.display = "block";
                                      }
                                    }}
                                  />
                                ) : null}
                                <span 
                                  style={{ 
                                    display: preview ? "none" : "block",
                                  }}
                                  className="text-xs text-gray-500"
                                >
                                  No Preview
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{ratio}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  className="px-3 py-1 bg-[#C72030] hover:bg-[#B8252F] text-white text-sm rounded transition-colors disabled:opacity-50"
                                  disabled={removingImageId === file.id}
                                  onClick={async () => await handleImageRemoval(key, index)}
                                >
                                  {removingImageId === file.id ? 'Removing...' : 'Remove'}
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })}
                      {coverImageRatios.every(({ key }) => {
                        const files = Array.isArray(formData[key]) ? formData[key] : [];
                        return files.length === 0;
                      }) && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                            No cover images uploaded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Broadcast Images Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-medium text-gray-900 flex items-center">
                  Broadcast Images
                  <span
                    className="ml-2 text-xs text-gray-500 cursor-help relative group"
                    onMouseEnter={() => setShowAttachmentTooltip(true)}
                    onMouseLeave={() => setShowAttachmentTooltip(false)}
                  >
                    [i]
                    {showAttachmentTooltip && (
                      <span className="absolute left-0 top-6 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Max Upload Size 3 MB. Multiple images per aspect ratio (16:9, 1:1, 9:16, 3:2)
                      </span>
                    )}
                  </span>
                </h3>
                <button
                  className="px-4 py-2 bg-[#C72030] hover:bg-[#B8252F] text-white rounded-md flex items-center gap-2 transition-colors"
                  type="button"
                  onClick={() => setShowEventUploader(true)}
                    >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={16}
                    height={16}
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"></path>
                  </svg>
                  <span>Add</span>
                </button>
              </div>

              {showEventUploader && (
                <ProjectImageVideoUpload
                  onClose={() => setShowEventUploader(false)}
                  includeInvalidRatios={false}
                  selectedRatioProp={selectedNoticeRatios}
                  showAsModal={true}
                  label={noticeImageLabel}
                  description={dynamicNoticeDescription}
                  onContinue={(validImages) =>
                    handleCroppedImages(validImages, "notice")
                  }
                  allowVideos={false}
                />
              )}

              <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                <p className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200 bg-white">
                  <i className="bi bi-info-circle mr-1"></i> Broadcast images: Multiple images per aspect ratio are allowed
                </p>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">File Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Preview</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Ratio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {noticeboardImageRatios.flatMap(({ key, label }) => {
                        const files = Array.isArray(formData[key])
                          ? formData[key]
                          : formData[key]
                          ? [formData[key]]
                          : [];

                        if (files.length === 0) return [];

                        return files.map((file, index) => {
                          const preview =
                            file.preview || file.document_url || file.url || file.file_url || "";
                          const name =
                            file.name ||
                            file.document_file_name ||
                            file.filename ||
                            `Broadcast Image ${index + 1}`;
                          const ratio = file.ratio || label;

                          return (
                            <tr key={`${key}-${index}`} className="border-b border-gray-100">
                              <td className="px-4 py-3 text-sm text-gray-900">{name}</td>
                              <td className="px-4 py-3">
                                {preview ? (
                                  <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-12 h-12 object-cover rounded"
                                    onError={(e) => {
                                      console.error(`Failed to load broadcast image: ${preview}`);
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      if (target.nextSibling) {
                                        (target.nextSibling as HTMLElement).style.display = "block";
                                      }
                                    }}
                                  />
                                ) : null}
                                <span 
                                  style={{ 
                                    display: preview ? "none" : "block",
                                  }}
                                  className="text-xs text-gray-500"
                                >
                                  No Preview
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{ratio}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  className="px-3 py-1 bg-[#C72030] hover:bg-[#B8252F] text-white text-sm rounded transition-colors disabled:opacity-50"
                                  disabled={removingImageId === file.id}
                                  onClick={async () => await handleImageRemoval(key, index)}
                                >
                                  {removingImageId === file.id ? 'Removing...' : 'Remove'}
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })}
                      {noticeboardImageRatios.every(({ key }) => {
                        const files = Array.isArray(formData[key]) ? formData[key] : [];
                        return files.length === 0;
                      }) && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                            No broadcast images uploaded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={handleSubmit}
            type="submit"
            className="px-8 py-2.5 bg-[#C72030] hover:bg-[#B8252F] text-white font-medium rounded-md transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {isEdit ? 'Update' : 'Submit'}
          </button>
          <button
            type="button"
            className="px-8 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md transition-colors"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoticeboardForm;
