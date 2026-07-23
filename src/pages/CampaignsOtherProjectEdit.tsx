import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
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

interface BuilderProjectDetail {
  id: number;
  builder_id: number;
  name: string;
  address: string;
  about: string;
  active: number;
  geo_link?: string;
  reception_number?: string;
  reception_second_number?: string;
  project_reference_id?: string;
  latitude?: string | number;
  longitude?: string | number;
  video_link?: string;
  project_status?: string;
  description?: string;
  project_area?: string;
  external_project_id?: string;
  configurations?: Array<{ id?: number; name: string; description?: string }>;
  highlights?: Array<{ id?: number; name: string; description?: string }>;
  plans?: Array<{ id?: number; name: string }>;
  amenities?: Array<{ id?: number; name: string; description?: string }>;
}

interface BuilderProjectDetailResponse {
  success: boolean;
  data: BuilderProjectDetail;
}

const getBuilderProjectUrl = (id: string, token: string) => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("API base URL is not configured.");
  }
  return `${baseUrl}/builder_projects/${id}.json?token=${token}`;
};

const selectMenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300,
      backgroundColor: "white",
    },
  },
};

const CampaignsOtherProjectEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [estateBuilders, setEstateBuilders] = useState<EstateBuilder[]>([]);
  const [isLoadingBuilders, setIsLoadingBuilders] = useState(false);

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

  useEffect(() => {
    if (!projectId) {
      console.warn("No projectId provided");
      return;
    }

    console.warn("Fetching project with ID:", projectId);

    const fetchProject = async () => {
      try {
        setIsLoadingProject(true);
        const token = JSON.parse(
          localStorage.getItem("user") || "{}"
        )?.spree_api_key;
        
        if (!token) {
          console.error("No token found in localStorage");
          alert("Authentication token not found. Please log in again.");
          navigate("/campaigns/other-project");
          return;
        }

        const url = getBuilderProjectUrl(projectId, token);
        console.warn("Fetching from URL:", url);
        
        const response = await axios.get<BuilderProjectDetailResponse>(url);
        
        console.warn("API Response:", response.data);
        
        const project = response.data?.data;
        if (!response.data?.success || !project) {
          console.error("Invalid response format:", response.data);
          throw new Error("Failed to fetch project details");
        }

        console.warn("Setting form with project data:", project);
        
        setConfigForm({
          name: project.name || "",
          address: project.address || "",
          about: project.about || "",
          coverImage: null,
          projectLogo: null,
          showOnOtherProject: project.active === 1,
          projectReferenceId: project.project_reference_id || "",
          geoLocationURL: project.geo_link || "",
          receptionMobile1: project.reception_number || "",
          receptionMobile2: project.reception_second_number || "",
          latitude: project.latitude?.toString() || "",
          longitude: project.longitude?.toString() || "",
          builder_id: project.builder_id?.toString() || "",
          videoLink: project.video_link || "",
          projectStatus: project.project_status || "",
          description: project.description || "",
          projectArea: project.project_area || "",
          externalProjectId: project.external_project_id || "",
        });
        setAmenities(
          project.amenities?.length
            ? project.amenities.map((item) => ({
                id: item.id,
                name: item.name || "",
                description: item.description || "",
              }))
            : [{ name: "", description: "" }]
        );
        setConfigurations(
          project.configurations?.length
            ? project.configurations.map((item) => ({
                id: item.id,
                name: item.name || "",
                description: item.description || "",
              }))
            : [{ name: "", description: "" }]
        );
        setHighlights(
          project.highlights?.length
            ? project.highlights.map((item) => ({
                id: item.id,
                name: item.name || "",
                description: item.description || "",
              }))
            : [{ name: "", description: "" }]
        );
        setPlans(
          project.plans?.length
            ? project.plans.map((item) => ({
                id: item.id,
                name: item.name || "",
              }))
            : [{ name: "" }]
        );
      } catch (error: unknown) {
        console.error("Error fetching project details:", error);
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosErr = error as { response?: { status?: number; data?: unknown } };
          console.error("API Error Status:", axiosErr.response?.status);
          console.error("API Error Data:", axiosErr.response?.data);
        }
        alert("Failed to load project details.");
        navigate("/campaigns/other-project");
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [navigate, projectId]);

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

  interface ListItem {
    id?: number;
    name: string;
    description?: string;
  }
  const [configurations, setConfigurations] = useState<ListItem[]>([
    { name: "", description: "" },
  ]);
  const [highlights, setHighlights] = useState<ListItem[]>([{ name: "", description: "" }]);
  const [plans, setPlans] = useState<ListItem[]>([{ name: "" }]);
  const [amenities, setAmenities] = useState<ListItem[]>([{ name: "", description: "" }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      alert("Project ID is required");
      return;
    }

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

      if (configForm.builder_id) {
        formData.append("builder_project[builder_id]", configForm.builder_id);
      }

      amenities.forEach((item, i) => {
        if (item.name) {
          if (item.id) {
            formData.append(
              `builder_project[amenities_attributes][${i}][id]`,
              item.id.toString()
            );
          }
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
          if (item.id) {
            formData.append(
              `builder_project[configurations_attributes][${i}][id]`,
              item.id.toString()
            );
          }
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
          if (item.id) {
            formData.append(
              `builder_project[highlights_attributes][${i}][id]`,
              item.id.toString()
            );
          }
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
          if (item.id) {
            formData.append(
              `builder_project[plans_attributes][${i}][id]`,
              item.id.toString()
            );
          }
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

      const response = await axios.put(
        getBuilderProjectUrl(projectId, token),
        formData
      );

      // Check if response contains error data
      if (response.data?.code === 401 || response.data?.error) {
        console.error("API Error Response:", response.data);
        alert(
          `Failed to update project: ${response.data.error || JSON.stringify(response.data)}`
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
          `Failed to update project: ${JSON.stringify(response.data)}`
        );
      }
    } catch (error: unknown) {
      console.error("Error updating project:", error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { status?: number; data?: unknown } };
        if (axiosErr.response?.status === 422) {
          console.error("422 Error details:", axiosErr.response.data);
          alert(`Validation failed: ${JSON.stringify(axiosErr.response.data)}`);
        } else if (axiosErr.response?.status === 401) {
          alert("Authentication failed. Please log in again.");
        } else {
          alert(
            (axiosErr.response?.data as { message?: string })?.message ||
              `An error occurred: ${JSON.stringify(axiosErr.response?.data)}`
          );
        }
      } else {
        alert("An unexpected error occurred");
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
          Edit Project
        </h1>
      </div>

      {/* Loading Indicator */}
      {isLoadingProject && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Loading project details...</p>
          </div>
        </div>
      )}

      {/* Form */}
      {!isLoadingProject && (
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
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
                  className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isLoading || isLoadingProject}
                className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Updating..." : "Update"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading || isLoadingProject}
                onClick={() => navigate("/campaigns/other-project")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
        </div>
      )}
    </div>
  );
};

export default CampaignsOtherProjectEdit;
