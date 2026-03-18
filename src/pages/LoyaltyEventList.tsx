import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Eye,
  Settings,
  Users,
  UserCheck,
  UserX,
  Clock,
  Pencil,
} from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { Switch } from "@mui/material";

interface Event {
  id: number;
  event_name: string;
  event_at: string;
  from_time: string;
  to_time: string;
  active: boolean;
  show_on_home: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface EventPermissions {
  create?: string;
  update?: string;
  delete?: string;
  show?: string;
  destroy?: string;
}

const LoyaltyEventsList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventPermissions, setEventPermissions] = useState<EventPermissions>(
    {}
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("events");

  // Event Statistics
  const [eventStats, setEventStats] = useState({
    totalInvitedCPs: 0,
    attendedCPs: 0,
    notAttendedCPs: 0,
    scanTimeEntries: 0,
  });

  // Upcoming/past events count (bound from API)
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [pastEventsCount, setPastEventsCount] = useState(0);

  const getEventPermissions = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const permissions = JSON.parse(lockRolePermissions);
      return permissions.event || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  // Cleanup body overflow styles when component mounts (fixes scroll-lock from modals)
  useEffect(() => {
    document.body.style.overflow = "unset";
    document.body.style.paddingRight = "0px";
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, []);

  useEffect(() => {
    setEventPermissions(getEventPermissions());
  }, []);

  const fetchEvents = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      // Use axios params to pass the page parameter correctly
      const response = await axios.get(getFullUrl("/crm/admin/events.json"), {
        params: {
          page: page,
          "q[event_name_cont]": search || undefined,
        },
        headers: {
          Authorization: getAuthHeader(),
        },
      });

      const eventsData = response.data.classifieds || [];

      // Extract statistics from API response
      if (response.data) {
        setEventStats({
          totalInvitedCPs: response.data.total_invited || 0,
          attendedCPs: response.data.attended_count || 0,
          notAttendedCPs: response.data.not_attended_count || 0,
          scanTimeEntries: 0,
        });

        setUpcomingEventsCount(
          typeof response.data.upcoming_events_count === "number"
            ? response.data.upcoming_events_count
            : typeof response.data.upcomming_events_count === "number"
              ? response.data.upcomming_events_count
              : 0
        );

        setPastEventsCount(
          typeof response.data.past_events_count === "number"
            ? response.data.past_events_count
            : 0
        );
      }

      setEvents(eventsData);
      setCurrentPage(page);

      if (response.data.pagination) {
        setTotalPages(response.data.pagination.total_pages || 1);
        setTotalCount(response.data.pagination.total_count || 0);
      } else {
        // Fallback for unexpected response structure
        setTotalPages(1);
        setTotalCount(eventsData.length);
      }

      // Cache all events if needed (though with server-side pagination, caching all is less common)
      sessionStorage.setItem("cached_events", JSON.stringify(eventsData));
    } catch (error) {
      toast.error("Failed to fetch events.");
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEvents(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchEvents]);

  useEffect(() => {
    if (currentPage !== 1) {
      fetchEvents(currentPage, searchTerm);
    }
  }, [currentPage, fetchEvents]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage ||
      loading
    ) {
      return;
    }
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) {
      return null;
    }
    const items = [];
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            aria-disabled={loading}
            className={loading ? "pointer-events-none opacity-50" : ""}
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
                aria-disabled={loading}
                className={loading ? "pointer-events-none opacity-50" : ""}
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
                aria-disabled={loading}
                className={loading ? "pointer-events-none opacity-50" : ""}
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
                  aria-disabled={loading}
                  className={loading ? "pointer-events-none opacity-50" : ""}
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
              aria-disabled={loading}
              className={loading ? "pointer-events-none opacity-50" : ""}
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
              aria-disabled={loading}
              className={loading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const handleAddEvent = () =>
    location.pathname.includes("/loyalty")
      ? navigate("/loyalty/event-create")
      : navigate("/maintenance/event-create");
  const handleEditEvent = (id: number) =>
    location.pathname.includes("/loyalty")
      ? navigate(`/loyalty/event-edit/${id}`)
      : navigate(`/maintenance/event-edit/${id}`);
  const handleViewEvent = (id: number) =>
    location.pathname.includes("/loyalty")
      ? navigate(`/loyalty/event-details/${id}`)
      : navigate(`/maintenance/event-details/${id}`);
  const handleClearSelection = () => {
    setShowActionPanel(false);
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      await axios.put(
        getFullUrl(`/crm/admin/events/${id}.json`),
        { event: { active: !currentStatus } },
        {
          headers: {
            Authorization: getAuthHeader(),
          },
        }
      );

      fetchEvents(currentPage, searchTerm);
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error toggling event status:", error);
      toast.error("Failed to update status.");
    }
  };

  const getShortText = (text: string, wordLimit = 10) => {
    if (!text) return "-";
    const words = text.split(" ");
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };

  const handleToggleShowOnHome = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      // Update local state immediately for better UX
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === id ? { ...event, show_on_home: !currentStatus } : event
        )
      );

      await axios.put(
        getFullUrl(`/crm/admin/events/${id}.json`),
        { event: { show_on_home: !currentStatus } },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthHeader(),
          },
        }
      );

      toast.success("Show on Home updated successfully!");
    } catch (error) {
      console.error("Error toggling show on home:", error);
      toast.error("Failed to update Show on Home.");
      // Revert the change on error
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === id ? { ...event, show_on_home: currentStatus } : event
        )
      );
    }
  };

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

  function formatDateOnly(datetime: string) {
    if (!datetime) return "-";
    const date = new Date(datetime);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatTimeOnly(datetime: string) {
    if (!datetime) return "-";
    const date = new Date(datetime);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const columns = [
    { key: "actions", label: "Action", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "event_name", label: "Event Name", sortable: true },
    { key: "event_at", label: "Event Venue", sortable: true },
    { key: "from_time", label: "Event Date", sortable: false },
    { key: "to_time", label: "Event Time", sortable: false },
    { key: "created_by", label: "Created By", sortable: false },
    { key: "created_at", label: "Created On", sortable: false },
    { key: "show_on_home", label: "Show on Home", sortable: false },
    { key: "active", label: "Status", sortable: false },
  ];

  const renderCell = (item: Event, columnKey: string, index: number) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-1">
            {/* {eventPermissions.show === "true" && ( */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewEvent(item.id)}
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Button>
            {/* )} */}
            {/* {eventPermissions.update === "true" && ( */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditEvent(item.id)}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            {/* )} */}
          </div>
        );
      case "id":
        return (
          <span className="text-sm text-gray-700">
            {(currentPage - 1) * 10 + index + 1}
          </span>
        );
      case "event_name":
        return (
          <span
            title={item.event_name}
            className="cursor-pointer text-sm text-gray-700"
          >
            {getShortText(item.event_name, 5)}
          </span>
        );
      case "event_at":
        return (
          <span
            title={item.event_at}
            className="cursor-pointer text-sm text-gray-700"
          >
            {getShortText(item.event_at, 5)}
          </span>
        );
      case "from_time":
        return formatDateOnly(item.from_time);
      case "to_time":
        return formatTimeOnly(item.from_time);
      case "created_by":
        return item.created_by;
      case "created_at":
        return formatDateOnly(item.created_at);
      case "show_on_home":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={item.show_on_home || false}
              onChange={() => handleToggleShowOnHome(item.id, item.show_on_home)}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#C72030",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#C72030",
                },
              }}
            />
            <span className="text-sm font-medium">
              {item.show_on_home ? "Yes" : "No"}
            </span>
          </div>
        );
      case "active":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={item.active || false}
              onChange={() => handleToggle(item.id, item.active)}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#22c55e",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#22c55e",
                },
              }}
            />
            <span className="text-sm font-medium">
              {item.active ? "Active" : "Inactive"}
            </span>
          </div>
        );
      default:
        return (item[columnKey as keyof Event] as React.ReactNode) ?? "-";
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      <Button
        onClick={handleAddEvent}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        Add
      </Button>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      {/* Event Statistics Cards */}
      {location.pathname.includes("/loyalty") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4">
            <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center">
              <Settings className="w-6 h-6 text-[#C72030]" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#1A1A1A]">
                {totalCount}
              </div>
              <div className="text-sm font-medium text-[#1A1A1A]">
                Total Events
              </div>
            </div>
          </div>

          <div
            className="bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { }}
          >
            <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#C72030]" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#1A1A1A]">
                {upcomingEventsCount}
              </div>
              <div className="text-sm font-medium text-[#1A1A1A]">
                Upcoming Event
              </div>
            </div>
          </div>

          <div
            className="bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { }}
          >
            <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#C72030]" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#1A1A1A]">
                {pastEventsCount}
              </div>
              <div className="text-sm font-medium text-[#1A1A1A]">
                Past Event
              </div>
            </div>
          </div>
        </div>
      )}

      {!location.pathname.includes("/loyalty") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total Invited CP",
              value: eventStats.totalInvitedCPs,
              icon: Users,
              type: "total",
              clickable: false,
            },
            {
              label: "Attended CPs",
              value: eventStats.attendedCPs,
              icon: UserCheck,
              type: "attended",
              clickable: false,
            },
            {
              label: "Not Attended CPs",
              value: eventStats.notAttendedCPs,
              icon: UserX,
              type: "notAttended",
              clickable: false,
            },
            // {
            //   label: 'Scan Time & Entry Log',
            //   value: eventStats.scanTimeEntries,
            //   icon: Clock,
            //   type: 'scanLog',
            //   clickable: false
            // }
          ].map((item, i) => {
            const IconComponent = item.icon;
            return (
              <div
                key={i}
                className={`bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4 ${item.clickable
                  ? "cursor-pointer hover:shadow-lg transition-shadow"
                  : ""
                  }`}
              >
                <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center rounded">
                  <IconComponent className="w-6 h-6 text-[#C72030]" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-[#1A1A1A]">
                    {item.value.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* {showActionPanel && (
        <SelectionPanel
          onAdd={handleAddEvent}
          onClearSelection={handleClearSelection}
        />
      )} */}
      <>
        <EnhancedTable
          data={events}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="events"
          storageKey="events-table"
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search events..."
          leftActions={renderCustomActions()}
          loading={isSearching || loading}
          loadingMessage={
            isSearching ? "Searching events..." : "Loading events..."
          }
        />
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={
                      currentPage === 1 || loading
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={
                      currentPage === totalPages || loading
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
            <TabsTrigger
              value="events"
              className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={2}
                className="lucide lucide-calendar w-4 h-4 stroke-black group-data-[state=active]:stroke-[#C72030]"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
              Event List
            </TabsTrigger>

            <TabsTrigger
              value="analytics"
              className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={2}
                className="lucide lucide-chart-column w-4 h-4 stroke-black group-data-[state=active]:stroke-[#C72030]"
              >
                <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="events"
            className="space-y-4 sm:space-y-4 mt-4 sm:mt-6"
          >
            {renderListTab()}
          </TabsContent>

          <TabsContent
            value="analytics"
            className="space-y-4 sm:space-y-4 mt-4 sm:mt-6"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="text-gray-500 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-4"
                >
                  <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics Coming Soon
              </h3>
              <p className="text-gray-600">
                Event analytics and reporting features will be available here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LoyaltyEventsList;
