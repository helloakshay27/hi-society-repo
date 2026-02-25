import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, Eye, Loader2, Plus, Filter } from "lucide-react";
import { EnhancedTaskTable } from "@/components/enhanced-table/EnhancedTaskTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { TicketPagination } from "@/components/TicketPagination";
import { toast } from "sonner";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useDebounce } from "@/hooks/useDebounce";
import { EditTDSModal } from "@/components/EditTDSModal";
import { AddTDSModal } from "@/components/AddTDSModal";
import { getBaseUrl } from "@/utils/auth";

interface TDSSettingsItem {
  id: number;
  organization_id: number;
  organization_name?: string;
  tds_applicable: boolean;
  tds_percentage: string;
  tds_limit: string;
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

interface TDSSettings {
  organization_id: number;
  tds_applicable: boolean;
  tds_percentage: number;
  tds_limit: number;
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
    key: "organization_name",
    label: "Organization Name",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "tds_applicable",
    label: "TDS Status",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "tds_percentage",
    label: "TDS %",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "tds_limit",
    label: "TDS Limit",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "created_at",
    label: "Created At",
    sortable: true,
    hideable: true,
    draggable: true,
  },
];

export const LoyaltyTDS: React.FC = () => {
  const { getFullUrl, getAuthHeader } = useApiConfig();
  
  // State management
  const [tdsSettings, setTdsSettings] = useState<TDSSettingsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    total_count: 0,
  });

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);

  // Fetch TDS settings on component mount and when params change
  useEffect(() => {
    fetchTDSSettings(currentPage, perPage, debouncedSearchQuery);
  }, [currentPage, perPage, debouncedSearchQuery]);

  const fetchTDSSettings = async (page = 1, per_page = 10, search = "") => {
    setLoading(true);
    try {
      const storedBaseUrl = getBaseUrl();
      const storedToken = localStorage.getItem("token");

      let url: string;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (storedBaseUrl) {
        url = `${storedBaseUrl}/admin/organization_tds_settings`;
      } else {
        url = getFullUrl("/admin/organization_tds_settings");
      }

      if (storedToken) {
        url += `?token=${storedToken}`;
        headers["Authorization"] = `Bearer ${storedToken}`;
      } else {
        try {
          headers["Authorization"] = getAuthHeader();
          const token = getAuthHeader().replace("Bearer ", "");
          url += `?token=${token}`;
        } catch (e) {
          console.warn("No token available:", e);
        }
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result && Array.isArray(result)) {
        // Fetch organization names for each TDS setting
        const tdsWithOrgNames = await Promise.all(
          result.map(async (tds: any) => {
            const orgName = await fetchOrganizationName(tds.organization_id);
            return {
              ...tds,
              organization_name: orgName,
            };
          })
        );

        // Apply search filter if needed
        let filteredData = tdsWithOrgNames;
        if (search.trim()) {
          const searchLower = search.trim().toLowerCase();
          filteredData = tdsWithOrgNames.filter((item: TDSSettingsItem) =>
            item.organization_name?.toLowerCase().includes(searchLower) ||
            item.organization_id.toString().includes(searchLower) ||
            item.tds_percentage.toString().includes(searchLower)
          );
        }

        // Apply pagination
        const total = filteredData.length;
        const startIndex = (page - 1) * per_page;
        const endIndex = startIndex + per_page;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setTdsSettings(paginatedData);
        setPagination({
          current_page: page,
          per_page: per_page,
          total_pages: Math.ceil(total / per_page),
          total_count: total,
        });
      } else {
        throw new Error("Invalid TDS settings data format");
      }
    } catch (error: any) {
      console.error("Error fetching TDS settings:", error);
      toast.error(`Failed to load TDS settings: ${error.message}`);
      setTdsSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationName = async (orgId: number): Promise<string> => {
    try {
      const storedBaseUrl = getBaseUrl();
      const storedToken = localStorage.getItem("token");

      let url: string;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (storedBaseUrl) {
        url = `${storedBaseUrl}/organizations/${orgId}.json`;
      } else {
        url = getFullUrl(`/organizations/${orgId}.json`);
      }

      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      } else {
        try {
          headers["Authorization"] = getAuthHeader();
        } catch (e) {
          console.warn("No token available:", e);
        }
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        return data.name || "Unknown";
      }
      return "Unknown";
    } catch (error) {
      console.error(`Error fetching organization ${orgId}:`, error);
      return "Unknown";
    }
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchQuery(term);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle per page change
  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleEdit = (tdsSettingsId: number | undefined, orgId: number) => {
    if (tdsSettingsId) {
      setSelectedOrganizationId(tdsSettingsId);
      setIsEditModalOpen(true);
    } else {
      toast.error("No TDS settings found for this organization");
    }
  };

  const handleView = (tdsSettingsId: number | undefined, orgId: number) => {
    if (tdsSettingsId) {
      setSelectedOrganizationId(tdsSettingsId);
      setIsEditModalOpen(true);
    } else {
      toast.error("No TDS settings found for this organization");
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render row function for enhanced table
  const renderRow = (item: TDSSettingsItem) => ({
    actions: (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleView(item.id, item.organization_id)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="View/Edit TDS Settings"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEdit(item.id, item.organization_id)}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="Edit TDS Settings"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    ),
    organization_name: (
      <div className="font-medium">{item.organization_name || "N/A"}</div>
    ),
    tds_applicable: (
      <div className="flex items-center gap-2">
        <Switch
          checked={item.tds_applicable}
          disabled={true}
          aria-label={`TDS status for ${item.organization_name}`}
        />
        <span className={`text-xs font-medium ${item.tds_applicable ? "text-green-700" : "text-gray-500"}`}>
          {item.tds_applicable ? "Enabled" : "Disabled"}
        </span>
      </div>
    ),
    tds_percentage: (
      <span className="text-sm text-gray-700">
        {item.tds_percentage}%
      </span>
    ),
    tds_limit: (
      <span className="text-sm text-gray-700">
        {formatCurrency(item.tds_limit)}
      </span>
    ),
    created_at: (
      <span className="text-sm text-gray-600">
        {formatDate(item.created_at)}
      </span>
    ),
  });

  const totalRecords = pagination.total_count;
  const totalPages = pagination.total_pages;
  const displayedData = tdsSettings;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loyalty TDS Settings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure Tax Deducted at Source (TDS) settings for organization loyalty programs
          </p>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
          <span className="ml-2 text-gray-600">Loading TDS settings...</span>
        </div>
      )}

      {!loading && (
        <>
          <EnhancedTaskTable
            data={displayedData}
            columns={columns}
            renderRow={renderRow}
            storageKey="loyalty-tds-dashboard-v1"
            hideTableExport={true}
            hideTableSearch={false}
            enableSearch={true}
            searchTerm={searchQuery}
            onSearchChange={handleSearch}
            leftActions={
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add TDS Settings
              </Button>
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

      {/* Edit TDS Modal */}
      {selectedOrganizationId !== null && (
        <EditTDSModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedOrganizationId(null);
          }}
          onSuccess={() => {
            fetchTDSSettings(currentPage, perPage, debouncedSearchQuery);
            setIsEditModalOpen(false);
            setSelectedOrganizationId(null);
          }}
          tdsSettingsId={selectedOrganizationId}
        />
      )}

      {/* Add TDS Modal */}
      <AddTDSModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchTDSSettings(currentPage, perPage, debouncedSearchQuery);
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};
