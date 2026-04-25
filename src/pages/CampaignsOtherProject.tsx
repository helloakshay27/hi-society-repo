import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Button } from "@/components/ui/button";
import { Eye, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  TextField,
  createTheme,
  ThemeProvider,
  IconButton,
  Typography,
  Box,
  MenuItem,
  Select as MuiSelect,
  FormControl,
  InputLabel,
} from "@mui/material";
import { X } from "lucide-react";
import axios from "axios";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";

interface OtherProjectData {
  id: string;
  project: string;
  projectReferenceId: string;
  address: string;
  geoLocation: string;
  receptionMobile1: string;
  receptionMobile2: string;
  active: boolean;
}

interface BuilderProjectApiResponse {
  success: boolean;
  builder_projects: {
    id: number;
    name: string;
    project_reference_id?: string;
    address?: string;
    geo_location?: string;
    reception_mobile_1?: string;
    reception_mobile_2?: string;
    active?: boolean;
    [key: string]: any;
  }[];
  count: number;
}

interface BuilderProjectDetailApiResponse {
  success: boolean;
  data: {
    id: number;
    builder_id: number;
    name: string;
    address: string;
    about: string;
    video_link: string;
    active: number;
    society_id: number;
    geo_link: string;
    reception_number: string;
    reception_second_number: string;
    project_reference_id: string;
    project_status: string | null;
    description: string | null;
    project_area: string | null;
    external_project_id: string | null;
    created_at: string;
    updated_at: string;
    builder: {
      id: number;
      name: string;
    };
    society: {
      id: number;
      building_name: string;
      address1: string;
      city: string;
      state: string;
      postcode: number;
      name: string;
    };
    flat_types: Array<{
      id: number;
      name: string;
      description: string | null;
    }>;
    society_blocks: Array<{
      id: number;
      name: string;
      active: number;
    }>;
    project_lead_sources: Array<{
      id: number;
      name: string;
    }>;
    images: {
      project_image: Array<{
        id: number;
        active: number;
        url: string;
      }>;
      project_logo: Array<{
        id: number;
        active: number;
        url: string;
      }>;
      gallery: Array<{
        id: number;
        active: number;
        url?: string;
      }>;
    };
    configurations: any[];
    highlights: any[];
    plans: any[];
    amenities: Array<{
      id: number;
      name: string;
      description: string | null;
    }>;
  };
}

interface SocietyBlockApiResponse {
  id: number;
  name: string;
  description: string;
  status: number;
  active: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  society_id: number;
  project_id: number;
  min_floor: number | null;
  max_floor: number | null;
}

interface CreateSocietyBlockPayload {
  name: string;
  description?: string;
  society_id: number;
  project_id: number;
  status?: number;
  active?: number;
  min_floor?: number;
  max_floor?: number;
}

interface ProjectDropdownApiResponse {
  builder_projects: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
}

const CampaignsOtherProject: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    project: "",
    status: "",
    createdDate: "",
  });

  const [projectsData, setProjectsData] = useState<OtherProjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<BuilderProjectDetailApiResponse["data"] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch builder projects from API
  useEffect(() => {
    const fetchBuilderProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = `${API_CONFIG.BASE_URL}/crm/builder_projects.json`;

        const response = await axios.get<BuilderProjectApiResponse>(apiUrl, {
          headers: { Authorization: getAuthHeader() },
        });

        if (response.data.success && response.data.builder_projects) {
          // Map API response to component data structure
          const mappedData: OtherProjectData[] =
            response.data.builder_projects.map((project) => ({
              id: project.id.toString(),
              project: project.name || "-",
              projectReferenceId: project.project_reference_id || "-",
              address: project.address || "-",
              geoLocation: project.geo_location || "-",
              receptionMobile1: project.reception_mobile_1 || "-",
              receptionMobile2: project.reception_mobile_2 || "-",
              active: project.active ?? false,
            }));
          setProjectsData(mappedData);
        }
      } catch (err) {
        const error = err as Error;
        console.error("❌ Error fetching builder projects:", error);
        if (axios.isAxiosError(err)) {
          console.error("📍 Full Request URL:", err.config?.url);
          console.error("📍 Request Params:", err.config?.params);
          console.error("📍 Status:", err.response?.status);
          console.error("📍 Response:", err.response?.data);
          setError(
            `Request failed with status code ${err.response?.status}: ${err.response?.statusText || "Unknown error"}. URL: ${err.config?.url}`
          );
        } else {
          setError(error.message || "Failed to fetch builder projects");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBuilderProjects();
  }, []);

  // Function to fetch a single builder project by ID
  const fetchBuilderProjectDetail = async (id: number) => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/crm/builder_projects/${id}.json`;

      const response = await axios.get<BuilderProjectDetailApiResponse>(
        apiUrl,
        { headers: { Authorization: getAuthHeader() } }
      );

      return response.data;
    } catch (err) {
      const error = err as Error;
      if (axios.isAxiosError(err)) {
        throw new Error(
          `Request failed with status code ${err.response?.status}: ${err.response?.statusText || "Unknown error"}`
        );
      } else {
        throw new Error(error.message || "Failed to fetch builder project detail");
      }
    }
  };

  // Function to create a new society block/tower (POST API)
  // Example usage:
  // const newBlock = await createSocietyBlock({
  //   name: "Tower A",
  //   description: "Residential tower with 12 floors",
  //   society_id: 3492,
  //   project_id: 30,
  //   status: 0,
  //   active: 1,
  //   min_floor: 1,
  //   max_floor: 12
  // });
  const createSocietyBlock = async (payload: CreateSocietyBlockPayload) => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/crm/admin/society_blocks.json`;

      const response = await axios.post<SocietyBlockApiResponse>(
        apiUrl,
        payload,
        {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (err) {
      const error = err as Error;
      console.error("❌ Error creating society block:", error);
      if (axios.isAxiosError(err)) {
        throw new Error(
          `Request failed with status code ${err.response?.status}: ${err.response?.statusText || "Unknown error"}`
        );
      } else {
        throw new Error(error.message || "Failed to create society block");
      }
    }
  };

  // Function to fetch project dropdown list (GET API)
  const fetchDropdownProjects = async () => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/crm/builder_projects/dropdown_projects.json`;

      const response = await axios.get<ProjectDropdownApiResponse>(apiUrl, {
        headers: { Authorization: getAuthHeader() },
      });

      return response.data;
    } catch (err) {
      const error = err as Error;
      console.error("❌ Error fetching dropdown projects:", error);
      if (axios.isAxiosError(err)) {
        throw new Error(
          `Request failed with status code ${err.response?.status}: ${err.response?.statusText || "Unknown error"}`
        );
      } else {
        throw new Error(error.message || "Failed to fetch dropdown projects");
      }
    }
  };

  // Check for newly created project from localStorage
  useEffect(() => {
    const newProject = localStorage.getItem("newOtherProject");
    if (newProject) {
      try {
        const projectData = JSON.parse(newProject);
        setProjectsData((prev) => [projectData, ...prev]);
        localStorage.removeItem("newOtherProject");
      } catch (error) {
        console.error("Failed to parse new project:", error);
      }
    }
  }, []);

  const columns: ColumnConfig[] = [
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      draggable: false,
      defaultVisible: true,
    },
    {
      key: "project",
      label: "Project",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "projectReferenceId",
      label: "Project Reference Id",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "address",
      label: "Address",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "geoLocation",
      label: "Geo Location",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "receptionMobile1",
      label: "Reception Mobile 1",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "receptionMobile2",
      label: "Reception Mobile 2",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "active",
      label: "Active",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
  ];

  const renderCell = (item: OtherProjectData, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center">
            <button
              className="p-1 hover:bg-gray-100 rounded"
              disabled={detailLoading}
              onClick={async () => {
                try {
                  setDetailLoading(true);
                  const res = await fetchBuilderProjectDetail(parseInt(item.id));
                  if (res.success && res.data) {
                    setSelectedProject(res.data);
                    setShowDetailDialog(true);
                  }
                } catch (error) {
                  console.error("Failed to fetch project detail:", error);
                } finally {
                  setDetailLoading(false);
                }
              }}
            >
              <Eye className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        );
      case "project":
        return <span className="text-sm">{item.project}</span>;
      case "projectReferenceId":
        return <span className="text-sm">{item.projectReferenceId}</span>;
      case "address":
        return <span className="text-sm">{item.address}</span>;
      case "geoLocation":
        return <span className="text-sm">{item.geoLocation}</span>;
      case "receptionMobile1":
        return <span className="text-sm">{item.receptionMobile1}</span>;
      case "receptionMobile2":
        return <span className="text-sm">{item.receptionMobile2}</span>;
      case "active":
        return <span className="text-sm">{item.active ? "Yes" : "No"}</span>;
      default:
        return null;
    }
  };

  const filteredData = projectsData.filter(
    (project) =>
      project.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.projectReferenceId
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      project.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.geoLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.receptionMobile1.includes(searchTerm) ||
      project.receptionMobile2.includes(searchTerm)
  );

  const handleApplyFilters = () => {
    // Apply filter logic here - connect to API or filter local data
  };

  const handleResetFilters = () => {
    setFilters({ project: "", status: "", createdDate: "" });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div>
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6]"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div>
            <EnhancedTable
              data={filteredData}
              columns={columns}
              renderCell={renderCell}
              pagination={true}
              pageSize={10}
              hideTableSearch={false}
              hideTableExport={false}
              hideColumnsButton={false}
              emptyMessage="No Matching Records Found"
              searchPlaceholder="Search"
              enableExport={true}
              storageKey="campaigns-other-project-v1"
              onFilterClick={() => setShowFilters(!showFilters)}
              leftActions={
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-[#14b8a6] hover:bg-[#0d9488] text-white px-6"
                    onClick={() =>
                      navigate("/campaigns/other-project/configure")
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Configure Project
                  </Button>
                </div>
              }
            />
          </div>
        )}
      </div>

      {/* Filter Dialog */}
      <ThemeProvider
        theme={createTheme({
          palette: { primary: { main: "#C72030" } },
          components: {
            MuiTextField: {
              styleOverrides: {
                root: {
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": { borderColor: "#E0E0E0" },
                    "&:hover fieldset": { borderColor: "#1A1A1A" },
                    "&.Mui-focused fieldset": { borderColor: "#C72030" },
                  },
                },
              },
            },
            MuiSelect: {
              styleOverrides: {
                root: {
                  borderRadius: "6px",
                  backgroundColor: "#FFFFFF",
                  height: "45px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#E0E0E0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1A1A1A",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#C72030",
                  },
                },
              },
            },
            MuiInputLabel: {
              styleOverrides: {
                root: {
                  color: "#1A1A1A",
                  fontWeight: 500,
                  fontSize: "14px",
                  "&.Mui-focused": { color: "#C72030" },
                },
              },
            },
          },
        })}
      >
        <Dialog
          open={showFilters}
          onClose={() => setShowFilters(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ style: { borderRadius: "8px" } }}
        >
          <DialogContent sx={{ p: 4 }}>
            <Box>
              <div className="flex flex-row items-center justify-between space-y-0 pb-6">
                <Typography variant="h6" fontWeight="600">
                  FILTER BY
                </Typography>
                <IconButton
                  aria-label="close"
                  onClick={() => setShowFilters(false)}
                  sx={{ color: (theme) => theme.palette.grey[500], p: 0 }}
                >
                  <X size={20} />
                </IconButton>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <FormControl fullWidth size="small">
                    <InputLabel id="project-label" shrink>
                      Project
                    </InputLabel>
                    <MuiSelect
                      labelId="project-label"
                      value={filters.project}
                      label="Project"
                      onChange={(e) =>
                        setFilters({ ...filters, project: e.target.value })
                      }
                      displayEmpty
                      notched
                    >
                      <MenuItem value="">Select Project</MenuItem>
                      <MenuItem value="project1">Project 1</MenuItem>
                      <MenuItem value="project2">Project 2</MenuItem>
                      <MenuItem value="project3">Project 3</MenuItem>
                    </MuiSelect>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="status-label" shrink>
                      Status
                    </InputLabel>
                    <MuiSelect
                      labelId="status-label"
                      value={filters.status}
                      label="Status"
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                      displayEmpty
                      notched
                    >
                      <MenuItem value="">Select Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </MuiSelect>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Created Date"
                    type="date"
                    value={filters.createdDate}
                    onChange={(e) =>
                      setFilters({ ...filters, createdDate: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleResetFilters}
                  >
                    Reset
                  </Button>
                  <Button
                    className="flex-1 bg-[#8B4B8C] hover:bg-[#7A3F7B] text-white"
                    onClick={handleApplyFilters}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </Box>
          </DialogContent>
        </Dialog>
      </ThemeProvider>

      {/* Project Detail Dialog */}
      {showDetailDialog && selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDetailDialog(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedProject.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Project Reference: {selectedProject.project_reference_id}</p>
              </div>
              <button
                className="p-2 hover:bg-gray-100 rounded-full"
                onClick={() => setShowDetailDialog(false)}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Info */}
              <div>
                <h3 className="text-sm font-semibold text-[#C72030] uppercase tracking-wide mb-3">Project Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{selectedProject.address || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedProject.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {selectedProject.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reception Number</p>
                    <p className="text-sm text-gray-800">{selectedProject.reception_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reception (2nd)</p>
                    <p className="text-sm text-gray-800">{selectedProject.reception_second_number || "-"}</p>
                  </div>
                  {selectedProject.geo_link && (
                    <div>
                      <p className="text-xs text-gray-500">Geo Location</p>
                      <a href={selectedProject.geo_link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline break-all">{selectedProject.geo_link}</a>
                    </div>
                  )}
                  {selectedProject.project_area && (
                    <div>
                      <p className="text-xs text-gray-500">Project Area</p>
                      <p className="text-sm text-gray-800">{selectedProject.project_area}</p>
                    </div>
                  )}
                </div>
                {selectedProject.about && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">About</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedProject.about}</p>
                  </div>
                )}
              </div>

              {/* Builder & Society */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[#C72030] uppercase tracking-wide mb-2">Builder</h3>
                  <p className="text-sm font-medium text-gray-800">{selectedProject.builder?.name || "-"}</p>
                  <p className="text-xs text-gray-500">ID: {selectedProject.builder?.id}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[#C72030] uppercase tracking-wide mb-2">Society</h3>
                  <p className="text-sm font-medium text-gray-800">{selectedProject.society?.name || "-"}</p>
                  <p className="text-xs text-gray-500">{selectedProject.society?.building_name}</p>
                  <p className="text-xs text-gray-500">{[selectedProject.society?.city, selectedProject.society?.state, selectedProject.society?.postcode].filter(Boolean).join(", ")}</p>
                </div>
              </div>

              {/* Flat Types */}
              {selectedProject.flat_types?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#C72030] uppercase tracking-wide mb-3">Flat Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.flat_types.map((ft) => (
                      <span key={ft.id} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                        {ft.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Society Blocks */}
              {selectedProject.society_blocks?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#C72030] uppercase tracking-wide mb-3">Society Blocks / Towers</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.society_blocks.map((block) => (
                      <span key={block.id} className={`px-3 py-1 text-xs rounded-full border ${block.active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        Block {block.name} {block.active ? "" : "(Inactive)"}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {selectedProject.amenities?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#C72030] uppercase tracking-wide mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedProject.amenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C72030] flex-shrink-0" />
                        <span className="text-sm text-gray-700">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lead Sources */}
              {selectedProject.project_lead_sources?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#C72030] uppercase tracking-wide mb-3">Lead Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.project_lead_sources.map((src) => (
                      <span key={src.id} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                        {src.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {selectedProject.images?.project_image?.filter((img) => img.active && img.url)?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#C72030] uppercase tracking-wide mb-3">Project Images</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedProject.images.project_image
                      .filter((img) => img.active && img.url)
                      .map((img) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt="Project"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {selectedProject.images?.gallery?.filter((img) => img.active && img.url)?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#C72030] uppercase tracking-wide mb-3">Gallery</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedProject.images.gallery
                      .filter((img) => img.active && img.url)
                      .map((img) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt="Gallery"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsOtherProject;
