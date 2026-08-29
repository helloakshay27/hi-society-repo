import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  Mail,
  Eye,
  X,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import {
  getAppointmentzManageFlats,
  sendFlatInviteEmail,
  getAllRMUsers,
  getScheduleSetup,
  AppointmentzFlat,
  RMUserData,
} from "@/services/appointmentzService";
import axios from "axios";

// Columns configuration with Actions at starting
const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false, draggable: false },
  { key: "id", label: "ID", sortable: true, draggable: true },
  { key: "tower", label: "Tower", sortable: true, draggable: true },
  { key: "flat", label: "Flat", sortable: true, draggable: true },
  { key: "flat_type", label: "Flat Type", sortable: true, draggable: true },
  { key: "payment_status", label: "Payment Status", sortable: true, draggable: true },
  { key: "master_status", label: "Master Status", sortable: true, draggable: true },
  { key: "current_level", label: "Current Level", sortable: true, draggable: true },
  { key: "current_status", label: "Current Status", sortable: true, draggable: true },
  { key: "rm_assigned", label: "Rm Assigned", sortable: true, draggable: true },
  { key: "email_sent_by", label: "Email Sent By", sortable: true, draggable: true },
  { key: "email_sent_at", label: "Email Sent At", sortable: true, draggable: true },
  { key: "site_visits", label: "Site Visits", sortable: true, draggable: true },
  { key: "invite", label: "Invite", sortable: false, draggable: false },
  { key: "snags", label: "Snags", sortable: false, draggable: false },
];

export const AppointmentzManageFlats: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AppointmentzFlat[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter Popup Dialog State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Form inputs inside Popup Modal
  const [filterTower, setFilterTower] = useState<string>("all");
  const [filterFlat, setFilterFlat] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterRmAssigned, setFilterRmAssigned] = useState<string>("all");

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState<{
    tower: string;
    flat: string;
    payment_status: string;
    rm_assigned: string;
  }>({
    tower: "all",
    flat: "all",
    payment_status: "all",
    rm_assigned: "all",
  });

  // Dynamic Options
  const [towerOptions, setTowerOptions] = useState<{ id: string | number; name: string }[]>([]);
  const [flatOptions, setFlatOptions] = useState<string[]>([]);
  const [rmUsers, setRmUsers] = useState<RMUserData[]>([]);
  const [sendingInviteId, setSendingInviteId] = useState<number | null>(null);

  // Fetch RM users and Tower options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const users = await getAllRMUsers();
        if (users && users.length > 0) {
          setRmUsers(users);
        }
      } catch (err) {
        console.warn("Could not fetch RM users:", err);
      }

      try {
        const baseUrl = localStorage.getItem("baseUrl")?.replace(/^https?:\/\//, "");
        const token = localStorage.getItem("token");
        const societyId = localStorage.getItem("selectedSocietyId");
        if (baseUrl && token && societyId) {
          const res = await axios.get(
            `https://${baseUrl}/crm/admin/society_blocks.json?society_id=${societyId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.data?.society_blocks?.length > 0) {
            setTowerOptions(
              res.data.society_blocks.map((t: any) => ({
                id: t.name || t.id,
                name: t.name,
              }))
            );
          }
        }
      } catch (err) {
        console.warn("Could not fetch towers from API:", err);
      }

      try {
        const setup = await getScheduleSetup();
        if (setup?.assets?.logo_url) {
          setSocietyLogo(setup.assets.logo_url);
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchOptions();
  }, []);

  // Fetch Flats data from API
  const fetchFlatsData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAppointmentzManageFlats(currentPage, {
        ...(appliedFilters.tower !== "all" ? { tower: appliedFilters.tower } : {}),
        ...(appliedFilters.flat !== "all" ? { flat: appliedFilters.flat } : {}),
        ...(appliedFilters.payment_status !== "all"
          ? { payment_status: appliedFilters.payment_status }
          : {}),
        ...(appliedFilters.rm_assigned !== "all"
          ? { rm_assigned: appliedFilters.rm_assigned }
          : {}),
        ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
      });

      const list = response.society_flats || response.flats;
      if (list && list.length > 0) {
        const mapped: AppointmentzFlat[] = list.map((item: any) => ({
          id: item.id,
          tower: item.society_block?.name || item.tower || "-",
          flat: item.flat_no || item.flat || "-",
          flat_type:
            item.society_flat_type?.society_flat_type ||
            item.society_flat_type?.name ||
            item.flat_type ||
            "-",
          payment_status: item.payment_status || "-",
          master_status: item.master_status || item.owner_name || "-",
          current_level: item.current_level || "-",
          current_status: item.current_status || "-",
          rm_assigned: item.rm_user?.name || item.rm_assigned || "-",
          email_sent_by: item.email_sent_by || "-",
          email_sent_at: item.email_sent_at || item.created_at || "-",
          site_visits: item.site_visits_count ?? item.site_visits ?? 0,
          snags_count: item.snags_count ?? 0,
          customer_name: item.customer_name || item.bill_to_party || "",
          customer_code: item.customer_code || "",
          customer_status: item.customer_status || "",
          carpet_area: item.build_up_area || "",
          built_up_area: item.super_area || "",
        }));

        setData(mapped);
        setTotalPages(response.pagination?.total_pages || 1);
        setTotalCount(response.pagination?.total_count || mapped.length);

        // Update dynamic flat numbers for filter dropdown
        const flatsList = Array.from(new Set(mapped.map((m) => m.flat).filter((f) => f && f !== "-")));
        if (flatsList.length > 0) {
          setFlatOptions(flatsList);
        }
      } else {
        setData([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.warn("Error fetching flats:", err);
      setData([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, appliedFilters, searchTerm]);

  useEffect(() => {
    fetchFlatsData();
  }, [fetchFlatsData]);

  // Check if current user is an rm_user (scoped to demo flats)
  const isRMUser = useMemo(() => {
    try {
      const hiSocietyAccountRaw = localStorage.getItem("hiSocietyAccount");
      return hiSocietyAccountRaw
        ? JSON.parse(hiSocietyAccountRaw)?.user_type === "rm_user"
        : false;
    } catch {
      return false;
    }
  }, []);

  // For rm_user, restrict to 2 demo flats; for admin and cs_user, show all flats
  const displayedData = useMemo(() => {
    if (isRMUser && data.length > 2) {
      return data.slice(0, 2);
    }
    return data;
  }, [data, isRMUser]);

  // Handle Apply Filter in Popup
  const handleApplyFilter = () => {
    setAppliedFilters({
      tower: filterTower,
      flat: filterFlat,
      payment_status: filterPaymentStatus,
      rm_assigned: filterRmAssigned,
    });
    setIsFilterModalOpen(false);
    setCurrentPage(1);
    toast.success("Filters applied successfully");
  };

  // Handle Reset Filter in Popup
  const handleResetFilter = () => {
    setFilterTower("all");
    setFilterFlat("all");
    setFilterPaymentStatus("all");
    setFilterRmAssigned("all");
    setAppliedFilters({
      tower: "all",
      flat: "all",
      payment_status: "all",
      rm_assigned: "all",
    });
    setSearchTerm("");
    setIsFilterModalOpen(false);
    setCurrentPage(1);
    toast.info("Filters reset");
  };

  // Check if any filter is active
  const hasActiveFilters =
    appliedFilters.tower !== "all" ||
    appliedFilters.flat !== "all" ||
    appliedFilters.payment_status !== "all" ||
    appliedFilters.rm_assigned !== "all";

  // Handle Send Invite directly when Mail icon is clicked
  const handleSendInvite = async (flat: AppointmentzFlat) => {
    setSendingInviteId(flat.id);
    try {
      await sendFlatInviteEmail(flat.id);

      const formattedTimestamp =
        new Date().toLocaleDateString("en-GB") +
        " " +
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setData((prev) =>
        prev.map((item) =>
          item.id === flat.id
            ? {
                ...item,
                email_sent_by: "Admin",
                email_sent_at: formattedTimestamp,
              }
            : item
        )
      );

      const targetLabel = flat.customer_name
        ? `${flat.customer_name} (Flat ${flat.flat})`
        : `Flat ${flat.flat}`;

      toast.success(`Invite sent successfully to ${targetLabel}!`);
    } catch (err: any) {
      console.error("Failed to send flat invite:", err);
      const serverMsg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.errors)
          ? err.response.data.errors.join(", ")
          : typeof err?.response?.data?.error === "string"
          ? err.response.data.error
          : null);

      if (err?.response?.status === 404) {
        toast.error(serverMsg || `Send invite endpoint not found (404) for Flat ${flat.flat}.`);
      } else {
        toast.error(serverMsg || `Failed to send invite to Flat ${flat.flat}. Please retry.`);
      }
    } finally {
      setSendingInviteId(null);
    }
  };

  // Navigate to Detail View
  const handleViewFlatDetails = (flatId: number | string) => {
    navigate(`/appointmentz/manage-flats/view/${flatId}`);
  };

  // Custom Cell Rendering for EnhancedTable
  const renderCell = (item: AppointmentzFlat, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleViewFlatDetails(item.id)}
              title="View Flat Details"
              className="inline-flex items-center justify-center p-1.5 rounded hover:bg-[#fbeeed] text-gray-500 hover:text-[#C72030] transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );

      case "id":
        return <span className="font-medium text-gray-700">{item.id}</span>;

      case "tower":
        return <span className="text-gray-700">{item.tower}</span>;

      case "flat":
        return <span className="font-medium text-gray-900">{item.flat}</span>;

      case "flat_type":
        return <span className="text-gray-600">{item.flat_type}</span>;

      case "payment_status":
        return <span className="text-gray-800">{item.payment_status}</span>;

      case "master_status":
        return <span className="text-gray-800">{item.master_status}</span>;

      case "current_level":
        return <span className="text-gray-600">{item.current_level}</span>;

      case "current_status":
        return <span className="text-gray-500">{item.current_status || "-"}</span>;

      case "rm_assigned":
        return <span className="text-gray-500">{item.rm_assigned || "-"}</span>;

      case "email_sent_by":
        return <span className="text-gray-500">{item.email_sent_by || "-"}</span>;

      case "email_sent_at":
        return <span className="text-gray-600">{item.email_sent_at || "-"}</span>;

      case "site_visits":
        return <span className="text-gray-700">{item.site_visits}</span>;

      case "invite":
        return (
          <div className="flex justify-center">
            <button
              onClick={() => handleSendInvite(item)}
              disabled={sendingInviteId === item.id}
              title="Send Invite Email to Resident"
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white border border-[#D5DbDB] hover:bg-[#f6f4ee] hover:border-[#DA7756] transition-all shadow-2xs group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingInviteId === item.id ? (
                <Loader2 className="w-3.5 h-3.5 text-[#DA7756] animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-[#DA7756] group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>
        );

      case "snags":
        return (
          <div className="flex justify-center">
            <span
              className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 text-xs font-semibold text-white bg-[#C72030] rounded shadow-2xs"
            >
              {item.snags_count}
            </span>
          </div>
        );

      default:
        return (item as any)[columnKey] || "-";
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
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

  return (
    <div className="p-4 md:p-6 bg-[#fbfbfa] min-h-screen">
      {/* EnhancedTable with right-side filter icon & Column Selector */}
      <EnhancedTable
        data={displayedData}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableGlobalSearch={true}
        onGlobalSearch={(term) => {
          setSearchTerm(term);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search"
        storageKey="appointmentz-manage-flats-table"
        hideColumnsButton={false}
        hideTableExport={true}
        onFilterClick={() => setIsFilterModalOpen(true)}
        filterButtonClassName="border-[#DA7756] text-[#DA7756] hover:bg-[#DA7756]/10 hover:border-[#DA7756]"
        loading={loading}
        leftActions={
          hasActiveFilters ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFilter}
                className="flex items-center gap-1 text-xs text-[#DA7756] hover:text-[#DA7756]/80 bg-[#fbeeed] px-2.5 py-1.5 rounded border border-[#DA7756]/30 font-medium"
              >
                <span>Clear Filters</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : null
        }
      />

      {/* Standard Pagination (Only shown when not restricted to demo flats) */}
      {!isRMUser && data.length > 0 && (
        <div className="mt-4 flex justify-center">
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
                  className={currentPage === totalPages || totalPages === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Filter Modal Popup Dialog */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#D5DbDB] shadow-2xl bg-white">
          <DialogHeader className="bg-[#f6f4ee] px-6 py-4 border-b border-[#D5DbDB] flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#DA7756]" />
              Filter Flats
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 bg-white space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Tower */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Select Tower</Label>
                <Select value={filterTower} onValueChange={setFilterTower}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white focus:ring-[#DA7756]">
                    <SelectValue placeholder="Select Tower" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all" className="text-xs">All Towers</SelectItem>
                    {towerOptions.map((t) => (
                      <SelectItem key={t.id} value={t.name} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Flat */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Select Flat</Label>
                <Select value={filterFlat} onValueChange={setFilterFlat}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white focus:ring-[#DA7756]">
                    <SelectValue placeholder="Select Flat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all" className="text-xs">All Flats</SelectItem>
                    {flatOptions.map((f) => (
                      <SelectItem key={f} value={f} className="text-xs">
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Payment Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Select Payment Status</Label>
                <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white focus:ring-[#DA7756]">
                    <SelectValue placeholder="Select Payment Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all" className="text-xs">All Payment Statuses</SelectItem>
                    <SelectItem value="Full Payment" className="text-xs">Full Payment</SelectItem>
                    <SelectItem value="Partial Payment" className="text-xs">Partial Payment</SelectItem>
                    <SelectItem value="Pending" className="text-xs">Pending</SelectItem>
                    <SelectItem value="Overdue" className="text-xs">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Select RM Assigned */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Select RM Assigned</Label>
                <Select value={filterRmAssigned} onValueChange={setFilterRmAssigned}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white focus:ring-[#DA7756]">
                    <SelectValue placeholder="Select RM Assigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all" className="text-xs">All RM Users</SelectItem>
                    {rmUsers.map((rm) => (
                      <SelectItem
                        key={rm.id}
                        value={rm.full_name || `${rm.first_name || ""} ${rm.last_name || ""}`}
                        className="text-xs"
                      >
                        {rm.full_name || `${rm.first_name || ""} ${rm.last_name || ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#f6f4ee] px-6 py-3 border-t border-[#D5DbDB] flex items-center justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={handleResetFilter}
              className="border-[#DA7756] text-[#DA7756] hover:bg-[#fbeeed] text-xs font-semibold px-4 h-9"
            >
              Reset
            </Button>
            <Button
              onClick={handleApplyFilter}
              className="btn-primary text-xs font-semibold px-5 h-9 shadow-xs"
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentzManageFlats;

