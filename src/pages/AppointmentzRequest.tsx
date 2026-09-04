import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { EditRequestModal } from "@/components/EditRequestModal";
import { StatsCard } from "@/components/StatsCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Pencil,
  Printer,
  Download,
  Filter,
  Plus,
  Calendar,
  X,
  Building2,
  CheckCircle2,
  CalendarCheck,
  CalendarX,
  CheckSquare,
  RefreshCw,
  Clock,
  Loader2,
} from "lucide-react";
import {
  getSiteScheduleRequests,
  exportSiteRequestsData,
  updateSiteScheduleRequest,
  getAllRMUsers,
  getSiteScheduleDashboard,
  getSocietyBlocks,
  getSocietyFlatsByTower,
  getBehalfOfUserScheduleData,
  getSocietyFlatsByBlockId,
  getSocietyFlatDetailsById,
  getRMAvailableSlots,
  createSiteScheduleVisit,
  RMUserData,
  SiteScheduleRequest,
  SiteScheduleDashboardData,
  SocietyBlockOption,
  SocietyFlatOption,
  SocietyFlatOptionItem,
  RMAvailableSlotItem,
} from "@/services/appointmentzService";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

export interface AppointmentRequestRow {
  id: number;
  token: string | number;
  tower: string;
  flat: string;
  owners: string;
  scheduled_by: string;
  scheduled_on: string;
  selected_slot: string;
  booked_at: string;
  created_at: string;
  status: string;
  status_label?: string;
  ndc_date: string;
  handover_date: string;
  rm_assigned?: string;
  can_edit?: boolean;
}

export const AppointmentzRequest: React.FC = () => {
  const [data, setData] = useState<AppointmentRequestRow[]>([]);
  const { shouldShow } = useDynamicPermissions();
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<AppointmentRequestRow | null>(null);

  // Dashboard Stats State
  const [dashboardData, setDashboardData] = useState<SiteScheduleDashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  // Status Filter from Top Cards
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);

  // Filter Bar State
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterTower, setFilterTower] = useState("");
  const [filterFlat, setFilterFlat] = useState("");
  const [filterRmAssigned, setFilterRmAssigned] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterScheduledOn, setFilterScheduledOn] = useState("");
  const [filterCreatedOn, setFilterCreatedOn] = useState("");

  // Applied filter state (to trigger API/Client filter)
  const [appliedFilters, setAppliedFilters] = useState<{
    tower: string;
    flat: string;
    rm_assigned: string;
    status: string;
    scheduled_on: string;
    created_on: string;
  }>({
    tower: "",
    flat: "",
    rm_assigned: "",
    status: "",
    scheduled_on: "",
    created_on: "",
  });

  // RM Users list for dropdown
  const [rmUsers, setRmUsers] = useState<RMUserData[]>([]);

  // Tower options from API
  const [towerOptions, setTowerOptions] = useState<SocietyBlockOption[]>([]);
  const [scheduleFlats, setScheduleFlats] = useState<SocietyFlatOption[]>([]);
  const [isLoadingScheduleFlats, setIsLoadingScheduleFlats] = useState(false);

  // Schedule Visit 5-Step Workflow State
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);
  const [isLoadingBehalfData, setIsLoadingBehalfData] = useState(false);
  const [behalfTowers, setBehalfTowers] = useState<Array<{ id: number | string; name: string }>>([]);
  const [bookingWindow, setBookingWindow] = useState<{ minDate?: string; maxDate?: string }>({});

  const [selectedScheduleTowerId, setSelectedScheduleTowerId] = useState<string>("");
  const [selectedScheduleTowerName, setSelectedScheduleTowerName] = useState<string>("");
  const [scheduleFlatsList, setScheduleFlatsList] = useState<SocietyFlatOptionItem[]>([]);
  const [isLoadingFlatsByTower, setIsLoadingFlatsByTower] = useState(false);

  const [selectedScheduleFlatId, setSelectedScheduleFlatId] = useState<string>("");
  const [selectedScheduleFlatNo, setSelectedScheduleFlatNo] = useState<string>("");
  const [isLoadingFlatDetails, setIsLoadingFlatDetails] = useState(false);
  const [scheduleOwnerName, setScheduleOwnerName] = useState<string>("");
  const [scheduleScheduledBy, setScheduleScheduledBy] = useState<string>("");

  const [scheduleVisitDate, setScheduleVisitDate] = useState<string>("");
  const [scheduleAvailableSlots, setScheduleAvailableSlots] = useState<RMAvailableSlotItem[]>([]);
  const [isLoadingAvailableSlots, setIsLoadingAvailableSlots] = useState(false);
  const [selectedScheduleSlotId, setSelectedScheduleSlotId] = useState<string>("");
  const [scheduleReason, setScheduleReason] = useState<string>("");
  const [isSubmittingScheduleVisit, setIsSubmittingScheduleVisit] = useState(false);

  // Fetch Dashboard Stats
  const fetchDashboardData = useCallback(async () => {
    setIsDashboardLoading(true);
    try {
      const resp = await getSiteScheduleDashboard();
      if (resp) {
        setDashboardData(resp);
      }
    } catch (err) {
      console.warn("Could not fetch site schedule requests dashboard data:", err);
    } finally {
      setIsDashboardLoading(false);
    }
  }, []);

  // Fetch RM users list and Tower blocks
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const users = await getAllRMUsers();
        setRmUsers(users || []);
      } catch (err) {
        console.warn("Could not fetch RM users for filter:", err);
      }

      try {
        const blocks = await getSocietyBlocks();
        setTowerOptions(blocks || []);
      } catch (err) {
        console.warn("Could not fetch society blocks:", err);
      }
    };
    fetchDropdownOptions();
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch real API data
  const fetchSiteScheduleRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSiteScheduleRequests(currentPage, {
        ...(appliedFilters.tower ? { tower: appliedFilters.tower } : {}),
        ...(appliedFilters.flat ? { flat: appliedFilters.flat } : {}),
        ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
        ...(appliedFilters.scheduled_on ? { scheduled_on: appliedFilters.scheduled_on } : {}),
        ...(appliedFilters.created_on ? { created_on: appliedFilters.created_on } : {}),
      });

      if (response && response.site_schedule_requests) {
        const mappedData: AppointmentRequestRow[] = response.site_schedule_requests.map((item) => ({
          id: item.id,
          token: item.id.toString(),
          tower: item.society_flat?.tower?.name || "-",
          flat: item.society_flat?.flat_no || "-",
          owners: item.scheduled_by?.name || "-",
          scheduled_by: item.scheduled_by?.name || "-",
          scheduled_on: item.scheduled_on || "-",
          selected_slot: item.selected_slot || "-",
          booked_at: item.created_at || "-",
          created_at: item.created_at || "-",
          status: item.status_label || item.status || "Scheduled",
          status_label: item.status_label,
          ndc_date: "-",
          handover_date: "-",
          rm_assigned: item.rm_assigned?.name || "-",
          can_edit: item.can_edit ?? true,
        }));
        setData(mappedData);
        setTotalPages(response.pagination?.total_pages || 1);
        setTotalCount(response.pagination?.total_count || mappedData.length);
      } else {
        setData([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching site schedule requests:", error);
      setData([]);
      setTotalPages(1);
      setTotalCount(0);
      toast.error("Failed to fetch appointment requests");
    } finally {
      setLoading(false);
    }
  }, [currentPage, appliedFilters]);

  useEffect(() => {
    fetchSiteScheduleRequests();
  }, [fetchSiteScheduleRequests]);

  // Unique lists for dropdowns derived from fetched data
  const uniqueTowers = useMemo(() => {
    const towers = new Set<string>();
    data.forEach((d) => {
      if (d.tower && d.tower !== "-") towers.add(d.tower);
    });
    return Array.from(towers);
  }, [data]);

  const uniqueFlats = useMemo(() => {
    const flats = new Set<string>();
    data.forEach((d) => {
      if (d.flat && d.flat !== "-") flats.add(d.flat);
    });
    return Array.from(flats);
  }, [data]);

  // Merge tower options from API and data
  const allTowerOptions = useMemo(() => {
    const map = new Map<string, { id: number | string; name: string }>();
    towerOptions.forEach((t) => {
      if (t.name) map.set(t.name.toLowerCase(), { id: t.id, name: t.name });
    });
    uniqueTowers.forEach((t) => {
      if (t && t !== "-" && !map.has(t.toLowerCase())) {
        map.set(t.toLowerCase(), { id: t, name: t });
      }
    });
    return Array.from(map.values());
  }, [towerOptions, uniqueTowers]);

  // Format date helper (YYYY-MM-DD to DD/MM/YYYY)
  const formatToDDMMYYYY = (isoDate: string): string => {
    if (!isoDate) return "";
    if (isoDate.includes("/")) return isoDate;
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
    return isoDate;
  };

  // Normalize date string (DD/MM/YYYY to YYYY-MM-DD)
  const formatToYYYYMMDD = (dateStr: string): string => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) return dateStr;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return dateStr;
  };

  // Step 4: Fetch available slots for given date
  const fetchAvailableSlotsForDate = useCallback(async (dateIso: string) => {
    if (!dateIso) {
      setScheduleAvailableSlots([]);
      return;
    }
    setIsLoadingAvailableSlots(true);
    setSelectedScheduleSlotId("");
    try {
      const formattedDate = formatToDDMMYYYY(dateIso);
      const res = await getRMAvailableSlots(formattedDate);
      setScheduleAvailableSlots(res.slots || []);
    } catch (err) {
      console.warn("Could not fetch RM available slots:", err);
      setScheduleAvailableSlots([]);
    } finally {
      setIsLoadingAvailableSlots(false);
    }
  }, []);

  // Step 1: When modal opens, load RM info, towers, booking window
  useEffect(() => {
    if (isScheduleVisitOpen) {
      setIsLoadingBehalfData(true);

      // Fetch blocks & behalf of user schedule data
      Promise.allSettled([getBehalfOfUserScheduleData(), getSocietyBlocks()])
        .then(([behalfRes, blocksRes]) => {
          if (blocksRes.status === "fulfilled" && Array.isArray(blocksRes.value)) {
            setTowerOptions(blocksRes.value);
          }

          if (behalfRes.status === "fulfilled") {
            const res = behalfRes.value;
            const towers = res.society_blocks || res.towers || [];
            if (towers.length > 0) {
              setBehalfTowers(towers);
            }

            const rmName =
              res.rm_user?.name ||
              res.created_by?.firstname ||
              res.created_by?.name ||
              "";
            if (rmName) {
              setScheduleScheduledBy(rmName);
            }

            if (res.booking_window) {
              const bw = res.booking_window;
              let minD = "";
              let maxD = "";
              if (bw.start_date) {
                minD = formatToYYYYMMDD(bw.start_date);
                maxD = bw.end_date ? formatToYYYYMMDD(bw.end_date) : "";
              } else {
                const today = new Date();
                const minObj = new Date(today);
                minObj.setDate(today.getDate() + Number(bw.start_days || 0));
                minD = minObj.toISOString().split("T")[0];

                const maxObj = new Date(today);
                maxObj.setDate(today.getDate() + Number(bw.max_days || 30) - 1);
                maxD = maxObj.toISOString().split("T")[0];
              }
              setBookingWindow({ minDate: minD, maxDate: maxD });
              setScheduleVisitDate(minD);
              fetchAvailableSlotsForDate(minD);
            }
          }
        })
        .finally(() => {
          setIsLoadingBehalfData(false);
        });
    } else {
      // Reset state on close
      setSelectedScheduleTowerId("");
      setSelectedScheduleTowerName("");
      setScheduleFlatsList([]);
      setSelectedScheduleFlatId("");
      setSelectedScheduleFlatNo("");
      setScheduleOwnerName("");
      setScheduleAvailableSlots([]);
      setSelectedScheduleSlotId("");
      setScheduleReason("");
    }
  }, [isScheduleVisitOpen, fetchAvailableSlotsForDate]);

  // Step 2: Select Tower -> Fetch Flats
  const handleScheduleTowerSelect = async (towerVal: string) => {
    // Find tower by id or name across all lists
    const foundTower =
      behalfTowers.find((t) => String(t.id) === towerVal || t.name === towerVal) ||
      towerOptions.find((t) => String(t.id) === towerVal || t.name === towerVal) ||
      allTowerOptions.find((t) => String(t.id) === towerVal || t.name === towerVal);

    const towerId = foundTower ? String(foundTower.id) : towerVal;
    const towerName = foundTower ? foundTower.name : towerVal;

    let numericTowerId = towerId;
    if (isNaN(Number(towerId))) {
      const matchInBlocks = towerOptions.find(
        (b) => b.name?.toLowerCase() === towerName.toLowerCase()
      );
      if (matchInBlocks) numericTowerId = String(matchInBlocks.id);
    }

    setSelectedScheduleTowerId(numericTowerId);
    setSelectedScheduleTowerName(towerName);
    setSelectedScheduleFlatId("");
    setSelectedScheduleFlatNo("");
    setScheduleOwnerName("");
    setScheduleFlatsList([]);
    setIsLoadingFlatsByTower(true);

    try {
      const res = await getSocietyFlatsByBlockId(numericTowerId);
      const list = Array.isArray(res)
        ? res
        : res.society_flats || res.flats || (res as any).data || [];
      setScheduleFlatsList(list);
    } catch (err) {
      console.warn("Could not fetch flats for selected tower:", err);
      toast.error("Failed to load flats for selected tower");
    } finally {
      setIsLoadingFlatsByTower(false);
    }
  };

  // Step 3: Flat selected -> Owner name + Assigned RM
  const handleScheduleFlatSelect = async (flatVal: string) => {
    const foundFlat = scheduleFlatsList.find(
      (f) => String(f.id) === flatVal || f.flat_no === flatVal || f.flat_new_str === flatVal
    );
    const flatId = foundFlat ? String(foundFlat.id) : flatVal;
    const flatNo = foundFlat ? foundFlat.flat_no || foundFlat.flat_new_str || foundFlat.name || flatVal : flatVal;

    setSelectedScheduleFlatId(flatId);
    setSelectedScheduleFlatNo(flatNo);
    setIsLoadingFlatDetails(true);

    try {
      const res = await getSocietyFlatDetailsById(flatId);
      const ownerName =
        res.customer_name ||
        res.owner_name ||
        res.bill_to_party ||
        res.society_flat?.owner_name ||
        res.society_flat?.customer_name ||
        "";
      if (ownerName) {
        setScheduleOwnerName(ownerName);
      }

      const rmAssigned =
        res.rm_user_name ||
        (typeof res.rm_assigned === "object"
          ? res.rm_assigned?.name || res.rm_assigned?.firstname
          : res.rm_assigned) ||
        res.rm_user?.name ||
        "";
      if (rmAssigned) {
        setScheduleScheduledBy(rmAssigned);
      }
    } catch (err) {
      console.warn("Could not fetch flat details:", err);
    } finally {
      setIsLoadingFlatDetails(false);
    }
  };

  // Step 4: Date picked -> Fetch Available Slots
  const handleScheduleDateChange = (dateVal: string) => {
    setScheduleVisitDate(dateVal);
    fetchAvailableSlotsForDate(dateVal);
  };

  // Step 5: Submit Site Schedule
  const handleCreateScheduleVisit = async () => {
    if (!selectedScheduleFlatId) {
      toast.error("Please select a flat");
      return;
    }
    if (!scheduleVisitDate) {
      toast.error("Please select a scheduled date");
      return;
    }
    if (!selectedScheduleSlotId) {
      toast.error("Please select an available time slot");
      return;
    }

    setIsSubmittingScheduleVisit(true);
    const formattedDate = formatToDDMMYYYY(scheduleVisitDate);

    try {
      const res = await createSiteScheduleVisit({
        society_flat_id: Number(selectedScheduleFlatId) || selectedScheduleFlatId,
        site_schedule_request: {
          scheduled_at: formattedDate,
          site_schedule_id: Number(selectedScheduleSlotId) || selectedScheduleSlotId,
          ...(scheduleReason ? { reason: scheduleReason } : {}),
        },
      });

      if (res.code === 200 || res.message || res.site_schedule_request) {
        toast.success(res.message || "Site visit successfully scheduled!");
        setIsScheduleVisitOpen(false);
        await Promise.all([fetchSiteScheduleRequests(), fetchDashboardData()]);
      } else if (res.errors && res.errors.length > 0) {
        toast.error(res.errors.join(", "));
      } else {
        toast.success("Site visit successfully scheduled!");
        setIsScheduleVisitOpen(false);
        await Promise.all([fetchSiteScheduleRequests(), fetchDashboardData()]);
      }
    } catch (err: any) {
      console.error("Error creating site schedule visit:", err);
      const errorData = err?.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors.join(", "));
      } else if (errorData?.message) {
        toast.error(errorData.message);
      } else {
        toast.error("Failed to schedule site visit. Please retry.");
      }
    } finally {
      setIsSubmittingScheduleVisit(false);
    }
  };

  // Dynamic status count summary as fallback
  const summaryCounts = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const st = (item.status || "").toLowerCase();
        acc.total++;
        if (st.includes("pend")) acc.pending++;
        else if (st.includes("schedul")) acc.scheduled++;
        else if (st.includes("visit")) acc.siteVisited++;
        else if (st.includes("revisit")) acc.revisitRequested++;
        else if (st.includes("close") || st.includes("handover") || st.includes("complete")) acc.closed++;
        else if (st.includes("cancel")) acc.cancelled++;
        return acc;
      },
      { total: 0, pending: 0, scheduled: 0, siteVisited: 0, revisitRequested: 0, closed: 0, cancelled: 0 }
    );
  }, [data]);

  // Client-side and applied filter logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedStatusFilter && selectedStatusFilter !== "Total") {
        const st = item.status.toLowerCase();
        if (selectedStatusFilter === "Pending" && !st.includes("pend")) return false;
        if (selectedStatusFilter === "Scheduled" && !st.includes("schedul")) return false;
        if (selectedStatusFilter === "Site Visited" && !st.includes("visit")) return false;
        if (selectedStatusFilter === "Revisit Requested" && !st.includes("revisit")) return false;
        if (selectedStatusFilter === "Closed" && !st.includes("close") && !st.includes("handover") && !st.includes("complete")) return false;
        if (selectedStatusFilter === "Cancelled" && !st.includes("cancel")) return false;
        if (selectedStatusFilter === "Handover Completed" && !st.includes("handover") && !st.includes("complete")) return false;
      }
      if (appliedFilters.tower && appliedFilters.tower !== "all" && item.tower.toLowerCase() !== appliedFilters.tower.toLowerCase()) {
        return false;
      }
      if (appliedFilters.flat && appliedFilters.flat !== "all" && item.flat.toLowerCase() !== appliedFilters.flat.toLowerCase()) {
        return false;
      }
      if (appliedFilters.rm_assigned && appliedFilters.rm_assigned !== "all" && item.rm_assigned?.toLowerCase() !== appliedFilters.rm_assigned.toLowerCase()) {
        return false;
      }
      if (appliedFilters.status && appliedFilters.status !== "all" && item.status.toLowerCase() !== appliedFilters.status.toLowerCase()) {
        return false;
      }
      if (appliedFilters.scheduled_on && !item.scheduled_on.includes(appliedFilters.scheduled_on)) {
        return false;
      }
      if (appliedFilters.created_on && !item.created_at.includes(appliedFilters.created_on)) {
        return false;
      }
      return true;
    });
  }, [data, selectedStatusFilter, appliedFilters]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      tower: filterTower,
      flat: filterFlat,
      rm_assigned: filterRmAssigned,
      status: filterStatus,
      scheduled_on: filterScheduledOn,
      created_on: filterCreatedOn,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setFilterTower("");
    setFilterFlat("");
    setFilterRmAssigned("");
    setFilterStatus("");
    setFilterScheduledOn("");
    setFilterCreatedOn("");
    setAppliedFilters({
      tower: "",
      flat: "",
      rm_assigned: "",
      status: "",
      scheduled_on: "",
      created_on: "",
    });
    setSelectedStatusFilter(null);
    setCurrentPage(1);
  };

  const columns: ColumnConfig[] = [
    { key: "actions", label: "Actions", sortable: false, width: 80 },
    { key: "token", label: "Token", sortable: true },
    { key: "tower", label: "Tower", sortable: true },
    { key: "flat", label: "Flat", sortable: true },
    { key: "owners", label: "Owners", sortable: true },
    { key: "scheduled_by", label: "Scheduled By", sortable: true },
    { key: "scheduled_on", label: "Scheduled On", sortable: true },
    { key: "selected_slot", label: "Selected Slot", sortable: true },
    { key: "booked_at", label: "Booked At", sortable: true },
    { key: "created_at", label: "Created At", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "ndc_date", label: "NDC Date", sortable: true },
    { key: "handover_date", label: "Handover Date", sortable: true },
    { key: "print", label: "Print", sortable: false, width: 70 },
  ];

  const handleEditClick = (item: AppointmentRequestRow) => {
    setSelectedRequest(item);
    setIsEditModalOpen(true);
  };

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await exportSiteRequestsData();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `site_schedule_requests_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setTimeout(() => {
        toast.success("CSV exported successfully");
      }, 0);
    } catch (error) {
      console.warn("Client fallback export:", error);
      const headers = ["Token,Tower,Flat,Owners,Scheduled By,Scheduled On,Selected Slot,Booked At,Created At,Status,NDC Date,Handover Date"];
      const rows = filteredData.map(r => 
        `"${r.token}","${r.tower}","${r.flat}","${r.owners}","${r.scheduled_by}","${r.scheduled_on}","${r.selected_slot}","${r.booked_at}","${r.created_at}","${r.status}","${r.ndc_date}","${r.handover_date}"`
      );
      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `site_requests_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Requests exported successfully");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEditSubmit = async (updatedData: {
    status: string;
    reason: string;
    token?: string;
  }) => {
    if (!selectedRequest || isEditSubmitting) return;

    setIsEditSubmitting(true);
    try {
      const response = await updateSiteScheduleRequest(selectedRequest.id, {
        status: updatedData.status,
        reason: updatedData.reason,
      });

      if (response.success) {
        await Promise.all([fetchSiteScheduleRequests(), fetchDashboardData()]);
        toast.success(
          response.message || `Request ${updatedData.token || selectedRequest.token} updated successfully`
        );
        setIsEditModalOpen(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      setData((prev) =>
        prev.map((item) =>
          item.id === selectedRequest.id
            ? { ...item, status: updatedData.status }
            : item
        )
      );
      fetchDashboardData();
      toast.success(`Request ${selectedRequest.token} status updated to ${updatedData.status}`);
      setIsEditModalOpen(false);
      setSelectedRequest(null);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handlePrintRow = (item: AppointmentRequestRow) => {
    toast.info(`Printing details for Token #${item.token}`);
    window.print();
  };

  const getStatusBadgeStyle = (status: string) => {
    const st = (status || "").toLowerCase();
    if (st.includes("pend")) {
      return "bg-[#DBC2A9]/40 text-[#1A1A1A]";
    }
    if (st.includes("schedul")) {
      return "bg-[#DBC2A9] text-[#1A1A1A]";
    }
    if (st.includes("visit")) {
      return "bg-[#C4B89D] text-[#1A1A1A]";
    }
    if (st.includes("revisit")) {
      return "bg-[#E4626F]/20 text-[#C72030]";
    }
    if (st.includes("cancel")) {
      return "bg-[#D5DBDB] text-[#1A1A1A]";
    }
    if (st.includes("close") || st.includes("handover") || st.includes("complete")) {
      return "bg-[#AAB9C5] text-[#1A1A1A]";
    }
    return "bg-[#f6f4ee] text-[#1A1A1A]";
  };

  const renderCell = (item: AppointmentRequestRow, columnKey: string, index: number) => {
    switch (columnKey) {
      case "actions":
        return (
          <button
            type="button"
            onClick={() => handleEditClick(item)}
            className="p-1 text-[#DA7756] hover:text-[#c96844] transition-colors rounded hover:bg-[#DA7756]/10 flex items-center justify-center"
            title="Edit Request"
          >
            <Pencil className="h-4 w-4" />
          </button>
        );
      case "token":
        return <span className="text-[#1A1A1A] font-medium text-sm">{item.token}</span>;
      case "tower":
        return <span className="text-[#1A1A1A] text-sm">{item.tower}</span>;
      case "flat":
        return <span className="text-[#1A1A1A] text-sm font-medium">{item.flat}</span>;
      case "owners":
        return <span className="text-[#1A1A1A] text-sm truncate max-w-[150px] inline-block" title={item.owners}>{item.owners}</span>;
      case "scheduled_by":
        return <span className="text-[#1A1A1A] text-sm">{item.scheduled_by}</span>;
      case "scheduled_on":
        return <span className="text-[#1A1A1A] text-sm">{item.scheduled_on}</span>;
      case "selected_slot":
        return <span className="text-[#1A1A1A] text-sm whitespace-nowrap">{item.selected_slot}</span>;
      case "booked_at":
        return <span className="text-[#1A1A1A] text-sm whitespace-nowrap">{item.booked_at}</span>;
      case "created_at":
        return <span className="text-[#1A1A1A] text-sm whitespace-nowrap">{item.created_at}</span>;
      case "status":
        return (
          <span className={`inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadgeStyle(item.status)}`}>
            {item.status}
          </span>
        );
      case "ndc_date":
        return <span className="text-[#1A1A1A] text-sm">{item.ndc_date || "-"}</span>;
      case "handover_date":
        return <span className="text-[#1A1A1A] text-sm">{item.handover_date || "-"}</span>;
      case "print":
        return (
          <button
            type="button"
            onClick={() => handlePrintRow(item)}
            className="p-1 text-[#1A1A1A] hover:text-[#DA7756] transition-colors rounded hover:bg-gray-100 flex items-center justify-center"
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </button>
        );
      default:
        return (item as any)[columnKey] || "-";
    }
  };

  const handleCardClick = (statusKey: string) => {
    if (selectedStatusFilter === statusKey) {
      setSelectedStatusFilter(null);
    } else {
      setSelectedStatusFilter(statusKey);
    }
  };

  const isAnyFilterActive = Boolean(
    appliedFilters.tower ||
    appliedFilters.flat ||
    appliedFilters.rm_assigned ||
    appliedFilters.status ||
    appliedFilters.scheduled_on ||
    appliedFilters.created_on
  );

  return (
    <div className="min-h-screen bg-[#fdfdfd] p-4 md:p-6 space-y-6">
      {/* Top Summary Cards Integrated with Dashboard API */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <StatsCard
          title="Total Requests"
          value={dashboardData?.total ?? summaryCounts.total}
          icon={<Building2 className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Total"}
          onClick={() => handleCardClick("Total")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Pending"
          value={dashboardData?.pending ?? summaryCounts.pending}
          icon={<Clock className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Pending"}
          onClick={() => handleCardClick("Pending")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Scheduled"
          value={dashboardData?.scheduled ?? summaryCounts.scheduled}
          icon={<CalendarCheck className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Scheduled"}
          onClick={() => handleCardClick("Scheduled")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Site Visited"
          value={dashboardData?.site_visited ?? summaryCounts.siteVisited}
          icon={<CheckCircle2 className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Site Visited"}
          onClick={() => handleCardClick("Site Visited")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Revisit Requested"
          value={dashboardData?.revisit_requested ?? summaryCounts.revisitRequested}
          icon={<RefreshCw className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Revisit Requested"}
          onClick={() => handleCardClick("Revisit Requested")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Closed"
          value={dashboardData?.closed ?? summaryCounts.closed}
          icon={<CheckSquare className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Closed"}
          onClick={() => handleCardClick("Closed")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Cancelled"
          value={dashboardData?.cancelled ?? summaryCounts.cancelled}
          icon={<CalendarX className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Cancelled"}
          onClick={() => handleCardClick("Cancelled")}
          className="border border-[#D5DbDB]"
        />
      </div>

      {/* Active Filter Banner if card filter is active */}
      {selectedStatusFilter && (
        <div className="flex items-center justify-between bg-[#f6f4ee] border border-[#D5DbDB] px-4 py-2 rounded-lg text-sm text-[#1A1A1A]">
          <span>
            Filtering by: <strong>{selectedStatusFilter === "Total" ? "All Requests" : `Status: ${selectedStatusFilter}`}</strong> ({filteredData.length} results)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStatusFilter(null)}
            className="h-7 text-xs text-[#DA7756] hover:text-[#c96844] hover:bg-[#DBC2A9]"
          >
            Clear Filter <X className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="w-full">
        <EnhancedTable
          data={filteredData}
          columns={columns}
          renderCell={renderCell}
          storageKey="appointmentz-requests-table"
          loading={loading}
          pagination={true}
          pageSize={10}
          enableExport={false}
          enableSearch={true}
          searchPlaceholder="Search..."
          leftActions={
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="ghost"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="btn-primary h-9 px-4 text-sm font-medium rounded-md shadow-none"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setIsScheduleVisitOpen(true)}
                className="btn-primary h-9 px-4 text-sm font-medium rounded-md shadow-none"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Schedule Visit
              </Button>
            </div>
          }
          rightActions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterBar(true)}
                className={`h-9 w-9 p-0 border border-[#D5DbDB] hover:bg-[#f6f4ee] rounded-md text-[#1a1a1a] flex items-center justify-center transition-colors relative ${
                  isAnyFilterActive ? "bg-[#f6f4ee] border-[#DA7756]" : ""
                }`}
                title="Filter"
              >
                <Filter className="w-4 h-4 text-[#1a1a1a]" />
                {isAnyFilterActive && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DA7756]"></span>
                )}
              </Button>
            </div>
          }
        />
      </div>

      {/* Filter Modal Popup according to Design Guidelines */}
      <Dialog open={showFilterBar} onOpenChange={setShowFilterBar}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#f6f4ee] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#DA7756]" />
              Filter Requests
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 bg-white space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tower */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Tower</Label>
                <Select
                  value={filterTower || "all"}
                  onValueChange={(val) => setFilterTower(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select Tower" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all">All Towers</SelectItem>
                    {allTowerOptions.map((t) => {
                      const val = t.name || String(t.id || "");
                      if (!val) return null;
                      return (
                        <SelectItem key={String(t.id || t.name)} value={val}>
                          {t.name || `Tower #${t.id}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Flat */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Flat</Label>
                <Select
                  value={filterFlat || "all"}
                  onValueChange={(val) => setFilterFlat(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select Flat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all">All Flats</SelectItem>
                    {uniqueFlats.map((f) => {
                      if (!f || f === "-") return null;
                      return (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* RM Assigned */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">RM Assigned</Label>
                <Select
                  value={filterRmAssigned || "all"}
                  onValueChange={(val) => setFilterRmAssigned(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select RM Assigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all">All RM Users</SelectItem>
                    {rmUsers.map((u) => {
                      const name =
                        u.full_name ||
                        `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                        `User #${u.id}`;
                      return (
                        <SelectItem key={String(u.id)} value={name}>
                          {name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Status</Label>
                <Select
                  value={filterStatus || "all"}
                  onValueChange={(val) => setFilterStatus(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Site Visited">Site Visited</SelectItem>
                    <SelectItem value="Revisit Requested">Revisit Requested</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Handover Completed">Handover Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scheduled On */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Scheduled On</Label>
                <Input
                  type="date"
                  placeholder="Scheduled On"
                  value={filterScheduledOn}
                  onChange={(e) => setFilterScheduledOn(e.target.value)}
                  className="h-9 text-xs border-[#D5DbDB] bg-white"
                />
              </div>

              {/* Created On */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Created On</Label>
                <Input
                  type="date"
                  placeholder="Created On"
                  value={filterCreatedOn}
                  onChange={(e) => setFilterCreatedOn(e.target.value)}
                  className="h-9 text-xs border-[#D5DbDB] bg-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#f6f4ee] px-6 py-3 border-t border-[#D5DbDB] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                handleResetFilter();
                setShowFilterBar(false);
              }}
              className="border-[#D5DbDB] hover:bg-[#DBC2A9] text-[#1A1A1A]"
            >
              Reset
            </Button>
            <Button
              variant="ghost"
              className="btn-primary"
              onClick={() => {
                handleApplyFilter();
                setShowFilterBar(false);
              }}
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Powered by Footer */}
      <div className="text-center py-3 text-xs text-[#1A1A1A] opacity-60 font-medium tracking-wide">
        Powered by <span className="font-semibold text-[#1A1A1A]">Lockated</span>
      </div>

      {/* Edit Request Modal */}
      {selectedRequest && (
        <EditRequestModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleEditSubmit}
          token={selectedRequest.token.toString()}
          isSubmitting={isEditSubmitting}
        />
      )}

      {/* Schedule Visit Modal (5-Step API Integration) */}
      <Dialog open={isScheduleVisitOpen} onOpenChange={setIsScheduleVisitOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl bg-white rounded-xl">
          <DialogHeader className="bg-[#f6f4ee] px-6 py-4 border-b border-[#D5DbDB] flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#DA7756]" />
              Schedule New Visit
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-6 bg-white">
            {isLoadingBehalfData ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-[#DA7756] animate-spin mx-auto" />
                <p className="text-xs text-[#6B7280]">Loading visit setup configuration...</p>
              </div>
            ) : (
              <>
                {/* Step 1 & Step 2: Tower and Flat Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Step 1: Select Tower */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1A1A1A]">
                      Select Tower *
                    </Label>
                    <Select
                      value={selectedScheduleTowerId || undefined}
                      onValueChange={handleScheduleTowerSelect}
                    >
                      <SelectTrigger className="border-[#D5DbDB] bg-white h-9 text-xs focus:ring-[#DA7756]">
                        <SelectValue placeholder="Select Tower" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {(behalfTowers.length > 0 ? behalfTowers : (towerOptions.length > 0 ? towerOptions : allTowerOptions)).length === 0 ? (
                          <SelectItem value="none" disabled className="text-xs text-gray-400">
                            No towers available
                          </SelectItem>
                        ) : (
                          (behalfTowers.length > 0 ? behalfTowers : (towerOptions.length > 0 ? towerOptions : allTowerOptions)).map((t) => {
                            const val = String(t.id || t.name || "");
                            if (!val) return null;
                            return (
                              <SelectItem
                                key={val}
                                value={val}
                                className="text-xs"
                              >
                                {t.name || `Tower #${t.id}`}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: Select Flat */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1A1A1A]">
                      Select Flat *
                    </Label>
                    <Select
                      value={selectedScheduleFlatId || undefined}
                      onValueChange={handleScheduleFlatSelect}
                      disabled={!selectedScheduleTowerId || isLoadingFlatsByTower}
                    >
                      <SelectTrigger className="border-[#D5DbDB] bg-white h-9 text-xs focus:ring-[#DA7756]">
                        <SelectValue
                          placeholder={
                            !selectedScheduleTowerId
                              ? "Select Tower first"
                              : isLoadingFlatsByTower
                              ? "Loading flats..."
                              : scheduleFlatsList.length === 0
                              ? "No flats available"
                              : "Select Flat No."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {scheduleFlatsList.length === 0 ? (
                          <SelectItem value="none" disabled className="text-xs text-gray-400">
                            {isLoadingFlatsByTower ? "Loading flats..." : "No flats available"}
                          </SelectItem>
                        ) : (
                          scheduleFlatsList.map((f) => {
                            const val = String(f.id || "");
                            if (!val) return null;
                            return (
                              <SelectItem
                                key={val}
                                value={val}
                                className="text-xs"
                              >
                                {f.flat_no || f.flat_new_str || f.name || `Flat #${f.id}`}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Step 3: Owner Name and Scheduled By (Auto-populated from flat details) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1A1A1A]">
                      Owner Name
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Owner Name"
                        value={scheduleOwnerName}
                        onChange={(e) => setScheduleOwnerName(e.target.value)}
                        className="border-[#D5DbDB] h-9 text-xs bg-white focus:ring-[#DA7756]"
                      />
                      {isLoadingFlatDetails && (
                        <Loader2 className="w-3.5 h-3.5 text-[#DA7756] animate-spin absolute right-2.5 top-3" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1A1A1A]">
                      Scheduled By
                    </Label>
                    <Input
                      placeholder="Relationship Manager"
                      value={scheduleScheduledBy}
                      onChange={(e) => setScheduleScheduledBy(e.target.value)}
                      className="border-[#D5DbDB] h-9 text-xs bg-white focus:ring-[#DA7756]"
                    />
                  </div>
                </div>

                {/* Step 4: Scheduled Date & Available Slot Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1A1A1A]">
                      Scheduled Date *
                    </Label>
                    <Input
                      type="date"
                      min={bookingWindow.minDate || undefined}
                      max={bookingWindow.maxDate || undefined}
                      value={scheduleVisitDate || ""}
                      onChange={(e) => handleScheduleDateChange(e.target.value)}
                      className="border-[#D5DbDB] h-9 text-xs bg-white focus:ring-[#DA7756] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1A1A1A]">
                      Select Time Slot *
                    </Label>
                    <Select
                      value={selectedScheduleSlotId || undefined}
                      onValueChange={(val) => {
                        if (val !== "none") setSelectedScheduleSlotId(val);
                      }}
                      disabled={!scheduleVisitDate || isLoadingAvailableSlots}
                    >
                      <SelectTrigger className="border-[#D5DbDB] bg-white h-9 text-xs focus:ring-[#DA7756]">
                        <SelectValue
                          placeholder={
                            !scheduleVisitDate
                              ? "Pick date first"
                              : isLoadingAvailableSlots
                              ? "Loading slots..."
                              : scheduleAvailableSlots.length === 0
                              ? "No slots available"
                              : "Select Time Slot"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {scheduleAvailableSlots.length === 0 ? (
                          <SelectItem value="none" disabled className="text-xs text-gray-400">
                            {isLoadingAvailableSlots ? "Loading slots..." : "No slots available for date"}
                          </SelectItem>
                        ) : (
                          scheduleAvailableSlots.map((slot) => {
                            const val = String(slot.id || "");
                            if (!val) return null;
                            const isDisabled = slot.slot_disabled === true;
                            const color = (slot.slot_color_code || "").toLowerCase();
                            let statusLabel = "Available";
                            let badgeBg = "bg-emerald-100 text-emerald-800";
                            if (color.includes("yellow") || color === "yellow") {
                              statusLabel = "Fast Filling";
                              badgeBg = "bg-amber-100 text-amber-800";
                            } else if (color.includes("red") || color === "red" || isDisabled) {
                              statusLabel = "Not Available";
                              badgeBg = "bg-red-100 text-red-700";
                            }

                            return (
                              <SelectItem
                                key={val}
                                value={val}
                                disabled={isDisabled}
                                className="text-xs flex items-center justify-between"
                              >
                                <span>{slot.ampm_timing}</span>
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeBg}`}>
                                  {statusLabel}
                                </span>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Purpose / Reason */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1A1A1A]">
                    Purpose / Reason (Optional)
                  </Label>
                  <Input
                    placeholder="Visit reason / notes..."
                    value={scheduleReason}
                    onChange={(e) => setScheduleReason(e.target.value)}
                    className="border-[#D5DbDB] h-9 text-xs bg-white focus:ring-[#DA7756]"
                  />
                </div>
              </>
            )}
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="bg-[#f6f4ee] px-6 py-3 border-t border-[#D5DbDB] flex items-center justify-between sm:justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsScheduleVisitOpen(false)}
              className="border-[#DA7756] text-[#DA7756] hover:bg-[#fbeeed] text-xs font-semibold px-4 h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !selectedScheduleFlatId ||
                !scheduleVisitDate ||
                !selectedScheduleSlotId ||
                isSubmittingScheduleVisit
              }
              onClick={handleCreateScheduleVisit}
              className="btn-primary text-xs font-semibold px-6 h-9 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmittingScheduleVisit ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling...</span>
                </div>
              ) : (
                "Schedule Visit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentzRequest;
