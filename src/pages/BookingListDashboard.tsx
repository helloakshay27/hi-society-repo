import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Plus, X, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TextField,
  MenuItem,
  createTheme,
  ThemeProvider,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  Select as MuiSelect,
} from "@mui/material";
import { ExportByCentreModal } from "@/components/ExportByCentreModal";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import type { ColumnConfig } from "@/hooks/useEnhancedTable";
import { useAppDispatch } from "@/store/hooks";
import { filterBookings } from "@/store/slices/facilityBookingsSlice";
import type { BookingData } from "@/services/bookingService";
import { toast } from "sonner";
import { format, isValid, parse } from "date-fns";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import axios from "axios";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

const enhancedTableColumns: ColumnConfig[] = [
  { key: "id", label: "ID", sortable: true, draggable: true },
  { key: "bookedBy", label: "Booked By", sortable: true, draggable: true },
  { key: "tower", label: "Tower", sortable: true, draggable: true },
  { key: "flat", label: "Flat", sortable: true, draggable: true },
  { key: "facility", label: "Facility Name", sortable: true, draggable: true },
  {
    key: "subFacilityName",
    label: "Sub Facility Name",
    sortable: true,
    draggable: true,
  },
  {
    key: "facilityType",
    label: "Facility Type",
    sortable: true,
    draggable: true,
  },
  {
    key: "scheduledDate",
    label: "Scheduled Date",
    sortable: true,
    draggable: true,
  },
  {
    key: "scheduledTime",
    label: "Scheduled Time",
    sortable: true,
    draggable: true,
  },
  { key: "createdOn", label: "Booked On", sortable: true, draggable: true },
  {
    key: "totalAmount",
    label: "Total Amount",
    sortable: true,
    draggable: true,
  },
  {
    key: "refundableAmount",
    label: "Refundable Amount",
    sortable: true,
    draggable: true,
  },
  { key: "gst", label: "GST", sortable: true, draggable: true },
  { key: "amountPaid", label: "Amount Paid", sortable: true, draggable: true },
  {
    key: "paymentStatus",
    label: "Payment Status",
    sortable: true,
    draggable: true,
  },
  {
    key: "bookingStatus",
    label: "Booking Status",
    sortable: true,
    draggable: true,
  },
  { key: "member", label: "Member", sortable: true, draggable: true },
  { key: "nonMember", label: "Non Member", sortable: true, draggable: true },
  { key: "guest", label: "Guest", sortable: true, draggable: true },
  { key: "tenant", label: "Tenant", sortable: true, draggable: true },
];

const muiTheme = createTheme({
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
            backgroundColor: "#FFFFFF",
            height: { xs: "36px", sm: "45px" },
            "& fieldset": {
              borderColor: "#E0E0E0",
            },
            "&:hover fieldset": {
              borderColor: "#1A1A1A",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#8B4B8C",
              borderWidth: 2,
            },
          },
          "& .MuiInputLabel-root": {
            color: "#000000",
            fontWeight: 500,
            fontSize: { xs: "12px", sm: "14px" },
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#8B4B8C",
          },
          "& .MuiInputLabel-shrink": {
            transform: "translate(14px, -9px) scale(0.75)",
            backgroundColor: "#FFFFFF",
            padding: "0 4px",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          color: "#1A1A1A",
          fontSize: "14px",
          fontWeight: 400,
          padding: "12px 14px",
          "&::placeholder": {
            color: "#1A1A1A",
            opacity: 0.54,
          },
          "@media (max-width: 768px)": {
            fontSize: "12px",
            padding: "8px 12px",
          },
        },
      },
    },
  },
});

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Confirmed":
      return "success";
    case "Pending":
      return "warning";
    case "cancelled":
      return "destructive";
    case "Completed":
      return "default";
    case "Rejected":
      return "destructive";
    default:
      return "default";
  }
};

// URL query keys for the bookings list (page, search and applied filters)
const URL_KEYS = {
  page: "page",
  search: "search",
  facility: "facility",
  status: "status",
  paymentStatus: "payment_status",
  bookedOnFrom: "booked_on_from",
  bookedOnTo: "booked_on_to",
  scheduledFrom: "scheduled_from",
  scheduledTo: "scheduled_to",
} as const;

// Free-text search param sent to /crm/admin/facility_bookings.json
const BOOKING_SEARCH_PARAM = "q[search_all_fields_cont]";
const PAGE_SIZE = 10;

interface AppliedBookingFilters {
  page: number;
  search: string;
  facilityName: string;
  status: string;
  paymentStatus: string;
  // The modal's "Booked On" inputs use scheduledDate*, "Scheduled On" uses createdOnDate*
  scheduledDateFrom: string;
  scheduledDateTo: string;
  createdOnDateFrom: string;
  createdOnDateTo: string;
}

// yyyy-MM-dd only; anything else in the URL is ignored rather than crashing date-fns
const readUrlDate = (params: URLSearchParams, key: string) => {
  const value = params.get(key) || "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    isValid(parse(value, "yyyy-MM-dd", new Date()))
    ? value
    : "";
};

const readAppliedFromUrl = (params: URLSearchParams): AppliedBookingFilters => ({
  page: Math.max(1, Math.floor(Number(params.get(URL_KEYS.page))) || 1),
  search: (params.get(URL_KEYS.search) || "").trim(),
  facilityName: params.get(URL_KEYS.facility) || "",
  status: params.get(URL_KEYS.status) || "",
  paymentStatus: params.get(URL_KEYS.paymentStatus) || "",
  scheduledDateFrom: readUrlDate(params, URL_KEYS.bookedOnFrom),
  scheduledDateTo: readUrlDate(params, URL_KEYS.bookedOnTo),
  createdOnDateFrom: readUrlDate(params, URL_KEYS.scheduledFrom),
  createdOnDateTo: readUrlDate(params, URL_KEYS.scheduledTo),
});

const toApiDate = (value: string) =>
  value ? format(parse(value, "yyyy-MM-dd", new Date()), "MM/dd/yyyy") : null;

// q[...] filters shared by the list fetch and the export, so both always match
const buildFilterParams = (f: AppliedBookingFilters): Record<string, string> => {
  const formatedScheduleStartDate = toApiDate(f.scheduledDateFrom);
  const formatedScheduleEndDate = toApiDate(f.scheduledDateTo);
  const formatedCreatedStartDate = toApiDate(f.createdOnDateFrom);
  const formatedCreatedEndDate = toApiDate(f.createdOnDateTo);

  return {
    ...(f.facilityName && { "q[facility_id_in]": f.facilityName }),
    ...(f.status && { "q[current_status_cont]": f.status }),
    ...(f.paymentStatus && { "q[pg_state_eq]": f.paymentStatus }),
    ...(formatedCreatedStartDate &&
      formatedCreatedEndDate && {
      "q[date_range]": `${formatedCreatedStartDate} - ${formatedCreatedEndDate}`,
    }),
    ...(formatedScheduleStartDate &&
      formatedScheduleEndDate && {
      "q[date_range1]": `${formatedScheduleStartDate} - ${formatedScheduleEndDate}`,
    }),
  };
};

const formatBookingDate = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return '-';
  }
};

const safeValue = (value: any): string => {
  if (value === 0) return "0";
  return value?.toString().trim() ? value.toString() : "-";
};

// API booking -> table row
const toBookingRow = (item: any) => ({
  id: item.id,
  bookedBy: safeValue(item.booked_by_name || item.book_by),
  tower: safeValue(item.tower),
  flat: safeValue(item.flat),
  bookedFor: safeValue(item.booked_by_name || item.book_for),
  companyName: safeValue(item.company_name),
  facility: safeValue(item.facility_name),
  subFacilityName: safeValue(item.sub_facility_name),
  facilityType: safeValue(item.fac_type),
  scheduledDate: formatBookingDate(item.startdate),
  scheduledTime: safeValue(item.show_schedule_24_hour || item.show_schedule),
  createdOn: format(item.created_at, 'dd MMMM yyyy, hh:mm a'),
  source: safeValue(item.source),
  totalAmount: safeValue(item.amount_full),
  refundableAmount: safeValue(item.refunded_amount),
  gst: safeValue(item.gst),
  amountPaid: safeValue(item.amount_paid),
  paymentStatus: safeValue(item.pg_state),
  bookingStatus: (item.current_status as 'Confirmed' | 'Pending' | 'cancelled' | 'Rejected') || 'Pending',
  member: safeValue(item.member_count),
  nonMember: safeValue(item.non_member_count),
  guest: safeValue(item.guest_count),
  tenant: safeValue(item.tenant_count),
});

const BookingListDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { shouldShow } = useDynamicPermissions()
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  // Applied filters, search and page live in the URL so the view survives
  // refresh, back/forward and can be shared as a link.
  const [searchParams, setSearchParams] = useSearchParams();
  const applied = useMemo(() => readAppliedFromUrl(searchParams), [searchParams]);

  const [bookingData, setBookingData] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportByCentreModalOpen, setIsExportByCentreModalOpen] =
    useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const isPageLoading = loading;
  const isFiltering = loading;
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  // Filter modal draft — copied from the URL, written back on Apply
  const [filters, setFilters] = useState({
    facilityName: applied.facilityName,
    status: applied.status,
    paymentStatus: applied.paymentStatus,
    scheduledDateRange: "",
    createdOnDateRange: "",
  });
  const [scheduledDateFrom, setScheduledDateFrom] = useState<string>(applied.scheduledDateFrom);
  const [scheduledDateTo, setScheduledDateTo] = useState<string>(applied.scheduledDateTo);
  const [createdOnDateFrom, setCreatedOnDateFrom] = useState<string>(applied.createdOnDateFrom);
  const [createdOnDateTo, setCreatedOnDateTo] = useState<string>(applied.createdOnDateTo);
  const [searchInput, setSearchInput] = useState(applied.search);
  const debouncedSearch = useDebounce(searchInput, 800);
  const [pagination, setPagination] = useState({
    current_page: applied.page,
    total_count: 0,
    total_pages: 0,
  });

  // Write URL params; null/"" removes the key. Page 1 is the default, so it is dropped.
  const updateUrl = (
    changes: Record<string, string | null>,
    { replace = false }: { replace?: boolean } = {}
  ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => {
          if (value && !(key === URL_KEYS.page && value === "1")) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        });
        return next;
      },
      { replace }
    );
  };

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await axios.get(
          `https://${baseUrl}/crm/admin/facility_setups.json?calendar_view=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setFacilities(response.data.facility_setups);
      } catch (error) {
        console.error("Error fetching facilities:", error);
        toast.error("Failed to fetch facilities");
      }
    };

    fetchFacilities();
  }, [baseUrl, token]);

  // Keep the modal draft in step with the URL (initial load, back/forward, reset)
  useEffect(() => {
    setFilters({
      facilityName: applied.facilityName,
      status: applied.status,
      paymentStatus: applied.paymentStatus,
      scheduledDateRange: "",
      createdOnDateRange: "",
    });
    setScheduledDateFrom(applied.scheduledDateFrom);
    setScheduledDateTo(applied.scheduledDateTo);
    setCreatedOnDateFrom(applied.createdOnDateFrom);
    setCreatedOnDateTo(applied.createdOnDateTo);
  }, [applied]);

  // Search box -> URL (debounced; replaces history so typing doesn't add entries)
  useEffect(() => {
    const term = debouncedSearch.trim();
    if (term !== applied.search) {
      updateUrl({ [URL_KEYS.search]: term || null, [URL_KEYS.page]: null }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // URL -> search box, when the search changed from outside the box (back/forward, link)
  useEffect(() => {
    if (applied.search !== debouncedSearch.trim()) {
      setSearchInput(applied.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied.search]);

  // Single fetch path: whatever the URL says (page, search, filters)
  const latestRequest = useRef(0);
  useEffect(() => {
    const requestId = ++latestRequest.current;
    const params = {
      page: String(applied.page),
      per_page: String(PAGE_SIZE),
      ...buildFilterParams(applied),
      ...(applied.search && { [BOOKING_SEARCH_PARAM]: applied.search }),
    };
    const queryString = new URLSearchParams(params).toString();

    setLoading(true);
    setError(null);
    dispatch(filterBookings({ baseUrl, token, queryString }))
      .unwrap()
      .then((response) => {
        if (requestId !== latestRequest.current) return; // a newer request superseded this one
        setBookingData((response?.data || []).map(toBookingRow));
        setPagination({
          current_page: response?.meta?.current_page || applied.page,
          total_count: response?.meta?.total_count || 0,
          total_pages: response?.meta?.total_pages || 0,
        });
      })
      .catch((err) => {
        if (requestId !== latestRequest.current) return;
        console.error("Error fetching bookings:", err);
        setBookingData([]);
        setPagination({ current_page: 1, total_count: 0, total_pages: 0 });
        setError(typeof err === "string" ? err : "Failed to fetch bookings");
        toast.error("Failed to fetch bookings");
      })
      .finally(() => {
        if (requestId === latestRequest.current) setLoading(false);
      });
  }, [applied, reloadKey, dispatch, baseUrl, token]);

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    setStatusUpdating(bookingId);
    try {
      await axios.patch(
        `https://${baseUrl}/crm/admin/facility_bookings/${bookingId}.json`,
        { current_status: newStatus.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBookingData((prevData) =>
        prevData.map((booking) =>
          booking.id === bookingId
            ? { ...booking, bookingStatus: newStatus }
            : booking
        )
      );
      toast.success(`Booking ${bookingId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleScheduledDateFromChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setScheduledDateFrom(newValue);
    if (newValue && scheduledDateTo) {
      const fromDate = parse(newValue, "yyyy-MM-dd", new Date());
      const toDate = parse(scheduledDateTo, "yyyy-MM-dd", new Date());
      if (fromDate > toDate) {
        setScheduledDateTo(newValue);
      }
      const formattedRange = `${format(fromDate, "dd/MM/yyyy")} - ${format(toDate, "dd/MM/yyyy")}`;
      handleFilterChange("scheduledDateRange", formattedRange);
    } else {
      handleFilterChange("scheduledDateRange", "");
    }
  };

  const handleScheduledDateToChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setScheduledDateTo(newValue);
    if (scheduledDateFrom && newValue) {
      const fromDate = parse(scheduledDateFrom, "yyyy-MM-dd", new Date());
      const toDate = parse(newValue, "yyyy-MM-dd", new Date());
      if (toDate < fromDate) {
        setScheduledDateFrom(newValue);
      }
      const formattedRange = `${format(fromDate, "dd/MM/yyyy")} - ${format(toDate, "dd/MM/yyyy")}`;
      handleFilterChange("scheduledDateRange", formattedRange);
    } else {
      handleFilterChange("scheduledDateRange", "");
    }
  };

  const handleCreatedOnDateFromChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setCreatedOnDateFrom(newValue);
    if (newValue && createdOnDateTo) {
      const fromDate = parse(newValue, "yyyy-MM-dd", new Date());
      const toDate = parse(createdOnDateTo, "yyyy-MM-dd", new Date());
      if (fromDate > toDate) {
        setCreatedOnDateTo(newValue);
      }
      const formattedRange = `${format(fromDate, "dd/MM/yyyy")} - ${format(toDate, "dd/MM/yyyy")}`;
      handleFilterChange("createdOnDateRange", formattedRange);
    } else {
      handleFilterChange("createdOnDateRange", "");
    }
  };

  const handleCreatedOnDateToChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setCreatedOnDateTo(newValue);
    if (createdOnDateFrom && newValue) {
      const fromDate = parse(createdOnDateFrom, "yyyy-MM-dd", new Date());
      const toDate = parse(newValue, "yyyy-MM-dd", new Date());
      if (toDate < fromDate) {
        setCreatedOnDateFrom(newValue);
      }
      const formattedRange = `${format(fromDate, "dd/MM/yyyy")} - ${format(toDate, "dd/MM/yyyy")}`;
      handleFilterChange("createdOnDateRange", formattedRange);
    } else {
      handleFilterChange("createdOnDateRange", "");
    }
  };

  // Apply the modal draft: write it to the URL and go back to page 1
  const handleApplyFilters = () => {
    updateUrl({
      [URL_KEYS.facility]: filters.facilityName ? String(filters.facilityName) : null,
      [URL_KEYS.status]: filters.status || null,
      [URL_KEYS.paymentStatus]: filters.paymentStatus || null,
      [URL_KEYS.bookedOnFrom]: scheduledDateFrom || null,
      [URL_KEYS.bookedOnTo]: scheduledDateTo || null,
      [URL_KEYS.scheduledFrom]: createdOnDateFrom || null,
      [URL_KEYS.scheduledTo]: createdOnDateTo || null,
      [URL_KEYS.page]: null,
    });
    setIsFilterModalOpen(false);
    toast.success("Filters applied successfully");
  };

  // Clear every filter from the URL (search is kept) and go back to page 1
  const handleResetFilters = () => {
    updateUrl({
      [URL_KEYS.facility]: null,
      [URL_KEYS.status]: null,
      [URL_KEYS.paymentStatus]: null,
      [URL_KEYS.bookedOnFrom]: null,
      [URL_KEYS.bookedOnTo]: null,
      [URL_KEYS.scheduledFrom]: null,
      [URL_KEYS.scheduledTo]: null,
      [URL_KEYS.page]: null,
    });
    toast.info("Filters reset");
  };

  const handleAddBooking = () => {
    navigate("/cms/facility-bookings/add");
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page === applied.page || isPageLoading) return;
    updateUrl({ [URL_KEYS.page]: String(page) });
  };

  const renderPaginationItems = () => {
    if (!pagination.total_pages || pagination.total_pages <= 0) {
      return null;
    }
    const items = [];
    const totalPages = pagination.total_pages;
    const currentPage = pagination.current_page;
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            disabled={isPageLoading}
          >
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
              <PaginationLink
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
                disabled={isPageLoading}
              >
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
              <PaginationLink
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
                disabled={isPageLoading}
              >
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
                <PaginationLink
                  onClick={() => handlePageChange(i)}
                  isActive={currentPage === i}
                  disabled={isPageLoading}
                >
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
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
              disabled={isPageLoading}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              disabled={isPageLoading}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const renderCell = (item: BookingData, columnKey: string) => {
    switch (columnKey) {
      case "bookingStatus":
        if (statusUpdating === item.id) {
          return <Loader2 className="w-4 h-4 animate-spin" />;
        }
        return (
          <Select
            value={item.bookingStatus}
            onValueChange={(newStatus) =>
              handleStatusChange(item.id, newStatus)
            }
            disabled={statusUpdating === item.id}
          >
            <SelectTrigger className="w-[140px] border-none bg-transparent flex justify-center items-center [&>svg]:hidden">
              <SelectValue asChild>
                <Badge
                  variant={getStatusBadgeVariant(item.bookingStatus)}
                  className={cn(
                    "cursor-pointer",
                    item.bookingStatus === "Pending" &&
                    "bg-[#F4C790] hover:bg-[#F4C790] text-black",
                    item.bookingStatus === "Confirmed" &&
                    "bg-[#A3E4DB] hover:bg-[#8CDAD1] text-black",
                    item.bookingStatus === "cancelled" &&
                    "bg-[#E4626F] hover:bg-[#E4626F] text-white",
                    item.bookingStatus === "Rejected" &&
                    "bg-[#c72030] hover:bg-[#c72030] text-white",
                  )}
                >
                  {item.bookingStatus.charAt(0).toUpperCase() + item.bookingStatus.slice(1)}
                </Badge>
              </SelectValue>
            </SelectTrigger>

            {item.facilityType === "Request" && (
              <SelectContent>
                <SelectItem value="Pending">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F4C790]" />
                    Pending
                  </div>
                </SelectItem>

                <SelectItem value="Confirmed">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#A3E4DB]" />
                    Confirmed
                  </div>
                </SelectItem>

                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#E4626F]" />
                    Cancelled
                  </div>
                </SelectItem>
              </SelectContent>
            )}
          </Select>
        );
      case "scheduledTime":
        return <div className="truncate w-[200px]" title={item.scheduledTime}>
          {item.scheduledTime}
        </div>
      default:
        return item[columnKey as keyof BookingData];
    }
  };

  const handleView = (id: number) => {
    navigate(`/cms/facility-bookings/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/cms/facility-bookings/edit/${id}`);
  };

  const renderActions = (item: BookingData) => (
    <>
      <Button variant="ghost" size="sm" onClick={() => handleView(item.id)}>
        <Eye className="w-4 h-4" />
      </Button>
      {/* {item.facilityType === "Request" && (
        <Button variant="ghost" size="sm" onClick={() => handleEdit(item.id)}>
          <Edit className="w-4 h-4" />
        </Button>
      )} */}
    </>
  );

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // GET /pms/admin/facility_bookings/export.xlsx with the same filters as the list
  const handleDownload = async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      const queryString = new URLSearchParams(buildFilterParams(applied)).toString();
      const response = await axios.get(
        `https://${baseUrl}/pms/admin/facility_bookings/export.xlsx${queryString ? `?${queryString}` : ""}`,
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
      link.setAttribute("download", "facility_bookings.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Error downloading file");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p>Error loading bookings: {error}</p>
          <Button
            onClick={() => setReloadKey((key) => key + 1)}
            variant="outline"
            size="sm"
            className="mt-2 border-[var(--color-primary,#da7756)] text-[var(--color-primary,#da7756)] hover:bg-[var(--color-primary-light,rgba(218,119,86,0.15))]"
            disabled={loading}
          >
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      {showActionPanel && (
        <SelectionPanel
          onAdd={handleAddBooking}
          onClearSelection={() => setShowActionPanel(false)}
        />
      )}

      <EnhancedTable
        data={bookingData}
        columns={enhancedTableColumns}
        renderCell={renderCell}
        renderActions={renderActions}
        storageKey="booking-list-table"
        loading={loading || isPageLoading}
        onFilterClick={() => setIsFilterModalOpen(true)}
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        disableClientSearch={true}
        searchPlaceholder="Search bookings..."
        enableExport={true}
        onExport={handleDownload}
        emptyMessage={
          loading || isPageLoading ? "Loading bookings..." : "No bookings found"
        }
        leftActions={
          <div className="flex flex-wrap gap-2">
            {
              shouldShow("Facility Bookings", "create") && (
                <Button
                 variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium" 
                  onClick={() => setShowActionPanel(true)}
                >
                  <Plus className="w-4 h-4" />
                  Action
                </Button>
              )
            }
          </div>
        }
      />

      <div className="flex justify-center mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.current_page - 1))
                }
                className={
                  pagination.current_page === 1 || isPageLoading
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(
                    Math.min(
                      pagination.total_pages,
                      pagination.current_page + 1
                    )
                  )
                }
                className={
                  pagination.current_page === pagination.total_pages ||
                    isPageLoading
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <Dialog
        open={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent className="[&>button]:hidden">
          <ThemeProvider theme={muiTheme}>
            <div>
              <div className="flex flex-row items-center justify-between space-y-0 pb-4">
                <h3 className="text-lg font-semibold">FILTER BY</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormControl fullWidth variant="outlined">
                    <InputLabel shrink>Facility Name</InputLabel>
                    <MuiSelect
                      label="Facility Name"
                      value={filters.facilityName}
                      onChange={(e) =>
                        handleFilterChange("facilityName", e.target.value)
                      }
                      displayEmpty
                      variant="outlined"
                      fullWidth
                    >
                      <MenuItem value="">Select Facility</MenuItem>
                      {(facilities || []).map((facility) => (
                        <MenuItem key={facility.id} value={facility.id}>
                          {facility.fac_name}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>

                  <FormControl fullWidth variant="outlined">
                    <InputLabel shrink>Status</InputLabel>
                    <MuiSelect
                      label="Status"
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                      displayEmpty
                      variant="outlined"
                      fullWidth
                    >
                      <MenuItem value="">Select Status</MenuItem>
                      <MenuItem value="Confirmed">Confirmed</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Rejected">Rejected</MenuItem>
                      <MenuItem value="Closed">Closed</MenuItem>
                    </MuiSelect>
                  </FormControl>

                  <FormControl fullWidth variant="outlined">
                    <InputLabel shrink>Payment Status</InputLabel>
                    <MuiSelect
                      label="Payment Status"
                      value={filters.paymentStatus}
                      onChange={(e) =>
                        handleFilterChange("paymentStatus", e.target.value)
                      }
                      displayEmpty
                      variant="outlined"
                      fullWidth
                    >
                      <MenuItem value="">Select Payment Status</MenuItem>
                      <MenuItem value="Success">Success</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Failed">Failed</MenuItem>
                      <MenuItem value="NA">NA</MenuItem>
                    </MuiSelect>
                  </FormControl>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <TextField
                      label="Booked On Date From"
                      type="date"
                      value={scheduledDateFrom}
                      onChange={handleScheduledDateFromChange}
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <span className="text-gray-500">–</span>
                    <TextField
                      label="Booked On Date To"
                      type="date"
                      value={scheduledDateTo}
                      onChange={handleScheduledDateToChange}
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <TextField
                      label="Scheduled On From"
                      type="date"
                      value={createdOnDateFrom}
                      onChange={handleCreatedOnDateFromChange}
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <span className="text-gray-500">–</span>
                    <TextField
                      label="Scheduled On To"
                      type="date"
                      value={createdOnDateTo}
                      onChange={handleCreatedOnDateToChange}
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  className="btn-cancel h-9 px-4 text-sm font-medium"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="btn-primary h-9 px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFiltering}
                >
                  Apply
                </Button>
              </div>
            </div>
          </ThemeProvider>
        </DialogContent>
      </Dialog>

      <ExportByCentreModal
        isOpen={isExportByCentreModalOpen}
        onClose={() => setIsExportByCentreModalOpen(false)}
      />
    </div>
  );
};

export default BookingListDashboard;
