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
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
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
            {/* {String(projectBuildingPermission.update) === "true" && ( */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleEditBuildingType(item.id)} 
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Button>
            {/* )} */}
          </div>
        );
      case 'status':
        return (
          <div className="flex justify-center">
            {/* {String(projectBuildingPermission.show) === "true" && ( */}
              <button
  type="button"
  onClick={() => handleToggle(item.id, item.active)}
  style={{
    width: "32px",          
    height: "12px",        
    backgroundColor: "#e5e5e5",
    borderRadius: "999px",
    border: "none",
    padding: "0",
    cursor: "pointer",
    position: "relative",
  }}
>
  <span
    style={{
      width: "14px",       
      height: "14px",
      borderRadius: "50%",
      backgroundColor: "#C72030",
      position: "absolute",
      top: "-1px",         
      left: "0px",
      transform: item.active ? "translateX(18px)" : "translateX(0px)", 
      transition: "transform 0.2s ease",
    }}
  />
</button>
            {/* )} */}
          </div>
        );
      default:
        return item[columnKey as keyof BuildingType] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
     
     {(String(projectBuildingPermission.create) === "true" || true) && (

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

export default ProjectBuildingTypeList;
