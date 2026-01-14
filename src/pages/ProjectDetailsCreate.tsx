import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PropertySelect from "../components/ui/property-select";
import SelectBox from "../components/ui/select-box";
import MultiSelectBox from "../components/ui/multi-selector";
import { ImageCropper } from "../components/reusable/ImageCropper";
import { ImageUploadingButton } from "../components/reusable/ImageUploadingButton";
import ProjectBannerUpload from "../components/reusable/ProjectBannerUpload";
import ProjectImageVideoUpload from "../components/reusable/ProjectImageVideoUpload";
import { API_CONFIG, getFullUrl, getAuthHeader } from "../config/apiConfig";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MUISelect,
  MenuItem,
  Avatar,
  Switch,
} from "@mui/material";
import { Building2, FileText, Trash2, ArrowLeft, Delete, DeleteIcon, Info } from "lucide-react";
import { EnhancedTable } from "../components/enhanced-table/EnhancedTable";
import "../styles/mor.css";
import { DeleteForever, DeleteForeverOutlined, DeleteForeverRounded, DeleteForeverSharp, DeleteForeverTwoTone, DeleteOutlined, DeleteOutlineOutlined, DeleteOutlineRounded, DeleteSweepOutlined, DeleteSweepRounded, DeleteSweepSharp, DeleteSweepTwoTone, FileUpload, SettingsOutlined as SettingsOutlinedIcon } from "@mui/icons-material";
import { Button } from "react-day-picker";
import { DeleteCompanyModal } from "@/components/DeleteCompanyModal";
import { DeleteCountryModal } from "@/components/DeleteCountryModal";
import { DeletePatrollingModal } from "@/components/DeletePatrollingModal";

// Custom MultiValue component for react-select
const CustomMultiValue = (props) => (
  <div
    style={{
      position: "relative",
      backgroundColor: "#E5E0D3",
      borderRadius: "2px",
      margin: "3px",
      marginTop: "10px",
      padding: "4px 10px 6px 10px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      paddingRight: "28px",
    }}
  >
    <span
      style={{
        color: "#1a1a1a8a",
        fontSize: "13px",
        fontWeight: "500",
      }}
    >
      {props.data.label}
    </span>
    <button
      onClick={(e) => {
        e.stopPropagation();
        props.removeProps.onClick(e);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        props.removeProps.onMouseDown(e);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        props.removeProps.onTouchEnd(e);
      }}
      style={{
        position: "absolute",
        right: "-10px",
        top: "3px",
        transform: "translateY(-50%), translateX(-50%)",
        background: "transparent",
        border: "1px solid #ccc",
        borderRadius: "50%",
        cursor: "pointer",
        padding: "0",
        display: "flex",
        alignItems: "start",
        justifyContent: "center",
        color: "#666",
        fontSize: "16px",
        lineHeight: "1",
        width: "20px",
        height: "20px",
      }}
      type="button"
    >
      ×
    </button>
  </div>
);

// Custom styles for react-select
const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "44px",
    borderColor: state.isFocused ? "#C72030" : "#dcdcdc",
    boxShadow: "none",
    fontSize: "14px",
    paddingTop: "6px",
    backgroundColor: "transparent",
    "&:hover": { borderColor: "#C72030" },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "4px 6px",
    flexWrap: "wrap",
    backgroundColor: "transparent",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    padding: "4px 8px",
    color: state.isFocused ? "#C72030" : "#666",
    "&:hover": { color: "#C72030" },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  placeholder: (provided) => ({
    ...provided,
    color: "#999",
    fontSize: "14px",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    fontSize: "14px",
    backgroundColor: "#fff",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#C72030"
      : state.isFocused
        ? "#F6F4EE"
        : "#fff",
    color: state.isSelected ? "#fff" : "#1A1A1A",
    fontSize: "14px",
    padding: "8px 12px",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#F6F4EE",
      color: "#1A1A1A",
    },
    "&:active": {
      backgroundColor: "#C72030",
      color: "#fff",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "transparent",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#1a1a1a8a",
    fontSize: "13px",
    fontWeight: "500",
  }),
};

// Field styles for Material-UI components
const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": {
      borderColor: "#ddd",
    },
    "&:hover fieldset": {
      borderColor: "#C72030",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#C72030",
    },
  },
};

const ProjectDetailsCreate = () => {
  const [formData, setFormData] = useState({
    Property_Type: "",
    Property_type_id: "",
    building_type: "",
    SFDC_Project_Id: "",
    Project_Construction_Status: "",
    Construction_Status_id: "",
    Configuration_Type: "",
    Project_Name: "",
    project_address: "",
    Project_Description: "",
    Price_Onward: "",
    Project_Size_Sq_Mtr: "",
    Project_Size_Sq_Ft: "",
    development_area_sqft: "",
    development_area_sqmt: "",
    Rera_Carpet_Area_Sq_M: "",
    Rera_Carpet_Area_sqft: "",
    Rera_Sellable_Area: "",
    Number_Of_Towers: "",
    Number_Of_Units: "",
    no_of_floors: "",
    Rera_Number_multiple: [],
    Amenities: [],
    Specifications: [],
    Land_Area: "",
    land_uom: "",
    project_tag: "",
    virtual_tour_url_multiple: [],
    map_url: "",
    image: [],
    Address: {
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      pin_code: "",
      country: "",
    },
    brochure: [],
    two_d_images: [],
    videos: [],
    gallery_image: [],
    project_ppt: [],
    //project_creatives: [],
    project_creatives: [],
    project_creative_generics: [],
    project_creative_offers: [],
    project_interiors: [],
    project_exteriors: [],
    project_emailer_templetes: [],
    KnwYrApt_Technical: [],
    project_layout: [],
    project_sales_type: "",
    order_no: null,
    video_preview_image_url: [],
    enable_enquiry: false,
    rera_url: "",
    isDay: true,
    disclaimer: "",
    project_qrcode_image: [],
    cover_images: [],
    is_sold: false,
    plans: [],
    show_on_home: false,
    connectivities: [],
  });

  const [projectsType, setprojectsType] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [activeToastId, setActiveToastId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [virtualTourUrl, setVirtualTourUrl] = useState("");
  const [virtualTourName, setVirtualTourName] = useState("");
  const [towerName, setTowerName] = useState("");
  const [reraNumber, setReraNumber] = useState("");
  const [reraUrl, setReraUrl] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [filteredAmenities, setFilteredAmenities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [projectCreatives, setProjectCreatives] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [selectedCreativeType, setSelectedCreativeType] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [allBuildingTypes, setAllBuildingTypes] = useState([]);
  const [buildingTypes, setBuildingTypes] = useState([]);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState([]);
  // const [showTooltip, setShowTooltip] = useState(false);
  const [showQrTooltip, setShowQrTooltip] = useState(false);
  // const [image, setImage] = useState([]);
  const [mainImageUpload, setMainImageUpload] = useState([]);
  const [coverImageUpload, setCoverImageUpload] = useState([]);
  const [galleryImageUpload, setGalleryImageUpload] = useState([]);
  const [floorPlanImageUpload, setFloorPlanImageUpload] = useState([]);
  const [planName, setPlanName] = useState("");
  const [planImages, setPlanImages] = useState([]);
  const [plans, setPlans] = useState([]);
  const [pendingImageUpload, setPendingImageUpload] = useState([]);
  const [showUploader, setShowUploader] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [imageConfigurations, setImageConfigurations] = useState({
    ProjectImage: [],
    ProjectCoverImage: [],
    ProjectGallery: [],
    Project2DImage: [],
    BannerAttachment: [],
    EventImage: [],
    EventCoverImage: [],
  });
  const [showTooltipBanner, setShowTooltipBanner] = useState(false);
  const [showTooltipCover, setShowTooltipCover] = useState(false);
  const [showTooltipGallery, setShowTooltipGallery] = useState(false);
  const [showTooltipFloor, setShowTooltipFloor] = useState(false);
  const [showTooltipPlans, setShowTooltipPlans] = useState(false);
  const [showTooltipBrochure, setShowTooltipBrochure] = useState(false);
  const [showTooltipPPT, setShowTooltipPPT] = useState(false);
  const [showTooltipLayout, setShowTooltipLayout] = useState(false);
  const [showTooltipCreatives, setShowTooltipCreatives] = useState(false);
  const [showTooltipCreativeGenerics, setShowTooltipCreativeGenerics] = useState(false);
  const [showTooltipCreativeOffers, setShowTooltipCreativeOffers] = useState(false);
  const [showTooltipInteriors, setShowTooltipInteriors] = useState(false);
  const [showTooltipExteriors, setShowTooltipExteriors] = useState(false);
  const [showTooltipEmailer, setShowTooltipEmailer] = useState(false);
  const [showTooltipKYA, setShowTooltipKYA] = useState(false);
  const [showTooltipVideos, setShowTooltipVideos] = useState(false);
  const [connectivityTypes, setConnectivityTypes] = useState([]);
  const [visibility, setVisibility] = useState({
    showOnHomePage: false,
    showOnProjectDetailPage: false,
    showOnBookingPage: false,
    featuredEvent: false,
  });

  const [dialogOpen, setDialogOpen] = useState({
    image: false,
    cover_images: false,
    gallery_image: false,
    two_d_images: false,
    plan_images: false,
  });

  const projectUploadConfig = {
    image: ["9:16", "1:1", "16:9", "3:2"],
    "cover images": ["1:1", "16:9", "9:16", "3:2"],
    "gallery image": ["16:9", "1:1", "9:16", "3:2"],
    "project 2d image": ["16:9", "1:1", "9:16", "3:2"],
  };

  const coverImageType = "cover images";
  const galleryImageType = "gallery image";
  const floorImageType = "project 2d image";
  const bannerImageType = "image";

  const selectedCoverRatios = projectUploadConfig[coverImageType] || [];
  const selectedGalleryRatios = projectUploadConfig[galleryImageType] || [];
  const selectedFloorRatios = projectUploadConfig[floorImageType] || [];
  const selectedBannerRatios = projectUploadConfig[bannerImageType] || [];

  const coverImageLabel = coverImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const galleryImageLabel = galleryImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const floorImageLabel = floorImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const bannerImageLabel = bannerImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );

  const dynamicDescription = `Supports ${selectedCoverRatios.join(
    ", "
  )} aspect ratios`;
  const dynamicDescription1 = `Supports ${selectedGalleryRatios.join(
    ", "
  )} aspect ratios`;
  const dynamicDescription2 = `Supports ${selectedFloorRatios.join(
    ", "
  )} aspect ratios`;
  const dynamicDescription3 = `Supports ${selectedBannerRatios.join(
    ", "
  )} aspect ratios`;

  // Image ratio configuration arrays
  const project_banner = [
    { key: "image_1_by_1", label: "1:1" },
    { key: "image_16_by_9", label: "16:9" },
    { key: "image_9_by_16", label: "9:16" },
    { key: "image_3_by_2", label: "3:2" },
  ];

  const coverImageRatios = [
    { key: "cover_images_1_by_1", label: "1:1" },
    { key: "cover_images_16_by_9", label: "16:9" },
    { key: "cover_images_9_by_16", label: "9:16" },
    { key: "cover_images_3_by_2", label: "3:2" },
  ];

  const gallery_images = [
    { key: "gallery_image_16_by_9", label: "16:9" },
    { key: "gallery_image_1_by_1", label: "1:1" },
    { key: "gallery_image_9_by_16", label: "9:16" },
    { key: "gallery_image_3_by_2", label: "3:2" },
  ];

  const floorPlanRatios = [
    { key: "project_2d_image_16_by_9", label: "16:9" },
    { key: "project_2d_image_1_by_1", label: "1:1" },
    { key: "project_2d_image_3_by_2", label: "3:2" },
    { key: "project_2d_image_9_by_16", label: "9:16" },
  ];

  // Helper function to format ratio
  const formatRatio = (value) => {
    if (!value) return "";
    const match = value.match(/(\d+)_by_(\d+)/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
    return value;
  };

  // Get dynamic ratios text for tooltips
  const getDynamicRatiosText = (configName) => {
    const ratios = imageConfigurations[configName] || [];
    if (ratios.length === 0) return "No ratios configured";
    return `Required ratio${ratios.length > 1 ? "s" : ""}: ${ratios.join(", ")}`;
  };

  // Virtual tour handlers
  const handleVirtualTourNameChange = (e) => {
    setVirtualTourName(e.target.value);
  };

  const handleVirtualTourChange = (e) => {
    setVirtualTourUrl(e.target.value);
  };

  const handleAddVirtualTour = () => {
    if (!virtualTourName.trim() || !virtualTourUrl.trim()) {
      toast.error("Please enter both tour name and URL");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      virtual_tour_url_multiple: [
        ...prev.virtual_tour_url_multiple,
        {
          virtual_tour_name: virtualTourName,
          virtual_tour_url: virtualTourUrl,
        },
      ],
    }));

    setVirtualTourName("");
    setVirtualTourUrl("");
    toast.success("Virtual tour added successfully!");
  };

  const updateFormData = (key, files) => {
    setFormData((prev) => {
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      return {
        ...prev,
        [key]: [...existing, ...files],
      };
    });
  };

  // Function to handle gallery image name and order changes
  const handleGalleryImageNameChange = (
    groupKey,
    imageIndex,
    newValue,
    fieldType = "file_name"
  ) => {
    setFormData((prevData) => ({
      ...prevData,
      [groupKey]: prevData[groupKey].map((img, index) =>
        index === imageIndex ? { ...img, [fieldType]: newValue } : img
      ),
    }));
  };

  const handleCroppedCoverImages = (
    validImages,
    type = "cover",
    videoFiles = []
  ) => {
    // Handle video files first (including GIFs)
    if (videoFiles && videoFiles.length > 0) {
      videoFiles.forEach((video) => {
        const formattedRatio = video.ratio.replace(":", "_by_");
        let prefix = "";

        switch (type) {
          case "gallery":
            prefix = galleryImageType; // "gallery image"
            break;
          case "floor":
            prefix = floorImageType; // "floor plan"
            break;
          case "banner":
            prefix = bannerImageType; // "banner image" for banner
            break;
          case "cover":
          default:
            prefix = coverImageType; // "cover image"
            break;
        }

        const key = `${prefix}_${formattedRatio}`
          .replace(/\s+/g, "_")
          .toLowerCase();
        updateFormData(key, [video]);
      });

      closeModal(type);
      return;
    }

    // Handle images if no videos
    if (!validImages || validImages.length === 0) {
      toast.error(
        `No valid ${type} image${
          ["cover", "banner"].includes(type) ? "" : "s"
        } selected.`
      );
      closeModal(type);
      return;
    }

    validImages.forEach((img) => {
      const formattedRatio = img.ratio.replace(":", "_by_");
      let prefix = "";

      switch (type) {
        case "gallery":
          prefix = galleryImageType;
          break;
        case "floor":
          prefix = floorImageType;
          break;
        case "banner":
          prefix = bannerImageType;
          break;
        case "cover":
        default:
          prefix = coverImageType;
          break;
      }

      const key = `${prefix}_${formattedRatio}`
        .replace(/\s+/g, "_")
        .toLowerCase();
      updateFormData(key, [img]);
    });

    closeModal(type);
  };

  const handleCroppedImages = (validImages, type = "cover") => {
    if (!validImages || validImages.length === 0) {
      toast.error(
        `No valid ${type} image${
          ["cover", "banner"].includes(type) ? "" : "s"
        } selected.`
      );
      closeModal(type);
      return;
    }

    validImages.forEach((img) => {
      const formattedRatio = img.ratio.replace(":", "_by_");
      let prefix = "";

      switch (type) {
        case "gallery":
          prefix = galleryImageType; // "gallery image"
          break;
        case "floor":
          prefix = floorImageType; // "floor plan"
          break;
        case "banner":
          prefix = bannerImageType; // "banner image" for banner
          break;
        case "cover":
        default:
          prefix = coverImageType; // "cover image"
          break;
      }

      const key = `${prefix}_${formattedRatio}`
        .replace(/\s+/g, "_")
        .toLowerCase();

      // Add file_name property to the image object
      const imageWithName = {
        ...img,
        file_name: img.name || `${type} Image ${Date.now()}`,
      };

      updateFormData(key, [imageWithName]);
    });

    closeModal(type);
  };

  const closeModal = (type) => {
    switch (type) {
      case "gallery":
        setShowGalleryModal(false);
        break;
      case "floor":
        setShowFloorPlanModal(false);
        break;

      case "banner":
        setShowBannerModal(false);
        break;
      case "cover":
      default:
        setShowUploader(false);
        break;
    }
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
  };

  const errorToastRef = useRef(null);
  const Navigate = useNavigate();

  const [reraList, setReraList] = useState([{ tower: "", reraNumber: "" }]);

  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
  const MAX_BROCHURE_SIZE = 20 * 1024 * 1024; // 20MB
  const MAX_PPT_SIZE = 10 * 1024 * 1024; // 10MB

  // Format file size to human-readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  // Function to check file size
  const isFileSizeValid = (file, maxSize) => {
    if (file.size > maxSize) {
      return {
        valid: false,
        name: file.name,
        size: formatFileSize(file.size),
      };
    }
    return { valid: true };
  };

  const handleImageUploaded = (newImageList, type) => {
    if (!newImageList || newImageList.length === 0) return;

    const file = newImageList[0].file;
    if (!file) return;

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    const fileType = file.type;
    const sizeInMB = file.size / (1024 * 1024);

    if (!allowedImageTypes.includes(fileType)) {
      toast.error("Please upload a valid image.");
      return;
    }

    if (sizeInMB > 5) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    if (type === "cover_images") {
      // Skip cropper for GIFs
      if (fileType === "image/gif") {
        setFormData((prev) => ({
          ...prev,
          cover_images: Array.isArray(prev.cover_images)
            ? [...prev.cover_images, file]
            : [file],
        }));
        setCoverImageUpload([]);
        setDialogOpen((prev) => ({ ...prev, cover_images: false }));
        return;
      }
      setCoverImageUpload(newImageList);
      setDialogOpen((prev) => ({ ...prev, cover_images: true }));
    } else if (type === "image") {
      setPendingImageUpload(newImageList);
      setDialogOpen((prev) => ({ ...prev, image: true }));
    } else if (type === "gallery_image") {
      setGalleryImageUpload(newImageList);
      setDialogOpen((prev) => ({ ...prev, gallery_image: true }));
    } else if (type === "two_d_images") {
      setFloorPlanImageUpload(newImageList);
      setDialogOpen((prev) => ({ ...prev, two_d_images: true }));
    }
  };

  useEffect(() => {
    axios
      .get(getFullUrl('/property_types.json'))
      .then((response) => {
        const options = response.data
          .filter((type) => type.active === true)
          .map((type) => ({
            value: type.property_type,
            label: type.property_type,
            id: type.id,
          }));
        setPropertyTypeOptions(options);
      })
      .catch((error) => {
        console.error("Error fetching property types:", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch amenities
  useEffect(() => {
    axios
      .get(getFullUrl('/amenity_setups.json'))
      .then((response) => {
        const allAmenities = response.data.amenities_setups || [];
        setAmenities(allAmenities.filter((amenity) => amenity.active === true));
      })
      .catch((error) => {
        console.error("Error fetching amenities:", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch configurations
  useEffect(() => {
    axios
      .get(getFullUrl('/configuration_setups.json'))
      .then((response) => {
        setConfigurations(response.data.filter((config) => config.active === true));
      })
      .catch((error) => {
        console.error("Error fetching configurations:", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch status options
  useEffect(() => {
    axios
      .get(getFullUrl('/construction_statuses.json'))
      .then((response) => {
        const options = response.data
          .filter((status) => status.active === true)
          .map((status) => ({
            value: status.construction_status,
            label: status.construction_status,
            id: status.id,
          }));
        setStatusOptions(options);
      })
      .catch((error) => {
        console.error("Error fetching status options:", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBuildingTypes = async () => {
    try {
      const response = await axios.get(getFullUrl('/building_types.json'));
      const options = response.data
        .filter((item) => item.active === true)
        .map((type) => ({
          value: type.building_type,
          label: type.building_type,
        }));
      setBuildingTypes(options);
    } catch (error) {
      console.error("Error fetching building types:", error);
      toast.error("Failed to fetch building types");
    }
  };

  const fetchConnectivityTypes = async () => {
    try {
      const response = await axios.get(getFullUrl('/connectivity_types.json'));
      if (response.data && Array.isArray(response.data)) {
        // Filter only active connectivity types
        const activeTypes = response.data.filter(type => type.active);
        setConnectivityTypes(activeTypes);
      } else {
        setConnectivityTypes([]);
      }
    } catch (error) {
      console.error('Error fetching connectivity types:', error);
      toast.error('Failed to fetch connectivity types');
      setConnectivityTypes([]);
    }
  };

  useEffect(() => {
    fetchBuildingTypes();
    fetchImageConfigurations();
    fetchConnectivityTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch image configurations from API
  const fetchImageConfigurations = async () => {
    try {
      const response = await axios.get(
        getFullUrl('/system_constants.json?q[description_eq]=ImagesConfiguration')
      );
      
      if (response.data && Array.isArray(response.data)) {
        const configs = {};
        
        response.data.forEach((config) => {
          const { name, value } = config;
          
          // Extract ratio from value (e.g., "image_16_by_9" -> "16:9")
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
        ProjectImage: ['9:16', '1:1', '16:9', '3:2'],
        ProjectCoverImage: ['1:1', '16:9', '9:16', '3:2'],
        ProjectGallery: ['16:9', '1:1', '9:16', '3:2'],
        Project2DImage: ['16:9', '1:1', '9:16', '3:2'],
        BannerAttachment: ['1:1', '9:16', '16:9', '3:2'],
        EventImage: ['16:9', '1:1', '9:16', '3:2'],
        EventCoverImage: ['16:9', '1:1', '9:16', '3:2'],
      });
    }
  };

  const handlePropertyTypeChange = async (selectedOption) => {
    const { value, id } = selectedOption;

    setFormData((prev) => ({
      ...prev,
      Property_Type: value,
      Property_type_id: id,
      building_type: "",
    }));

    try {
      const response = await axios.get(
        getFullUrl(`/building_types.json?q[property_type_id_eq]=${id}`)
      );

      const formattedBuildingTypes = response.data
        .filter((item) => item.active === true)
        .map((item) => ({
          value: item.building_type,
          label: item.building_type,
        }));

      setBuildingTypes(formattedBuildingTypes);
    } catch (error) {
      console.error("Error fetching building types:", error);
    }
  };

  const amenityTypes = Array.isArray(amenities)
    ? [
        ...new Set(amenities.map((ammit) => ammit.amenity_type)),
      ].map((type) => ({ value: type, label: type }))
    : [];

  // Filter amenities based on selected type
  useEffect(() => {
    if (selectedType && Array.isArray(amenities)) {
      setFilteredAmenities(
        amenities.filter((ammit) => ammit.amenity_type === selectedType.value)
      );
    } else {
      setFilteredAmenities([]);
    }
  }, [selectedType, amenities]);

  const handleChange = (e) => {
    const { name, type, files, value } = e.target;

    if (type === "file") {
      handleFileUpload(name, files);
    } else {
      if (
        [
          "address_line_1",
          "address_line_2",
          "city",
          "state",
          "pin_code",
          "country",
        ].includes(name)
      ) {
        setFormData((prev) => ({
          ...prev,
          Address: {
            ...prev.Address,
            [name]: value,
          },
        }));
      } else if (name === "virtual_tour_url_multiple") {
        setVirtualTourUrl(value); // Update temporary input state
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }
  };

  const handleProjectCreativesUpload = (files) => {
    if (!files || files.length === 0) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "video/mp4",
      "video/mov",
    ];

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB max per file

    const newFiles = Array.from(files) as File[];
    const validFiles: { file: File; type: string }[] = [];

    newFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return;
      }

      if (file.size > MAX_SIZE) {
        toast.error(`File too large: ${file.name}. Max size is 50MB.`);
        return;
      }

      validFiles.push({ file, type: "" }); // Default type empty, user will select
    });

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        project_creatives: [...prev.project_creatives, ...validFiles],
      }));
    }
  };

  // Modify the handleFileUpload function to handle gallery_images
  const handleFileUpload = (name, files) => {
    const MAX_SIZES = {
      brochure: MAX_BROCHURE_SIZE,
      two_d_images: MAX_IMAGE_SIZE,
      videos: MAX_VIDEO_SIZE,
      image: MAX_IMAGE_SIZE,
      video_preview_image_url: MAX_IMAGE_SIZE,
      gallery_image: MAX_IMAGE_SIZE,
      project_ppt: MAX_PPT_SIZE, // ✅ Ensure project_ppt is included
      project_creatives: MAX_IMAGE_SIZE, // Add creatives support
      cover_images: MAX_IMAGE_SIZE,
      project_creative_generics: MAX_IMAGE_SIZE,
      project_creative_offers: MAX_IMAGE_SIZE,
      project_interiors: MAX_IMAGE_SIZE,
      project_exteriors: MAX_IMAGE_SIZE,
      project_emailer_templetes: MAX_BROCHURE_SIZE,
      KnwYrApt_Technical: MAX_BROCHURE_SIZE,
      project_layout: MAX_IMAGE_SIZE,
      project_qrcode_image: MAX_IMAGE_SIZE,
      plans: MAX_IMAGE_SIZE, // 3MB
    };

    const allowedTypes = {
      image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      video_preview_image_url: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ],
      two_d_images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      gallery_image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      videos: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
      plans: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      project_qrcode_image: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ],
      brochure: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      project_ppt: [
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ], // ✅ PPT & PPTX support
      project_emailer_templetes: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      KnwYrApt_Technical: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      project_creatives: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      cover_images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      project_creative_generics: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ],
      project_creative_offers: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ],
      project_interiors: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      project_exteriors: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      project_layout: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    };

    if (!files || !files.length) return;

    if (name === "project_layout") {
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit

      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (file.size > MAX_SIZE) {
          toast.error("File size must be less than 10MB.");
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          project_layout: [...(prev.project_layout || []), ...validFiles],
        }));
      }
    } else {
      // toast.error("⚠️ Invalid upload category.");
    }

    // Plans are handled separately through the plan name and images interface
    // This section is not used in the current implementation

    if (name === "project_emailer_templetes") {
      // Handle multiple brochure files
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.project_emailer_templetes.includes(file.type)) {
          toast.error(
            "Only PDF and DOCX files are allowed for project emailer templetes."
          );
          return;
        }

        if (!validateFile(file, MAX_SIZES[name])) return;
        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          project_emailer_templetes: [
            ...prev.project_emailer_templetes,
            ...validFiles,
          ],
        }));
      }
    }

    if (name === "KnwYrApt_Technical") {
      // Handle multiple technical files
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.KnwYrApt_Technical.includes(file.type)) {
          toast.error(
            "Only PDF and DOCX files are allowed for project technical files."
          );
          return;
        }

        if (!validateFile(file, MAX_SIZES[name])) return;
        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          KnwYrApt_Technical: [...prev.KnwYrApt_Technical, ...validFiles],
        }));
      }
    }

    if (name === "project_exteriors") {
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.project_exteriors.includes(file.type)) {
          toast.error("Only JPG, PNG, GIF, and WebP images are allowed.");
          return;
        }

        if (file.size > MAX_SIZES.project_exteriors) {
          toast.error("Image size must be less than 3MB.");
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          project_exteriors: [...(prev.project_exteriors || []), ...validFiles],
        }));
      }
    }

    if (name === "project_interiors") {
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.project_interiors.includes(file.type)) {
          toast.error("Only JPG, PNG, GIF, and WebP images are allowed.");
          return;
        }

        if (file.size > MAX_SIZES.project_interiors) {
          toast.error("Image size must be less than 3MB.");
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          project_interiors: [...(prev.project_interiors || []), ...validFiles],
        }));
      }
    }

    if (name === "project_creative_offers") {
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.project_creative_offers.includes(file.type)) {
          toast.error("Only JPG, PNG, GIF, and WebP images are allowed.");
          return;
        }

        if (file.size > MAX_SIZES.project_creative_offers) {
          toast.error("Image size must be less than 3MB.");
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          project_creative_offers: [
            ...(prev.project_creative_offers || []),
            ...validFiles,
          ],
        }));
      }
    }

    if (name === "project_creative_generics") {
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.project_creative_generics.includes(file.type)) {
          toast.error("Only JPG, PNG, GIF, and WebP images are allowed.");
          return;
        }

        if (file.size > MAX_SIZES.project_creative_generics) {
          toast.error("Image size must be less than 3MB.");
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          project_creative_generics: [
            ...(prev.project_creative_generics || []),
            ...validFiles,
          ],
        }));
      }
    }

    if (name === "project_creatives") {
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.project_creatives.includes(file.type)) {
          toast.error("Only JPG, PNG, GIF, and WebP images are allowed.");
          return;
        }

        if (file.size > MAX_SIZES.project_creatives) {
          toast.error("Image size must be less than 3MB.");
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          project_creatives: [...(prev.project_creatives || []), ...validFiles],
        }));
      }
    }

    if (name === "cover_images") {
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.cover_images.includes(file.type)) {
          toast.error("Only JPG, PNG, GIF, and WebP images are allowed.");
          return;
        }

        if (file.size > MAX_SIZES.cover_images) {
          toast.error("Image size must be less than 3MB.");
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          cover_images: [...(prev.cover_images || []), ...validFiles],
        }));
      }
    }

    if (name === "project_ppt") {
      // Handle multiple PPT files
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.project_ppt.includes(file.type)) {
          toast.error("Only PPT and PPTX files are allowed for Project PPT.");
          return;
        }

        if (file.size > MAX_SIZES.project_ppt) {
          toast.error(`File too large: ${file.name}. Max size is 10MB.`);
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          project_ppt: [...prev.project_ppt, ...validFiles],
        }));
      }
    }

    if (name === "brochure") {
      // Handle multiple brochure files
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];

      newFiles.forEach((file) => {
        if (!allowedTypes.brochure.includes(file.type)) {
          toast.error("Only PDF and DOCX files are allowed for brochure.");
          return;
        }

        if (!validateFile(file, MAX_SIZES[name])) return;
        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          brochure: [...prev.brochure, ...validFiles],
        }));
      }
    } else if (
      name === "two_d_images" ||
      name === "videos" ||
      name === "gallery_image" ||
      name === "project_qrcode_image"
    ) {
      // Handle multiple files for images, videos, gallery
      const newFiles = Array.from(files) as File[];
      const validFiles: File[] = [];
      const tooLargeFiles: Array<{
        valid: boolean;
        name?: string;
        size?: string;
      }> = [];

      newFiles.forEach((file) => {
        // Check file type if there are allowed types specified
        if (allowedTypes[name] && !allowedTypes[name].includes(file.type)) {
          const fileType = name === "videos" ? "video" : "image";
          toast.error(
            `Only supported ${fileType} formats are allowed for ${name.replace(
              "_",
              " "
            )}.`
          );
          return;
        }

        const sizeCheck = isFileSizeValid(file, MAX_SIZES[name]);
        if (!sizeCheck.valid) {
          tooLargeFiles.push(sizeCheck);
          return;
        }

        validFiles.push(file);
      });

      if (tooLargeFiles.length > 0) {
        tooLargeFiles.forEach((file) => {
          if (name === "videos") {
            toast.error("Video size must be less than 10MB.");
          } else {
            toast.error("Image size must be less than 3MB.");
          }
        });
      }

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          [name]: [...(prev[name] || []), ...validFiles],
        }));
      }
    } else if (name === "image") {
      // Handle single image
      const file = files[0];
      if (!allowedTypes.image.includes(file.type)) {
        toast.error("Only JPG, PNG, GIF, and WebP images are allowed.");
        return;
      }

      const sizeCheck = isFileSizeValid(file, MAX_SIZES.image);
      if (!sizeCheck.valid) {
        toast.error(
          `File too large: ${sizeCheck.name} (${
            sizeCheck.size
          }). Max size: ${formatFileSize(MAX_SIZES.image)}`
        );
        return;
      }

      setFormData((prev) => ({ ...prev, video_preview_image_url: file }));
    } else if (name === "video_preview_image_url") {
      // Handle single image
      const file = files[0];
      if (!allowedTypes.video_preview_image_url.includes(file.type)) {
        toast.error("Only JPG, PNG, GIF, and WebP images are allowed.");
        return;
      }

      const sizeCheck = isFileSizeValid(
        file,
        MAX_SIZES.video_preview_image_url
      );
      if (!sizeCheck.valid) {
        toast.error(
          `File too large: ${sizeCheck.name} (${
            sizeCheck.size
          }). Max size: ${formatFileSize(MAX_SIZES.video_preview_image_url)}`
        );
        return;
      }

      setFormData((prev) => ({ ...prev, video_preview_image_url: file }));
    }
  }; // Add this to your file:
  // File Validation
  const validateFile = (file, maxSize, tooLargeFiles = null) => {
    const sizeCheck = isFileSizeValid(file, maxSize);
    if (!sizeCheck.valid) {
      if (tooLargeFiles) {
        tooLargeFiles.push(sizeCheck);
      } else {
        toast.error(
          `File too large: ${sizeCheck.name} (${
            sizeCheck.size
          }). Max size: ${formatFileSize(maxSize)}`
        );
      }
      return false;
    }
    return true;
  };

  // 3. Update handleDiscardFile to handle gallery_images
  const handleDiscardFile = (fileType, index) => {
    if (fileType === "brochure") {
      if (index !== undefined) {
        // Remove specific brochure by index
        const updatedBrochures = [...formData.brochure];
        updatedBrochures.splice(index, 1);
        setFormData({ ...formData, brochure: updatedBrochures });
      } else {
        // Clear all brochures if no index specified
        setFormData({ ...formData, brochure: [] });
      }
    } else if (fileType === "two_d_images") {
      const updatedFiles = [...formData.two_d_images];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, two_d_images: updatedFiles });
    } else if (fileType === "project_creatives") {
      const updatedFiles = [...formData.project_creatives];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, project_creatives: updatedFiles });
    } else if (fileType === "cover_images") {
      const updatedFiles = [...formData.cover_images];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, cover_images: updatedFiles });
    } else if (fileType === "project_creative_generics") {
      const updatedFiles = [...formData.project_creative_generics];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, project_creative_generics: updatedFiles });
    } else if (fileType === "project_creative_offers") {
      const updatedFiles = [...formData.project_creative_offers];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, project_creative_offers: updatedFiles });
    } else if (fileType === "project_interiors") {
      const updatedFiles = [...formData.project_interiors];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, project_interiors: updatedFiles });
    } else if (fileType === "project_exteriors") {
      const updatedFiles = [...formData.project_exteriors];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, project_exteriors: updatedFiles });
    } else if (fileType === "project_emailer_templetes") {
      const updatedFiles = [...formData.project_emailer_templetes];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, project_emailer_templetes: updatedFiles });
    } else if (fileType === "KnwYrApt_Technical") {
      const updatedFiles = [...formData.KnwYrApt_Technical];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, KnwYrApt_Technical: updatedFiles });
    } else if (fileType === "project_layout") {
      const updatedFiles = [...formData.project_layout];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, project_layout: updatedFiles });
    } else if (fileType === "videos") {
      const updatedVideos = [...formData.videos];
      updatedVideos.splice(index, 1);
      setFormData({ ...formData, videos: updatedVideos });
    } else if (fileType === "gallery_image") {
      const updatedGallery = [...formData.gallery_image];
      updatedGallery.splice(index, 1);
      setFormData({ ...formData, gallery_image: updatedGallery });
    } else if (fileType === "plans") {
      const updatedFiles = [...formData.plans];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, plans: updatedFiles });
    }
  };

  const handlePlanDelete = async (planId, index) => {
    if (!planId) {
      setPlans(plans.filter((_, idx) => idx !== index));
      toast.success("Plan removed successfully!");
      return;
    }

    try {
      const response = await fetch(getFullUrl(`/plans/${planId}.json`), {
        method: "DELETE",
        headers: {
          Authorization: getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete plan");
      }

      setPlans(plans.filter((_, idx) => idx !== index));
      toast.success("Plan and all images deleted successfully!");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan. Please try again.");
    }
  };

  const handleDiscardPpt = (fileType: string, index: number) => {
    if (fileType === "project_ppt") {
      const updatedFiles = [...formData.project_ppt];
      updatedFiles.splice(index, 1);
      setFormData({ ...formData, project_ppt: updatedFiles });
      toast.success("PPT file removed");
    }
  };

  const handleQRCodeImageChange = (e, reraIndex) => {
    const files = Array.from(e.target.files) as File[];
    if (!files || files.length === 0) return;

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const validFiles: any[] = [];

    // Get the RERA number for this section
    const reraNumber = reraIndex !== undefined 
      ? (formData.Rera_Number_multiple[reraIndex]?.rera_number || `rera_${reraIndex}`)
      : (formData.Rera_Number_multiple[0]?.rera_number || 'default_rera');

    files.forEach((file) => {
      if (file.size > MAX_SIZE) {
        toast.error(`File ${file.name} is too large. Max size is 50MB.`);
        return;
      }

      validFiles.push({
        project_qrcode_image: file,
        title: reraNumber, // Automatically use RERA number as title
        rera_identifier: reraNumber, // Store RERA identifier
        isNew: true,
      });
    });

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        project_qrcode_image: [...prev.project_qrcode_image, ...validFiles],
      }));
      toast.success(`${validFiles.length} QR Code(s) added for RERA: ${reraNumber}`);
    }
  };

  const handleQRCodeImageNameChange = (index, newTitle) => {
    setFormData((prev) => ({
      ...prev,
      project_qrcode_image: prev.project_qrcode_image.map((img, i) =>
        i === index ? { ...img, title: newTitle } : img
      ),
    }));
  };

  const handleRemoveQRCodeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      project_qrcode_image: prev.project_qrcode_image.filter((_, i) => i !== index),
    }));
    toast.success("QR Code image removed");
  };

  // Helper function to filter QR codes by RERA number
  const getQRCodesForRera = (reraNumber) => {
    if (!reraNumber) return [];
    return formData.project_qrcode_image.filter(
      (qr) => qr.rera_identifier === reraNumber || qr.title === reraNumber
    );
  };

  // Connectivity handlers
  const handleAddConnectivity = () => {
    setFormData((prev) => ({
      ...prev,
      connectivities: [
        ...prev.connectivities,
        { connectivity_type_id: '', place_name: '', image: null }
      ]
    }));
  };

  const handleConnectivityChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.connectivities];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, connectivities: updated };
    });
  };

  const handleConnectivityImageChange = (index, file) => {
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.');
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }
    
    handleConnectivityChange(index, 'image', file);
  };

  const handleRemoveConnectivity = (index) => {
    setFormData((prev) => ({
      ...prev,
      connectivities: prev.connectivities.filter((_, i) => i !== index)
    }));
    toast.success('Connectivity removed');
  };

  const validateForm = (formData) => {
    // Clear previous toasts
    toast.dismiss();

    if (
      !formData.Property_Type ||
      (Array.isArray(formData.Property_Type) &&
        formData.Property_Type.length === 0)
    ) {
      toast.error("Property Type is required.");
      return false;
    }

    if (!formData.Project_Name) {
      toast.error("Project Name is required.");
      return false;
    }
    if (!formData.project_address) {
      toast.error("Location is required.");
      return false;
    }

    // Validate connectivity data - all fields must be filled if any data is entered
    if (formData.connectivities && formData.connectivities.length > 0) {
      for (let i = 0; i < formData.connectivities.length; i++) {
        const connectivity = formData.connectivities[i];
        const hasType = connectivity.connectivity_type_id && connectivity.connectivity_type_id !== '';
        const hasPlace = connectivity.place_name && connectivity.place_name.trim() !== '';
        const hasImage = connectivity.image instanceof File;

        // If any field is filled, all fields must be filled
        if (hasType || hasPlace || hasImage) {
          if (!hasType) {
            toast.error(`Connectivity #${i + 1}: Type is required`);
            return false;
          }
          if (!hasPlace) {
            toast.error(`Connectivity #${i + 1}: Place Name is required`);
            return false;
          }
          if (!hasImage) {
            toast.error(`Connectivity #${i + 1}: Image is required`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setLoading(true);

    // Validate form data
    const validationErrors = validateForm(formData);
    if (!validateForm(formData)) {
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    const gallery_images = [
      "gallery_image_16_by_9",
      "gallery_image_1_by_1",
      "gallery_image_9_by_16",
      "gallery_image_3_by_2",
    ];

    const isValidImage = (img) =>
      img?.file instanceof File || !!img?.id || !!img?.document_file_name;

    // Combine all valid images from all gallery fields
    let totalValidGalleryImages = 0;

    for (const key of gallery_images) {
      const images = Array.isArray(formData[key])
        ? formData[key].filter(isValidImage)
        : [];
      totalValidGalleryImages += images.length;
    }

    if (totalValidGalleryImages > 0 && totalValidGalleryImages % 3 !== 0) {
      const remainder = totalValidGalleryImages % 3;
      const imagesNeeded = 3 - remainder;
      const previousValidCount = totalValidGalleryImages - remainder;

      const message = `Currently in Gallery ${totalValidGalleryImages} image${
        totalValidGalleryImages !== 1 ? "s" : ""
      } uploaded. Please upload ${imagesNeeded} more or remove ${remainder} to make it a multiple of 3.`;

      toast.error(message);
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "plans" && Array.isArray(value)) {
        value.forEach((plan, index) => {
          data.append(`project[plans][${index}][name]`, plan.name);
          if (Array.isArray(plan.images)) {
            plan.images.forEach((img) => {
              data.append(`project[plans][${index}][images][]`, img);
            });
          }
        });
      } else if (key === "Address") {
        for (const addressKey in value) {
          data.append(`project[Address][${addressKey}]`, value[addressKey]);
        }
      } else if (key === "brochure" && Array.isArray(value)) {
        value.forEach((file) => {
          if (file instanceof File) {
            data.append("project[ProjectBrochure][]", file);
          }
        });
      } else if (key === "project_emailer_templetes" && Array.isArray(value)) {
        value.forEach((file) => {
          if (file instanceof File) {
            data.append("project[ProjectEmailerTempletes][]", file);
          }
        });
      } else if (key === "KnwYrApt_Technical" && Array.isArray(value)) {
        value.forEach((file) => {
          if (file instanceof File) {
            data.append("project[KnwYrApt_Technical][]", file);
          }
        });
      } else if (key === "two_d_images" && Array.isArray(value)) {
        value.forEach((file) => data.append("project[Project2DImage][]", file));
      } else if (key === "project_creatives" && Array.isArray(value)) {
        value.forEach((file) =>
          data.append("project[ProjectCreatives][]", file)
        );
      } else if (key === "cover_images" && Array.isArray(value)) {
        value.forEach((file) => data.append("project[cover_images][]", file));
      } else if (key === "project_creative_generics" && Array.isArray(value)) {
        value.forEach((file) =>
          data.append("project[ProjectCreativeGenerics][]", file)
        );
      } else if (key === "project_creative_offers" && Array.isArray(value)) {
        value.forEach((file) =>
          data.append("project[ProjectCreativeOffers][]", file)
        );
      } else if (key === "project_interiors" && Array.isArray(value)) {
        value.forEach((file) =>
          data.append("project[ProjectInteriors][]", file)
        );
      } else if (key === "project_exteriors" && Array.isArray(value)) {
        value.forEach((file) =>
          data.append("project[ProjectExteriors][]", file)
        );
      } else if (key === "project_layout" && Array.isArray(value)) {
        value.forEach((file) => data.append("project[ProjectLayout][]", file));
      } else if (key === "videos" && Array.isArray(value)) {
        value.forEach((file) => data.append("project[ProjectVideo][]", file));
      } else if (key === "gallery_image" && Array.isArray(value)) {
        value.forEach((fileObj, index) => {
          if (fileObj.gallery_image instanceof File) {
            data.append("project[gallery_image][]", fileObj.gallery_image);
            data.append(
              `project[gallery_image_file_name][${index}]`,
              fileObj.gallery_image_file_name
            );
            data.append(
              `project[gallery_type]`,
              fileObj.gallery_image_file_type
            );
            data.append(
              `project[gallery_image_is_day][${index}]`,
              fileObj.isDay
            );
          }
        });
      } else if (key === "image" && mainImageUpload[0]?.file instanceof File) {
        data.append("project[image]", mainImageUpload[0]?.file);
      } else if (key === "video_preview_image_url") {
        // Only append if there's actual data
        if (value instanceof File) {
          data.append("project[video_preview_image_url]", value);
        }
        // Skip appending if value is empty/null/undefined
      } else if (key === "project_qrcode_image" && Array.isArray(value)) {
        value.forEach((fileObj) => {
          if (fileObj.project_qrcode_image instanceof File) {
            data.append(
              "project[project_qrcode_image][]",
              fileObj.project_qrcode_image
            );
            data.append(
              "project[project_qrcode_image_titles][]",
              fileObj.title || ""
            );
          }
        });
      } else if (key === "virtual_tour_url_multiple" && Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item.virtual_tour_url && item.virtual_tour_name) {
            data.append(
              `project[virtual_tour_url_multiple][${index}][virtual_tour_url]`,
              item.virtual_tour_url
            );
            data.append(
              `project[virtual_tour_url_multiple][${index}][virtual_tour_name]`,
              item.virtual_tour_name
            );
          }
        });
      } else if (key === "Rera_Number_multiple" && Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item.tower_name && item.rera_number) {
            data.append(
              `project[Rera_Number_multiple][${index}][tower_name]`,
              item.tower_name
            );
            data.append(
              `project[Rera_Number_multiple][${index}][rera_number]`,
              item.rera_number
            );
            // Only append rera_url if it has a value
            if (item.rera_url && item.rera_url.trim() !== "") {
              data.append(
                `project[Rera_Number_multiple][${index}][rera_url]`,
                item.rera_url
              );
            }
          }
        });
      } else if (key === "connectivities" && Array.isArray(value)) {
        value.forEach((item, index) => {
          // Only include connectivity if all three fields are filled
          if (item.connectivity_type_id && item.place_name && item.image instanceof File) {
            data.append(
              `project[connectivities][${index}][connectivity_type_id]`,
              item.connectivity_type_id
            );
            data.append(
              `project[connectivities][${index}][place_name]`,
              item.place_name
            );
            data.append(
              `project[connectivities][${index}][image]`,
              item.image
            );
          }
        });
      } else if (key === "Specifications" && Array.isArray(value) && value.length > 0) {
        // Only append specifications if array has items
        value.forEach((spec) => {
          if (spec && spec.trim() !== "") {
            data.append("project[Specifications][]", spec);
          }
        });
      } else if (key === "Amenities" && Array.isArray(value) && value.length > 0) {
        // Convert amenity IDs array to comma-separated string of IDs
        const amenityIds = value
          .filter((id) => id !== null && id !== undefined)
          .join(",");
        if (amenityIds) {
          data.append("project[Amenities]", amenityIds);
        }
      } else if (key === "Configuration_Type" && value && value.trim() !== "") {
        // Only append configuration type if it has a non-empty value
        data.append("project[Configuration_Type]", value);
      } else if (key === "project_ppt" && Array.isArray(value)) {
        value.forEach((file) => {
          if (file instanceof File) {
            data.append("project[ProjectPPT]", file);
          }
        });
      } else if (key === "project_sales_type" && Array.isArray(value)) {
        value.forEach((type) =>
          data.append("project[project_sales_type][]", type)
        );
      } else if (key.startsWith("image") && Array.isArray(value)) {
        value.forEach((img) => {
          const backendField = key.replace("image", "project[image") + "]";
          if (img.file instanceof File) {
            data.append(backendField, img.file);
          }
        });
      } else if (key.startsWith("cover_images_") && Array.isArray(value)) {
        value.forEach((img) => {
          const backendField =
            key.replace("cover_images_", "project[cover_images_") + "]";
          if (img.file instanceof File) {
            data.append(backendField, img.file);
          }
        });
      } else if (key.startsWith("gallery_image_") && Array.isArray(value)) {
        value.forEach((img) => {
          if (img.file instanceof File) {
            // Send as array without indices
            data.append(`project[${key}][][file]`, img.file);
            data.append(
              `project[${key}][][file_name]`,
              img.file_name || img.file.name
            );
          }
        });
      } else if (key.startsWith("floor_plans_") && Array.isArray(value)) {
        value.forEach((img) => {
          const backendField =
            key.replace("floor_plans_", "project[floor_plans_") + "]";
          if (img.file instanceof File) {
            data.append(backendField, img.file);
          }
        });
      } else if (key.startsWith("project_2d_image") && Array.isArray(value)) {
        value.forEach((img) => {
          if (img.file instanceof File) {
            const backendField =
              key.replace("project_2d_image", "project[project_2d_image") +
              "][]";
            data.append(backendField, img.file);
          }
        });
      } else if (key === "Rera_Sellable_Area" && value && value.trim() !== "") {
        // Only append Rera_Sellable_Area if it has a non-empty value
        data.append(`project[${key}]`, value);
      } else if (key === "rera_url" && value && value.trim() !== "") {
        // Only append rera_url if it has a non-empty value
        data.append(`project[${key}]`, value);
      } else if (key === "show_on_home") {
        // Always send show_on_home as boolean
        data.append(`project[${key}]`, value ? "true" : "false");
      } else if (
        key !== "Specifications" && 
        key !== "Amenities" && 
        key !== "Rera_Sellable_Area" && 
        key !== "rera_url" &&
        value !== null && 
        value !== undefined && 
        value !== ""
      ) {
        // Skip empty strings, null, and undefined for other fields
        data.append(`project[${key}]`, value);
      }
    });

    try {
      // Check if authentication token exists
      let authHeader;
      try {
        authHeader = getAuthHeader();
      } catch (authError) {
        toast.error("Authentication token is missing. Please log in again.");
        setLoading(false);
        setIsSubmitting(false);
        Navigate("/login");
        return;
      }

      const response = await axios.post(getFullUrl('/projects.json'), data, {
        headers: {
          Authorization: authHeader,
        },
      });

      toast.success("Project created successfully!");
      sessionStorage.removeItem("cached_projects");
      Navigate("/maintenance/project-details-list");
    } catch (error) {
      console.error("Error submitting the form:", error);
      if (
        error.response &&
        error.response.status === 422 &&
        error.response.data &&
        (error.response.data.project_name || error.response.data.Project_Name)
      ) {
        toast.error("Project name already exists.");
      } else if (error.response && error.response.status === 401) {
        toast.error("Authentication failed. Please log in again.");
        Navigate("/login");
      } else {
        toast.error("Failed to submit the form. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Navigate("/maintenance/project-details-list");
  };

  return (
    <div className="p-6 bg-gray-50 h-screen overflow-y-auto scrollbar-thin pb-28">
      {/* Header Section */}
      <div className="mb-8">
             <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
               <button
                 onClick={() => Navigate(-1)}
                 className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
                 aria-label="Go back"
               >
                 <ArrowLeft className="w-4 h-4 text-gray-600" />
               </button>
               <span>Back to Project List</span>
               {/* <span>{">"}</span> */}
               {/* <span className="text-gray-900 font-medium">Create New Project</span> */}
             </div>
             {/* <h1 className="text-2xl font-bold text-gray-900">CREATE PROJECT</h1> */}
           </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span
                className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <Building2 size={16} color="#C72030" />
              </span>
              Basic Information
            </h2>
          </div>
          <div className="p-6 space-y-6" style={{ backgroundColor: "#AAB9C50D" }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormControl
                fullWidth
                variant="outlined"
                required
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Property Type</InputLabel>
                <MUISelect
                  value={formData.Property_type_id}
                  onChange={(e) => {
                    const selectedOption = propertyTypeOptions.find(
                      (opt) => opt.id === e.target.value
                    );
                    if (selectedOption) {
                      handlePropertyTypeChange(selectedOption);
                    }
                  }}
                  label="Property Type"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Property Type</MenuItem>
                  {propertyTypeOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </MUISelect>
              </FormControl>

              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Building Type</InputLabel>
                <MUISelect
                  value={formData.building_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      building_type: e.target.value,
                    }))
                  }
                  label="Building Type"
                  notched
                  displayEmpty
                  disabled={!formData.Property_Type}
                >
                  <MenuItem value="">Select Building Type</MenuItem>
                  {buildingTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </MUISelect>
              </FormControl>

              <FormControl
                fullWidth
                variant="outlined"
                required
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Construction Status</InputLabel>
                <MUISelect
                  value={formData.Construction_Status_id}
                  onChange={(e) => {
                    const selectedOption = statusOptions.find(
                      (opt) => opt.id === e.target.value
                    );
                    setFormData((prev) => ({
                      ...prev,
                      Project_Construction_Status: selectedOption?.value || "",
                      Construction_Status_id: e.target.value,
                    }));
                  }}
                  label="Construction Status"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Status</MenuItem>
                  {statusOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </MUISelect>
              </FormControl>

              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Configuration Type</InputLabel>
                <MUISelect
                  value={formData.Configuration_Type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      Configuration_Type: e.target.value,
                    }))
                  }
                  label="Configuration Type"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">
                    Select Configuration
                  </MenuItem>
                  {configurations.map((config) => (
                    <MenuItem key={config.id} value={config.name}>
                      {config.name}
                    </MenuItem>
                  ))}
                </MUISelect>
              </FormControl>

                <TextField
                label="Project Name"
                placeholder="Enter Project Name"
                value={formData.Project_Name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    Project_Name: e.target.value,
                  }))
                }
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

               <TextField
                label="CMS Project ID"
                placeholder="Enter CMS Project ID"
                value={formData.SFDC_Project_Id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    SFDC_Project_Id: e.target.value,
                  }))
                }
                inputProps={{ maxLength: 18 }}
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
                label="Location"
                placeholder="Enter Location"
                value={formData.project_address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    project_address: e.target.value,
                  }))
                }
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

              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Project Tag</InputLabel>
                <MUISelect
                  value={formData.project_tag}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      project_tag: e.target.value,
                    }))
                  }
                  label="Project Tag"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Tag</MenuItem>
                  <MenuItem value="Featured">Featured</MenuItem>
                  <MenuItem value="Upcoming">Upcoming</MenuItem>
                </MUISelect>
              </FormControl>
                <TextField
                  label="Project Description"
                  placeholder="Enter Project Description"
                  value={formData.Project_Description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      Project_Description: e.target.value,
                    }))
                  }
                  
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
                 <TextField
                label="Price Onward"
                placeholder="Enter Price Onward"
                value={formData.Price_Onward}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    Price_Onward: e.target.value,
                  }))
                }
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
            {/* </div> */}

            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> */}
              <TextField
                label="Size (Sq. Mtr.)"
                placeholder="Enter Size in Sq. Mtr."
                type="number"
                value={formData.Project_Size_Sq_Mtr}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    Project_Size_Sq_Mtr: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              <TextField
                label="Size (Sq. Ft.)"
                placeholder="Enter Size in Sq. Ft."
                type="number"
                value={formData.Project_Size_Sq_Ft}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    Project_Size_Sq_Ft: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              <TextField
                label="Development Area (Sq. Mt.)"
                placeholder="Enter Area Sq. Mt."
                type="number"
                value={formData.development_area_sqmt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    development_area_sqmt: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              <TextField
                label="Development Area (Sq. Ft.)"
                placeholder="Enter Area in Sq. Ft."
                type="number"
                value={formData.development_area_sqft}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    development_area_sqft: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
               <TextField
                label="RERA Carpet Area (Sq. M)"
                placeholder="Enter RERA Carpet Area (Sq. M)"
                type="number"
                value={formData.Rera_Carpet_Area_Sq_M}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    Rera_Carpet_Area_Sq_M: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              <TextField
                label="RERA Carpet Area (Sq. Ft.)"
                placeholder="Enter RERA Carpet Area (Sq. Ft.)"
                type="number"
                value={formData.Rera_Carpet_Area_sqft}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    Rera_Carpet_Area_sqft: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              <TextField
                label="Number of Towers"
                placeholder="Enter Number of Towers"
                type="number"
                value={formData.Number_Of_Towers}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    Number_Of_Towers: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              <TextField
                label="Number of Floors"
                placeholder="Enter Number of Floors"
                type="number"
                value={formData.no_of_floors}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    no_of_floors: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              <TextField
                label="Number of Units"
                placeholder="Enter Number of Units"
                type="number"
                value={formData.Number_Of_Units}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    Number_Of_Units: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              <TextField
                label="Land Area"
                placeholder="Enter Land Area"
                type="number"
                value={formData.Land_Area}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    Land_Area: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Land UOM</InputLabel>
                <MUISelect
                  value={formData.land_uom}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      land_uom: e.target.value,
                    }))
                  }
                  label="Land UOM"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select UOM</MenuItem>
                  <MenuItem value="Square Meter">Square Meter</MenuItem>
                  <MenuItem value="Square Feet">Square Feet</MenuItem>
                  <MenuItem value="Acre">Acre</MenuItem>
                  <MenuItem value="Hectare">Hectare</MenuItem>
                  <MenuItem value="Yard">Yard</MenuItem>
                  <MenuItem value="Guntha">Guntha</MenuItem>
                  <MenuItem value="Bigha">Bigha</MenuItem>
                  <MenuItem value="Kanal">Kanal</MenuItem>
                  <MenuItem value="Marla">Marla</MenuItem>
                  <MenuItem value="Cent">Cent</MenuItem>
                  <MenuItem value="Ropani">Ropani</MenuItem>
                </MUISelect>
              </FormControl>

              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Sales Type</InputLabel>
                <MUISelect
                  value={formData.project_sales_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      project_sales_type: e.target.value,
                    }))
                  }
                  label="Sales Type"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Sales Type</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                  <MenuItem value="Lease">Lease</MenuItem>
                </MUISelect>
              </FormControl>
                <TextField
                label="Order Number"
                placeholder="Enter Order Number"
                type="number"
                value={formData.order_no}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, order_no: e.target.value }))
                }
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    min: 0,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />

              <TextField
                label="Disclaimer"
                placeholder="Enter disclaimer"
                value={formData.disclaimer}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    disclaimer: e.target.value,
                  }))
                }
                // multiline
                // rows={1}
                // fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              {/* Enable Enquiry Toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Enable Enquiry</label>
                <Switch
                  checked={formData.enable_enquiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, enable_enquiry: e.target.checked }))}
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

              {/* Is Sold Toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Is Sold</label>
                <Switch
                  checked={formData.is_sold}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_sold: e.target.checked }))}
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
            </div>
          </div>
        </div>

        {/* {baseURL !== "https://dev-panchshil-super-app.lockated.com/" &&
          baseURL !== "https://rustomjee-live.lockated.com/" && ( */}
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <span
                      className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: "#E5E0D3" }}
                    >
                      <FileText size={16} color="#C72030" />
                    </span>
                    RERA Number
                  </h2>
                </div>
                <div className="p-6 space-y-6" style={{ backgroundColor: "#AAB9C50D" }}>
                  {/* Render all RERA sections */}
                  {formData.Rera_Number_multiple.length === 0 ? (
                    // Initial section when no RERA entries exist
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TextField
                          label="Tower"
                          placeholder="Enter Tower Name"
                          value={formData.Rera_Number_multiple[0]?.tower_name || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => {
                              const updated = [...prev.Rera_Number_multiple];
                              if (updated.length === 0) {
                                updated.push({ tower_name: value, rera_number: "", rera_url: "" });
                              } else {
                                updated[0] = { ...updated[0], tower_name: value };
                              }
                              return { ...prev, Rera_Number_multiple: updated };
                            });
                          }}
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
                          label="RERA Number"
                          placeholder="Enter RERA Number"
                          value={formData.Rera_Number_multiple[0]?.rera_number || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => {
                              const updated = [...prev.Rera_Number_multiple];
                              if (updated.length === 0) {
                                updated.push({ tower_name: "", rera_number: value, rera_url: "" });
                              } else {
                                updated[0] = { ...updated[0], rera_number: value };
                              }
                              return { ...prev, Rera_Number_multiple: updated };
                            });
                          }}
                          inputProps={{ maxLength: 12 }}
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
                          label="RERA URL"
                          placeholder="Enter RERA URL"
                          value={formData.Rera_Number_multiple[0]?.rera_url || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => {
                              const updated = [...prev.Rera_Number_multiple];
                              if (updated.length === 0) {
                                updated.push({ tower_name: "", rera_number: "", rera_url: value });
                              } else {
                                updated[0] = { ...updated[0], rera_url: value };
                              }
                              return { ...prev, Rera_Number_multiple: updated };
                            });
                          }}
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

                      {/* Project QR Code Images Section */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Project QR Code Images
                        </label>
                        
                        <div className="border border-gray-300 rounded-md p-4 min-h-[150px]">
                          {/* Hidden input */}
                          <input
                            type="file"
                            onChange={(e) => handleQRCodeImageChange(e, 0)}
                            className="hidden"
                            id="qr-code-file-upload-0"
                            accept="image/*"
                            multiple
                          />

                          {/* Preview section inside the box */}
                          {(() => {
                            const reraNumber = formData.Rera_Number_multiple[0]?.rera_number || 'default_rera';
                            const filteredQRCodes = getQRCodesForRera(reraNumber);
                            return filteredQRCodes.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {filteredQRCodes.map((image, displayIndex) => {
                                  const actualIndex = formData.project_qrcode_image.findIndex((qr) => qr === image);
                                  return (
                                    <div key={actualIndex} className="relative border rounded-lg p-3 bg-gray-50">
                                      <img
                                        src={
                                          image.isNew
                                            ? URL.createObjectURL(image.project_qrcode_image)
                                            : image.document_url || image.project_qrcode_image
                                        }
                                        alt={`QR Code ${displayIndex + 1}`}
                                        className="w-full h-24 object-contain mb-2 rounded"
                                      />
                                      <p className="text-xs text-gray-600 text-center mt-1">
                                        RERA: {image.title || reraNumber}
                                      </p>
                                      <button
                                        type="button"
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        onClick={() => handleRemoveQRCodeImage(actualIndex)}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          {/* Upload button centered at bottom */}
                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => document.getElementById("qr-code-file-upload-0")?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition"
                              style={{ backgroundColor: "#c4b89d59" }}
                            >
                              <span className="font-medium text-sm text-gray-700">Upload Files</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#C72030"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Show all saved RERA sections */}
                      {formData.Rera_Number_multiple.map((reraEntry, entryIndex) => (
                        <div key={entryIndex} className="p-4 border border-gray-300 rounded-md relative mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-900">
                              Section {entryIndex + 1}
                            </h3>
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-800 p-1"
                              onClick={() => {
                                const updated = formData.Rera_Number_multiple.filter(
                                  (_, i) => i !== entryIndex
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  Rera_Number_multiple: updated,
                                }));
                                toast.success("RERA section deleted");
                              }}
                              title="Delete Section"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <TextField
                                label="Tower"
                                placeholder="Enter Tower Name"
                                value={reraEntry.tower_name || reraEntry.tower || ""}
                                onChange={(e) => {
                                  const updated = [...formData.Rera_Number_multiple];
                                  updated[entryIndex] = {
                                    ...updated[entryIndex],
                                    tower_name: e.target.value,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    Rera_Number_multiple: updated,
                                  }));
                                }}
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
                                label="RERA Number"
                                placeholder="Enter RERA Number"
                                value={reraEntry.rera_number || ""}
                                onChange={(e) => {
                                  const updated = [...formData.Rera_Number_multiple];
                                  updated[entryIndex] = {
                                    ...updated[entryIndex],
                                    rera_number: e.target.value,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    Rera_Number_multiple: updated,
                                  }));
                                }}
                                inputProps={{ maxLength: 12 }}
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
                                label="RERA URL"
                                placeholder="Enter RERA URL"
                                value={reraEntry.rera_url || ""}
                                onChange={(e) => {
                                  const updated = [...formData.Rera_Number_multiple];
                                  updated[entryIndex] = {
                                    ...updated[entryIndex],
                                    rera_url: e.target.value,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    Rera_Number_multiple: updated,
                                  }));
                                }}
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

                            {/* Project QR Code Images Section */}
                            <div className="mt-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Project QR Code Images
                              </label>
                              
                              <div className="border border-gray-300 rounded-md p-4 min-h-[150px]">
                                {/* Hidden input */}
                                <input
                                  type="file"
                                  onChange={(e) => handleQRCodeImageChange(e, entryIndex)}
                                  className="hidden"
                                  id={`qr-code-file-upload-${entryIndex}`}
                                  accept="image/*"
                                  multiple
                                />

                                {/* Preview section inside the box */}
                                {(() => {
                                  const reraNumber = reraEntry.rera_number || `rera_${entryIndex}`;
                                  const filteredQRCodes = getQRCodesForRera(reraNumber);
                                  return filteredQRCodes.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                      {filteredQRCodes.map((image, displayIndex) => {
                                        const actualIndex = formData.project_qrcode_image.findIndex((qr) => qr === image);
                                        return (
                                          <div key={actualIndex} className="relative border rounded-lg p-3 bg-gray-50">
                                            <img
                                              src={
                                                image.isNew
                                                  ? URL.createObjectURL(image.project_qrcode_image)
                                                  : image.document_url || image.project_qrcode_image
                                              }
                                              alt={`QR Code ${displayIndex + 1}`}
                                              className="w-full h-24 object-contain mb-2 rounded"
                                            />
                                            <p className="text-xs text-gray-600 text-center mt-1">
                                              RERA: {image.title || reraNumber}
                                            </p>
                                            <button
                                              type="button"
                                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                              onClick={() => handleRemoveQRCodeImage(actualIndex)}
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}

                                {/* Upload button centered at bottom */}
                                <div className="flex">
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`qr-code-file-upload-${entryIndex}`)?.click()}
                                    className="inline-flex  gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition"
                                    style={{ backgroundColor: "#c4b89d59" }}
                                  >
                                    <span className="font-medium text-sm text-gray-700">Upload Files</span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#C72030"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="17 8 12 3 7 8" />
                                      <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add RERA Button - Only adds new empty section */}
                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          className="flex items-center gap-2 px-6 py-2.5 rounded-md text-[#C72030] font-medium transition-colors"
                          style={{
                            height: "45px",
                            backgroundColor: "#C4B89D59",
                          }}
                          onClick={() => {
                            // Add empty section - data will be saved when typing in the fields
                            setFormData((prev) => ({
                              ...prev,
                              Rera_Number_multiple: [
                                ...prev.Rera_Number_multiple,
                                {
                                  tower_name: "",
                                  rera_number: "",
                                  rera_url: "",
                                },
                              ],
                            }));
                            toast.success("New RERA section added. Fill in the details.");
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"></path>
                          </svg>
                          Add RERA
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              </>

        {/* Amenities Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span
                className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <Building2 size={16} color="#C72030" />
              </span>
              Amenities
            </h2>
          </div>
          <div className="p-6" style={{ backgroundColor: "#AAB9C50D" }}>
            <div className="grid grid-cols-1 gap-4">
              <div className="w-full md:w-1/3">
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-2 text-sm font-medium text-gray-700 z-10">
                    Amenities
                  </label>
                  <Select
                    isMulti
                    value={amenities
                      .filter((a) => formData.Amenities.includes(a.id))
                      .map((a) => ({ value: a.id, label: a.name }))}
                    onChange={(selected) => {
                      const selectedIds = selected ? selected.map((s) => s.value) : [];
                      setFormData((prev) => ({
                        ...prev,
                        Amenities: selectedIds,
                      }));
                    }}
                    options={amenities.map((a) => ({ value: a.id, label: a.name }))}
                    styles={customStyles}
                    components={{
                      MultiValue: CustomMultiValue,
                      MultiValueRemove: () => null,
                    }}
                    closeMenuOnSelect={false}
                    placeholder="Select Amenities..."
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connectivity Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span
                className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <Building2 size={16} color="#C72030" />
              </span>
              Connectivity
            </h2>
          </div>
          <div className="p-6 space-y-6" style={{ backgroundColor: "#AAB9C50D" }}>
            {formData.connectivities.length === 0 ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormControl fullWidth variant="outlined">
                    <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                      Type
                    </InputLabel>
                    <MUISelect
                      value={formData.connectivities[0]?.connectivity_type_id || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((prev) => {
                          const updated = [...prev.connectivities];
                          if (updated.length === 0) {
                            updated.push({ connectivity_type_id: value, place_name: '', image: null });
                          } else {
                            updated[0] = { ...updated[0], connectivity_type_id: value };
                          }
                          return { ...prev, connectivities: updated };
                        });
                      }}
                      displayEmpty
                      sx={{
                        height: '45px',
                        backgroundColor: '#fff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#ddd',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#C72030',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#C72030',
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        <span style={{ color: '#999' }}>Select Type</span>
                      </MenuItem>
                      {connectivityTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </MUISelect>
                  </FormControl>

                  <TextField
                    label="Place Name"
                    placeholder="Enter Place Name"
                    value={formData.connectivities[0]?.place_name || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => {
                        const updated = [...prev.connectivities];
                        if (updated.length === 0) {
                          updated.push({ connectivity_type_id: '', place_name: value, image: null });
                        } else {
                          updated[0] = { ...updated[0], place_name: value };
                        }
                        return { ...prev, connectivities: updated };
                      });
                    }}
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

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  
                  <div className="border border-gray-300 rounded-md p-4 min-h-[150px]">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData((prev) => {
                            const updated = [...prev.connectivities];
                            if (updated.length === 0) {
                              updated.push({ connectivity_type_id: '', place_name: '', image: file });
                            } else {
                              updated[0] = { ...updated[0], image: file };
                            }
                            return { ...prev, connectivities: updated };
                          });
                        }
                      }}
                      className="hidden"
                      id="connectivity-file-upload-0"
                      accept="image/*"
                    />

                    {formData.connectivities[0]?.image && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="relative border rounded-lg p-3 bg-gray-50">
                          <img
                            src={URL.createObjectURL(formData.connectivities[0].image)}
                            alt="Connectivity"
                            className="w-full h-24 object-contain mb-2 rounded"
                          />
                          <p className="text-xs text-gray-600 text-center mt-1 truncate">
                            {formData.connectivities[0].image.name}
                          </p>
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            onClick={() => {
                              setFormData((prev) => {
                                const updated = [...prev.connectivities];
                                updated[0] = { ...updated[0], image: null };
                                return { ...prev, connectivities: updated };
                              });
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => document.getElementById('connectivity-file-upload-0')?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition"
                        style={{ backgroundColor: '#c4b89d59' }}
                      >
                        <span className="font-medium text-sm text-gray-700">Upload Files</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C72030"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {formData.connectivities.map((connectivity, index) => (
                  <div key={index} className="p-4 border border-gray-300 rounded-md relative mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Section {index + 1}
                      </h3>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={() => handleRemoveConnectivity(index)}
                        title="Delete Section"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormControl fullWidth variant="outlined">
                          <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                            Type
                          </InputLabel>
                          <MUISelect
                            value={connectivity.connectivity_type_id || ''}
                            onChange={(e) => handleConnectivityChange(index, 'connectivity_type_id', e.target.value)}
                            displayEmpty
                            sx={{
                              height: '45px',
                              backgroundColor: '#fff',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#ddd',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#C72030',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#C72030',
                              },
                            }}
                          >
                            <MenuItem value="" disabled>
                              <span style={{ color: '#999' }}>Select Type</span>
                            </MenuItem>
                            {connectivityTypes.map((type) => (
                              <MenuItem key={type.id} value={type.id}>
                                {type.name}
                              </MenuItem>
                            ))}
                          </MUISelect>
                        </FormControl>

                        <TextField
                          label="Place Name"
                          placeholder="Enter Place Name"
                          value={connectivity.place_name || ''}
                          onChange={(e) => handleConnectivityChange(index, 'place_name', e.target.value)}
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

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image
                        </label>
                        
                        <div className="border border-gray-300 rounded-md p-4 min-h-[150px]">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleConnectivityImageChange(index, file);
                            }}
                            className="hidden"
                            id={`connectivity-file-upload-${index}`}
                            accept="image/*"
                          />

                          {connectivity.image && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="relative border rounded-lg p-3 bg-gray-50">
                                <img
                                  src={URL.createObjectURL(connectivity.image)}
                                  alt="Connectivity"
                                  className="w-full h-24 object-contain mb-2 rounded"
                                />
                                <p className="text-xs text-gray-600 text-center mt-1 truncate">
                                  {connectivity.image.name}
                                </p>
                                <button
                                  type="button"
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  onClick={() => handleConnectivityChange(index, 'image', null)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => document.getElementById(`connectivity-file-upload-${index}`)?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition"
                              style={{ backgroundColor: '#c4b89d59' }}
                            >
                              <span className="font-medium text-sm text-gray-700">Upload Files</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#C72030"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleAddConnectivity}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md"
                style={{
                  backgroundColor: '#EDEAE3',
                  border: '1px solid #C72030',
                  color: '#C72030',
                }}
              >
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span
                className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <Building2 size={16} color="#C72030" />
              </span>
              Address
            </h2>
          </div>
          <div className="p-6 space-y-6" style={{ backgroundColor: "#AAB9C50D" }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField
                label="Address Line 1"
                placeholder="Address Line 1"
                name="address_line_1"
                value={formData.Address.address_line_1}
                onChange={handleChange}
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
                label="Address Line 2"
                placeholder="Address Line 2"
                name="address_line_2"
                value={formData.Address.address_line_2}
                onChange={handleChange}
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
                label="City"
                placeholder="City"
                name="city"
                value={formData.Address.city}
                onChange={handleChange}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField
                label="State"
                placeholder="State"
                name="state"
                value={formData.Address.state}
                onChange={handleChange}
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
                label="Pin Code"
                placeholder="Pin Code"
                name="pin_code"
                value={formData.Address.pin_code}
                inputProps={{ maxLength: 6 }}
                onChange={(e) => {
                  const { name, value } = e.target;
                  if (/^\d{0,6}$/.test(value)) {
                    setFormData((prevData) => ({
                      ...prevData,
                      Address: { ...prevData.Address, [name]: value },
                    }));
                  }
                }}
                onBlur={(e) => {
                  const { name, value } = e.target;
                  if (value.length > 0 && value.length !== 6) {
                    toast.error("Pin Code must be exactly 6 digits");
                    setFormData((prevData) => ({
                      ...prevData,
                      Address: { ...prevData.Address, [name]: "" },
                    }));
                  }
                }}
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
                label="Country"
                placeholder="Country"
                name="country"
                value={formData.Address.country}
                onChange={handleChange}
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
                label="Map URL"
                placeholder="Enter Location"
                type="url"
                name="map_url"
                value={formData.map_url}
                onChange={handleChange}
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
          </div>
        </div>
        {(API_CONFIG.BASE_URL === "https://dev-panchshil-super-app.lockated.com/" ||
          API_CONFIG.BASE_URL === "https://rustomjee-live.lockated.com/") && (
          <div className="card mt-3 pb-4 mx-4">
            <div className="card-header3">
              <h3 className="card-title">Plans</h3>
            </div>
            <div className="card-body mt-0 pb-0">
              <div className="row">
                <div className="d-flex justify-content-between align-items-end mx-1">
                  <h5 className="mt-3">
                    Project Plans{" "}
                    <span
                      className="tooltip-container"
                      onMouseEnter={() => setShowTooltipPlans(true)}
                      onMouseLeave={() => setShowTooltipPlans(false)}
                    >
                      <Info className="w-4 h-4 text-gray-600" />
                      {showTooltipPlans && (
                        <span className="tooltip-text">
                          Max Upload Size 10 MB per image
                        </span>
                      )}
                    </span>
                  </h5>
                </div>
                <div className="col-md-3 mt-2">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter Plan Name"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mt-2">
                  <input
                    className="form-control"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPlanImages(Array.from(e.target.files))}
                  />
                </div>
                <div className="col-md-3 ">
                  <button
                    className="purple-btn2"
                    type="button"
                    onClick={() => {
                      if (!planName || planImages.length === 0) {
                        toast.error(
                          "Please enter plan name and select images."
                        );
                        return;
                      }
                      const newPlan = { name: planName, images: planImages };
                      setPlans((prev) => [...prev, newPlan]);
                      setFormData((prev) => ({
                        ...prev,
                        plans: Array.isArray(prev.plans)
                          ? [...prev.plans, newPlan]
                          : [newPlan],
                      }));
                      setPlanName("");
                      setPlanImages([]);
                    }}
                  >
                    + Add
                  </button>
                </div>
                <div className="col-md-12">
                  <div className="mt-4">
                    <EnhancedTable
                      data={plans.map((plan, index) => ({
                        ...plan,
                        id: plan.id || index,
                        planIndex: index,
                      }))}
                      columns={[
                        { key: "name", label: "Plan Name", sortable: true },
                        { key: "images", label: "Images", sortable: false },
                      ]}
                      renderCell={(item, columnKey) => {
                        if (columnKey === "name") {
                          return (
                            <span className="font-medium">{item.name}</span>
                          );
                        }
                        if (columnKey === "images") {
                          return (
                            <div className="flex gap-2 flex-wrap">
                              {item.images &&
                                item.images.map((img, iIdx) => {
                                  let src = "";
                                  if (
                                    img instanceof File ||
                                    img instanceof Blob
                                  ) {
                                    src = URL.createObjectURL(img);
                                  } else if (typeof img === "string") {
                                    src = img;
                                  } else if (img?.document_url) {
                                    src = img.document_url;
                                  }

                                  return (
                                    <img
                                      key={iIdx}
                                      src={src}
                                      alt="Plan"
                                      className="rounded border border-gray-200"
                                      style={{
                                        maxWidth: 60,
                                        maxHeight: 60,
                                        objectFit: "cover",
                                      }}
                                    />
                                  );
                                })}
                            </div>
                          );
                        }
                        return item[columnKey];
                      }}
                      renderActions={(item) => (
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800 p-1 transition-colors"
                          onClick={() =>
                            handlePlanDelete(item.id, item.planIndex)
                          }
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      hideTableSearch
                      hideTableExport
                      hideColumnsButton
                      emptyMessage="No plans added yet"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
         <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span
                className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <FileUpload sx={{ fontSize: 16, color: "#C72030" }} />
              </span>
              File Uploads
            </h2>
          </div>
          <div className="card-body" style={{ backgroundColor: "#AAB9C50D" }}>
            <div className="row">
              <div className="col-12 mb-4"></div>
              <div className="mb-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h5 className="section-heading inline-flex items-center gap-1">
                    Project Banner{" "}
                    <span
                      className="relative inline-flex items-center cursor-pointer"
                      onMouseEnter={() => setShowTooltipBanner(true)}
                      onMouseLeave={() => setShowTooltipBanner(false)}
                    >
                      <Info className="w-5 h-5 fill-black text-white" />
                      {showTooltipBanner && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10 m-12">
                          Max Upload Size 3 MB and{" "}
                          {getDynamicRatiosText("ProjectImage")}
                        </span>
                      )}
                    </span>
                    <span className="text-red-500">*</span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                    type="button"
                    onClick={() => setShowBannerModal(true)}
                  >
                    {/* <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg> */}
                    <span>Add</span>
                  </button>
                </div>

                {/* Upload Modal */}
                {showBannerModal && (
                  <ProjectBannerUpload
                    onClose={() => setShowBannerModal(false)}
                    includeInvalidRatios={false}
                    selectedRatioProp={selectedBannerRatios}
                    showAsModal
                    label={bannerImageLabel}
                    description={dynamicDescription3}
                    onContinue={(validImages) =>
                      handleCroppedImages(validImages, "banner")
                    }
                  />
                )}

                {/* Table */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full border-separate">
                    <thead>
                      <tr style={{ backgroundColor: "#e6e2d8" }}>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          File Name
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Preview
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Ratio
                        </th>
                        <th className="font-semibold text-gray-900 py-3 px-4 text-left">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {project_banner.flatMap(({ key, label }) => {
                        const files = Array.isArray(formData[key])
                          ? formData[key]
                          : formData[key]
                            ? [formData[key]]
                            : [];

                        if (files.length === 0) return [];

                        return files.map((file, index) => (
                          <tr
                            key={`${key}-${file.id || index}`}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 px-4 font-medium">
                              {file.name ||
                                file.document_file_name ||
                                `Image ${index + 1}`}
                            </td>

                            <td className="py-3 px-4">
                              <img
                                style={{
                                  maxWidth: 100,
                                  maxHeight: 100,
                                  objectFit: "cover",
                                }}
                                className="rounded border border-gray-200"
                                src={file.preview || file.document_url}
                                alt={file.name}
                              />
                            </td>

                            <td className="py-3 px-4">{file.ratio || label}</td>

                            <td className="py-3 px-4">
                              <button
                                type="button"
                                // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                onClick={() => discardImage(key, file)}
                              >
                                 <Trash2 className="w-4 h-4 text-[#C72030]" />
                              </button>
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h5 className="section-heading inline-flex items-center gap-1">
                    Project Cover Image{" "}
                    <span
                      className="relative inline-flex items-center cursor-pointer"
                      onMouseEnter={() => setShowTooltipCover(true)}
                      onMouseLeave={() => setShowTooltipCover(false)}
                    >
                      <Info className="w-5 h-5 fill-black text-white" />
                      {showTooltipCover && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10 m-5">
                          Max Upload Size 5 MB and{" "}
                          {getDynamicRatiosText("ProjectCoverImage")}
                        </span>
                      )}
                    </span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                    type="button"
                    onClick={() => setShowUploader(true)}
                  >
                    {/* <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg> */}
                    <span>Add</span>
                  </button>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full border-separate">
                    <thead>
                      <tr style={{ backgroundColor: "#e6e2d8" }}>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          File Name
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Preview
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Ratio
                        </th>
                        <th className="font-semibold text-gray-900 py-3 px-4 text-left">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
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

                          const isVideo =
                            file.type === "video" ||
                            file.file?.type?.startsWith("video/") ||
                            preview.endsWith(".mp4") ||
                            preview.endsWith(".webm") ||
                            preview.endsWith(".gif") ||
                            preview.endsWith(".ogg");

                          return (
                            <tr
                              key={`${key}-${file.id || index}`}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-3 px-4 font-medium">{name}</td>

                              <td className="py-3 px-4">
                                {isVideo ? (
                                  <video
                                    controls
                                    style={{
                                      maxWidth: 100,
                                      maxHeight: 100,
                                      objectFit: "cover",
                                    }}
                                    className="rounded border border-gray-200"
                                  >
                                    <source
                                      src={preview}
                                      type={
                                        file.file?.type ||
                                        `video/${preview.split(".").pop()}`
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
                                    src={preview}
                                    alt={name}
                                  />
                                )}
                              </td>

                              <td className="py-3 px-4">
                                {file.ratio || label}
                              </td>

                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  onClick={() => discardImage(key, file)}
                                >
                                  <Trash2 className="w-4 h-4 text-[#C72030]" />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Upload Modal */}
                {showUploader && (
                  <ProjectImageVideoUpload
                    onClose={() => setShowUploader(false)}
                    includeInvalidRatios={false}
                    selectedRatioProp={selectedCoverRatios}
                    showAsModal
                    label={coverImageLabel}
                    description={dynamicDescription}
                    onContinue={(validImages, videoFiles) =>
                      handleCroppedCoverImages(validImages, "cover", videoFiles)
                    }
                    allowVideos
                  />
                )}
              </div>

              <div className="mb-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h5 className="section-heading inline-flex items-center gap-1">
                    Gallery Images{" "}
                    <span
                      className="relative inline-flex items-center cursor-pointer"
                      onMouseEnter={() => setShowTooltipGallery(true)}
                      onMouseLeave={() => setShowTooltipGallery(false)}
                    >
                      <Info className="w-5 h-5 fill-black text-white" />
                      {showTooltipGallery && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10 m-12">
                          Max Upload Size 3 MB and{" "}
                          {getDynamicRatiosText("ProjectGallery")}
                        </span>
                      )}
                    </span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                    type="button"
                    onClick={() => setShowGalleryModal(true)}
                  >
                    {/* <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg> */}
                    <span>Add</span>
                  </button>
                </div>

                {/* Upload Modal */}
                {showGalleryModal && (
                  <ProjectImageVideoUpload
                    onClose={() => setShowGalleryModal(false)}
                    selectedRatioProp={selectedGalleryRatios}
                    showAsModal
                    label={galleryImageLabel}
                    description={dynamicDescription1}
                    onContinue={(validImages, videoFiles) =>
                      handleCroppedCoverImages(
                        validImages,
                        "gallery",
                        videoFiles
                      )
                    }
                    allowVideos
                  />
                )}

                {/* Table */}
                <div
                  className="rounded-lg border border-gray-200 overflow-hidden"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  <table className="w-full border-separate">
                    <thead>
                      <tr style={{ backgroundColor: "#e6e2d8" }}>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Image Name
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Preview
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Ratio
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Order No.
                        </th>
                        <th className="font-semibold text-gray-900 py-3 px-4 text-left">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {gallery_images.flatMap(({ key, label }) => {
                        const files = Array.isArray(formData[key])
                          ? formData[key]
                          : [];
                        if (files.length === 0) return [];

                        return files.map((file, index) => {
                          const previewUrl =
                            file.preview || file.document_url || "";
                          const isVideo =
                            file.type === "video" ||
                            file.file?.type?.startsWith("video/");
                          const name =
                            file.file_name || file.name || `Image ${index + 1}`;

                          return (
                            <tr
                              key={`${key}-${index}`}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  value={file.file_name || ""}
                                  onChange={(e) =>
                                    handleGalleryImageNameChange(
                                      key,
                                      index,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Image ${index + 1}`}
                                />
                              </td>

                              <td className="py-3 px-4">
                                {isVideo ? (
                                  <video
                                    controls
                                    style={{
                                      maxWidth: 100,
                                      maxHeight: 100,
                                      objectFit: "cover",
                                    }}
                                    className="rounded border border-gray-200"
                                  >
                                    <source
                                      src={previewUrl}
                                      type={file.file?.type || "video/mp4"}
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
                                    src={previewUrl}
                                    alt={name}
                                  />
                                )}
                              </td>

                              <td className="py-3 px-4">
                                {file.ratio || label}
                              </td>

                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                  value={file.order_no || ""}
                                  onChange={(e) =>
                                    handleGalleryImageNameChange(
                                      key,
                                      index,
                                      e.target.value,
                                      "order_no"
                                    )
                                  }
                                  placeholder="Order"
                                />
                              </td>

                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  onClick={() => discardImage(key, file)}
                                >
                                  <Trash2 className="w-4 h-4 text-[#C72030]" />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* {baseURL !== "https://dev-panchshil-super-app.lockated.com/" && baseURL !== "https://rustomjee-live.lockated.com/" && ( */}
              <div className="mb-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h5 className="section-heading inline-flex items-center gap-1">
                    Layouts & Floor Plans{" "}
                    <span
                      className="relative inline-flex items-center cursor-pointer"
                      onMouseEnter={() => setShowTooltipFloor(true)}
                      onMouseLeave={() => setShowTooltipFloor(false)}
                    >
                      <Info className="w-5 h-5 fill-black text-white" />
                      {showTooltipFloor && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 3 MB and {getDynamicRatiosText("Project2DImage")}
                        </span>
                      )}
                    </span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                    type="button"
                    onClick={() => setShowFloorPlanModal(true)}
                  >
                    {/* <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg> */}
                    <span>Add</span>
                  </button>
                </div>

                {/* Upload Modal */}
                {showFloorPlanModal && (
                  <ProjectBannerUpload
                    onClose={() => setShowFloorPlanModal(false)}
                    selectedRatioProp={selectedFloorRatios}
                    showAsModal
                    label={floorImageLabel}
                    description={dynamicDescription2}
                    onContinue={(validImages) =>
                      handleCroppedImages(validImages, "floor")
                    }
                  />
                )}

                {/* Table */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full border-separate">
                    <thead>
                      <tr style={{ backgroundColor: "#e6e2d8" }}>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          File Name
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Preview
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r text-left"
                          style={{ borderColor: "#fff" }}
                        >
                          Ratio
                        </th>
                        <th className="font-semibold text-gray-900 py-3 px-4 text-left">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {floorPlanRatios.flatMap(({ key, label }) => {
                        const files = Array.isArray(formData[key])
                          ? formData[key]
                          : formData[key]
                          ? [formData[key]]
                          : [];

                        if (files.length === 0) return [];

                        return files.map((file, index) => (
                          <tr
                            key={`${key}-${index}`}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 px-4 font-medium">
                              {file.name || file.document_file_name || `Image ${index + 1}`}
                            </td>

                            <td className="py-3 px-4">
                              <img
                                style={{
                                  maxWidth: 100,
                                  maxHeight: 100,
                                  objectFit: "cover",
                                }}
                                className="rounded border border-gray-200"
                                src={file.preview || file.document_url}
                                alt={file.name}
                              />
                            </td>

                            <td className="py-3 px-4">{file.ratio || label}</td>

                            <td className="py-3 px-4">
                              <button
                                type="button"
                                // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                onClick={() => discardImage(key, file)}
                              >
                                 <Trash2 className="w-4 h-4 text-[#C72030]" />
                              </button>
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* )} */}
              <div className="mb-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h5 className="section-heading inline-flex items-center gap-1">
                    Project Brochure{" "}
                    <span
                      className="relative inline-flex items-center cursor-pointer"
                      onMouseEnter={() => setShowTooltipBrochure(true)}
                      onMouseLeave={() => setShowTooltipBrochure(false)}
                    >
                      <Info className="w-5 h-5 fill-black text-white" />
                      {showTooltipBrochure && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 5 MB
                        </span>
                      )}
                    </span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                    onClick={() => document.getElementById("brochure").click()}
                  >
                    {/* <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg> */}
                    <span>Add</span>
                  </button>
                  <input
                    id="brochure"
                    className="form-control"
                    type="file"
                    name="brochure"
                    accept=".pdf,.docx"
                    onChange={(e) => handleFileUpload("brochure", e.target.files)}
                    multiple
                    style={{ display: "none" }}
                  />
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full border-separate">
                    <thead>
                      <tr style={{ backgroundColor: "#e6e2d8" }}>
                        <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                        <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.brochure.length > 0 ? (
                        formData.brochure.map((brochure, index) => (
                          <tr key={`brochures-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 font-medium">{brochure.name}</td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                onClick={() => handleDiscardFile("brochure", index)}
                              >
                                <Trash2 className="w-4 h-4 text-[#C72030]" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
              
                  <>
                    {/* <div className="mb-6">
                      
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Project PPT{" "}
                          <span
                            className="relative inline-flex items-center cursor-pointer"
                            onMouseEnter={() => setShowTooltipPPT(true)}
                            onMouseLeave={() => setShowTooltipPPT(false)}
                          >
                            <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipPPT && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 5 MB
                              </span>
                            )}
                          </span>
                        </h5>

                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("project_ppt").click()}
                        >
                         
                          <span>Add</span>
                        </button>
                      </div>
                      <input
                        id="project_ppt"
                        className="form-control"
                        type="file"
                        name="project_ppt"
                        accept=".ppt, .pptx"
                        onChange={(e) =>
                          handleFileUpload("project_ppt", e.target.files)
                        }
                        multiple
                        style={{ display: "none" }}
                      />
                     
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_ppt.map((file, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{file.name}</td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    
                                    onClick={() => handleDiscardPpt("project_ppt", index)}
                                  >
                                    <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> */}
                    {/* <div className="mb-6">
                      
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Project Layout{" "}
                          <span
                            className="relative inline-flex items-center cursor-pointer"
                            onMouseEnter={() => setShowTooltipLayout(true)}
                            onMouseLeave={() => setShowTooltipLayout(false)}
                          >
                            <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipLayout && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>

                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("project_layout").click()}
                        >
                         
                          <span>Add</span>
                        </button>
                      </div>
                      <input
                        id="project_layout"
                        className="form-control"
                        type="file"
                        name="project_layout"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload("project_layout", e.target.files)
                        }
                        style={{ display: "none" }}
                      />
                     
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>Preview</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_layout.map((file, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{file.name}</td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                    className="rounded border border-gray-200"
                                    src={file.type?.startsWith("image") ? URL.createObjectURL(file) : undefined}
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDiscardFile("project_layout", index)}
                                  >
                                     <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> */}
                    {/* <div className="mb-6">
                     
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Project Creatives{" "}
                          <span
                            className="relative inline-flex items-center cursor-pointer"
                            onMouseEnter={() => setShowTooltipCreatives(true)}
                            onMouseLeave={() => setShowTooltipCreatives(false)}
                          >
                            <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipCreatives && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>

                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("project_creatives").click()}
                        >
                         
                          <span>Add</span>
                        </button>
                      </div>
                      <input
                        id="project_creatives"
                        className="form-control"
                        type="file"
                        name="project_creatives"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload("project_creatives", e.target.files)
                        }
                        multiple
                        style={{ display: "none" }}
                      />
                     
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>Preview</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_creatives.map((file, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{file.name}</td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                    className="rounded border border-gray-200"
                                    src={file.type?.startsWith("image") ? URL.createObjectURL(file) : undefined}
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDiscardFile("project_creatives", index)}
                                  >
                                     <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> */}
                    {/* <div className="mb-6">
                    
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Project Creative Generics{" "}
                          <span
                            className="relative inline-flex items-center cursor-pointer"
                            onMouseEnter={() => setShowTooltipCreativeGenerics(true)}
                            onMouseLeave={() => setShowTooltipCreativeGenerics(false)}
                          >
                           <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipCreativeGenerics && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("project_creative_generics").click()}
                        >
                        
                          <span>Add</span>
                        </button>
                        <input
                          id="project_creative_generics"
                          className="form-control"
                          type="file"
                          name="project_creative_generics"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("project_creative_generics", e.target.files)}
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                    
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>Preview</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_creative_generics.map((file, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{file.name}</td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                    className="rounded border border-gray-200"
                                    src={file.type?.startsWith("image") ? URL.createObjectURL(file) : undefined}
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDiscardFile("project_creative_generics", index)}
                                  >
                                     <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> */}
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Project Offers{" "}
                          <span
                            className="relative inline-flex items-center cursor-pointer"
                            onMouseEnter={() => setShowTooltipCreativeOffers(true)}
                            onMouseLeave={() => setShowTooltipCreativeOffers(false)}
                          >
                            <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipCreativeOffers && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("project_creative_offers").click()}
                        >
                          {/* <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg> */}
                          <span>Add</span>
                        </button>
                        <input
                          id="project_creative_offers"
                          className="form-control"
                          type="file"
                          name="project_creative_offers"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("project_creative_offers", e.target.files)}
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>Preview</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_creative_offers.map((file, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{file.name}</td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                    className="rounded border border-gray-200"
                                    src={file.type?.startsWith("image") ? URL.createObjectURL(file) : undefined}
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDiscardFile("project_creative_offers", index)}
                                  >
                                     <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* <div className="mb-6">
                      
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Project Interiors{" "}
                          <span
                            className="relative inline-flex items-center cursor-pointer"
                            onMouseEnter={() => setShowTooltipInteriors(true)}
                            onMouseLeave={() => setShowTooltipInteriors(false)}
                          >
                            <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipInteriors && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("project_interiors").click()}
                        >
                         
                          <span>Add</span>
                        </button>
                        <input
                          id="project_interiors"
                          className="form-control"
                          type="file"
                          name="project_interiors"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("project_interiors", e.target.files)}
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                     
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>Preview</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_interiors.map((file, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{file.name}</td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                    className="rounded border border-gray-200"
                                    src={file.type?.startsWith("image") ? URL.createObjectURL(file) : undefined}
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDiscardFile("project_interiors", index)}
                                  >
                                     <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> */}
                    {/* <div className="mb-6">

                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Project Exteriors{" "}
                          <span
                            className="relative inline-flex items-center cursor-pointer"
                            onMouseEnter={() => setShowTooltipExteriors(true)}
                            onMouseLeave={() => setShowTooltipExteriors(false)}
                          >
                            <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipExteriors && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("project_exteriors").click()}
                        >
                          
                          <span>Add</span>
                        </button>
                        <input
                          id="project_exteriors"
                          className="form-control"
                          type="file"
                          name="project_exteriors"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("project_exteriors", e.target.files)}
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                     
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>Preview</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_exteriors.map((file, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{file.name}</td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                    className="rounded border border-gray-200"
                                    src={file.type?.startsWith("image") ? URL.createObjectURL(file) : undefined}
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDiscardFile("project_exteriors", index)}
                                  >
                                     <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> */}
                    {/* <div className="mb-6">
                     
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Project Emailer Template{" "}
                          <span
                            className="relative inline-flex items-center cursor-pointer"
                            onMouseEnter={() => setShowTooltipEmailer(true)}
                            onMouseLeave={() => setShowTooltipEmailer(false)}
                          >
                            <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipEmailer && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 5 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("project_emailer_templetes").click()}
                        >
                         
                          <span>Add</span>
                        </button>
                        <input
                          id="project_emailer_templetes"
                          className="form-control"
                          type="file"
                          name="project_emailer_templetes"
                          accept=".pdf,.docx"
                          onChange={(e) => handleFileUpload("project_emailer_templetes", e.target.files)}
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                     
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_emailer_templetes.length > 0 && formData.project_emailer_templetes.map((brochure, index) => (
                              <tr key={`brochure-${index}`} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{brochure.name}</td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDiscardFile("project_emailer_templetes", index)}
                                  >
                                    <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> */}
                    {/* <div className="mb-6">
                     
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Project Know Your Apartment Files{" "}
                          <span
                            className="relative inline-block cursor-pointer"
                            onMouseEnter={() => setShowTooltipKYA(true)}
                            onMouseLeave={() => setShowTooltipKYA(false)}
                          >
                           <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipKYA && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 20 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("KnwYrApt_Technical").click()}
                        >
                        
                          <span>Add</span>
                        </button>
                        <input
                          id="KnwYrApt_Technical"
                          className="form-control"
                          type="file"
                          name="KnwYrApt_Technical"
                          accept=".pdf,.docx"
                          onChange={(e) => handleFileUpload("KnwYrApt_Technical", e.target.files)}
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                     
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.KnwYrApt_Technical.length > 0 && formData.KnwYrApt_Technical.map((technicalFile, index) => (
                              <tr key={`technical-${index}`} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{technicalFile.name}</td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDiscardFile("KnwYrApt_Technical", index)}
                                  >
                                     <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> */}
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="section-heading inline-flex items-center gap-1">
                          Videos{" "}
                          <span
                            className="relative inline-block cursor-pointer"
                            onMouseEnter={() => setShowTooltipVideos(true)}
                            onMouseLeave={() => setShowTooltipVideos(false)}
                          >
                            <Info className="w-5 h-5 fill-black text-white" />
                            {showTooltipVideos && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 10 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
                          onClick={() => document.getElementById("videos").click()}
                        >
                          {/* <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg> */}
                          <span>Add</span>
                        </button>
                        <input
                          id="videos"
                          className="form-control"
                          type="file"
                          name="videos"
                          accept="video/*"
                          onChange={(e) => handleFileUpload("videos", e.target.files)}
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>File Name</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 border-r text-left" style={{ borderColor: "#fff" }}>Preview</th>
                              <th className="font-semibold text-gray-900 py-3 px-4 text-left">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.videos.map((file, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 font-medium">{file.name}</td>
                                <td className="py-3 px-4">
                                  <video
                                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "cover" }}
                                    className="rounded border border-gray-200"
                                    autoPlay
                                    muted
                                    src={URL.createObjectURL(file)}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    // className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDiscardFile("videos", index)}
                                  >
                                     <Trash2 className="w-4 h-4 text-[#C72030]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-12">
                        <TextField
                          label="Video Preview Image URL"
                          placeholder="Enter Video URL"
                          name="video_preview_image_url"
                          value={formData.video_preview_image_url}
                          onChange={handleChange}
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
                      </div> */}
                    </div>
                  </>
                
            </div>
          </div>
        </div>
        {API_CONFIG.BASE_URL !== "https://dev-panchshil-super-app.lockated.com/" &&
          API_CONFIG.BASE_URL !== "https://rustomjee-live.lockated.com/" && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span
                className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#E5E0D3" }}
              >
                <FileText size={16} color="#C72030" />
              </span>
              Virtual Tours
            </h2>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-[#C4B89D59] text-[#C72030] rounded-lg hover:bg-[#C4B89D59]/90 transition-colors"
              onClick={handleAddVirtualTour}
            >
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={18}
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
              </svg> */}
              <span>Add</span>
            </button>
          </div>
                <div className="card-body mt-0 pb-0" style={{ backgroundColor: "#AAB9C50D" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <TextField
                      label="Virtual Tour Name"
                      placeholder="Enter Virtual Tour Name"
                      type="text"
                      name="virtual_tour_name"
                      value={virtualTourName}
                      onChange={handleVirtualTourNameChange}
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
                      label="Virtual Tour URL"
                      placeholder="Enter Virtual Tour URL"
                      type="url"
                      name="virtual_tour_url"
                      value={virtualTourUrl}
                      onChange={handleVirtualTourChange}
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
                  {formData.virtual_tour_url_multiple.length > 0 && (
                    <div className="col-md-12 mt-2">
                      <div className="mt-4">
                        <EnhancedTable
                          data={formData.virtual_tour_url_multiple.map(
                            (item, index) => ({
                              ...item,
                              id: index,
                              srNo: index + 1,
                            })
                          )}
                          columns={[
                            {
                              key: "srNo",
                              label: "Sr No",
                              sortable: false,
                              draggable: false,
                            },
                            {
                              key: "virtual_tour_name",
                              label: "Tour Name",
                              sortable: true,
                            },
                            {
                              key: "virtual_tour_url",
                              label: "Tour URL",
                              sortable: false,
                            },
                          ]}
                          renderCell={(item, columnKey) => {
                            if (columnKey === "srNo") {
                              return <span>{item.srNo}</span>;
                            }
                            return item[columnKey] || "-";
                          }}
                          renderActions={(item) => (
                            <button
                              type="button"
                              // className="text-red-600 hover:text-red-800 p-1 transition-colors"
                              onClick={() => {
                                const updated =
                                  formData.virtual_tour_url_multiple.filter(
                                    (_, i) => i !== item.id
                                  );
                                setFormData((prev) => ({
                                  ...prev,
                                  virtual_tour_url_multiple: updated,
                                }));
                                toast.success("Virtual tour deleted");
                              }}
                              title="Delete"
                            >
                               <Trash2 className="w-4 h-4 text-[#C72030]" />
                            </button>
                          )}
                          hideTableSearch
                          hideTableExport
                          hideColumnsButton
                          emptyMessage="No virtual tours added yet"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        {/* Visibility Section */}
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
                <p className="text-sm text-gray-500">Display this project on the home page</p>
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
            </div>

            {/* Show on Project Detail Page */}
            {/* <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Show on Project Detail Page</h3>
                <p className="text-sm text-gray-500">Display this project on individual project detail pages</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium select-none">
                <div
                  role="switch"
                  aria-checked={visibility.showOnProjectDetailPage}
                  aria-label={visibility.showOnProjectDetailPage ? "Deactivate show on project detail page" : "Activate show on project detail page"}
                  tabIndex={0}
                  onClick={() => setVisibility(prev => ({ ...prev, showOnProjectDetailPage: !prev.showOnProjectDetailPage }))}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setVisibility(prev => ({ ...prev, showOnProjectDetailPage: !prev.showOnProjectDetailPage }))}
                  className="cursor-pointer"
                  style={{ transform: visibility.showOnProjectDetailPage ? 'scaleX(1)' : 'scaleX(-1)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 22 14" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z" fill="#DEDEDE"/>
                  <g filter="url(#filter0_dd_visibility_detail_create)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z" fill="#C72030"/>
                    <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke="url(#paint0_linear_visibility_detail_create)" strokeWidth="0.255453"/>
                    <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke="url(#paint1_linear_visibility_detail_create)" strokeWidth="0.255453"/>
                  </g>
                  <defs>
                    <filter id="filter0_dd_visibility_detail_create" x="-8.54731e-05" y="-0.000329614" width="12.2619" height="13.2842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                      <feOffset dy="1.02181"/>
                      <feGaussianBlur stdDeviation="0.510907"/>
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_visibility_detail_create"/>
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                      <feOffset/>
                      <feGaussianBlur stdDeviation="0.510907"/>
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                      <feBlend mode="normal" in2="effect1_dropShadow_visibility_detail_create" result="effect2_dropShadow_visibility_detail_create"/>
                      <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_visibility_detail_create" result="shape"/>
                    </filter>
                    <linearGradient id="paint0_linear_visibility_detail_create" x1="1.07172" y1="1.02148" x2="1.07172" y2="11.1396" gradientUnits="userSpaceOnUse">
                      <stop stopOpacity="0"/>
                      <stop offset="0.8" stopOpacity="0.02"/>
                      <stop offset="1" stopOpacity="0.04"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear_visibility_detail_create" x1="1.02173" y1="1.02148" x2="1.02173" y2="11.2396" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" stopOpacity="0.12"/>
                      <stop offset="0.2" stopColor="white" stopOpacity="0.06"/>
                      <stop offset="1" stopColor="white" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
                </div>
              </div>
            </div> */}

            {/* Show on Booking Page */}
            {/* <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Show on Booking Page</h3>
                <p className="text-sm text-gray-500">Display this project on the booking page</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium select-none">
                <div
                  role="switch"
                  aria-checked={visibility.showOnBookingPage}
                  aria-label={visibility.showOnBookingPage ? "Deactivate show on booking page" : "Activate show on booking page"}
                  tabIndex={0}
                  onClick={() => setVisibility(prev => ({ ...prev, showOnBookingPage: !prev.showOnBookingPage }))}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setVisibility(prev => ({ ...prev, showOnBookingPage: !prev.showOnBookingPage }))}
                  className="cursor-pointer"
                  style={{ transform: visibility.showOnBookingPage ? 'scaleX(1)' : 'scaleX(-1)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 22 14" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z" fill="#DEDEDE"/>
                  <g filter="url(#filter0_dd_visibility_booking_create)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z" fill="#C72030"/>
                    <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke="url(#paint0_linear_visibility_booking_create)" strokeWidth="0.255453"/>
                    <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke="url(#paint1_linear_visibility_booking_create)" strokeWidth="0.255453"/>
                  </g>
                  <defs>
                    <filter id="filter0_dd_visibility_booking_create" x="-8.54731e-05" y="-0.000329614" width="12.2619" height="13.2842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                      <feOffset dy="1.02181"/>
                      <feGaussianBlur stdDeviation="0.510907"/>
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_visibility_booking_create"/>
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                      <feOffset/>
                      <feGaussianBlur stdDeviation="0.510907"/>
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                      <feBlend mode="normal" in2="effect1_dropShadow_visibility_booking_create" result="effect2_dropShadow_visibility_booking_create"/>
                      <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_visibility_booking_create" result="shape"/>
                    </filter>
                    <linearGradient id="paint0_linear_visibility_booking_create" x1="1.07172" y1="1.02148" x2="1.07172" y2="11.1396" gradientUnits="userSpaceOnUse">
                      <stop stopOpacity="0"/>
                      <stop offset="0.8" stopOpacity="0.02"/>
                      <stop offset="1" stopOpacity="0.04"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear_visibility_booking_create" x1="1.02173" y1="1.02148" x2="1.02173" y2="11.2396" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" stopOpacity="0.12"/>
                      <stop offset="0.2" stopColor="white" stopOpacity="0.06"/>
                      <stop offset="1" stopColor="white" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
                </div>
              </div>
            </div> */}

            {/* Featured Project */}
            {/* <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Featured Project</h3>
                <p className="text-sm text-gray-500">Mark as a featured project for priority display</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium select-none">
                <div
                  role="switch"
                  aria-checked={visibility.featuredEvent}
                  aria-label={visibility.featuredEvent ? "Deactivate featured project" : "Activate featured project"}
                  tabIndex={0}
                  onClick={() => setVisibility(prev => ({ ...prev, featuredEvent: !prev.featuredEvent }))}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setVisibility(prev => ({ ...prev, featuredEvent: !prev.featuredEvent }))}
                  className="cursor-pointer"
                  style={{ transform: visibility.featuredEvent ? 'scaleX(1)' : 'scaleX(-1)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 22 14" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z" fill="#DEDEDE"/>
                  <g filter="url(#filter0_dd_visibility_featured_create)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z" fill="#C72030"/>
                    <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke="url(#paint0_linear_visibility_featured_create)" strokeWidth="0.255453"/>
                    <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke="url(#paint1_linear_visibility_featured_create)" strokeWidth="0.255453"/>
                  </g>
                  <defs>
                    <filter id="filter0_dd_visibility_featured_create" x="-8.54731e-05" y="-0.000329614" width="12.2619" height="13.2842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                      <feOffset dy="1.02181"/>
                      <feGaussianBlur stdDeviation="0.510907"/>
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_visibility_featured_create"/>
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                      <feOffset/>
                      <feGaussianBlur stdDeviation="0.510907"/>
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                      <feBlend mode="normal" in2="effect1_dropShadow_visibility_featured_create" result="effect2_dropShadow_visibility_featured_create"/>
                      <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_visibility_featured_create" result="shape"/>
                    </filter>
                    <linearGradient id="paint0_linear_visibility_featured_create" x1="1.07172" y1="1.02148" x2="1.07172" y2="11.1396" gradientUnits="userSpaceOnUse">
                      <stop stopOpacity="0"/>
                      <stop offset="0.8" stopOpacity="0.02"/>
                      <stop offset="1" stopOpacity="0.04"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear_visibility_featured_create" x1="1.02173" y1="1.02148" x2="1.02173" y2="11.2396" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" stopOpacity="0.12"/>
                      <stop offset="0.2" stopColor="white" stopOpacity="0.06"/>
                      <stop offset="1" stopColor="white" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
                </div>
              </div>
            </div> */}
          </div>
        </div>

  <div className="card-body pb-0"></div>
        {/* Sticky footer for Submit/Cancel */}
        <div className=" bottom-0 left-0 w-full flex justify-center ">
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
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
      </form>
    </div>
  );
};

export default ProjectDetailsCreate;
