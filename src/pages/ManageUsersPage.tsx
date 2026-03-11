import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Plus, Download, Users, UserCheck, UserX, Clock, MonitorSmartphone, Calendar, Filter, X, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { StatsCard } from "@/components/StatsCard";
import { CommonImportModal } from "@/components/CommonImportModal";
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
import { Input } from "@/components/ui/input";
import MultiSelectBox from "@/components/ui/multi-selector";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getFullUrl } from "@/config/apiConfig";
import { toast } from "sonner";
import axios from "axios";

// Column configuration matching the image
const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false, draggable: false },
  { key: "tower", label: "Tower", sortable: true, draggable: true },
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
    tower: item.block_no || "-",
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
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
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    tower: "",
    flat: [] as { label: string; value: string }[],
    status: [] as { label: string; value: string }[],
    residentType: [] as { label: string; value: string }[],
    livesHere: "",
    membershipType: "",
    appDownloaded: "",
    startDate: "",
    endDate: "",
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

  const [towerOptions, setTowerOptions] = useState<{ id: number; name: string }[]>([]);
  const [flatOptions, setFlatOptions] = useState<{ label: string; value: string }[]>([]);

  const getSocietyId = () => {
    return localStorage.getItem('selectedUserSociety') || '';
  };

  const fetchTowers = async () => {
    try {
      const societyId = getSocietyId();
      if (!societyId || !token) {
        setTowerOptions([]);
        return;
      }
      const url = getFullUrl(`/get_society_blocks.json?token=${token}&society_id=${societyId}`);
      const res = await axios.get(url);
      setTowerOptions(Array.isArray(res.data.society_blocks) ? res.data.society_blocks : []);
    } catch (e) {
      console.error("Error fetching towers:", e);
      setTowerOptions([]);
    }
  };

  const fetchFlats = async (blockId: number) => {
    if (isNaN(blockId)) {
      setFlatOptions([]);
      return;
    }
    try {
      const societyId = getSocietyId();
      if (!societyId || !token) {
        setFlatOptions([]);
        return;
      }
      const url = getFullUrl(`/get_society_flats.json?token=${token}&society_id=${societyId}&society_block_id=${blockId}`);
      const res = await axios.get(url);
      const flats = Array.isArray(res.data.society_flats) ? res.data.society_flats : [];
      setFlatOptions(flats.map((f: any) => ({ label: f.flat_no, value: f.id.toString() })));
    } catch (e) {
      console.error("Error fetching flats:", e);
      setFlatOptions([]);
    }
  };

  const fetchUsers = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());

      Object.entries(filterParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else if (value !== undefined && value !== null) {
          queryParams.append(key, value as string);
        }
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
    fetchTowers();
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
    setShowImportModal(true);
    setShowActionPanel(false);
  };

  const handleDownloadSample = async () => {
    try {
      setIsDownloadingSample(true);

      if (!baseUrl || !token) {
        toast.error('Missing authentication details. Please login again.', {
          position: 'top-right',
          duration: 4000,
          style: {
            background: '#f59e0b',
            color: 'white',
            border: 'none',
          },
        });
        return;
      }

      const response = await axios.get(`https://${baseUrl}/assets/sample_user.xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_user.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Sample file downloaded successfully.');
    } catch (error) {
      console.error('Error downloading sample file:', error);
      toast.error('Failed to download sample file. Please try again.');
    } finally {
      setIsDownloadingSample(false);
    }
  };

  const handleImportUsers = async () => {
    if (!selectedImportFile) {
      toast.error('Please select a file to import.');
      return;
    }

    try {
      setIsImporting(true);

      if (!baseUrl || !token) {
        toast.error('Missing authentication details. Please login again.');
        return;
      }

      const formData = new FormData();
      formData.append('product_import[file]', selectedImportFile);

      const response = await axios.post(`https://${baseUrl}/crm/admin/upload_user_societies.json`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.[0]?.error) {
        toast.error(response.data?.[0]?.error)
        return
      }

      toast.success('Users imported successfully.');

      // Refresh the users list
      fetchUsers(1);
      setShowImportModal(false);
      setSelectedImportFile(null);
    } catch (error) {
      console.error('Error importing users:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to import users. Please try again.';
      toast.error(errorMessage, {
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#f59e0b',
          color: 'white',
          border: 'none',
        },
      });
    } finally {
      setIsImporting(false);
    }
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
    if (filters.firstName) filterParams["q[user_firstname_cont]"] = filters.firstName;
    if (filters.lastName) filterParams["q[user_lastname_cont]"] = filters.lastName;
    if (filters.email) filterParams["q[user_email_cont]"] = filters.email;
    if (filters.mobile) filterParams["q[user_mobile_cont]"] = filters.mobile;
    if (filters.tower && filters.tower !== "none") filterParams["q[user_flat_society_flat_society_block_id_eq]"] = filters.tower;
    if (filters.flat && filters.flat.length > 0) {
      filterParams["q[user_society_user_flat_society_flat_id_in][]"] = filters.flat.map(f => f.value);
    }
    if (filters.status && filters.status.length > 0) {
      filterParams["q[approve_in][]"] = filters.status.map(s => s.value);
    }
    if (filters.residentType && filters.residentType.length > 0) {
      filterParams["q[user_flat_ownership_in][]"] = filters.residentType.map(r => r.value);
    }
    if (filters.livesHere) filterParams["q[user_flat_lives_here_eq]"] = filters.livesHere;
    if (filters.membershipType) filterParams["q[is_primary_eq]"] = filters.membershipType;
    if (filters.startDate && filters.endDate) {
      filterParams["q[date_range]"] = `${filters.startDate} - ${filters.endDate}`;
    }

    fetchUsers(1, filterParams);
    setShowFiltersDialog(false);
  };

  const handleResetFilters = () => {
    setFilters({
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      tower: "",
      flat: [],
      status: [],
      residentType: [],
      livesHere: "",
      membershipType: "",
      appDownloaded: "",
      startDate: "",
      endDate: "",
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
      if (filters.firstName) filterParams["q[user_firstname_cont]"] = filters.firstName;
      if (filters.lastName) filterParams["q[user_lastname_cont]"] = filters.lastName;
      if (filters.email) filterParams["q[user_email_cont]"] = filters.email;
      if (filters.mobile) filterParams["q[user_mobile_cont]"] = filters.mobile;
      if (filters.tower && filters.tower !== "none") filterParams["q[user_flat_society_flat_society_block_id_eq]"] = filters.tower;
      if (filters.flat && filters.flat.length > 0) {
        filterParams["q[user_society_user_flat_society_flat_id_in][]"] = filters.flat.map(f => f.value);
      }
      if (filters.status && filters.status.length > 0) {
        filterParams["q[approve_in][]"] = filters.status.map(s => s.value);
      }
      if (filters.residentType && filters.residentType.length > 0) {
        filterParams["q[user_flat_ownership_in][]"] = filters.residentType.map(r => r.value);
      }
      if (filters.livesHere) filterParams["q[user_flat_lives_here_eq]"] = filters.livesHere;
      if (filters.membershipType) filterParams["q[is_primary_eq]"] = filters.membershipType;
      if (filters.startDate && filters.endDate) {
        filterParams["q[date_range]"] = `${filters.startDate} - ${filters.endDate}`;
      }
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
      case "tower":
        return <span className="text-sm">{user.tower}</span>;
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
          // actions={[
          //   { label: 'Filters', icon: Filter, onClick: handleFilters }
          // ]}
          />
        )}

        <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
          <DialogContent className="max-w-[700px] p-0 overflow-hidden bg-white border-none shadow-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="bg-[#EAEAEA] py-3 px-6 flex flex-row items-center justify-between shrink-0">
              <DialogTitle className="text-base font-bold text-gray-800 text-center w-full">Advance Filter</DialogTitle>
              <button
                onClick={() => setShowFiltersDialog(false)}
                className="text-red-500 hover:text-red-700 transition-colors absolute right-4"
              >
                <X className="h-5 w-5 fill-current" />
              </button>
            </DialogHeader>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {/* First Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">First Name</Label>
                  <Input
                    placeholder="Enter First Name"
                    value={filters.firstName}
                    onChange={(e) => setFilters({ ...filters, firstName: e.target.value })}
                    className="h-9 border-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-400 text-sm"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Last Name</Label>
                  <Input
                    placeholder="Enter Last Name"
                    value={filters.lastName}
                    onChange={(e) => setFilters({ ...filters, lastName: e.target.value })}
                    className="h-9 border-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-400 text-sm"
                  />
                </div>

                {/* Email ID */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Email ID</Label>
                  <Input
                    placeholder="Enter Email ID"
                    value={filters.email}
                    onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                    className="h-9 border-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-400 text-sm"
                  />
                </div>

                {/* Mobile */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Mobile</Label>
                  <Input
                    placeholder="Enter Mobile"
                    value={filters.mobile}
                    onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
                    className="h-9 border-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-400 text-sm"
                  />
                </div>

                {/* Resident Type */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Resident Type</Label>
                  <MultiSelectBox
                    options={[
                      { label: "Owner", value: "Owner" },
                      { label: "Tenant", value: "Tenant" },
                    ]}
                    value={filters.residentType}
                    onChange={(selected: any) => setFilters({ ...filters, residentType: selected || [] })}
                    placeholder="Select Resident Type"
                  />
                </div>

                {/* Tower */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Tower</Label>
                  <Select
                    value={filters.tower}
                    onValueChange={(value) => {
                      setFilters({ ...filters, tower: value, flat: [] });
                      fetchFlats(parseInt(value));
                    }}
                  >
                    <SelectTrigger className="h-9 border-gray-300 text-gray-500 text-sm">
                      <SelectValue placeholder="Select Tower" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select Tower</SelectItem>
                      {towerOptions.map((tower) => (
                        <SelectItem key={tower.id} value={tower.id.toString()}>
                          {tower.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Flat Number */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Flat Number</Label>
                  <MultiSelectBox
                    options={flatOptions}
                    value={filters.flat}
                    onChange={(selected: any) => setFilters({ ...filters, flat: selected || [] })}
                    placeholder="Select Flat Number"
                  />
                </div>

                {/* Lives Here */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Lives Here</Label>
                  <Select
                    value={filters.livesHere}
                    onValueChange={(value) => setFilters({ ...filters, livesHere: value })}
                  >
                    <SelectTrigger className="h-9 border-gray-300 text-gray-500 text-sm">
                      <SelectValue placeholder="Select Lives Here" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <MultiSelectBox
                    options={[
                      { label: "Approved", value: "1" },
                      { label: "Rejected", value: "0" },
                      { label: "Pending", value: "null" },
                    ]}
                    value={filters.status}
                    onChange={(selected: any) => setFilters({ ...filters, status: selected || [] })}
                    placeholder="Select Status"
                  />
                </div>

                {/* Membership Type */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Membership Type</Label>
                  <Select
                    value={filters.membershipType}
                    onValueChange={(value) => setFilters({ ...filters, membershipType: value })}
                  >
                    <SelectTrigger className="h-9 border-gray-300 text-gray-500 text-sm">
                      <SelectValue placeholder="Select Membership" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Primary</SelectItem>
                      <SelectItem value="0">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                  <div className="flex items-center h-9 border border-gray-300 rounded-md bg-white overflow-hidden">
                    <div className="px-3 border-r border-gray-300 h-full flex items-center bg-white shrink-0">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="border-none shadow-none focus-visible:ring-0 text-gray-500 h-full w-full bg-transparent p-2 text-sm"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-600">End Date</Label>
                  <div className="flex items-center h-9 border border-gray-300 rounded-md bg-white overflow-hidden">
                    <div className="px-3 border-r border-gray-300 h-full flex items-center bg-white shrink-0">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="border-none shadow-none focus-visible:ring-0 text-gray-500 h-full w-full bg-transparent p-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-2">
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  className="px-8 h-9 border-[#00A65A] text-[#00A65A] hover:bg-[#00A65A]/10 font-semibold text-sm rounded shadow-sm"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="px-8 h-9 bg-[#00A65A] hover:bg-[#008D4C] text-white font-semibold text-sm rounded shadow-sm"
                >
                  Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Modal */}
        <CommonImportModal
          selectedFile={selectedImportFile}
          setSelectedFile={setSelectedImportFile}
          open={showImportModal}
          onOpenChange={setShowImportModal}
          title="Import Users"
          entityType="users"
          onSampleDownload={handleDownloadSample}
          onImport={handleImportUsers}
          isUploading={isImporting}
          isDownloading={isDownloadingSample}
        />

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
            onFilterClick={handleFilters}
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