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
    { key: "society_name", label: "Society", sortable: true },
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
      case "society_name":
        return item.society_name || "-";
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
          <div className="flex items-center gap-2 text-[11px] font-medium select-none">
            <div
              role="switch"
              aria-checked={item.active}
              aria-label={
                item.active ? "Deactivate noticeboard" : "Activate noticeboard"
              }
              tabIndex={0}
              onClick={() => handleToggleNoticeboard(item.id, item.active)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                handleToggleNoticeboard(item.id, item.active)
              }
              className="cursor-pointer"
              style={{ transform: item.active ? "scaleX(1)" : "scaleX(-1)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="20"
                viewBox="0 0 22 14"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z"
                  fill="#DEDEDE"
                />
                <g filter={`url(#filter0_dd_noticeboard_status_${item.id})`}>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z"
                    fill="#C72030"
                  />
                  <path
                    d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z"
                    stroke={`url(#paint0_linear_noticeboard_status_${item.id})`}
                    strokeWidth="0.255453"
                  />
                  <path
                    d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z"
                    stroke={`url(#paint1_linear_noticeboard_status_${item.id})`}
                    strokeWidth="0.255453"
                  />
                </g>
                <defs>
                  <filter
                    id={`filter0_dd_noticeboard_status_${item.id}`}
                    x="-8.54731e-05"
                    y="-0.000329614"
                    width="12.2619"
                    height="13.2842"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="1.02181" />
                    <feGaussianBlur stdDeviation="0.510907" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_noticeboard_status"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset />
                    <feGaussianBlur stdDeviation="0.510907" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="effect1_dropShadow_noticeboard_status"
                      result="effect2_dropShadow_noticeboard_status"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect2_dropShadow_noticeboard_status"
                      result="shape"
                    />
                  </filter>
                  <linearGradient
                    id={`paint0_linear_noticeboard_status_${item.id}`}
                    x1="1.07172"
                    y1="1.02148"
                    x2="1.07172"
                    y2="11.1396"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopOpacity="0" />
                    <stop offset="0.8" stopOpacity="0.02" />
                    <stop offset="1" stopOpacity="0.04" />
                  </linearGradient>
                  <linearGradient
                    id={`paint1_linear_noticeboard_status_${item.id}`}
                    x1="1.02173"
                    y1="1.02148"
                    x2="1.02173"
                    y2="11.2396"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="white" stopOpacity="0.12" />
                    <stop offset="0.2" stopColor="white" stopOpacity="0.06" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-500">
            {item.active ? "Active" : "Inactive"}
          </span>
        );
      default:
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
