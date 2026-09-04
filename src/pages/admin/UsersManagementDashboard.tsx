import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Eye, Search } from "lucide-react";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { useApiConfig } from "@/hooks/useApiConfig";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { TicketPagination } from "@/components/TicketPagination";
import { useDebounce } from "@/hooks/useDebounce";

const fieldStyles = {
  height: "45px",
  "& .MuiInputBase-root": {
    height: "45px",
  },
  "& .MuiInputBase-input": {
    padding: "12px 14px",
  },
  "& .MuiSelect-select": {
    padding: "12px 14px",
  },
};

interface AdminUser {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  mobile: string | null;
  country_code: string;
  user_type: string | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
  company_name?: string | null;
  organization_name?: string | null;
  organization_id?: number | null;
  user_title?: string | null;
  [key: string]: any;
}

interface UsersApiResponse {
  users: AdminUser[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
}

// Column configuration
const columns: ColumnConfig[] = [
  {
    key: "fullname",
    label: "Name",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "mobile",
    label: "Mobile",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  {
    key: "user_organization_name",
    label: "Organization",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  // {
  //   key: "user_company_name",
  //   label: "Company",
  //   sortable: true,
  //   hideable: true,
  //   draggable: true,
  // },
  // {
  //   key: "site_name",
  //   label: "Site",
  //   sortable: true,
  //   hideable: true,
  //   draggable: true,
  // },
  // {
  //   key: "user_type",
  //   label: "User Type",
  //   sortable: true,
  //   hideable: true,
  //   draggable: true,
  // },
  {
    key: "status",
    label: "Status",
    sortable: true,
    hideable: true,
    draggable: true,
  },
  // {
  //   key: "created_at",
  //   label: "Created At",
  //   sortable: true,
  //   hideable: true,
  //   draggable: true,
  // },
];

export const UsersManagementDashboard = () => {
  const navigate = useNavigate();
  const { getFullUrl, getAuthHeader } = useApiConfig();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSearch, setEmailSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedEmailSearch = useDebounce(emailSearch, 500);
  const debouncedMobileSearch = useDebounce(mobileSearch, 500);

  useEffect(() => {
    fetchUsers(currentPage, perPage, debouncedEmailSearch, debouncedMobileSearch);
  }, [currentPage, perPage, debouncedEmailSearch, debouncedMobileSearch, statusFilter]);

  const fetchUsers = async (
    page: number,
    limit: number,
    emailQuery: string,
    mobileQuery: string
  ) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: limit.toString(),
        ...(emailQuery && { "q[email_cont]": emailQuery }),
        ...(mobileQuery && { "q[mobile_cont]": mobileQuery }),
        ...(statusFilter !== "all" && {
          "q[active_eq]": statusFilter === "active" ? "true" : "false",
        }),
      });

      const url = getFullUrl(
        `/admin/users.json?${queryParams}`
      );
      console.log("Fetching users from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data: UsersApiResponse = await response.json();
        console.log("API Response:", data);
        console.log("Users array:", data.users);
        console.log("Users length:", data.users?.length);

        setUsers(data.users || []);

        if (data.pagination) {
          setTotalCount(data.pagination.total_count);
          setTotalPages(data.pagination.total_pages);
        } else {
          setTotalCount(data.users?.length || 0);
          setTotalPages(1);
        }
      } else {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        toast.error("Failed to load users");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error loading users");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (
    userId: number,
    currentStatus: boolean | null
  ) => {
    try {
      const newStatus = !currentStatus;
      const response = await fetch(getFullUrl(`/pms/users/${userId}.json`), {
        method: "PUT",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            active: newStatus,
          },
        }),
      });

      if (response.ok) {
        toast.success(
          `User ${newStatus ? "activated" : "deactivated"} successfully`
        );
        fetchUsers(currentPage, perPage, debouncedEmailSearch, debouncedMobileSearch);
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Error updating user status");
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      const response = await fetch(getFullUrl(`/admin/users_details?id=${userId}`), {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("User details:", data);
        return data;
      } else {
        toast.error("Failed to load user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Error loading user details");
    }
  };

  const handleViewUser = (userId: number) => {
    navigate(`/ops-console/admin/users/edit/${userId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUserTypeLabel = (userType: string) => {
    const labels: { [key: string]: string } = {
      pms_organization_admin: "Organization Admin",
      pms_company_admin: "Company Admin",
      pms_site_admin: "Site Admin",
      pms_admin: "Admin",
      pms_guest: "Guest",
      super_admin: "Super Admin",
    };
    return labels[userType] || userType;
  };

  const renderActions = (user: AdminUser) => (
    <Button
      size="sm"
      variant="ghost"
      className="p-1"
      onClick={() => handleViewUser(user.id)}
      title="View Details"
    >
      <Eye className="w-4 h-4 text-[#C72030]" />
    </Button>
  );

  const renderCell = (user: AdminUser, columnKey: string) => {
    switch (columnKey) {
      case "fullname":
        return user.firstname && user.lastname
          ? `${user.firstname} ${user.lastname}`
          : user.firstname || user.lastname || user.email;
      case "email":
        return (
          <a
            href={`mailto:${user.email}`}
            className="text-black-600 hover:text-black-800 hover:underline"
          >
            {user.email}
          </a>
        );
      case "mobile":
        if (!user.mobile) return "-";
        return user.country_code ? `+${user.country_code} ${user.mobile}` : user.mobile;
      case "user_organization_name":
        return user.organization_name || "-";
      case "user_type":
        return (
          <span className="text-sm text-gray-700">
            {getUserTypeLabel(user.user_type || "-")}
          </span>
        );
      case "status":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={user.active === true}
              onCheckedChange={() => handleToggleUserStatus(user.id, user.active)}
              className="data-[state=checked]:bg-[#C72030]"
            />
            <span
              className={`text-sm ${
                user.active === true
                  ? "text-green-600"
                  : user.active === false
                    ? "text-red-600"
                    : "text-gray-500"
              }`}
            >
              {user.active === true
                ? "Active"
                : user.active === false
                  ? "Inactive"
                  : "Pending"}
            </span>
          </div>
        );
      case "created_at":
        return formatDate(user.created_at);
      default:
        return user[columnKey] || "-";
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  const leftActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={() => navigate("/ops-console/admin/create-admin-user")}
        className="bg-[#C72030] hover:bg-[#A01020] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        Add
      </Button>
      <TextField
        placeholder="Search by email..."
        value={emailSearch}
        onChange={(e) => setEmailSearch(e.target.value)}
        variant="outlined"
        className="w-56"
        InputLabelProps={{ shrink: true }}
        InputProps={{
          sx: fieldStyles,
          startAdornment: <Search className="text-gray-400 w-4 h-4 mr-2" />,
        }}
      />
      <TextField
        placeholder="Search by mobile..."
        value={mobileSearch}
        onChange={(e) => setMobileSearch(e.target.value)}
        variant="outlined"
        className="w-56"
        InputLabelProps={{ shrink: true }}
        InputProps={{
          sx: fieldStyles,
          startAdornment: <Search className="text-gray-400 w-4 h-4 mr-2" />,
        }}
      />
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Admin Users</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage organization admin users and their permissions
        </p>
      </div>

      <EnhancedTable
        key={`users-table-${users.length}-${currentPage}`}
        data={users}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
        leftActions={leftActions}
        loading={isLoading}
        emptyMessage={
          emailSearch || mobileSearch || statusFilter !== "all"
            ? "No users found. Try adjusting your search or filter criteria."
            : "No users found. Get started by creating a new admin user."
        }
        storageKey="admin-users-table"
      />

      {users.length > 0 && (
        <div className="mt-6">
          <TicketPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            perPage={perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
          />
        </div>
      )}
    </div>
  );
};
