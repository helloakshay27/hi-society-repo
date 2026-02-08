import React, { useState, useEffect } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw, Settings2 } from "lucide-react";
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

interface ReferralData {
  id: string;
  displayId: string;
  createdBy: string;
  uniqueId: string;
  project: string;
  lead: string;
  mobile: string;
  status: string;
  createdOn: string;
}

const CampaignsReferrals: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    createdBy: "",
    status: "",
    createdOn: "",
  });

  // Check for newly created referral from localStorage
  useEffect(() => {
    const newReferral = localStorage.getItem("newReferral");
    if (newReferral) {
      try {
        const referralData = JSON.parse(newReferral);
        setReferralsData((prev) => [referralData, ...prev]);
        localStorage.removeItem("newReferral");
      } catch (error) {
        console.error("Failed to parse new referral:", error);
      }
    }
  }, []);
  const [referralsData, setReferralsData] = useState<ReferralData[]>([
    {
      id: "1",
      displayId: "#1553",
      createdBy: "Deepak Gupta",
      uniqueId: "H3IT1baa",
      project: "GODREJ CITY",
      lead: "Deepak Gupta",
      mobile: "7021401252",
      status: "ACT",
      createdOn: "29/03/2025",
    },
    {
      id: "2",
      displayId: "#1642",
      createdBy: "Godrej Living",
      uniqueId: "5cV4bbaa",
      project: "GODREJ RKS",
      lead: "Godrej Living",
      mobile: "2217695214",
      status: "",
      createdOn: "05/03/2025",
    },
    {
      id: "3",
      displayId: "#1399",
      createdBy: "Rahul Rasal",
      uniqueId: "1rJ5heaf",
      project: "GODREJ HILL RK IRRAT",
      lead: "Rahul Rasal",
      mobile: "9870801292",
      status: "ACT",
      createdOn: "11/05/2025",
    },
    {
      id: "4",
      displayId: "#1289",
      createdBy: "Samay Seth",
      uniqueId: "CJ2acZ70",
      project: "GODREJ HILL RETIRAT",
      lead: "Samay Seth",
      mobile: "8770950325",
      status: "",
      createdOn: "14/08/2023",
    },
    {
      id: "5",
      displayId: "#1218",
      createdBy: "Godrej Living",
      uniqueId: "5cV4bbaa",
      project: "GODREJ CITY",
      lead: "Godrej Living",
      mobile: "2217695214",
      status: "",
      createdOn: "03/02/2023",
    },
    {
      id: "6",
      displayId: "#1272",
      createdBy: "Deepak Gupta",
      uniqueId: "H3IT1baa",
      project: "GODREJ RKS",
      lead: "Deepak Gupta",
      mobile: "7021401252",
      status: "",
      createdOn: "05/11/2022",
    },
    {
      id: "7",
      displayId: "#1272",
      createdBy: "Deepak Gupta",
      uniqueId: "H3IT1baa",
      project: "GODREJ HILL RK IRRAT",
      lead: "Deepak Gupta",
      mobile: "7021401252",
      status: "",
      createdOn: "07/11/2022",
    },
    {
      id: "8",
      displayId: "#1270",
      createdBy: "Godrej Living",
      uniqueId: "5cV4bbaa",
      project: "GODREJ HILL RETIRAT",
      lead: "Godrej Living",
      mobile: "2217695214",
      status: "",
      createdOn: "06/01/2022",
    },
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
      key: "displayId",
      label: "ID",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "createdBy",
      label: "Created By",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "uniqueId",
      label: "Unique Id",
      sortable: true,
      draggable: true,
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
      key: "lead",
      label: "Lead",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
    {
      key: "mobile",
      label: "Mobile",
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
      key: "createdOn",
      label: "Created On",
      sortable: true,
      draggable: true,
      defaultVisible: true,
    },
  ];

  const renderCell = (item: ReferralData, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center">
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => navigate(`/campaigns/referrals/detail/${item.id}`)}
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      case "displayId":
        return <span className="text-sm font-medium">{item.displayId}</span>;
      case "createdBy":
        return <span className="text-sm">{item.createdBy}</span>;
      case "uniqueId":
        return <span className="text-sm">{item.uniqueId}</span>;
      case "project":
        return <span className="text-sm">{item.project}</span>;
      case "lead":
        return <span className="text-sm">{item.lead}</span>;
      case "mobile":
        return <span className="text-sm">{item.mobile}</span>;
      case "status":
        return item.status ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            {item.status}
          </span>
        ) : null;
      case "createdOn":
        return <span className="text-sm">{item.createdOn}</span>;
      default:
        return null;
    }
  };

  const filteredData = referralsData.filter(
    (referral) =>
      referral.displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.lead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.mobile.includes(searchTerm) ||
      referral.uniqueId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApplyFilters = () => {
    // Apply filter logic here - connect to API or filter local data
  };

  const handleResetFilters = () => {
    setFilters({ createdBy: "", status: "", createdOn: "" });
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
                    <InputLabel id="created-by-label" shrink>
                      Created By
                    </InputLabel>
                    <MuiSelect
                      labelId="created-by-label"
                      value={filters.createdBy}
                      label="Created By"
                      onChange={(e) =>
                        setFilters({ ...filters, createdBy: e.target.value })
                      }
                      displayEmpty
                      notched
                    >
                      <MenuItem value="">Select Created By</MenuItem>
                      <MenuItem value="samay">Samay Seth</MenuItem>
                      <MenuItem value="deepak">Deepak Gupta</MenuItem>
                      <MenuItem value="rahul">Rahul Kumar</MenuItem>
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
                      <MenuItem value="hot">Hot</MenuItem>
                      <MenuItem value="cold">Cold</MenuItem>
                      <MenuItem value="warm">Warm</MenuItem>
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
