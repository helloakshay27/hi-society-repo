import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { StaffHistoryFilterDialog, StaffHistoryFilters } from "@/components/StaffHistoryFilterDialog";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { RefreshCw, Download } from "lucide-react";
import { toast as sonnerToast } from "sonner";

interface StaffWorking {
  id: number;
  check_in: string;
  check_out: string | null;
  gate_in?: string;
  gate_out?: string | null;
  marked_in_by?: string;
  marked_out_by?: string;
  created_at: string;
}

interface StaffHistoryData {
  id: number;
  name: string;
  mobile_number: string;
  staff_type: string;
  work_type: string;
  company_name?: string;
  society_flat?: {
    flat_no: string;
  };
  staff_workings: StaffWorking[];
}

// Dummy data for preview (moved outside component)
const dummyStaffHistory: StaffHistoryData[] = [
    {
      id: 1,
      name: "Devesh J",
      mobile_number: "9564292626",
      staff_type: "Personal",
      work_type: "Contractor",
      company_name: "ABC Contractors",
      society_flat: { flat_no: "A - 101" },
      staff_workings: [
        {
          id: 1,
          check_in: "2026-02-11T09:30:00",
          check_out: "2026-02-11T18:45:00",
          gate_in: "Main Gate",
          gate_out: "Main Gate",
          marked_in_by: "Godrej Living",
          marked_out_by: "Ubaid Hashmat",
          created_at: "2026-02-11T09:30:00"
        }
      ]
    },
    {
      id: 2,
      name: "Ganesh G",
      mobile_number: "9619146262",
      staff_type: "Personal",
      work_type: "Contractor",
      company_name: "Lockated",
      society_flat: { flat_no: "C - 1003, A - 100, A - 101" },
      staff_workings: [
        {
          id: 2,
          check_in: "2026-02-10T14:15:00",
          check_out: "2026-02-10T17:30:00",
          gate_in: "Main Gate",
          gate_out: "Main Gate",
          marked_in_by: "Ubaid Hashmat",
          marked_out_by: "Ubaid Hashmat",
          created_at: "2026-02-10T14:15:00"
        }
      ]
    },
    {
      id: 3,
      name: "Deepak Gupta",
      mobile_number: "7379040962",
      staff_type: "Personal",
      work_type: "Caretaker",
      society_flat: { flat_no: "A - 101, B - 201" },
      staff_workings: [
        {
          id: 3,
          check_in: "2026-02-09T08:00:00",
          check_out: "2026-02-09T20:00:00",
          gate_in: "Deepak Gate",
          gate_out: "Deepak Gate",
          marked_in_by: "Manoj Prajapati",
          marked_out_by: "Manoj Prajapati",
          created_at: "2026-02-09T08:00:00"
        }
      ]
    },
    {
      id: 4,
      name: "Sagar Singh",
      mobile_number: "7355654056",
      staff_type: "Personal",
      work_type: "Caretaker",
      company_name: "Lockated",
      society_flat: { flat_no: "A - 101, C - (K) - 101, B - 101" },
      staff_workings: [
        {
          id: 4,
          check_in: "2026-02-08T10:20:00",
          check_out: "2026-02-08T19:15:00",
          gate_in: "Main Gate",
          gate_out: "Main Gate",
          marked_in_by: "Manoj Prajapati",
          marked_out_by: "Manoj Prajapati",
          created_at: "2026-02-08T10:20:00"
        }
      ]
    },
    {
      id: 5,
      name: "UMESH Gupta",
      mobile_number: "1316916165",
      staff_type: "Personal",
      work_type: "Driver",
      company_name: "Lockated",
      staff_workings: [
        {
          id: 5,
          check_in: "2026-02-11T12:00:00",
          check_out: "2026-02-11T12:40:00",
          gate_in: "Deepak Gate",
          gate_out: "Deepak Gate",
          marked_in_by: "Manoj Prajapati",
          marked_out_by: "Manoj Prajapati",
          created_at: "2026-02-11T12:00:00"
        }
      ]
    },
    {
      id: 6,
      name: "Ubaid Hashmat",
      mobile_number: "9560288500",
      staff_type: "Personal",
      work_type: "Contractor",
      society_flat: { flat_no: "A - 101" },
      staff_workings: [
        {
          id: 6,
          check_in: "2026-02-11T07:30:00",
          check_out: "2026-02-11T16:00:00",
          gate_in: "Main Gate",
          marked_in_by: "Manoj Prajapati",
          created_at: "2026-02-11T07:30:00"
        }
      ]
    },
    {
      id: 7,
      name: "Test User",
      mobile_number: "1800089887",
      staff_type: "Personal",
      work_type: "Caretaker",
      society_flat: { flat_no: "C - 1003, A - 100, A - 101" },
      staff_workings: [
        {
          id: 7,
          check_in: "2026-01-30T15:45:00",
          check_out: "2026-01-30T17:50:00",
          gate_in: "Deepak Gate",
          gate_out: "Deepak Gate",
          marked_in_by: "Manoj Prajapati",
          marked_out_by: "Manoj Prajapati",
          created_at: "2026-01-30T15:45:00"
        }
      ]
    },
    {
      id: 8,
      name: "Mathu Pol",
      mobile_number: "9876543210",
      staff_type: "Personal",
      work_type: "Housekeeping",
      company_name: "Clean Services",
      society_flat: { flat_no: "B - 205" },
      staff_workings: [
        {
          id: 8,
          check_in: "2026-02-09T11:00:00",
          check_out: "2026-02-09T18:30:00",
          gate_in: "Main Gate",
          gate_out: "Main Gate",
          marked_in_by: "Security",
          marked_out_by: "Security",
          created_at: "2026-02-09T11:00:00"
        }
      ]
    }
  ];

const SmartSecureStaffsHistory: React.FC = () => {
  const { toast } = useToast();
  const [staffHistory, setStaffHistory] = useState<StaffHistoryData[]>([]);
  const [filteredStaffHistory, setFilteredStaffHistory] = useState<StaffHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<StaffHistoryFilters>({});
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 20;

  // Fetch staff history from API
  const fetchStaffHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // For now, use dummy data
      // In production, uncomment this API call:
      // const response = await fetch(getFullUrl('/crm/admin/society_staffs.json'), {
      //   headers: getAuthHeader()
      // });
      // if (response.ok) {
      //   const data = await response.json();
      //   setStaffHistory(data.society_staffs || []);
      //   setFilteredStaffHistory(data.society_staffs || []);
      // }
      
      setStaffHistory(dummyStaffHistory);
      setFilteredStaffHistory(dummyStaffHistory);
      setTotalPages(Math.ceil(dummyStaffHistory.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching staff history:', error);
      toast({
        title: "Error",
        description: "Failed to load staff history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStaffHistory();
  }, [fetchStaffHistory]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      const filtered = staffHistory.filter(staff =>
        staff.name.toLowerCase().includes(query.toLowerCase()) ||
        staff.mobile_number.includes(query)
      );
      setFilteredStaffHistory(filtered);
    } else {
      setFilteredStaffHistory(staffHistory);
    }
    
    setCurrentPage(1);
  }, [staffHistory]);

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    
    const loadingToastId = sonnerToast.loading("Preparing staff history export...", {
      duration: Infinity,
    });

    try {
      // In production, implement actual export functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      sonnerToast.success("Staff history exported successfully!", {
        id: loadingToastId,
      });
    } catch (error) {
      console.error('Export failed:', error);
      sonnerToast.error("Failed to export staff history", {
        id: loadingToastId,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Selection handlers
  const handleStaffSelection = (staffId: string, isSelected: boolean) => {
    setSelectedStaff(prev => {
      if (isSelected) {
        return [...prev, staffId];
      } else {
        return prev.filter(id => id !== staffId);
      }
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allStaffIds = filteredStaffHistory.map(staff => staff.id.toString());
      setSelectedStaff(allStaffIds);
    } else {
      setSelectedStaff([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedStaff([]);
  };

  // Define columns for EnhancedTable
  const columns = [
    { key: 'actions', label: 'Actions', sortable: false },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'mobile_number', label: 'Mobile Number', sortable: true },
    { key: 'staff_type', label: 'Staff Type', sortable: true },
    { key: 'work_type', label: 'Work Type', sortable: true },
    { key: 'associated_flats', label: 'Associated Flats', sortable: false },
    { key: 'company_name', label: 'Company Name', sortable: true },
    { key: 'in_date', label: 'In Date', sortable: true },
    { key: 'in_time', label: 'In Time', sortable: false },
    { key: 'in_gate', label: 'In Gate', sortable: true },
    { key: 'marked_in_by', label: 'Marked In By', sortable: true },
    { key: 'out_date', label: 'Out Date', sortable: true },
    { key: 'out_time', label: 'Out Time', sortable: false },
    { key: 'out_gate', label: 'Out Gate', sortable: true },
    { key: 'marked_out_by', label: 'Marked Out By', sortable: true },
    { key: 'checkin_date', label: 'Checkin Date', sortable: true },
    { key: 'checkin_time', label: 'Checkin Time', sortable: false },
    { key: 'checkout_date', label: 'Checkout Date', sortable: true },
    { key: 'checkout_time', label: 'Checkout Time', sortable: false },
    { key: 'created_on', label: 'Created On', sortable: true },
  ];

  // Render cell content
  const renderCell = (staff: StaffHistoryData, columnKey: string) => {
    const latestWorking = staff.staff_workings[0] || {};
    const checkInDateTime = latestWorking.check_in ? formatDateTime(latestWorking.check_in) : { date: '-', time: '-' };
    const checkOutDateTime = latestWorking.check_out ? formatDateTime(latestWorking.check_out) : { date: '-', time: '-' };
    const createdDateTime = latestWorking.created_at ? formatDateTime(latestWorking.created_at) : { date: '-', time: '-' };

    switch (columnKey) {
      case 'actions':
        return (
          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(staff.id)}>
            View
          </Button>
        );
      case 'name':
        return <span className="font-medium">{staff.name}</span>;
      case 'mobile_number':
        return staff.mobile_number;
      case 'staff_type':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
            {staff.staff_type}
          </span>
        );
      case 'work_type':
        return staff.work_type;
      case 'associated_flats':
        return staff.society_flat?.flat_no || '-';
      case 'company_name':
        return staff.company_name || '-';
      case 'in_date':
        return checkInDateTime.date;
      case 'in_time':
        return checkInDateTime.time;
      case 'in_gate':
        return latestWorking.gate_in || '-';
      case 'marked_in_by':
        return latestWorking.marked_in_by || '-';
      case 'out_date':
        return checkOutDateTime.date;
      case 'out_time':
        return checkOutDateTime.time;
      case 'out_gate':
        return latestWorking.gate_out || '-';
      case 'marked_out_by':
        return latestWorking.marked_out_by || '-';
      case 'checkin_date':
        return checkInDateTime.date;
      case 'checkin_time':
        return checkInDateTime.time;
      case 'checkout_date':
        return checkOutDateTime.date;
      case 'checkout_time':
        return checkOutDateTime.time;
      case 'created_on':
        return createdDateTime.date;
      default:
        return '-';
    }
  };

  const handleViewDetails = (staffId: number) => {
    // Implement view details functionality
    toast({
      title: "View Details",
      description: `Viewing details for staff ID: ${staffId}`,
    });
  };

  const renderCustomActions = () => (
    <div className="flex gap-3">
      <Button
        onClick={() => fetchStaffHistory()}
        variant="outline"
        className="flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </Button>
    </div>
  );

  const handleFilterApply = (newFilters: StaffHistoryFilters) => {
    setFilters(newFilters);
    // Apply filters to staff history
    // In production, this would make an API call with filter parameters
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-GB');
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date: dateStr, time: timeStr };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Staff History</h1>
      </div>

      {/* Enhanced Table */}
      <EnhancedTable
        data={filteredStaffHistory || []}
        columns={columns}
        renderCell={renderCell}
        selectable={true}
        pagination={false}
        enableExport={true}
        exportFileName="staff-history"
        handleExport={handleExport}
        storageKey="staff-history-table"
        enableSelection={true}
        selectedItems={selectedStaff}
        onSelectItem={handleStaffSelection}
        onSelectAll={handleSelectAll}
        getItemId={staff => staff.id.toString()}
        leftActions={
          <div className="flex gap-3">
            {renderCustomActions()}
          </div>
        }
        onFilterClick={() => setIsFilterOpen(true)}
        rightActions={null}
        searchPlaceholder="Search by name or mobile number"
        onSearchChange={handleSearch}
        hideTableExport={false}
        hideColumnsButton={false}
        className="transition-all duration-500 ease-in-out"
        loading={isLoading}
        loadingMessage="Loading staff history..."
      />

      {/* Custom Pagination */}
      <div className="flex items-center justify-center mt-6 px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-1">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = currentPage <= 3 
                ? i + 1 
                : currentPage >= totalPages - 2 
                  ? totalPages - 4 + i 
                  : currentPage - 2 + i;
              
              if (pageNumber < 1 || pageNumber > totalPages) return null;
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  disabled={isLoading}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  } disabled:opacity-50`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || isLoading}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Page info */}
        <div className="ml-4 text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Filter Dialog */}
      <StaffHistoryFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleFilterApply}
      />
    </div>
  );
};

export default SmartSecureStaffsHistory;
