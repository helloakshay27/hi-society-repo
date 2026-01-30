import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Plus } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";

const NoticePageList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noticePermission, setNoticePermission] = useState<{
    create?: string;
    update?: string;
    show?: string;
    destroy?: string;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const getNoticePermission = () => {
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
    const permissions = getNoticePermission();
    setNoticePermission(permissions);
  }, []);

  const fetchNotices = useCallback(
    async (search: string) => {
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
        let noticesData = [];
        if (Array.isArray(data)) {
          noticesData = data;
        } else if (data.noticeboards && Array.isArray(data.noticeboards)) {
          noticesData = data.noticeboards;
        } else if (data.data && Array.isArray(data.data)) {
          noticesData = data.data;
        }

        let filteredNotices = noticesData;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredNotices = noticesData.filter(
            (notice) =>
              (notice.notice_heading || "")
                .toLowerCase()
                .includes(searchLower) ||
              (notice.notice_text || "")
                .toLowerCase()
                .includes(searchLower) ||
              (notice.notice_type || "")
                .toLowerCase()
                .includes(searchLower) ||
              (notice.society_name || "")
                .toLowerCase()
                .includes(searchLower) ||
              (notice.user_name || "").toLowerCase().includes(searchLower)
          );
        }

        setNotices(filteredNotices);
      } catch (error) {
        console.error("Error fetching notices:", error);
        toast.error("Failed to fetch notices");
        setNotices([]);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [baseURL]
  );

  useEffect(() => {
    fetchNotices(searchTerm);
  }, [searchTerm, fetchNotices]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleAddNotice = () => {
    navigate("/communication/notice/create");
  };
  
  const handleViewNotice = (id: number) =>
    navigate(`/communication/notice/details/${id}`);
    
  const handleToggleNotice = async (
    id: number,
    currentStatus: boolean
  ) => {
    toast.dismiss();
    try {
      const response = await fetch(
        `${baseURL}/crm/admin/noticeboards/${id}.json`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ noticeboard: { active: !currentStatus } }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update notice status");
      }

      fetchNotices(searchTerm);
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error toggling notice status:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleEditNotice = (id: number) =>
    navigate(`/communication/notice/edit/${id}`);

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
            {noticePermission.show === "true" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewNotice(item.id)}
                title="View"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
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
        return noticePermission.destroy === "true" ? (
          <div className="flex items-center gap-2 text-[11px] font-medium select-none">
            <div
              role="switch"
              aria-checked={item.active}
              aria-label={
                item.active ? "Deactivate notice" : "Activate notice"
              }
              tabIndex={0}
              onClick={() => handleToggleNotice(item.id, item.active)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                handleToggleNotice(item.id, item.active)
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
                <g filter={`url(#filter0_dd_notice_status_${item.id})`}>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z"
                    fill="#C72030"
                  />
                  <path
                    d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z"
                    stroke={`url(#paint0_linear_notice_status_${item.id})`}
                    strokeWidth="0.255453"
                  />
                  <path
                    d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z"
                    stroke={`url(#paint1_linear_notice_status_${item.id})`}
                    strokeWidth="0.255453"
                  />
                </g>
                <defs>
                  <filter
                    id={`filter0_dd_notice_status_${item.id}`}
                    x="0.766113"
                    y="0.893677"
                    width="10.729"
                    height="10.7285"
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
                    <feOffset dy="0.127727" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.258824 0 0 0 0 0.278431 0 0 0 0 0.298039 0 0 0 0.06 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_2484_24321"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="0.127727" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.258824 0 0 0 0 0.278431 0 0 0 0 0.298039 0 0 0 0.1 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="effect1_dropShadow_2484_24321"
                      result="effect2_dropShadow_2484_24321"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect2_dropShadow_2484_24321"
                      result="shape"
                    />
                  </filter>
                  <linearGradient
                    id={`paint0_linear_notice_status_${item.id}`}
                    x1="11.0847"
                    y1="10.9567"
                    x2="1.17741"
                    y2="1.30516"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="white" stopOpacity="0.25" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient
                    id={`paint1_linear_notice_status_${item.id}`}
                    x1="1.17741"
                    y1="1.30516"
                    x2="11.0847"
                    y2="10.9567"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="white" stopOpacity="0.5" />
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
        onClick={handleAddNotice}
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
        data={notices}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="notices"
        storageKey="notices-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search notices..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={
          isSearching ? "Searching notices..." : "Loading notices..."
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

export default NoticePageList;
