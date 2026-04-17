
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Filter, Eye, Edit, QrCode, Search } from 'lucide-react';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { StaffsFilterModal } from '@/components/StaffsFilterModal';
import { StaffSelectionPanel } from '@/components/StaffSelectionPanel';
import { StaffActionsPanel } from '@/components/StaffActionsPanel';
import { BulkUploadDialog } from '@/components/BulkUploadDialog';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { ColumnConfig } from '@/hooks/useEnhancedTable';
import { fetchSocietyStaffs, searchSocietyStaffs, NewSocietyStaff, PaginationInfo, StaffFilters } from '@/services/societyStaffsAPI';
import { staffService } from '@/services/staffService';
import { toast } from 'sonner';
import { apiClient } from '@/utils/apiClient';
import { API_CONFIG } from '@/config/apiConfig';

// Column configuration for the enhanced table
const columns: ColumnConfig[] = [
  { key: 'actions', label: 'Action', sortable: false, hideable: false, draggable: false, width: '90px', excludeFromExport: true },
  { key: 'image', label: 'Image', sortable: false, hideable: true, draggable: true, width: '70px', excludeFromExport: true },
  { key: 'id', label: 'ID', sortable: true, hideable: true, draggable: true, width: '80px' },
  { key: 'name', label: 'Name', sortable: true, hideable: true, draggable: true },
  { key: 'associatedFlats', label: 'Associated Flats', sortable: false, hideable: true, draggable: true },
  { key: 'email', label: 'Email', sortable: true, hideable: true, draggable: true },
  { key: 'mobile', label: 'Mobile', sortable: true, hideable: true, draggable: true },
  { key: 'staffId', label: 'Staff Id', sortable: true, hideable: true, draggable: true },
  { key: 'workType', label: 'Work Type', sortable: true, hideable: true, draggable: true },
  { key: 'companyName', label: 'Company Name', sortable: true, hideable: true, draggable: true },
  { key: 'createdAt', label: 'Created At', sortable: true, hideable: true, draggable: true },
  { key: 'staffType', label: 'Staff Type', sortable: true, hideable: true, draggable: true },
  { key: 'status', label: 'Status', sortable: true, hideable: true, draggable: true, width: '100px' }
];

const getStatusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-600 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-600 border-yellow-200';
    case 'rejected':
      return 'bg-red-100 text-red-600 border-red-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const StaffsDashboard = () => {
  const navigate = useNavigate();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffs, setSelectedStaffs] = useState<string[]>([]);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // API state management
  const [apiStaffsData, setApiStaffsData] = useState<NewSocietyStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_count: 0,
    total_pages: 1
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [resourceId, setResourceId] = useState<string>(''); // Resource ID for print all QR codes
  const [printingAll, setPrintingAll] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'import' | 'update'>('import');
  const [isExporting, setIsExporting] = useState(false);
  const [activeFilters, setActiveFilters] = useState<StaffFilters>({});

  // Get resource ID from user data in localStorage or account API
  useEffect(() => {
    const loadResourceId = async () => {
      try {
        // First try: get from the user object's lock_role.company_id
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const companyId = user?.lock_role?.company_id;
          if (companyId) {
            setResourceId(String(companyId));
            console.warn('✅ Resource ID loaded from user lock_role:', companyId);
            return;
          }
        }

        // Second try: check direct localStorage keys
        const directKeys = ['resource_id', 'society_id', 'company_id', 'resourceId'];
        for (const key of directKeys) {
          const val = localStorage.getItem(key);
          if (val) {
            setResourceId(val);
            console.warn('✅ Resource ID loaded from localStorage key:', key, val);
            return;
          }
        }

        // Third try: fetch from account API
        const token = localStorage.getItem('token');
        if (token) {
          const baseUrl = localStorage.getItem('baseUrl') || 'https://hi-society.lockated.com';
          const normalizedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
          const response = await fetch(`${normalizedBaseUrl}/api/users/account.json`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const accountData = await response.json();
            const accResourceId = accountData?.resource_id || accountData?.company_id || accountData?.lock_role?.company_id;
            if (accResourceId) {
              setResourceId(String(accResourceId));
              console.warn('✅ Resource ID loaded from account API:', accResourceId);
              return;
            }
          }
        }

        console.warn('⚠️ No resource ID found from any source');
      } catch (error) {
        console.error('Error getting resource ID:', error);
      }
    };

    loadResourceId();
  }, []);

  // Fetch staff data from API
  useEffect(() => {
    const loadStaffsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (activeSearchQuery.trim()) {
          response = await searchSocietyStaffs(activeSearchQuery, currentPage, activeFilters);
        } else {
          response = await fetchSocietyStaffs(currentPage, undefined, activeFilters);
        }
        
        // Handle both old and new API response formats
        const staffsList = response.data || response.society_staffs || [];
        
        setApiStaffsData(staffsList as NewSocietyStaff[]);
        
        // Normalize pagination data
        setPagination({
          current_page: response.pagination.current_page || response.pagination.page || currentPage,
          total_count: response.pagination.total_count,
          total_pages: response.pagination.total_pages
        });
      } catch (err) {
        console.error('❌ Error loading staffs data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load staffs data');
        toast.error('Failed to load staffs data');
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };

    loadStaffsData();
  }, [currentPage, activeSearchQuery, activeFilters]);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.total_pages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Generate pagination items like other dashboards
  const renderPaginationItems = () => {
    const items = [];
    const totalPages = pagination.total_pages;
    const currentPageState = currentPage; // Use local state instead of API response

    if (totalPages <= 10) {
      // Show all pages if total is 10 or less
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageClick(i)}
              isActive={currentPageState === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show smart pagination for more than 10 pages
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageClick(1)}
            isActive={currentPageState === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is far from start
      if (currentPageState > 4) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      const start = Math.max(2, currentPageState - 1);
      const end = Math.min(totalPages - 1, currentPageState + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => handlePageClick(i)}
                isActive={currentPageState === i}
                className="cursor-pointer"
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      // Show ellipsis if current page is far from end
      if (currentPageState < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page (if different from first)
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageClick(totalPages)}
              isActive={currentPageState === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const handlePrintQR = async () => {
    if (selectedStaffs.length === 0) {
      toast.error('Please select staff members to print QR codes');
      return;
    }

    try {
      
      // Convert string IDs to numbers for the API
      const staffIds = selectedStaffs.map(id => parseInt(id, 10));
      
      await staffService.printQRCodes(staffIds);
      
      // Clear selections after successful print
      setSelectedStaffs([]);
    } catch (error) {
      console.error('Failed to print QR codes:', error);
      // Error is already handled in the service with toast
    }
  };

  const handlePrintAllQR = async () => {
    console.warn('🔍 handlePrintAllQR called, resourceId:', resourceId);
    
    if (!resourceId) {
      console.error('❌ Resource ID not available');
      toast.error('Resource ID not available. Please ensure you are logged in with a valid society.');
      return;
    }

    console.warn('📤 Calling print all QR codes with resourceId:', resourceId);
    setPrintingAll(true);
    try {
      await staffService.printAllQRCodes(resourceId);
      console.warn('✅ Print all QR codes successful');
    } catch (error) {
      console.error('❌ Failed to print all QR codes:', error);
      // Error is already handled in the service with toast
    } finally {
      setPrintingAll(false);
    }
  };

  const handleAddStaff = () => {
    navigate('/smartsecure/staff/add');
  };

  const handleImportStaffs = () => {
    setUploadType('import');
    setIsBulkUploadOpen(true);
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const loadingToast = toast.loading('Preparing staff export...');
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.STAFF_EXPORT, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'society_staff.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Staff exported successfully', { id: loadingToast });
    } catch {
      toast.error('Failed to export staff. Please try again.', { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedStaffs([]);
  };

  const handleSearch = () => {
    if (searchTerm.trim() || activeSearchQuery) {
      setIsSearching(true);
      setCurrentPage(1);
      setActiveSearchQuery(searchTerm.trim());
      setSelectedStaffs([]);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchQuery('');
    setCurrentPage(1);
    setSelectedStaffs([]);
    setIsSearching(false);
  };

  const handleViewStaff = (staffId: string) => {
    navigate(`/smartsecure/staff/details/${staffId}`);
  };

  const handleEditStaff = (staffId: string) => {
    navigate(`/smartsecure/staff/edit/${staffId}`);
  };

  const handleDeleteStaff = (staffId: string) => {
    // Add delete functionality here
  };

  const handleStaffSelection = (staffId: string, checked: boolean) => {
    setSelectedStaffs(prev => 
      checked 
        ? [...prev, staffId]
        : prev.filter(id => id !== staffId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedStaffs(checked ? transformedApiData().map(staff => staff.id) : []);
  };

  // Transform API data to match table format
  const transformedApiData = () => {
    return apiStaffsData.map(staff => {
      // Format associated flats
      const flats = Array.isArray(staff.associated_flats) && staff.associated_flats.length > 0
        ? staff.associated_flats.map((flat: any) => flat.label || flat.name || flat).join(', ')
        : '--';

      return {
        id: staff.id.toString(),
        name: staff.name || '--',
        email: staff.email || '--',
        mobile: staff.mobile || '--',
        staffId: staff.staff_id || '--',
        workType: staff.work_type || '--',
        companyName: staff.company_name || '--',
        createdAt: staff.created_at_formatted || staff.created_at || '--',
        staffType: staff.staff_type || '--',
        status: staff.status?.label || 'Unknown',
        imageUrl: staff.image_url || '/images/male.jpg',
        qrCodeUrl: staff.qr_code_url || '',
        associatedFlats: flats,
        rawStatus: staff.status?.value || 0,
        isIn: false
      };
    });
  };

  const filteredData = (activeTab: string = 'all') => {
    const transformedData = transformedApiData();
    
    // Since search is now handled by API, we only filter by tab type
    // No need for local search filtering
    const baseData = activeTab === 'in' 
      ? transformedData.filter(staff => staff.isIn)
      : activeTab === 'out'
      ? transformedData.filter(staff => !staff.isIn)
      : transformedData;
    
    return baseData;
  };

  const filteredHistoryData = () => {
    return [] as any[]; // History data is loaded separately via the Staff History page
  };

  const renderRow = (staff: ReturnType<typeof transformedApiData>[0]) => ({
    actions: (
      <div className="flex justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewStaff(staff.id);
          }}
          className="p-2 h-8 w-8 hover:bg-accent"
          title="View staff"
        >
          <Eye className="w-4 h-4 text-gray-600 hover:text-[#C72030]" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEditStaff(staff.id);
          }}
          className="p-2 h-8 w-8 hover:bg-accent"
          title="Edit staff"
        >
          <Edit className="w-4 h-4 text-gray-600 hover:text-[#C72030]" />
        </Button>
      </div>
    ),
    image: (
      <div className="flex justify-center">
        <img
          src={staff.imageUrl.startsWith('http') ? staff.imageUrl : `https://www.lockated.com${staff.imageUrl}`}
          alt={staff.name}
          className="w-10 h-10 rounded-full object-cover border border-gray-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://www.lockated.com/images/male.jpg';
          }}
        />
      </div>
    ),
    id: <span className="font-medium">{staff.id}</span>,
    name: staff.name,
    associatedFlats: staff.associatedFlats,
    email: staff.email !== '--' ? <span className="text-blue-600">{staff.email}</span> : '--',
    mobile: staff.mobile,
    staffId: staff.staffId,
    workType: staff.workType,
    companyName: staff.companyName,
    createdAt: staff.createdAt,
    staffType: staff.staffType,
    status: (
      <Badge className={getStatusBadgeColor(staff.status)}>
        {staff.status}
      </Badge>
    )
  });

  // History columns configuration (kept for history tab if needed)
  const historyColumns: ColumnConfig[] = [
    { key: 'name', label: 'Name', sortable: true, hideable: true, draggable: true },
    { key: 'mobile', label: 'Mobile Number', sortable: true, hideable: true, draggable: true },
    { key: 'workType', label: 'Work Type', sortable: true, hideable: true, draggable: true },
    { key: 'staffType', label: 'Staff Type', sortable: true, hideable: true, draggable: true },
    { key: 'companyName', label: 'Company Name', sortable: true, hideable: true, draggable: true },
    { key: 'checkIn', label: 'Check-In', sortable: true, hideable: true, draggable: true },
    { key: 'checkOut', label: 'Check-Out', sortable: true, hideable: true, draggable: true },
    { key: 'in', label: 'In', sortable: false, hideable: true, draggable: true },
    { key: 'out', label: 'Out', sortable: false, hideable: true, draggable: true }
  ];

  const renderHistoryRow = (staff: any) => ({
    name: <span className="text-blue-600">{staff.name}</span>,
    mobile: staff.mobile,
    workType: staff.workType || staff.work_type || '--',
    staffType: staff.staffType || staff.staff_type || '--',
    companyName: staff.companyName || staff.company_name || '--',
    checkIn: staff.checkIn || '--',
    checkOut: staff.checkOut || '--',
    in: <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">{staff.gate || '--'}</span>,
    out: <span className="text-gray-600">{staff.gate || '--'}</span>
  });

  const renderCardView = (activeTab: string) => {
    const data = filteredData(activeTab);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {data.map((staff, index) => (
          <div key={staff.id || index} className="bg-white rounded-none border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
              <img
                src={staff.imageUrl.startsWith('http') ? staff.imageUrl : `https://www.lockated.com${staff.imageUrl}`}
                alt={staff.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://www.lockated.com/images/male.jpg';
                }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{staff.name}</h3>
              <p className="text-sm text-gray-600">{staff.mobile}</p>
              <p className="text-sm font-medium text-gray-800">{staff.workType}</p>
              <p className="text-sm text-gray-600">{staff.staffType}</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="bg-green-500 text-white px-2 py-1 rounded-none text-xs font-medium">
                {activeTab === 'in' ? 'In' : 'Out'}
              </span>
              {activeTab === 'out' && (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded-none"
                >
                  Check In
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* <h1 className="text-2xl font-bold text-gray-900 mb-6">Society Staffs</h1> */}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800 font-medium">Error loading staffs data</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 hover:bg-red-700 text-white"
            size="sm"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main Content */}
      <>
        {/* Staff Actions Panel */}
        {showActionMenu && (
          <StaffActionsPanel
            onAdd={handleAddStaff}
            onImport={handleImportStaffs}
            onClearSelection={() => setShowActionMenu(false)}
          />
        )}

        <Tabs defaultValue="all" className="w-full">
        {/* Tab Navigation */}
        {/* <div className="mb-4 pb-4">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="in"
              className="flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
            >
              In
            </TabsTrigger>
            <TabsTrigger
              value="out"
              className="flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
            >
              Out
            </TabsTrigger>
          </TabsList>
        </div> */}

        {/* History Tab Content */}
        <TabsContent value="history">
          <EnhancedTable
            data={filteredHistoryData()}
            columns={historyColumns}
            renderRow={renderHistoryRow}
            enableSearch={true}
            enableSelection={false}
            enableExport={true}
            storageKey="staff-history-table"
            emptyMessage="No history found"
            exportFileName="staff-history"
            searchPlaceholder="Search..."
            hideTableExport={false}
            hideColumnsButton={false}
          />
        </TabsContent>

        {/* All Tab Content */}
        <TabsContent value="all">
          {/* Search Bar for API Search */}
         

          {/* Search Results Summary */}
          {activeSearchQuery && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Search results for:</span> "{activeSearchQuery}"
                {pagination.total_count > 0 && (
                  <span className="ml-2">({pagination.total_count} results found)</span>
                )}
                <div className="text-xs text-blue-600 mt-1">
                  Page {currentPage} of {pagination.total_pages} • {apiStaffsData.length} items on this page
                </div>
              </div>
            </div>
          )}

          <EnhancedTable
            data={filteredData('all')}
            columns={columns}
            renderRow={renderRow}
            selectable={true}
            enableSearch={false} // Disable built-in search since we're using API search
            enableSelection={true}
            enableExport={true}
            storageKey="staff-table"
            loading={loading}
            emptyMessage={activeSearchQuery ? "No staff found for your search" : "No staff found"}
            exportFileName="staff-records"
            selectedItems={selectedStaffs}
            getItemId={(staff) => staff.id}
            onSelectItem={handleStaffSelection}
            onSelectAll={handleSelectAll}
            onFilterClick={() => setIsFilterModalOpen(true)}
            searchPlaceholder="Search..."
            hideTableExport={false}
            hideColumnsButton={false}
            handleExport={handleExport}
            leftActions={
              <Button
                onClick={() => setShowActionMenu(!showActionMenu)}
                style={{ backgroundColor: '#C72030' }}
                className="hover:bg-[#C72030]/90 text-white px-6 py-2 h-10 rounded-lg text-sm font-medium border-0 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Action
              </Button>
            }
          />
        </TabsContent>

        {/* In Tab Content */}
        <TabsContent value="in">
          {/* Search Bar */}
          <div className="flex gap-4 items-center mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search using staff's name or mobile number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-[#C72030] text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleSearch}
              style={{ backgroundColor: '#C72030' }}
              className="hover:bg-[#C72030]/90 text-white px-6 py-2 h-10 rounded-lg text-sm font-medium border-0"
            >
              Go!
            </Button>
          </div>
          {renderCardView('in')}
        </TabsContent>

        {/* Out Tab Content */}
        <TabsContent value="out">
          {/* Search Bar */}
          <div className="flex gap-4 items-center mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search using staff's name or mobile number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-[#C72030] text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleSearch}
              style={{ backgroundColor: '#C72030' }}
              className="hover:bg-[#C72030]/90 text-white px-6 py-2 h-10 rounded-lg text-sm font-medium border-0"
            >
              Go!
            </Button>
          </div>
          {renderCardView('out')}
        </TabsContent>
      </Tabs>
      </>
      {selectedStaffs.length > 0 && (
        <StaffSelectionPanel
          selectedCount={selectedStaffs.length}
          selectedStaffs={transformedApiData()
            .filter(staff => selectedStaffs.includes(staff.id))
            .map(staff => ({
              id: staff.id,
              name: staff.name
            }))}
          selectedStaffIds={selectedStaffs}
          isAllSelected={selectedStaffs.length === transformedApiData().length && transformedApiData().length > 0}
          totalStaffCount={transformedApiData().length}
          isLoading={printingAll}
          onPrintQRCode={handlePrintQR}
          onPrintAllQRCodes={handlePrintAllQR}
          onClearSelection={handleClearSelection}
        />
      )}
      
      {/* Pagination Controls */}
      {!error && pagination.total_pages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={handlePreviousPage}
                  className={
                    currentPage === 1 
                      ? "pointer-events-none opacity-50" 
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext
                  onClick={handleNextPage}
                  className={
                    currentPage === pagination.total_pages 
                      ? "pointer-events-none opacity-50" 
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Results Summary */}
      {/* {!loading && !error && pagination.total_count > 0 && (
        <div className="text-center mt-2 text-sm text-gray-600">
          Showing page {currentPage} of {pagination.total_pages} ({pagination.total_count} total staff members)
        </div>
      )} */}

      {/* Filter Modal */}
      <StaffsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={(filters) => {
          setActiveFilters(filters);
          setCurrentPage(1);
          setSelectedStaffs([]);
        }}
      />
      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        title={uploadType === 'import' ? 'Import Staff' : 'Update Staff'}
        context="staff"
      />    </div>
  );
};
