import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Download,
  Filter,
  Upload,
  Eye,
  Edit,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddSocietyModal } from "@/components/AddSocietyModal";
import { EditSocietyModal } from "@/components/EditSocietyModal";
import { DeleteSocietyModal } from "@/components/DeleteSocietyModal";
import { EnhancedTaskTable } from "@/components/enhanced-table/EnhancedTaskTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { TicketPagination } from "@/components/TicketPagination";
import { toast } from "sonner";
import { useApiConfig } from "@/hooks/useApiConfig";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";
import { getUser } from "@/utils/auth";
import { useDebounce } from "@/hooks/useDebounce";
import { Society } from "@/types/society";

interface SocietyTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  entriesPerPage: string;
  setEntriesPerPage: (entries: string) => void;
}

// Column configuration for the enhanced table
const columns: ColumnConfig[] = [
  {
    key: "actions",
    label: "Action",
    sortable: false,
    hideable: false,
    draggable: false,
  },
  {
    key: "building_name",
    label: "Society Name",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "area",
    label: "Area",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "city",
    label: "City",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "state",
    label: "State",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "project_type",
    label: "Project Type",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "postcode",
    label: "Postcode",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "ivr_enabled",
    label: "IVR Enabled",
    sortable: false,
    hideable: true,
    draggable: true,
  },
];

export const SocietyTab: React.FC<SocietyTabProps> = ({
  searchQuery,
  setSearchQuery,
  entriesPerPage,
  setEntriesPerPage,
}) => {
  const navigate = useNavigate();
  const { getFullUrl, getAuthHeader } = useApiConfig();

  // State management
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    total_count: 0,
    has_next_page: false,
    has_prev_page: false,
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSocietyId, setSelectedSocietyId] = useState<number | null>(null);
  const [selectedSocietyName, setSelectedSocietyName] = useState("");

  // IVR modal state
  const [isIvrModalOpen, setIsIvrModalOpen] = useState(false);
  const [ivrSocietyId, setIvrSocietyId] = useState<number | null>(null);
  const [ivrForm, setIvrForm] = useState({
    ivr_enabled: true,
    ivr_name: "",
    ivr_api_key: "",
    ivr_caller_id: "",
  });
  const [isIvrSubmitting, setIsIvrSubmitting] = useState(false);

  // Debug modal states
  useEffect(() => {
    console.log("🔔 Modal states changed:", { isAddModalOpen, isEditModalOpen, isDeleteModalOpen });
  }, [isAddModalOpen, isEditModalOpen, isDeleteModalOpen]);

  // Permissions
  const [canEditSociety, setCanEditSociety] = useState(false);

  const user = getUser() || {
    id: 0,
    firstname: "Guest",
    lastname: "",
    email: "",
  };

  const checkEditPermission = () => {
    const userEmail = user.email || "";
    const allowedEmails = [
      "abhishek.sharma@lockated.com",
      "adhip.shetty@lockated.com",
      "helloakshay27@gmail.com",
      "dev@lockated.com",
      "sumitra.patil@lockated.com",
"komalshinde0101@lockated.com",
      "demo@lockated.com",
      "ajay.ghenand@lockated.com"
    ];
    const hasPermission = allowedEmails.includes(userEmail);
    console.log("🔐 Edit Permission Check:", { userEmail, hasPermission, allowedEmails });
    setCanEditSociety(hasPermission);
  };

  useEffect(() => {
    checkEditPermission();
  }, []);

  // Load data on component mount and when page/perPage/search changes
  useEffect(() => {
    fetchSocieties(currentPage, perPage, debouncedSearchQuery);
  }, [currentPage, perPage, debouncedSearchQuery]);

  // Fetch societies data from API
  const fetchSocieties = async (page = 1, per_page = 10, search = "") => {
    setLoading(true);
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;

      console.log("🔧 API Config:", { baseUrl, tokenExists: !!token, tokenLength: token?.length });

      if (!baseUrl) {
        throw new Error("Base URL is not configured");
      }

      if (!token) {
        throw new Error("Authentication token is missing. Please login again.");
      }

      let apiUrl = `${baseUrl}/admin/societies.json?token=${token}&page=${page}&per_page=${per_page}`;

      // Add search parameter if provided
      if (search.trim()) {
        apiUrl += `&q[building_name_cont]=${encodeURIComponent(search.trim())}`;
      }

      console.log("🔗 Fetching societies from:", apiUrl.replace(token, "***TOKEN***"));

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`Failed to fetch societies: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Societies API response:", data);
      console.log("📊 Data type:", Array.isArray(data) ? "Array" : "Object");
      console.log("📊 Data keys:", Object.keys(data));

      // Handle array response or object with societies array
      const societiesList = Array.isArray(data) ? data : (data.societies || []);
      console.log("📋 Societies list length:", societiesList.length);
      console.log("📋 First society sample:", societiesList[0]);

      if (societiesList.length === 0) {
        console.warn("⚠️ No societies found in response");
      }

      setSocieties(societiesList);

      // Handle pagination from response or calculate from array
      if (data.pagination) {
        console.log("📄 Using API pagination:", data.pagination);
        setPagination(data.pagination);
      } else {
        const totalCount = societiesList.length;
        const totalPages = Math.ceil(totalCount / per_page);
        const calculatedPagination = {
          current_page: page,
          per_page,
          total_pages: totalPages,
          total_count: totalCount,
          has_next_page: page < totalPages,
          has_prev_page: page > 1,
        };
        console.log("📄 Calculated pagination:", calculatedPagination);
        setPagination(calculatedPagination);
      }
    } catch (error: any) {
      console.error("Error fetching societies:", error);
      toast.error(error.message || "Failed to fetch societies");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePerPageChange = (newPerPage: string) => {
    setPerPage(parseInt(newPerPage));
    setCurrentPage(1);
  };

  const handleView = (id: number) => {
    navigate(`/ops-console/master/location/account/societies/details/${id}`);
  };

  const handleEdit = (id: number) => {
    console.log("✏️ Edit button clicked", { id, canEditSociety });
    setSelectedSocietyId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    setSelectedSocietyId(id);
    setSelectedSocietyName(name);
    setIsDeleteModalOpen(true);
  };

  const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/societies/${id}.json?token=${token}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          society: {
            active: !currentStatus,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(`Society ${!currentStatus ? "activated" : "deactivated"} successfully`);
      fetchSocieties(currentPage, perPage, debouncedSearchQuery);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleIvrToggle = async (id: number, currentIvr: boolean) => {
    if (currentIvr) {
      // Disabling — call API directly, no modal
      submitIvrUpdate(id, { ivr_enabled: false, ivr_name: "", ivr_api_key: "", ivr_caller_id: "" });
      return;
    }

    // Enabling — fetch current data, pre-fill modal
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const response = await fetch(`${baseUrl}/admin/societies/${id}.json?token=${token}`);
      if (!response.ok) throw new Error("Failed to fetch society data");
      const data = await response.json();

      setIvrSocietyId(id);
      setIvrForm({
        ivr_enabled: true,
        ivr_name: data.ivr_name || "",
        ivr_api_key: data.ivr_api_key || "",
        ivr_caller_id: data.ivr_caller_id || "",
      });
      setIsIvrModalOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load IVR data");
    }
  };

  const submitIvrUpdate = async (
    id: number,
    data: { ivr_enabled: boolean; ivr_name: string; ivr_api_key: string; ivr_caller_id: string }
  ) => {
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/societies/${id}.json?token=${token}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ society: data }),
      });

      if (!response.ok) throw new Error("Failed to update IVR settings");

      toast.success(`IVR ${data.ivr_enabled ? "enabled" : "disabled"} successfully`);
      fetchSocieties(currentPage, perPage, debouncedSearchQuery);
    } catch (error: any) {
      toast.error(error.message || "Failed to update IVR settings");
    }
  };

  const handleIvrModalSubmit = async () => {
    if (!ivrSocietyId) return;
    setIsIvrSubmitting(true);
    await submitIvrUpdate(ivrSocietyId, ivrForm);
    setIsIvrSubmitting(false);
    setIsIvrModalOpen(false);
    setIvrSocietyId(null);
  };

  const renderRow = (society: Society) => ({
    actions: (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleView(society.id)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEdit(society.id)}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="Edit"
          disabled={!canEditSociety}
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(society.id, society.building_name)}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Delete"
          disabled={!canEditSociety}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
    building_name: (
      <div className="flex items-center gap-3">
        <div>
          <div className="font-medium">{society.building_name || "N/A"}</div>
          {society.registration && (
            <div className="text-sm text-gray-500">{society.registration}</div>
          )}
        </div>
      </div>
    ),
    area: <span className="text-sm text-gray-600">{society.area || "-"}</span>,
    city: <span className="text-sm text-gray-600">{society.city || "-"}</span>,
    state: <span className="text-sm text-gray-600">{society.state || "-"}</span>,
    project_type: (
      <span className="text-sm text-gray-600">{society.project_type || "-"}</span>
    ),
    postcode: <span className="text-sm text-gray-600">{society.postcode || "-"}</span>,
    status: (
      <Switch
        checked={society.active === 1}
        onCheckedChange={() => handleStatusToggle(society.id, society.active === 1)}
        disabled={!canEditSociety}
      />
    ),
    ivr_enabled: (
      <Switch
        checked={society.ivr_enabled === true}
        onCheckedChange={() => handleIvrToggle(society.id, society.ivr_enabled === true)}
        disabled={!canEditSociety}
      />
    ),
  });

  const totalPages = pagination.total_pages;
  const totalRecords = pagination.total_count;

  return (
    <>
      {loading && societies.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#c72030]" />
        </div>
      ) : (
        <>
          <EnhancedTaskTable
            columns={columns}
            data={societies}
            renderRow={renderRow}
            storageKey="society-dashboard-v1"
            hideTableExport={true}
            hideTableSearch={false}
            enableSearch={true}
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            leftActions={
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  console.log("🔵 Add Society button clicked", { canEditSociety });
                  setIsAddModalOpen(true);
                }}
                className="bg-[#c72030] hover:bg-[#A01828]"
                disabled={!canEditSociety}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Society
              </Button>
            }
            rightActions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.info("Bulk upload feature coming soon");
                  }}
                  disabled={!canEditSociety}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.info("Export feature coming soon");
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            }
          />

          <TicketPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            perPage={perPage}
            isLoading={loading}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        </>
      )}

      {/* Modals */}
      <AddSocietyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchSocieties(currentPage, perPage, debouncedSearchQuery);
        }}
        canEdit={canEditSociety}
      />

      <EditSocietyModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSocietyId(null);
        }}
        onSuccess={() => {
          fetchSocieties(currentPage, perPage, debouncedSearchQuery);
        }}
        societyId={selectedSocietyId}
        canEdit={canEditSociety}
      />

      <DeleteSocietyModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSocietyId(null);
          setSelectedSocietyName("");
        }}
        onSuccess={() => {
          fetchSocieties(currentPage, perPage, debouncedSearchQuery);
        }}
        societyId={selectedSocietyId}
        societyName={selectedSocietyName}
        canEdit={canEditSociety}
      />

      {/* IVR Configuration Modal */}
      <Dialog open={isIvrModalOpen} onOpenChange={(open) => { if (!open) setIsIvrModalOpen(false); }} modal={false}>
        <DialogContent className="max-w-md bg-white z-50">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              IVR CONFIGURATION
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsIvrModalOpen(false)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium">IVR Enabled</span>
                <p className="text-xs text-gray-500">Enable IVR for this society</p>
              </div>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ivrForm.ivr_enabled}
                    onChange={(e) => setIvrForm((prev) => ({ ...prev, ivr_enabled: e.target.checked }))}
                  />
                }
                label={ivrForm.ivr_enabled ? "Enabled" : "Disabled"}
              />
            </div>
            <TextField
              label="IVR Name"
              placeholder="Enter IVR name"
              value={ivrForm.ivr_name}
              onChange={(e) => setIvrForm((prev) => ({ ...prev, ivr_name: e.target.value }))}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { height: "45px", "& .MuiInputBase-input": { padding: "12px 14px" } } }}
            />
            <TextField
              label="IVR API Key"
              placeholder="Enter IVR API key"
              value={ivrForm.ivr_api_key}
              onChange={(e) => setIvrForm((prev) => ({ ...prev, ivr_api_key: e.target.value }))}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { height: "45px", "& .MuiInputBase-input": { padding: "12px 14px" } } }}
            />
            <TextField
              label="IVR Caller ID"
              placeholder="Enter IVR caller ID"
              value={ivrForm.ivr_caller_id}
              onChange={(e) => setIvrForm((prev) => ({ ...prev, ivr_caller_id: e.target.value }))}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { height: "45px", "& .MuiInputBase-input": { padding: "12px 14px" } } }}
            />
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setIsIvrModalOpen(false)} disabled={isIvrSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleIvrModalSubmit}
                disabled={isIvrSubmitting}
                className="bg-[#c72030] hover:bg-[#a01828]"
              >
                {isIvrSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save IVR Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
