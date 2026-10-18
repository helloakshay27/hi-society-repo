import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Download, Filter, Upload, Printer, QrCode, Eye, Edit, Trash2, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BulkUploadModal } from '@/components/BulkUploadModal';
import { ExportModal } from '@/components/ExportModal';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { ColumnConfig } from '@/hooks/useEnhancedTable';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
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

interface RosterApiItem {
  id: number;
  name?: string;
  template?: string;
  location?: string | null;
  shift?: string | null;
  timings?: string | null;
  user_shift?: {
    timings?: string | null;
    shift?: string | null;
  };
  roaster_type?: string | null;
  allocation_type?: string | null;
  created_on?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  creator_name?: string | null;
  user_name?: string | null;
  site_name?: string | null;
  resource_name?: string | null;
  building_name?: string | null;
  active?: boolean;
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

const getRosterItems = (data: unknown): RosterApiItem[] => {
  if (Array.isArray(data)) return data;

  if (!data || typeof data !== 'object') return [];

  const rosterData = data as {
    user_roasters?: RosterApiItem[];
    roasters?: RosterApiItem[];
    rosters?: RosterApiItem[];
    data?: {
      user_roasters?: RosterApiItem[];
      roasters?: RosterApiItem[];
      rosters?: RosterApiItem[];
    } | RosterApiItem[];
  };

  const candidates = [
    rosterData.user_roasters,
    rosterData.roasters,
    rosterData.rosters,
    rosterData.data,
    Array.isArray(rosterData.data) ? rosterData.data : rosterData.data?.user_roasters,
    Array.isArray(rosterData.data) ? rosterData.data : rosterData.data?.roasters,
    Array.isArray(rosterData.data) ? rosterData.data : rosterData.data?.rosters,
  ];

  const firstMatch = candidates.find((candidate): candidate is RosterApiItem[] => Array.isArray(candidate));
  return firstMatch || [];
};

const formatRosterDate = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Not available';
  }

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString('en-GB');
  }

  return value;
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
  const fetchRosterData = useCallback(async () => {
    setLoading(true);
    try {
      const societyId = encodeURIComponent(getSmartSecureSocietyId());
      const apiUrl = isSmartSecureRoster
        ? getFullUrl(
            `/spree/manage/user_roasters.json?page=1&per_page=${itemsPerPage}&society_id=${societyId}`
          )
        : getFullUrl(
            `/pms/admin/user_roasters.json?page=1&per_page=${itemsPerPage}`
          );
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
      const rosterItems = getRosterItems(data);

      // Transform API data to match our interface
      const transformedData: RosterItem[] = rosterItems.map((item) => {
        const shiftInfo =
          item.shift ||
          item.timings ||
          item.user_shift?.timings ||
          item.user_shift?.shift ||
          'Not specified';

        const locationInfo =
          item.location ||
          item.site_name ||
          item.resource_name ||
          item.building_name ||
          'Not specified';

        const createdDate = formatRosterDate(
          item.created_on || item.created_at || item.createdAt
        );

        const createdByInfo =
          item.created_by ||
          item.created_by_name ||
          item.creator_name ||
          item.user_name ||
          'System';

        return {
          id: item.id,
          template: item.name || item.template || 'Unnamed Template',
          location: locationInfo,
          shift: shiftInfo,
          rosterType: item.roaster_type || item.allocation_type || 'User',
          createdOn: createdDate,
          createdBy: createdByInfo,
          active: item.active !== undefined ? item.active : true
        };
      });

      setAllRosterData(transformedData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching roster data:', error);
      toast.error(`Failed to load roster data: ${message}`, {
        duration: 5000,
      });
      
      setAllRosterData([]);
    } finally {
      setLoading(false);
    }
  }, [isSmartSecureRoster, itemsPerPage]);

  // Load data on component mount
  useEffect(() => {
    fetchRosterData();
  }, [fetchRosterData]);

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

  const renderPaginationItems = () => {
    const pageLink = (i: number) => (
      <PaginationItem key={i}>
        <PaginationLink
          className="cursor-pointer"
          onClick={() => goToPage(i)}
          isActive={currentPage === i}
        >
          {i}
        </PaginationLink>
      </PaginationItem>
    );
    const ellipsis = (key: string) => (
      <PaginationItem key={key}>
        <PaginationEllipsis />
      </PaginationItem>
    );

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => pageLink(i + 1));
    }

    const items = [pageLink(1)];
    if (currentPage <= 3) {
      for (let i = 2; i <= 4; i++) items.push(pageLink(i));
      items.push(ellipsis('ellipsis1'));
    } else if (currentPage >= totalPages - 2) {
      items.push(ellipsis('ellipsis1'));
      for (let i = totalPages - 3; i < totalPages; i++) items.push(pageLink(i));
    } else {
      items.push(ellipsis('ellipsis1'));
      for (let i = currentPage - 1; i <= currentPage + 1; i++) items.push(pageLink(i));
      items.push(ellipsis('ellipsis2'));
    }
    items.push(pageLink(totalPages));
    return items;
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
    navigate(`${rosterBasePath}/detail/${id}`);
  };

  const handleEdit = (id: number) => {
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
          <div>
            <h1 className="text-xl font-bold tracking-wide uppercase">Roster Management</h1>
            <p className="text-gray-600">Manage roster templates and schedules</p>
          </div>
        </div>
      </header>

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
variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium"                   >
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

          {/* Pagination - same as Visitors dashboard */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={goToPrevious}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={goToNext}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
          </div>

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
