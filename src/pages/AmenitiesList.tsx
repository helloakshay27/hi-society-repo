import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface Amenity {
  id: number;
  name: string;
  active: boolean;
  night_mode: boolean;
  icon_url?: string;
  dark_mode_icon_url?: string;
}

interface Permissions {
  create: string;
  update: string;
  delete: string;
  show: string;
}

const AmenitiesList = () => {
  const navigate = useNavigate();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
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

  const fetchAmenities = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/amenity_setups.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch amenities: ${response.statusText}`);
      }

      const data = await response.json();
      const amenitiesData = data.amenities_setups || [];
      
      // Client-side search filtering
      let filteredAmenities = amenitiesData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredAmenities = amenitiesData.filter((amenity: Amenity) =>
          amenity.name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredAmenities.sort((a: Amenity, b: Amenity) => b.id - a.id);
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedAmenities = filteredAmenities.slice(startIndex, endIndex);
      
      setAmenities(paginatedAmenities);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredAmenities.length / itemsPerPage));
      setTotalCount(filteredAmenities.length);
    } catch (err) {
      toast.error('Failed to fetch amenities data');
      console.error('Error fetching amenities:', err);
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
          setPermissions(permissions.amenities || {
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
    fetchAmenities(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchAmenities]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddAmenity = () => navigate('/setup-member/amenities');
  const handleEditAmenity = (id: number) => navigate(`/setup-member/edit-amenities/${id}`);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(getFullUrl(`/amenity_setups/${id}.json`), {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amenity_setup: { active: !currentStatus } }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status updated successfully!');
      fetchAmenities(currentPage, searchTerm);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleNightModeToggle = async (id: number, currentNightMode: boolean) => {
    try {
      const response = await fetch(getFullUrl(`/amenity_setups/${id}.json`), {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amenity_setup: { night_mode: !currentNightMode } }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle night mode');
      }

      toast.success(`Night Mode ${!currentNightMode ? 'enabled' : 'disabled'}`);
      fetchAmenities(currentPage, searchTerm);
    } catch (err) {
      console.error('Failed to toggle night mode:', err);
      toast.error('Failed to toggle night mode');
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'icon', label: 'Icon', sortable: false },
    { key: 'dark_mode_icon', label: 'Dark Mode Icon', sortable: false },
    { key: 'night_mode', label: 'Night Mode', sortable: false },
  ];

  const renderCell = (item: Amenity, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {permissions.update === 'true' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleEditAmenity(item.id)} 
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
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
          </div>
        );
      case 'icon':
        if (item.icon_url) {
          return (
            <img
              src={item.icon_url}
              alt={item.name}
              className="rounded-lg border border-gray-200 mx-auto"
              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
            />
          );
        }
        return <span className="text-sm text-gray-500 italic">No Icon</span>;
      case 'dark_mode_icon':
        if (item.dark_mode_icon_url) {
          return (
            <img
              src={item.dark_mode_icon_url}
              alt={item.name}
              className="rounded-lg border border-gray-200 mx-auto"
              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
            />
          );
        }
        return <span className="text-sm text-gray-500 italic">No Icon</span>;
      case 'night_mode':
        return (
          <div className="flex justify-center">
            <button
              onClick={() => handleNightModeToggle(item.id, item.night_mode)}
              className="text-gray-600 hover:opacity-80 transition-opacity"
            >
              {item.night_mode ? (
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
        return item[columnKey as keyof Amenity] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2">
      {permissions.create === 'true' && (
        <Button 
          onClick={handleAddAmenity}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add Amenity
        </Button>
      )}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={amenities}
        columns={columns}
        renderCell={renderCell}
        enableExport={true}
        exportFileName="amenities"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search amenities..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching amenities..." : "Loading amenities..."}
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

export default AmenitiesList;
