import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

interface BuildingType {
  id: number;
  building_type: string;
  active: boolean;
}

interface Permissions {
  create: string;
  update: string;
  show: string;
}

const ProjectBuildingTypeList = () => {
  const { shouldShow } = useDynamicPermissions();
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [projectBuildingPermission, setProjectBuildingPermission] = useState<Permissions>({
    create: "false",
    update: "false",
    show: "false",
  });
  
  const itemsPerPage = 10;

  const getProjectBuildingPermission = () => {
    const lockRolePermissions = localStorage.getItem("lock_role_permissions");
    if (!lockRolePermissions) {
      return { create: "false", update: "false", show: "false" };
    }

    try {
      const permissions = JSON.parse(lockRolePermissions);
      return permissions.project_building || { create: "false", update: "false", show: "false" };
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return { create: "false", update: "false", show: "false" };
    }
  };

  useEffect(() => {
    const permissions = getProjectBuildingPermission();
    setProjectBuildingPermission(permissions);
  }, []);

  const fetchBuildingTypes = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}/building_types.json`, {
         headers: {
                         Authorization: getAuthHeader(),
                       },
      });
      
      const allBuildingTypes = response.data || [];
      
      let filteredBuildingTypes = allBuildingTypes;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredBuildingTypes = allBuildingTypes.filter((type: BuildingType) =>
          type.building_type?.toLowerCase().includes(searchLower)
        );
      }
      
      filteredBuildingTypes.sort((a: BuildingType, b: BuildingType) => b.id - a.id);
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedBuildingTypes = filteredBuildingTypes.slice(startIndex, endIndex);
      
      setBuildingTypes(paginatedBuildingTypes);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredBuildingTypes.length / itemsPerPage));
      setTotalCount(filteredBuildingTypes.length);
    } catch (error) {
      console.error("Error fetching building types:", error);
      toast.error("Failed to fetch building types");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, itemsPerPage]);

  useEffect(() => {
    fetchBuildingTypes(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchBuildingTypes]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 5;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const handleAddBuildingType = () => {
    navigate("/settings/project-building-type");
  };

  const handleEditBuildingType = (id: number) => {
    navigate(`/settings/project-building-type-edit/${id}`);
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      await axios.put(
        `${baseURL}/building_types/${id}.json`,
        { building_type: { active: !currentStatus } },
        {
           headers: {
                                     Authorization: getAuthHeader(),
                                   },
        }
      );
      toast.success("Status updated successfully");
      fetchBuildingTypes(currentPage, searchTerm);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'building_type', label: 'Building Type Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ];

  const renderCell = (item: BuildingType, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {shouldShow("ProjectBuilding", "update") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleEditBuildingType(item.id)} 
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'status':
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleToggle(item.id, item.active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                item.active ? "bg-[#C72030]" : "bg-gray-300"
              }`}
            >
              <div
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  item.active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        );
      default:
        return item[columnKey as keyof BuildingType] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
     
     {shouldShow("ProjectBuilding", "create") && (
        <Button 
          onClick={handleAddBuildingType}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add
        </Button>
      )}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={buildingTypes}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="building-types"
        storageKey="building-types-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search building types..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching building types..." : "Loading building types..."}
      />
      {totalCount > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

export default ProjectBuildingTypeList;
