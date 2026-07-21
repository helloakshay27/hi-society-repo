import React, { useState, useEffect, useCallback } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, RefreshCw, Settings2, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getReferralSetups, updateReferralSetup, ReferralSetup, deleteReferralSetup } from "@/services/referralService";
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
  CircularProgress,
} from "@mui/material";
import { X } from "lucide-react";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

const CampaignsReferralSetup: React.FC = () => {
  const navigate = useNavigate();
  const { shouldShow } = useDynamicPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    projectName: "",
    referralNumber: "",
    createdDate: "",
  });

  const [projectsData, setProjectsData] = useState<ReferralSetup[]>([]);

  // Fetch referral setups from API
  const fetchReferralSetups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getReferralSetups();
      setProjectsData(response.referral_setups || []);
    } catch (err) {
      console.error("Failed to fetch referral setups:", err);
      setError("Failed to load referral setups. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralSetups();
  }, [fetchReferralSetups]);

  const handleToggleReferralProgram = async (id: number, currentValue: boolean) => {
    const item = projectsData.find((p) => p.id === id);
    if (!item) return;

    const newValue = !currentValue;

    // Optimistic update
    setProjectsData((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, is_referral: newValue } : project
      )
    );

    try {
      const updated = await updateReferralSetup(id, {
        society_banner: {
          project_name: item.project_name,
          project_reference_id: parseInt(item.project_reference_id || "0", 10),
          active: item.active === 1 ? "on" : "off",
          is_referral: newValue ? "on" : "off",
        },
      });
      // Sync with actual server response
      setProjectsData((prev) =>
        prev.map((project) => (project.id === id ? { ...project, ...updated } : project))
      );
    } catch (err) {
      console.error("Failed to update referral program status:", err);
      // Rollback
      setProjectsData((prev) =>
        prev.map((project) =>
          project.id === id ? { ...project, is_referral: currentValue } : project
        )
      );
      toast.error("Failed to update referral program status");
    }
  };

  const handleToggleBannerStatus = async (id: number, currentValue: boolean) => {
    const item = projectsData.find((p) => p.id === id);
    if (!item) return;

    const newActive = currentValue ? 0 : 1;

    // Optimistic update
    setProjectsData((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, active: newActive } : project
      )
    );

    try {
      const updated = await updateReferralSetup(id, {
        society_banner: {
          project_name: item.project_name,
          project_reference_id: parseInt(item.project_reference_id || "0", 10),
          active: newActive === 1 ? "on" : "off",
          is_referral: item.is_referral ? "on" : "off",
        },
      });
      // Sync with actual server response
      setProjectsData((prev) =>
        prev.map((project) => (project.id === id ? { ...project, ...updated } : project))
      );
    } catch (err) {
      console.error("Failed to update banner status:", err);
      // Rollback
      setProjectsData((prev) =>
        prev.map((project) =>
          project.id === id ? { ...project, active: currentValue ? 1 : 0 } : project
        )
      );
      toast.error("Failed to update banner status");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this referral setup?")) {
      try {
        await deleteReferralSetup(id);
        setProjectsData((prev) => prev.filter((project) => project.id !== id));
      } catch (err) {
        console.error("Failed to delete referral setup:", err);
        alert("Failed to delete referral setup. Please try again.");
      }
    }
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
      key: "banner",
      label: "Image",
      sortable: false,
      draggable: false,
      defaultVisible: true,
    },
    {
      key: "project_name",
      label: "Project Name",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "project_reference_id",
      label: "Project Reference Id",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "active",
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

  const renderCell = (item: ReferralSetup, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() =>
                navigate(`/campaigns/referral-setup/edit/${item.id}`)
              }
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            {/* <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => handleDelete(item.id)}
            >
              <X className="w-4 h-4 text-red-500" />
            </button> */}
          </div>
        );
      case "banner":
        return (
          <div
            className="flex items-center justify-center"
            style={{
              width: 80,
              height: 56,
              minWidth: 80,
              minHeight: 56,
              background: "#f3f4f6",
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.banner_url || item.banner ? (
              <img
                src={item.banner_url || item.banner || ""}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                draggable={false}
                onError={e => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
          </div>
        );
      case "project_name":
        return (
          <span className="text-sm" style={{ display: "block", minHeight: 24 }}>
            {item.project_name}
          </span>
        );
      case "project_reference_id":
        return <span className="text-sm">{item.project_reference_id || "-"}</span>;
      case "active":
        return (
          <div className="flex items-center justify-center">
            <Switch
              checked={!!item.is_referral}
              onCheckedChange={() => handleToggleReferralProgram(item.id, !!item.is_referral)}
              className={
                item.is_referral
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
              checked={item.active === 1}
              onCheckedChange={() => handleToggleBannerStatus(item.id, item.active === 1)}
              className={
                item.active === 1
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
      project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_reference_id?.toLowerCase().includes(searchTerm.toLowerCase())
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
                {shouldShow("Referral Setup","create")&&(
                <Button
                  className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => navigate("/campaigns/referral-setup/create")}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>)}
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
                    className="flex-1 bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleResetFilters}
                  >
                    Reset
                  </Button>
                  <Button
                    className="flex-1 bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
