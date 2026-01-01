import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye, Edit, Trash2, Download, RefreshCw, Loader2, Users, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface Group {
  id: string;
  groupName: string;
  groupType: string;
  description: string;
  memberCount: number;
  status: "Active" | "Inactive";
  createdOn: string;
  createdBy: string;
  category: string;
  permissions: string;
}

const BMSGroups: React.FC = () => {
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
    data: groupsData,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["groups", debouncedSearchQuery, currentPage, pageSize],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // Mock data for demonstration
      const mockData: Group[] = [
        {
          id: "1",
          groupName: "Residents Association",
          groupType: "Community",
          description: "Main residents association group",
          memberCount: 45,
          status: "Active",
          createdOn: "15/12/2024 10:30AM",
          createdBy: "Admin",
          category: "Society",
          permissions: "Read, Write, Delete",
        },
        {
          id: "2",
          groupName: "Security Team",
          groupType: "Staff",
          description: "Security personnel and guards",
          memberCount: 12,
          status: "Active",
          createdOn: "20/12/2024 02:15PM",
          createdBy: "Admin",
          category: "Operations",
          permissions: "Read, Write",
        },
        {
          id: "3",
          groupName: "Maintenance Team",
          groupType: "Staff",
          description: "Maintenance and facility management team",
          memberCount: 8,
          status: "Active",
          createdOn: "10/01/2025 09:00AM",
          createdBy: "Admin",
          category: "Operations",
          permissions: "Read, Write",
        },
        {
          id: "4",
          groupName: "Tower A Residents",
          groupType: "Tower",
          description: "All residents of Tower A",
          memberCount: 120,
          status: "Active",
          createdOn: "05/01/2025 11:45AM",
          createdBy: "Admin",
          category: "Residential",
          permissions: "Read",
        },
        {
          id: "5",
          groupName: "Tower B Residents",
          groupType: "Tower",
          description: "All residents of Tower B",
          memberCount: 98,
          status: "Active",
          createdOn: "05/01/2025 12:00PM",
          createdBy: "Admin",
          category: "Residential",
          permissions: "Read",
        },
        {
          id: "6",
          groupName: "Management Committee",
          groupType: "Committee",
          description: "Society management committee members",
          memberCount: 7,
          status: "Active",
          createdOn: "01/01/2025 08:20AM",
          createdBy: "Admin",
          category: "Governance",
          permissions: "Read, Write, Delete",
        },
        {
          id: "7",
          groupName: "Gym Members",
          groupType: "Amenity",
          description: "Registered gym and fitness center members",
          memberCount: 34,
          status: "Active",
          createdOn: "10/01/2025 03:30PM",
          createdBy: "Admin",
          category: "Amenities",
          permissions: "Read",
        },
        {
          id: "8",
          groupName: "Swimming Pool Members",
          groupType: "Amenity",
          description: "Swimming pool access group",
          memberCount: 28,
          status: "Inactive",
          createdOn: "15/01/2025 10:00AM",
          createdBy: "Admin",
          category: "Amenities",
          permissions: "Read",
        },
        {
          id: "9",
          groupName: "Festival Committee",
          groupType: "Committee",
          description: "Festival and event organizing committee",
          memberCount: 15,
          status: "Active",
          createdOn: "20/01/2025 04:45PM",
          createdBy: "Admin",
          category: "Events",
          permissions: "Read, Write",
        },
        {
          id: "10",
          groupName: "Emergency Response Team",
          groupType: "Safety",
          description: "Emergency and safety response team",
          memberCount: 10,
          status: "Active",
          createdOn: "25/01/2025 09:30AM",
          createdBy: "Admin",
          category: "Safety",
          permissions: "Read, Write",
        },
      ];

      return {
        groups: mockData,
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

  const groups: Group[] = groupsData?.groups || [];
  const totalCount = groupsData?.pagination?.total_count || 0;
  const totalPages = groupsData?.pagination?.total_pages || 1;

  const columns = [
    { key: "groupName", label: "Group Name", sortable: true },
    { key: "groupType", label: "Group Type", sortable: true },
    { key: "description", label: "Description", sortable: true },
    { key: "memberCount", label: "Members", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "permissions", label: "Permissions", sortable: false },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "createdBy", label: "Created By", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  const handleAddGroup = () => {
    navigate("/groups/add");
  };

  const handleViewGroup = (item: Group) => {
    navigate(`/groups/view/${item.id}`);
  };

  const handleEditGroup = (item: Group) => {
    navigate(`/groups/edit/${item.id}`);
  };

  const handleDeleteGroup = (item: Group) => {
    // TODO: Implement delete confirmation dialog
    toast.success(`Group "${item.groupName}" deleted`);
  };

  const handleManageMembers = (item: Group) => {
    navigate(`/groups/${item.id}/members`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Groups data refreshed");
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success("Exporting groups data...");
  };

  const getStatusColor = (status: Group["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700 border-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getGroupTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Community: "bg-blue-100 text-blue-700 border-blue-200",
      Staff: "bg-purple-100 text-purple-700 border-purple-200",
      Tower: "bg-indigo-100 text-indigo-700 border-indigo-200",
      Committee: "bg-orange-100 text-orange-700 border-orange-200",
      Amenity: "bg-teal-100 text-teal-700 border-teal-200",
      Safety: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const renderCell = (item: Group, columnKey: string) => {
    switch (columnKey) {
      case "groupName":
        return (
          <span className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            {item.groupName}
          </span>
        );
      case "groupType":
        return (
          <Badge variant="outline" className={`${getGroupTypeColor(item.groupType)} border`}>
            {item.groupType}
          </Badge>
        );
      case "description":
        return <span className="text-sm text-gray-600">{item.description}</span>;
      case "memberCount":
        return (
          <span className="inline-flex items-center gap-1 font-medium text-gray-900">
            <Users className="w-4 h-4 text-gray-500" />
            {item.memberCount}
          </span>
        );
      case "category":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            {item.category}
          </Badge>
        );
      case "status":
        return (
          <Badge variant="outline" className={`${getStatusColor(item.status)} border`}>
            {item.status}
          </Badge>
        );
      case "permissions":
        return <span className="text-xs text-gray-500">{item.permissions}</span>;
      case "createdOn":
        return <span className="text-sm text-gray-600">{item.createdOn}</span>;
      case "createdBy":
        return <span className="text-sm">{item.createdBy}</span>;
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleManageMembers(item)}
              className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
              title="Manage Members"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewGroup(item)}
              className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditGroup(item)}
              className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteGroup(item)}
              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return item[columnKey as keyof Group];
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
      onClick={handleAddGroup}
      className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90 h-9 px-4 text-sm font-medium"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Group
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
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Groups Management</h1>
      </div>

      <EnhancedTable
        data={groups}
        columns={columns}
        renderCell={renderCell}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by group name, type, category..."
        enableSearch={true}
        leftActions={renderLeftActions()}
        rightActions={renderRightActions()}
        emptyMessage="No groups found"
        loading={isLoading}
        pagination={false}
        storageKey="bms-groups-table"
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
          <span className="ml-2 text-sm text-gray-500">Loading groups...</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading groups</p>
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

export default BMSGroups;
