import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  mobile: string;
  country_code?: string;
  active: boolean;
}

interface UserPermissions {
  create?: string;
  update?: string;
  show?: string;
  destroy?: string;
}

const UserList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const getUserPermission = (): UserPermissions => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const perms = JSON.parse(lockRolePermissions);
      return perms.user || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    const perms = getUserPermission();
    setPermissions(perms);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}users/get_users.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (Array.isArray(data.users)) {
        let allUsers = data.users;

        // Client-side search
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          allUsers = allUsers.filter((user: User) =>
            user.firstname?.toLowerCase().includes(query) ||
            user.lastname?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
          );
        }

        setTotalCount(allUsers.length);
        setTotalPages(Math.ceil(allUsers.length / itemsPerPage) || 1);

        // Client-side pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedUsers = allUsers.slice(startIndex, startIndex + itemsPerPage);
        setUsers(paginatedUsers);
      } else {
        console.error("API response does not contain users array", data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, searchTerm, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    setIsSearching(true);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleAdd = () => {
    navigate("/setup-member/user-create");
  };

  const handleEdit = (id: number) => {
    navigate(`/setup-member/user-edit/${id}`);
  };

  const handleView = (id: number) => {
    navigate(`/setup-member/user-details/${id}`);
  };

  const handleToggleUser = async (userId: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      const response = await fetch(`${baseURL}users/${userId}.json`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: { active: !currentStatus } }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, active: !currentStatus } : user
        )
      );

      toast.success("Updated Status");
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update status");
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "firstname", label: "First Name", sortable: true },
    { key: "lastname", label: "Last Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "mobile", label: "Mobile", sortable: false },
    { key: "status", label: "Status", sortable: false },
  ];

  const renderCell = (item: User, columnKey: string) => {
    const index = users.findIndex(u => u.id === item.id);
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(item.id)}
              className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleView(item.id)}
              className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      case "id":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "firstname":
        return <span>{item.firstname || "-"}</span>;
      case "lastname":
        return <span>{item.lastname || "-"}</span>;
      case "email":
        return <span>{item.email || "-"}</span>;
      case "mobile":
        return (
          <span>
            {item.country_code ? `+${item.country_code} ` : ""}
            {item.mobile || "-"}
          </span>
        );
      case "status":
        return (
          <button
            onClick={() => handleToggleUser(item.id, item.active)}
            className="toggle-button"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              width: "70px",
            }}
          >
            {item.active ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="25"
                fill="#de7008"
                className="bi bi-toggle-on"
                viewBox="0 0 16 16"
              >
                <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="25"
                fill="#667085"
                className="bi bi-toggle-off"
                viewBox="0 0 16 16"
              >
                <path d="M11 4a4 4 0 0 1 0 8H8a5 5 0 0 0 2-4 5 5 0 0 0-2-4zm-6 8a4 4 0 1 1 0-8 4 4 0 0 1 0 8M0 8a5 5 0 0 0 5 5h6a5 5 0 0 0 0-10H5a5 5 0 0 0-5 5" />
              </svg>
            )}
          </button>
        );
      default:
        return null;
    }
  };

  const renderCustomActions = () => (
    <Button
      onClick={handleAdd}
      className="bg-[#C72030] hover:bg-[#A01828] text-white"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add User
    </Button>
  );

  const renderListTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Users List</h3>
        </div>
        <div className="p-6">
          <EnhancedTable
            data={users}
            columns={columns}
            renderCell={renderCell}
            enableExport={false}
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            leftActions={renderCustomActions()}
            loading={loading}
            loadingMessage="Loading users..."
          />
          {!loading && users.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      {renderListTab()}
    </div>
  );
};

export default UserList;
