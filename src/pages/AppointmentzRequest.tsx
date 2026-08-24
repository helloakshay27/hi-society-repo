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
} from "lucide-react";
import {
  getSiteScheduleRequests,
  exportSiteRequestsData,
  updateSiteScheduleRequest,
  getAllRMUsers,
  RMUserData,
  SiteScheduleRequest,
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

  // Schedule Visit dialog state
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);
  const [newVisitData, setNewVisitData] = useState({
    tower: "",
    flat: "",
    owners: "",
    scheduled_by: "",
    scheduled_on: "",
    selected_slot: "",
    reason: "",
  });

  // Fetch RM users list for dropdown filter
  useEffect(() => {
    const fetchRMUsers = async () => {
      try {
        const users = await getAllRMUsers();
        setRmUsers(users || []);
      } catch (err) {
        console.warn("Could not fetch RM users for filter:", err);
      }
    };
    fetchRMUsers();
  }, []);

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

  // Dynamic status count summary
  const summaryCounts = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const st = (item.status || "").toLowerCase();
        if (st.includes("schedul")) acc.scheduled++;
        else if (st.includes("visit")) acc.siteVisited++;
        else if (st.includes("revisit")) acc.revisitRequested++;
        else if (st.includes("cancel")) acc.cancelled++;
        else if (st.includes("handover") || st.includes("complete")) acc.handoverCompleted++;
        return acc;
      },
      { scheduled: 0, siteVisited: 0, revisitRequested: 0, cancelled: 0, handoverCompleted: 0 }
    );
  }, [data]);

  // Client-side and applied filter logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedStatusFilter) {
        const st = item.status.toLowerCase();
        if (selectedStatusFilter === "Scheduled" && !st.includes("schedul")) return false;
        if (selectedStatusFilter === "Site Visited" && !st.includes("visit")) return false;
        if (selectedStatusFilter === "Revisit Requested" && !st.includes("revisit")) return false;
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
        await fetchSiteScheduleRequests();
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

  const handleCreateScheduleVisit = () => {
    if (!newVisitData.tower || !newVisitData.flat || !newVisitData.scheduled_on) {
      toast.error("Please fill in required fields (Tower, Flat, Scheduled Date)");
      return;
    }
    const newEntry: AppointmentRequestRow = {
      id: Date.now(),
      token: (Math.floor(Math.random() * 9000) + 1000).toString(),
      tower: newVisitData.tower,
      flat: newVisitData.flat,
      owners: newVisitData.owners || "New Owner",
      scheduled_by: newVisitData.scheduled_by || "Self",
      scheduled_on: newVisitData.scheduled_on,
      selected_slot: newVisitData.selected_slot || "10:00 AM To 11:00 AM",
      booked_at: new Date().toLocaleDateString("en-GB") + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toLocaleDateString("en-GB") + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Scheduled",
      ndc_date: "-",
      handover_date: "-",
      can_edit: true,
    };
    setData([newEntry, ...data]);
    toast.success(`Visit scheduled successfully with Token #${newEntry.token}`);
    setIsScheduleVisitOpen(false);
    setNewVisitData({
      tower: "",
      flat: "",
      owners: "",
      scheduled_by: "",
      scheduled_on: "",
      selected_slot: "",
      reason: "",
    });
  };

  const getStatusBadgeStyle = (status: string) => {
    const st = (status || "").toLowerCase();
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
    if (st.includes("handover") || st.includes("complete")) {
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
      {/* 5 Top Summary Cards Using Application Design Guidelines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatsCard
          title="Total Scheduled"
          value={summaryCounts.scheduled}
          icon={<CalendarCheck className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Scheduled"}
          onClick={() => handleCardClick("Scheduled")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Site Visited"
          value={summaryCounts.siteVisited}
          icon={<CheckCircle2 className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Site Visited"}
          onClick={() => handleCardClick("Site Visited")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Revisit Requested"
          value={summaryCounts.revisitRequested}
          icon={<RefreshCw className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Revisit Requested"}
          onClick={() => handleCardClick("Revisit Requested")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Cancelled"
          value={summaryCounts.cancelled}
          icon={<CalendarX className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Cancelled"}
          onClick={() => handleCardClick("Cancelled")}
          className="border border-[#D5DbDB]"
        />

        <StatsCard
          title="Total Handover Completed"
          value={summaryCounts.handoverCompleted}
          icon={<CheckSquare className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Handover Completed"}
          onClick={() => handleCardClick("Handover Completed")}
          className="border border-[#D5DbDB]"
        />
      </div>

      {/* Active Filter Banner if card filter is active */}
      {selectedStatusFilter && (
        <div className="flex items-center justify-between bg-[#f6f4ee] border border-[#D5DbDB] px-4 py-2 rounded-lg text-sm text-[#1A1A1A]">
          <span>
            Filtering by status: <strong>{selectedStatusFilter}</strong> ({filteredData.length} results)
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
                <Select value={filterTower} onValueChange={setFilterTower}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select Tower" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Towers</SelectItem>
                    {uniqueTowers.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flat */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Flat</Label>
                <Select value={filterFlat} onValueChange={setFilterFlat}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select Flat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Flats</SelectItem>
                    {uniqueFlats.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* RM Assigned */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">RM Assigned</Label>
                <Select value={filterRmAssigned} onValueChange={setFilterRmAssigned}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select RM Assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All RM Users</SelectItem>
                    {rmUsers.map((u) => (
                      <SelectItem key={u.id} value={u.full_name}>
                        {u.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
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

      {/* Schedule Visit Modal */}
      <Dialog open={isScheduleVisitOpen} onOpenChange={setIsScheduleVisitOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#f6f4ee] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#DA7756]" />
              Schedule New Visit
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-6 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Tower *</Label>
                <Input
                  placeholder="e.g. D - WING"
                  value={newVisitData.tower}
                  onChange={(e) => setNewVisitData({ ...newVisitData, tower: e.target.value })}
                  className="border-[#D5DbDB]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Flat No. *</Label>
                <Input
                  placeholder="e.g. D-3502"
                  value={newVisitData.flat}
                  onChange={(e) => setNewVisitData({ ...newVisitData, flat: e.target.value })}
                  className="border-[#D5DbDB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Owner Name</Label>
                <Input
                  placeholder="Owner Name"
                  value={newVisitData.owners}
                  onChange={(e) => setNewVisitData({ ...newVisitData, owners: e.target.value })}
                  className="border-[#D5DbDB]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Scheduled By</Label>
                <Input
                  placeholder="Scheduled By"
                  value={newVisitData.scheduled_by}
                  onChange={(e) => setNewVisitData({ ...newVisitData, scheduled_by: e.target.value })}
                  className="border-[#D5DbDB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Scheduled Date *</Label>
                <Input
                  type="date"
                  value={newVisitData.scheduled_on}
                  onChange={(e) => setNewVisitData({ ...newVisitData, scheduled_on: e.target.value })}
                  className="border-[#D5DbDB]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Slot</Label>
                <Select
                  value={newVisitData.selected_slot}
                  onValueChange={(val) => setNewVisitData({ ...newVisitData, selected_slot: val })}
                >
                  <SelectTrigger className="border-[#D5DbDB]">
                    <SelectValue placeholder="Select Slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10:00 AM To 11:00 AM">10:00 AM To 11:00 AM</SelectItem>
                    <SelectItem value="11:00 AM To 12:00 PM">11:00 AM To 12:00 PM</SelectItem>
                    <SelectItem value="12:00 PM To 01:00 PM">12:00 PM To 01:00 PM</SelectItem>
                    <SelectItem value="02:00 PM To 03:00 PM">02:00 PM To 03:00 PM</SelectItem>
                    <SelectItem value="04:00 PM To 05:00 PM">04:00 PM To 05:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1A1A1A]">Purpose / Reason</Label>
              <Input
                placeholder="Visit reason / notes..."
                value={newVisitData.reason}
                onChange={(e) => setNewVisitData({ ...newVisitData, reason: e.target.value })}
                className="border-[#D5DbDB]"
              />
            </div>
          </div>

          <DialogFooter className="bg-[#f6f4ee] px-6 py-3 border-t border-[#D5DbDB] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsScheduleVisitOpen(false)}
              className="border-[#D5DbDB] hover:bg-[#DBC2A9]"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="btn-primary"
              onClick={handleCreateScheduleVisit}
            >
              Schedule Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentzRequest;
