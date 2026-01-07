import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";

const NoticeboardList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [noticeboards, setNoticeboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noticeboardPermission, setNoticeboardPermission] = useState<{
    create?: string;
    update?: string;
    show?: string;
    destroy?: string;
  }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const getNoticeboardPermission = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return { create: "true", update: "true", show: "true", destroy: "true" };

      const permissions = JSON.parse(lockRolePermissions);
      return permissions.noticeboard || { create: "true", update: "true", show: "true", destroy: "true" };
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return { create: "true", update: "true", show: "true", destroy: "true" };
    }
  };

  useEffect(() => {
    const permissions = getNoticeboardPermission();
    setNoticeboardPermission(permissions);
  }, []);

  const fetchNoticeboards = useCallback(async (search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(`${baseURL}/crm/admin/noticeboards.json`, {
        headers: {
          Authorization: getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // API returns array directly
      let noticeboardsData = [];
      if (Array.isArray(data)) {
        noticeboardsData = data;
      } else if (data.noticeboards && Array.isArray(data.noticeboards)) {
        noticeboardsData = data.noticeboards;
      } else if (data.data && Array.isArray(data.data)) {
        noticeboardsData = data.data;
      }

      let filteredNoticeboards = noticeboardsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredNoticeboards = noticeboardsData.filter((noticeboard) =>
          (noticeboard.notice_heading || "").toLowerCase().includes(searchLower) ||
          (noticeboard.notice_text || "").toLowerCase().includes(searchLower) ||
          (noticeboard.notice_type || "").toLowerCase().includes(searchLower) ||
          (noticeboard.society_name || "").toLowerCase().includes(searchLower) ||
          (noticeboard.user_name || "").toLowerCase().includes(searchLower)
        );
      }

      setNoticeboards(filteredNoticeboards);
    } catch (error) {
      console.error("Error fetching noticeboards:", error);
      toast.error("Failed to fetch noticeboards");
      setNoticeboards([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL]);

  useEffect(() => {
    fetchNoticeboards(searchTerm);
  }, [searchTerm, fetchNoticeboards]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleAddNoticeboard = () => {
    navigate("/maintenance/noticeboard-create");
  };
  const handleViewNoticeboard = (id: number) => navigate(`/maintenance/noticeboard-details/${id}`);
  const handleToggleNoticeboard = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      const response = await fetch(`${baseURL}admin/noticeboards/${id}.json`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noticeboard: { active: !currentStatus } }),
      });

      if (!response.ok) {
        throw new Error("Failed to update noticeboard status");
      }

      fetchNoticeboards(searchTerm);
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error toggling noticeboard status:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleEditNoticeboard = (id: number) => navigate(`/maintenance/noticeboard-edit/${id}`);

  function formatDateTimeManual(datetime: string) {
    if (!datetime) return "-";
    const date = new Date(datetime);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'Sr No', sortable: true },
    { key: 'notice_heading', label: 'Notice Heading', sortable: true },
    { key: 'notice_type', label: 'Notice Type', sortable: true },
    { key: 'user_name', label: 'Created By', sortable: true },
    { key: 'society_name', label: 'Society', sortable: true },
    { key: 'is_important', label: 'Important', sortable: false },
    { key: 'expire_time', label: 'Expire Time', sortable: false },
    { key: 'active', label: 'Status', sortable: false },
  ];

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const renderCell = (item: {
    id: number;
    notice_heading?: string;
    notice_text?: string;
    notice_type?: string;
    user_name?: string;
    society_name?: string;
    is_important?: boolean;
    expire_time?: string;
    active: boolean;
    [key: string]: any;
  }, columnKey: string) => {
  /* eslint-enable @typescript-eslint/no-explicit-any */
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {noticeboardPermission.show === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleViewNoticeboard(item.id)} title="View">
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {noticeboardPermission.update === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleEditNoticeboard(item.id)} title="Edit">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'notice_heading':
        return item.notice_heading || "-";
      case 'notice_type':
        return item.notice_type
          ? item.notice_type.charAt(0).toUpperCase() + item.notice_type.slice(1).toLowerCase()
          : "-";
      case 'user_name':
        return item.user_name || "-";
      case 'society_name':
        return item.society_name || "-";
      case 'is_important':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.is_important 
              ? 'bg-red-100 text-red-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {item.is_important ? 'Yes' : 'No'}
          </span>
        );
      case 'expire_time':
        return formatDateTimeManual(item.expire_time);
      case 'active':
        return noticeboardPermission.destroy === "true" ? (
          <button
            onClick={() => handleToggleNoticeboard(item.id, item.active)}
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
        ) : (
          <span className="text-sm text-gray-500">{item.active ? "Active" : "Inactive"}</span>
        );
      default:
        return item[columnKey] ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      <Button 
        onClick={handleAddNoticeboard}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
        Add
      </Button>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={noticeboards}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="broadcasts"
        storageKey="noticeboards-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search broadcasts..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching broadcasts..." : "Loading broadcasts..."}
      />
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">
        {renderListTab()}
      </div>
    </div>
  );
};

export default NoticeboardList;
