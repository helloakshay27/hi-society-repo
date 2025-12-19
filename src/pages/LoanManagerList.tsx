import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_CONFIG } from "@/config/apiConfig";
import axios from "axios";
import { Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface LoanManager {
  id: number;
  name: string;
  email: string;
  mobile: string;
  project_id: string;
  active: boolean;
}

interface Permissions {
  create?: string;
  update?: string;
  delete?: string;
  read?: string;
}

const LoanManagerList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  
  const [loanManagers, setLoanManagers] = useState<LoanManager[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loanManagerPermissions, setLoanManagerPermissions] = useState<Permissions>({});
  
  const itemsPerPage = 10;

  const getLoanManagerPermissions = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const permissions = JSON.parse(lockRolePermissions);
      return permissions.loan_manager || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    setLoanManagerPermissions(getLoanManagerPermissions());
  }, []);

  const fetchLoanManagers = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}/loan_managers.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const loanManagersData = response.data || [];
      
      // Client-side search filtering
      let filteredLoanManagers = loanManagersData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredLoanManagers = loanManagersData.filter((loanManager: LoanManager) =>
          loanManager.name?.toLowerCase().includes(searchLower) ||
          loanManager.email?.toLowerCase().includes(searchLower) ||
          loanManager.mobile?.toLowerCase().includes(searchLower) ||
          loanManager.project_id?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredLoanManagers.sort((a: LoanManager, b: LoanManager) => (b.id || 0) - (a.id || 0));
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedLoanManagers = filteredLoanManagers.slice(startIndex, endIndex);
      
      setLoanManagers(paginatedLoanManagers);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredLoanManagers.length / itemsPerPage));
      setTotalCount(filteredLoanManagers.length);
    } catch (error) {
      console.error("Error fetching loan managers:", error);
      toast.error("Failed to fetch loan managers");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL]);

  useEffect(() => {
    fetchLoanManagers(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchLoanManagers]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddLoanManager = () => navigate("/setup-member/loan-manager-add");
  const handleEditLoanManager = (id: number) => navigate(`/setup-member/loan-manager-edit/${id}`);

  const onToggle = async (loanManagerId: number, currentStatus: boolean) => {
    toast.dismiss();
    setLoading(true);
    try {
      const response = await axios.put(
        `${baseURL}/loan_managers/${loanManagerId}.json`,
        {
          loan_manager: {
            active: !currentStatus
          }
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setLoanManagers((prevLoanManagers) =>
          prevLoanManagers.map((loanManager) =>
            loanManager.id === loanManagerId
              ? { ...loanManager, active: !currentStatus }
              : loanManager
          )
        );
        toast.success("Loan Manager status updated successfully!");
      }
    } catch (error) {
      console.error("Error toggling loan manager status:", error);
      toast.error("Failed to update loan manager status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'mobile', label: 'Mobile', sortable: true },
    { key: 'project_id', label: 'Project ID', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
  ];

  const renderCell = (item: LoanManager, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {loanManagerPermissions.update === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleEditLoanManager(item.id)} title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'status':
        return (
          <div className="flex justify-center">
            <button
              onClick={() => onToggle(item.id, item.active)}
              className="text-gray-600 hover:opacity-80 transition-opacity"
              disabled={loading}
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
          </div>
        );
      case 'project_id':
        return item.project_id || '-';
      default:
        return item[columnKey as keyof LoanManager] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {loanManagerPermissions.create === "true" && (
        <Button 
          onClick={handleAddLoanManager}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add Loan Manager
        </Button>
      )}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
          <EnhancedTable
            data={loanManagers}
            columns={columns}
            renderCell={renderCell}
            enableExport={true}
            exportFileName="loan-managers"
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            searchPlaceholder="Search loan managers (name, email, mobile, project ID)..."
            leftActions={renderCustomActions()}
            loading={isSearching || loading}
            loadingMessage={isSearching ? "Searching loan managers..." : "Loading loan managers..."}
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

export default LoanManagerList;