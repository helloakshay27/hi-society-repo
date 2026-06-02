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
      const baseUrl = API_CONFIG.BASE_URL || "https://hi-society.lockated.com";
      const url = `${baseUrl}/crm/estate_builders.json`;
      const token = JSON.parse(
        localStorage.getItem("user") || "{}"
      )?.spree_api_key;
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
  const [highlights, setHighlights] = useState([{ name: "", description: "" }]);
  const [plans, setPlans] = useState([{ name: "" }]);
  const [amenities, setAmenities] = useState([{ name: "", description: "" }]);

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
      const baseUrl = API_CONFIG.BASE_URL || "https://hi-society.lockated.com";

      const formData = new FormData();
      formData.append("builder_project[name]", configForm.name);
      formData.append("builder_project[address]", configForm.address);
      formData.append("builder_project[about]", configForm.about);
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
        formData.append("builder_project[cover_image]", configForm.coverImage);
      }
      if (configForm.projectLogo) {
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

      amenities.forEach((item, i) => {
        if (item.name) {
          formData.append(
            `builder_project[amenities_attributes][${i}][name]`,
            item.name
          );
          if (item.description)
            formData.append(
              `builder_project[amenities_attributes][${i}][description]`,
              item.description
            );
        }
      });
      configurations.forEach((item, i) => {
        if (item.name) {
          formData.append(
            `builder_project[configurations_attributes][${i}][name]`,
            item.name
          );
          if (item.description)
            formData.append(
              `builder_project[configurations_attributes][${i}][description]`,
              item.description
            );
        }
      });
      highlights.forEach((item, i) => {
        if (item.name) {
          formData.append(
            `builder_project[highlights_attributes][${i}][name]`,
            item.name
          );
          if (item.description)
            formData.append(
              `builder_project[highlights_attributes][${i}][description]`,
              item.description
            );
        }
      });
      plans.forEach((item, i) => {
        if (item.name) {
          formData.append(
            `builder_project[plans_attributes][${i}][name]`,
            item.name
          );
        }
      });

      const societyId = localStorage.getItem("selectedSocietyId");
      if (societyId) {
        formData.append("builder_project[society_id]", societyId);
      }

      const token = JSON.parse(
        localStorage.getItem("user") || "{}"
      )?.spree_api_key;

      // Debug: Log all form data being sent
      console.error("Form data being sent:");
      for (const [key, value] of formData.entries()) {
        console.error(`${key}:`, value);
      }

      const response = await axios.post(
        `${baseUrl}/crm/builder_projects.json?token=${token}`,
        formData
      );

      // Check if response contains error data
      if (response.data?.code === 401 || response.data?.error) {
        console.error("API Error Response:", response.data);
        alert(
          `Failed to create project: ${response.data.error || JSON.stringify(response.data)}`
        );
        return;
      }

      if (
        response.data?.success ||
        response.data?.id ||
        response.data?.data?.id
      ) {
        navigate("/campaigns/other-project");
      } else {
        console.error("API Response:", response.data);
        alert(
          `Failed to create project: ${JSON.stringify(response.data)}`
        );
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.name}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Real Estate Client
                </label>
                <FormControl fullWidth size="small">
                  <MuiSelect
                    value={configForm.builder_id}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        builder_id: e.target.value as string,
                      })
                    }
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  maxRows={6}
                  value={configForm.address}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, address: e.target.value })
                  }
                  placeholder="Enter address"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "auto !important",
                      padding: "2px !important",
                      display: "flex",
                    },
                    "& .MuiInputBase-input[aria-hidden='true']": {
                      flex: 0,
                      width: 0,
                      height: 0,
                      padding: "0 !important",
                      margin: 0,
                      display: "none",
                    },
                    "& .MuiInputBase-input": {
                      resize: "none !important",
                    },
                  }}
                />
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    maxRows={6}
                    value={configForm.about}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, about: e.target.value })
                    }
                    placeholder="Enter description"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "auto !important",
                        padding: "2px !important",
                        display: "flex",
                      },
                      "& .MuiInputBase-input[aria-hidden='true']": {
                        flex: 0,
                        width: 0,
                        height: 0,
                        padding: "0 !important",
                        margin: 0,
                        display: "none",
                      },
                      "& .MuiInputBase-input": {
                        resize: "none !important",
                      },
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    type="file"
                    InputLabelProps={{ shrink: true }}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Logo
                </label>
                <TextField
                  fullWidth
                  size="small"
                  type="file"
                  InputLabelProps={{ shrink: true }}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Reference Id
                </label>
                <TextField
                  fullWidth
                  size="small"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geo Location URL
                </label>
                <TextField
                  fullWidth
                  size="small"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reception Mobile - 1
                </label>
                <TextField
                  fullWidth
                  size="small"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reception Mobile - 2
                </label>
                <TextField
                  fullWidth
                  size="small"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.latitude}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, latitude: e.target.value })
                  }
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <TextField
                  fullWidth
                  size="small"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Link
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.videoLink}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, videoLink: e.target.value })
                  }
                  placeholder="Enter video URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Status
                </label>
                <FormControl fullWidth size="small">
                  <MuiSelect
                    value={configForm.projectStatus}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        projectStatus: e.target.value as string,
                      })
                    }
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "auto !important",
                    padding: "2px !important",
                    display: "flex",
                  },
                  "& .MuiInputBase-input[aria-hidden='true']": {
                    flex: 0,
                    width: 0,
                    height: 0,
                    padding: "0 !important",
                    margin: 0,
                    display: "none",
                  },
                  "& .MuiInputBase-input": {
                    resize: "none !important",
                  },
                }}
              />
            </div>

            {/* Row 9: Project Area and External Project ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Area
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.projectArea}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, projectArea: e.target.value })
                  }
                  placeholder="e.g., 2.5 Acres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  External Project ID
                </label>
                <TextField
                  fullWidth
                  size="small"
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
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <TextField
                        fullWidth
                        size="small"
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Description (Optional)"
                        value={amenity.description}
                        onChange={(e) => {
                          const newAm = [...amenities];
                          newAm[index].description = e.target.value;
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
                    setAmenities([...amenities, { name: "", description: "" }])
                  }
                  className="bg-orange-500 hover:bg-orange-600 text-white"
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
                    className="bg-red-500 hover:bg-red-600 text-white"
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <TextField
                        fullWidth
                        size="small"
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <TextField
                        fullWidth
                        size="small"
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
                  className="bg-orange-500 hover:bg-orange-600 text-white"
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
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Highlights */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Highlights
              </label>
              <div className="space-y-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., Swimming Pool"
                        value={highlight.name}
                        onChange={(e) => {
                          const newHL = [...highlights];
                          newHL[index].name = e.target.value;
                          setHighlights(newHL);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., Olympic size pool"
                        value={highlight.description}
                        onChange={(e) => {
                          const newHL = [...highlights];
                          newHL[index].description = e.target.value;
                          setHighlights(newHL);
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
                    setHighlights([
                      ...highlights,
                      { name: "", description: "" },
                    ])
                  }
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Add More
                </Button>
                {highlights.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => {
                      const newHL = [...highlights];
                      newHL.pop();
                      setHighlights(newHL);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Plans */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plans
              </label>
              <div className="space-y-4">
                {plans.map((plan, index) => (
                  <div key={index}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., Master Plan"
                      value={plan.name}
                      onChange={(e) => {
                        const newPlans = [...plans];
                        newPlans[index].name = e.target.value;
                        setPlans(newPlans);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() => setPlans([...plans, { name: "" }])}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Add More
                </Button>
                {plans.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => {
                      const newPlans = [...plans];
                      newPlans.pop();
                      setPlans(newPlans);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white"
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
                className="bg-[#10b981] hover:bg-[#059669] text-white px-8"
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
