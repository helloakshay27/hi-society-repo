import React, { useState, useEffect, useCallback } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getCampaignReferrals,
  CampaignReferral,
} from "@/services/campaignReferralService";
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

const CampaignsReferrals: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    createdBy: "",
    status: "",
    createdOn: "",
  });

  const [referralsData, setReferralsData] = useState<CampaignReferral[]>([]);

  // Fetch referrals from API
  const fetchReferrals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCampaignReferrals();
      setReferralsData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
      setError("Failed to load referrals. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}/${date.getFullYear()}`;
    } catch {
      return dateString;
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
      key: "id",
      label: "ID",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "ref_name",
      label: "Refer Name",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "project_name",
      label: "Project",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "ref_phone",
      label: "Mobile",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "client_email",
      label: "Client Email",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "created_at",
      label: "Created On",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
  ];

  const renderCell = (item: CampaignReferral, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center">
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() =>
                navigate(`/campaigns/referrals/detail/${item.id}`)
              }
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      case "id":
        return <span className="text-sm font-medium">#{item.id}</span>;
      case "ref_name":
        return <span className="text-sm">{item.ref_name || "-"}</span>;
      case "project_name":
        return <span className="text-sm">{item.project_name || "-"}</span>;
      case "ref_phone":
        return <span className="text-sm">{item.ref_phone || "-"}</span>;
      case "client_email":
        return <span className="text-sm">{item.client_email || "-"}</span>;
      case "status":
        return item.status ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            {item.status}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      case "created_at":
        return (
          <span className="text-sm">{formatDate(item.created_at)}</span>
        );
      default:
        return null;
    }
  };

  const filteredData = referralsData.filter((referral) => {
    const term = searchTerm.toLowerCase();
    return (
      (referral.ref_name || "").toLowerCase().includes(term) ||
      (referral.project_name || "").toLowerCase().includes(term) ||
      (referral.ref_phone || "").includes(searchTerm) ||
      (referral.client_email || "").toLowerCase().includes(term) ||
      String(referral.id).includes(searchTerm)
    );
  });

  const handleApplyFilters = () => {
    // Apply filter logic here - connect to API or filter local data
  };

  const handleResetFilters = () => {
    setFilters({ createdBy: "", status: "", createdOn: "" });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div>
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

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
            emptyMessage="No referrals available"
            searchPlaceholder="Search"
            enableExport={true}
            storageKey="campaigns-referrals-list-v2"
            onFilterClick={() => setShowFilters(!showFilters)}
            leftActions={
              <div className="flex items-center gap-2">
                <Button
                  className="bg-[#F2EEE9] hover:bg-[#E5DDD6] text-[#BF213E] px-8"
                  onClick={() => navigate("/campaigns/referrals/create")}
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
                      <MenuItem value="Hot">Hot</MenuItem>
                      <MenuItem value="Cold">Cold</MenuItem>
                      <MenuItem value="Warm">Warm</MenuItem>
                    </MuiSelect>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Created On"
                    type="date"
                    value={filters.createdOn}
                    onChange={(e) =>
                      setFilters({ ...filters, createdOn: e.target.value })
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

export default CampaignsReferrals;
