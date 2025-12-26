import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import { toast } from "sonner";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import PropertySelect from "../components/ui/property-select";
import SelectBox from "../components/ui/select-box";
import MultiSelectBox from "../components/ui/multi-selector";
import { ImageCropper } from "../components/reusable/ImageCropper";
import { ImageUploadingButton } from "../components/reusable/ImageUploadingButton";
import ProjectBannerUpload from "../components/reusable/ProjectBannerUpload";
import ProjectImageVideoUpload from "../components/reusable/ProjectImageVideoUpload";
import { API_CONFIG } from "../config/apiConfig";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";
import { FileUpload } from "@mui/icons-material";
import { Building2, FileText, Trash2, ArrowLeft } from "lucide-react";
import { EnhancedTable } from "../components/enhanced-table/EnhancedTable";
import "../styles/mor.css";

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

const ProjectDetailsEdit = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const baseURL = API_CONFIG.BASE_URL;
  const accessToken = localStorage.getItem("access_token");
  const [formData, setFormData] = useState({
    Property_Type: "",
    Property_type_id: "",
    building_type: "",
    SFDC_Project_Id: "",
    Project_Construction_Status: "",
    Configuration_Type: [],
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
  });

  const [projectsType, setprojectsType] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [showQrTooltip, setShowQrTooltip] = useState(false);
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
  const [imageConfigurations, setImageConfigurations] = useState({});
  const [showTooltipBanner, setShowTooltipBanner] = useState(false);
  const [showTooltipCover, setShowTooltipCover] = useState(false);
  const [showTooltipGallery, setShowTooltipGallery] = useState(false);
  const [showTooltipFloor, setShowTooltipFloor] = useState(false);

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
    const configMap = {
      ProjectImage: selectedBannerRatios,
      ProjectCoverImage: selectedCoverRatios,
      ProjectGallery: selectedGalleryRatios,
      Project2DImage: selectedFloorRatios,
    };
    const ratios = configMap[configName] || [];
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
    toast.success("Virtual tour added successfully");
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
  const navigate = useNavigate();

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
      toast.error("❌ Please upload a valid image.");
      return;
    }

    if (sizeInMB > 5) {
      toast.error("❌ Image size must be less than 5MB.");
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

  // Fetch existing project data
  // useEffect(() => {
  //   const fetchProject = async () => {
  //     if (!projectId) return;

  //     try {
  //       const response = await axios.get(
  //         `${baseURL}/projects/${projectId}.json`,
  //         {
  //           headers: { Authorization: `Bearer ${accessToken}` },
  //         }
  //       );

  //       const project = response.data;

  //       // Map API response to formData structure
  //       // Adjust keys based on your API response structure
  //       setFormData({
  //         ...formData,
  //         Property_Type: project.property_type || "",
  //         Property_type_id: project.property_type_id || "",
  //         building_type: project.building_type || "",
  //         SFDC_Project_Id: project.sfdc_project_id || "",
  //         Project_Construction_Status:
  //           project.project_construction_status || "",
  //         Configuration_Type: project.configuration_type || [],
  //         Project_Name: project.project_name || "",
  //         project_address: project.project_address || "",
  //         Project_Description: project.project_description || "",
  //         Price_Onward: project.price_onward || "",
  //         Project_Size_Sq_Mtr: project.project_size_sq_mtr || "",
  //         Project_Size_Sq_Ft: project.project_size_sq_ft || "",
  //         development_area_sqft: project.development_area_sqft || "",
  //         development_area_sqmt: project.development_area_sqmt || "",
  //         Rera_Carpet_Area_Sq_M: project.rera_carpet_area_sq_m || "",
  //         Rera_Carpet_Area_sqft: project.rera_carpet_area_sqft || "",
  //         Rera_Sellable_Area: project.rera_sellable_area || "",
  //         Number_Of_Towers: project.number_of_towers || "",
  //         Number_Of_Units: project.number_of_units || "",
  //         no_of_floors: project.no_of_floors || "",
  //         Amenities: project.amenities || [],
  //         Land_Area: project.land_area || "",
  //         land_uom: project.land_uom || "",
  //         project_tag: project.project_tag || "",
  //         map_url: project.map_url || "",
  //         Address: project.address || formData.Address,
  //         brochure: project.brochure || [],
  //         two_d_images: project.two_d_images || [],
  //         videos: project.videos || [],
  //         gallery_image: project.gallery_image || [],
  //         project_ppt: project.project_ppt || [],
  //         project_creatives: project.project_creatives || [],
  //         project_creative_generics: project.project_creative_generics || [],
  //         project_creative_offers: project.project_creative_offers || [],
  //         project_interiors: project.project_interiors || [],
  //         project_exteriors: project.project_exteriors || [],
  //         project_emailer_templetes: project.project_emailer_templetes || [],
  //         KnwYrApt_Technical: project.knw_yr_apt_technical || [],
  //         project_layout: project.project_layout || [],
  //         project_sales_type: project.project_sales_type || "",
  //         order_no: project.order_no || null,
  //         video_preview_image_url: project.video_preview_image_url || [],
  //         enable_enquiry: project.enable_enquiry || false,
  //         rera_url: project.rera_url || "",
  //         isDay: project.is_day || true,
  //         disclaimer: project.disclaimer || "",
  //         project_qrcode_image: project.project_qrcode_image || [],
  //         cover_images: project.cover_images || [],
  //         is_sold: project.is_sold || false,
  //         plans: project.plans || [],
  //         Rera_Number_multiple: project.rera_number_multiple || [],
  //         virtual_tour_url_multiple: project.virtual_tour_url_multiple || [],
  //       });

  //       setPlans(project.plans || []);
  //       setReraList(project.rera_number_multiple || []);
  //       // Set other states as needed, e.g., buildingTypes based on property type

  //       // Fetch related data if needed (amenities, configs, etc.)
  //       await Promise.all([
  //         fetchAmenities(),
  //         fetchConfigurations(),
  //         fetchStatusOptions(),
  //         fetchPropertyTypes(),
  //         fetchBuildingTypes(),
  //       ]);
  //     } catch (error) {
  //       console.error("Error fetching project:", error);
  //       toast.error("Failed to load project data");
  //       navigate("/project-list");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchProject();
  // }, [projectId]);

  // Fetch helpers (same as create)
  const fetchAmenities = () => {
    return axios.get(`${baseURL}/amenities.json`).then((response) => {
      setAmenities(response.data);
    });
  };

  const fetchConfigurations = () => {
    return axios.get(`${baseURL}/configurations.json`).then((response) => {
      setConfigurations(response.data);
    });
  };

  const fetchStatusOptions = () => {
    return axios
      .get(`${baseURL}/project_construction_statuses.json`)
      .then((response) => {
        const options = response.data.map((status) => ({
          value: status.name,
          label: status.name,
        }));
        setStatusOptions(options);
      });
  };

  const fetchPropertyTypes = () => {
    return axios.get(`${baseURL}/property_types.json`).then((response) => {
      const options = response.data
        .filter((item) => item.active)
        .map((type) => ({
          value: type.property_type,
          label: type.property_type,
          id: type.id,
        }));
      setPropertyTypeOptions(options);
    });
  };

  const fetchBuildingTypes = async () => {
    try {
      const response = await axios.get(`${baseURL}/building_types.json`);
      const options = response.data
        .filter((item) => item.active)
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
        `${baseURL}/building_types.json?q[property_type_id_eq]=${id}`
      );

      const formattedBuildingTypes = response.data.map((item) => ({
        value: item.building_type,
        label: item.building_type,
      }));

      setBuildingTypes(formattedBuildingTypes);
    } catch (error) {
      console.error("Error fetching building types:", error);
    }
  };

  // All other handlers from create (handleChange, handleFileUpload, etc.) remain the same
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

  // Paste all other handlers here (handleFileUpload, handleDiscardFile, validateForm, etc.)
  // They are identical to the create component

  const handleFileUpload = (name, files) => {
    // Exact same logic as in create component
    // (Omit for brevity, but copy the entire function from the original create code)
  };

  const handleDiscardFile = (fileType, index) => {
    // Exact same logic as in create
  };

  const validateForm = (formData) => {
    // Exact same as create
    if (!formData.Property_Type) {
      toast.error("Property Type is required.");
      return false;
    }
    // ... rest
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setLoading(true);

    if (!validateForm(formData)) {
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    // Gallery validation (same as create)
    const gallery_images_keys = [
      "gallery_image_16_by_9",
      "gallery_image_1_by_1",
      "gallery_image_9_by_16",
      "gallery_image_3_by_2",
    ];

    const isValidImage = (img) =>
      img?.file instanceof File || !!img?.id || !!img?.document_file_name;

    let totalValidGalleryImages = 0;

    for (const key of gallery_images_keys) {
      const images = Array.isArray(formData[key])
        ? formData[key].filter(isValidImage)
        : [];
      totalValidGalleryImages += images.length;
    }

    if (totalValidGalleryImages > 0 && totalValidGalleryImages % 3 !== 0) {
      const remainder = totalValidGalleryImages % 3;
      const imagesNeeded = 3 - remainder;
      toast.error(`Upload ${imagesNeeded} more images to make multiple of 3.`);
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append("project[id]", projectId || "");

    // Append all form data (same as create, but for update)
    Object.entries(formData).forEach(([key, value]) => {
      // Copy the entire appending logic from create's handleSubmit
      // For example:
      if (key === "Address") {
        for (const addressKey in value) {
          data.append(`project[Address][${addressKey}]`, value[addressKey]);
        }
      } else if (Array.isArray(value)) {
        // Handle arrays, files, etc.
        value.forEach((item, index) => {
          // Specific logic for each type (brochure, videos, etc.)
        });
      } else {
        data.append(`project[${key}]`, value);
      }
    });

    try {
      const response = await axios.patch(
        `${baseURL}/projects/${projectId}.json`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Project updated successfully");
      navigate("/project-list");
    } catch (error) {
      console.error("Error updating project:", error);
      if (
        error.response &&
        error.response.status === 422 &&
        error.response.data &&
        (error.response.data.project_name || error.response.data.Project_Name)
      ) {
        toast.error("Project name already exists.");
      } else {
        toast.error("Failed to update the project. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/project-list");
  };

  // if (loading) {
  //   return (
  //     <div className="p-6 bg-gray-50 h-screen flex items-center justify-center">
  //       <div className="text-lg">Loading project details...</div>
  //     </div>
  //   );
  // }

    function handlePlanDelete(id: any, planIndex: any): void {
        // Remove plan by index (planIndex is provided where function is called)
        setPlans((prevPlans) => {
            const updated = prevPlans.filter((_, idx) => idx !== planIndex);
            // Update formData.plans to keep in sync
            setFormData((prev) => ({ ...prev, plans: updated }));
            return updated;
        });

        toast.success("Plan deleted");
    }
    function handleDiscardPpt(fileType: string, index: number): void {
        // Safely remove a PPT file at given index from formData and revoke any blob preview URL
        setFormData((prev) => {
            const next: any = { ...prev };
            const list: any[] = Array.isArray(next[fileType]) ? [...next[fileType]] : [];

            if (index < 0 || index >= list.length) return prev;

            const [removed] = list.splice(index, 1);

            // revoke blob preview URLs to avoid memory leaks
            const preview = removed?.preview || (typeof removed === "string" ? removed : undefined);
            if (typeof preview === "string" && preview.startsWith("blob:")) {
                try {
                    URL.revokeObjectURL(preview);
                } catch (err) {
                    // ignore revoke errors
                }
            }

            next[fileType] = list;
            toast.success("PPT removed");
            return next;
        });
    }
  return (
    <div className="p-6 bg-gray-50 h-screen overflow-y-auto scrollbar-thin pb-28">
      {/* Header Section */}
       <div className="mb-8">
                   <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                     <button
                       onClick={() => navigate(-1)}
                       className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
                       aria-label="Go back"
                     >
                       <ArrowLeft className="w-4 h-4 text-gray-600" />
                     </button>
                     <span>Back to Project List</span>
                     {/* <span>{">"}</span> */}
                     {/* <span className="text-gray-900 font-medium">Create New Project</span> */}
                   </div>
                   <h1 className="text-2xl font-bold text-gray-900">EDIT PROJECT</h1>
                 </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
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
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormControl
                fullWidth
                variant="outlined"
                required
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Property Type</InputLabel>
                <MuiSelect
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
                </MuiSelect>
              </FormControl>

              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Building Type</InputLabel>
                <MuiSelect
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
                </MuiSelect>
              </FormControl>

              <FormControl
                fullWidth
                variant="outlined"
                required
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Construction Status</InputLabel>
                <MuiSelect
                  value={formData.Project_Construction_Status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      Project_Construction_Status: e.target.value,
                    }))
                  }
                  label="Construction Status"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Status</MenuItem>
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Configuration Type</InputLabel>
                <MuiSelect
                  multiple
                  value={formData.Configuration_Type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      Configuration_Type: e.target.value as string[],
                    }))
                  }
                  label="Configuration Type"
                  notched
                  displayEmpty
                  renderValue={(selected) => {
                    if ((selected as string[]).length === 0) {
                      return "Select Configuration";
                    }
                    return (selected as string[]).join(", ");
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Configuration
                  </MenuItem>
                  {configurations.map((config) => (
                    <MenuItem key={config.id} value={config.name}>
                      {config.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                label="SFDC Project ID"
                placeholder="Enter SFDC Project ID"
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
                <MuiSelect
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
                </MuiSelect>
              </FormControl>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
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
                  InputProps={{
                    sx: fieldStyles,
                  }}
                />
              </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <MuiSelect
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
                </MuiSelect>
              </FormControl>

              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>Sales Type</InputLabel>
                <MuiSelect
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
                </MuiSelect>
              </FormControl>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {/* Continue with all grids and fields from create */}
          </div>
        </div>
        {baseURL !== "https://dev-panchshil-super-app.lockated.com/" &&
          baseURL !== "https://rustomjee-live.lockated.com/" && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-200">
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
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <TextField
                        label="Tower"
                        placeholder="Enter Tower Name"
                        value={towerName}
                        onChange={(e) => setTowerName(e.target.value)}
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
                        value={reraNumber}
                        onChange={(e) => setReraNumber(e.target.value)}
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
                        value={reraUrl}
                        onChange={(e) => setReraUrl(e.target.value)}
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
                        className="flex items-center gap-2 px-6 py-2.5 rounded-md text-white font-medium transition-colors"
                        style={{
                          height: "45px",
                          backgroundColor: "#C72030",
                          border: "2px solid #C72030",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#A01828";
                          e.currentTarget.style.borderColor = "#A01828";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#C72030";
                          e.currentTarget.style.borderColor = "#C72030";
                        }}
                        onClick={() => {
                          if (!towerName || !reraNumber) {
                            toast.error(
                              "Please enter both Tower Name and RERA Number"
                            );
                            return;
                          }
                          setFormData((prev) => ({
                            ...prev,
                            Rera_Number_multiple: [
                              ...prev.Rera_Number_multiple,
                              {
                                tower: towerName,
                                rera_number: reraNumber,
                                rera_url: reraUrl,
                              },
                            ],
                          }));
                          setTowerName("");
                          setReraNumber("");
                          setReraUrl("");
                          toast.success("RERA entry added");
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
                        Add
                      </button>
                    </div>
                  </div>
                  {formData.Rera_Number_multiple.length > 0 && (
                    <div className="mt-4">
                      <EnhancedTable
                        data={formData.Rera_Number_multiple.map(
                          (item, index) => ({ ...item, id: index })
                        )}
                        columns={[
                          { key: "tower", label: "Tower Name", sortable: true },
                          {
                            key: "rera_number",
                            label: "RERA Number",
                            sortable: true,
                          },
                          {
                            key: "rera_url",
                            label: "RERA URL",
                            sortable: false,
                          },
                        ]}
                        renderCell={(item, columnKey) => {
                          const index = item.id;
                          if (columnKey === "tower") {
                            return (
                              <TextField
                                value={item.tower || ""}
                                onChange={(e) => {
                                  const updated = [
                                    ...formData.Rera_Number_multiple,
                                  ];
                                  updated[index] = {
                                    ...updated[index],
                                    tower: e.target.value,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    Rera_Number_multiple: updated,
                                  }));
                                }}
                                size="small"
                                fullWidth
                                variant="outlined"
                              />
                            );
                          }
                          if (columnKey === "rera_number") {
                            return (
                              <TextField
                                value={item.rera_number || ""}
                                onChange={(e) => {
                                  const updated = [
                                    ...formData.Rera_Number_multiple,
                                  ];
                                  updated[index] = {
                                    ...updated[index],
                                    rera_number: e.target.value,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    Rera_Number_multiple: updated,
                                  }));
                                }}
                                size="small"
                                fullWidth
                                variant="outlined"
                                inputProps={{ maxLength: 12 }}
                              />
                            );
                          }
                          if (columnKey === "rera_url") {
                            return (
                              <TextField
                                value={item.rera_url || ""}
                                onChange={(e) => {
                                  const updated = [
                                    ...formData.Rera_Number_multiple,
                                  ];
                                  updated[index] = {
                                    ...updated[index],
                                    rera_url: e.target.value,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    Rera_Number_multiple: updated,
                                  }));
                                }}
                                size="small"
                                fullWidth
                                variant="outlined"
                              />
                            );
                          }
                          return item[columnKey];
                        }}
                        renderActions={(item) => (
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800 p-1"
                            onClick={() => {
                              const updated =
                                formData.Rera_Number_multiple.filter(
                                  (_, i) => i !== item.id
                                );
                              setFormData((prev) => ({
                                ...prev,
                                Rera_Number_multiple: updated,
                              }));
                              toast.success("RERA entry deleted");
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        hideTableSearch
                        hideTableExport
                        hideColumnsButton
                        emptyMessage="No RERA entries added yet"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        {/* RERA Section - copy from create, but show existing data */}
        {/* Amenities, Address, Plans, File Upload sections - all copied from create */}
        {/* Amenities Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
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
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="w-full md:w-1/3">
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ "& .MuiInputBase-root": fieldStyles }}
                >
                  <InputLabel shrink>Amenities</InputLabel>
                  <MuiSelect
                    multiple
                    value={formData.Amenities}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        Amenities: e.target.value as number[],
                      }))
                    }
                    label="Amenities"
                    notched
                    displayEmpty
                    renderValue={(selected) => {
                      if ((selected as number[]).length === 0) {
                        return "Select amenities";
                      }
                      return (selected as number[])
                        .map((id) => {
                          const ammit = amenities.find((ammit) => ammit.id === id);
                          return ammit ? ammit.name : "";
                        })
                        .filter(Boolean)
                        .join(", ");
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select amenities
                    </MenuItem>
                    {amenities.map((ammit) => (
                      <MenuItem key={ammit.id} value={ammit.id}>
                        {ammit.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div>
            </div>
          </div>
        </div>
        {/* Address Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
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
          <div className="p-6 space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        {(baseURL === "https://dev-panchshil-super-app.lockated.com/" ||
          baseURL === "https://rustomjee-live.lockated.com/") && (
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
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      [i]
                      {showTooltip && (
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
          <div className="px-6 py-3 border-b border-gray-200">
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
          <div className="card-body">
            <div className="row">
              <div className="col-12 mb-4"></div>
              <div className="mb-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-semibold">
                    Project Banner{" "}
                    <span
                      className="relative inline-block cursor-help"
                      onMouseEnter={() => setShowTooltipBanner(true)}
                      onMouseLeave={() => setShowTooltipBanner(false)}
                    >
                      <span className="text-red-500">[i]</span>
                      {showTooltipBanner && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 3 MB and{" "}
                          {getDynamicRatiosText("ProjectImage")}
                        </span>
                      )}
                    </span>
                    <span className="text-red-500 ml-1">*</span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                    type="button"
                    onClick={() => setShowBannerModal(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
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
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          File Name
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Preview
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Ratio
                        </th>
                        <th className="font-semibold text-gray-900 py-3 px-4">
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
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                onClick={() => discardImage(key, file)}
                              >
                                ×
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
                  <h5 className=" font-semibold">
                    Project Cover Image{" "}
                    <span
                      className="relative inline-block cursor-help"
                      onMouseEnter={() => setShowTooltipCover(true)}
                      onMouseLeave={() => setShowTooltipCover(false)}
                    >
                      <span className="text-red-500">[i]</span>
                      {showTooltipCover && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 5 MB and{" "}
                          {getDynamicRatiosText("ProjectCoverImage")}
                        </span>
                      )}
                    </span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                    type="button"
                    onClick={() => setShowUploader(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
                    <span>Add</span>
                  </button>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full border-separate">
                    <thead>
                      <tr style={{ backgroundColor: "#e6e2d8" }}>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          File Name
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Preview
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Ratio
                        </th>
                        <th className="font-semibold text-gray-900 py-3 px-4">
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
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  onClick={() => discardImage(key, file)}
                                >
                                  ×
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
                  <h5 className=" font-semibold">
                    Gallery Images{" "}
                    <span
                      className="relative inline-block cursor-help"
                      onMouseEnter={() => setShowTooltipGallery(true)}
                      onMouseLeave={() => setShowTooltipGallery(false)}
                    >
                      <span className="text-red-500">[i]</span>
                      {showTooltipGallery && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 3 MB (Images), 10 MB (Videos) and{" "}
                          {getDynamicRatiosText("ProjectGallery")}
                        </span>
                      )}
                    </span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                    type="button"
                    onClick={() => setShowGalleryModal(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
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
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Image Name
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Preview
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Ratio
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Order No.
                        </th>
                        <th className="font-semibold text-gray-900 py-3 px-4">
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
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  onClick={() => discardImage(key, file)}
                                >
                                  ×
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
                  <h5 className="font-semibold">
                    Floor Plan{" "}
                    <span
                      className="relative inline-block cursor-help"
                      onMouseEnter={() => setShowTooltipFloor(true)}
                      onMouseLeave={() => setShowTooltipFloor(false)}
                    >
                      <span className="text-red-500">[i]</span>
                      {showTooltipFloor && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 3 MB and{" "}
                          {getDynamicRatiosText("Project2DImage")}
                        </span>
                      )}
                    </span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                    type="button"
                    onClick={() => setShowFloorPlanModal(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
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
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          File Name
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Preview
                        </th>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          Ratio
                        </th>
                        <th className="font-semibold text-gray-900 py-3 px-4">
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
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                onClick={() => discardImage(key, file)}
                              >
                                ×
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
                  <h5 className="font-semibold">
                    Brochure{" "}
                    <span
                      className="relative inline-block cursor-help"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <span className="text-red-500">[i]</span>
                      {showTooltip && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                          Max Upload Size 5 MB
                        </span>
                      )}
                    </span>
                  </h5>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                    onClick={() => document.getElementById("brochure").click()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
                    <span>Add</span>
                  </button>
                  <input
                    id="brochure"
                    className="form-control"
                    type="file"
                    name="brochure"
                    accept=".pdf,.docx"
                    onChange={(e) =>
                      handleFileUpload("brochure", e.target.files)
                    }
                    multiple
                    style={{ display: "none" }}
                  />
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full border-separate">
                    <thead>
                      <tr style={{ backgroundColor: "#e6e2d8" }}>
                        <th
                          className="font-semibold text-gray-900 py-3 px-4 border-r"
                          style={{ borderColor: "#fff" }}
                        >
                          File Name
                        </th>
                        <th className="font-semibold text-gray-900 py-3 px-4">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.brochure.length > 0
                        ? formData.brochure.map((brochure, index) => (
                            <tr
                              key={`brochures-${index}`}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-3 px-4 font-medium">
                                {brochure.name}
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  onClick={() =>
                                    handleDiscardFile("brochure", index)
                                  }
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))
                        : null}
                    </tbody>
                  </table>
                </div>
              </div>
              {baseURL !== "https://dev-panchshil-super-app.lockated.com/" &&
                baseURL !== "https://rustomjee-live.lockated.com/" && (
                  <>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Project PPT{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 5 MB
                              </span>
                            )}
                          </span>
                        </h5>

                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document.getElementById("project_ppt").click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
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
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_ppt.map((file, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {file.name}
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() =>
                                      handleDiscardPpt("project_ppt", index)
                                    }
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Project Layout{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>

                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document.getElementById("project_layout").click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
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
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                Preview
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_layout.map((file, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {file.name}
                                </td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{
                                      maxWidth: 100,
                                      maxHeight: 100,
                                      objectFit: "cover",
                                    }}
                                    className="rounded border border-gray-200"
                                    src={
                                      file.type?.startsWith("image")
                                        ? URL.createObjectURL(file)
                                        : undefined
                                    }
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() =>
                                      handleDiscardFile("project_layout", index)
                                    }
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Project Creatives{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>

                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document.getElementById("project_creatives").click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
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
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                Preview
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_creatives.map((file, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {file.name}
                                </td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{
                                      maxWidth: 100,
                                      maxHeight: 100,
                                      objectFit: "cover",
                                    }}
                                    className="rounded border border-gray-200"
                                    src={
                                      file.type?.startsWith("image")
                                        ? URL.createObjectURL(file)
                                        : undefined
                                    }
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() =>
                                      handleDiscardFile(
                                        "project_creatives",
                                        index
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Project Creative Generics{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document
                              .getElementById("project_creative_generics")
                              .click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
                          <span>Add</span>
                        </button>
                        <input
                          id="project_creative_generics"
                          className="form-control"
                          type="file"
                          name="project_creative_generics"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileUpload(
                              "project_creative_generics",
                              e.target.files
                            )
                          }
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                Preview
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_creative_generics.map(
                              (file, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="py-3 px-4 font-medium">
                                    {file.name}
                                  </td>
                                  <td className="py-3 px-4">
                                    <img
                                      style={{
                                        maxWidth: 100,
                                        maxHeight: 100,
                                        objectFit: "cover",
                                      }}
                                      className="rounded border border-gray-200"
                                      src={
                                        file.type?.startsWith("image")
                                          ? URL.createObjectURL(file)
                                          : undefined
                                      }
                                      alt={file.name}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <button
                                      type="button"
                                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                      onClick={() =>
                                        handleDiscardFile(
                                          "project_creative_generics",
                                          index
                                        )
                                      }
                                    >
                                      ×
                                    </button>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Project Creative Offers{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document
                              .getElementById("project_creative_offers")
                              .click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
                          <span>Add</span>
                        </button>
                        <input
                          id="project_creative_offers"
                          className="form-control"
                          type="file"
                          name="project_creative_offers"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileUpload(
                              "project_creative_offers",
                              e.target.files
                            )
                          }
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                Preview
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_creative_offers.map(
                              (file, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="py-3 px-4 font-medium">
                                    {file.name}
                                  </td>
                                  <td className="py-3 px-4">
                                    <img
                                      style={{
                                        maxWidth: 100,
                                        maxHeight: 100,
                                        objectFit: "cover",
                                      }}
                                      className="rounded border border-gray-200"
                                      src={
                                        file.type?.startsWith("image")
                                          ? URL.createObjectURL(file)
                                          : undefined
                                      }
                                      alt={file.name}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <button
                                      type="button"
                                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                      onClick={() =>
                                        handleDiscardFile(
                                          "project_creative_offers",
                                          index
                                        )
                                      }
                                    >
                                      ×
                                    </button>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Project Interiors{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document.getElementById("project_interiors").click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
                          <span>Add</span>
                        </button>
                        <input
                          id="project_interiors"
                          className="form-control"
                          type="file"
                          name="project_interiors"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileUpload(
                              "project_interiors",
                              e.target.files
                            )
                          }
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                Preview
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_interiors.map((file, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {file.name}
                                </td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{
                                      maxWidth: 100,
                                      maxHeight: 100,
                                      objectFit: "cover",
                                    }}
                                    className="rounded border border-gray-200"
                                    src={
                                      file.type?.startsWith("image")
                                        ? URL.createObjectURL(file)
                                        : undefined
                                    }
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() =>
                                      handleDiscardFile(
                                        "project_interiors",
                                        index
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Project Exteriors{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 3 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document.getElementById("project_exteriors").click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
                          <span>Add</span>
                        </button>
                        <input
                          id="project_exteriors"
                          className="form-control"
                          type="file"
                          name="project_exteriors"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileUpload(
                              "project_exteriors",
                              e.target.files
                            )
                          }
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                Preview
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_exteriors.map((file, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {file.name}
                                </td>
                                <td className="py-3 px-4">
                                  <img
                                    style={{
                                      maxWidth: 100,
                                      maxHeight: 100,
                                      objectFit: "cover",
                                    }}
                                    className="rounded border border-gray-200"
                                    src={
                                      file.type?.startsWith("image")
                                        ? URL.createObjectURL(file)
                                        : undefined
                                    }
                                    alt={file.name}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() =>
                                      handleDiscardFile(
                                        "project_exteriors",
                                        index
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Project Emailer Template{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 5 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document
                              .getElementById("project_emailer_templetes")
                              .click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
                          <span>Add</span>
                        </button>
                        <input
                          id="project_emailer_templetes"
                          className="form-control"
                          type="file"
                          name="project_emailer_templetes"
                          accept=".pdf,.docx"
                          onChange={(e) =>
                            handleFileUpload(
                              "project_emailer_templetes",
                              e.target.files
                            )
                          }
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.project_emailer_templetes.length > 0 &&
                              formData.project_emailer_templetes.map(
                                (brochure, index) => (
                                  <tr
                                    key={`brochure-${index}`}
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    <td className="py-3 px-4 font-medium">
                                      {brochure.name}
                                    </td>
                                    <td className="py-3 px-4">
                                      <button
                                        type="button"
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        onClick={() =>
                                          handleDiscardFile(
                                            "project_emailer_templetes",
                                            index
                                          )
                                        }
                                      >
                                        ×
                                      </button>
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Project Know Your Apartment Files{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 20 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document
                              .getElementById("KnwYrApt_Technical")
                              .click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
                          <span>Add</span>
                        </button>
                        <input
                          id="KnwYrApt_Technical"
                          className="form-control"
                          type="file"
                          name="KnwYrApt_Technical"
                          accept=".pdf,.docx"
                          onChange={(e) =>
                            handleFileUpload(
                              "KnwYrApt_Technical",
                              e.target.files
                            )
                          }
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.KnwYrApt_Technical.length > 0 &&
                              formData.KnwYrApt_Technical.map(
                                (technicalFile, index) => (
                                  <tr
                                    key={`technical-${index}`}
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    <td className="py-3 px-4 font-medium">
                                      {technicalFile.name}
                                    </td>
                                    <td className="py-3 px-4">
                                      <button
                                        type="button"
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        onClick={() =>
                                          handleDiscardFile(
                                            "KnwYrApt_Technical",
                                            index
                                          )
                                        }
                                      >
                                        ×
                                      </button>
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h5 className=" font-semibold">
                          Videos{" "}
                          <span
                            className="relative inline-block cursor-help"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <span className="text-red-500">[i]</span>
                            {showTooltip && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                Max Upload Size 10 MB
                              </span>
                            )}
                          </span>
                        </h5>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors"
                          onClick={() =>
                            document.getElementById("videos").click()
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
                          <span>Add</span>
                        </button>
                        <input
                          id="videos"
                          className="form-control"
                          type="file"
                          name="videos"
                          accept="video/*"
                          onChange={(e) =>
                            handleFileUpload("videos", e.target.files)
                          }
                          multiple
                          style={{ display: "none" }}
                        />
                      </div>
                      {/* Table */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full border-separate">
                          <thead>
                            <tr style={{ backgroundColor: "#e6e2d8" }}>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                File Name
                              </th>
                              <th
                                className="font-semibold text-gray-900 py-3 px-4 border-r"
                                style={{ borderColor: "#fff" }}
                              >
                                Preview
                              </th>
                              <th className="font-semibold text-gray-900 py-3 px-4">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.videos.map((file, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {file.name}
                                </td>
                                <td className="py-3 px-4">
                                  <video
                                    style={{
                                      maxWidth: 100,
                                      maxHeight: 100,
                                      objectFit: "cover",
                                    }}
                                    className="rounded border border-gray-200"
                                    autoPlay
                                    muted
                                    src={URL.createObjectURL(file)}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() =>
                                      handleDiscardFile("videos", index)
                                    }
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
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
                                           </div>
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>
        {baseURL !== "https://dev-panchshil-super-app.lockated.com/" &&
          baseURL !== "https://rustomjee-live.lockated.com/" && (
            <>
               <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-3 border-b border-gray-200">
                          <h2 className="text-lg font-medium text-gray-900 flex items-center">
                            <span
                              className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                              style={{ backgroundColor: "#E5E0D3" }}
                            >
                              <FileText size={16} color="#C72030" />
                            </span>
                            Virtual Tours
                          </h2>
                        </div>
                <div className="card-body mt-0 pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <TextField
                      label="Virtual Tour Name"
                      placeholder="Enter Virtual Tour Name"
                      type="text"
                      name="virtual_tour_name"
                      value={virtualTourName}
                      onChange={handleVirtualTourNameChange}
                      fullWidth
                      variant="outlined"
                      slotProps={{ inputLabel: { shrink: true } }}
                      InputProps={{ sx: fieldStyles }}
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
                      slotProps={{ inputLabel: { shrink: true } }}
                      InputProps={{ sx: fieldStyles }}
                    />
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-[#C72030] text-white rounded hover:bg-[#B8252F] transition-colors font-medium shadow-sm h-[45px]"
                      onClick={handleAddVirtualTour}
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
                      <span>Add</span>
                    </button>
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
                              className="text-red-600 hover:text-red-800 p-1 transition-colors"
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
                              <Trash2 size={18} />
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
        {/* Virtual Tour - copy from create */}

        {/* Sticky footer with Update button */}
        <div className=" bottom-0 left-0 w-full py-4 flex justify-center">
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-6 py-2.5 bg-[#C72030] text-white rounded-md font-medium transition-colors"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#A01828")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#C72030")
              }
            >
              {isSubmitting ? "Updating..." : "Update Project"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md font-medium transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectDetailsEdit;
