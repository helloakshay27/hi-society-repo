import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface Slot {
  id: number;
  start_time: string;
  end_time: string;
  active: number;
  project_name?: string;
}

interface Permissions {
  create: string;
  update: string;
  delete: string;
  show: string;
}

const SiteVisitSlotConfigList = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
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

  const fetchSlots = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/site_schedule/all_site_schedule_slots.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch slots: ${response.statusText}`);
      }

      const data = await response.json();
      const slotsData = data.slots || [];
      
      // Client-side search filtering
      let filteredSlots = slotsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredSlots = slotsData.filter((slot: Slot) =>
          slot.project_name?.toLowerCase().includes(searchLower) ||
          slot.start_time?.toLowerCase().includes(searchLower) ||
          slot.end_time?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredSlots.sort((a: Slot, b: Slot) => b.id - a.id);
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedSlots = filteredSlots.slice(startIndex, endIndex);
      
      setSlots(paginatedSlots);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredSlots.length / itemsPerPage));
      setTotalCount(filteredSlots.length);
    } catch (err) {
      toast.error('Failed to load visit slots');
      console.error('Error fetching slots:', err);
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
          setPermissions(permissions.site_slot || {
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
    fetchSlots(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchSlots]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddSlot = () => navigate('/setup-member/site-visit-slot-config');

  const handleToggle = async (slotId: number, currentStatus: number) => {
    try {
      const updatedStatus = currentStatus ? 0 : 1;
      const response = await fetch(getFullUrl(`/site_schedules/${slotId}.json`), {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: updatedStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status updated successfully!');
      fetchSlots(currentPage, searchTerm);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'status', label: 'Active', sortable: false },
    { key: 'time_slot', label: 'Start Time & End Time', sortable: false },
  ];

  const renderCell = (item: Slot, columnKey: string) => {
    switch (columnKey) {
      case 'status':
        return (
          <div className="flex justify-center">
            {permissions.show === 'true' && (
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
      case 'time_slot':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-800">
            {item.start_time} to {item.end_time}
          </span>
        );
      default:
        return item[columnKey as keyof Slot] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2">
      {permissions.create === 'true' && (
        <Button 
          onClick={handleAddSlot}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add Slot
        </Button>
      )}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={slots}
        columns={columns}
        renderCell={renderCell}
        enableExport={true}
        exportFileName="visit-slots"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search slots..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching slots..." : "Loading slots..."}
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

export default SiteVisitSlotConfigList;
