import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { Switch } from "@mui/material";

interface PropertyType {
  id: number;
  property_type: string;
  active: boolean;
}

interface Permissions {
  create?: string;
  update?: string;
  show?: string;
}

const PropertyTypeList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [propertyTypePermission, setPropertyTypePermission] = useState<Permissions>({});
  
  const itemsPerPage = 10;

  const getPropertyTypePermission = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const permissions = JSON.parse(lockRolePermissions);
      return permissions.property_type || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    const permissions = getPropertyTypePermission();
    setPropertyTypePermission(permissions);
  }, []);

  const fetchPropertyTypes = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}/property_types.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const propertyTypesData = response.data || [];
      
      // Client-side search filtering
      let filteredPropertyTypes = propertyTypesData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredPropertyTypes = propertyTypesData.filter((property: PropertyType) =>
          property.property_type?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredPropertyTypes.sort((a: PropertyType, b: PropertyType) => (b.id || 0) - (a.id || 0));
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedPropertyTypes = filteredPropertyTypes.slice(startIndex, endIndex);
      
      setPropertyTypes(paginatedPropertyTypes);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredPropertyTypes.length / itemsPerPage));
      setTotalCount(filteredPropertyTypes.length);
    } catch (error) {
      console.error("Error fetching property types:", error);
      toast.error("Failed to load property types.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL]);

  useEffect(() => {
    fetchPropertyTypes(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchPropertyTypes]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddPropertyType = () => navigate("/settings/property-type");
  const handleEditPropertyType = (id: number) => navigate(`/settings/property-type-edit/${id}`);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    const updatedStatus = !currentStatus;
    try {
      await axios.put(
        `${baseURL}/property_types/${id}.json`,
        { property_type: { active: updatedStatus } },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      setPropertyTypes((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, active: updatedStatus } : item
        )
      );
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'property_type', label: 'Property Type Name', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
  ];

  const renderCell = (item: PropertyType, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {/* {propertyTypePermission.update === "true" && ( */}
              <Button variant="ghost" size="sm" onClick={() => handleEditPropertyType(item.id)} title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            {/* )} */}
          </div>
        );
      case 'status':
        return (
          <div className="flex justify-center">
            {/* {propertyTypePermission.show === "true" && ( */}
              <Switch
                checked={item.active}
                onChange={() => handleToggle(item.id, item.active)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#C72030',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#C72030',
                  },
                }}
              />
            {/* )} */}
          </div>
        );
      default:
        return item[columnKey as keyof PropertyType] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {/* {propertyTypePermission.create === "true" && ( */}
        <Button 
          onClick={handleAddPropertyType}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add
        </Button>
      {/* )} */}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
          <EnhancedTable
            data={propertyTypes}
            columns={columns}
            renderCell={renderCell}
            enableExport={true}
            exportFileName="property-types"
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            searchPlaceholder="Search property types..."
            leftActions={renderCustomActions()}
            loading={isSearching || loading}
            loadingMessage={isSearching ? "Searching property types..." : "Loading property types..."}
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

export default PropertyTypeList;
