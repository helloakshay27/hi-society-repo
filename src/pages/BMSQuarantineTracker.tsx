import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye, Edit, Trash2, Download, RefreshCw, Loader2, Activity, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface QuarantineRecord {
  id: string;
  residentName: string;
  tower: string;
  flat: string;
  contactNumber: string;
  quarantineType: string;
  status: "In Quarantine" | "Completed" | "Under Observation" | "Cleared";
  startDate: string;
  endDate: string;
  healthStatus: "Stable" | "Improving" | "Critical" | "Recovered";
  lastCheckup: string;
  temperature: string;
  symptoms: string;
  testResult: "Positive" | "Negative" | "Pending" | "Not Tested";
  emergencyContact: string;
  createdOn: string;
  createdBy: string;
}

const BMSQuarantineTracker: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Mock data query (replace with actual API call)
  const {
    data: quarantineData,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["quarantine-tracker", debouncedSearchQuery, currentPage, pageSize],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // Mock data for demonstration
      const mockData: QuarantineRecord[] = [
        {
          id: "1",
          residentName: "Ubaid Hashmat",
          tower: "A",
          flat: "101",
          contactNumber: "+91 98765 43210",
          quarantineType: "COVID-19",
          status: "Completed",
          startDate: "01/01/2025",
          endDate: "15/01/2025",
          healthStatus: "Recovered",
          lastCheckup: "14/01/2025 10:00AM",
          temperature: "98.6°F",
          symptoms: "None",
          testResult: "Negative",
          emergencyContact: "+91 98765 43211",
          createdOn: "01/01/2025 09:30AM",
          createdBy: "Admin",
        },
        {
          id: "2",
          residentName: "Godrej Living",
          tower: "FM",
          flat: "Office",
          contactNumber: "+91 98765 43212",
          quarantineType: "COVID-19",
          status: "In Quarantine",
          startDate: "10/01/2025",
          endDate: "24/01/2025",
          healthStatus: "Stable",
          lastCheckup: "23/01/2025 11:30AM",
          temperature: "99.2°F",
          symptoms: "Mild cough",
          testResult: "Positive",
          emergencyContact: "+91 98765 43213",
          createdOn: "10/01/2025 08:15AM",
          createdBy: "Admin",
        },
        {
          id: "3",
          residentName: "Deepak Gupta",
          tower: "A",
          flat: "104",
          contactNumber: "+91 98765 43214",
          quarantineType: "Flu",
          status: "Under Observation",
          startDate: "15/01/2025",
          endDate: "22/01/2025",
          healthStatus: "Improving",
          lastCheckup: "22/01/2025 02:45PM",
          temperature: "98.4°F",
          symptoms: "Fever subsided",
          testResult: "Not Tested",
          emergencyContact: "+91 98765 43215",
          createdOn: "15/01/2025 10:20AM",
          createdBy: "Admin",
        },
        {
          id: "4",
          residentName: "Prashant Sangle",
          tower: "A",
          flat: "101",
          contactNumber: "+91 98765 43216",
          quarantineType: "COVID-19",
          status: "Cleared",
          startDate: "05/01/2025",
          endDate: "19/01/2025",
          healthStatus: "Recovered",
          lastCheckup: "19/01/2025 09:15AM",
          temperature: "98.6°F",
          symptoms: "None",
          testResult: "Negative",
          emergencyContact: "+91 98765 43217",
          createdOn: "05/01/2025 11:00AM",
          createdBy: "Admin",
        },
        {
          id: "5",
          residentName: "Ashik Bhattacharya",
          tower: "GL",
          flat: "Team",
          contactNumber: "+91 98765 43218",
          quarantineType: "COVID-19",
          status: "In Quarantine",
          startDate: "18/01/2025",
          endDate: "01/02/2025",
          healthStatus: "Stable",
          lastCheckup: "24/01/2025 03:30PM",
          temperature: "99.0°F",
          symptoms: "Sore throat",
          testResult: "Positive",
          emergencyContact: "+91 98765 43219",
          createdOn: "18/01/2025 01:45PM",
          createdBy: "Admin",
        },
        {
          id: "6",
          residentName: "Samay Seth",
          tower: "A",
          flat: "102",
          contactNumber: "+91 98765 43220",
          quarantineType: "Flu",
          status: "Completed",
          startDate: "08/01/2025",
          endDate: "15/01/2025",
          healthStatus: "Recovered",
          lastCheckup: "15/01/2025 04:00PM",
          temperature: "98.6°F",
          symptoms: "None",
          testResult: "Not Tested",
          emergencyContact: "+91 98765 43221",
          createdOn: "08/01/2025 09:45AM",
          createdBy: "Admin",
        },
        {
          id: "7",
          residentName: "Godrej Living Staff",
          tower: "FM",
          flat: "Office",
          contactNumber: "+91 98765 43222",
          quarantineType: "COVID-19",
          status: "Under Observation",
          startDate: "20/01/2025",
          endDate: "27/01/2025",
          healthStatus: "Improving",
          lastCheckup: "24/01/2025 10:30AM",
          temperature: "98.8°F",
          symptoms: "Mild fatigue",
          testResult: "Pending",
          emergencyContact: "+91 98765 43223",
          createdOn: "20/01/2025 12:00PM",
          createdBy: "Admin",
        },
        {
          id: "8",
          residentName: "Resident A-201",
          tower: "A",
          flat: "201",
          contactNumber: "+91 98765 43224",
          quarantineType: "COVID-19",
          status: "In Quarantine",
          startDate: "22/01/2025",
          endDate: "05/02/2025",
          healthStatus: "Stable",
          lastCheckup: "24/01/2025 11:45AM",
          temperature: "99.3°F",
          symptoms: "Headache, body ache",
          testResult: "Positive",
          emergencyContact: "+91 98765 43225",
          createdOn: "22/01/2025 02:30PM",
          createdBy: "Admin",
        },
        {
          id: "9",
          residentName: "Senior Citizen A-301",
          tower: "A",
          flat: "301",
          contactNumber: "+91 98765 43226",
          quarantineType: "COVID-19",
          status: "Cleared",
          startDate: "03/01/2025",
          endDate: "17/01/2025",
          healthStatus: "Recovered",
          lastCheckup: "17/01/2025 01:15PM",
          temperature: "98.6°F",
          symptoms: "None",
          testResult: "Negative",
          emergencyContact: "+91 98765 43227",
          createdOn: "03/01/2025 08:30AM",
          createdBy: "Admin",
        },
        {
          id: "10",
          residentName: "Team Member GL",
          tower: "GL",
          flat: "Team",
          contactNumber: "+91 98765 43228",
          quarantineType: "Flu",
          status: "Under Observation",
          startDate: "21/01/2025",
          endDate: "28/01/2025",
          healthStatus: "Improving",
          lastCheckup: "24/01/2025 04:30PM",
          temperature: "98.5°F",
          symptoms: "Cough reducing",
          testResult: "Not Tested",
          emergencyContact: "+91 98765 43229",
          createdOn: "21/01/2025 10:15AM",
          createdBy: "Admin",
        },
      ];

      return {
        quarantineRecords: mockData,
        pagination: {
          total_count: mockData.length,
          total_pages: Math.ceil(mockData.length / pageSize),
          current_page: currentPage,
        },
      };
    },
    retry: 2,
    staleTime: 30000,
    gcTime: 60000,
  });

  const quarantineRecords: QuarantineRecord[] = quarantineData?.quarantineRecords || [];
  const totalCount = quarantineData?.pagination?.total_count || 0;
  const totalPages = quarantineData?.pagination?.total_pages || 1;

  const columns = [
    { key: "residentName", label: "Resident Name", sortable: true },
    { key: "tower", label: "Tower", sortable: true },
    { key: "flat", label: "Flat", sortable: true },
    { key: "contactNumber", label: "Contact", sortable: false },
    { key: "quarantineType", label: "Type", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "healthStatus", label: "Health Status", sortable: true },
    { key: "startDate", label: "Start Date", sortable: true },
    { key: "endDate", label: "End Date", sortable: true },
    { key: "lastCheckup", label: "Last Checkup", sortable: true },
    { key: "temperature", label: "Temperature", sortable: false },
    { key: "symptoms", label: "Symptoms", sortable: false },
    { key: "testResult", label: "Test Result", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  const handleAddRecord = () => {
    navigate("/quarantine-tracker/add");
  };

  const handleViewRecord = (item: QuarantineRecord) => {
    navigate(`/quarantine-tracker/view/${item.id}`);
  };

  const handleEditRecord = (item: QuarantineRecord) => {
    navigate(`/quarantine-tracker/edit/${item.id}`);
  };

  const handleDeleteRecord = (item: QuarantineRecord) => {
    // TODO: Implement delete confirmation dialog
    toast.success(`Quarantine record for ${item.residentName} deleted`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Quarantine tracker data refreshed");
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success("Exporting quarantine data...");
  };

  const getStatusColor = (status: QuarantineRecord["status"]) => {
    switch (status) {
      case "In Quarantine":
        return "bg-red-100 text-red-700 border-red-200";
      case "Completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "Under Observation":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Cleared":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getHealthStatusColor = (healthStatus: QuarantineRecord["healthStatus"]) => {
    switch (healthStatus) {
      case "Stable":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Improving":
        return "bg-green-100 text-green-700 border-green-200";
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "Recovered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTestResultColor = (testResult: QuarantineRecord["testResult"]) => {
    switch (testResult) {
      case "Positive":
        return "bg-red-100 text-red-700 border-red-200";
      case "Negative":
        return "bg-green-100 text-green-700 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Not Tested":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const renderCell = (item: QuarantineRecord, columnKey: string) => {
    switch (columnKey) {
      case "residentName":
        return <span className="font-semibold text-gray-900">{item.residentName}</span>;
      case "tower":
        return <span className="font-medium">{item.tower}</span>;
      case "flat":
        return <span>{item.flat}</span>;
      case "contactNumber":
        return <span className="text-sm text-gray-600">{item.contactNumber}</span>;
      case "quarantineType":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
            {item.quarantineType}
          </Badge>
        );
      case "status":
        return (
          <Badge variant="outline" className={`${getStatusColor(item.status)} border`}>
            {item.status}
          </Badge>
        );
      case "healthStatus":
        return (
          <Badge variant="outline" className={`${getHealthStatusColor(item.healthStatus)} border flex items-center gap-1 w-fit`}>
            <Activity className="w-3 h-3" />
            {item.healthStatus}
          </Badge>
        );
      case "startDate":
        return <span className="text-sm">{item.startDate}</span>;
      case "endDate":
        return <span className="text-sm">{item.endDate}</span>;
      case "lastCheckup":
        return <span className="text-sm text-gray-600">{item.lastCheckup}</span>;
      case "temperature":
        return (
          <span className={`text-sm font-medium ${
            parseFloat(item.temperature) > 99 ? "text-red-600" : "text-green-600"
          }`}>
            {item.temperature}
          </span>
        );
      case "symptoms":
        return (
          <span className="text-sm text-gray-600">
            {item.symptoms === "None" ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                None
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-orange-600" />
                {item.symptoms}
              </span>
            )}
          </span>
        );
      case "testResult":
        return (
          <Badge variant="outline" className={`${getTestResultColor(item.testResult)} border`}>
            {item.testResult}
          </Badge>
        );
      case "createdOn":
        return <span className="text-sm text-gray-600">{item.createdOn}</span>;
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewRecord(item)}
              className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditRecord(item)}
              className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteRecord(item)}
              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return item[columnKey as keyof QuarantineRecord];
    }
  };

  // Render pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={isLoading}
              className={isLoading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            aria-disabled={isLoading}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={isLoading}
              className={isLoading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            aria-disabled={isLoading}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Render custom left actions
  const renderLeftActions = () => (
    <Button
      onClick={handleAddRecord}
      className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90 h-9 px-4 text-sm font-medium"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Record
    </Button>
  );

  // Render custom right actions
  const renderRightActions = () => (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isLoading}
        className="h-9"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="h-9"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Quarantine Tracker</h1>
      </div>

      <EnhancedTable
        data={quarantineRecords}
        columns={columns}
        renderCell={renderCell}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name, flat, tower..."
        enableSearch={true}
        leftActions={renderLeftActions()}
        rightActions={renderRightActions()}
        emptyMessage="No quarantine records found"
        loading={isLoading}
        pagination={false}
        storageKey="bms-quarantine-tracker-table"
      />

      {/* Custom Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={
                    currentPage === totalPages || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Loading state overlay */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading quarantine data...</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading quarantine data</p>
            <p className="text-sm text-gray-500 mt-1">{error?.message || "Please try again"}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BMSQuarantineTracker;
