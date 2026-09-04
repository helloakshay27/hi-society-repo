import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil, X } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { NoticeFilterDialog, NoticeFilters } from "@/components/NoticeFilterDialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

const HiSocNoticeList = () => {
  const navigate = useNavigate();
  const { shouldShow } = useDynamicPermissions();
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<NoticeFilters | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PER_PAGE = 10;

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
    async (search: string, filters?: NoticeFilters | null, page = 1) => {
      setLoading(true);
      setIsSearching(!!search);
      try {
        // Build query string from active filters
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("per_page", String(PER_PAGE));
        params.set("q[s]", "created_at desc");
        if (search) {
          params.set("q[notice_heading_or_notice_text_cont]", search);
        }
        if (filters) {
          filters.tower_ids.forEach((id) =>
            params.append(
              "q[user_society_user_flat_society_flat_society_block_id_in][]",
              id
            )
          );
          filters.flat_ids.forEach((id) =>
            params.append(
              "q[user_society_user_flat_society_flat_id_in][]",
              id
            )
          );
          filters.shared_in.forEach((v) =>
            params.append("q[shared_in][]", v)
          );
          if (filters.date_range) {
            params.append("q[date_range]", filters.date_range);
          }
          filters.publish_in.forEach((v) =>
            params.append("q[publish_in][]", v)
          );
        }
        const qs = params.toString();
        const url = getFullUrl(
          `/crm/admin/noticeboards.json${qs ? `?${qs}` : ""}`
        );
        const response = await fetch(url, {
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

        // Update pagination from response metadata if available
        if (data.pagination) {
          setTotalPages(data.pagination.total_pages || 1);
        } else if (data.meta) {
          setTotalPages(data.meta.total_pages || 1);
        } else {
          setTotalPages(1);
        }

        setNoticeboards(noticeboardsData);
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
    fetchNoticeboards(searchTerm, activeFilters, currentPage);
  }, [searchTerm, activeFilters, currentPage, fetchNoticeboards]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  const handleApplyFilters = (filters: NoticeFilters) => {
    const hasFilters =
      filters.tower_ids.length > 0 ||
      filters.flat_ids.length > 0 ||
      filters.shared_in.length > 0 ||
      filters.date_range !== "" ||
      filters.publish_in.length > 0;
    setCurrentPage(1);
    setActiveFilters(hasFilters ? filters : null);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setActiveFilters(null);
  };

  const handleGlobalSearch = (term: string) => {
    setCurrentPage(1);
    setSearchTerm(term);
  };

  const handleAddNoticeboard = () => {
    navigate("/bms/hisoc-notice-create");
  };
  const handleViewNoticeboard = (id: number) =>
    navigate(`/bms/hisoc-notice-details/${id}`);
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

      fetchNoticeboards(searchTerm, activeFilters, currentPage);
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error toggling noticeboard status:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleEditNoticeboard = (id: number) =>
    navigate(`/bms/hisoc-notice-edit/${id}`);

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
    { key: "block", label: "Block", sortable: true },
    // { key: "flat", label: "Flat", sortable: true },
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
    rowIndex?: number
  ) => {
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const index = rowIndex ?? noticeboards.findIndex((n: any) => n.id === item.id);
    
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-1">
            {noticeboardPermission.show === "true" && shouldShow("Notice","show") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewNoticeboard(item.id)}
                title="View"
              >
                <Eye className="w-4 h-4" />
              </Button>
  
            )}
            {noticeboardPermission.update === "true" && shouldShow("Notice","update") &&(
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditNoticeboard(item.id)}
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
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
      case "block":
         return [item.block, item.flat]
        .filter(Boolean)
        .join(" - ") || "-";
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
          <div className="flex items-center justify-center">
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
          <span className="text-sm text-gray-500">
            {item.active ? "Active" : "Inactive"}
          </span>
        );
      default:
        return item[columnKey] ?? "-";
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2">
      {shouldShow("Notice","create")&&(
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
        rightActions={
          activeFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </Button>
          ) : undefined
        }
        onFilterClick={() => setIsFilterOpen(true)}
        loading={isSearching || loading}
        loadingMessage={
          isSearching ? "Searching broadcasts..." : "Loading broadcasts..."
        }
      />
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
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">{renderListTab()}</div>
      <NoticeFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default HiSocNoticeList;
