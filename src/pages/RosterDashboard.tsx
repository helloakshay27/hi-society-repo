import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Filter, Upload, Printer, QrCode, Eye, Edit, Trash2, Loader2, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BulkUploadModal } from '@/components/BulkUploadModal';
import { ExportModal } from '@/components/ExportModal';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { ColumnConfig } from '@/hooks/useEnhancedTable';
import { TicketPagination } from '@/components/TicketPagination';
import { API_CONFIG, getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

// Type definitions for the roster data
interface RosterItem {
  id: number;
  template: string;
  location: string;
  shift: string;
  rosterType: string;
  createdOn: string;
  createdBy: string;
  active: boolean;
}

interface ApiResponse {
  success: boolean;
  data: RosterItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

// Column configuration for the enhanced table
const columns: ColumnConfig[] = [
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    hideable: false,
    draggable: false
  },
  {
    key: 'template',
    label: 'Template',
    sortable: true,
    hideable: true,
    draggable: true
  },
  {
    key: 'location',
    label: 'Location',
    sortable: true,
    hideable: true,
    draggable: true
  },
  {
    key: 'shift',
    label: 'Shift',
    sortable: true,
    hideable: true,
    draggable: true
  },
  {
    key: 'rosterType',
    label: 'Roster Type',
    sortable: true,
    hideable: true,
    draggable: true
  },
  {
    key: 'createdOn',
    label: 'Created On',
    sortable: true,
    hideable: true,
    draggable: true
  }
  // {
  //   key: 'createdBy',
  //   label: 'Created By',
  //   sortable: true,
  //   hideable: true,
  //   draggable: true
  // }
];

interface RosterDashboardProps {
  basePath?: string;
}

const getSmartSecureSocietyId = () => {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("society_id") ||
    params.get("site_id") ||
    params.get("resource_id") ||
    localStorage.getItem("selectedSiteId") ||
    localStorage.getItem("society_id") ||
    localStorage.getItem("selectedSocietyId") ||
    localStorage.getItem("selectedUserSociety") ||
    "15"
  );
};

const getRosterItems = (data: any) => {
  if (Array.isArray(data)) return data;

  const candidates = [
    data?.user_roasters,
    data?.roasters,
    data?.rosters,
    data?.data,
    data?.data?.user_roasters,
    data?.data?.roasters,
    data?.data?.rosters,
  ];

  return candidates.find(Array.isArray) || [];
};

export const RosterDashboard = ({
  basePath = "/settings/account/roster",
}: RosterDashboardProps = {}) => {
  const { shouldShow } = useDynamicPermissions();
  const navigate = useNavigate();
  const rosterBasePath = basePath.replace(/\/$/, "");
  const isSmartSecureRoster = rosterBasePath === "/smartsecure/roster";
  const tableStorageKey = isSmartSecureRoster
    ? "smartsecure-roster-management-table"
    : "roster-management-table";
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRosterId, setSelectedRosterId] = useState<number | null>(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Changed to constant like BuildingPage
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchQuery = useDebounce(searchTerm, 1000);
  const [rosterData, setRosterData] = useState<RosterItem[]>([]);
  const [allRosterData, setAllRosterData] = useState<RosterItem[]>([]); // Store all data
  const [loading, setLoading] = useState(true);

  // API call to fetch roster data
  const fetchRosterData = async () => {
    setLoading(true);
    try {
      const apiUrl = isSmartSecureRoster
        ? getFullUrl(
            `/spree/manage/user_roasters/load_roasters.json?society_id=${encodeURIComponent(
              getSmartSecureSocietyId()
            )}`
          )
        : getFullUrl('/pms/admin/user_roasters.json');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      const rosterItems = getRosterItems(data);

      // Transform API data to match our interface
      const transformedData: RosterItem[] = rosterItems.map((item: any) => {
        // Handle shift information
        let shiftInfo = 'Not specified';
        if (item.shift) {
          shiftInfo = item.shift;
        } else if (item.user_shift && item.user_shift.timings) {
          shiftInfo = item.user_shift.timings;
        }

        // Handle location
        let locationInfo = 'Not specified';
        if (item.location) {
          locationInfo = item.location;
        }

        // Handle created date
        let createdDate = 'Not available';
        if (item.created_at) {
          try {
            createdDate = new Date(item.created_at).toLocaleDateString('en-GB');
          } catch (e) {
            createdDate = item.created_at;
          }
        } else if (item.created_on) {
          createdDate = item.created_on;
        }

        // Handle created by
        let createdByInfo = 'System';
        if (item.created_by) {
          createdByInfo = item.created_by;
        } else if (item.created_by_name) {
          createdByInfo = item.created_by_name;
        }

        return {
          id: item.id,
          template: item.name || item.template || 'Unnamed Template',
          location: locationInfo,
          shift: shiftInfo,
          rosterType: item.roaster_type || item.allocation_type || 'Permanent',
          createdOn: createdDate,
          createdBy: createdByInfo,
          active: item.active !== undefined ? item.active : true
        };
      });

      setAllRosterData(transformedData);
      console.log('Transformed Data Count:', transformedData.length);
      console.log('First Item:', transformedData[0]);
    } catch (error: any) {
      console.error('Error fetching roster data:', error);
      toast.error(`Failed to load roster data: ${error.message}`, {
        duration: 5000,
      });
      
      setAllRosterData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchRosterData();
  }, []);

  // Reset pagination when roster data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [allRosterData.length]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Filter and paginate data
  const filteredRosterData = useMemo(() => {
    if (!allRosterData || !Array.isArray(allRosterData)) return [];
    
    return allRosterData.filter(item => {
      if (!debouncedSearchQuery.trim()) return true;
      
      const searchLower = debouncedSearchQuery.toLowerCase();
      return (
        item.template.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower) ||
        item.shift.toLowerCase().includes(searchLower) ||
        item.createdBy.toLowerCase().includes(searchLower) ||
        item.createdOn.includes(debouncedSearchQuery)
      );
    });
  }, [allRosterData, debouncedSearchQuery]);

  // Pagination calculations
  const totalItems = filteredRosterData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRosterData = filteredRosterData.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Render row function for enhanced table
  const renderRow = (roster: RosterItem) => ({
    actions: (
      <div className="flex items-center gap-2">
        {shouldShow("Roster", "show") && (
          <button 
            onClick={() => handleView(roster.id)} 
            className="p-1 text-black hover:bg-gray-100 rounded" 
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        {shouldShow("Roster", "update") && (
          <button 
            onClick={() => handleEdit(roster.id)} 
            className="p-1 text-black hover:bg-gray-100 rounded" 
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
      </div>
    ),
    template: (
      <div className="font-medium text-gray-900 max-w-xs truncate" title={roster.template}>
        {roster.template}
      </div>
    ),
    location: (
      <span className="text-sm text-gray-600">{roster.location}</span>
    ),
    shift: (
      <span className="text-sm text-gray-600 whitespace-nowrap">{roster.shift}</span>
    ),
    rosterType: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        {roster.rosterType}
      </span>
    ),
    createdOn: (
      <span className="text-sm text-gray-600">{roster.createdOn}</span>
    ),
    createdBy: (
      <span className="text-sm text-gray-600">{roster.createdBy || '-'}</span>
    )
  });

  const handleView = (id: number) => {
    console.log('View roster:', id);
    navigate(`${rosterBasePath}/detail/${id}`);
  };

  const handleEdit = (id: number) => {
    console.log('Edit roster:', id);
    navigate(`${rosterBasePath}/edit/${id}`);
  };

  const handleAdd = () => {
    navigate(`${rosterBasePath}/create`);
  };

  const handleExport = () => {
    setIsExportOpen(true);
  };

  const handleBulkUpload = () => {
    setIsBulkUploadOpen(true);
  };

  const handleFilter = () => {
    setIsFilterOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C72030]/10 text-[#C72030] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide uppercase">Roster Management</h1>
            <p className="text-gray-600">Manage roster templates and schedules</p>
          </div>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
        </div>
      )}

      {!loading && (
        <div className=" ">
          <EnhancedTable
            data={currentRosterData}
            columns={columns}
            renderRow={renderRow}
            storageKey={tableStorageKey}
            enableSearch={true}
            searchTerm={searchTerm}
            searchValue={searchTerm}
            searchPlaceholder="Search rosters..."
            onSearchChange={handleSearch}
            disableClientSearch={true}
            enableExport={false}
            exportFileName="roster-data"
            leftActions={
              <div className="flex gap-2">
                {shouldShow("Roster", "create") && (
                  <Button 
                    onClick={handleAdd} 
                    className="flex items-center gap-2 bg-[#C72030] hover:bg-[#C72030]/90 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                )}
              </div>
            }
            pagination={false} // Disable built-in pagination since we're adding custom
            loading={loading}
            emptyMessage="No rosters found. Create your first roster to get started."
          />

          {/* Pagination Controls - matching BuildingPage style */}
          {allRosterData.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} rosters
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {/* Show first page */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(1)}
                        className="w-8 h-8 p-0"
                      >
                        1
                      </Button>
                      {currentPage > 4 && <span className="px-2">...</span>}
                    </>
                  )}

                  {/* Show pages around current page */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                    .map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}

                  {/* Show last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Modals */}
        {isBulkUploadOpen && (
          <BulkUploadModal
            isOpen={isBulkUploadOpen}
            onClose={() => setIsBulkUploadOpen(false)}
          />
        )}

        {isExportOpen && (
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
          />
        )}
      </div>
    );
  };
