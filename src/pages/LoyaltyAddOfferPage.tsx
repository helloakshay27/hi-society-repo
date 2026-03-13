import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Settings, Edit } from "@mui/icons-material";
import { ArrowLeft } from "lucide-react";
import { toast, Toaster } from "sonner";
import axios from "axios";
import { getFullUrl } from "@/config/apiConfig";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";
import ProjectBannerUpload from "@/components/reusable/ProjectBannerUpload";
import { saveDraftItem, loadDraftItem, clearAllDraftItems } from "@/utils/draftStorage";
// removed react-select import in favor of MUI Select
import {
  Box,
  Typography,
  TextField,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Button as MuiButton,
  Select as MuiSelect,
  SelectChangeEvent,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import { InfoOutlined, Close as CloseIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { boxShadow } from "html2canvas/dist/types/css/property-descriptors/box-shadow";



// Styled Components
const CustomStepConnector = styled(StepConnector)(() => ({
  top: 20,
  "& .MuiStepConnector-line": {
    borderTop: "2px dotted #E6E6E6",
  },
}));

const StepPill = styled(Box)<{ $active?: boolean; $completed?: boolean }>(
  ({ $active, $completed }) => ({
    height: 40,
    padding: "0 20px",
    borderRadius: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "Work Sans, sans-serif",
    whiteSpace: "nowrap",
    cursor: "pointer",
    backgroundColor: $active || $completed ? "#C72030" : "#FFFFFF",
    color: $active ? "#FFFFFF" : $completed ? "#fff" : "#333",
    border: $active || $completed ? "2px solid #C72030" : "2px solid #E6E6E6",
  })
);

const CustomStepLabel = styled(StepLabel)(({ theme }) => ({
  "& .MuiStepLabel-label": {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "Work Sans, sans-serif",
    padding: "8px 16px",
    borderRadius: 4,
    border: "1px solid #E0E0E0",
    color: "#555",
  },

  "&.Mui-active .MuiStepLabel-label": {
    backgroundColor: "#C72030",
    color: "#fff",
    borderColor: "#C72030",
  },

  "&.Mui-completed .MuiStepLabel-label": {
    backgroundColor: "#fff",
    color: "#C72030",
    borderColor: "#C72030",
  },
}));

const CustomStep = styled(Step)(() => ({
  "& .MuiStepIcon-root": {
    display: "none", // hides circle numbers (important)
  },
}));

const RedButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: "#C72030",
  color: "white",
  borderRadius: 0,
  textTransform: "none",
  padding: "8px 16px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  boxShadow: "0 2px 4px rgba(199, 32, 48, 0.2)",
  "&:hover": {
    backgroundColor: "#B8252F",
    boxShadow: "0 4px 8px rgba(199, 32, 48, 0.3)",
  },
}));

const DraftButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: "#e7e3d9",
  color: "#C72030",
  borderRadius: 0,
  textTransform: "none",
  padding: "8px 16px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "#d9d5c9",
  },
}));

const SectionCard = styled(Paper)(({ theme }) => ({
  backgroundColor: "white",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  borderRadius: "8px",
  overflow: "visible", // allow dropdowns/popovers to escape
  marginBottom: "24px",
  border: "1px solid #E5E5E5",
}));

const SectionBody = styled(Box)(({ theme }) => ({
  backgroundColor: "#FAFAF8",
  padding: "24px",
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  backgroundColor: "#F6F4EE",
  padding: "12px 16px",
  border: "1px solid #D9D9D9",
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#E5E0D3",
}));

const RedIcon = styled(Settings)(({ theme }) => ({
  color: "#C72030",
  fontSize: "24px",
}));

const fieldStyles = {
  height: '40px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-root': {
    height: '40px',
    fontSize: '14px',
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
    fontSize: '14px',
    "&.Mui-focused": {
      color: "#C72030",
    },
  },
  // color the required asterisk red for all labels
  '& .MuiInputLabel-asterisk, & .MuiFormLabel-asterisk': {
    color: 'red',
  },
  "& .MuiInputBase-input": {
    fontSize: "14px",
    fontFamily: "Work Sans, sans-serif",
  },
};

interface OfferTemplate {
  id: number;
  title: string;
  description: string;
  active: boolean | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
  url: string;
}
interface Project {
  id: number;
  name: string;
  published: boolean;
  sfdc_id: string | null;
}

interface OfferFormData {
  offerTitle: string;
  offerDescription: string;
  legalPoliciesTemplate: string;
  bannerImage: File | null;
  applicableProjects: string[];
  startDate: string;
  endDate: string;
  status: string;
  offerType: string;
  showOnHomePage: boolean;
  featuredOffer: boolean;
  image_1_by_1?: any[];
  image_16_by_9?: any[];
  image_3_by_2?: any[];
  image_9_by_16?: any[];
  offer_pdf?: any[];
}

export default function AddOfferPage() {
  const navigate = useNavigate();
  const { id: offerId } = useParams<{ id: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const steps = [
    "Basic Info",
    "Media & Display",
    "Applicability",
    "Validity & Status",
    "Visibility",
  ];

  const [formData, setFormData] = useState<OfferFormData>({
    offerTitle: "",
    offerDescription: "",
    legalPoliciesTemplate: "",
    bannerImage: null,
    applicableProjects: [],
    startDate: "",
    endDate: "",
    status: "Active",
    offerType: "Customer Offer",
    showOnHomePage: false,
    featuredOffer: false,
    image_1_by_1: [],
    image_16_by_9: [],
    image_3_by_2: [],
    image_9_by_16: [],
    offer_pdf: [],
  });

  // track thumbnail/pdf images temporarily during the flow
  type UploadedImage = {
    id: string;
    file: File | null;
    preview: string;
    // optional fields when loaded from server
    name?: string;
    file_name?: string;
    ratio?: string;
  };

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [offerTemplates, setOfferTemplates] = useState<OfferTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!offerId);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showTooltipBanner, setShowTooltipBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Draft keys (used in IndexedDB)
  const STORAGE_KEYS = {
    FORM_DATA: "addOffer_formData",
    UPLOADED_IMAGES: "addOffer_uploadedImages",
    ACTIVE_STEP: "addOffer_activeStep",
    COMPLETED_STEPS: "addOffer_completedSteps",
  };

  // clear all draft entries
  const clearAllDraft = async () => {
    await clearAllDraftItems(Object.values(STORAGE_KEYS));
  };

  // Image ratio configuration
  const projectUploadConfig = {
    image: ["9:16", "1:1", "16:9", "3:2"],
  };

  const bannerImageType = "image";
  const selectedBannerRatios = projectUploadConfig[bannerImageType] || [];
  const bannerImageLabel = bannerImageType.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase()
  );
  const dynamicDescription = `Supports ${selectedBannerRatios.join(", ")} aspect ratios`;

  const project_banner = [
    { key: "image_1_by_1", label: "1:1" },
    { key: "image_16_by_9", label: "16:9" },
    { key: "image_9_by_16", label: "9:16" },
    { key: "image_3_by_2", label: "3:2" },
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

  // Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  };

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Update formData helper
  const updateFormData = (key, files) => {
    setFormData((prev) => {
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      return {
        ...prev,
        [key]: [...existing, ...files],
      };
    });
  };

  // Handle cropped images
  const handleCroppedImages = (validImages, type = "banner") => {
    if (!validImages || validImages.length === 0) {
      toast.error(
        `No valid ${type} image${type === "banner" ? "" : "s"} selected.`
      );
      setShowBannerModal(false);
      return;
    }

    validImages.forEach((img) => {
      const formattedRatio = img.ratio.replace(":", "_by_");
      const key = `image_${formattedRatio}`.replace(/\s+/g, "_").toLowerCase();

      // Add file_name property to the image object
      const imageWithName = {
        ...img,
        file_name: img.name || `Banner Image ${Date.now()}`,
      };

      updateFormData(key, [imageWithName]);
    });

    setShowBannerModal(false);
    toast.success("Images uploaded successfully");
  };

  // Discard image by ratio key
  const discardImage = (key, imageToRemove) => {
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

      return newFormData;
    });
  };

  // Fetch offer templates and projects on component mount
  useEffect(() => {
    fetchOfferTemplates();
    fetchProjects();
  }, []);

  // Fetch offer details if editing
  useEffect(() => {
    if (offerId) {
      setIsEditMode(true);
      fetchOfferDetails(offerId);
    }
  }, [offerId]);

  // Check for saved draft on component mount (only if not in edit mode)
  useEffect(() => {
    if (!offerId) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('skipDraftModal')) {
        handleContinueWithDraft();
        return;
      }

      (async () => {
        const savedActiveStep = await loadDraftItem(STORAGE_KEYS.ACTIVE_STEP);
        const savedFormData = await loadDraftItem(STORAGE_KEYS.FORM_DATA);
        if (savedActiveStep !== null || savedFormData !== null) {
          setShowDraftModal(true);
        }
      })();
    }
  }, [offerId]);

  // Handler for continuing with draft
  const handleContinueWithDraft = async () => {
    const savedActiveStep = await loadDraftItem(STORAGE_KEYS.ACTIVE_STEP);
    const savedFormData = await loadDraftItem(STORAGE_KEYS.FORM_DATA);
    const savedUploadedImages = await loadDraftItem(
      STORAGE_KEYS.UPLOADED_IMAGES
    );
    const savedCompletedSteps = await loadDraftItem(
      STORAGE_KEYS.COMPLETED_STEPS
    );

    // Restore active step
    if (savedActiveStep !== null && typeof savedActiveStep === "number") {
      setActiveStep(savedActiveStep);
    }

    // Restore form data
    if (savedFormData) {
      // ensure preview fields exist and file refs are null on all image/pdf arrays
      const imageKeys = [
        "image_1_by_1",
        "image_16_by_9",
        "image_3_by_2",
        "image_9_by_16",
        "offer_pdf",
      ];
      imageKeys.forEach((k) => {
        if (savedFormData[k] && Array.isArray(savedFormData[k])) {
          savedFormData[k] = savedFormData[k].map((img: any) => ({
            ...img,
            preview: img.preview || "",
            file: null, // file refs don't survive JSON serialization
          }));
        } else {
          // ensure the key exists as an empty array so rendering doesn't break
          savedFormData[k] = savedFormData[k] || [];
        }
      });

      setFormData(savedFormData);

      // mirror banner + pdf images into uploadedImages for preview/side storage
      const restoredImages: UploadedImage[] = [];
      imageKeys.forEach((k) => {
        const arr = savedFormData[k];
        if (arr && Array.isArray(arr)) {
          arr.forEach((img: any) => {
            restoredImages.push({
              id: img.id?.toString() || Date.now().toString(),
              file: null,
              preview: img.preview || "",
              file_name: img.file_name || img.name || "",
              name: img.name || img.file_name || "",
              ratio: img.ratio || "",
            });
          });
        }
      });

      // Set uploadedImages (replace, don't append to empty initial state)
      setUploadedImages(restoredImages);
    }

    // Restore completed steps
    if (savedCompletedSteps && Array.isArray(savedCompletedSteps)) {
      setCompletedSteps(savedCompletedSteps);
    }

    setShowDraftModal(false);

    toast.info("Draft restored! Continue from where you left off.", {
      duration: 3000,
    });
  };

  // Handler for starting fresh
  const handleStartFresh = async () => {
    await clearAllDraft();
    setShowDraftModal(false);
    setHasSavedDraft(false);

    toast.info("Starting fresh! Previous draft has been cleared.", {
      duration: 3000,
    });
  };

  const fetchOfferTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await axios.get<OfferTemplate[]>(
        getFullUrl("/offer_templates.json"),
        {
          params: {
            token: HI_SOCIETY_CONFIG.TOKEN,
          },
        }
      );
      setOfferTemplates(response.data);
    } catch (error) {
      console.error("Error fetching offer templates:", error);
      toast.error("Failed to load offer templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      // Get selected society ID from localStorage
      // const selectedUserSocietyId = localStorage.getItem("selectedUserSociety");
      // const societiesData = localStorage.getItem("hiSocietyApprovedSocieties");

      // let societyId = '';
      // if (selectedUserSocietyId && societiesData) {
      //     const societies = JSON.parse(societiesData);
      //     const selectedSociety = societies.find((s: any) => s.id.toString() === selectedUserSocietyId);
      //     if (selectedSociety) {
      //         societyId = selectedSociety.id_society;
      //     }
      // }

      // // If no society ID found, show error and return
      // if (!societyId) {
      //     toast.error('Please select a society from the header');
      //     setLoadingProjects(false);
      //     return;
      // }

      const response = await axios.get(
        `https://${localStorage.getItem("baseUrl")}/projects_for_dropdown.json`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProjects(response.data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchOfferDetails = async (id: string) => {
    try {
      const response = await axios.get(getFullUrl(`/crm/offers/${id}.json`), {
        params: {
          token: HI_SOCIETY_CONFIG.TOKEN,
        },
      });
      // Handle both response.data and response.data.offer structures
      const offer = response.data.offer || response.data;
      console.log("Fetched offer data for edit:", offer);

      // Map offer_applicable_projects to get project IDs
      const projectIds =
        offer.offer_applicable_projects &&
        Array.isArray(offer.offer_applicable_projects)
          ? offer.offer_applicable_projects.map((oap: any) =>
              oap.project_id.toString()
            )
          : [];

      // Format dates to YYYY-MM-DD for HTML date inputs
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      setFormData({
        offerTitle: offer.title || "",
        offerDescription: offer.description || "",
        legalPoliciesTemplate: offer.offer_template_id?.toString() || "",
        bannerImage: null,
        applicableProjects: projectIds,
        startDate: formatDateForInput(offer.start_date),
        endDate: formatDateForInput(offer.expiry),
        status: offer.active === 1 ? "Active" : "Inactive",
        // Backend will expose offer_type later; default to empty until available
        offerType: offer.offer_type || "",
        showOnHomePage: offer.show_on_home === 1 || offer.show_on_home === true,
        featuredOffer: offer.featured === 1 || offer.featured === true,
        image_1_by_1: [],
        image_16_by_9: [],
        image_3_by_2: [],
        image_9_by_16: [],
        offer_pdf: [],
      });

      // Handle existing images by ratio
      const imageRatioFields = [
        { data: offer.image_1_by_1, key: "image_1_by_1" },
        { data: offer.image_16_by_9, key: "image_16_by_9" },
        { data: offer.image_3_by_2, key: "image_3_by_2" },
        { data: offer.image_9_by_16, key: "image_9_by_16" },
      ];

      for (const field of imageRatioFields) {
        if (field.data?.document_url && field.data?.document_file_name) {
          setFormData((prev) => ({
            ...prev,
            [field.key]: [
              {
                id: field.data.id,
                document_file_name: field.data.document_file_name,
                document_url: field.data.document_url,
                file_name: field.data.document_file_name,
                preview: field.data.document_url,
                file: null,
              },
            ],
          }));
        }
      }

      // Handle existing PDF
      if (
        offer.offer_pdf?.document_url &&
        offer.offer_pdf?.document_file_name
      ) {
        const existingPdfEntry = {
          id: offer.offer_pdf.id,
          document_file_name: offer.offer_pdf.document_file_name,
          document_url: offer.offer_pdf.document_url,
          file_name: offer.offer_pdf.document_file_name,
          file: null,
          // show existing thumbnail by using URL from server
          preview: offer.offer_pdf.document_url,
        };

        setFormData((prev) => ({
          ...prev,
          offer_pdf: [existingPdfEntry],
        }));

        // also mirror into uploadedImages so draft/save logic retains preview
        setUploadedImages([
          {
            id: existingPdfEntry.id,
            file: null,
            preview: existingPdfEntry.preview,
            file_name: existingPdfEntry.file_name,
            name: existingPdfEntry.file_name,
            ratio: "",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching offer details:", error);
      toast.error("Failed to fetch offer details");
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        if (!formData.offerTitle.trim()) {
          toast.error("Please enter offer title");
          return false;
        }
        if (!formData.offerDescription.trim()) {
          toast.error("Please enter offer description");
          return false;
        }
        // if (!formData.offerType) {
        //     toast.error('Please select offer type');
        //     return false;
        // }
        return true;

      case 1: // Media & Display
        // Optional validation
        return true;

      case 2: // Applicability
        if (formData.applicableProjects.length === 0) {
          toast.error("Please select at least one project");
          return false;
        }
        return true;

      case 3: // Validity & Status
        if (!formData.startDate) {
          toast.error("Please select start date");
          return false;
        }
        // only validate against past when not editing existing offer
        if (!isEditMode) {
          const today = new Date();
          const startDate = new Date(formData.startDate);
          const startDateNormalized = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
          );
          const todayNormalized = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );

          if (startDateNormalized < todayNormalized) {
            toast.error(
              "Start date cannot be in the past. Please select today or a future date."
            );
            return false;
          }
        }
        if (!formData.endDate) {
          toast.error("Please select end date");
          return false;
        }
        const endDate = new Date(formData.endDate);
        const startDate = new Date(formData.startDate);
        if (endDate < startDate) {
          toast.error("End date must be equal to or after start date");
          return false;
        }
        return true;

      case 4: // Visibility
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    // Validate current step
    if (!validateStep(activeStep)) {
      return;
    }

    // Mark step as completed and move to next
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }

    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
    setEditingStep(null);
  };

  const handleEdit = (step: number) => {
    setEditingStep(step);
    setActiveStep(step);
  };

  const handleSaveDraft = async () => {
    try {
      // Validate current step before saving
      if (!validateStep(activeStep)) {
        return;
      }

      // if the user was editing a specific step, clear that flag so the
      // summary reappears after we move onward
      setEditingStep(null);

      // Mark current step as completed and always persist to localStorage
      const updatedCompletedSteps = completedSteps.includes(activeStep)
        ? [...completedSteps]
        : [...completedSteps, activeStep];
      setCompletedSteps(updatedCompletedSteps);
      await saveDraftItem(STORAGE_KEYS.COMPLETED_STEPS, updatedCompletedSteps);

      // helper: convert File objects to base64 preview, drop file refs
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      };

      const processValue = async (value: any): Promise<any> => {
        if (value instanceof File || value instanceof Blob) {
          return await fileToBase64(value as File);
        }
        if (Array.isArray(value)) {
          return Promise.all(value.map(processValue));
        }
        if (value && typeof value === 'object') {
          const obj: any = { ...value };
          if (obj.file instanceof File || obj.file instanceof Blob) {
            // only convert file to base64 if preview is missing or is a blob: URL
            if (!obj.preview || typeof obj.preview !== 'string' || obj.preview.startsWith('blob:')) {
              obj.preview = await fileToBase64(obj.file as File);
            }
            obj.file = null;
          }
          for (const k of Object.keys(obj)) {
            if (k === 'file') continue; // already handled above
            obj[k] = await processValue(obj[k]);
          }
          return obj;
        }
        return value;
      };

      // build safe form data asynchronously
      const safeForm = await processValue(formData);
      const formSaved = await saveDraftItem(STORAGE_KEYS.FORM_DATA, safeForm);
      if (!formSaved) {
        toast.error("Failed to save draft. Try again later.");
        return;
      }

      // Save uploadedImages similarly (preview will be base64 if file present)
      const processedImages = await processValue(uploadedImages);
      const imagesToSave = (processedImages as UploadedImage[]).map((img) => ({
        id: img.id,
        name: img.name || img.file_name || "",
        preview: img.preview,
        file: null,
      }));
      await saveDraftItem(STORAGE_KEYS.UPLOADED_IMAGES, imagesToSave);

      // If not on the last step, move to next step
      if (activeStep < steps.length - 1) {
        const nextStep = activeStep + 1;
        setActiveStep(nextStep);
        await saveDraftItem(STORAGE_KEYS.ACTIVE_STEP, nextStep);

        toast.success("Draft saved successfully! Moving to next step.", {
          duration: 3000,
        });
      } else {
        // On last step, just save without moving
        await saveDraftItem(STORAGE_KEYS.ACTIVE_STEP, activeStep);

        toast.success("Draft saved successfully!", {
          duration: 3000,
        });
      }

      setHasSavedDraft(true);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    }
  };

  const handleSubmit = async () => {
    // Validate all steps before submission
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        toast.error(`Please complete step ${i + 1}: ${steps[i]}`);
        setActiveStep(i);
        return;
      }
    }

    // Mark final step as completed
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }

    setIsSubmitting(true);
    try {
      const formDataPayload = new FormData();

      // Add project IDs (multiple values)
      formData.applicableProjects.forEach((projectId) => {
        formDataPayload.append("project_ids[]", projectId);
      });

      // Add offer details
      formDataPayload.append("offer[title]", formData.offerTitle);
      formDataPayload.append("offer[description]", formData.offerDescription);
      formDataPayload.append("offer[offer_type]", formData.offerType);
      formDataPayload.append("offer[otype]", "Project");
      formDataPayload.append("offer[otype_id]", "1");
      formDataPayload.append("offer[start_date]", formData.startDate);
      formDataPayload.append("offer[expiry]", formData.endDate);
      formDataPayload.append(
        "offer[active]",
        formData.status === "Active" ? "1" : "0"
      );
      formDataPayload.append(
        "offer[show_on_home]",
        formData.showOnHomePage ? "1" : "0"
      );
      formDataPayload.append(
        "offer[featured]",
        formData.featuredOffer ? "1" : "0"
      );
      formDataPayload.append(
        "offer[status]",
        formData.featuredOffer ? "1" : "0"
      );

      // Add template ID if selected
      if (formData.legalPoliciesTemplate) {
        formDataPayload.append(
          "offer[offer_template_id]",
          formData.legalPoliciesTemplate
        );
      }

      // Add images for each ratio
      const imageRatioKeys = [
        "image_1_by_1",
        "image_16_by_9",
        "image_3_by_2",
        "image_9_by_16",
      ];

      for (const ratioKey of imageRatioKeys) {
        const images = formData[ratioKey] || [];
        const newImages = images.filter(
          (img) => img.file && img.file instanceof File
        );

        if (newImages.length > 0) {
          // Use the first image for this ratio
          formDataPayload.append(`offer[${ratioKey}]`, newImages[0].file);
        }
      }

      // Add PDF
      const pdfFiles = formData.offer_pdf || [];
      const newPdfFiles = pdfFiles.filter(
        (pdf) => pdf.file && pdf.file instanceof File
      );
      if (newPdfFiles.length > 0) {
        formDataPayload.append("offer[offer_pdf]", newPdfFiles[0].file);
      }

      let apiUrl = getFullUrl("/crm/offers.json");
      let method: "post" | "put" = "post";

      if (isEditMode && offerId) {
        apiUrl = getFullUrl(`/crm/offers/${offerId}.json`);
        method = "put";
      }

      // Make API call
      const response = await axios({
        url: apiUrl,
        method,
        data: formDataPayload,
        params: {
          token: HI_SOCIETY_CONFIG.TOKEN,
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        isEditMode
          ? "Offer updated successfully!"
          : "Offer created successfully!"
      );

      // Clear draft after successful submission
      await clearAllDraft();

      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate("/loyalty/offers-list");
      }, 1000);
    } catch (error: any) {
      console.error("Error creating offer:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create offer. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/loyalty/offers-list");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      // keep preview so the table can show an image
      const newFile = {
        id: Date.now().toString(),
        file_name: file.name,
        name: file.name,
        file: file,
        preview: previewUrl,
      };

      setFormData((prev) => ({
        ...prev,
        offer_pdf: [...(prev.offer_pdf || []), newFile],
      }));

      // mirror into uploadedImages for draft logic as before
      setUploadedImages((prev) => [...prev, newFile]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Get unique images for display (deduplicate by preview URL)
  const getUniqueImages = () => {
    const seenPreviews = new Set<string>();
    const uniqueImages: UploadedImage[] = [];

    for (const img of uploadedImages) {
      if (!seenPreviews.has(img.preview)) {
        seenPreviews.add(img.preview);
        uniqueImages.push(img);
      }
    }

    return uniqueImages;
  };

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Basic Info
        return (
          <SectionCard>
            <SectionHeader>
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconWrapper>
                  <RedIcon />
                </IconWrapper>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontFamily: "Work Sans, sans-serif",
                    textTransform: "uppercase",
                    fontSize: "18px",
                  }}
                >
                  Basic Info
                </Typography>
              </Box>
            </SectionHeader>
            <SectionBody>
              <Box sx={{ display: "flex", gap: 3 }}>
                <TextField
                  label="Offer Title"
                  required
                  value={formData.offerTitle}
                  onChange={(e) =>
                    handleInputChange("offerTitle", e.target.value)
                  }
                  placeholder="Enter Title"
                  sx={fieldStyles}
                  style={{ width: "50%" }}
                />
                <TextField
                  label="Offer Description"
                  required
                  value={formData.offerDescription}
                  onChange={(e) =>
                    handleInputChange("offerDescription", e.target.value)
                  }
                  placeholder="Enter Description"
                  sx={fieldStyles}
                  fullWidth
                />
              </Box>
              {/* <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                <FormControl fullWidth sx={fieldStyles}>
                                    <InputLabel>Offer Type</InputLabel>
                                    <MuiSelect
                                        value={formData.offerType}
                                        onChange={(e) => handleInputChange('offerType', e.target.value)}
                                        label="Offer Type"
                                    >
                                        <MenuItem value="">Select Offer Type</MenuItem>
                                        <MenuItem value="CP Offer">CP Offer</MenuItem>
                                        <MenuItem value="Customer Offer">Customer Offer</MenuItem>
                                    </MuiSelect>
                                </FormControl>
                                <FormControl fullWidth sx={fieldStyles}>
                                    <InputLabel>Legal Policies Template</InputLabel>
                                    <MuiSelect
                                        value={formData.legalPoliciesTemplate}
                                        onChange={(e) => handleInputChange('legalPoliciesTemplate', e.target.value)}
                                        label="Legal Policies Template"
                                        disabled={loadingTemplates}
                                    >
                                        <MenuItem value="">Select Policies</MenuItem>
                                        {loadingTemplates ? (
                                            <MenuItem disabled>Loading templates...</MenuItem>
                                        ) : (
                                            offerTemplates.map((template) => (
                                                <MenuItem key={template.id} value={template.id.toString()}>
                                                    {template.title}
                                                </MenuItem>
                                            ))
                                        )}
                                    </MuiSelect>
                                </FormControl>
                            </Box> */}
            </SectionBody>
          </SectionCard>
        );

      case 1: // Media & Display
        return (
          <SectionCard>
            <SectionHeader>
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconWrapper>
                  <RedIcon />
                </IconWrapper>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontFamily: "Work Sans, sans-serif",
                    textTransform: "uppercase",
                    fontSize: "18px",
                  }}
                >
                  Media & Display
                </Typography>
              </Box>
            </SectionHeader>
            <SectionBody sx={{ maxHeight: "600px", overflowY: "auto" }}>
              {/* Offer Banner Image Section */}
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "Work Sans, sans-serif",
                      fontWeight: 500,
                      fontSize: "14px",
                    }}
                  >
                    Offer Banner Image
                  </Typography>
                  <button
                    className="px-4 py-2 bg-[transparent] text-[#C72030] border border-[#C72030] transition-colors"
                    type="button"
                    onClick={() => setShowBannerModal(true)}
                    style={{
                      fontSize: "14px",
                      fontFamily: "Work Sans, sans-serif",
                    }}
                  >
                    Add
                  </button>
                </Box>

                {/* Upload Modal */}
                {showBannerModal && (
                  <ProjectBannerUpload
                    onClose={() => setShowBannerModal(false)}
                    includeInvalidRatios={false}
                    selectedRatioProp={selectedBannerRatios}
                    showAsModal
                    label={bannerImageLabel}
                    description={dynamicDescription}
                    onContinue={(validImages) =>
                      handleCroppedImages(validImages, "banner")
                    }
                  />
                )}

                {/* Banner Images Table */}
                <TableContainer
                  sx={{ border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <Table>
                    <TableHead sx={{ backgroundColor: "#e7e3d9" }}>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "Work Sans, sans-serif",
                            color: "#333",
                          }}
                        >
                          File Name
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "Work Sans, sans-serif",
                            color: "#333",
                          }}
                        >
                          Preview
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "Work Sans, sans-serif",
                            color: "#333",
                          }}
                        >
                          Ratio
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "Work Sans, sans-serif",
                            color: "#333",
                          }}
                        >
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        const allImages: any[] = [];
                        project_banner.forEach((ratio) => {
                          const images = formData[ratio.key] || [];
                          images.forEach((img) => {
                            allImages.push({
                              ...img,
                              ratio: ratio.label,
                              ratioKey: ratio.key,
                            });
                          });
                        });

                        if (allImages.length === 0) {
                          return (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                align="center"
                                sx={{ py: 4, color: "#999", fontSize: "14px" }}
                              >
                                No images uploaded yet
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return allImages.map((img, index) => (
                          <TableRow key={index}>
                            <TableCell
                              sx={{
                                fontSize: "14px",
                                color: "#666",
                                fontFamily: "Work Sans, sans-serif",
                              }}
                            >
                              {img.file_name ||
                                img.document_file_name ||
                                "Banner Image"}
                            </TableCell>
                            <TableCell>
                              <img
                                src={
                                  img.preview ||
                                  img.document_url ||
                                  (img.file
                                    ? URL.createObjectURL(img.file)
                                    : "")
                                }
                                alt={
                                  img.file_name ||
                                  img.document_file_name ||
                                  "Banner"
                                }
                                style={{
                                  width: "80px",
                                  height: "50px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                }}
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: "14px",
                                color: "#666",
                                fontFamily: "Work Sans, sans-serif",
                              }}
                            >
                              {img.ratio}
                            </TableCell>
                            <TableCell>
                              <MuiButton
                                onClick={() => discardImage(img.ratioKey, img)}
                                sx={{
                                  color: "#C72030",
                                  textTransform: "none",
                                  fontSize: "13px",
                                  fontFamily: "Work Sans, sans-serif",
                                  p: 0,
                                  minWidth: "auto",
                                  "&:hover": { backgroundColor: "#FFF5F5" },
                                }}
                              >
                                Delete
                              </MuiButton>
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* File Upload Section (PDF) */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "Work Sans, sans-serif",
                        fontWeight: 500,
                        fontSize: "14px",
                      }}
                    >
                     Offer Thumbnail Image
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "Work Sans, sans-serif",
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      {/* File Upload: Only (.pdf) or (.docx) or (.jpg) or (.png) or
                      (.webp) files are accepted */}
                    </Typography>
                  </Box>
                  <MuiButton
                    variant="outlined"
                    component="label"
                    sx={{
                      color: "#C72030",
                      borderColor: "#C72030",
                      textTransform: "none",
                      borderRadius: 0,
                      fontSize: "14px",
                      fontFamily: "Work Sans, sans-serif",
                      "&:hover": {
                        borderColor: "#B8252F",
                        backgroundColor: "#FFF5F5",
                      },
                    }}
                  >
                    Add
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.docx,.jpg,.png,.webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const maxSize = 20 * 1024 * 1024; // 20MB

                          if (file.size > maxSize) {
                            toast.error("File size must be less than 20MB");
                            return;
                          }

                          // Allowed types
                          const allowedTypes = [
                            "application/pdf",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            "image/jpeg",
                            "image/png",
                            "image/jpg",
                            "image/webp",
                          ];

                          if (!allowedTypes.includes(file.type)) {
                            toast.error(
                              "Only PDF, DOCX or Image files are allowed"
                            );
                            return;
                          }

                          //   const newFile = {
                          //     id: Date.now().toString(),
                          //     file_name: file.name,
                          //     file: file,
                          //     preview: file.type.startsWith("image/")
                          //       ? URL.createObjectURL(file)
                          //       : null,
                          //   };

                          const newFile = {
                            id: Date.now().toString(),
                            file_name: file.name,
                            file: file,
                            preview: URL.createObjectURL(file), // 👈 MUST for image preview
                          };

                          setFormData((prev) => ({
                            ...prev,
                            offer_pdf: [...(prev.offer_pdf || []), newFile],
                          }));

                          toast.success("File uploaded successfully");
                        }
                      }}
                    />
                  </MuiButton>
                </Box>

                {/* PDF Files Table */}
                <TableContainer
                  sx={{ border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <Table>
                    <TableHead sx={{ backgroundColor: "#e7e3d9" }}>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "Work Sans, sans-serif",
                            color: "#333",
                          }}
                        >
                          File Name
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "Work Sans, sans-serif",
                            color: "#333",
                          }}
                        >
                          Preview
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "Work Sans, sans-serif",
                            color: "#333",
                          }}
                        >
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!formData.offer_pdf ||
                      formData.offer_pdf.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            align="center"
                            sx={{ py: 4, color: "#999", fontSize: "14px" }}
                          >
                            No files uploaded yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.offer_pdf.map((pdf, index) => (
                          <TableRow key={index}>
                            <TableCell
                              sx={{
                                fontSize: "14px",
                                color: "#666",
                                fontFamily: "Work Sans, sans-serif",
                              }}
                            >
                              {pdf.file_name ||
                                pdf.document_file_name ||
                                "Document"}
                            </TableCell>
                            <TableCell>
                              {pdf.preview ? (
                                <img
                                  src={pdf.preview}
                                  alt="Preview"
                                  style={{
                                    width: "80px",
                                    height: "50px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                              ) : (
                                <Typography sx={{ fontSize: "13px", color: "#999" }}>
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <MuiButton
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    offer_pdf: (prev.offer_pdf || []).filter(
                                      (_, i) => i !== index
                                    ),
                                  }));
                                  toast.success("PDF removed successfully");
                                }}
                                sx={{
                                  color: "#C72030",
                                  textTransform: "none",
                                  fontSize: "13px",
                                  fontFamily: "Work Sans, sans-serif",
                                  p: 0,
                                  minWidth: "auto",
                                  "&:hover": { backgroundColor: "#FFF5F5" },
                                }}
                              >
                                Delete
                              </MuiButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </SectionBody>
          </SectionCard>
        );

      case 2: // Applicability
        return (
          <SectionCard>
            <SectionHeader>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "50%",
                }}
              >
                <IconWrapper>
                  <RedIcon />
                </IconWrapper>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    fontFamily: "Work Sans, sans-serif",
                    textTransform: "uppercase",
                    fontSize: "13px",
                  }}
                >
                  Applicability
                </Typography>
              </Box>
            </SectionHeader>
            <SectionBody>
              <Box sx={{ minWidth: 0, overflow: 'visible', position: 'relative' }}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-root': fieldStyles,
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                >
                  <InputLabel shrink>
                    Applicable Project(s) <span style={{ color: 'red' }}>*</span>
                  </InputLabel>
                  {/* use MUI Select (MuiSelect) instead of react-select component */}
                  <MuiSelect
                    multiple
                    label="Applicable Project(s)"
                    notched
                    displayEmpty
                    value={formData.applicableProjects}
                    onChange={(e: SelectChangeEvent<any>) => {
                      const vals = e.target.value as string[];
                      handleInputChange('applicableProjects', vals);
                    }}
                    renderValue={(selected) => {
                      const sel = selected as string[];
                      if (!sel || sel.length === 0) {
                        return <span style={{ color: '#aaa' }}>Select Projects</span>;
                      }
                      const names = projects
                        .filter((p) => sel.includes(p.id.toString()))
                        .map((p) => p.name)
                        .join(', ');
                      return (
                        <span
                          title={names}
                          style={{
                            display: 'inline-block',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {names}
                        </span>
                      );
                    }}
                    disabled={(step < activeStep && editingStep !== step) || loadingProjects}
                    sx={{
                      minWidth: 0,
                      maxWidth: '100%',
                      width: '100%',
                      '& .MuiSelect-select': {
                        display: 'block',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: { minWidth: 200, maxWidth: 520, width: 'auto', zIndex: 99999 },
                      },
                      // ensure the menu is positioned above other elements
                      anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                      transformOrigin: { vertical: 'top', horizontal: 'left' },
                      // @ts-ignore: MUI MenuProps type doesn't expose PopperProps but we use it for positioning
                      PopperProps: {
                        container: document.body,
                        modifiers: [
                          { name: 'preventOverflow', options: { boundary: 'viewport' } },
                        ],
                        style: { zIndex: 99999 },
                      },
                    } as any}
                  >
                    <MenuItem value="">Select Projects</MenuItem>
                    {projects &&
                      projects.map((option) => (
                        <MenuItem key={option.id} value={option.id.toString()}>
                          {option.name}
                        </MenuItem>
                      ))}
                  </MuiSelect>
                </FormControl>
              </Box>
            </SectionBody>
          </SectionCard>
        );

      case 3: // Validity & Status
        return (
          <SectionCard>
            <SectionHeader>
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconWrapper>
                  <RedIcon />
                </IconWrapper>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontFamily: "Work Sans, sans-serif",
                    textTransform: "uppercase",
                    fontSize: "18px",
                  }}
                >
                  Validity & Status
                </Typography>
              </Box>
            </SectionHeader>
            <SectionBody>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                  gap: 3,
                }}
              >
                <TextField
                  label="Start Date"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  placeholder="DD/MM/YYYY"
                  inputProps={{ min: isEditMode ? undefined : getTodayDateString() }}
                  sx={{ ...fieldStyles, width: "50%" }}
                  fullWidth
                />
                <TextField
                  label="End Date"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  placeholder="DD/MM/YYYY"
                  inputProps={{
                    min: formData.startDate || getTodayDateString(),
                  }}
                  sx={{ ...fieldStyles, width: "50%" }}
                  fullWidth
                />
                <FormControl fullWidth sx={fieldStyles}>
                  <InputLabel>Status</InputLabel>
                  <MuiSelect
                    value={formData.status}
                    onChange={(e: SelectChangeEvent<any>) =>
                      handleInputChange("status", e.target.value)
                    }
                    label="Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </MuiSelect>
                </FormControl>
              </Box>
            </SectionBody>
          </SectionCard>
        );

      case 4: // Visibility
        return (
          <SectionCard>
            <SectionHeader>
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconWrapper>
                  <RedIcon />
                </IconWrapper>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontFamily: "Work Sans, sans-serif",
                    textTransform: "uppercase",
                    fontSize: "18px",
                  }}
                >
                  Visibility
                </Typography>
              </Box>
            </SectionHeader>
            <SectionBody>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        fontFamily: "Work Sans, sans-serif",
                      }}
                    >
                      Show on Home Page
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#666", fontSize: "13px" }}
                    >
                      Display this offer on the home page
                    </Typography>
                  </Box>
                  <Switch
                    checked={formData.showOnHomePage}
                    onChange={(e) =>
                      handleInputChange("showOnHomePage", e.target.checked)
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#C72030",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: "#C72030",
                        },
                    }}
                  />
                </Box>
                {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'Work Sans, sans-serif' }}>
                                            Featured Offer
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#666', fontSize: '13px' }}>
                                            Offer will be display as a pop-up on home screen
                                        </Typography>
                                    </Box>
                                    <Switch
                                        checked={formData.featuredOffer}
                                        onChange={(e) => handleInputChange('featuredOffer', e.target.checked)}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#C72030',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#C72030',
                                            },
                                        }}
                                    />
                                </Box> */}
              </Box>
            </SectionBody>
          </SectionCard>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4, lg: 6 },
        backgroundColor: "#f5f5f5",
        maxHeight: "90vh",
        overflowY: "auto",
        overflow: "visible",
        position: "relative",
      }}
    >
      <Toaster position="top-right" richColors closeButton />

      {/* Back Navigation */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Back to Offers List</span>
        </div>
      </div>

      {/* Draft Restoration Modal */}
      {showDraftModal ? (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: "Work Sans, sans-serif",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#333",
              }}
            >
              Draft Found
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: "Work Sans, sans-serif",
                marginBottom: "24px",
                color: "#666",
              }}
            >
              We found a saved draft for this offer. Would you like to continue
              where you left off or start fresh?
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <DraftButton onClick={handleStartFresh}>Start Fresh</DraftButton>
              <RedButton onClick={handleContinueWithDraft}>
                Continue Draft
              </RedButton>
            </Box>
          </Box>
        </Box>
      ) : null}

      {/* Breadcrumb */}
      <Typography
        variant="body2"
        sx={{ mb: 3, color: "#666", fontFamily: "Work Sans, sans-serif" }}
      >
        Offers &gt; Create
      </Typography>

      {/* Stepper */}
      <Box sx={{ mb: 3 }}>
        <Stepper
          activeStep={activeStep}
          connector={<CustomStepConnector />}
          sx={{
            "& .MuiStep-root": {
              padding: 0,
            },
          }}
        >
          {steps.map((label, index) => {
            const active = index === activeStep;
            const completed = completedSteps.includes(index);

            return (
              <Step key={label}>
                <StepLabel StepIconComponent={() => null}>
                  <Box
                    style={{
                      padding: "8px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <StepPill $active={active} $completed={completed}>
                      {index + 1}. {label}
                    </StepPill>
                  </Box>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>

      {/* Current Step Content */}
      {renderStepContent(activeStep)}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
        {activeStep === steps.length - 1 ? (
        // final visibility step: only submit & cancel
        <>
          <DraftButton onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </DraftButton>
          <DraftButton onClick={handleCancel}>Cancel</DraftButton>
        </>
      ) : (
        // intermediate steps
        <>
          <DraftButton onClick={handleNext} disabled={isSubmitting}>
            Proceed to save
          </DraftButton>
          {!isEditMode && (
            <DraftButton onClick={handleSaveDraft} disabled={isSubmitting}>
              Save to draft
            </DraftButton>
          )}
        </>
      )}
      </Box>

      {/* Progress Indicator */}
      {completedSteps.length > 0 && (
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: "#666",
            mb: 4,
            fontFamily: "Work Sans, sans-serif",
          }}
        >
          You've completed {completedSteps.length} out of {steps.length} steps.
        </Typography>
      )}

      {/* Completed Steps Summary */}
      {completedSteps.map((stepIndex) => {
        // hide summary only when the user is actively editing that step
        if (editingStep === stepIndex) return null;

        return (
          <SectionCard key={stepIndex}>
            <SectionHeader>
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconWrapper>
                  <RedIcon />
                </IconWrapper>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontFamily: "Work Sans, sans-serif",
                    textTransform: "uppercase",
                    fontSize: "18px",
                  }}
                >
                  {steps[stepIndex]}
                </Typography>
              </Box>
              <MuiButton
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => handleEdit(stepIndex)}
                sx={{
                  color: "#C72030",
                  borderColor: "#C72030",
                  textTransform: "none",
                  borderRadius: 0,
                  fontSize: "14px",
                  fontFamily: "Work Sans, sans-serif",
                  "&:hover": {
                    borderColor: "#B8252F",
                    backgroundColor: "#FFF5F5",
                  },
                }}
              >
                Edit
              </MuiButton>
            </SectionHeader>
            {/* Show summary of completed step */}
            <SectionBody>
              {stepIndex === 0 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999",
                        fontSize: "12px",
                        fontFamily: "Work Sans, sans-serif",
                      }}
                    >
                      Offer Title *
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#333",
                        fontSize: "14px",
                        fontFamily: "Work Sans, sans-serif",
                        mt: 0.5,
                      }}
                    >
                      {formData.offerTitle}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999",
                        fontSize: "12px",
                        fontFamily: "Work Sans, sans-serif",
                      }}
                    >
                      Offer Description *
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#333",
                        fontSize: "14px",
                        fontFamily: "Work Sans, sans-serif",
                        mt: 0.5,
                      }}
                    >
                      {formData.offerDescription}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999",
                        fontSize: "12px",
                        fontFamily: "Work Sans, sans-serif",
                      }}
                    >
                      Offer Type *
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#333",
                        fontSize: "14px",
                        fontFamily: "Work Sans, sans-serif",
                        mt: 0.5,
                      }}
                    >
                      {formData.offerType}
                    </Typography>
                  </Box>
                  {formData.legalPoliciesTemplate && (
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#999",
                          fontSize: "12px",
                          fontFamily: "Work Sans, sans-serif",
                        }}
                      >
                        Legal Policies Template
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#333",
                          fontSize: "14px",
                          fontFamily: "Work Sans, sans-serif",
                          mt: 0.5,
                        }}
                      >
                        {offerTemplates.find(
                          (t) =>
                            t.id.toString() === formData.legalPoliciesTemplate
                        )?.title || formData.legalPoliciesTemplate}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              {stepIndex === 1 && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#999",
                      fontSize: "12px",
                      fontFamily: "Work Sans, sans-serif",
                      mb: 1,
                    }}
                  >
                    Offer Banner Image(s)
                  </Typography>
                  <TableContainer
                    sx={{ border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <Table>
                      <TableHead sx={{ backgroundColor: "#e7e3d9" }}>
                        <TableRow>
                          <TableCell
                            sx={{
                              fontSize: "14px",
                              fontWeight: 600,
                              fontFamily: "Work Sans, sans-serif",
                              color: "#333",
                            }}
                          >
                            File Name
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "14px",
                              fontWeight: 600,
                              fontFamily: "Work Sans, sans-serif",
                              color: "#333",
                            }}
                          >
                            Preview
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "14px",
                              fontWeight: 600,
                              fontFamily: "Work Sans, sans-serif",
                              color: "#333",
                            }}
                          >
                            Ratio
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const allImages: any[] = [];
                          project_banner.forEach((ratio) => {
                            const imgs = formData[ratio.key] || [];
                            imgs.forEach((img) => {
                              allImages.push({
                                ...img,
                                ratio: ratio.label,
                              });
                            });
                          });

                          if (allImages.length === 0) {
                            return (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  align="center"
                                  sx={{ py: 4, color: "#999", fontSize: "14px" }}
                                >
                                  No images uploaded yet
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return allImages.map((img, index) => (
                            <TableRow key={index}>
                              <TableCell
                                sx={{
                                  fontSize: "14px",
                                  color: "#666",
                                  fontFamily: "Work Sans, sans-serif",
                                }}
                              >
                                {img.file_name || img.document_file_name || "Banner Image"}
                              </TableCell>
                              <TableCell>
                                <img
                                  src={
                                    img.preview ||
                                    img.document_url ||
                                    (img.file ? URL.createObjectURL(img.file) : "")
                                  }
                                  alt={
                                    img.file_name || img.document_file_name || "Banner"
                                  }
                                  style={{
                                    width: "80px",
                                    height: "50px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "14px",
                                  color: "#666",
                                  fontFamily: "Work Sans, sans-serif",
                                }}
                              >
                                {img.ratio || "-"}
                              </TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Thumbnail / PDF table */}
                  {formData.offer_pdf && formData.offer_pdf.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#999",
                          fontSize: "12px",
                          fontFamily: "Work Sans, sans-serif",
                          mb: 1,
                        }}
                      >
                        Offer Thumbnail Image(s)
                      </Typography>
                      <TableContainer
                        sx={{ border: "1px solid #ddd", borderRadius: "4px" }}
                      >
                        <Table>
                          <TableHead sx={{ backgroundColor: "#e7e3d9" }}>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  fontFamily: "Work Sans, sans-serif",
                                  color: "#333",
                                }}
                              >
                                File Name
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  fontFamily: "Work Sans, sans-serif",
                                  color: "#333",
                                }}
                              >
                                Preview
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {formData.offer_pdf.map((pdf, idx) => (
                              <TableRow key={idx}>
                                <TableCell
                                  sx={{
                                    fontSize: "14px",
                                    color: "#666",
                                    fontFamily: "Work Sans, sans-serif",
                                  }}
                                >
                                  {pdf.file_name || pdf.document_file_name}
                                </TableCell>
                                <TableCell>
                                  {pdf.preview ? (
                                    <img
                                      src={pdf.preview}
                                      alt="Preview"
                                      style={{
                                        width: "80px",
                                        height: "50px",
                                        objectFit: "cover",
                                        borderRadius: "4px",
                                      }}
                                    />
                                  ) : (
                                    <Typography
                                      sx={{ fontSize: "13px", color: "#999" }}
                                    >
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              )}
              {stepIndex === 2 && formData.applicableProjects.length > 0 && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#999",
                      fontSize: "12px",
                      fontFamily: "Work Sans, sans-serif",
                    }}
                  >
                    Applicable Project(s)
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#333",
                      fontSize: "14px",
                      fontFamily: "Work Sans, sans-serif",
                      mt: 0.5,
                    }}
                  >
                    {formData.applicableProjects
                      .map(
                        (projectId) =>
                          projects.find((p) => p.id.toString() === projectId)
                            ?.name || projectId
                      )
                      .join(", ")}
                  </Typography>
                </Box>
              )}
              {stepIndex === 3 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999",
                        fontSize: "12px",
                        fontFamily: "Work Sans, sans-serif",
                      }}
                    >
                      Start Date
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#333",
                        fontSize: "14px",
                        fontFamily: "Work Sans, sans-serif",
                        mt: 0.5,
                      }}
                    >
                      {formatDateDisplay(formData.startDate)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999",
                        fontSize: "12px",
                        fontFamily: "Work Sans, sans-serif",
                      }}
                    >
                      End Date
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#333",
                        fontSize: "14px",
                        fontFamily: "Work Sans, sans-serif",
                        mt: 0.5,
                      }}
                    >
                      {formatDateDisplay(formData.endDate)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999",
                        fontSize: "12px",
                        fontFamily: "Work Sans, sans-serif",
                      }}
                    >
                      Status
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#333",
                        fontSize: "14px",
                        fontFamily: "Work Sans, sans-serif",
                        mt: 0.5,
                      }}
                    >
                      {formData.status}
                    </Typography>
                  </Box>
                </Box>
              )}
              {stepIndex === 4 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999",
                        fontSize: "12px",
                        fontFamily: "Work Sans, sans-serif",
                      }}
                    >
                      Show on Home Page
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#333",
                        fontSize: "14px",
                        fontFamily: "Work Sans, sans-serif",
                        mt: 0.5,
                      }}
                    >
                      {formData.showOnHomePage ? "Yes" : "No"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999",
                        fontSize: "12px",
                        fontFamily: "Work Sans, sans-serif",
                      }}
                    >
                      Featured Offer
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#333",
                        fontSize: "14px",
                        fontFamily: "Work Sans, sans-serif",
                        mt: 0.5,
                      }}
                    >
                      {formData.featuredOffer ? "Yes" : "No"}
                    </Typography>
                  </Box>
                </Box>
              )}
            </SectionBody>
          </SectionCard>
        );
      })}

      {/* Loading Backdrop */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        open={isSubmitting}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography
          variant="h6"
          sx={{ fontFamily: "Work Sans, sans-serif", fontWeight: 500 }}
        >
          {isEditMode ? "Updating Offer..." : "Creating Offer..."}
        </Typography>
      </Backdrop>
    </Box>
  );
}
