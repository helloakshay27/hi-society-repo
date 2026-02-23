import React, { useState, useEffect } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, RefreshCw, Settings2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getBaseUrl, getToken } from "@/utils/auth";
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

interface ProjectData {
  id: string;
  image: string;
  projectName: string;
  projectReferenceId: string;
  referralProgram: boolean;
  bannerStatus: boolean;
}

interface ReferralSetupApiResponse {
  code: number;
  referral_setups: {
    id: number;
    project_name: string;
    banner: string | null;
    society_id: number;
    project_reference_id: number | null;
    title: string | null;
    description: string | null;
    active: number;
    created_at: string;
    updated_at: string;
  }[];
}

interface ReferralSetupDetailApiResponse {
  id: number;
  project_name: string;
  banner: string | null;
  society_id: number;
  project_reference_id: number | null;
  active: number;
  created_at: string;
  updated_at: string;
}

const CampaignsReferralSetup: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    projectName: "",
    referralNumber: "",
    createdDate: "",
  });
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch referral setups from API
  useEffect(() => {
    const fetchReferralSetups = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get Hi-Society token from hiSocietyAccount
        const hiSocietyAccount = localStorage.getItem("hiSocietyAccount");
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("❌ Hi-Society token is missing!");
          throw new Error(
            "Hi-Society authentication token not found. Please login again."
          );
        }

        // Hardcode Hi-Society UAT base URL (same as Other Projects API)
        const hiSocietyBaseUrl = "https://uat-hi-society.lockated.com";
        const apiUrl = `${hiSocietyBaseUrl}/crm/admin/referral_setups.json`;
        console.log("🔍 Fetching from URL:", apiUrl);
        console.log("🔑 Using token:", token?.substring(0, 20) + "...");

        const response = await axios.get<ReferralSetupApiResponse>(apiUrl, {
          params: { token },
        });

        console.log("✅ API Response:", response.data);

        if (response.data.code === 200 && response.data.referral_setups) {
          // Map API response to component data structure
          const mappedData: ProjectData[] = response.data.referral_setups.map(
            (setup) => ({
              id: setup.id.toString(),
              image:
                setup.banner ||
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&h=100&fit=crop",
              projectName: setup.project_name || "-",
              projectReferenceId: setup.project_reference_id?.toString() || "-",
              referralProgram: setup.active === 1,
              bannerStatus: !!setup.banner,
            })
          );
          setProjectsData(mappedData);
        }
      } catch (err) {
        const error = err as Error;
        console.error("❌ Error fetching referral setups:", error);
        if (axios.isAxiosError(err)) {
          console.error("📍 Request URL:", err.config?.url);
          console.error("📍 Status:", err.response?.status);
          console.error("📍 Response:", err.response?.data);
          setError(
            `Request failed with status code ${err.response?.status}: ${err.response?.statusText || "Unknown error"}`
          );
        } else {
          setError(error.message || "Failed to fetch referral setups");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReferralSetups();
  }, []);

  // Function to fetch a single referral setup by ID
  const fetchReferralSetupDetail = async (id: number) => {
    try {
      const baseUrl = getBaseUrl();
      const token = getToken();

      if (!baseUrl) {
        throw new Error("Base URL not found. Please login again.");
      }

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const apiUrl = `${baseUrl}/crm/admin/referral_setups/${id}.json`;
      console.log("🔍 Fetching referral setup detail from URL:", apiUrl);
      console.log("🔑 Using token:", token?.substring(0, 20) + "...");

      const response = await axios.get<ReferralSetupDetailApiResponse>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Referral Setup Detail API Response:", response.data);

      return response.data;
    } catch (err) {
      const error = err as Error;
      console.error("❌ Error fetching referral setup detail:", error);
      if (axios.isAxiosError(err)) {
        console.error("📍 Request URL:", err.config?.url);
        console.error("📍 Status:", err.response?.status);
        console.error("📍 Response:", err.response?.data);
        throw new Error(
          `Request failed with status code ${err.response?.status}: ${err.response?.statusText || "Unknown error"}`
        );
      } else {
        throw new Error(
          error.message || "Failed to fetch referral setup detail"
        );
      }
    }
  };

  // Check for newly created referral setup from localStorage
  useEffect(() => {
    const newReferralSetup = localStorage.getItem("newReferralSetup");
    if (newReferralSetup) {
      try {
        const setupData = JSON.parse(newReferralSetup);
        setProjectsData((prev) => [setupData, ...prev]);
        localStorage.removeItem("newReferralSetup");
      } catch (error) {
        console.error("Failed to parse new referral setup:", error);
      }
    }

    // Check for updated referral setup
    const updatedReferralSetup = localStorage.getItem("updatedReferralSetup");
    if (updatedReferralSetup) {
      try {
        const setupData = JSON.parse(updatedReferralSetup);
        setProjectsData((prev) =>
          prev.map((project) =>
            project.id === setupData.id ? { ...project, ...setupData } : project
          )
        );
        localStorage.removeItem("updatedReferralSetup");
      } catch (error) {
        console.error("Failed to parse updated referral setup:", error);
      }
    }
  }, []);

  const handleToggleReferralProgram = (id: string) => {
    setProjectsData((prev) =>
      prev.map((project) =>
        project.id === id
          ? { ...project, referralProgram: !project.referralProgram }
          : project
      )
    );
  };

  const handleToggleBannerStatus = (id: string) => {
    setProjectsData((prev) =>
      prev.map((project) =>
        project.id === id
          ? { ...project, bannerStatus: !project.bannerStatus }
          : project
      )
    );
  };

  const columns: ColumnConfig[] = [
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      draggable: false,
      defaultVisible: true,
    },
    {
      key: "image",
      label: "Image",
      sortable: false,
      draggable: false,
      defaultVisible: true,
    },
    {
      key: "projectName",
      label: "Project Name",
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
      key: "referralProgram",
      label: "Referral Program",
      sortable: false,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "bannerStatus",
      label: "Banner Status",
      sortable: false,
      draggable: true,
      defaultVisible: true,
    },
  ];

  const renderCell = (item: ProjectData, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center">
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() =>
                navigate(`/campaigns/referral-setup/edit/${item.id}`)
              }
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      case "image":
        return (
          <div className="flex items-center justify-center">
            <img
              src={item.image}
              alt={item.projectName}
              className="w-20 h-14 object-cover rounded"
            />
          </div>
        );
      case "projectName":
        return <span className="text-sm">{item.projectName}</span>;
      case "projectReferenceId":
        return <span className="text-sm">{item.projectReferenceId}</span>;
      case "referralProgram":
        return (
          <div className="flex items-center justify-center">
            <Switch
              checked={item.referralProgram}
              onCheckedChange={() => handleToggleReferralProgram(item.id)}
              className={
                item.referralProgram
                  ? "data-[state=checked]:bg-green-500"
                  : "data-[state=unchecked]:bg-red-500"
              }
            />
          </div>
        );
      case "bannerStatus":
        return (
          <div className="flex items-center justify-center">
            <Switch
              checked={item.bannerStatus}
              onCheckedChange={() => handleToggleBannerStatus(item.id)}
              className={
                item.bannerStatus
                  ? "data-[state=checked]:bg-green-500"
                  : "data-[state=unchecked]:bg-red-500"
              }
            />
          </div>
        );
      default:
        return <span className="text-sm">{item[columnKey]}</span>;
    }
  };

  const filteredData = projectsData.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.projectReferenceId
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleApplyFilters = () => {
    // Apply filter logic here - connect to API or filter local data
  };

  const handleResetFilters = () => {
    setFilters({ projectName: "", referralNumber: "", createdDate: "" });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div>
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div>
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
              emptyMessage="No projects available"
              searchPlaceholder="Search"
              enableExport={true}
              storageKey="campaigns-referral-setup-table"
              onFilterClick={() => setShowFilters(!showFilters)}
              leftActions={
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-8"
                    onClick={() => navigate("/campaigns/referral-setup/create")}
                  >
                    Add
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
                    <InputLabel id="project-name-label" shrink>
                      Project Name
                    </InputLabel>
                    <MuiSelect
                      labelId="project-name-label"
                      value={filters.projectName}
                      label="Project Name"
                      onChange={(e) =>
                        setFilters({ ...filters, projectName: e.target.value })
                      }
                      displayEmpty
                      notched
                    >
                      <MenuItem value="">Select Project Name</MenuItem>
                      <MenuItem value="godrej">Godrej City</MenuItem>
                      <MenuItem value="romanjee">
                        Romanjee-Igatput-V-95xx
                      </MenuItem>
                      <MenuItem value="godrej living">Godrej Living</MenuItem>
                    </MuiSelect>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Referral Number"
                    type="text"
                    placeholder="Enter Referral Number"
                    value={filters.referralNumber}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        referralNumber: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />

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
    </div>
  );
};

export default CampaignsReferralSetup;
