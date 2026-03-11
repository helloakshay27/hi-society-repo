import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Plus, Download, Users, UserCheck, UserX, Clock, MonitorSmartphone, Calendar, Filter, X, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { StatsCard } from "@/components/StatsCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import axios from "axios";

// Column configuration matching the image
const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false, draggable: false },
  { key: "flat", label: "Flat", sortable: true, draggable: true },
  { key: "occupancy", label: "Occupancy", sortable: true, draggable: true },
  { key: "title", label: "Title", sortable: true, draggable: true },
  { key: "name", label: "Name", sortable: true, draggable: true },
  { key: "mobileNumber", label: "Mobile Number", sortable: true, draggable: true },
  { key: "email", label: "Email", sortable: true, draggable: true },
  { key: "residentType", label: "Resident Type", sortable: true, draggable: true },
  { key: "phase", label: "Phase", sortable: true, draggable: true },
  { key: "livesHere", label: "Lives Here", sortable: true, draggable: true },
  { key: "membershipType", label: "Membership Type", sortable: true, draggable: true },
  { key: "status", label: "Status", sortable: true, draggable: true },
  { key: "staff", label: "Staff", sortable: true, draggable: true },
  { key: "vehicle", label: "Vehicle", sortable: true, draggable: true },
  { key: "appDownloaded", label: "App Downloaded", sortable: true, draggable: true },
  { key: "alternateEmail1", label: "Alternate Email -1", sortable: true, draggable: true },
  { key: "alternateEmail2", label: "Alternate Email -2", sortable: true, draggable: true },
  { key: "alternateAddress", label: "Alternate Address", sortable: true, draggable: true },
  { key: "landlineNumber", label: "Landline Number", sortable: true, draggable: true },
  { key: "intercomNumber", label: "Intercom Number", sortable: true, draggable: true },
  { key: "gstNumber", label: "GST Number", sortable: true, draggable: true },
  { key: "panNumber", label: "PAN Number", sortable: true, draggable: true },
  { key: "clubMembership", label: "Club Membership", sortable: true, draggable: true },
  { key: "createdOn", label: "Created On", sortable: true, draggable: true },
  { key: "updatedOn", label: "Updated On", sortable: true, draggable: true },
];

const formattedResponse = (data) => {
  return data.map((item) => ({
    id: item.id,
    flat: item.flat_no || "-",
    occupancy: item.occupancy == "Yes" ? "Occupied" : "Vacant",
    title: item.title || "-",
    name: item.full_name || "-",
    mobileNumber: item.mobile || "-",
    email: item.email || "-",
    residentType: item.resident_type || "-",
    phase: item.display_view || "-",
    livesHere: (item.lives_here === "1" || item.lives_here === "true") ? "Yes" : "No",
    membershipType: item?.membership_type || "-",
    status: item.approve ? "Approved" : "Not Approved",
    staff: item.staff || "-",
    vehicle: item.vehicle || "-",
    appDownloaded: item.app_downloaded ? "Yes" : "No",
    alternateEmail1: item.alternate_email_1 || "-",
    alternateEmail2: item.alternate_email_2 || "-",
    alternateAddress: item.alternate_address || "-",
    landlineNumber: item.landline_number || "-",
    intercomNumber: item.intercom_number || "-",
    gstNumber: item.gst_number || "-",
    panNumber: item.pan_number || "-",
    clubMembership: item.club_membership || "-",
    createdOn: item.created_at ? item.created_at.split("T")[0] : "-",
    updatedOn: item.updated_at ? item.updated_at.split("T")[0] : "-",
  }));
}

const ManageUsersPage = () => {
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token')

  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_count: 0,
    total_pages: 0,
    per_page: 20,
  });

  // Filter states
  const [filters, setFilters] = useState({
    tower: "",
    flat: "",
    status: "",
    residentType: "",
    appDownloaded: "",
    dateRange: "",
  });

  const [dashboardData, setDashboardData] = useState({
    pending_users: 0,
    rejected_users: 0,
    approved_users: 0,
    total_users: 0,
    app_downloads: 0,
    total_flat_downloads: 0,
    total_owner_downloads: 0,
    total_tenant_downloads: 0,
    post_sale_downloads: 0,
    post_possession_downloads: 0,
  });

  const fetchUsers = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...filterParams,
      });

      const response = await axios.get(`https://${baseUrl}/crm/admin/user_societies.json?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setUsers(formattedResponse(response.data.user_societies));
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
      if (response.data.dashboard) {
        setDashboardData(response.data.dashboard);
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to fetch users. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleViewUser = (userId: string) => {
    navigate(`/settings/manage-users/${userId}`);
  };

  const handleAddUser = () => {
    navigate("/settings/manage-users/add");
    setShowActionPanel(false);
  };

  const handleEditUser = (userId: string) => {
    navigate(`/settings/manage-users/edit/${userId}`);
  };

  const handleImport = () => {
    console.log("Import users");
    // Handle import functionality
    setShowActionPanel(false);
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/user_societies.xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "user_societies.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error)
      toast.error("Failed to export users")
    }
  }

  const handleFilters = () => {
    setShowFiltersDialog(true);
  };

  const handleApplyFilters = () => {
    console.log("Applying filters:", filters);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    const filterParams: any = {};
    if (filters.tower) filterParams.tower = filters.tower;
    if (filters.flat) filterParams.flat = filters.flat;
    if (filters.status) filterParams.status = filters.status;
    if (filters.residentType) filterParams.resident_type = filters.residentType;
    if (filters.appDownloaded) filterParams.app_downloaded = filters.appDownloaded;
    if (filters.dateRange) filterParams.date_range = filters.dateRange;

    fetchUsers(1, filterParams);
    setShowFiltersDialog(false);
  };

  const handleResetFilters = () => {
    setFilters({
      tower: "",
      flat: "",
      status: "",
      residentType: "",
      appDownloaded: "",
      dateRange: "",
    });
    setPagination({ ...pagination, current_page: 1 });
    fetchUsers(1, {});
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > pagination.total_pages || page === pagination.current_page || loading) {
      return;
    }

    try {
      const filterParams: any = {};
      if (filters.tower) filterParams.tower = filters.tower;
      if (filters.flat) filterParams.flat = filters.flat;
      if (filters.status) filterParams.status = filters.status;
      if (filters.residentType) filterParams.resident_type = filters.residentType;
      if (filters.appDownloaded) filterParams.app_downloaded = filters.appDownloaded;
      if (filters.dateRange) filterParams.date_range = filters.dateRange;
      if (searchTerm) filterParams.search = searchTerm;

      setPagination((prev) => ({ ...prev, current_page: page }));
      await fetchUsers(page, filterParams);
    } catch (error) {
      console.error("Error changing page:", error);
      toast.error("Failed to load page data. Please try again.");
    }
  };

  const renderPaginationItems = () => {
    if (!pagination.total_pages || pagination.total_pages <= 0) {
      return null;
    }
    const items = [];
    const totalPages = pagination.total_pages;
    const currentPage = pagination.current_page;
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            aria-disabled={loading}
            className={loading ? "pointer-events-none opacity-50" : ""}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
                aria-disabled={loading}
                className={loading ? "pointer-events-none opacity-50" : ""}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
                aria-disabled={loading}
                className={loading ? "pointer-events-none opacity-50" : ""}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink
                  onClick={() => handlePageChange(i)}
                  isActive={currentPage === i}
                  aria-disabled={loading}
                  className={loading ? "pointer-events-none opacity-50" : ""}
                >
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
              aria-disabled={loading}
              className={loading ? "pointer-events-none opacity-50" : ""}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={loading}
              className={loading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionPanel(true);
  };

  // Render cell content based on column key
  const renderCell = (user: any, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleViewUser(user.id)}
              className="p-1 hover:bg-gray-100 rounded"
              title="View"
            >
              <Eye className="w-4 h-4 text-[#1A1A1A]" />
            </button>
            <button
              onClick={() => handleEditUser(user.id)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-[#C72030]" />
            </button>
          </div>
        );
      case "flat":
        return <span className="text-sm">{user.flat}</span>;
      case "status":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded">
            {user.status}
          </span>
        );
      default:
        return <span className="text-sm">{user[columnKey] || "-"}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-full mx-auto">
        {/* Stats Cards - First Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
          <StatsCard
            title="Total Users"
            value={dashboardData.total_users.toString()}
            icon={<Users className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
          <StatsCard
            title="Pending Users"
            value={dashboardData.pending_users.toString()}
            icon={<Clock className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
          <StatsCard
            title="Approved Users"
            value={dashboardData.approved_users.toString()}
            icon={<UserCheck className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
          <StatsCard
            title="Rejected Users"
            value={dashboardData.rejected_users.toString()}
            icon={<UserX className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
          <StatsCard
            title="Total No. Of Downloads"
            value={dashboardData.app_downloads.toString()}
            icon={<MonitorSmartphone className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
        </div>

        {/* Stats Cards - Second Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <StatsCard
            title="Total No. Of Flat Downloads"
            value={dashboardData.total_flat_downloads.toString()}
            icon={<Download className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
          <StatsCard
            title="Total No. Of Owners Downloads"
            value={dashboardData.total_owner_downloads.toString()}
            icon={<Download className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
          <StatsCard
            title="Total No. Of Tenants Downloads"
            value={dashboardData.total_tenant_downloads.toString()}
            icon={<Download className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
          <StatsCard
            title="Post Sale Downloads"
            value={dashboardData.post_sale_downloads.toString()}
            icon={<Download className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
          <StatsCard
            title="Post Possession Downloads"
            value={dashboardData.post_possession_downloads.toString()}
            icon={<Download className="w-6 h-6 text-[#C72030]" />}
            downloadData={[]}
          />
        </div>

        {/* Action Panel */}
        {showActionPanel && (
          <SelectionPanel
            onAdd={handleAddUser}
            onImport={handleImport}
            onClearSelection={() => setShowActionPanel(false)}
            actions={[
              { label: 'Filters', icon: Filter, onClick: handleFilters }
            ]}
          />
        )}

        {/* Filters Dialog */}
        <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
          <DialogContent className="max-w-4xl bg-white">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold">Filters</DialogTitle>
                <button
                  onClick={() => setShowFiltersDialog(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Select Tower */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Tower
                  </Label>
                  <Select
                    value={filters.tower}
                    onValueChange={(value) =>
                      setFilters({ ...filters, tower: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Tower" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tower-a">Tower A</SelectItem>
                      <SelectItem value="tower-b">Tower B</SelectItem>
                      <SelectItem value="tower-c">Tower C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Flat */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Flat
                  </Label>
                  <Select
                    value={filters.flat}
                    onValueChange={(value) =>
                      setFilters({ ...filters, flat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Flat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="101">101</SelectItem>
                      <SelectItem value="102">102</SelectItem>
                      <SelectItem value="103">103</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Status
                  </Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Resident Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Resident Type
                  </Label>
                  <Select
                    value={filters.residentType}
                    onValueChange={(value) =>
                      setFilters({ ...filters, residentType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Resident Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* App Downloaded */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    App Downloaded
                  </Label>
                  <Select
                    value={filters.appDownloaded}
                    onValueChange={(value) =>
                      setFilters({ ...filters, appDownloaded: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="App Downloaded" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Date Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Date Range
                  </Label>
                  <div className="relative">
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) =>
                        setFilters({ ...filters, dateRange: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                        <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  className="px-8 py-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="px-8 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
                >
                  Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Table */}
        <div className="">
          <EnhancedTable
            columns={columns}
            data={users}
            onRowClick={(user) => console.log("Row clicked:", user)}
            renderCell={renderCell}
            selectedItems={selectedUsers}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectUser}
            enableSelection={true}
            enableExport={true}
            handleExport={handleExport}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search users..."
            leftActions={
              <Button
                size="sm"
                className="mr-2"
                onClick={handleActionClick}
              >
                <Plus className="w-4 h-4 mr-2" />
                Action
              </Button>
            }
            loading={loading}
          />
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                  className={pagination.current_page === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(pagination.total_pages, pagination.current_page + 1))}
                  className={pagination.current_page === pagination.total_pages || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersPage;
