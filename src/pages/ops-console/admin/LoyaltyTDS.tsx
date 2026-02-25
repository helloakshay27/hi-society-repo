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

interface OrganizationItem {
  id: number;
  name: string;
  active: boolean;
  domain: string;
  country_id: number | null;
  tds_applicable?: boolean;
  tds_percentage?: number;
  tds_limit?: number;
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
    key: "name",
    label: "Organization Name",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "domain",
    label: "Domain",
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
];

export const LoyaltyTDS: React.FC = () => {
  const { getFullUrl, getAuthHeader } = useApiConfig();
  
  // State management
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
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

  // Fetch organizations on component mount and when params change
  useEffect(() => {
    fetchOrganizations(currentPage, perPage, debouncedSearchQuery);
  }, [currentPage, perPage, debouncedSearchQuery]);

  const fetchOrganizations = async (page = 1, per_page = 10, search = "") => {
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
        url = `${storedBaseUrl}/organizations.json?page=${page}&per_page=${per_page}`;
      } else {
        url = getFullUrl(`/organizations.json?page=${page}&per_page=${per_page}`);
      }

      // Add search parameter
      if (search.trim()) {
        url += `&q[search_all_fields_cont]=${encodeURIComponent(search.trim())}`;
      }

      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      } else {
        try {
          headers["Authorization"] = getAuthHeader();
        } catch (e) {
          console.warn("No token available for Authorization header:", e);
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
      
      if (result && result.organizations && Array.isArray(result.organizations)) {
        // Filter only active organizations
        const activeOrgs = result.organizations.filter((org: OrganizationItem) => org.active);
        
        // Fetch all TDS settings at once using the list API
        const tdsSettingsMap = await fetchAllTDSSettings();
        
        // Map TDS settings to organizations
        const orgsWithTDS = activeOrgs.map((org: OrganizationItem) => {
          const tdsData = tdsSettingsMap[org.id];
          return {
            ...org,
            tds_applicable: tdsData?.tds_applicable || false,
            tds_percentage: tdsData?.tds_percentage || 0,
            tds_limit: tdsData?.tds_limit || 0,
          };
        });
        
        setOrganizations(orgsWithTDS);
        
        // Set pagination
        if (result.pagination) {
          setPagination(result.pagination);
        } else {
          setPagination({
            current_page: page,
            per_page: per_page,
            total_pages: Math.ceil(activeOrgs.length / per_page),
            total_count: activeOrgs.length,
          });
        }
      } else {
        throw new Error("Invalid organizations data format");
      }
    } catch (error: any) {
      console.error("Error fetching organizations:", error);
      toast.error(`Failed to load organizations: ${error.message}`);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTDSSettings = async (): Promise<Record<number, Partial<OrganizationItem>>> => {
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

      if (response.ok) {
        const data = await response.json();
        
        // Create a map of organization_id -> TDS settings
        const tdsMap: Record<number, Partial<OrganizationItem>> = {};
        
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            tdsMap[item.organization_id] = {
              tds_applicable: item.tds_applicable || false,
              tds_percentage: parseFloat(item.tds_percentage) || 0,
              tds_limit: parseFloat(item.tds_limit) || 0,
            };
          });
        }
        
        return tdsMap;
      } else {
        console.warn("Failed to fetch TDS settings list");
        return {};
      }
    } catch (error: any) {
      console.error("Error fetching all TDS settings:", error);
      return {};
    }
  };

  const fetchTDSSettings = async (orgId: number): Promise<Partial<OrganizationItem>> => {
    try {
      const storedBaseUrl = getBaseUrl();
      const storedToken = localStorage.getItem("token");

      let url: string;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (storedBaseUrl) {
        url = `${storedBaseUrl}/admin/organization_tds_settings/${orgId}`;
      } else {
        url = getFullUrl(`/admin/organization_tds_settings/${orgId}`);
      }

      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
        url += `?token=${storedToken}`;
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

      if (response.ok) {
        const data = await response.json();
        return {
          tds_applicable: data.tds_applicable || false,
          tds_percentage: data.tds_percentage || 0,
          tds_limit: data.tds_limit || 0,
        };
      } else {
        return {
          tds_applicable: false,
          tds_percentage: 0,
          tds_limit: 0,
        };
      }
    } catch (error: any) {
      console.error("Error fetching TDS settings:", error);
      return {
        tds_applicable: false,
        tds_percentage: 0,
        tds_limit: 0,
      };
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

  const handleEdit = (id: number) => {
    setSelectedOrganizationId(id);
    setIsEditModalOpen(true);
  };

  const handleView = (id: number) => {
    setSelectedOrganizationId(id);
    setIsEditModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render row function for enhanced table
  const renderRow = (org: OrganizationItem) => ({
    actions: (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleView(org.id)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="View/Edit TDS Settings"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEdit(org.id)}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="Edit TDS Settings"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    ),
    name: (
      <div className="font-medium">{org.name || "N/A"}</div>
    ),
    domain: (
      <div className="text-sm text-gray-600">{org.domain || "-"}</div>
    ),
    tds_applicable: (
      <div className="flex items-center gap-2">
        <Switch
          checked={org.tds_applicable || false}
          disabled={true}
          aria-label={`TDS status for ${org.name}`}
        />
        <span className={`text-xs font-medium ${org.tds_applicable ? "text-green-700" : "text-gray-500"}`}>
          {org.tds_applicable ? "Enabled" : "Disabled"}
        </span>
      </div>
    ),
    tds_percentage: (
      <span className="text-sm text-gray-700">
        {org.tds_percentage ? `${org.tds_percentage}%` : "-"}
      </span>
    ),
    tds_limit: (
      <span className="text-sm text-gray-700">
        {org.tds_limit ? formatCurrency(org.tds_limit) : "-"}
      </span>
    ),
  });

  const totalRecords = pagination.total_count;
  const totalPages = pagination.total_pages;
  const displayedData = organizations;

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
            fetchOrganizations(currentPage, perPage, debouncedSearchQuery);
            setIsEditModalOpen(false);
            setSelectedOrganizationId(null);
          }}
          organizationId={selectedOrganizationId}
        />
      )}

      {/* Add TDS Modal */}
      <AddTDSModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchOrganizations(currentPage, perPage, debouncedSearchQuery);
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};
