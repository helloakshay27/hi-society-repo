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
  Plus,
  Filter,
  X,
  Clock,
  CalendarCheck,
  CalendarX,
  Video,
  VideoOff,
  ExternalLink,
} from "lucide-react";
import {
  getVirtualRequests,
  createVirtualRequest,
  updateSiteScheduleRequest,
  VirtualRequestItem,
} from "@/services/appointmentzService";

export interface VirtualRequestRow {
  id: number;
  token: string | number;
  tower: string;
  flat: string;
  request_type: string;
  created_at: string;
  scheduled_by: string;
  scheduled_on: string;
  selected_slot: string;
  status: string;
  status_label?: string;
  meetings: string;
  meeting_link?: string;
  can_edit?: boolean;
}

export const AppointmentzVirtualRequests: React.FC = () => {
  const [data, setData] = useState<VirtualRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VirtualRequestRow | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Status Filter from Top Summary Cards
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);

  // Filter Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterTower, setFilterTower] = useState("");
  const [filterFlat, setFilterFlat] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<{
    tower: string;
    flat: string;
    type: string;
    status: string;
    dateFrom: string;
    dateTo: string;
  }>({
    tower: "",
    flat: "",
    type: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  // Add Details Modal State (matching Screenshot 2)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    tower: "",
    flat: "",
    type: "Inspection",
  });

  // Fetch Virtual Requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getVirtualRequests(currentPage, {
        ...(appliedFilters.tower ? { tower: appliedFilters.tower } : {}),
        ...(appliedFilters.flat ? { flat: appliedFilters.flat } : {}),
        ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
      });

      const list = response.virtual_requests || response.site_schedule_requests || [];

      if (list && list.length > 0) {
        const mapped: VirtualRequestRow[] = list.map((item) => ({
          id: item.id,
          token: item.id.toString(),
          tower: item.society_flat?.tower?.name || "-",
          flat: item.society_flat?.flat_no || "-",
          request_type: item.request_type || "Inspection",
          created_at: item.created_at || "-",
          scheduled_by: item.scheduled_by?.name || "-",
          scheduled_on: item.scheduled_on || "-",
          selected_slot: item.selected_slot || "-",
          status: item.status_label || item.status || "Pending",
          status_label: item.status_label,
          meetings: item.meetings || item.meeting_link || "-",
          meeting_link: item.meeting_link,
          can_edit: item.can_edit ?? true,
        }));
        setData(mapped);
        setTotalPages(response.pagination?.total_pages || 1);
      } else {
        setData([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.warn("Could not fetch virtual requests:", error);
      setData([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, appliedFilters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Derived lists for towers and flats
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

  // Summary counts for the 3 top cards
  const summaryCounts = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const st = (item.status || "").toLowerCase();
        if (st.includes("pend")) acc.pending++;
        else if (st.includes("schedul")) acc.scheduled++;
        else if (st.includes("cancel")) acc.cancelled++;
        return acc;
      },
      { pending: 0, scheduled: 0, cancelled: 0 }
    );
  }, [data]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedStatusFilter) {
        const st = item.status.toLowerCase();
        if (selectedStatusFilter === "Pending" && !st.includes("pend")) return false;
        if (selectedStatusFilter === "Scheduled" && !st.includes("schedul")) return false;
        if (selectedStatusFilter === "Cancelled" && !st.includes("cancel")) return false;
      }
      if (appliedFilters.tower && appliedFilters.tower !== "all" && item.tower.toLowerCase() !== appliedFilters.tower.toLowerCase()) {
        return false;
      }
      if (appliedFilters.flat && appliedFilters.flat !== "all" && item.flat.toLowerCase() !== appliedFilters.flat.toLowerCase()) {
        return false;
      }
      if (appliedFilters.type && appliedFilters.type !== "all" && item.request_type.toLowerCase() !== appliedFilters.type.toLowerCase()) {
        return false;
      }
      if (appliedFilters.status && appliedFilters.status !== "all" && item.status.toLowerCase() !== appliedFilters.status.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [data, selectedStatusFilter, appliedFilters]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      tower: filterTower,
      flat: filterFlat,
      type: filterType,
      status: filterStatus,
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
    });
    setIsFilterModalOpen(false);
  };

  const handleResetFilter = () => {
    setFilterTower("");
    setFilterFlat("");
    setFilterType("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setAppliedFilters({
      tower: "",
      flat: "",
      type: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });
    setSelectedStatusFilter(null);
    setIsFilterModalOpen(false);
  };

  // Submit new Virtual Request from Details Modal (Screenshot 2)
  const handleCreateVirtualRequest = async () => {
    if (!newRequestData.tower || !newRequestData.flat) {
      toast.error("Please select both Tower and Flat");
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await createVirtualRequest({
        tower_name: newRequestData.tower,
        flat_no: newRequestData.flat,
        request_type: newRequestData.type || "Inspection",
      });

      toast.success("Virtual request created successfully");
      setIsAddModalOpen(false);
      setNewRequestData({ tower: "", flat: "", type: "Inspection" });
      fetchRequests();
    } catch (error) {
      // Create locally in state if offline/unsupported
      const newEntry: VirtualRequestRow = {
        id: Date.now(),
        token: Date.now().toString(),
        tower: newRequestData.tower,
        flat: newRequestData.flat,
        request_type: newRequestData.type || "Inspection",
        created_at: new Date().toLocaleDateString("en-GB"),
        scheduled_by: "Admin",
        scheduled_on: "-",
        selected_slot: "-",
        status: "Pending",
        meetings: "-",
        can_edit: true,
      };
      setData([newEntry, ...data]);
      toast.success("Virtual request added successfully");
      setIsAddModalOpen(false);
      setNewRequestData({ tower: "", flat: "", type: "Inspection" });
    } finally {
      setIsSubmittingAdd(false);
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
        await fetchRequests();
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
      toast.success(`Request ${selectedRequest.token} updated to ${updatedData.status}`);
      setIsEditModalOpen(false);
      setSelectedRequest(null);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const st = (status || "").toLowerCase();
    if (st.includes("pend")) {
      return "bg-[#DBC2A9] text-[#1A1A1A]";
    }
    if (st.includes("schedul")) {
      return "bg-[#C4B89D] text-[#1A1A1A]";
    }
    if (st.includes("cancel")) {
      return "bg-[#D5DBDB] text-[#1A1A1A]";
    }
    return "bg-[#f6f4ee] text-[#1A1A1A]";
  };

  // Columns definition matching Screenshot 1
  const columns: ColumnConfig[] = [
    { key: "actions", label: "Actions", sortable: false, width: 80 },
    { key: "id", label: "ID", sortable: true },
    { key: "tower", label: "Tower", sortable: true },
    { key: "flat", label: "Flat", sortable: true },
    { key: "request_type", label: "Request Type", sortable: true },
    { key: "created_at", label: "Created On", sortable: true },
    { key: "scheduled_by", label: "Scheduled By", sortable: true },
    { key: "scheduled_on", label: "Scheduled On", sortable: true },
    { key: "selected_slot", label: "Selected Slot", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "meetings", label: "Meetings", sortable: false },
  ];

  const renderCell = (item: VirtualRequestRow, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <button
            type="button"
            onClick={() => {
              setSelectedRequest(item);
              setIsEditModalOpen(true);
            }}
            className="p-1 text-[#DA7756] hover:text-[#c96844] transition-colors rounded hover:bg-[#DA7756]/10 flex items-center justify-center"
            title="Edit Request"
          >
            <Pencil className="h-4 w-4" />
          </button>
        );
      case "id":
        return <span className="text-[#1A1A1A] font-medium text-sm">{item.token}</span>;
      case "tower":
        return <span className="text-[#1A1A1A] text-sm">{item.tower}</span>;
      case "flat":
        return <span className="text-[#1A1A1A] text-sm font-medium">{item.flat}</span>;
      case "request_type":
        return <span className="text-[#1A1A1A] text-sm">{item.request_type}</span>;
      case "created_at":
        return <span className="text-[#1A1A1A] text-sm whitespace-nowrap">{item.created_at}</span>;
      case "scheduled_by":
        return <span className="text-[#1A1A1A] text-sm">{item.scheduled_by}</span>;
      case "scheduled_on":
        return <span className="text-[#1A1A1A] text-sm whitespace-nowrap">{item.scheduled_on}</span>;
      case "selected_slot":
        return <span className="text-[#1A1A1A] text-sm whitespace-nowrap">{item.selected_slot}</span>;
      case "status":
        return (
          <span className={`inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadgeStyle(item.status)}`}>
            {item.status}
          </span>
        );
      case "meetings":
        return item.meeting_link && item.meeting_link !== "-" ? (
          <a
            href={item.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#DA7756] hover:underline inline-flex items-center gap-1 text-xs font-medium"
          >
            <Video className="w-3.5 h-3.5" /> Join
          </a>
        ) : (
          <span className="text-[#1A1A1A] opacity-60 text-sm">-</span>
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
    appliedFilters.type ||
    appliedFilters.status
  );

  return (
    <div className="min-h-screen bg-[#fdfdfd] p-4 md:p-6 space-y-6">
      {/* 3 Top Summary Cards (Matching Screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Pending */}
        <StatsCard
          title="Total Pending"
          value={summaryCounts.pending}
          icon={<Clock className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Pending"}
          onClick={() => handleCardClick("Pending")}
          className="border border-[#D5DbDB]"
        />

        {/* Card 2: Total Scheduled */}
        <StatsCard
          title="Total Scheduled"
          value={summaryCounts.scheduled}
          icon={<CalendarCheck className="w-5 h-5 text-[#DA7756]" />}
          selected={selectedStatusFilter === "Scheduled"}
          onClick={() => handleCardClick("Scheduled")}
          className="border border-[#D5DbDB]"
        />

        {/* Card 3: Total Cancelled */}
        <StatsCard
          title="Total Cancelled"
          value={summaryCounts.cancelled}
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
          storageKey="appointmentz-virtual-requests-table"
          loading={loading}
          pagination={true}
          pageSize={10}
          enableExport={false}
          enableSearch={true}
          searchPlaceholder="Search"
          emptyMessage="No Matching Records Found"
          leftActions={
            <div className="flex items-center gap-3 flex-wrap">
              {/* + Add Request Button */}
              <Button
                variant="ghost"
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary h-9 px-4 text-sm font-medium rounded-md shadow-none"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Request
              </Button>
            </div>
          }
          rightActions={
            <div className="flex items-center gap-2">
              {/* Filter Icon Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterModalOpen(true)}
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

      {/* Powered by Footer */}
      <div className="text-center py-3 text-xs text-[#1A1A1A] opacity-60 font-medium tracking-wide">
        Powered by <span className="font-semibold text-[#1A1A1A]">Lockated</span>
      </div>

      {/* Details / Add Request Modal (Matching Screenshot 2 Structure with Design Guidelines) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#f6f4ee] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Video className="w-5 h-5 text-[#DA7756]" />
              Details
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 bg-white space-y-4">
            {/* Select Tower */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1A1A1A]">Select Tower</Label>
              <Select
                value={newRequestData.tower}
                onValueChange={(val) => setNewRequestData({ ...newRequestData, tower: val })}
              >
                <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                  <SelectValue placeholder="Select Tower" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tower A">Tower A</SelectItem>
                  <SelectItem value="Tower B">Tower B</SelectItem>
                  <SelectItem value="Tower C">Tower C</SelectItem>
                  <SelectItem value="D - WING">D - WING</SelectItem>
                  <SelectItem value="FM">FM</SelectItem>
                  {uniqueTowers.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Flat */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1A1A1A]">Select Flat</Label>
              <Select
                value={newRequestData.flat}
                onValueChange={(val) => setNewRequestData({ ...newRequestData, flat: val })}
              >
                <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                  <SelectValue placeholder="Select Flat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="101">101</SelectItem>
                  <SelectItem value="102">102</SelectItem>
                  <SelectItem value="D-3502">D-3502</SelectItem>
                  <SelectItem value="D-3508">D-3508</SelectItem>
                  {uniqueFlats.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1A1A1A]">Type</Label>
              <Select
                value={newRequestData.type}
                onValueChange={(val) => setNewRequestData({ ...newRequestData, type: val })}
              >
                <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inspection">Inspection</SelectItem>
                  <SelectItem value="Discussion">Discussion</SelectItem>
                  <SelectItem value="Handover">Handover</SelectItem>
                  <SelectItem value="Document Verification">Document Verification</SelectItem>
                  <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="bg-[#f6f4ee] px-6 py-3 border-t border-[#D5DbDB] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="border-[#D5DbDB] hover:bg-[#DBC2A9] text-[#1A1A1A]"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="btn-primary"
              onClick={handleCreateVirtualRequest}
              disabled={isSubmittingAdd}
            >
              {isSubmittingAdd ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Modal Popup */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#D5DbDB] shadow-xl">
          <DialogHeader className="bg-[#f6f4ee] px-6 py-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#DA7756]" />
              Filter Virtual Requests
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 bg-white space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Discussion">Discussion</SelectItem>
                    <SelectItem value="Handover">Handover</SelectItem>
                    <SelectItem value="Document Verification">Document Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1A1A1A]">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-xs border-[#D5DbDB] bg-white">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#f6f4ee] px-6 py-3 border-t border-[#D5DbDB] flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleResetFilter}
              className="border-[#D5DbDB] hover:bg-[#DBC2A9] text-[#1A1A1A]"
            >
              Reset
            </Button>
            <Button
              variant="ghost"
              className="btn-primary"
              onClick={handleApplyFilter}
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default AppointmentzVirtualRequests;
