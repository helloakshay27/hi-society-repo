import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";


interface Site {
  id: number;
  name: string;
  site_company_name: string;
  site_department_name: string;
  site_project_name: string;
  created_at: string;
  updated_at: string;
}

interface SitePermissions {
  create?: string;
  update?: string;
  delete?: string;
  show?: string;
}

const SiteList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [sitePermissions, setSitePermissions] = useState<SitePermissions>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const getSitePermissions = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};
  
      const permissions = JSON.parse(lockRolePermissions);
      return permissions.site || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    setSitePermissions(getSitePermissions());
  }, []);

  const fetchSites = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}sites.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const sitesData = Array.isArray(response.data) ? response.data : (response.data.sites ? response.data.sites : []);

      // Client-side search filtering
      let filteredSites = sitesData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredSites = sitesData.filter((site: Site) =>
          site.name?.toLowerCase().includes(searchLower) ||
          site.site_company_name?.toLowerCase().includes(searchLower) ||
          site.site_department_name?.toLowerCase().includes(searchLower) ||
          site.site_project_name?.toLowerCase().includes(searchLower)
        );
      }

      // Client-side pagination
      const itemsPerPage = 10;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedSites = filteredSites.slice(startIndex, endIndex);

      setSites(paginatedSites);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredSites.length / itemsPerPage));
      setTotalCount(filteredSites.length);

      // Cache all sites
      sessionStorage.setItem('cached_sites', JSON.stringify(sitesData));
    } catch (error) {
      toast.error("Failed to fetch sites.");
      console.error("Error fetching sites:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL]);

  useEffect(() => {
    fetchSites(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchSites]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddSite = () => navigate("/setup-member/site-create");
  const handleEditSite = (id: number) => navigate(`/setup-member/site-edit/${id}`);
  const handleClearSelection = () => { setShowActionPanel(false); };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'Sr No', sortable: true },
    { key: 'name', label: 'Site Name', sortable: true },
    { key: 'site_company_name', label: 'Company', sortable: true },
    { key: 'site_department_name', label: 'Department', sortable: true },
    { key: 'site_project_name', label: 'Project', sortable: true },
  ];

  const renderCell = (item: Site, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {sitePermissions.update === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleEditSite(item.id)} title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'name':
        return item.name || "-";
      case 'site_company_name':
        return item.site_company_name || "-";
      case 'site_department_name':
        return item.site_department_name || "-";
      case 'site_project_name':
        return item.site_project_name || "-";
      default:
        return item[columnKey as keyof Site] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      <Button 
        onClick={() => setShowActionPanel((prev) => !prev)}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
        Action
      </Button>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      {showActionPanel && (
        <SelectionPanel
          onAdd={handleAddSite}
          onClearSelection={handleClearSelection}
        />
      )}
      <>
        <EnhancedTable
          data={sites}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="sites"
          storageKey="sites-table"
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search sites..."
          leftActions={renderCustomActions()}
          loading={isSearching || loading}
          loadingMessage={isSearching ? "Searching sites..." : "Loading sites..."}
        />
        {!searchTerm && totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">
        {renderListTab()}
      </div>
    </div>
  );
};

export default SiteList;
