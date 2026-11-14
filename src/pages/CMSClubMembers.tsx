import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Switch } from "@mui/material";
import axios from "axios";
import {
  Edit,
  Eye,
  Plus,
  QrCode,
  Users,
  UserCheck,
  Clock,
  UserX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CMSClubMembersFilterModal } from "@/components/CMSClubMembersFilterModal";
import { StatsCard } from "@/components/StatsCard";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const columns: ColumnConfig[] = [
  {
    key: "tower",
    label: "Tower",
    sortable: true,
    draggable: true,
  },
  {
    key: "flat",
    label: "Flat",
    sortable: true,
    draggable: true,
  },
  {
    key: "members",
    label: "Members",
    sortable: true,
    draggable: true,
  },
  {
    key: "member_names",
    label: "Member Names",
    sortable: true,
    draggable: true,
  },
  {
    key: "emails",
    label: "Emails",
    sortable: true,
    draggable: true,
  },
  {
    key: "mobiles",
    label: "Mobiles",
    sortable: true,
    draggable: true,
  },
  {
    key: "resident_types",
    label: "Resident Type",
    sortable: true,
    draggable: true,
  },
  {
    key: "membership_plan",
    label: "Membership Plan",
    sortable: true,
    draggable: true,
  },

  {
    key: "start_date",
    label: "Start Date",
    sortable: true,
    draggable: true,
  },
  {
    key: "end_date",
    label: "End Date",
    sortable: true,
    draggable: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    draggable: true,
  },
  {
    key: "created_on",
    label: "Created On",
    sortable: true,
    draggable: true,
  },
];

interface MemberFilters {
  towerId?: string;
  flatId?: string;
  residentType?: string;
  status?: string;
  cardAllocated?: string;
  expired?: string;
}

// Filter field → its key in the page URL (?tower=1&status=active...)
const FILTER_URL_KEYS: Record<keyof MemberFilters, string> = {
  towerId: "tower",
  flatId: "flat",
  residentType: "resident_type",
  status: "status",
  cardAllocated: "card_allocated",
  expired: "expired",
};
const SEARCH_URL_KEY = "search";

const readFiltersFromUrl = (params: URLSearchParams): MemberFilters => {
  const filters: MemberFilters = {};
  (Object.keys(FILTER_URL_KEYS) as (keyof MemberFilters)[]).forEach((field) => {
    const value = params.get(FILTER_URL_KEYS[field]);
    if (value) filters[field] = value;
  });
  return filters;
};

const CMSClubMembers = () => {
  const navigate = useNavigate();
  const { shouldShow } = useDynamicPermissions();

  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const [searchParams, setSearchParams] = useSearchParams();
  // The URL (?page=N) is the source of truth for the current page, so refresh/back/shared links keep it
  const parsedPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({
    total_count: 0,
    per_page: 20,
    current_page: 1,
    total_pages: 1,
  });
  const requestIdRef = useRef(0);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    title: string;
    items: string[];
  }>({ isOpen: false, title: "", items: [] });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState({
    total_members: 0,
    total_active: 0,
    total_inactive: 0,
    total_pending: 0,
  });

  // Filters and search live in the URL too, so refresh/back/shared links keep them
  const filtersKey = (Object.values(FILTER_URL_KEYS) as string[])
    .map((key) => searchParams.get(key) || "")
    .join("|");
  const appliedFilters = useMemo(
    () => readFiltersFromUrl(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey]
  );

  // Toolbar search box → `member_search` (matches first/last name, email,
  // mobile or membership number). Kept apart from the modal filters so
  // applying the modal doesn't wipe the search.
  const memberSearch = searchParams.get(SEARCH_URL_KEY) || "";
  // What's typed in the search box (the URL only updates after the debounce)
  const [searchInputText, setSearchInputText] = useState(memberSearch);
  useEffect(() => {
    // Back/forward navigation changed the search → show it in the box
    setSearchInputText(memberSearch);
  }, [memberSearch]);

  // Shared by the list and the export so both always apply the same filters
  const buildFilterParams = (filters: MemberFilters, search = memberSearch) => {
    const params = new URLSearchParams();

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      params.append("member_search", trimmedSearch);
    }
    if (filters.towerId) {
      params.append("q[society_flat_society_block_id_eq]", filters.towerId);
    }
    if (filters.flatId) {
      params.append("q[society_flat_id_in]", filters.flatId);
    }
    if (filters.residentType) {
      params.append("q[resident_type_in]", filters.residentType);
    }
    // Membership Status: the API only reads `status` = active | inactive | pending
    // (Approved | Expired | Pending). Omit it to get all three.
    if (filters.status && ["active", "inactive", "pending"].includes(filters.status)) {
      params.append("status", filters.status);
    }
    if (filters.cardAllocated) {
      params.append("q[access_card_check_eq]", filters.cardAllocated);
    }
    if (filters.expired) {
      params.append("q[end_date]", filters.expired);
    }

    return params;
  };

  const fetchMembers = async (page: number, filters: MemberFilters, search: string) => {
    // Ignore responses from older requests when the user changes page/filters quickly
    const requestId = ++requestIdRef.current;
    try {
      setIsLoading(true);
      const params = buildFilterParams(filters, search);
      params.append("page", page.toString());
      const url = `https://${baseUrl}/club_member_allocations.json?${params.toString()}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (requestId !== requestIdRef.current) return;

      const meta = response.data?.pagination;
      const totalPagesFromApi = Math.max(1, Number(meta?.total_pages) || 1);

      // Page in the URL is beyond the last page (e.g. records were deleted) — clamp it
      if (page > totalPagesFromApi) {
        handlePageChange(totalPagesFromApi, true);
        return;
      }

      setMembers(response.data?.club_member_allocations || []);
      setPagination({
        total_count: Number(meta?.total_count) || 0,
        per_page: Number(meta?.per_page) || 20,
        current_page: Number(meta?.current_page) || page,
        total_pages: totalPagesFromApi,
      });
      if (response.data?.summary) {
        setSummaryData(response.data.summary);
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error("Error fetching club members:", error);
      toast.error("Failed to load club members");
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const totalPages = pagination.total_pages;

  // Updating the URL triggers the fetch effect below; other query params are preserved
  const handlePageChange = (page: number, replace = false) => {
    if (page < 1 || (page > totalPages && !replace)) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (page === 1) next.delete("page");
        else next.set("page", page.toString());
        return next;
      },
      { replace }
    );
  };

  // Writes the filters to the URL (which triggers the fetch) and goes back to page 1
  const handleFilterApply = (filters: MemberFilters) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      (Object.keys(FILTER_URL_KEYS) as (keyof MemberFilters)[]).forEach((field) => {
        const value = filters[field];
        if (value) next.set(FILTER_URL_KEYS[field], value);
        else next.delete(FILTER_URL_KEYS[field]);
      });
      next.delete("page");
      return next;
    });
  };

  // Summary card click → filter the list by that membership status.
  // "Total Members" (empty status) clears the status filter; other filters are kept.
  const handleStatusCardClick = (status: "" | "active" | "inactive" | "pending") => {
    if ((appliedFilters.status || "") === status) return;
    handleFilterApply({ ...appliedFilters, status: status || undefined });
  };

  const activeStatus = appliedFilters.status || "";

  // Called by EnhancedTable after the user stops typing (debounced)
  const handleMemberSearch = (term: string) => {
    const nextSearch = term.trim();
    if (nextSearch === memberSearch) return;
    // New search → back to the first page. Replace (not push) so typing
    // doesn't flood the browser history.
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextSearch) next.set(SEARCH_URL_KEY, nextSearch);
        else next.delete(SEARCH_URL_KEY);
        next.delete("page");
        return next;
      },
      { replace: true }
    );
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInputText(value);
    // Clearing the box applies straight away (the table's debounce skips an
    // empty value when the search came from the URL)
    if (!value.trim()) handleMemberSearch("");
  };

  const renderPageLink = (page: number) => (
    <PaginationItem key={page} className="cursor-pointer">
      <PaginationLink
        onClick={() => handlePageChange(page)}
        isActive={currentPage === page}
      >
        {page}
      </PaginationLink>
    </PaginationItem>
  );

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;

    // Always show first, last and current ±1. Near either end, show the first/last 4
    // so the next page is always one click away.
    const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    if (currentPage <= 3) [2, 3, 4].forEach((p) => pages.add(p));
    if (currentPage >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));

    const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

    const items = [];
    sorted.forEach((page, idx) => {
      const prev = sorted[idx - 1];
      if (prev !== undefined && page - prev > 1) {
        if (page - prev === 2) {
          // A gap of exactly one page: show that page instead of "…"
          items.push(renderPageLink(prev + 1));
        } else {
          items.push(
            <PaginationItem key={`ellipsis-${prev}`}>
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
      }
      items.push(renderPageLink(page));
    });

    return items;
  };

  useEffect(() => {
    fetchMembers(currentPage, appliedFilters, memberSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedFilters, memberSearch]);

  // GET /club_member_allocations/export.xlsx — same filters as the list (no
  // pagination), one row per club member
  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const queryString = buildFilterParams(appliedFilters).toString();
      const response = await axios.get(
        `https://${baseUrl}/club_member_allocations/export.xlsx${queryString ? `?${queryString}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "club_members.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Club members exported successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to export club members");
    } finally {
      setIsExporting(false);
    }
  };

  const printSocietyQR = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/club_members/print_society_qr_code.pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "society_qr_code.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
    }
  };

  const renderActions = (item: any) => {
    return (
      <div className="flex gap-2">
        {shouldShow("Club Members", "show") && (
          <Button
            size="sm"
            variant="ghost"
            className="p-1"
            onClick={() => navigate(`view/${item.id}`)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {shouldShow("Club Members", "update") && (
          <Button
            size="sm"
            variant="ghost"
            className="p-1"
            onClick={() => navigate(`edit/${item.id}`)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  const leftActions = shouldShow("Club Members", "create") && (
    <Button
      onClick={() => setShowActionPanel(true)}
      variant="ghost"
      className="!bg-[var(--color-primary,#da7756)] hover:!bg-[var(--color-primary-hover,rgba(218,119,86,0.85))] !text-white [&_svg]:!text-white h-[36px] py-[10px] px-[20px]"
    >
      <Plus className="w-4 h-4" />
      Actions
    </Button>
  );

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "flat":
        return item?.flat?.flat_no || "-";
      case "tower":
        return item?.tower?.name || "-";
      case "members":
        return (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C72030]" />
            <span className="font-medium">
              {item.club_members?.length || 0}
            </span>
          </div>
        );

      case "member_names":
        const names = item.club_members
          ?.map((m) => m.first_name + " " + m.last_name)
          .filter(Boolean);
        if (!names || names.length === 0)
          return <span className="text-gray-400">-</span>;

        return (
          <div className="flex flex-col gap-1">
            {names.slice(0, 2).map((name, idx) => (
              <span key={idx} className="text-sm">
                {name}
              </span>
            ))}
            {names.length > 2 && (
              <span
                className="text-xs text-black-600 cursor-pointer hover:underline"
                onClick={() => {
                  setModalData({
                    isOpen: true,
                    title: "Member Names",
                    items: names,
                  });
                }}
              >
                +{names.length - 2} more
              </span>
            )}
          </div>
        );

      case "emails":
        const emails = item.club_members?.map((m) => m.email).filter(Boolean);
        if (!emails || emails.length === 0)
          return <span className="text-gray-400">-</span>;

        return (
          <div className="flex flex-col gap-1">
            {emails.slice(0, 2).map((email, idx) => (
              <span key={idx} className="text-sm">
                {email}
              </span>
            ))}
            {emails.length > 2 && (
              <span
                className="text-xs text-black-600 cursor-pointer hover:underline"
                onClick={() => {
                  setModalData({
                    isOpen: true,
                    title: "Member Emails",
                    items: emails,
                  });
                }}
              >
                +{emails.length - 2} more
              </span>
            )}
          </div>
        );

      case "mobiles":
        const mobiles = item.club_members?.map((m) => m.mobile).filter(Boolean);
        if (!mobiles || mobiles.length === 0)
          return <span className="text-gray-400">-</span>;

        return (
          <div className="flex flex-col gap-1">
            {mobiles.slice(0, 2).map((mobile, idx) => (
              <span key={idx} className="text-sm">
                {mobile}
              </span>
            ))}
            {mobiles.length > 2 && (
              <span
                className="text-xs text-black-600 cursor-pointer hover:underline"
                onClick={() => {
                  setModalData({
                    isOpen: true,
                    title: "Member Mobiles",
                    items: mobiles,
                  });
                }}
              >
                +{mobiles.length - 2} more
              </span>
            )}
          </div>
        );

      case "resident_types": {
        const residentTypes = item.club_members
          ?.map((m) => m.resident_type)
          .filter(Boolean);
        if (!residentTypes || residentTypes.length === 0)
          return <span className="text-gray-400">-</span>;

        return (
          <div className="flex flex-col gap-1">
            {residentTypes.slice(0, 2).map((type, idx) => (
              <span key={idx} className="text-sm">
                {type}
              </span>
            ))}
            {residentTypes.length > 2 && (
              <span
                className="text-xs text-black-600 cursor-pointer hover:underline"
                onClick={() => {
                  setModalData({
                    isOpen: true,
                    title: "Resident Types",
                    items: residentTypes,
                  });
                }}
              >
                +{residentTypes.length - 2} more
              </span>
            )}
          </div>
        );
      }

      case "membership_plan":
        return item?.membership_plan?.name || "-";

      case "start_date":
        if (!item?.start_date) return "-";
        return new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(item.start_date));

      case "end_date":
        if (!item?.end_date) return "-";
        return new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(item.end_date));

      case "created_on":
        if (!item?.created_at) return "-";
        return new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(item.created_at));

      default:
        return item[columnKey] || "-";
    }
  };

  const actions = [
    {
      label: "Society QR",
      onClick: printSocietyQR,
      icon: QrCode,
    },
  ];

  return (
    <div className="p-6">
      {showActionPanel && (
        <SelectionPanel
          onAdd={() => navigate("add")}
          actions={actions}
          onClearSelection={() => setShowActionPanel(false)}
        />
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatsCard
          title="Total Members"
          value={summaryData.total_members.toString()}
          icon={<Users className="w-5 h-5 text-[#C72030]" />}
          downloadData={[]}
          selected={activeStatus === ""}
          onClick={() => handleStatusCardClick("")}
        />
        <StatsCard
          title="Approved"
          value={summaryData.total_active.toString()}
          icon={<UserCheck className="w-5 h-5 text-[#C72030]" />}
          downloadData={[]}
          selected={activeStatus === "active"}
          onClick={() => handleStatusCardClick("active")}
        />
        <StatsCard
          title="Expired"
          value={summaryData.total_inactive.toString()}
          icon={<UserX className="w-5 h-5 text-[#C72030]" />}
          downloadData={[]}
          selected={activeStatus === "inactive"}
          onClick={() => handleStatusCardClick("inactive")}
        />
        <StatsCard
          title="Pending"
          value={summaryData.total_pending.toString()}
          icon={<Clock className="w-5 h-5 text-[#C72030]" />}
          downloadData={[]}
          selected={activeStatus === "pending"}
          onClick={() => handleStatusCardClick("pending")}
        />
      </div>

      <EnhancedTable
        storageKey="cms-club-members-table"
        data={members}
        pagination={false}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
        leftActions={leftActions}
        loading={isLoading}
        onFilterClick={() => setIsFilterModalOpen(true)}
        enableGlobalSearch={true}
        onGlobalSearch={handleMemberSearch}
        searchValue={searchInputText}
        onSearchChange={handleSearchInputChange}
        searchPlaceholder="Search name, email, mobile or membership no."
        enableExport={true}
        onExport={handleExport}
      />

      {pagination.total_count > 0 && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1 || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage >= totalPages || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <span className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pagination.per_page + 1}–
            {Math.min(currentPage * pagination.per_page, pagination.total_count)} of{" "}
            {pagination.total_count}
          </span>
        </div>
      )}

      <CMSClubMembersFilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        onApply={handleFilterApply}
        appliedFilters={appliedFilters}
      />
    </div>
  );
};

export default CMSClubMembers;
