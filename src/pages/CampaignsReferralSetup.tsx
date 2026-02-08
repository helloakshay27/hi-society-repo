import React, { useState, useEffect } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, RefreshCw, Settings2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

const CampaignsReferralSetup: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    projectName: "",
    referralNumber: "",
    createdDate: "",
  });

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

  const [projectsData, setProjectsData] = useState<ProjectData[]>([
    {
      id: "1",
      image:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&h=100&fit=crop",
      projectName: "Romanjee-Igatput-V-95xx",
      projectReferenceId: "333",
      referralProgram: false,
      bannerStatus: false,
    },
    {
      id: "2",
      image:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=150&h=100&fit=crop",
      projectName: "Godrej",
      projectReferenceId: "3712",
      referralProgram: true,
      bannerStatus: false,
    },
    {
      id: "3",
      image:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=150&h=100&fit=crop",
      projectName: "Godrej Living",
      projectReferenceId: "3712",
      referralProgram: true,
      bannerStatus: true,
    },
    {
      id: "4",
      image:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=150&h=100&fit=crop",
      projectName: "Godrej Living",
      projectReferenceId: "3712",
      referralProgram: true,
      bannerStatus: false,
    },
    {
      id: "5",
      image:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=150&h=100&fit=crop",
      projectName: "Godrej Living",
      projectReferenceId: "3712",
      referralProgram: true,
      bannerStatus: true,
    },
    {
      id: "6",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150&h=100&fit=crop",
      projectName: "Godrej Living",
      projectReferenceId: "3712",
      referralProgram: true,
      bannerStatus: true,
    },
    {
      id: "7",
      image:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=150&h=100&fit=crop",
      projectName: "Renwil-Highlands-Glodrej Ciry",
      projectReferenceId: "Renwil-Highlands-Glodrej Ciry",
      referralProgram: false,
      bannerStatus: false,
    },
    {
      id: "8",
      image:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=150&h=100&fit=crop",
      projectName: "RNS",
      projectReferenceId: "RNS Studio",
      referralProgram: true,
      bannerStatus: true,
    },
    {
      id: "9",
      image:
        "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=150&h=100&fit=crop",
      projectName: "Godrej Living",
      projectReferenceId: "3712",
      referralProgram: false,
      bannerStatus: false,
    },
    {
      id: "10",
      image:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=150&h=100&fit=crop",
      projectName: "Godrej Living",
      projectReferenceId: "3712",
      referralProgram: true,
      bannerStatus: true,
    },
    {
      id: "11",
      image:
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=150&h=100&fit=crop",
      projectName: "Godrej Living",
      projectReferenceId: "3712",
      referralProgram: true,
      bannerStatus: false,
    },
    {
      id: "12",
      image:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=150&h=100&fit=crop",
      projectName: "Godrej Living",
      projectReferenceId: "3712",
      referralProgram: true,
      bannerStatus: false,
    },
  ]);

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
        return null;
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
