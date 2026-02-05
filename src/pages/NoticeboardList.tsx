import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

const NoticeboardList = () => {
  const navigate = useNavigate();
  const [noticeboards, setNoticeboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noticeboardPermission, setNoticeboardPermission] = useState<{
    create?: string;
    update?: string;
    show?: string;
    destroy?: string;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const getNoticeboardPermission = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions)
        return {
          create: "true",
          update: "true",
          show: "true",
          destroy: "true",
        };

      const permissions = JSON.parse(lockRolePermissions);
      return (
        permissions.noticeboard || {
          create: "true",
          update: "true",
          show: "true",
          destroy: "true",
        }
      );
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return { create: "true", update: "true", show: "true", destroy: "true" };
    }
  };

  // Cleanup body overflow styles when component mounts (fixes scroll-lock from modals)
  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  useEffect(() => {
    const permissions = getNoticeboardPermission();
    setNoticeboardPermission(permissions);
  }, []);

  const fetchNoticeboards = useCallback(
    async (search: string) => {
      setLoading(true);
      setIsSearching(!!search);
      try {
        const response = await fetch(getFullUrl('/crm/admin/noticeboards.json'), {
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
          filteredNoticeboards = noticeboardsData.filter(
            (noticeboard) =>
              (noticeboard.notice_heading || "")
                .toLowerCase()
                .includes(searchLower) ||
              (noticeboard.notice_text || "")
                .toLowerCase()
                .includes(searchLower) ||
              (noticeboard.notice_type || "")
                .toLowerCase()
                .includes(searchLower) ||
              (noticeboard.society_name || "")
                .toLowerCase()
                .includes(searchLower) ||
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
    },
    []
  );

  useEffect(() => {
    fetchNoticeboards(searchTerm);
  }, [searchTerm, fetchNoticeboards]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleAddNoticeboard = () => {
    navigate("/maintenance/noticeboard-create");
  };
  const handleViewNoticeboard = (id: number) =>
    navigate(`/maintenance/noticeboard-details/${id}`);
  const handleToggleNoticeboard = async (
    id: number,
    currentStatus: boolean
  ) => {
    toast.dismiss();
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/noticeboards/${id}.json`),
        {
          method: "PUT",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ noticeboard: { active: !currentStatus } }),
        }
      );

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

  const handleEditNoticeboard = (id: number) =>
    navigate(`/maintenance/noticeboard-edit/${id}`);

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
    { key: "actions", label: "Action", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "notice_heading", label: "Notice Heading", sortable: true },
    { key: "notice_type", label: "Notice Type", sortable: true },
    { key: "user_name", label: "Created By", sortable: true },
    { key: "project_name", label: "Project", sortable: true },
    { key: "is_important", label: "Important", sortable: false },
    { key: "expire_time", label: "Expire Time", sortable: false },
    { key: "active", label: "Status", sortable: false },
  ];

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const renderCell = (
    item: {
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
    },
    columnKey: string,
    index: number
  ) => {
    /* eslint-enable @typescript-eslint/no-explicit-any */
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-1">
            {noticeboardPermission.show === "true" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewNoticeboard(item.id)}
                title="View"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {/* {noticeboardPermission.update === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleEditNoticeboard(item.id)} title="Edit">
                <Pencil className="w-4 h-4" />
              </Button>
            )} */}
          </div>
        );
      case "id":
        return <span className="text-sm text-gray-700">{index + 1}</span>;
      case "notice_heading":
        return item.notice_heading || "-";
      case "notice_type":
        return item.notice_type
          ? item.notice_type.charAt(0).toUpperCase() +
              item.notice_type.slice(1).toLowerCase()
          : "-";
      case "user_name":
        return item.user_name || "-";
      case "project_name":
        return item.project_name || "-";
      case "is_important":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.is_important
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {item.is_important ? "Yes" : "No"}
          </span>
        );
      case "expire_time":
        return formatDateTimeManual(item.expire_time);
     case "active":
  return noticeboardPermission.destroy === "true" ? (
    <div className="flex items-center justify-center min-h-[32px]">
      <Switch
        checked={item.active ?? false}
        onChange={() => handleToggleNoticeboard(item.id, item.active)}
        size="small"
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: '#C72030',
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#C72030 !important',
          },
          '& .MuiSwitch-track': {
            backgroundColor: '#cbd5e1 !important', // slate-300
            opacity: 1,
          },
        }}
      />
    </div>
  ) : (
    <span className="text-sm text-gray-600 font-medium">
      {item.active ? 'Active' : 'Inactive'}
    </span>
  );
  return noticeboardPermission.destroy === "true" ? (
    <Switch
      checked={item.active ?? false}
      onChange={() => handleToggleNoticeboard(item.id, item.active)}
      size="small"           // optional – looks cleaner in tables
      sx={{
        // Target the thumb when checked
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: '#C72030',
        },
        // Target the track (background) when checked
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: '#C72030 !important',
        },
        // Optional: make unchecked track a bit darker gray
        '& .MuiSwitch-track': {
          backgroundColor: '#94a3b8 !important', // slate-400 like
          opacity: 1,
        },
        // Optional: slightly smaller in table
        transform: 'scale(0.9)',
      }}
    />
  ) : (
    <span className="text-sm text-gray-500 font-medium">
      {item.active ? "Active" : "Inactive"}
    </span>
  );
        return item[columnKey] ?? "-";
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
        loadingMessage={
          isSearching ? "Searching broadcasts..." : "Loading broadcasts..."
        }
      />
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">{renderListTab()}</div>
    </div>
  );
};

export default NoticeboardList;
