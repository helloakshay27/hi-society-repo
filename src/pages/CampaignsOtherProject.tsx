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

const CampaignsOtherProject: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    project: "",
    status: "",
    createdDate: "",
  });

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

  const [projectsData, setProjectsData] = useState<OtherProjectData[]>([
    // Sample data - currently empty to show "No Matching Records Found"
  ]);

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
            <button className="p-1 hover:bg-gray-100 rounded">
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
        {/* Table */}
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
                  onClick={() => navigate("/campaigns/other-project/configure")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Configure Project
                </Button>
              </div>
            }
          />
        </div>
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
    </div>
  );
};

export default CampaignsOtherProject;
