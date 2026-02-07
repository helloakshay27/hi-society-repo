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
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
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

const Eventlist = () => {
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
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  useEffect(() => {
    setEventPermissions(getEventPermissions());
  }, []);

  const fetchEvents = useCallback(
    async (page: number, search: string) => {
      setLoading(true);
      setIsSearching(!!search);
      try {
        const response = await axios.get(getFullUrl('/crm/admin/events.json'), {
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
            scanTimeEntries: 0, // This may need to be added to the API response
          });
        }

        // Client-side search filtering
        let filteredEvents = eventsData;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredEvents = eventsData.filter(
            (event: Event) =>
              event.event_name?.toLowerCase().includes(searchLower) ||
              event.event_at?.toLowerCase().includes(searchLower)
          );
        }

        // Client-side pagination
        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

        setEvents(paginatedEvents);
        setCurrentPage(page);
        setTotalPages(Math.ceil(filteredEvents.length / itemsPerPage));
        setTotalCount(filteredEvents.length);

        // Cache all events
        sessionStorage.setItem("cached_events", JSON.stringify(eventsData));
      } catch (error) {
        toast.error("Failed to fetch events.");
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchEvents(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchEvents]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddEvent = () => navigate("/maintenance/event-create");
  const handleEditEvent = (id: number) =>
    navigate(`/maintenance/event-edit/${id}`);
  const handleViewEvent = (id: number) =>
    navigate(`/maintenance/event-details/${id}`);
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

  const handleToggleShowOnHome = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      // Update local state immediately for better UX
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === id 
            ? { ...event, show_on_home: !currentStatus }
            : event
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
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === id 
            ? { ...event, show_on_home: currentStatus }
            : event
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
    { key: "event_at", label: "Event At", sortable: true },
    { key: "from_time", label: "Event Date", sortable: false },
    { key: "to_time", label: "Event Time", sortable: false },
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
        return item.event_name || "-";
      case "event_at":
        return item.event_at || "-";
      case "from_time":
        return formatDateOnly(item.from_time);
      case "to_time":
        return formatTimeOnly(item.from_time);
      case "show_on_home":
        return (
          <Switch
            checked={item.show_on_home || false}
            onChange={() => handleToggleShowOnHome(item.id, item.show_on_home)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#C72030",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#C72030",
              },
            }}
          />
        );
      case "active":
        return (
          <Switch
            checked={item.active || false}
            onChange={() => handleToggle(item.id, item.active)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#C72030",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#C72030",
              },
            }}
          />
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
              className={`bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4 ${
                item.clickable
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
          pagination={true}
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
        {!searchTerm && totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
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

export default Eventlist;
