import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft, FileText, Calendar, Users, X, Plus, FileSpreadsheet, Upload, Download, Mail, Edit, Trash, Trash2, Info } from "lucide-react";
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
  Box,
  Avatar,
  Switch,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

const EventCreate = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    event_type: "",
    event_name: "",
    event_at: "",
    event_date: "",
    event_time: "",
    from_time: "",
    to_time: "",
    rsvp_action: "",
    description: "",
    publish: "",
    user_id: [],
    comment: "",
    shared: "all",
    group_id: [],
    attachfile: [],
    cover_image: [],
    is_important: false,
    email_trigger_enabled: false,
    set_reminders_attributes: [],
    cover_image_1_by_1: [],
    cover_image_9_by_16: [],
    cover_image_3_by_2: [],
    cover_image_16_by_9: [],
    event_images_1_by_1: [],
    event_images_9_by_16: [],
    event_images_3_by_2: [],
    event_images_16_by_9: [],
    show_on_home: false,
  });

  console.log("formData", formData);
  const [eventType, setEventType] = useState([]);
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
  const [showCsvTooltip, setShowCsvTooltip] = useState(false);
  const [showCoverImageTooltip, setShowCoverImageTooltip] = useState(false);
  const previewUrlsRef = useRef(new Map()); // Store preview URLs for cleanup

  // Image configurations from API
  const [imageConfigurations, setImageConfigurations] = useState({
    EventImage: [],
    EventCoverImage: [],
  });

  // Step management state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showPreviousSections, setShowPreviousSections] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const totalSteps = 3;
  const EVENT_DRAFT_STORAGE_KEY = 'event_create_draft';

  // Invite CPs state
  const [channelPartners, setChannelPartners] = useState([]);
  const [selectedChannelPartners, setSelectedChannelPartners] = useState([]);
  const [csvFiles, setCsvFiles] = useState([]);

  // Visibility state
  const [visibility, setVisibility] = useState({
    showOnHomePage: false,
    showOnProjectDetailPage: false,
    showOnBookingPage: false,
    featuredEvent: false,
  });

  // Fetch image configurations from API
  const fetchImageConfigurations = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/system_constants.json?q[description_eq]=ImagesConfiguration`,
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
          
          // Extract ratio from value (e.g., "event_images_16_by_9" -> "16:9")
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
        EventImage: ['16:9', '1:1', '9:16', '3:2'],
        EventCoverImage: ['16:9', '1:1', '9:16', '3:2'],
      });
    }
  };

  // Get dynamic ratios text for tooltips
  const getDynamicRatiosText = (configName) => {
    const ratios = imageConfigurations[configName] || [];
    if (ratios.length === 0) return "No ratios configured";
    return ratios.join(", ");
  };

  // QR Code Generation state
  const [qrCodeData, setQrCodeData] = useState([
    {
      id: 1,
      srNo: 1,
      cpName: "Kshitij Rasal",
      companyName: "ABD Tech",
      emailId: "kshitij.r@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp2-176700403055"
    },
    {
      id: 2,
      srNo: 2,
      cpName: "Sohail Ansari",
      companyName: "XYZ Ltd",
      emailId: "sohail.a@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp3-176700403056"
    },
    {
      id: 3,
      srNo: 3,
      cpName: "Hamza Quazi",
      companyName: "XYZ Ltd",
      emailId: "hamza.q@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp4-176700403056"
    },
    {
      id: 4,
      srNo: 4,
      cpName: "Shahab Mirza",
      companyName: "XYZ Ltd",
      emailId: "shahab.m@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp4-176700403056"
    }
  ]);

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

  const timeOptions = [
    // { value: "", label: "Select Unit" },
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

  const coverImageRatios = [
    { key: "cover_image_1_by_1", label: "1:1" },
    { key: "cover_image_16_by_9", label: "16:9" },
    { key: "cover_image_9_by_16", label: "9:16" },
    { key: "cover_image_3_by_2", label: "3:2" },
  ];

  const eventImageRatios = [
    { key: "event_images_1_by_1", label: "1:1" },
    { key: "event_images_16_by_9", label: "16:9" },
    { key: "event_images_9_by_16", label: "9:16" },
    { key: "event_images_3_by_2", label: "3:2" },
  ];

  const eventUploadConfig = {
    "cover image": ["16:9", "1:1", "9:16", "3:2"],
    "event images": ["16:9", "1:1", "9:16", "3:2"],
  };

  const coverImageType = "cover image";
  const selectedCoverRatios = eventUploadConfig[coverImageType] || [];
  const coverImageLabel = coverImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicCoverDescription = `Supports ${selectedCoverRatios.join(
    ", "
  )} aspect ratios`;

  const eventImageType = "event images";
  const selectedEventRatios = eventUploadConfig[eventImageType] || [];
  const eventImageLabel = eventImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicEventDescription = `Supports ${selectedEventRatios.join(
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
          ["cover", "event"].includes(type) ? "" : "s"
        } selected.`
      );
      return;
    }

    validImages.forEach((img) => {
      const formattedRatio = img.ratio.replace(":", "_by_");
      const prefix = type === "cover" ? "cover_image" : "event_images";
      const key = `${prefix}_${formattedRatio}`;
      updateFormData(key, [
        {
          file: img.file,
          name: img.file.name,
          preview: URL.createObjectURL(img.file),
          ratio: img.ratio,
          id: `${key}-${Date.now()}-${Math.random()}`, // Unique ID for each image
        },
      ]);
    });

    if (type === "cover") {
      setShowCoverUploader(false);
    } else {
      setShowEventUploader(false);
    }
  };

  const handleEventCroppedImages = (
    validImages,
    videoFiles = [],
    type = "cover"
  ) => {
    // Handle video files first
    if (videoFiles && videoFiles.length > 0) {
      videoFiles.forEach((video) => {
        const formattedRatio = video.ratio.replace(":", "_by_");
        const prefix = type === "cover" ? "cover_image" : "event_images";
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
      const formattedRatio = img.ratio.replace(":", "_by_");
      const prefix = type === "cover" ? "cover_image" : "event_images";
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
      setShowEventUploader(false);
    }
  };

  const closeModal = (type) => {
    let prefix = "";
    switch (type) {
      case "cover":
        prefix = coverImageType; // "gallery image"
        break;
      case "event":
        prefix = eventImageType; // "floor plan"
        break;
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

  const handleAttachmentRemoval = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachfile: prev.attachfile.filter((_, i) => i !== index),
    }));
  };

  console.log("formData", formData);

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

      // Check if the reminder has an ID (existing reminder)
      if (reminders[index]?.id) {
        // Mark the reminder for deletion by adding `_destroy: true`
        reminders[index]._destroy = true;
      } else {
        // Remove the reminder directly if it's a new one
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

  console.log("bb", eventUserID);
  console.log("groups", groups);

  // Handle input change for form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  //for files into array
  const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

    for (let file of selectedFiles) {
      const isImage = allowedImageTypes.includes(file.type);
      const isVideo = allowedVideoTypes.includes(file.type);

      // Type validation
      if (!isImage && !isVideo) {
        toast.error(
          `Invalid file type "${file.name}". Only JPG, PNG, GIF, WebP (images) or MP4, WebM, OGG (videos) allowed.`
        );
        e.target.value = "";
        return;
      }

      // Size validation
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        toast.error("Image size must be less than 3MB");
        e.target.value = "";
        return;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        toast.error("Video size must be less than 10MB");
        e.target.value = "";
        return;
      }
    }

    // All files are valid ✅
    setFormData((prevFormData) => ({
      ...prevFormData,
      attachfile: [...prevFormData.attachfile, ...selectedFiles],
    }));
  };

  useEffect(() => {
    console.log("Updated attachfile:", formData.attachfile);
  }, [formData.attachfile]);

  const handleRadioChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value, // Update the state with the radio button's value
    }));
  };

  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const fileData = selectedFiles.map((file) => ({
      file: file,
      name: file.name,
      type: file.type,
      url: file.type.startsWith("image") ? URL.createObjectURL(file) : null,
    }));
    setFiles([...files, ...fileData]);
  };

  const validateForm = (formData) => {
    const errors = [];

    if (!formData.event_name) {
      errors.push("Event Name is required.");
    }
    if (!formData.event_date) {
      errors.push("Event Date is required.");
    }
    if (!formData.event_time) {
      errors.push("Event Time is required.");
    }
    if (!formData.rsvp_action) {
      errors.push("RSVP Action is required.");
    }
    if (!formData.shared) {
      errors.push("Share With is required.");
    }
    
    // Validate shared with individual - require at least one user
    if (formData.shared === "individual" && (!formData.user_id || formData.user_id.length === 0)) {
      errors.push("Please select at least one user when sharing with individuals.");
    }
    
    // Validate shared with group - require at least one group
    if (formData.shared === "group" && (!formData.group_id || formData.group_id.length === 0)) {
      errors.push("Please select at least one group when sharing with groups.");
    }

    return errors;
  };

  // Validate Step 0 (Event Details)
  const validateStep0 = () => {
    toast.dismiss();
    const errors = [];

    if (!formData.event_name || !formData.event_name.trim()) {
      errors.push("Event Name is required.");
    }
    // if (!formData.event_type) {
    //   errors.push("Event Type is required.");
    // }
    if (!formData.event_date) {
      errors.push("Event Date is required.");
    }
    if (!formData.event_time) {
      errors.push("Event Time is required.");
    }
    if (!formData.rsvp_action) {
      errors.push("RSVP Action is required.");
    }
    if (!formData.shared) {
      errors.push("Share With is required.");
    }
    
    // Validate shared with individual - require at least one user
    if (formData.shared === "individual" && (!formData.user_id || formData.user_id.length === 0)) {
      errors.push("Please select at least one user when sharing with individuals.");
    }
    
    // Validate shared with group - require at least one group
    if (formData.shared === "group" && (!formData.group_id || formData.group_id.length === 0)) {
      errors.push("Please select at least one group when sharing with groups.");
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return false;
    }
    return true;
  };

  // Validate Step 1 (Event Images)
  const validateStep1 = () => {
    toast.dismiss();
    // Event images are optional, so no validation needed
    // You can add validation here if event images become mandatory
    return true;
  };

  // Validate Step 2 (Invite CPs) - only if RSVP is Yes
  const validateStep2 = () => {
    toast.dismiss();
    // Channel partner invitation is optional
    // You can add validation here if CP invitation becomes mandatory
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.dismiss();

    // const hasProjectBanner1by1 =
    //   formData.cover_image_16_by_9 &&
    //   formData.cover_image_16_by_9.some((img) => img.file instanceof File);

    // const hasEventBanner1by1 =
    //   formData.event_images_16_by_9 &&
    //   formData.event_images_16_by_9.some((img) => img.file instanceof File);

    // if (!hasProjectBanner1by1) {
    //   toast.error("Cover Image with 16:9 ratio is required.");
    //   setLoading(false);
    //   setIsSubmitting(false);
    //   return;
    // }

    // if (!hasEventBanner1by1) {
    //   toast.error("Event Image with 16:9 ratio is required.");
    //   setLoading(false);
    //   setIsSubmitting(false);
    //   return;
    // }

    const preparedReminders = prepareRemindersForSubmission();

    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      setLoading(false);
      return;
    }

    // Prepare FormData for multipart/form-data submission
    const formDataToSend = new FormData();

    // Add basic event fields
    formDataToSend.append("event[event_type]", formData.event_type || "");
    formDataToSend.append("event[event_name]", formData.event_name);
    formDataToSend.append("event[description]", formData.description || "");
    formDataToSend.append("event[event_at]", formData.event_at || "");
    
    // Combine date and time for from_time parameter
    let fromTime = "";
    if (formData.event_date && formData.event_time) {
      fromTime = `${formData.event_date}T${formData.event_time}`;
    } else if (formData.event_date) {
      fromTime = formData.event_date;
    }
    formDataToSend.append("event[from_time]", fromTime);
    formDataToSend.append("event[to_time]", formData.to_time || "");
    formDataToSend.append("event[shared]", formData.shared === "all" ? "0" : "1");
    formDataToSend.append("event[is_important]", formData.is_important === true ? "1" : "0");
    formDataToSend.append("event[email_trigger_enabled]", formData.email_trigger_enabled === true ? "1" : "0");
    formDataToSend.append("event[show_on_home]", formData.show_on_home === true ? "1" : "0");
    formDataToSend.append("event[active]", "true");

    // Add swusers (individual users) if shared with individuals
    if (formData.shared === "individual" && Array.isArray(formData.user_id)) {
      formData.user_id.forEach((id, index) => {
        formDataToSend.append(`event[swusers][]`, id);
      });
    } else if (formData.shared === "individual" && formData.user_id) {
      formDataToSend.append(`event[swusers][]`, formData.user_id);
    }

    // Add cpusers (channel partner users) from selected channel partners
    if (Array.isArray(selectedChannelPartners) && selectedChannelPartners.length > 0) {
      selectedChannelPartners.forEach((id, index) => {
        formDataToSend.append(`event[cpusers][]`, id);
      });
    }

    // Add cp_group_id if shared with groups
    if (formData.shared === "group" && Array.isArray(formData.group_id) && formData.group_id.length > 0) {
      formDataToSend.append("event[cp_group_id]", formData.group_id[0]);
    } else if (formData.shared === "group" && formData.group_id) {
      formDataToSend.append("event[cp_group_id]", formData.group_id);
    }

    // Add cover images (single file for each ratio)
    if (formData.cover_image_1_by_1 && formData.cover_image_1_by_1.length > 0) {
      const img = formData.cover_image_1_by_1[0];
      if (img.file) {
        formDataToSend.append("event[cover_image_1_by_1]", img.file);
      }
    }

    if (formData.cover_image_16_by_9 && formData.cover_image_16_by_9.length > 0) {
      const img = formData.cover_image_16_by_9[0];
      if (img.file) {
        formDataToSend.append("event[cover_image_16_by_9]", img.file);
      }
    }

    if (formData.cover_image_9_by_16 && formData.cover_image_9_by_16.length > 0) {
      const img = formData.cover_image_9_by_16[0];
      if (img.file) {
        formDataToSend.append("event[cover_image_9_by_16]", img.file);
      }
    }

    if (formData.cover_image_3_by_2 && formData.cover_image_3_by_2.length > 0) {
      const img = formData.cover_image_3_by_2[0];
      if (img.file) {
        formDataToSend.append("event[cover_image_3_by_2]", img.file);
      }
    }

    // Add event images (all ratios)
    if (formData.event_images_1_by_1 && formData.event_images_1_by_1.length > 0) {
      formData.event_images_1_by_1.forEach((img) => {
        if (img.file) {
          formDataToSend.append("event[event_images_1_by_1][]", img.file);
        }
      });
    }

    if (formData.event_images_16_by_9 && formData.event_images_16_by_9.length > 0) {
      formData.event_images_16_by_9.forEach((img) => {
        if (img.file) {
          formDataToSend.append("event[event_images_16_by_9][]", img.file);
        }
      });
    }

    if (formData.event_images_9_by_16 && formData.event_images_9_by_16.length > 0) {
      formData.event_images_9_by_16.forEach((img) => {
        if (img.file) {
          formDataToSend.append("event[event_images_9_by_16][]", img.file);
        }
      });
    }

    if (formData.event_images_3_by_2 && formData.event_images_3_by_2.length > 0) {
      formData.event_images_3_by_2.forEach((img) => {
        if (img.file) {
          formDataToSend.append("event[event_images_3_by_2][]", img.file);
        }
      });
    }

    // Add attachments
    if (formData.attachfile && formData.attachfile.length > 0) {
      formData.attachfile.forEach((file) => {
        if (file.file) {
          formDataToSend.append("event[attachfile][]", file.file);
        } else if (file instanceof File) {
          formDataToSend.append("event[attachfile][]", file);
        }
      });
    }

    // Add reminders
    if (preparedReminders && preparedReminders.length > 0) {
      preparedReminders.forEach((reminder, index) => {
        Object.keys(reminder).forEach((key) => {
          formDataToSend.append(`event[set_reminders_attributes][${index}][${key}]`, reminder[key]);
        });
      });
    }

    console.log("FormData entries:");
    for (let pair of formDataToSend.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const response = await axios.post(`${baseURL}/crm/admin/events.json`, formDataToSend, {
        headers: {
                      Authorization: getAuthHeader(),
                      "Content-Type": "multipart/form-data",
                    },
      });
      toast.success("Event created successfully!");
      setFormData({
        event_type: "",
        event_name: "",
        event_at: "",
        event_date: "",
        event_time: "",
        from_time: "",
        to_time: "",
        rsvp_action: "",
        description: "",
        publish: "",
        user_id: [],
        comment: "",
        shared: "all",
        group_id: [],
        attachfile: [],
        cover_image: [],
        is_important: false,
        email_trigger_enabled: false,
        set_reminders_attributes: [],
        cover_image_1_by_1: [],
        cover_image_9_by_16: [],
        cover_image_3_by_2: [],
        cover_image_16_by_9: [],
        event_images_1_by_1: [],
        event_images_9_by_16: [],
        event_images_3_by_2: [],
        event_images_16_by_9: [],
        show_on_home: false,
      });
      setSelectedChannelPartners([]);

      navigate("/maintenance/event-list");
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
    const fetchEvent = async () => {
      const url = `${baseURL}/events.json`;

      try {
        const response = await axios.get(
          `${baseURL}/events.json`,

          {
            headers: {
                   Authorization: getAuthHeader(),
                   "Content-Type": "multipart/form-data",
                 },
          }
        );

        setEventType(response?.data?.events);
        console.log("eventType", eventType);
      } catch (error) {
        console.error("Error fetching Event:", error);
      }
    };

    fetchEvent();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/usergroups/cp_members_list.json`,
          {
             headers: {
                      Authorization: getAuthHeader(),
                      "Content-Type": "multipart/form-data",
                    },
          }
        );

        setEventUserID(response?.data || []);
        console.log("eventUserID", response?.data);
      } catch (error) {
        console.error("Error fetching Users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Fetching projects from:", `${baseURL}/projects_for_dropdown.json`);
        const response = await axios.get(
          `${baseURL}/projects_for_dropdown.json`,
          {
             headers: {
                          Authorization: getAuthHeader(),
                          "Content-Type": "application/json",
                        },
          }
        );
        console.log("Projects API Response:", response.data);
        console.log("Projects array:", response.data.projects);
        setProjects(response.data.projects || []);
      } catch (error) {
        console.error(
          "Error fetching projects:",
          error.response?.data || error.message
        );
        console.error("Full error:", error);
      }
    };

    fetchProjects();
  }, []);

  const handleCancel = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`${baseURL}/crm/usergroups.json?q[group_type_eq]=cp`, {
          headers: {
                   Authorization: getAuthHeader(),
                   "Content-Type": "multipart/form-data",
                 },
        });

        const groupsData = response.data.usergroups || [];
        setGroups(groupsData);
        console.log("Fetched Groups:", groupsData);
      } catch (error) {
        console.error("Error fetching Groups:", error);
      }
    };

    if (formData.shared === "group" && groups.length === 0) {
      fetchGroups();
    }
  }, [formData.shared]);

  // Fetch Channel Partners
  useEffect(() => {
    const fetchChannelPartners = async () => {
      try {
        const response = await axios.get(`${baseURL}/channel_partners.json`, {
          headers: {
                   Authorization: getAuthHeader(),
                   "Content-Type": "multipart/form-data",
                 },
        });

        const partnersData = Array.isArray(response.data)
          ? response.data
          : response.data.channel_partners || [];
        setChannelPartners(partnersData);
        console.log("Fetched Channel Partners:", partnersData);
      } catch (error) {
        console.error("Error fetching Channel Partners:", error);
        // Set empty array on error
        setChannelPartners([]);
      }
    };

    fetchChannelPartners();
    fetchImageConfigurations();
  }, []);

  const handleCoverImageUpload = (newImageList) => {
    if (!newImageList || newImageList.length === 0) return;

    const file = newImageList[0].file;
    if (!file) return;

    // Check if it's an image file
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      toast.error("Please upload a valid image file");
      return;
    }

    // Check file size (3MB limit)
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size must be less than 3MB");
      return;
    }

    setImage(newImageList);
    setDialogOpen(true);
  };

  const handleAttachmentUpload = (e) => {
    const files = Array.from(e.target.files);

    const newAttachments = files.map((file) => {
      const isVideo = file.type.includes("video") || file.name.endsWith(".mp4");
      return {
        file,
        name: file.name,
        type: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
        preview: URL.createObjectURL(file),
        size: file.size,
      };
    });

    setFormData((prev) => ({
      ...prev,
      attachfile: [...(prev.attachfile || []), ...newAttachments],
    }));
  };

  // CSV File Upload Handler
  const handleCsvFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const isValidType = file.name.endsWith('.csv') || 
                          file.name.endsWith('.xlsx') || 
                          file.name.endsWith('.xls');
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid CSV/Excel file`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setCsvFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) uploaded successfully`);
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeCsvFile = (index) => {
    setCsvFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('File removed');
  };

  // QR Code handlers
  const handleDownloadQRCode = (qrCodeId, cpName) => {
    toast.success(`Downloading QR Code for ${cpName}`);
    // Implementation for downloading individual QR code
    console.log('Download QR Code:', qrCodeId);
  };

  const handleSendQRCodeEmail = (email, cpName) => {
    toast.success(`Sending QR Code to ${email}`);
    // Implementation for sending QR code via email
    console.log('Send QR Code to:', email);
  };

  const handleDownloadAllQRCodes = () => {
    toast.success('Downloading all QR Codes');
    // Implementation for downloading all QR codes
    console.log('Download All QR Codes');
  };

  const handleSendAllQRCodesEmail = () => {
    toast.success('Sending QR Codes to all channel partners');
    // Implementation for sending all QR codes via email
    console.log('Send All QR Codes via Email');
  };

  // Step navigation functions
  const goToNextStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowPreviousSections(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step)) {
      setCurrentStep(step);
      setShowPreviousSections(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (step: number) => {
    // In preview mode, clicking steps should scroll to sections instead of changing step
    if (isPreviewMode) {
      const ids = ['section-event-details', 'section-invite-cps', 'section-qr-code', 'section-event-images'] as const;
      const target = document.getElementById(ids[step]);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // Prevent clicking on future steps without completing previous steps
    if (step > currentStep) {
      for (let i = 0; i < step; i++) {
        if (!completedSteps.includes(i)) {
          toast.error(`Please complete step ${i + 1} before proceeding to step ${step + 1}.`);
          return;
        }
      }
    }

    if (step > currentStep) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
    }
    setCurrentStep(step);
    setShowPreviousSections(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleProceedToSave = () => {
    // Validate current step before proceeding
    let isValid = false;
    
    switch (currentStep) {
      case 0:
        isValid = validateStep0();
        break;
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      default:
        isValid = true;
    }

    // If validation fails, don't proceed
    if (!isValid) {
      return;
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    // If on Step 0 (Event Details) and RSVP is No, skip to Step 1 (Event Images)
    if (currentStep === 0 && formData.rsvp_action === "0") {
      setCurrentStep(1);
      setShowPreviousSections(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If on Step 0 (Event Details) and RSVP is Yes, go to Step 1 (Event Images)
    if (currentStep === 0 && formData.rsvp_action === "1") {
      setCurrentStep(1);
      setShowPreviousSections(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If on Step 1 (Event Images) and RSVP is Yes, go to Step 2 (Invite CPs)
    if (currentStep === 1 && formData.rsvp_action === "1") {
      setCurrentStep(2);
      setShowPreviousSections(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If on Step 1 (Event Images) and RSVP is No, go directly to preview
    if (currentStep === 1 && formData.rsvp_action === "0") {
      setIsPreviewMode(true);
      setShowPreviousSections(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If on Step 2 (Invite CPs), go to preview
    if (currentStep === totalSteps - 1) {
      setIsPreviewMode(true);
      setShowPreviousSections(true);
    } else {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      }
      setShowPreviousSections(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToDraft = () => {
    // Validate current step before saving to draft
    let isValid = false;
    
    switch (currentStep) {
      case 0:
        isValid = validateStep0();
        break;
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      default:
        isValid = true;
    }

    // If validation fails, don't save to draft
    if (!isValid) {
      return;
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    // If on Step 0 (Event Details) and RSVP is No, skip to Step 1 (Event Images)
    if (currentStep === 0 && formData.rsvp_action === "0") {
      setCurrentStep(1);
      setShowPreviousSections(true);
      toast.success("Progress saved to draft successfully!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
    setShowPreviousSections(true);
    toast.success("Progress saved to draft successfully!");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stepper component
  const StepperComponent = () => {
    const steps = formData.rsvp_action === "1" 
      ? ['Event Details', 'Event Related Images', 'Invite CPs']
      : ['Event Details', 'Event Related Images'];

    return (
      <Box sx={{ mb: 4, width: '100%' }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          width: '100%',
          gap: 0
        }}>
          {steps.map((label, index) => (
            <Box key={`step-${index}`} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: '50px',
                  padding: '5px',
                  borderRadius: '4px',
                  boxShadow: '0px 4px 14.2px 0px rgba(0, 0, 0, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  onClick={() => handleStepClick(index)}
                  sx={{
                    cursor: (index > currentStep && !completedSteps.includes(index - 1)) ? 'not-allowed' : 'pointer',
                    width: '100%',
                    height: '40px',
                    backgroundColor: (index === currentStep || completedSteps.includes(index)) ? '#C72030' :
                      (index > currentStep && !completedSteps.includes(index - 1)) ? 'rgba(245, 245, 245, 1)' : 'rgba(255, 255, 255, 1)',
                    color: (index === currentStep || completedSteps.includes(index)) ? 'white' :
                      (index > currentStep && !completedSteps.includes(index - 1)) ? 'rgba(150, 150, 150, 1)' : 'rgba(196, 184, 157, 1)',
                    border: (index === currentStep || completedSteps.includes(index)) ? '2px solid #C72030' :
                      (index > currentStep && !completedSteps.includes(index - 1)) ? '1px solid rgba(200, 200, 200, 1)' : '1px solid rgba(196, 184, 157, 1)',
                    padding: '12px 20px',
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: index === currentStep ? '0 2px 4px rgba(199, 32, 48, 0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Work Sans, sans-serif',
                    position: 'relative',
                    borderRadius: '4px',
                    '&:hover': {
                      opacity: (index > currentStep && !completedSteps.includes(index - 1)) ? 1 : 0.9
                    },
                    '&::before': completedSteps.includes(index) && index !== currentStep ? {
                      content: '"✓"',
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    } : {}
                  }}
                >
                  {label}
                </Box>
              </Box>
              {index < steps.length - 1 && (
                <Box
                  sx={{
                    width: '60px',
                    minWidth: '60px',
                    height: '0px',
                    border: '1px dashed rgba(196, 184, 157, 1)',
                    borderWidth: '1px',
                    borderStyle: 'dashed',
                    borderColor: 'rgba(196, 184, 157, 1)',
                    opacity: 1,
                    margin: '0',
                    '@media (max-width: 1200px)': {
                      width: '40px',
                      minWidth: '40px'
                    },
                    '@media (max-width: 900px)': {
                      width: '30px',
                      minWidth: '30px'
                    },
                    '@media (max-width: 600px)': {
                      width: '20px',
                      minWidth: '20px'
                    }
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back To Event List</span>
        </button>
      </div>

      {/* Stepper Component - Hide in preview mode */}
      {!isPreviewMode && <StepperComponent />}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        {/* Step 1: Event Information */}
        {currentStep === 0 && !isPreviewMode && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#E5E0D3',
                    mr: 1.5
                  }}
                >
                  <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                </Avatar>
                Event Details
              </h2>
            </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Project Select */}
              {/* <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Project</InputLabel>
                <MuiSelect
                  value={selectedProjectId || ""}
                  onChange={(e) => {
                    console.log("Project selected:", e.target.value);
                    setSelectedProjectId(e.target.value);
                  }}
                  label="Project"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Project</MenuItem>
                  {console.log("Rendering projects dropdown, count:", projects.length)}
                  {projects.map((project) => {
                    console.log("Project item:", project);
                    return (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    );
                  })}
                </MuiSelect>
              </FormControl> */}

              {/* Event Type */}
              {/* <TextField
                label="Event Type"
                placeholder="Enter Event Type"
                value={formData.event_type}
                onChange={handleChange}
                name="event_type"
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
              /> */}

              {/* Event Name */}
              <TextField
                label="Event Name"
                placeholder="Enter Event Name"
                value={formData.event_name}
                onChange={handleChange}
                name="event_name"
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

              {/* Event At */}
              <TextField
                label="Event At"
                placeholder="Enter Event At"
                value={formData.event_at}
                onChange={handleChange}
                name="event_at"
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
              <TextField
                label="Event Date"
                type="date"
                value={formData.event_date}
                onChange={handleChange}
                name="event_date"
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

              <div className="md:col-span-2">            
               <TextField
                  label="Event Description"
                  placeholder="Enter Description"
                  value={formData.description}
                  onChange={handleChange}
                  name="description"
                  fullWidth
                  // multiline
                  rows={3}
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  // sx={{
                  //   '& .MuiOutlinedInput-root': {
                  //     minHeight: '90px',
                  //     alignItems: 'flex-start',
                  //     '& fieldset': {
                  //       borderColor: '#ddd',
                  //     },
                  //     '&:hover fieldset': {
                  //       borderColor: '#C72030',
                  //     },
                  //     '&.Mui-focused fieldset': {
                  //       borderColor: '#C72030',
                  //     },
                  //   },
                  //   '& .MuiInputLabel-root': {
                  //     '&.Mui-focused': {
                  //       color: '#C72030',
                  //     },
                  //   },
                  // }}
                />
                </div>

              {/* Event From */}
              <TextField
                label="Event Time"
                type="time"
                value={formData.event_time}
                onChange={handleChange}
                name="event_time"
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

            {/* 4-column grid for Event To, Mark Important, Send Email, RSVP Action */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Event To */}
              

              {/* Mark Important */}
              {/* <div>
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
              </div> */}

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

              {/* RSVP Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RSVP Action</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="rsvp_action"
                      value="1"
                      checked={formData.rsvp_action === "1"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="rsvp_action"
                      value="0"
                      checked={formData.rsvp_action === "0"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

             
              {/* <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Set Reminders</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiInputBase-root': fieldStyles }}
                  >
                    <InputLabel shrink>Select Unit</InputLabel>
                    <MuiSelect
                      value={reminderUnit || ""}
                      onChange={(e) => {
                        setReminderUnit(e.target.value);
                        setReminderValue("");
                      }}
                      label="Select Unit"
                      notched
                      displayEmpty
                    >
                      <MenuItem value="">Select Unit</MenuItem>
                      {timeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                  <TextField
                    label="Value"
                    type="number"
                    placeholder="Enter Value"
                    value={reminderValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const constraints = timeConstraints[reminderUnit] || { min: 0, max: Infinity };
                      if (val >= constraints.min && val <= constraints.max) {
                        setReminderValue(e.target.value);
                      }
                    }}
                    disabled={!reminderUnit}
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
                  <button
                    type="button"
                    className="px-6 py-2 bg-[#C72030] text-white rounded hover:bg-[#B8252F] transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-[45px]"
                    onClick={handleAddReminder}
                    disabled={!reminderValue || !reminderUnit}
                  >
                    + Add
                  </button>
                </div>

              
                {formData.set_reminders_attributes
                  .filter((reminder) => !reminder._destroy)
                  .map((reminder, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <FormControl
                        fullWidth
                        variant="outlined"
                        disabled
                        sx={{ '& .MuiInputBase-root': fieldStyles }}
                      >
                        <InputLabel shrink>Unit</InputLabel>
                        <MuiSelect
                          value={reminder.unit}
                          label="Unit"
                          notched
                        >
                          {timeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </MuiSelect>
                      </FormControl>
                      <TextField
                        label="Value"
                        type="number"
                        value={reminder.value}
                        fullWidth
                        variant="outlined"
                        disabled
                        slotProps={{
                          inputLabel: {
                            shrink: true,
                          },
                        }}
                        InputProps={{
                          sx: fieldStyles,
                        }}
                      />
                      <button
                        type="button"
                        className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium h-[45px]"
                        onClick={() => handleRemoveReminder(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div> */}

              
              {/* Share With section moved to Step 2: Invite CPs */}
            </div>
          </div>
        </div>
        )}

        {/* Visibility Card */}
        {currentStep === 0 && !isPreviewMode && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#E5E0D3',
                    mr: 1.5
                  }}
                >
                  <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                </Avatar>
                Visibility
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Show on Home Page */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Show on Home Page</h3>
                  <p className="text-sm text-gray-500">Display this event on the home page</p>
                </div>
                <Switch
                  checked={formData.show_on_home}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_on_home: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#C72030',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#C72030',
                    },
                  }}
                />
                    {/* <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 22 14" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z" fill="#DEDEDE"/>
                    <g filter="url(#filter0_dd_2611_3818)">
                      <path fillRule="evenodd" clipRule="evenodd" d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z" fill="#C72030"/>
                      <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke="url(#paint0_linear_2611_3818)" strokeWidth="0.255453"/>
                      <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke="url(#paint1_linear_2611_3818)" strokeWidth="0.255453"/>
                    </g>
                    <defs>
                      <filter id="filter0_dd_2611_3818" x="-8.54731e-05" y="-0.000329614" width="12.2619" height="13.2842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="1.02181"/>
                        <feGaussianBlur stdDeviation="0.510907"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2611_3818"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset/>
                        <feGaussianBlur stdDeviation="0.510907"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                        <feBlend mode="normal" in2="effect1_dropShadow_2611_3818" result="effect2_dropShadow_2611_3818"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_2611_3818" result="shape"/>
                      </filter>
                      <linearGradient id="paint0_linear_2611_3818" x1="1.07172" y1="1.02148" x2="1.07172" y2="11.1396" gradientUnits="userSpaceOnUse">
                        <stop stopOpacity="0"/>
                        <stop offset="0.8" stopOpacity="0.02"/>
                        <stop offset="1" stopOpacity="0.04"/>
                      </linearGradient>
                      <linearGradient id="paint1_linear_2611_3818" x1="1.02173" y1="1.02148" x2="1.02173" y2="11.2396" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" stopOpacity="0.12"/>
                        <stop offset="0.2" stopColor="white" stopOpacity="0.06"/>
                        <stop offset="1" stopColor="white" stopOpacity="0"/>
                      </linearGradient>
                    </defs> */}
              </div>

              {/* Show on Project Detail Page */}
              {/* <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Show on Project Detail Page</h3>
                  <p className="text-sm text-gray-500">Display this event on individual project detail pages</p>
                </div>
                <Switch
                  checked={visibility.showOnProjectDetailPage}
                  onChange={(e) => setVisibility(prev => ({ ...prev, showOnProjectDetailPage: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#C72030',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#C72030',
                    },
                  }}
                />
              </div> */}

              {/* Show on Booking Page */}
              {/* <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Show on Booking Page</h3>
                  <p className="text-sm text-gray-500">Display this event on the home page</p>
                </div>
                <Switch
                  checked={visibility.showOnBookingPage}
                  onChange={(e) => setVisibility(prev => ({ ...prev, showOnBookingPage: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#C72030',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#C72030',
                    },
                  }}
                />
              </div> */}

              {/* Featured Event */}
              {/* <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Featured Event</h3>
                  <p className="text-sm text-gray-500">Mark as a featured event for priority display</p>
                </div>
                <Switch
                  checked={visibility.featuredEvent}
                  onChange={(e) => setVisibility(prev => ({ ...prev, featuredEvent: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#C72030',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#C72030',
                    },
                  }}
                />
              </div> */}
            </div>
          </div>
        )}

        {/* Step 3: Invite CPs */}
        {currentStep === 2 && !isPreviewMode && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#E5E0D3',
                    mr: 1.5
                  }}
                >
                  <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                </Avatar>
                Invite CPs
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Channel Partners Dropdown */}
              {/* <div>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ '& .MuiInputBase-root': fieldStyles }}
                >
                  <InputLabel shrink>Select Channel Partners</InputLabel>
                  <MuiSelect
                    multiple
                    value={selectedChannelPartners}
                    onChange={(e) => setSelectedChannelPartners(e.target.value)}
                    label="Select Channel Partners"
                    notched
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0) {
                        return <span style={{ color: '#999' }}>Select Channel Partners</span>;
                      }
                      return selected
                        .map((id) => {
                          const partner = channelPartners.find((cp) => cp.id === id || cp.id.toString() === id.toString());
                          return partner ? partner.name || partner.company_name || `Partner ${id}` : id;
                        })
                        .join(", ");
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select Channel Partners
                    </MenuItem>
                    {channelPartners.map((partner) => (
                      <MenuItem key={partner.id} value={partner.id}>
                        {partner.name || partner.company_name || `Partner ${partner.id}`}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div> */}

              {/* Share With Section */}
              <div>
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
                          user_id: [],
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
                          user_id: [],
                        }))
                      }
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className="ml-2 text-sm text-gray-700">Groups</span>
                  </label>
                </div>

                {formData.shared === "individual" && (
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiInputBase-root': fieldStyles }}
                  >
                    <InputLabel shrink>Event User ID</InputLabel>
                    <MuiSelect
                      multiple
                      value={Array.isArray(formData.user_id) ? formData.user_id : []}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          user_id: e.target.value,
                        }));
                      }}
                      label="Event User ID"
                      notched
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected || selected.length === 0) {
                          return <span style={{ color: '#999' }}>Select Users</span>;
                        }
                        return selected
                          .map((id) => {
                            const user = eventUserID.find((u) => u.id === id || u.id === id || u.id.toString() === id.toString().toString());
                            return user ? `${user.firstname} ${user.lastname}` : id;
                          })
                          .join(", ");
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select Users
                      </MenuItem>
                      {eventUserID.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.firstname} {user.lastname}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                )}
                {formData.shared === "group" && (
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiInputBase-root': fieldStyles }}
                  >
                    <InputLabel shrink>Share with Groups</InputLabel>
                    <MuiSelect
                      multiple
                      value={Array.isArray(formData.group_id) ? formData.group_id : []}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          group_id: e.target.value,
                        }));
                      }}
                      label="Share with Groups"
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

              {/* OR Divider */}
              <div className="flex items-center justify-center">
                <span className="text-sm font-medium text-gray-500">Or</span>
              </div>

              {/* CSV File Upload Section */}
              <div 
                className="relative"
                onMouseEnter={() => setShowCsvTooltip(true)}
                onMouseLeave={() => setShowCsvTooltip(false)}
              >
                {showCsvTooltip && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                    Coming Soon...
                  </div>
                )}
                {/* <label className="block text-sm font-semibold mb-4 text-[#1a1a1a]">Upload CSV File</label> */}
                <div className="border-2 border-dashed border-[#D9D9D9] rounded-lg p-6 min-h-[200px] opacity-50 pointer-events-none cursor-not-allowed">
                  {csvFiles.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {csvFiles.map((file, index) => {
                        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
                        const isCsv = file.name.endsWith('.csv');

                        return (
                          <div
                            key={`${file.name}-${file.lastModified}`}
                            className="relative flex flex-col items-center border rounded-md pt-6 px-2 pb-3 w-[130px] bg-[#F6F4EE] shadow-sm"
                          >
                            {isExcel ? (
                              <div className="w-20 h-20 flex items-center justify-center border rounded text-green-600 bg-white mb-1">
                                <FileSpreadsheet className="w-8 h-8" />
                              </div>
                            ) : isCsv ? (
                              <div className="w-20 h-20 flex items-center justify-center border rounded text-blue-600 bg-white mb-1">
                                <FileText className="w-8 h-8" />
                              </div>
                            ) : (
                              <div className="w-20 h-20 flex items-center justify-center bg-gray-100 border rounded text-gray-500 mb-1">
                                <FileText className="w-8 h-8" />
                              </div>
                            )}
                            <span className="text-[10px] text-center truncate max-w-[100px] mb-1">{file.name}</span>
                            <button
                              type="button"
                              className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-600 bg-white rounded-full border border-gray-300 flex items-center justify-center hover:bg-red-100 hover:text-red-600"
                              onClick={() => removeCsvFile(index)}
                              disabled={loading}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                      <div className="text-[#C72030]">
                        <Upload className="w-12 h-12" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[#C72030] mb-1">Choose CSV File</p>
                        <p className="text-xs text-gray-500">CSV should include: Name, Email, Company</p>
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          multiple
                          onChange={handleCsvFileUpload}
                          className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#C72030] text-white rounded hover:bg-[#B8252F] transition-colors text-sm font-medium">
                          <Upload className="w-4 h-4" />
                          Upload Files
                        </span>
                      </label>
                    </div>
                  )}
                  
                  {/* Add More Files Button when files exist */}
                  {csvFiles.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          multiple
                          onChange={handleCsvFileUpload}
                          className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#C72030] text-white rounded hover:bg-[#B8252F] transition-colors text-sm font-medium">
                          <Plus className="w-4 h-4" />
                          Add More Files
                        </span>
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">CSV should include: Name, Email, Company</p>
              </div>
            </div>
          </div>
        )}



        {/* Step 2: Event Related Images */}
        {currentStep === 1 && !isPreviewMode && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#E5E0D3',
                    mr: 1.5
                  }}
                >
                  <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                </Avatar>
                Event Related Images
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Event Cover Image */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h5 className="text-base font-semibold inline-flex items-center gap-1">
                    Event Cover Image{" "}
                    <span
                      className="relative inline-block cursor-pointer"
                      onMouseEnter={() => setShowCoverImageTooltip(true)}
                      onMouseLeave={() => setShowCoverImageTooltip(false)}
                    >
                      <Info className="w-5 h-5 fill-black text-white" />
                      {showCoverImageTooltip && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 3 MB. Supports {getDynamicRatiosText("EventCoverImage")} aspect ratios
                        </span>
                      )}
                    </span>
                  </h5>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59] transition-colors"
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
                            <TableCell className="py-3 px-4 font-medium">{file.name || file.document_file_name || `Image ${index + 1}`}</TableCell>
                            <TableCell className="py-3 px-4">
                              <img
                                style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                className="rounded border border-gray-200"
                                src={file.preview || file.document_url}
                                alt={file.name}
                              />
                            </TableCell>
                            <TableCell className="py-3 px-4">{file.ratio || label}</TableCell>
                            <TableCell className="py-3 px-4">
                              <button
                                type="button"
                                // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                onClick={() => handleImageRemoval(key, index, file.id)}
                              >
                               <Trash2 className="w-4 h-4 text-[#C72030]" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ));
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Event Attachment */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h5 className="text-base font-semibold inline-flex items-center gap-1">
                    Event Attachment{" "}
                    <span
                      className="relative inline-block cursor-pointer"
                      onMouseEnter={() => setShowAttachmentTooltip(true)}
                      onMouseLeave={() => setShowAttachmentTooltip(false)}
                    >
                      <Info className="w-5 h-5 fill-black text-white" />
                      {showAttachmentTooltip && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 3 MB (Images), 10 MB (Videos). Supports {getDynamicRatiosText("EventImage")} aspect ratios
                        </span>
                      )}
                    </span>
                  </h5>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59] transition-colors"
                    type="button"
                    onClick={() => setShowEventUploader(true)}
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
                      {eventImageRatios.map(({ key, label }) =>
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
                                      <Trash2 className="w-4 h-4 text-[#C72030]" />
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
        )}

        {/* Navigation Buttons - Show on all steps except preview mode */}
        {!isPreviewMode && (
          <>
            <div className="flex gap-4 justify-center pt-6">
              <button
                type="button"
                onClick={handleProceedToSave}
                className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
              >
                Proceed to save
              </button>
              <button
                type="button"
                onClick={handleSaveToDraft}
                className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
              >
                Save to draft
              </button>
            </div>
            {currentStep > 0 && (
              <>
                <div className="w-full border-t border-[#C4B89D] my-4" style={{ borderTopWidth: '0.5px' }}></div>
                <div className="text-center text-sm text-gray-600">
                  You've completed {completedSteps.length} out of {totalSteps} steps.
                </div>
              </>
            )}
          </>
        )}

        {/* Completed Sections - Show completed steps below current step */}
        {!isPreviewMode && completedSteps.length > 0 && currentStep > 0 && (
          <div className="mt-8 space-y-6">
            {completedSteps.filter(step => step < currentStep).map((stepIndex) => (
              <div key={`completed-section-${stepIndex}`}>
                {/* Step 1: Event Details - Completed */}
                {stepIndex === 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#F6F4EE' }}>
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#E5E0D3',
                            mr: 1.5
                          }}
                        >
                          <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                        </Avatar>
                        Event Details
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(0);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-8 px-3 text-[12px] border border-[#bf213e] hover:bg-[#F6F4EE] flex items-center gap-1 bg-white"
                      >
                        <Edit className="w-4 h-4 text-[#bf213e]" /> <span className="text-[#bf213e]">Edit</span> 
                      </button>
                    </div>
                    <div className="p-6 space-y-6 opacity-75 pointer-events-none">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Project */}
                            {/* <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                              <InputLabel shrink>Project</InputLabel>
                              <MuiSelect
                                value={selectedProjectId || ""}
                                label="Project"
                                notched
                                displayEmpty
                                disabled
                              >
                                <MenuItem value="">Select Project</MenuItem>
                                {projects.map((project) => (
                                  <MenuItem key={project.id} value={project.id}>
                                    {project.project_name}
                                  </MenuItem>
                                ))}
                              </MuiSelect>
                            </FormControl> */}

                            {/* Event Name */}
                            <TextField
                              label="Event Name"
                              value={formData.event_name}
                              fullWidth
                              variant="outlined"
                              disabled
                              slotProps={{ inputLabel: { shrink: true } }}
                              InputProps={{ sx: fieldStyles }}
                            />

                            {/* Event At */}
                            <TextField
                              label="Event At"
                              value={formData.event_at}
                              fullWidth
                              variant="outlined"
                              disabled
                              slotProps={{ inputLabel: { shrink: true } }}
                              InputProps={{ sx: fieldStyles }}
                            />
                             <TextField
                label="Event Date"
                type="date"
                value={formData.event_date}
                onChange={handleChange}
                name="event_date"
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

                            {/* Event Description */}
                            <div className="md:col-span-2">
                              <TextField
                                label="Event Description"
                                value={formData.description}
                                fullWidth
                                variant="outlined"
                                disabled
                                slotProps={{ inputLabel: { shrink: true } }}
                              />
                            </div>

                             <TextField
                label="Event Time"
                type="time"
                value={formData.event_time}
                onChange={handleChange}
                name="event_time"
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

                            {/* Event From */}
                          
                          </div>

                          {/* 4-column grid for Event To, Mark Important, Send Email, RSVP Action */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Event To */}
                          

                            {/* Mark Important */}
                            {/* <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Mark Important</label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={formData.is_important === true}
                                    disabled
                                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                                    style={{ accentColor: '#C72030' }}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={formData.is_important === false}
                                    disabled
                                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                                    style={{ accentColor: '#C72030' }}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">No</span>
                                </label>
                              </div>
                            </div> */}

                            {/* Send Email */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Send Email</label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={formData.email_trigger_enabled === "true"}
                                    disabled
                                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                                    style={{ accentColor: '#C72030' }}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={formData.email_trigger_enabled === "false"}
                                    disabled
                                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                                    style={{ accentColor: '#C72030' }}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">No</span>
                                </label>
                              </div>
                            </div>

                            {/* RSVP Action */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">RSVP Action</label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={formData.rsvp_action === "1"}
                                    disabled
                                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                                    style={{ accentColor: '#C72030' }}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={formData.rsvp_action === "0"}
                                    disabled
                                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                                    style={{ accentColor: '#C72030' }}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">No</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Share With */}
                          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Share With</label>
                              <div className="flex gap-6 mb-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={formData.shared === "all"}
                                    disabled
                                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                                    style={{ accentColor: '#C72030' }}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">All</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={formData.shared === "individual"}
                                    disabled
                                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                                    style={{ accentColor: '#C72030' }}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Individuals</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={formData.shared === "group"}
                                    disabled
                                    className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                                    style={{ accentColor: '#C72030' }}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Groups</span>
                                </label>
                              </div>

                              {formData.shared === "individual" && (
                                <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                                  <InputLabel shrink>Event User ID</InputLabel>
                                  <MuiSelect
                                    multiple
                                    value={Array.isArray(formData.user_id) ? formData.user_id : []}
                                    label="Event User ID"
                                    notched
                                    displayEmpty
                                    disabled
                                    renderValue={(selected) => {
                                      if (!selected || selected.length === 0) {
                                        return <span style={{ color: '#999' }}>Select Users</span>;
                                      }
                                      return selected
                                        .map((id) => {
                                          const user = eventUserID.find((u) => u.id === id || u.id === id || u.id.toString() === id.toString().toString());
                                          return user ? `${user.firstname} ${user.lastname}` : id;
                                        })
                                        .join(", ");
                                    }}
                                  >
                                    {eventUserID.map((user) => (
                                      <MenuItem key={user.id} value={user.id}>
                                        {user.firstname} {user.lastname}
                                      </MenuItem>
                                    ))}
                                  </MuiSelect>
                                </FormControl>
                              )}
                              {formData.shared === "group" && (
                                <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                                  <InputLabel shrink>Share with Groups</InputLabel>
                                  <MuiSelect
                                    multiple
                                    value={Array.isArray(formData.group_id) ? formData.group_id : []}
                                    label="Share with Groups"
                                    notched
                                    displayEmpty
                                    disabled
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
                                    {groups.map((group) => (
                                      <MenuItem key={group.id} value={group.id}>
                                        {group.name}
                                      </MenuItem>
                                    ))}
                                  </MuiSelect>
                                </FormControl>
                              )}
                            </div>
                          </div> */}
                        </div>
                      </div>
                    // </div>
                  )}

                {/* Visibility Card - Completed */}
                {stepIndex === 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-6">
                    <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#F6F4EE' }}>
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#E5E0D3',
                            mr: 1.5
                          }}
                        >
                          <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                        </Avatar>
                        Visibility
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(0);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-8 px-3 text-[12px] border border-[#bf213e] hover:bg-[#F6F4EE] flex items-center gap-1 bg-white"
                      >
                        <Edit className="w-4 h-4 text-[#bf213e]" /> <span className="text-[#bf213e]">Edit</span> 
                      </button>
                    </div>
                    <div className="p-6 space-y-4 opacity-75 pointer-events-none">
                      {/* Show on Home Page */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Show on Home Page</h3>
                          <p className="text-sm text-gray-500">Display this event on the home page</p>
                        </div>
                        <Switch
                          checked={formData.showOnHomePage || false}
                          onChange={(e) => handleInputChange('showOnHomePage', e.target.checked)}
                          disabled
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#C72030',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#C72030',
                            },
                          }}
                        />
                      </div>

                      {/* Show on Project Detail Page */}
                      {/* <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Show on Project Detail Page</h3>
                          <p className="text-sm text-gray-500">Display this event on individual project detail pages</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 22 14" fill="none" style={{ transform: visibility.showOnProjectDetailPage ? 'scaleX(1)' : 'scaleX(-1)' }}>
                          <path fillRule="evenodd" clipRule="evenodd" d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z" fill="#DEDEDE"/>
                          <g filter="url(#filter0_completed_2)">
                            <path fillRule="evenodd" clipRule="evenodd" d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z" fill="#C72030"/>
                          </g>
                          <defs>
                            <filter id="filter0_completed_2" x="-8.54731e-05" y="-0.000329614" width="12.2619" height="13.2842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                              <feOffset dy="1.02181"/>
                              <feGaussianBlur stdDeviation="0.510907"/>
                              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                              <feOffset/>
                              <feGaussianBlur stdDeviation="0.510907"/>
                              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                              <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow"/>
                              <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape"/>
                            </filter>
                          </defs>
                        </svg>
                      </div> */}

                      {/* Show on Booking Page */}
                      {/* <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Show on Booking Page</h3>
                          <p className="text-sm text-gray-500">Display this event on the home page</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 22 14" fill="none" style={{ transform: visibility.showOnBookingPage ? 'scaleX(1)' : 'scaleX(-1)' }}>
                          <path fillRule="evenodd" clipRule="evenodd" d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z" fill="#DEDEDE"/>
                          <g filter="url(#filter0_completed_3)">
                            <path fillRule="evenodd" clipRule="evenodd" d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z" fill="#C72030"/>
                          </g>
                          <defs>
                            <filter id="filter0_completed_3" x="-8.54731e-05" y="-0.000329614" width="12.2619" height="13.2842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                              <feOffset dy="1.02181"/>
                              <feGaussianBlur stdDeviation="0.510907"/>
                              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                              <feOffset/>
                              <feGaussianBlur stdDeviation="0.510907"/>
                              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                              <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow"/>
                              <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape"/>
                            </filter>
                          </defs>
                        </svg>
                      </div> */}

                      {/* Featured Event */}
                      {/* <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Featured Event</h3>
                          <p className="text-sm text-gray-500">Mark as a featured event for priority display</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 22 14" fill="none" style={{ transform: visibility.featuredEvent ? 'scaleX(1)' : 'scaleX(-1)' }}>
                          <path fillRule="evenodd" clipRule="evenodd" d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z" fill="#DEDEDE"/>
                          <g filter="url(#filter0_completed_4)">
                            <path fillRule="evenodd" clipRule="evenodd" d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z" fill="#C72030"/>
                          </g>
                          <defs>
                            <filter id="filter0_completed_4" x="-8.54731e-05" y="-0.000329614" width="12.2619" height="13.2842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                              <feOffset dy="1.02181"/>
                              <feGaussianBlur stdDeviation="0.510907"/>
                              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                              <feOffset/>
                              <feGaussianBlur stdDeviation="0.510907"/>
                              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                              <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow"/>
                              <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape"/>
                            </filter>
                          </defs>
                        </svg>
                      </div> */}
                    </div>
                  </div>
                )}


                {stepIndex === 1 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#F6F4EE' }}>
                      {/* <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3 font-medium">
                        ✓
                      </span> */}
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#E5E0D3',
                            mr: 1.5
                          }}
                        >
                          <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                        </Avatar>
                        Event Related Images
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-8 px-3 text-[12px] border border-[#bf213e] hover:bg-[#F6F4EE] flex items-center gap-1 bg-white"
                      >
                        <Edit className="w-4 h-4 text-[#bf213e]" /> <span className="text-[#bf213e]">Edit</span> 
                      </button>
                    </div>
                    <div className="p-6 opacity-75 pointer-events-none">
                      <p className="text-sm text-gray-600">Event images have been uploaded.</p>
                    </div>
                  </div>
                )}

                {stepIndex === 2 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#F6F4EE' }}>
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#E5E0D3',
                            mr: 1.5
                          }}
                        >
                          <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                        </Avatar>
                        Invite CPs
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-8 px-3 text-[12px] border border-[#bf213e] hover:bg-[#F6F4EE] flex items-center gap-1 bg-white"
                      >
                        <Edit className="w-4 h-4 text-[#bf213e]" /> <span className="text-[#bf213e]">Edit</span> 
                      </button>
                    </div>
                    <div className="p-6 space-y-6 opacity-75 pointer-events-none">
                      {/* Channel Partners */}
                      {/* <div>
                        <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                          <InputLabel shrink>Selected Channel Partners</InputLabel>
                          <MuiSelect
                            multiple
                            value={selectedChannelPartners}
                            label="Selected Channel Partners"
                            notched
                            displayEmpty
                            disabled
                            renderValue={(selected) => {
                              if (!selected || selected.length === 0) {
                                return <span style={{ color: '#999' }}>No Channel Partners Selected</span>;
                              }
                              return selected
                                .map((id) => {
                                  const partner = channelPartners.find((cp) => cp.id === id || cp.id.toString() === id.toString());
                                  return partner ? partner.name || partner.company_name || `Partner ${id}` : id;
                                })
                                .join(", ");
                            }}
                          >
                            {channelPartners.map((partner) => (
                              <MenuItem key={partner.id} value={partner.id}>
                                {partner.name || partner.company_name || `Partner ${partner.id}`}
                              </MenuItem>
                            ))}
                          </MuiSelect>
                        </FormControl>
                      </div> */}

                      {/* Share With Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Share With</label>
                        <div className="flex gap-6 mb-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.shared === "all"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">All</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.shared === "individual"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">Individuals</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.shared === "group"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">Groups</span>
                          </label>
                        </div>

                        {formData.shared === "individual" && (
                          <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                            <InputLabel shrink>Event User ID</InputLabel>
                            <MuiSelect
                              multiple
                              value={Array.isArray(formData.user_id) ? formData.user_id : []}
                              label="Event User ID"
                              notched
                              displayEmpty
                              disabled
                              renderValue={(selected) => {
                                if (!selected || selected.length === 0) {
                                  return <span style={{ color: '#999' }}>Select Users</span>;
                                }
                                return selected
                                  .map((id) => {
                                    const user = eventUserID.find((u) => u.id === id || u.id.toString() === id.toString());
                                    return user ? `${user.firstname} ${user.lastname}` : id;
                                  })
                                  .join(", ");
                              }}
                            >
                              {eventUserID.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                  {user.firstname} {user.lastname}
                                </MenuItem>
                              ))}
                            </MuiSelect>
                          </FormControl>
                        )}
                        {formData.shared === "group" && (
                          <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                            <InputLabel shrink>Share with Groups</InputLabel>
                            <MuiSelect
                              multiple
                              value={Array.isArray(formData.group_id) ? formData.group_id : []}
                              label="Share with Groups"
                              notched
                              displayEmpty
                              disabled
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
                              {groups.map((group) => (
                                <MenuItem key={group.id} value={group.id}>
                                  {group.name}
                                </MenuItem>
                              ))}
                            </MuiSelect>
                          </FormControl>
                        )}
                      </div>

                      {/* CSV Files */}
                      {csvFiles.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded CSV Files</label>
                          <div className="border-2 border-dashed border-[#D9D9D9] rounded-lg p-6 text-center">
                            <p className="text-sm text-gray-600">
                              {csvFiles.length} file(s) uploaded
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Preview Mode - Show all sections */}
        {isPreviewMode && (
          <>
            <div className="px-4 md:px-6 py-4">
              {/* <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center mb-6">
                <span className="font-bold text-orange-600">Preview Mode</span>
              </div> */}

              {/* Step 1: Event Details Preview */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#F6F4EE' }}>
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: '#E5E0D3',
                          mr: 1.5
                        }}
                      >
                        <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                      </Avatar>
                      Event Details
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewMode(false);
                        setCurrentStep(0);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="h-8 px-3 text-[12px] border border-[#bf213e] hover:bg-[#F6F4EE] flex items-center gap-1 bg-white"
                      >
                        <Edit className="w-4 h-4 text-[#bf213e]" /> <span className="text-[#bf213e]">Edit</span> 
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Project */}
                      {/* <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                        <InputLabel shrink>Project</InputLabel>
                        <MuiSelect
                          value={selectedProjectId || ""}
                          label="Project"
                          notched
                          displayEmpty
                          disabled
                        >
                          <MenuItem value="">Select Project</MenuItem>
                          {projects.map((project) => (
                            <MenuItem key={project.id} value={project.id}>
                              {project.project_name}
                            </MenuItem>
                          ))}
                        </MuiSelect>
                      </FormControl> */}

                      {/* Event Name */}
                      <TextField
                              label="Event Name"
                              value={formData.event_name}
                              fullWidth
                              variant="outlined"
                              disabled
                              slotProps={{ inputLabel: { shrink: true } }}
                              InputProps={{ sx: fieldStyles }}
                            />

                            {/* Event At */}
                            <TextField
                              label="Event At"
                              value={formData.event_at}
                              fullWidth
                              variant="outlined"
                              disabled
                              slotProps={{ inputLabel: { shrink: true } }}
                              InputProps={{ sx: fieldStyles }}
                            />
                             <TextField
                label="Event Date"
                type="date"
                value={formData.event_date}
                onChange={handleChange}
                name="event_date"
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

                            {/* Event Description */}
                            <div className="md:col-span-2">
                              <TextField
                                label="Event Description"
                                value={formData.description}
                                fullWidth
                                variant="outlined"
                                disabled
                                slotProps={{ inputLabel: { shrink: true } }}
                              />
                            </div>

                             <TextField
                label="Event Time"
                type="time"
                value={formData.event_time}
                onChange={handleChange}
                name="event_time"
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
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mark Important</label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.is_important === true}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.is_important === false}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div> */}

                      {/* Send Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Send Email</label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.email_trigger_enabled === "true"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.email_trigger_enabled === "false"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>

                      {/* RSVP Action */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">RSVP Action</label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.rsvp_action === "1"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.rsvp_action === "0"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* RSVP Fields - Conditional display */}
                    {/* {formData.rsvp_action === "yes" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TextField
                          label="RSVP Name"
                          value={formData.rsvp_name || ""}
                          fullWidth
                          variant="outlined"
                          disabled
                          slotProps={{ inputLabel: { shrink: true } }}
                          InputProps={{ sx: fieldStyles }}
                        />
                        <TextField
                          label="RSVP Number"
                          value={formData.rsvp_number || ""}
                          fullWidth
                          variant="outlined"
                          disabled
                          slotProps={{ inputLabel: { shrink: true } }}
                          InputProps={{ sx: fieldStyles }}
                        />
                      </div>
                    )} */}

                    {/* Share With */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Share With</label>
                        <div className="flex gap-6 mb-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.shared === "all"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">All</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.shared === "individual"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">Individuals</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={formData.shared === "group"}
                              disabled
                              className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                              style={{ accentColor: '#C72030' }}
                            />
                            <span className="ml-2 text-sm text-gray-700">Groups</span>
                          </label>
                        </div>

                        {formData.shared === "individual" && (
                          <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                            <InputLabel shrink>Event User ID</InputLabel>
                            <MuiSelect
                              multiple
                              value={Array.isArray(formData.user_id) ? formData.user_id : []}
                              label="Event User ID"
                              notched
                              displayEmpty
                              disabled
                              renderValue={(selected) => {
                                if (!selected || selected.length === 0) {
                                  return <span style={{ color: '#999' }}>Select Users</span>;
                                }
                                return selected
                                  .map((id) => {
                                    const user = eventUserID.find((u) => u.id === id || u.id.toString() === id.toString());
                                    return user ? `${user.firstname} ${user.lastname}` : id;
                                  })
                                  .join(", ");
                              }}
                            >
                              {eventUserID.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                  {user.firstname} {user.lastname}
                                </MenuItem>
                              ))}
                            </MuiSelect>
                          </FormControl>
                        )}
                        {formData.shared === "group" && (
                          <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                            <InputLabel shrink>Share with Groups</InputLabel>
                            <MuiSelect
                              multiple
                              value={Array.isArray(formData.group_id) ? formData.group_id : []}
                              label="Share with Groups"
                              notched
                              displayEmpty
                              disabled
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
                              {groups.map((group) => (
                                <MenuItem key={group.id} value={group.id}>
                                  {group.name}
                                </MenuItem>
                              ))}
                            </MuiSelect>
                          </FormControl>
                        )}
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Visibility Card Preview */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#F6F4EE' }}>
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: '#E5E0D3',
                          mr: 1.5
                        }}
                      >
                        <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                      </Avatar>
                      Visibility
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewMode(false);
                        setCurrentStep(0);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="h-8 px-3 text-[12px] border border-[#bf213e] hover:bg-[#F6F4EE] flex items-center gap-1 bg-white"
                    >
                      <Edit className="w-4 h-4 text-[#bf213e]" /> <span className="text-[#bf213e]">Edit</span> 
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Show on Home Page */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Show on Home Page</h3>
                        <p className="text-sm text-gray-500">Display this event on the home page</p>
                      </div>
                      <Switch
                        checked={visibility.showOnHomePage}
                        onChange={(e) => setVisibility(prev => ({ ...prev, showOnHomePage: e.target.checked }))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#C72030',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#C72030',
                          },
                        }}
                      />
                    </div>

                    {/* Show on Project Detail Page */}
                    {/* <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Show on Project Detail Page</h3>
                        <p className="text-sm text-gray-500">Display this event on individual project detail pages</p>
                      </div>
                      <Switch
                        checked={visibility.showOnProjectDetailPage}
                        onChange={(e) => setVisibility(prev => ({ ...prev, showOnProjectDetailPage: e.target.checked }))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#C72030',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#C72030',
                          },
                        }}
                      />
                    </div> */}

                    {/* Show on Booking Page */}
                    {/* <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Show on Booking Page</h3>
                        <p className="text-sm text-gray-500">Display this event on the home page</p>
                      </div>
                      <Switch
                        checked={visibility.showOnBookingPage}
                        onChange={(e) => setVisibility(prev => ({ ...prev, showOnBookingPage: e.target.checked }))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#C72030',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#C72030',
                          },
                        }}
                      />
                    </div> */}

                    {/* Featured Event */}
                    {/* <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Featured Event</h3>
                        <p className="text-sm text-gray-500">Mark as a featured event for priority display</p>
                      </div>
                      <Switch
                        checked={visibility.featuredEvent}
                        onChange={(e) => setVisibility(prev => ({ ...prev, featuredEvent: e.target.checked }))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#C72030',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#C72030',
                          },
                        }}
                      />
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Step 3: Invite CPs Preview */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#F6F4EE' }}>
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: '#E5E0D3',
                          mr: 1.5
                        }}
                      >
                        <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                      </Avatar>
                      Invite CPs
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewMode(false);
                        setCurrentStep(2);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                     className="h-8 px-3 text-[12px] border border-[#bf213e] hover:bg-[#F6F4EE] flex items-center gap-1 bg-white"
                      >
                        <Edit className="w-4 h-4 text-[#bf213e]" /> <span className="text-[#bf213e]">Edit</span> 
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Channel Partners */}
                    <div>
                      {/* <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                        <InputLabel shrink>Selected Channel Partners</InputLabel>
                        <MuiSelect
                          multiple
                          value={selectedChannelPartners}
                          label="Selected Channel Partners"
                          notched
                          displayEmpty
                          disabled
                          renderValue={(selected) => {
                            if (!selected || selected.length === 0) {
                              return <span style={{ color: '#999' }}>No Channel Partners Selected</span>;
                            }
                            return selected
                              .map((id) => {
                                const partner = channelPartners.find((cp) => cp.id === id || cp.id.toString() === id.toString());
                                return partner ? partner.name || partner.company_name || `Partner ${id}` : id;
                              })
                              .join(", ");
                          }}
                        >
                          {channelPartners.map((partner) => (
                            <MenuItem key={partner.id} value={partner.id}>
                              {partner.name || partner.company_name || `Partner ${partner.id}`}
                            </MenuItem>
                          ))}
                        </MuiSelect>
                      </FormControl> */}
                    </div>

                    {/* Share With Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Share With</label>
                      <div className="flex gap-6 mb-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={formData.shared === "all"}
                            disabled
                            className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                            style={{ accentColor: '#C72030' }}
                          />
                          <span className="ml-2 text-sm text-gray-700">All</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={formData.shared === "individual"}
                            disabled
                            className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                            style={{ accentColor: '#C72030' }}
                          />
                          <span className="ml-2 text-sm text-gray-700">Individuals</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={formData.shared === "group"}
                            disabled
                            className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                            style={{ accentColor: '#C72030' }}
                          />
                          <span className="ml-2 text-sm text-gray-700">Groups</span>
                        </label>
                      </div>

                      {formData.shared === "individual" && (
                        <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                          <InputLabel shrink>Event User ID</InputLabel>
                          <MuiSelect
                            multiple
                            value={Array.isArray(formData.user_id) ? formData.user_id : []}
                            label="Event User ID"
                            notched
                            displayEmpty
                            disabled
                            renderValue={(selected) => {
                              if (!selected || selected.length === 0) {
                                return <span style={{ color: '#999' }}>Select Users</span>;
                              }
                              return selected
                                .map((id) => {
                                  const user = eventUserID.find((u) => u.id === id || u.id.toString() === id.toString());
                                  return user ? `${user.firstname} ${user.lastname}` : id;
                                })
                                .join(", ");
                            }}
                          >
                            {eventUserID.map((user) => (
                              <MenuItem key={user.id} value={user.id}>
                                {user.firstname} {user.lastname}
                              </MenuItem>
                            ))}
                          </MuiSelect>
                        </FormControl>
                      )}
                      {formData.shared === "group" && (
                        <FormControl fullWidth variant="outlined" sx={{ '& .MuiInputBase-root': fieldStyles }}>
                          <InputLabel shrink>Share with Groups</InputLabel>
                          <MuiSelect
                            multiple
                            value={Array.isArray(formData.group_id) ? formData.group_id : []}
                            label="Share with Groups"
                            notched
                            displayEmpty
                            disabled
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
                            {groups.map((group) => (
                              <MenuItem key={group.id} value={group.id}>
                                {group.name}
                              </MenuItem>
                            ))}
                          </MuiSelect>
                        </FormControl>
                      )}
                    </div>

                    {/* CSV Files */}
                    {csvFiles.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded CSV Files</label>
                        <div className="border-2 border-dashed border-[#D9D9D9] rounded-lg p-6 text-center">
                          <p className="text-sm text-gray-600">
                            {csvFiles.length} file(s) uploaded
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Event Related Images Preview */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#F6F4EE' }}>
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: '#E5E0D3',
                          mr: 1.5
                        }}
                      >
                        <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                      </Avatar>
                      Event Related Images
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewMode(false);
                        setCurrentStep(1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="h-8 px-3 text-[12px] border border-[#bf213e] hover:bg-[#F6F4EE] flex items-center gap-1 bg-white"
                      >
                        <Edit className="w-4 h-4 text-[#bf213e]" /> <span className="text-[#bf213e]">Edit</span> 
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Cover Images */}
                    <div>
                      <h5 className="text-base font-semibold mb-4">Event Cover Image</h5>
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <Table className="border-separate">
                          <TableHeader>
                            <TableRow className="hover:bg-gray-50" style={{ backgroundColor: "#e6e2d8" }}>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>File Name</TableHead>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>Preview</TableHead>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4" style={{ borderColor: "#fff" }}>Ratio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {coverImageRatios.flatMap(({ key, label }) => {
                              const files = Array.isArray(formData[key]) ? formData[key] : formData[key] ? [formData[key]] : [];
                              if (files.length === 0) return [];

                              return files.map((file, index) => (
                                <TableRow key={`${key}-${file.id || index}`} className="hover:bg-gray-50 transition-colors">
                                  <TableCell className="py-3 px-4 font-medium">{file.name || file.document_file_name || `Image ${index + 1}`}</TableCell>
                                  <TableCell className="py-3 px-4">
                                    <img
                                      style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                      className="rounded border border-gray-200"
                                      src={file.preview || file.document_url}
                                      alt={file.name}
                                    />
                                  </TableCell>
                                  <TableCell className="py-3 px-4">{file.ratio || label}</TableCell>
                                </TableRow>
                              ));
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Event Attachments */}
                    <div>
                      <h5 className="text-base font-semibold mb-4">Event Attachment</h5>
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <Table className="border-separate">
                          <TableHeader>
                            <TableRow className="hover:bg-gray-50" style={{ backgroundColor: "#e6e2d8" }}>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>File Name</TableHead>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff" }}>Preview</TableHead>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4" style={{ borderColor: "#fff" }}>Ratio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {eventImageRatios.map(({ key, label }) =>
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
              </div>

              {/* QR Code Generation Preview - At the End */}
              {/* <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#F6F4EE' }}>
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: '#E5E0D3',
                          mr: 1.5
                        }}
                      >
                        <SettingsOutlinedIcon sx={{ fontSize: 18, color: '#C72030' }} />
                      </Avatar>
                      QR Code Generation
                    </h2>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleDownloadAllQRCodes}
                        className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
                      >
                        Download All QR Codes
                      </button>
                      <button
                        type="button"
                        onClick={handleSendAllQRCodesEmail}
                        className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
                      >
                        Send QR Codes via Email
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                  
                    <div className="bg-[#C4B89D59] border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                       
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                            <svg width="80" height="80" viewBox="0 0 80 80">
                              <rect width="80" height="80" fill="white"/>
                              <g fill="black">
                                <rect x="8" y="8" width="4" height="4"/>
                                <rect x="16" y="8" width="4" height="4"/>
                                <rect x="24" y="8" width="4" height="4"/>
                                <rect x="8" y="16" width="4" height="4"/>
                                <rect x="24" y="16" width="4" height="4"/>
                                <rect x="8" y="24" width="4" height="4"/>
                                <rect x="16" y="24" width="4" height="4"/>
                                <rect x="24" y="24" width="4" height="4"/>
                                <rect x="48" y="8" width="4" height="4"/>
                                <rect x="56" y="8" width="4" height="4"/>
                                <rect x="64" y="8" width="4" height="4"/>
                                <rect x="48" y="16" width="4" height="4"/>
                                <rect x="64" y="16" width="4" height="4"/>
                                <rect x="48" y="24" width="4" height="4"/>
                                <rect x="56" y="24" width="4" height="4"/>
                                <rect x="64" y="24" width="4" height="4"/>
                                <rect x="8" y="48" width="4" height="4"/>
                                <rect x="16" y="48" width="4" height="4"/>
                                <rect x="24" y="48" width="4" height="4"/>
                                <rect x="8" y="56" width="4" height="4"/>
                                <rect x="24" y="56" width="4" height="4"/>
                                <rect x="8" y="64" width="4" height="4"/>
                                <rect x="16" y="64" width="4" height="4"/>
                                <rect x="24" y="64" width="4" height="4"/>
                                <rect x="32" y="32" width="4" height="4"/>
                                <rect x="40" y="40" width="4" height="4"/>
                              </g>
                            </svg>
                          </div>
                        </div>
                        
                       
                        <div className="flex-1">
                          <h3 className="font-semibold mb-3" style={{ 
                            fontFamily: 'Work Sans, sans-serif',
                            fontWeight: 400,
                            fontSize: '13px',
                            lineHeight: '20.18px',
                            letterSpacing: '0%',
                            color: '#1A1A1A',
                          }}>Each QR code is mapped to:</h3>
                          <ul className="space-y-2" style={{
                            fontFamily: 'Work Sans, sans-serif',
                            fontWeight: 400,
                            fontSize: '13px',
                            lineHeight: '20.18px',
                            letterSpacing: '0%',
                            color: '#1A1A1A80'
                          }}>
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Event ID: EVT-1767003965366</span>
                            </li>
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>CP ID and Name</span>
                            </li>
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Valid only for the specified event date & time</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                   
                    <div>
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4 text-center border-r border-white">
                                Actions
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4 text-center border-r border-white">
                                Sr. No.
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                                CP Name
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                                Company Name
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                                Email ID
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 py-3 px-4">
                                QR Code ID
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {qrCodeData.map((row) => (
                              <TableRow key={row.id} className="hover:bg-gray-50">
                                <TableCell className="py-3 px-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadQRCode(row.qrCodeId, row.cpName)}
                                      className="p-1.5 text-[#C72030] hover:bg-[#FFF5F5] rounded transition-colors"
                                      title="Download QR Code"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSendQRCodeEmail(row.emailId, row.cpName)}
                                      className="p-1.5 text-[#C72030] hover:bg-[#FFF5F5] rounded transition-colors"
                                      title="Send via Email"
                                    >
                                      <Mail className="w-4 h-4" />
                                    </button>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-center font-medium">
                                  {row.srNo}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {row.cpName}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {row.companyName}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {row.emailId}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-sm text-gray-600">
                                  {row.qrCodeId}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Final Submit Buttons in Preview Mode */}
            <div className="flex gap-4 justify-center pt-6">
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
              >
                Back to Edit
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Event'}
              </button>
            </div>
          </>
        )}
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

        {showEventUploader && (
          <ProjectImageVideoUpload
            onClose={() => setShowEventUploader(false)}
            includeInvalidRatios={false}
            selectedRatioProp={selectedEventRatios}
            showAsModal={true}
            label={eventImageLabel}
            description={dynamicEventDescription}
            onContinue={(validImages, videoFiles) =>
              handleEventCroppedImages(validImages, videoFiles, "event")
            }
            allowVideos={true}
          />
        )}
    </div>
  );
};

export default EventCreate;
