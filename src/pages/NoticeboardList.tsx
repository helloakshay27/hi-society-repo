import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";

const NoticeboardList = () => {
  const { shouldShow } = useDynamicPermissions();
  const navigate = useNavigate();
  const [allNoticeboards, setAllNoticeboards] = useState([]);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

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

        setAllNoticeboards(filteredNoticeboards);
        setTotalPages(Math.ceil(filteredNoticeboards.length / itemsPerPage) || 1);
      } catch (error) {
        console.error("Error fetching noticeboards:", error);
        toast.error("Failed to fetch noticeboards");
        setAllNoticeboards([]);
        setTotalPages(1);
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

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    setNoticeboards(allNoticeboards.slice(startIndex, startIndex + itemsPerPage));
  }, [allNoticeboards, currentPage]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) {
      return null;
    }
    const items = [];
    const showEllipsis = totalPages > 5;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
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
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
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
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
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
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
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
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
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
            {shouldShow("Broadcast", "show") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewNoticeboard(item.id)}
                title="View"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {shouldShow("Broadcast", "update") && (
              <Button variant="ghost" size="sm" onClick={() => handleEditNoticeboard(item.id)} title="Edit">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case "id":
        return (
          <span className="text-sm text-gray-700">
            {(currentPage - 1) * itemsPerPage + index + 1}
          </span>
        );
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
            <button
              onClick={() => handleToggleNoticeboard(item.id, item.active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                item.active ? "bg-[#C72030]" : "bg-gray-300"
              }`}
            >
              <div
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  item.active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ) : (
          <span className="text-sm text-gray-600 font-medium">
            {item.active ? 'Active' : 'Inactive'}
          </span>
        );
      default:
        return item[columnKey] ?? "-";
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {shouldShow("Broadcast", "create") && (
        <Button
          onClick={handleAddNoticeboard}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Add
        </Button>
      )}
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
      {allNoticeboards.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
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
