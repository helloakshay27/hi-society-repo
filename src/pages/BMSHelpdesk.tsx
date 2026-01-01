import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, Download, Eye, Edit, Trash2, Flag, Calendar, Clock, AlertCircle, CheckCircle, MessageSquare, ThumbsUp, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { BulkUploadDialog } from "@/components/BulkUploadDialog";
import { toast, Toaster } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { API_CONFIG } from "@/config/apiConfig";
import { apiClient } from "@/utils/apiClient";

interface HelpdeskTicket {
  id: string;
  ticketNumber: string;
  ticketTitle: string;
  flat: string;
  seniorCitizen: string;
  differentlyAbled: string;
  ticketType: string;
  priority: string;
  createdOn: string;
  ticketStatus: string;
  category: string;
  assignTo: string;
  relatedTo: string;
  escalationTitle: string;
  societyStaff: string;
  flag: string;
}

const BMSHelpdesk: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("normal");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    ticketType: "",
    status: "",
    category: "",
    priority: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Debounce filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Mock data query (replace with actual API call)
  const {
    data: ticketsData,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["helpdesk-tickets", activeTab, debouncedFilters, debouncedSearchQuery, currentPage],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // For now, returning mock data
      return {
        tickets: [],
        pagination: {
          total_count: 0,
          total_pages: 0,
          current_page: currentPage,
        },
      };
    },
    retry: 2,
    staleTime: 30000,
    gcTime: 60000,
  });

  const tickets: HelpdeskTicket[] = ticketsData?.tickets || [];
  const totalCount = ticketsData?.pagination?.total_count || 0;
  const totalPages = ticketsData?.pagination?.total_pages || 0;

  // Stats calculations
  const closedTickets = tickets.filter((t) => t.ticketStatus === "Closed").length;
  const openTickets = tickets.filter((t) => t.ticketStatus === "Open").length;
  const workInProgress = tickets.filter((t) => t.ticketStatus === "Work In Progress").length;
  const complaints = tickets.filter((t) => t.ticketType === "Complaint").length;
  const suggestions = tickets.filter((t) => t.ticketType === "Suggestion").length;
  const requests = tickets.filter((t) => t.ticketType === "Request").length;
  const openComplaints = tickets.filter((t) => t.ticketType === "Complaint" && t.ticketStatus === "Open").length;
  const openRequests = tickets.filter((t) => t.ticketType === "Request" && t.ticketStatus === "Open").length;
  const openSuggestions = tickets.filter((t) => t.ticketType === "Suggestion" && t.ticketStatus === "Open").length;

  // Stats cards configuration for Normal and Golden tabs
  const normalStatsCards = [
    {
      title: "Closed Tickets",
      value: closedTickets,
      icon: CheckCircle,
      bgColor: "bg-[#90C4E8]",
      textColor: "text-white",
    },
    {
      title: "Open Tickets",
      value: openTickets,
      icon: AlertCircle,
      bgColor: "bg-[#D2A679]",
      textColor: "text-white",
    },
    {
      title: "Complaints",
      value: complaints,
      icon: MessageSquare,
      bgColor: "bg-[#28A745]",
      textColor: "text-white",
    },
    {
      title: "Suggestions",
      value: suggestions,
      icon: ThumbsUp,
      bgColor: "bg-[#28A745]",
      textColor: "text-white",
    },
    {
      title: "Requests",
      value: requests,
      icon: FileText,
      bgColor: "bg-[#28A745]",
      textColor: "text-white",
    },
  ];

  const goldenStatsCards = [
    {
      title: "Closed Tickets",
      value: closedTickets,
      icon: CheckCircle,
      bgColor: "bg-[#90C4E8]",
      textColor: "text-white",
    },
    {
      title: "Open Tickets",
      value: openTickets,
      icon: AlertCircle,
      bgColor: "bg-[#D2A679]",
      textColor: "text-white",
    },
    {
      title: "Complaints",
      value: complaints,
      icon: MessageSquare,
      bgColor: "bg-[#28A745]",
      textColor: "text-white",
    },
    {
      title: "Suggestions",
      value: suggestions,
      icon: ThumbsUp,
      bgColor: "bg-[#28A745]",
      textColor: "text-white",
    },
    {
      title: "Requests",
      value: requests,
      icon: FileText,
      bgColor: "bg-[#28A745]",
      textColor: "text-white",
    },
  ];

  // Table columns
  const columns = [
    {
      key: "actions",
      label: "Actions",
      sortable: false,
    },
    {
      key: "flag",
      label: "Flag",
      sortable: false,
    },
    {
      key: "ticketNumber",
      label: "Ticket Number",
      sortable: true,
    },
    {
      key: "ticketTitle",
      label: "Ticket Title",
      sortable: true,
    },
    {
      key: "flat",
      label: "Flat",
      sortable: true,
    },
    {
      key: "seniorCitizen",
      label: "Senior Citizen",
      sortable: true,
    },
    {
      key: "differentlyAbled",
      label: "Differently Abled",
      sortable: true,
    },
    {
      key: "ticketType",
      label: "Ticket Type",
      sortable: true,
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
    },
    {
      key: "createdOn",
      label: "Created On",
      sortable: true,
    },
    {
      key: "ticketStatus",
      label: "Ticket Status",
      sortable: true,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
    },
    {
      key: "assignTo",
      label: "Assign To",
      sortable: true,
    },
    {
      key: "relatedTo",
      label: "Related To",
      sortable: true,
    },
    {
      key: "escalationTitle",
      label: "Escalation Title",
      sortable: true,
    },
    {
      key: "societyStaff",
      label: "Society Staff",
      sortable: true,
    },
  ];

  const handleActionClick = () => {
    setShowActionPanel((prev) => !prev);
  };

  const handleAddTicket = () => {
    navigate("/bms/helpdesk/add");
  };

  const handleViewTicket = (item: HelpdeskTicket) => {
    navigate(`/bms/helpdesk/view/${item.id}`);
  };

  const handleEditTicket = (item: HelpdeskTicket) => {
    navigate(`/bms/helpdesk/edit/${item.id}`);
  };

  const handleDeleteTicket = (item: HelpdeskTicket) => {
    // TODO: Implement delete functionality
    toast.success("Ticket deleted successfully");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const renderCell = (item: HelpdeskTicket, columnKey: string) => {
    if (columnKey === "actions") {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewTicket(item)}
            className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditTicket(item)}
            className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteTicket(item)}
            className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    if (columnKey === "flag") {
      return (
        <Flag className={`h-4 w-4 ${item.flag === "High" ? "text-red-500" : "text-gray-400"}`} />
      );
    }
    return item[columnKey as keyof HelpdeskTicket];
  };

  const selectionActions = [];

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <Button
        onClick={handleAddTicket}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        Add
      </Button>
      <Button
        onClick={handleActionClick}
        variant="outline"
        className="h-9 px-4 text-sm font-medium border-[#D5D5D5] hover:bg-[#DBC2A9]"
      >
        <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        Filters
      </Button>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />

      <BulkUploadDialog
        open={showImportModal}
        onOpenChange={setShowImportModal}
        title="Bulk Upload Tickets"
        context="helpdesk_tickets"
      />

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Helpdesk</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
          <TabsTrigger
            value="normal"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={2}
              className="lucide lucide-ticket w-4 h-4 stroke-black group-data-[state=active]:stroke-[#C72030]"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
            Normal Ticket
          </TabsTrigger>

          <TabsTrigger
            value="golden"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={2}
              className="lucide lucide-chart-column w-4 h-4 stroke-black group-data-[state=active]:stroke-[#C72030]"
            >
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            Golden Ticket
          </TabsTrigger>
        </TabsList>


        <TabsContent value="normal" className="space-y-4 sm:space-y-4 mt-4 sm:mt-6">
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2 sm:gap-3 lg:gap-4">
              {normalStatsCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className={`${card.bgColor} rounded-lg p-3 sm:p-4 shadow-sm transition-all hover:shadow-md`}
                  >
                    <div className="flex flex-col items-start space-y-2">
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.textColor}`} />
                      <div className={`text-2xl sm:text-3xl font-bold ${card.textColor}`}>
                        {card.value}
                      </div>
                      <div className={`text-xs sm:text-sm font-medium ${card.textColor}`}>
                        {card.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Panel */}
            {showActionPanel && (
              <SelectionPanel
                actions={selectionActions}
                selectedCount={0}
                totalCount={tickets.length}
                onClearSelection={() => setShowActionPanel(false)}
                onImport={() => setShowImportModal(true)}
                onAdd={handleAddTicket}
              />
            )}

            {/* Table */}
            <div className="bg-white rounded-lg border border-[#D5D5D5]">
              <EnhancedTable
                data={tickets}
                columns={columns}
                renderCell={renderCell}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search using ticket number or ticket title"
                showSearch={true}
                showExport={true}
                showFilter={true}
                onFilterClick={() => setShowFilterDialog(true)}
                renderCustomActions={renderCustomActions}
                emptyMessage="No Matching Records Found"
                isLoading={isLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalCount={totalCount}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="golden" className="space-y-4 sm:space-y-4 mt-4 sm:mt-6">
          <div className="space-y-4">
            {/* Stats Cards (Golden) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2 sm:gap-3 lg:gap-4">
              {goldenStatsCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className={`${card.bgColor} rounded-lg p-3 sm:p-4 shadow-sm transition-all hover:shadow-md`}
                  >
                    <div className="flex flex-col items-start space-y-2">
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.textColor}`} />
                      <div className={`text-2xl sm:text-3xl font-bold ${card.textColor}`}>
                        {card.value}
                      </div>
                      <div className={`text-xs sm:text-sm font-medium ${card.textColor}`}>
                        {card.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Panel */}
            {showActionPanel && (
              <SelectionPanel
                actions={selectionActions}
                selectedCount={0}
                totalCount={tickets.length}
                onClearSelection={() => setShowActionPanel(false)}
                onImport={() => setShowImportModal(true)}
                onAdd={handleAddTicket}
              />
            )}

            {/* Table */}
            <div className="bg-white rounded-lg border border-[#D5D5D5]">
              <EnhancedTable
                data={tickets}
                columns={columns}
                renderCell={renderCell}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search using ticket number or ticket title"
                showSearch={true}
                showExport={true}
                showFilter={true}
                onFilterClick={() => setShowFilterDialog(true)}
                renderCustomActions={renderCustomActions}
                emptyMessage="No Matching Records Found"
                isLoading={isLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalCount={totalCount}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BMSHelpdesk;
