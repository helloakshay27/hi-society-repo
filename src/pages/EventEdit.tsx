import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import MultiSelectBox from "../components/ui/multi-selector";
import { ImageUploadingButton } from "../components/reusable/ImageUploadingButton";
import { ImageCropper } from "../components/reusable/ImageCropper";
import ProjectBannerUpload from "../components/reusable/ProjectBannerUpload";
import ProjectImageVideoUpload from "../components/reusable/ProjectImageVideoUpload";
import { ArrowLeft, FileText, Calendar, Users, Plus, X, FileSpreadsheet, Upload, Download, Mail, Edit, Trash, Trash2 } from "lucide-react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Avatar,
  Box,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import SelectBox from "@/components/ui/select-box";

const EventEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState({});
  const [errors, setErrors] = useState({});

  console.log("id", id);

  const [formData, setFormData] = useState({
    project_id: "",
    event_type: "",
    event_name: "",
    event_at: "",
    from_time: "",
    to_time: "",
    rsvp_action: "",
    rsvp_name: "",
    rsvp_number: "",
    description: "",
    publish: "",
    user_id: [],
    comment: "",
    shared: "",
    group_id: [], // Changed to array
    attachfile: [],
    previewImage: [],
    is_important: "false",
    email_trigger_enabled: "false",
    set_reminders_attributes: [],
    existingImages: [], // for previously uploaded images
    newImages: [], // for newly selected images
    cover_image: null, // Changed from array to single value
    existingCoverImage: null, // Add this to track existing cover image
    cover_image_1_by_1: [],
    cover_image_9_by_16: [],
    cover_image_3_by_2: [],
    cover_image_16_by_9: [],
    event_images_1_by_1: [],
    event_images_9_by_16: [],
    event_images_3_by_2: [],
    event_images_16_by_9: [],
  });

  console.log("Data", formData);

  const [eventType, setEventType] = useState([]);
  const [eventUserID, setEventUserID] = useState([]);
  const [groups, setGroups] = useState([]); // State to store groups
  const [loading, setLoading] = useState(false);

  const [reminderValue, setReminderValue] = useState("");
  const [reminderUnit, setReminderUnit] = useState("");
  const [image, setImage] = useState([]);
  const [croppedImage, setCroppedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  // const [showCoverUploader, setShowCoverUploader] = useState(false);
  const [showAttachmentTooltip, setShowAttachmentTooltip] = useState(false);
  const [showCoverUploader, setShowCoverUploader] = useState(false);
  const [showEventUploader, setShowEventUploader] = useState(false);
  const baseURL = API_CONFIG.BASE_URL;

  // Step management state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showPreviousSections, setShowPreviousSections] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const totalSteps = 3;

  // Invite CPs state
  const [channelPartners, setChannelPartners] = useState([]);
  const [selectedChannelPartners, setSelectedChannelPartners] = useState([]);
  const [csvFiles, setCsvFiles] = useState([]);

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

  // const updateFormData = (key, files) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     [key]: [...(prev[key] || []), ...files],
  //   }));
  // };

  const updateFormData = (key, files) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [key]: files,
      };
      return newData;
    });
  };

  const updateEventFormData = (key, files) => {
    setFormData((prev) => {
      const existingFiles = prev[key] || [];

      const newData = {
        ...prev,
        [key]: [...existingFiles, ...files],
      };

      return newData;
    });
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

  const handleCoverImageCropComplete = (validImages) => {
    if (!validImages || validImages.length === 0) {
      toast.error("No valid images selected.");
      setShowCoverUploader(false);
      return;
    }

    validImages.forEach((img) => {
      if (!img.ratio) return;

      const formattedRatio = img.ratio.replace(":", "_by_");
      const key = `cover_image_${formattedRatio}`;

      updateFormData(key, [img]); // Replace or overwrite
    });

    // setPreviewImg(validImages[0].preview);
    setShowCoverUploader(false);
  };

  // const handleEventImageCropComplete = (validImages) => {
  //   if (!validImages || validImages.length === 0) {
  //     toast.error("No valid images selected.");
  //     setShowEventUploader(false);
  //     return;
  //   }

  //   validImages.forEach((img) => {
  //     if (!img.ratio) return;

  //     const formattedRatio = img.ratio.replace(":", "_by_");
  //     const key = `event_images_${formattedRatio}`;

  //     updateEventFormData(key, [img]); // Replace or overwrite
  //   });

  //   // setPreviewImg(validImages[0].preview);
  //   setShowEventUploader(false);
  // };

  const handleEventCroppedImages = (
    validImages,
    videoFiles = [],
    type = "event"
  ) => {
    // Handle video files first
    if (videoFiles && videoFiles.length > 0) {
      videoFiles.forEach((video) => {
        const formattedRatio = video.ratio.replace(":", "_by_");
        const prefix = type === "cover" ? "cover_image" : "event_images";
        const key = `${prefix}_${formattedRatio}`;

        setFormData((prev) => ({
          ...prev,
          [key]: [
            ...(prev[key] || []), // Keep existing files
            {
              file: video.file,
              name: video.file.name,
              preview: URL.createObjectURL(video.file),
              ratio: video.ratio,
              type: "video",
              id: `${key}-${Date.now()}-${Math.random()}`,
            },
          ],
        }));
      });

      setShowEventUploader(false);
      return;
    }

    // Handle images
    if (!validImages || validImages.length === 0) {
      toast.error(`No valid ${type} files selected.`);
      setShowEventUploader(false);
      return;
    }

    validImages.forEach((img) => {
      const formattedRatio = img.ratio.replace(":", "_by_");
      const prefix = type === "cover" ? "cover_image" : "event_images";
      const key = `${prefix}_${formattedRatio}`;

      setFormData((prev) => ({
        ...prev,
        [key]: [
          ...(prev[key] || []), // Keep existing files
          {
            file: img.file,
            name: img.file.name,
            preview: URL.createObjectURL(img.file),
            ratio: img.ratio,
            type: "image",
            id: `${key}-${Date.now()}-${Math.random()}`,
          },
        ],
      }));
    });

    setShowEventUploader(false);
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

  // const eventUploadConfig = {
  //   'cover image': ['16:9']
  // };

  // const currentUploadType = 'cover image';
  // const selectedRatios = eventUploadConfig[currentUploadType] || [];
  // const dynamicLabel = currentUploadType.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  // const dynamicDescription = `Supports ${selectedRatios.join(', ')} aspect ratios`;

  // const updateFormData = (key, files) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     [key]: files,
  //   }));
  // };

  // const handleCropComplete = (validImages) => {
  //   if (!validImages || validImages.length === 0) {
  //     toast.error("No valid images selected.");
  //     setShowUploader(false);
  //     return;
  //   }

  //   validImages.forEach((img) => {
  //     const formattedRatio = img.ratio.replace(':', 'by'); // e.g., "16:9" -> "16by9"
  //     const key = `${currentUploadType}_${formattedRatio}`.replace(/\s+/g, '_').toLowerCase(); // e.g., banner_image_16by9

  //     updateFormData(key, [img]); // send as array to preserve consistency
  //   });

  //   // setPreviewImg(validImages[0].preview); // preview first image only
  //   setShowUploader(false);
  // };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`${baseURL}events/${id}.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });

        const data = response.data;

        // Format reminders
        const formattedReminders = (data.reminders || []).map((reminder) => {
          if (typeof reminder.days !== "undefined" && reminder.days !== null) {
            return {
              id: reminder.id,
              value: reminder.days,
              unit: "days",
              _destroy: false,
            };
          } else if (
            typeof reminder.hours !== "undefined" &&
            reminder.hours !== null
          ) {
            return {
              id: reminder.id,
              value: reminder.hours,
              unit: "hours",
              _destroy: false,
            };
          } else if (
            typeof reminder.minutes !== "undefined" &&
            reminder.minutes !== null
          ) {
            return {
              id: reminder.id,
              value: reminder.minutes,
              unit: "minutes",
              _destroy: false,
            };
          } else if (
            typeof reminder.weeks !== "undefined" &&
            reminder.weeks !== null
          ) {
            return {
              id: reminder.id,
              value: reminder.weeks,
              unit: "weeks",
              _destroy: false,
            };
          }
          return reminder;
        });

        // Normalize user_id
        const userIds = Array.isArray(data.user_id)
          ? data.user_id
          : data.user_id
          ? [data.user_id]
          : [];

        // Normalize group_id
        const groupIds = Array.isArray(data.group_id)
          ? data.group_id
          : data.group_id
          ? [data.group_id]
          : [];

        // Determine share type
        let shared = "";
        if (data.shared === 0) {
          shared = "all";
        } else if (data.shared === 1) {
          if (data.group_id && data.group_id.length > 0) {
            shared = "group";
          } else if (data.user_id && data.user_id.length > 0) {
            shared = "individual";
          }
        }

        // Prepare cover image preview
        const existingCoverImage =
          data.cover_image && data.cover_image.document_url
            ? {
                url: data.cover_image.document_url,
                id: data.cover_image.id,
                isExisting: true,
              }
            : null;

        // Prepare existing event image previews
        const existingImages =
          data.event_images?.map((img) => ({
            url: img.document_url,
            type: img.document_content_type,
            id: img.id,
            isExisting: true,
          })) || [];

        const attachfileData = data.attachfile
          ? Array.isArray(data.attachfile)
            ? data.attachfile
            : [data.attachfile]
          : [];

        const coverImageData = data.cover_image || null;

        setFormData((prev) => ({
          ...prev,
          ...data,
          user_id: userIds,
          group_id: groupIds, // Store as array
          shared: shared,
          // attachfile: data.attachfile || [],
          attachfile: attachfileData,
          newImages: [],
          existingImages: existingImages,
          previewImage: existingImages,
          existingCoverImage: existingCoverImage, // <-- use the correct object
          cover_image: coverImageData,
          set_reminders_attributes: formattedReminders,
          cover_image_1_by_1: data.cover_image_1_by_1 || [],
          cover_image_9_by_16: data.cover_image_9_by_16 || [],
          cover_image_3_by_2: data.cover_image_3_by_2 || [],
          cover_image_16_by_9: data.cover_image_16_by_9 || [],
          event_images_1_by_1: data.event_images_1_by_1 || [],
          event_images_9_by_16: data.event_images_9_by_16 || [],
          event_images_3_by_2: data.event_images_3_by_2 || [],
          event_images_16_by_9: data.event_images_16_by_9 || [],
        }));

        console.log("project_id: ", data.project_id);
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };

    if (id) fetchEvent();
  }, [id]);

  const [projects, setProjects] = useState([]); // State to store projects

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Size check: must be below 3MB
      if (file.size > 3 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          cover_image: "Image size must be less than 3MB",
        }));
        toast.error("Image size must be less than 3MB");
        e.target.value = ""; // Clear the input
        return;
      }

      // Clear previous error if size is valid
      setErrors((prev) => ({
        ...prev,
        cover_image: "",
      }));

      // Save the image
      setFormData((prev) => ({
        ...prev,
        cover_image: file,
        existingCoverImage: null,
      }));
    } else {
      // If no file is selected
      setFormData((prev) => ({
        ...prev,
        cover_image: null,
      }));
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${baseURL}get_all_projects.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Fetched Projects:", response.data);

        setProjects(response.data.projects || []); // Ensure data structure is correct
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${baseURL}/usergroups/cp_members_list.json`, {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "multipart/form-data",
          },
        });
        setEventUserID(response.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch groups
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
      } catch (error) {
        console.error("Error fetching Groups:", error);
        setGroups([]);
      }
    };

    if (formData.shared === "group" && (!groups || groups.length === 0)) {
      fetchGroups();
    }
  }, [formData.shared]);

  // Fetch Channel Partners
  useEffect(() => {
    const fetchChannelPartners = async () => {
      try {
        const response = await axios.get(`${baseURL}channel_partners.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });
        setChannelPartners(response.data.channel_partners || []);
      } catch (error) {
        console.error("Error fetching channel partners:", error);
        setChannelPartners([]);
      }
    };

    fetchChannelPartners();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
      const allowedImages = [];
      const newPreviews = [];

      files.forEach((file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        // Validate size based on type
        if (isImage && file.size > 3 * 1024 * 1024) {
          toast.error("Image size must be less than 3MB");
          return;
        }

        if (isVideo && file.size > 10 * 1024 * 1024) {
          toast.error("Video size must be less than 10MB");
          return;
        }

        if (!isImage && !isVideo) {
          toast.error(`${file.name} is not a supported file type`);
          return;
        }

        // If valid, add to list
        allowedImages.push(file);
        newPreviews.push({
          url: URL.createObjectURL(file),
          type: file.type,
          file: file,
          isExisting: false,
        });
      });

      if (allowedImages.length > 0) {
        setFormData((prev) => ({
          ...prev,
          attachfile: allowedImages,
          newImages: newPreviews,
          previewImage: [...prev.existingImages, ...newPreviews],
        }));
      }
    }
  };

  // Function to remove image from preview
  // const handleRemoveImage = async (index) => {
  //   toast.dismiss();
  //   setFormData((prev) => {
  //     const imageToRemove = prev.previewImage[index];

  //     if (imageToRemove.isExisting) {
  //       // Call backend API to remove the image
  //       axios
  //         .delete(`${baseURL}events/${id}/remove_image/${imageToRemove.id}`, {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  //           },
  //         })
  //         .then(() => {
  //           toast.success("Image removed successfully!");
  //         })
  //         .catch(() => {
  //           toast.error("Failed to remove image from server.");
  //         });

  //       // Optimistically update UI
  //       const updatedExistingImages = prev.existingImages.filter(
  //         (img) => img.id !== imageToRemove.id
  //       );
  //       return {
  //         ...prev,
  //         existingImages: updatedExistingImages,
  //         previewImage: prev.previewImage.filter((_, i) => i !== index),
  //       };
  //     } else {
  //       // If it's a new image, remove from newImages and attachfile
  //       const newImageIndex = prev.newImages.findIndex(
  //         (img) => img.url === imageToRemove.url
  //       );

  //       if (newImageIndex !== -1) {
  //         const updatedNewImages = prev.newImages.filter(
  //           (_, i) => i !== newImageIndex
  //         );
  //         const updatedFiles = Array.from(prev.attachfile).filter(
  //           (_, i) => i !== newImageIndex
  //         );

  //         return {
  //           ...prev,
  //           newImages: updatedNewImages,
  //           attachfile: updatedFiles,
  //           previewImage: prev.previewImage.filter((_, i) => i !== index),
  //         };
  //       }
  //     }

  //     return prev;
  //   });
  // };

  const handleFetchedDiscardGallery = async (key, index, imageId) => {
    toast.dismiss();
    // If no imageId, it's a new image, just remove locally
    if (!imageId) {
      setFormData((prev) => {
        const updatedFiles = (prev[key] || []).filter((_, i) => i !== index);
        return { ...prev, [key]: updatedFiles };
      });
      toast.success("Image removed successfully!");
      return;
    }

    // Existing image: delete from server, then remove locally
    try {
      const response = await fetch(
        `${baseURL}events/${id}/remove_image/${imageId}.json`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        // Optionally, handle 404 as a successful local delete
        if (response.status === 404) {
          const updatedFiles = formData[key].filter((_, i) => i !== index);
          setFormData({ ...formData, [key]: updatedFiles });
          toast.success("Image removed from UI (already deleted on server).");
          return;
        }
        throw new Error("Failed to delete image");
      }

      // Remove from UI after successful delete
      setFormData((prev) => ({
        ...prev,
        [key]: null,
      }));

      toast.success("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error.message);
      toast.error("Failed to delete image. Please try again.");
    }
  };

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "true", // Convert string to boolean
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.event_name) {
      errors.event_name = "Event Name is required.";
    }
    setFormErrors(errors); // Update state with errors

    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return false;
    }
    return true; // Return true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    setLoading(true);

    // const cover16by9 = formData.cover_image_16_by_9;
    // const hasCover16by9 = Array.isArray(cover16by9)
    //   ? cover16by9.some(
    //       (img) =>
    //         img?.file instanceof File || img?.id || img?.document_file_name
    //     )
    //   : !!(
    //       cover16by9?.file instanceof File ||
    //       cover16by9?.id ||
    //       cover16by9?.document_file_name
    //     );

    // const event16by9 = formData.event_images_16_by_9;
    // const hasEvent16by9 = Array.isArray(event16by9)
    //   ? event16by9.some(
    //       (img) =>
    //         img?.file instanceof File || img?.id || img?.document_file_name
    //     )
    //   : !!(
    //       event16by9?.file instanceof File ||
    //       event16by9?.id ||
    //       event16by9?.document_file_name
    //     );

    // if (!hasCover16by9) {
    //   toast.error("Cover Image with 16:9 ratio is required.");
    //   setLoading(false);
    //   setIsSubmitting(false);
    //   return;
    // }

    // if (!hasEvent16by9) {
    //   toast.error("Event Image with 16:9 ratio is required.");
    //   setLoading(false);
    //   setIsSubmitting(false);
    //   return;
    // }

    const data = new FormData();

    const preparedReminders = prepareRemindersForSubmission();

    const backendSharedValue = formData.shared === "all" ? 0 : 1;
    data.append("event[shared]", backendSharedValue);

    // === COVER IMAGE ===
    if (formData.cover_image && formData.cover_image instanceof File) {
      data.append("event[cover_image]", formData.cover_image);
    } else if (!formData.cover_image && !formData.existingCoverImage) {
      data.append("event[remove_cover_image]", "1");
    }

    // === EVENT IMAGES (NEW ONLY) ===
    if (Array.isArray(formData.attachfile)) {
      formData.attachfile.forEach((file) => {
        if (file instanceof File) {
          data.append("event[event_images_16_by_9][]", file);
        }
      });
    }

    // Object.entries(formData).forEach(([key, images]) => {
    //   if (key.startsWith("cover_image") && Array.isArray(images)) {
    //     images.forEach((img) => {
    //       const backendField =
    //         key.replace("cover_image", "event[cover_image") + "]";
    //       if (img.file instanceof File) {
    //         data.append(backendField, img.file);
    //       }
    //     });
    //   }
    // });
    coverImageRatios.forEach(({ key }) => {
      const images = formData[key];
      if (Array.isArray(images) && images.length > 0) {
        const img = images[0];
        if (img?.file instanceof File) {
          data.append(`event[${key}]`, img.file);
        }
      }
    });

    // Handle 16:9 preview image from new structure
    if (Array.isArray(formData.cover_image_16_by_9)) {
      formData.cover_image_16_by_9.forEach((img) => {
        if (img.file instanceof File) {
          data.append("event[cover_image]", img.file);
        }
      });
    }

    eventImageRatios.forEach(({ key }) => {
      const images = formData[key];
      if (Array.isArray(images) && images.length > 0) {
        images.forEach((img) => {
          if (img?.file instanceof File) {
            data.append(`event[${key}][]`, img.file);
          }
        });
      }
    });

    // Handle 16:9 preview image from new structure
    if (Array.isArray(formData.event_images_16_by_9)) {
      formData.event_images_16_by_9.forEach((img) => {
        if (img.file instanceof File) {
          data.append("event[event_images]", img.file);
        }
      });
    }

    // === REMINDERS ===
    preparedReminders.forEach((reminder, index) => {
      if (reminder.id)
        data.append(
          `event[set_reminders_attributes][${index}][id]`,
          reminder.id
        );
      if (reminder._destroy) {
        data.append(`event[set_reminders_attributes][${index}][_destroy]`, "1");
      } else {
        if (reminder.days)
          data.append(
            `event[set_reminders_attributes][${index}][days]`,
            reminder.days
          );
        if (reminder.hours)
          data.append(
            `event[set_reminders_attributes][${index}][hours]`,
            reminder.hours
          );
        if (reminder.minutes)
          data.append(
            `event[set_reminders_attributes][${index}][minutes]`,
            reminder.minutes
          );
        if (reminder.weeks)
          data.append(
            `event[set_reminders_attributes][${index}][weeks]`,
            reminder.weeks
          );
      }
    });

    // === USERS ===
    if (Array.isArray(formData.user_id)) {
      if (formData.user_id.length > 0) {
        formData.user_id.forEach((id) => data.append("event[user_ids][]", id));
      } else {
        data.append("event[user_ids][]", "");
      }
    }

    // For groups
    // if (formData.group_id) {
    //   const groupIds = formData.group_id.split(",").filter(Boolean);
    //   if (groupIds.length > 0) {
    //     groupIds.forEach((id) => data.append("event[group_id][]", id));
    //   } else {
    //     data.append("event[group_id][]", ""); // to clear groups
    //   }
    // }

    // === RSVP FIELDS ===
    if (formData.rsvp_action === "yes") {
      data.append("event[rsvp_name]", formData.rsvp_name || "");
      data.append("event[rsvp_number]", formData.rsvp_number || "");
    }

    // === REMOVED EXISTING IMAGES ===
    const originalIds = formData.existingImages?.map((img) => img.id) || [];
    const currentIds =
      formData.previewImage
        ?.filter((img) => img.isExisting)
        .map((img) => img.id) || [];

    const removedIds = originalIds.filter((id) => !currentIds.includes(id));
    removedIds.forEach((id) => data.append("event[removed_image_ids][]", id));

    // === EVERYTHING ELSE (Primitive values only) ===
    Object.entries(formData).forEach(([key, value]) => {
      if (
        [
          "cover_image",
          "attachfile",
          "existingImages",
          "newImages",
          "previewImage",
          "shared",
          "set_reminders_attributes",
          "user_id",
          "group_id", // Add group_id to skipped keys
          "rsvp_name",
          "rsvp_number",
          "event_images",
        ].includes(key)
      ) {
        return; // Skip handled keys
      }

      if (value !== null && value !== undefined && typeof value !== "object") {
        data.append(`event[${key}]`, value);
      }
    });

    // === SEND REQUEST ===
    try {
      const response = await axios.put(`${baseURL}events/${id}.json`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Event updated successfully!");
      navigate("/event-list");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to update event.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    // Get local date and time in "YYYY-MM-DDTHH:MM" format
    const pad = (n) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  const handleCancel = () => {
    navigate(-1);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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

  // CSV File Upload Handler
  const handleCsvFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const isValid = file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      if (!isValid) {
        toast.error(`${file.name} is not a valid CSV/Excel file`);
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      setCsvFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) added successfully`);
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
    console.log('Download QR Code:', qrCodeId);
  };

  const handleSendQRCodeEmail = (email, cpName) => {
    toast.success(`Sending QR Code to ${email}`);
    console.log('Send QR Code to:', email);
  };

  const handleDownloadAllQRCodes = () => {
    toast.success('Downloading all QR Codes');
    console.log('Download All QR Codes');
  };

  const handleSendAllQRCodesEmail = () => {
    toast.success('Sending QR Codes to all channel partners');
    console.log('Send All QR Codes via Email');
  };

  // Step navigation functions
  const handleStepClick = (step: number) => {
    if (isPreviewMode) {
      const sectionId = `section-step-${step}`;
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if (step > currentStep) {
      toast.error(`Please complete Step ${currentStep + 1} before proceeding to Step ${step + 1}`);
      return;
    }
    setCurrentStep(step);
    setShowPreviousSections(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleProceedToSave = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

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
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
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
    const steps = ['Event Details', 'Event Related Images', 'Invite CPs'];

    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: 0
        }}>
          {steps.map((label, index) => (
            <Box key={`step-${index}`} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: '213px',
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
                    width: '187px',
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
                    height: '0px',
                    border: '1px dashed rgba(196, 184, 157, 1)',
                    borderWidth: '1px',
                    borderStyle: 'dashed',
                    borderColor: 'rgba(196, 184, 157, 1)',
                    opacity: 1,
                    margin: '0 0px',
                    '@media (max-width: 1200px)': {
                      width: '40px'
                    },
                    '@media (max-width: 900px)': {
                      width: '30px'
                    },
                    '@media (max-width: 600px)': {
                      width: '20px'
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
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Project</InputLabel>
                <MuiSelect
                  value={formData.project_id || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, project_id: e.target.value }))}
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

              {/* Event Type */}
              {/* <TextField
                label="Event Type"
                placeholder="Enter Event Type"
                value={formData.event_type || ""}
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

              {/* Event From */}
              <TextField
                label="Event From"
                type="datetime-local"
                value={formatDateForInput(formData.from_time) || ""}
                onChange={handleChange}
                name="from_time"
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

              {/* Event To */}
              <TextField
                label="Event To"
                type="datetime-local"
                value={formatDateForInput(formData.to_time)}
                onChange={handleChange}
                name="to_time"
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
              <div className="md:col-span-3">
                <TextField
                  label="Event Description"
                  placeholder="Enter Event Description"
                  value={formData.description}
                  onChange={handleChange}
                  name="description"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      minHeight: '90px',
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
              </div>
            </div>

              {/* Radio Button Groups in a Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                {/* RSVP Action */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RSVP Action</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="rsvp_action"
                        value="yes"
                        checked={formData.rsvp_action === "yes"}
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
                        value="no"
                        checked={formData.rsvp_action === "no"}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#C72030] focus:ring-[#C72030]"
                        style={{ accentColor: '#C72030' }}
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* RSVP Fields */}
              {/* {formData.rsvp_action === "yes" && (
                <>
                  <TextField
                    label="RSVP Name"
                    placeholder="Enter RSVP Name"
                    value={formData.rsvp_name || ""}
                    onChange={handleChange}
                    name="rsvp_name"
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
                    label="RSVP Number"
                    placeholder="Enter RSVP Number"
                    value={formData.rsvp_number || ""}
                    onChange={handleChange}
                    name="rsvp_number"
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
                </>
              )} */}

              {/* Set Reminders */}
              <div className="md:col-span-3">
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

                {/* Display Reminders */}
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
              </div>

              {/* Share With */}
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
                          user_id: [],
                          group_id: "",
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
                          group_id: "",
                        }))
                      }
                      disabled={!eventUserID || eventUserID.length === 0}
                      className="w-4 h-4 text-[#C72030] focus:ring-[#C72030] disabled:opacity-50"
                      style={{ accentColor: '#C72030' }}
                    />
                    <span className={`ml-2 text-sm ${!eventUserID || eventUserID.length === 0 ? 'text-gray-400' : 'text-gray-700'}`}>Individuals</span>
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
                      value={Array.isArray(formData.user_id) ? formData.user_id.map(id => id.toString()) : []}
                      onChange={(e) => {
                        const selectedIds = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          user_id: Array.isArray(selectedIds) ? selectedIds.map(id => parseInt(id)) : [],
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
                            const user = eventUserID.find((u) => u.id.toString() === id);
                            return user ? `${user.firstname} ${user.lastname}` : id;
                          })
                          .join(", ");
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select Users
                      </MenuItem>
                      {eventUserID?.map((user) => (
                        <MenuItem key={user.id} value={user.id.toString()}>
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
                      {groups?.map((group) => (
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
        // </div>
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
              <div>
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
              </div>

              {/* OR Divider */}
              <div className="flex items-center justify-center">
                <span className="text-sm font-medium text-gray-500">Or</span>
              </div>

              {/* CSV File Upload Section */}
              <div>
                <div className="border-2 border-dashed border-[#D9D9D9] rounded-lg p-6 min-h-[200px]">
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
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-base font-semibold">
                  Event Cover Image{" "}
                  <span
                    className="tooltip-container relative inline-block cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    [i]
                    {showTooltip && (
                      <span className="tooltip-text absolute bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-0 whitespace-nowrap">
                        Max Upload Size 3 MB and Required ratio is 16:9
                      </span>
                    )}
                  </span>
                </h5>

                <button
                  className="bg-[#C72030] hover:bg-[#B8252F] text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                  type="button"
                  onClick={() => setShowCoverUploader(true)}
                >
                  <Plus size={16} />
                  <span>Add Cover Image</span>
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
                        handleCoverImageCropComplete(validImages, "cover_image")
                      }
                    />
                  )}

              <div className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Preview</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Ratio</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                          {formData.cover_image?.document_url && (
                            <TableRow className="hover:bg-gray-50">
                              <TableCell>
                                {formData.cover_image.document_file_name ||
                                  formData.cover_image.file_name ||
                                  formData.cover_image.document_url
                                    ?.split("/")
                                    ?.pop() ||
                                  "Cover Image"}
                              </TableCell>
                              <TableCell>
                                <img
                                  src={formData.cover_image.document_url}
                                  alt="Cover Preview"
                                  className="img-fluid rounded"
                                  style={{
                                    maxWidth: "100px",
                                    maxHeight: "100px",
                                    objectFit: "cover",
                                  }}
                                />
                              </TableCell>
                              <TableCell>N/A</TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors duration-200"
                                  onClick={() =>
                                    handleFetchedDiscardGallery("cover_image")
                                  }
                                >
                                  Delete
                                </button>
                              </TableCell>
                            </TableRow>
                          )}

                          {coverImageRatios.flatMap(({ key, label }) => {
                            const files = Array.isArray(formData[key])
                              ? formData[key]
                              : formData[key]
                              ? [formData[key]]
                              : [];

                            if (files.length === 0) return [];

                            return files.map((file, index) => {
                              const preview =
                                file.preview || file.document_url || "";
                              const name =
                                file.name ||
                                file.document_file_name ||
                                `Image ${index + 1}`;
                              const ratio = file.ratio || label;

                              return (
                                <TableRow key={`${key}-${file.id || index}`} className="hover:bg-gray-50">
                                  <TableCell>{name}</TableCell>
                                  <TableCell>
                                    {preview ? (
                                      <img
                                        style={{
                                          maxWidth: 100,
                                          maxHeight: 100,
                                          objectFit: "cover",
                                        }}
                                        className="img-fluid rounded"
                                        src={preview}
                                        alt={name}
                                        onError={(e) => {
                                          console.error(
                                            `Failed to load image: ${preview}`
                                          );
                                          e.target.src =
                                            "https://via.placeholder.com/100?text=Preview+Failed";
                                        }}
                                      />
                                    ) : (
                                      <span>No Preview Available</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{ratio}</TableCell>
                                  <TableCell>
                                    <button
                                      type="button"
                                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors duration-200"
                                      onClick={() =>
                                        handleFetchedDiscardGallery(
                                          key,
                                          index,
                                          file.id
                                        )
                                      }
                                    >
                                      Delete
                                    </button>
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          })}

                          {coverImageRatios.every(
                            ({ key }) =>
                              !(formData[key] && formData[key].length > 0)
                          ) && (
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

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-base font-semibold">
                        Event Attachment Images{" "}
                        <span
                          className="tooltip-container relative inline-block cursor-pointer"
                          onMouseEnter={() => setShowAttachmentTooltip(true)}
                          onMouseLeave={() => setShowAttachmentTooltip(false)}
                        >
                          [i]
                          {showAttachmentTooltip && (
                            <span className="tooltip-text">
                              Max Upload Size for video 10 MB and for image 3 MB
                            </span>
                          )}
                        </span>
                      </h5>
                      <button
                        className="bg-[#C72030] hover:bg-[#B8252F] text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                        type="button"
                        onClick={() => setShowEventUploader(true)}
                      >
                        <Plus size={16} />
                        <span>Add Event Images</span>
                      </button>
                      {showEventUploader && (
                        <ProjectImageVideoUpload
                          onClose={() => setShowEventUploader(false)}
                          includeInvalidRatios={false}
                          selectedRatioProp={selectedEventRatios}
                          showAsModal={true}
                          label={eventImageLabel}
                          description={dynamicEventDescription}
                        onContinue={(validImages, videoFiles) =>
                          handleEventCroppedImages(
                            validImages,
                            videoFiles,
                            "event"
                          )
                        }
                        allowVideos={true}
                      />
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                            <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                            <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Preview</TableHead>
                            <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Ratio</TableHead>
                            <TableHead className="font-semibold text-gray-900 py-3 px-4">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(formData.attachfile) &&
                            formData.attachfile.map((file) => (
                              <TableRow key={`attachfile-${file.id}`} className="hover:bg-gray-50">
                                <TableCell>{file.document_file_name || "N/A"}</TableCell>
                                <TableCell>
                                  {file.document_url && (
                                    <img
                                      style={{
                                        maxWidth: "100px",
                                        maxHeight: "100px",
                                      }}
                                      className="img-fluid rounded"
                                      src={file.document_url}
                                      alt={
                                        file.document_file_name ||
                                        "Attached file"
                                      }
                                    />
                                  )}
                                </TableCell>
                                <TableCell>N/A</TableCell>
                                <TableCell>
                                  <button
                                    type="button"
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors duration-200"
                                    onClick={() =>
                                      handleFetchedDiscardGallery(file.id)
                                    }
                                    title="Remove attached file"
                                  >
                                    Delete
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))}
                          {eventImageRatios.flatMap(({ key, label }) => {
                            const files = Array.isArray(formData[key])
                              ? formData[key]
                              : formData[key]
                              ? [formData[key]]
                              : [];

                            if (files.length === 0) return [];

                            return files.map((file, index) => {
                              const preview =
                                file.preview || file.document_url || "";
                              const name =
                                file.name ||
                                file.document_file_name ||
                                `File ${index + 1}`;
                              const ratio = file.ratio || label;
                              const isVideo =
                                file.type === "video" ||
                                (file.file &&
                                  file.file.type.startsWith("video/")) ||
                                (preview &&
                                  [".mp4", ".webm", ".ogg"].some((ext) =>
                                    preview.toLowerCase().endsWith(ext)
                                  ));

                              return (
                                <TableRow key={`${key}-${file.id || index}`} className="hover:bg-gray-50">
                                  <TableCell>{name}</TableCell>
                                  <TableCell>
                                    {isVideo ? (
                                      <video
                                        controls
                                        style={{
                                          maxWidth: 100,
                                          maxHeight: 100,
                                          objectFit: "cover",
                                        }}
                                        className="img-fluid rounded"
                                      >
                                        <source
                                          src={preview}
                                          type={file.file?.type || "video/mp4"}
                                        />
                                        Your browser does not support the video
                                        tag.
                                      </video>
                                    ) : (
                                      <img
                                        style={{
                                          maxWidth: 100,
                                          maxHeight: 100,
                                          objectFit: "cover",
                                        }}
                                        className="img-fluid rounded"
                                        src={preview}
                                        alt={name}
                                        onError={(e) => {
                                          console.error(
                                            `Failed to load image: ${preview}`
                                          );
                                          e.target.src =
                                            "https://via.placeholder.com/100?text=Preview+Failed";
                                        }}
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell>{ratio}</TableCell>
                                  <TableCell>
                                    <button
                                      type="button"
                                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors duration-200"
                                      onClick={() =>
                                        handleFetchedDiscardGallery(
                                          key,
                                          index,
                                          file.id
                                        )
                                      }
                                    >
                                      Delete
                                    </button>
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          })}

                          {eventImageRatios.every(
                            ({ key }) =>
                              !(formData[key] && formData[key].length > 0)
                          ) &&
                            !Array.isArray(formData.attachfile) && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500">
                                  No event attachments uploaded
                                </TableCell>
                              </TableRow>
                            )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
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

        {/* Action Buttons - Show in preview mode */}
        {isPreviewMode && (
        <div className="flex gap-4 justify-center pt-6">
            <button
              onClick={handleSubmit}
              type="submit"
              className="px-6 py-2.5 bg-[#C72030] hover:bg-[#B8252F] text-white rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              Submit
            </button>
            <button
              type="button"
              className="px-6 py-2.5 border-2 border-[#C72030] text-[#C72030] hover:bg-[#C72030] hover:text-white rounded-lg transition-colors duration-200"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        )}
        </form>

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

  export default EventEdit;