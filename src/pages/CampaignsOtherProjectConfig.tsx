import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, X } from "lucide-react";
import {
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select as MuiSelect,
} from "@mui/material";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import axios from "axios";
import {
  API_CONFIG,
  getAuthHeader,
  getFullUrl,
  HI_SOCIETY_CONFIG,
} from "@/config/apiConfig";

interface EstateBuilder {
  id: number;
  name: string;
}

const selectMenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300,
      backgroundColor: "white",
    },
  },
};

// Field styles for Material-UI components (matches AddHelpdeskTicket.tsx)
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

const multilineFieldStyles = {
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    padding: "8.5px 14px",
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
  "& .MuiInputBase-inputMultiline": {
    padding: 0,
    resize: "none !important",
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#C72030",
    },
  },
};

const CampaignsOtherProjectConfig: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [estateBuilders, setEstateBuilders] = useState<EstateBuilder[]>([]);
  const [isLoadingBuilders, setIsLoadingBuilders] = useState(false);

  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedGalleryFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const [configForm, setConfigForm] = useState({
    name: "",
    address: "",
    about: "",
    coverImage: null as File | null,
    projectLogo: null as File | null,
    showOnOtherProject: false,
    projectReferenceId: "",
    geoLocationURL: "",
    receptionMobile1: "",
    receptionMobile2: "",
    latitude: "",
    longitude: "",
    builder_id: "",
    videoLink: "",
    projectStatus: "",
    description: "",
    projectArea: "",
    externalProjectId: "",
  });

  const [mobileErrors, setMobileErrors] = useState({
    receptionMobile1: "",
    receptionMobile2: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEstateBuilders();
  }, []);

  const fetchEstateBuilders = async () => {
    try {
      setIsLoadingBuilders(true);
      const baseUrl = (
        localStorage.getItem("baseUrl") ||
        API_CONFIG.BASE_URL ||
        "https://hi-society.lockated.com"
      ).replace(/\/$/, "");
      const url = `${baseUrl}/crm/estate_builders.json`;
      const token =
        JSON.parse(localStorage.getItem("user") || "{}")?.spree_api_key ||
        localStorage.getItem("token") ||
        "";
      const response = await fetch(`${url}?token=${token}`);
      if (!response.ok) throw new Error("Failed to fetch estate builders");
      const data = await response.json();
      const buildersArray = Array.isArray(data)
        ? data
        : data?.estate_builders || data?.builder_projects || data?.data || [];
      setEstateBuilders(buildersArray);
    } catch (error) {
      console.error("Error fetching estate builders:", error);
    } finally {
      setIsLoadingBuilders(false);
    }
  };

  const [configurations, setConfigurations] = useState([
    { name: "", description: "" },
  ]);
  const [amenities, setAmenities] = useState<
    { name: string; attachment: File | null }[]
  >([{ name: "", attachment: null }]);
  const [documents, setDocuments] = useState<
    { name: string; attachment: File | null }[]
  >([{ name: "", attachment: null }]);
  const [floorPlans, setFloorPlans] = useState<
    { name: string; attachments: File[] }[]
  >([{ name: "", attachments: [] }]);
  const [unitPlans, setUnitPlans] = useState<
    { name: string; attachments: File[] }[]
  >([{ name: "", attachments: [] }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!configForm.name.trim()) {
      alert("Project name is required");
      return;
    }
    if (!configForm.address.trim()) {
      alert("Address is required");
      return;
    }
    if (!configForm.about.trim()) {
      alert("About field is required");
      return;
    }
    if (!configForm.builder_id) {
      alert("Please select a Real Estate Client");
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = (
        localStorage.getItem("baseUrl") ||
        API_CONFIG.BASE_URL ||
        "https://hi-society.lockated.com"
      ).replace(/\/$/, "");

      const formData = new FormData();
      formData.append("builder_project[name]", configForm.name);
      formData.append("builder_project[address]", configForm.address);
      formData.append("builder_project[about]", configForm.about);
      formData.append(
        "builder_project[show_on_other_project]",
        configForm.showOnOtherProject ? "1" : "0"
      );
      formData.append(
        "builder_project[active]",
        configForm.showOnOtherProject ? "1" : "0"
      );
      formData.append("builder_project[geo_link]", configForm.geoLocationURL);
      formData.append(
        "builder_project[reception_number]",
        configForm.receptionMobile1
      );
      formData.append(
        "builder_project[reception_second_number]",
        configForm.receptionMobile2
      );
      formData.append(
        "builder_project[project_reference_id]",
        configForm.projectReferenceId
      );

      if (configForm.videoLink)
        formData.append("builder_project[video_link]", configForm.videoLink);
      if (configForm.projectStatus)
        formData.append(
          "builder_project[project_status]",
          configForm.projectStatus
        );
      if (configForm.description)
        formData.append(
          "builder_project[description]",
          configForm.description
        );
      if (configForm.projectArea)
        formData.append(
          "builder_project[project_area]",
          configForm.projectArea
        );
      if (configForm.externalProjectId)
        formData.append(
          "builder_project[external_project_id]",
          configForm.externalProjectId
        );

      if (configForm.latitude)
        formData.append("builder_project[latitude]", configForm.latitude);
      if (configForm.longitude)
        formData.append("builder_project[longitude]", configForm.longitude);

      if (configForm.coverImage) {
        formData.append("builder_project[mainimage]", configForm.coverImage);
        formData.append("builder_project[cover_image]", configForm.coverImage);
      }
      if (configForm.projectLogo) {
        formData.append("builder_project[mainlogo]", configForm.projectLogo);
        formData.append(
          "builder_project[project_logo]",
          configForm.projectLogo
        );
      }

      selectedGalleryFiles.forEach((file) => {
        formData.append("builder_project[gallery][]", file);
        formData.append("builder_project[gallery_images][]", file);
      });

      if (configForm.builder_id) {
        formData.append("builder_project[builder_id]", configForm.builder_id);
      }

      let amenityIdx = 0;
      amenities.forEach((item) => {
        if (item.name?.trim() || item.attachment) {
          if (item.name?.trim()) {
            formData.append(`project_amenities[${amenityIdx}][name]`, item.name.trim());
          }
          if (item.attachment) {
            formData.append(`project_amenities[${amenityIdx}][attachment]`, item.attachment);
          }
          amenityIdx++;
        }
      });

      let confIdx = 0;
      configurations.forEach((item) => {
        if (item.name?.trim() || item.description?.trim()) {
          if (item.name?.trim()) {
            formData.append(
              `builder_project[configurations_attributes][${confIdx}][name]`,
              item.name.trim()
            );
          }
          if (item.description?.trim()) {
            formData.append(
              `builder_project[configurations_attributes][${confIdx}][description]`,
              item.description.trim()
            );
          }
          confIdx++;
        }
      });

      let docIdx = 0;
      documents.forEach((doc) => {
        if (doc.name?.trim() || doc.attachment) {
          if (doc.name?.trim()) {
            formData.append(`project_documents[${docIdx}][name]`, doc.name.trim());
          }
          if (doc.attachment) {
            formData.append(
              `project_documents[${docIdx}][attachment]`,
              doc.attachment
            );
          }
          docIdx++;
        }
      });

      let fpIdx = 0;
      floorPlans.forEach((fp) => {
        if (fp.name?.trim() || fp.attachments?.length > 0) {
          if (fp.name?.trim()) {
            formData.append(`project_floor_plans[${fpIdx}][name]`, fp.name.trim());
          }
          fp.attachments?.forEach((file) => {
            formData.append(
              `project_floor_plans[${fpIdx}][attachments][]`,
              file
            );
          });
          fpIdx++;
        }
      });

      let upIdx = 0;
      unitPlans.forEach((up) => {
        if (up.name?.trim() || up.attachments?.length > 0) {
          if (up.name?.trim()) {
            formData.append(`project_unit_plans[${upIdx}][name]`, up.name.trim());
          }
          up.attachments?.forEach((file) => {
            formData.append(
              `project_unit_plans[${upIdx}][attachments][]`,
              file
            );
          });
          upIdx++;
        }
      });

      const societyId = localStorage.getItem("selectedSocietyId");
      if (societyId) {
        formData.append("builder_project[society_id]", societyId);
      }

      const token =
        JSON.parse(localStorage.getItem("user") || "{}")?.spree_api_key ||
        localStorage.getItem("token") ||
        "";

      // Debug: Log all form data being sent
      console.log("Form data being sent:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await axios.post(
        `${baseUrl}/crm/builder_projects.json?token=${token}`,
        formData,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      // Check if response contains error data
      if (
        response.data?.code === 401 ||
        response.data?.error ||
        response.data?.errors ||
        response.data?.success === false
      ) {
        console.error("API Error Response:", response.data);
        const errMsg =
          response.data?.error ||
          (typeof response.data?.errors === "object"
            ? Object.entries(response.data.errors)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                .join("\n")
            : response.data?.errors) ||
          response.data?.message ||
          JSON.stringify(response.data);
        alert(`Failed to create project: ${errMsg}`);
        return;
      }

      if (
        response.data?.success ||
        response.data?.id ||
        response.data?.data?.id ||
        response.data?.builder_project?.id ||
        response.status === 200 ||
        response.status === 201
      ) {
        navigate("/campaigns/other-project");
      } else {
        console.error("API Response:", response.data);
        alert(`Failed to create project: ${JSON.stringify(response.data)}`);
      }
    } catch (error: any) {
      console.error("Error creating project:", error);

      if (error.response?.status === 422) {
        console.error("422 Error details:", error.response.data);
        alert(`Validation failed: ${JSON.stringify(error.response.data)}`);
      } else if (error.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert(
          error.response?.data?.message ||
            `An error occurred: ${JSON.stringify(error.response?.data)}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[30px] min-h-screen bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
        <button
          onClick={() => navigate("/campaigns/other-project")}
          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[24px] font-semibold text-[#1a1a1a]">
          Configure Project
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow border-2 p-6 space-y-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Row 1: Name and Cover Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <TextField
                  fullWidth
                  label="Name"
                  required
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.name}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
                  <InputLabel shrink>Real Estate Client</InputLabel>
                  <MuiSelect
                    value={configForm.builder_id}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        builder_id: e.target.value as string,
                      })
                    }
                    label="Real Estate Client"
                    notched
                    displayEmpty
                    MenuProps={selectMenuProps}
                  >
                    <MenuItem value="">
                      <em>Select Real Estate Client</em>
                    </MenuItem>
                    {estateBuilders.map((builder) => (
                      <MenuItem key={builder.id} value={builder.id.toString()}>
                        {builder.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div>
            </div>

            {/* Row 2: Address and About */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  minRows={3}
                  maxRows={6}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={configForm.address}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, address: e.target.value })
                  }
                  placeholder="Enter address"
                  sx={multilineFieldStyles}
                />
              </div>
              <div className="space-y-6">
                <div>
                  <TextField
                    fullWidth
                    label="About"
                    multiline
                    minRows={3}
                    maxRows={6}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    value={configForm.about}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, about: e.target.value })
                    }
                    placeholder="Enter description"
                    sx={multilineFieldStyles}
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="Cover Image"
                    type="file"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: fieldStyles }}
                    onChange={(e: any) =>
                      setConfigForm({
                        ...configForm,
                        coverImage: e.target.files ? e.target.files[0] : null,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Show on other project and Project Logo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="showOnOtherProject"
                  checked={configForm.showOnOtherProject}
                  onCheckedChange={(checked) =>
                    setConfigForm({
                      ...configForm,
                      showOnOtherProject: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor="showOnOtherProject"
                  className="text-sm text-gray-700"
                >
                  Show on other project
                </Label>
              </div>
              <div>
                <TextField
                  fullWidth
                  label="Project Logo"
                  type="file"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  onChange={(e: any) =>
                    setConfigForm({
                      ...configForm,
                      projectLogo: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />
              </div>
            </div>

            {/* Row 4: Project Reference Id and Geo Location URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <TextField
                  fullWidth
                  label="Project Reference Id"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.projectReferenceId}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      projectReferenceId: e.target.value,
                    })
                  }
                  placeholder="Enter reference ID"
                />
              </div>
              <div>
                <TextField
                  fullWidth
                  label="Geo Location URL"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.geoLocationURL}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      geoLocationURL: e.target.value,
                    })
                  }
                  placeholder="Enter geo location URL"
                />
              </div>
            </div>

            {/* Row 5: Reception Mobiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <TextField
                  fullWidth
                  label="Reception Mobile - 1"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.receptionMobile1}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      receptionMobile1: e.target.value,
                    })
                  }
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <TextField
                  fullWidth
                  label="Reception Mobile - 2"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.receptionMobile2}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setConfigForm({
                      ...configForm,
                      receptionMobile2: value,
                    });
                  }}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            {/* Row 6: Latitude and Longitude */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <TextField
                  fullWidth
                  label="Latitude"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.latitude}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, latitude: e.target.value })
                  }
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <TextField
                  fullWidth
                  label="Longitude"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.longitude}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, longitude: e.target.value })
                  }
                  placeholder="Enter longitude"
                />
              </div>
            </div>

            {/* Row 7: Video Link and Project Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <TextField
                  fullWidth
                  label="Video Link"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.videoLink}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, videoLink: e.target.value })
                  }
                  placeholder="Enter video URL"
                />
              </div>
              <div>
                <FormControl fullWidth sx={{ "& .MuiInputBase-root": fieldStyles }}>
                  <InputLabel shrink>Project Status</InputLabel>
                  <MuiSelect
                    value={configForm.projectStatus}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        projectStatus: e.target.value as string,
                      })
                    }
                    label="Project Status"
                    notched
                    displayEmpty
                    MenuProps={selectMenuProps}
                  >
                    <MenuItem value="">
                      <em>Select Status</em>
                    </MenuItem>
                    <MenuItem value="ongoing">Ongoing</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="on_hold">On Hold</MenuItem>
                  </MuiSelect>
                </FormControl>
              </div>
            </div>

            {/* Row 8: Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={3}
                maxRows={6}
                value={configForm.description}
                onChange={(e) =>
                  setConfigForm({ ...configForm, description: e.target.value })
                }
                placeholder="Enter project description"
                sx={multilineFieldStyles}
              />
            </div>

            {/* Row 9: Project Area and External Project ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <TextField
                  fullWidth
                  label="Project Area"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.projectArea}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, projectArea: e.target.value })
                  }
                  placeholder="e.g., 2.5 Acres"
                />
              </div>
              <div>
                <TextField
                  fullWidth
                  label="External Project ID"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                  value={configForm.externalProjectId}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      externalProjectId: e.target.value,
                    })
                  }
                  placeholder="Enter external project ID"
                />
              </div>
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery images
              </label>
              <input
                type="file"
                ref={galleryInputRef}
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleGalleryChange}
              />
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors"
                onClick={() => galleryInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-1 text-gray-500">
                  <Plus className="w-6 h-6" />
                  <span className="text-xs">Click to add images</span>
                </div>
              </div>
              {selectedGalleryFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-3">
                  {selectedGalleryFiles.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedFile(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[10px] text-gray-500 truncate mt-1">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <div className="space-y-4">
                {amenities.map((amenity, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <TextField
                        fullWidth
                        label="Name"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: fieldStyles }}
                        placeholder="e.g., Club House"
                        value={amenity.name}
                        onChange={(e) => {
                          const newAm = [...amenities];
                          newAm[index].name = e.target.value;
                          setAmenities(newAm);
                        }}
                      />
                    </div>
                    <div>
                      <TextField
                        fullWidth
                        label="Attachment"
                        type="file"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: fieldStyles }}
                        onChange={(e: any) => {
                          const newAm = [...amenities];
                          newAm[index].attachment = e.target.files ? e.target.files[0] : null;
                          setAmenities(newAm);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() =>
                    setAmenities([
                      ...amenities,
                      { name: "", attachment: null },
                    ])
                  }
                  className="!bg-[#C72030] !text-white px-8 border-0 flex items-center gap-2"
                >
                  Add More
                </Button>
                {amenities.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => {
                      const newAm = [...amenities];
                      newAm.pop();
                      setAmenities(newAm);
                    }}
                    className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white flex items-center gap-2"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Configurations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configurations (e.g., 2 BHK)
              </label>
              <div className="space-y-4">
                {configurations.map((conf, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <div>
                      <TextField
                        fullWidth
                        label="Name"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: fieldStyles }}
                        placeholder="e.g., 2 BHK"
                        value={conf.name}
                        onChange={(e) => {
                          const newConf = [...configurations];
                          newConf[index].name = e.target.value;
                          setConfigurations(newConf);
                        }}
                      />
                    </div>
                    <div>
                      <TextField
                        fullWidth
                        label="Description"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: fieldStyles }}
                        placeholder="e.g., 850 sq ft"
                        value={conf.description}
                        onChange={(e) => {
                          const newConf = [...configurations];
                          newConf[index].description = e.target.value;
                          setConfigurations(newConf);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() =>
                    setConfigurations([
                      ...configurations,
                      { name: "", description: "" },
                    ])
                  }
                  className="!bg-[#C72030] !text-white px-8 border-0 flex items-center gap-2"
                >
                  Add More
                </Button>
                {configurations.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => {
                      const newConf = [...configurations];
                      newConf.pop();
                      setConfigurations(newConf);
                    }}
                    className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white flex items-center gap-2"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>


            {/* Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents
              </label>
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <TextField
                        fullWidth
                        label="Name"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: fieldStyles }}
                        placeholder="e.g., Brochure / RERA Certificate"
                        value={doc.name}
                        onChange={(e) => {
                          const newDocs = [...documents];
                          newDocs[index].name = e.target.value;
                          setDocuments(newDocs);
                        }}
                      />
                    </div>
                    <div>
                      <TextField
                        fullWidth
                        label="Attachment"
                        type="file"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: fieldStyles }}
                        onChange={(e: any) => {
                          const newDocs = [...documents];
                          newDocs[index].attachment = e.target.files ? e.target.files[0] : null;
                          setDocuments(newDocs);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() =>
                    setDocuments([...documents, { name: "", attachment: null }])
                  }
                  className="!bg-[#C72030] !text-white px-8 border-0 flex items-center gap-2"
                >
                  Add More
                </Button>
                {documents.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => {
                      const newDocs = [...documents];
                      newDocs.pop();
                      setDocuments(newDocs);
                    }}
                    className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white flex items-center gap-2"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Floor Plans */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor Plans
              </label>
              <div className="space-y-4">
                {floorPlans.map((fp, index) => (
                  <div key={index} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <TextField
                          fullWidth
                          label="Name"
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ sx: fieldStyles }}
                          placeholder="e.g., Ground Floor Plan"
                          value={fp.name}
                          onChange={(e) => {
                            const newFp = [...floorPlans];
                            newFp[index].name = e.target.value;
                            setFloorPlans(newFp);
                          }}
                        />
                      </div>
                      <div>
                        <TextField
                          fullWidth
                          label="Attachments"
                          type="file"
                          inputProps={{ multiple: true }}
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ sx: fieldStyles }}
                          onChange={(e: any) => {
                            const files = e.target.files ? (Array.from(e.target.files) as File[]) : [];
                            const newFp = [...floorPlans];
                            newFp[index].attachments = [...newFp[index].attachments, ...files];
                            setFloorPlans(newFp);
                          }}
                        />
                      </div>
                    </div>
                    {fp.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {fp.attachments.map((file, fIdx) => (
                          <span
                            key={fIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 text-xs text-gray-700 border"
                          >
                            <span className="max-w-[200px] truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newFp = [...floorPlans];
                                newFp[index].attachments = newFp[index].attachments.filter((_, i) => i !== fIdx);
                                setFloorPlans(newFp);
                              }}
                              className="text-red-500 hover:text-red-700 ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() =>
                    setFloorPlans([...floorPlans, { name: "", attachments: [] }])
                  }
                  className="!bg-[#C72030] !text-white px-8 border-0 flex items-center gap-2"
                >
                  Add More
                </Button>
                {floorPlans.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => {
                      const newFp = [...floorPlans];
                      newFp.pop();
                      setFloorPlans(newFp);
                    }}
                    className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white flex items-center gap-2"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Unit Plans */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Plans
              </label>
              <div className="space-y-4">
                {unitPlans.map((up, index) => (
                  <div key={index} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <TextField
                          fullWidth
                          label="Name"
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ sx: fieldStyles }}
                          placeholder="e.g., 2 BHK Unit Plan"
                          value={up.name}
                          onChange={(e) => {
                            const newUp = [...unitPlans];
                            newUp[index].name = e.target.value;
                            setUnitPlans(newUp);
                          }}
                        />
                      </div>
                      <div>
                        <TextField
                          fullWidth
                          label="Attachments"
                          type="file"
                          inputProps={{ multiple: true }}
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ sx: fieldStyles }}
                          onChange={(e: any) => {
                            const files = e.target.files ? (Array.from(e.target.files) as File[]) : [];
                            const newUp = [...unitPlans];
                            newUp[index].attachments = [...newUp[index].attachments, ...files];
                            setUnitPlans(newUp);
                          }}
                        />
                      </div>
                    </div>
                    {up.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {up.attachments.map((file, fIdx) => (
                          <span
                            key={fIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 text-xs text-gray-700 border"
                          >
                            <span className="max-w-[200px] truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newUp = [...unitPlans];
                                newUp[index].attachments = newUp[index].attachments.filter((_, i) => i !== fIdx);
                                setUnitPlans(newUp);
                              }}
                              className="text-red-500 hover:text-red-700 ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() =>
                    setUnitPlans([...unitPlans, { name: "", attachments: [] }])
                  }
                  className="!bg-[#C72030] !text-white px-8 border-0 flex items-center gap-2"
                >
                  Add More
                </Button>
                {unitPlans.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => {
                      const newUp = [...unitPlans];
                      newUp.pop();
                      setUnitPlans(newUp);
                    }}
                    className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white flex items-center gap-2"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 justify-center pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="!bg-[#C72030] !text-white px-8 border-0 flex items-center gap-2"
              >
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => navigate("/campaigns/other-project")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignsOtherProjectConfig;
