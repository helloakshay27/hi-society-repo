import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface Department {
  id: number;
  name: string;
  company_name: string;
  organization_name: string;
  active: boolean;
}

interface Permissions {
  create: string;
  update: string;
  delete: string;
  show: string;
}

const DepartmentList = () => {
  const navigate = useNavigate();
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [permissions, setPermissions] = useState<Permissions>({
    create: 'false',
    update: 'false',
    delete: 'false',
    show: 'false'
  });
  const itemsPerPage = 10;

  const fetchDepartments = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/departments.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.statusText}`);
      }

      const data = await response.json();
      const departmentsData = Array.isArray(data) ? data : (data.departments || []);
      
      // Client-side search filtering
      let filteredDepartments = departmentsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredDepartments = departmentsData.filter((dept: Department) =>
          dept.name?.toLowerCase().includes(searchLower) ||
          dept.company_name?.toLowerCase().includes(searchLower) ||
          dept.organization_name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredDepartments.sort((a: Department, b: Department) => b.id - a.id);
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);
      
      setDepartmentList(paginatedDepartments);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredDepartments.length / itemsPerPage));
      setTotalCount(filteredDepartments.length);
    } catch (err) {
      toast.error('Failed to fetch departments');
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const getPermissions = () => {
      try {
        const lockRolePermissions = localStorage.getItem('lock_role_permissions');
        if (lockRolePermissions) {
          const permissions = JSON.parse(lockRolePermissions);
          setPermissions(permissions.department || {
            create: 'false',
            update: 'false',
            delete: 'false',
            show: 'false'
          });
        }
      } catch (e) {
        console.error('Error parsing lock_role_permissions:', e);
      }
    };
    getPermissions();
  }, []);

  useEffect(() => {
    fetchDepartments(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchDepartments]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddDepartment = () => navigate('/settings/department-create');
  const handleEditDepartment = (id: number) => navigate(`/settings/department-edit/${id}`);

  const handleToggleUser = async (id: number, active: boolean) => {
    try {
      const response = await fetch(getFullUrl(`/departments/${id}.json`), {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ department: { active: !active } }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status updated successfully!');
      fetchDepartments(currentPage, searchTerm);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Department Name', sortable: true },
    { key: 'company_name', label: 'Company Name', sortable: true },
    { key: 'organization_name', label: 'Organization Name', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
  ];

  const renderCell = (item: Department, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {permissions.update === 'true' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleEditDepartment(item.id)} 
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'status':
        return (
          <div className="flex justify-center">
            <button
              onClick={() => handleToggleUser(item.id, item.active)}
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
          </div>
        );
      default:
        return item[columnKey as keyof Department] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2">
      {/* {permissions.create === 'true' && ( */}
        <Button 
          onClick={handleAddDepartment}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add Department
        </Button>
      {/* )} */}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={departmentList}
        columns={columns}
        renderCell={renderCell}
        enableExport={true}
        exportFileName="departments"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search departments..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching departments..." : "Loading departments..."}
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

export default DepartmentList;