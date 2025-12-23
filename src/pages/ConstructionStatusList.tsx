import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { API_CONFIG } from '@/config/apiConfig';

interface ConstructionStatus {
  id: number;
  construction_status: string;
  active: boolean;
}

interface Permissions {
  create: string;
  update: string;
  show: string;
}

const ConstructionStatusList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<ConstructionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [constructionStatusPermissions, setConstructionStatusPermissions] = useState<Permissions>({
    create: "false",
    update: "false",
    show: "false"
  });
  const itemsPerPage = 10;

  const fetchStatuses = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}/construction_statuses.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const statusesData = response.data || [];

      // Client-side search filtering
      let filteredStatuses = statusesData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredStatuses = statusesData.filter((status: ConstructionStatus) =>
          status.construction_status?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by ID descending
      filteredStatuses.sort((a: ConstructionStatus, b: ConstructionStatus) => b.id - a.id);

      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedStatuses = filteredStatuses.slice(startIndex, endIndex);

      setStatuses(paginatedStatuses);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredStatuses.length / itemsPerPage));
      setTotalCount(filteredStatuses.length);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      toast.error("Failed to load construction statuses.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, itemsPerPage]);

  useEffect(() => {
    const getConstructionStatusPermissions = () => {
      try {
        const lockRolePermissions = localStorage.getItem("lock_role_permissions");
        if (!lockRolePermissions) return { create: "false", update: "false", show: "false" };
        const permissions = JSON.parse(lockRolePermissions);
        return permissions.construction || { create: "false", update: "false", show: "false" };
      } catch (e) {
        console.error("Error parsing lock_role_permissions:", e);
        return { create: "false", update: "false", show: "false" };
      }
    };
    const permissions = getConstructionStatusPermissions();
    setConstructionStatusPermissions(permissions);
  }, []);

  useEffect(() => {
    fetchStatuses(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchStatuses]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddStatus = () => navigate("/setup-member/construction-status");
  const handleEditStatus = (id: number) => navigate(`/setup-member/construction-status-edit/${id}`);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      await axios.put(
        `${baseURL}/construction_statuses/${id}.json`,
        { construction_status: { active: !currentStatus } },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Status updated successfully!");
      fetchStatuses(currentPage, searchTerm);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'construction_status', label: 'Status Name', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
  ];

  const renderCell = (item: ConstructionStatus, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {constructionStatusPermissions.update === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleEditStatus(item.id)} title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'status':
        return (
          <div className="flex justify-center">
            {constructionStatusPermissions.show === "true" && (
              <button
                onClick={() => handleToggle(item.id, item.active)}
                className="text-gray-600 hover:opacity-80 transition-opacity"
              >
                {item.active ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" fill="#28a745" viewBox="0 0 16 16">
                    <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" fill="#6c757d" viewBox="0 0 16 16">
                    <path d="M11 4a4 4 0 0 1 0 8H8a5 5 0 0 0 2-4 5 5 0 0 0-2-4zM5 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8M0 8a5 5 0 0 0 5 5h6a5 5 0 0 0 0-10H5a5 5 0 0 0-5 5" />
                  </svg>
                )}
              </button>
            )}
          </div>
        );
      default:
        return item[columnKey as keyof ConstructionStatus] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {constructionStatusPermissions.create === "true" && (
        <Button
          onClick={handleAddStatus}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Add Status
        </Button>
      )}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={statuses}
        columns={columns}
        renderCell={renderCell}
        enableExport={true}
        exportFileName="construction-statuses"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search construction status..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching statuses..." : "Loading statuses..."}
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

export default ConstructionStatusList;