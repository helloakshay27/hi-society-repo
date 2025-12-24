import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";


interface Event {
  id: number;
  event_name: string;
  event_at: string;
  from_time: string;
  to_time: string;
  active: boolean;
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
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventPermissions, setEventPermissions] = useState<EventPermissions>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

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

  useEffect(() => {
    setEventPermissions(getEventPermissions());
  }, []);

  const fetchEvents = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}events.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const eventsData = response.data.events || [];

      // Client-side search filtering
      let filteredEvents = eventsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredEvents = eventsData.filter((event: Event) =>
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
      sessionStorage.setItem('cached_events', JSON.stringify(eventsData));
    } catch (error) {
      toast.error("Failed to fetch events.");
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL]);

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
  const handleEditEvent = (id: number) => navigate(`/maintenance/event-edit/${id}`);
  const handleViewEvent = (id: number) => navigate(`/maintenance/event-details/${id}`);
  const handleClearSelection = () => { setShowActionPanel(false); };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      await axios.put(
        `${baseURL}events/${id}.json`,
        { event: { active: !currentStatus } },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'Sr No', sortable: true },
    { key: 'event_name', label: 'Event Name', sortable: true },
    { key: 'event_at', label: 'Event At', sortable: true },
    { key: 'from_time', label: 'Event From', sortable: false },
    { key: 'to_time', label: 'Event To', sortable: false },
    { key: 'active', label: 'Status', sortable: false },
  ];

  const renderCell = (item: Event, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {eventPermissions.update === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleEditEvent(item.id)} title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {eventPermissions.show === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleViewEvent(item.id)} title="View">
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'event_name':
        return item.event_name || "-";
      case 'event_at':
        return item.event_at || "-";
      case 'from_time':
        return formatDateTimeManual(item.from_time);
      case 'to_time':
        return formatDateTimeManual(item.to_time);
      case 'active':
        return eventPermissions.destroy === "true" ? (
          <button
            onClick={() => handleToggle(item.id, item.active)}
            className="toggle-button"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              width: "70px",
            }}
          >
            {item.active ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="25"
                fill="#de7008"
                className="bi bi-toggle-on"
                viewBox="0 0 16 16"
              >
                <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="25"
                fill="#667085"
                className="bi bi-toggle-off"
                viewBox="0 0 16 16"
              >
                <path d="M11 4a4 4 0 0 1 0 8H8a5 5 0 0 0 2-4 5 5 0 0 0-2-4zm-6 8a4 4 0 1 1 0-8 4 4 0 0 1 0 8M0 8a5 5 0 0 0 5 5h6a5 5 0 0 0 0-10H5a5 5 0 0 0-5 5" />
              </svg>
            )}
          </button>
        ) : (
          <span className="text-sm text-gray-500">{item.active ? "Active" : "Inactive"}</span>
        );
      default:
        return item[columnKey as keyof Event] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      <Button 
        onClick={() => setShowActionPanel((prev) => !prev)}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
        Action
      </Button>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      {showActionPanel && (
        <SelectionPanel
          onAdd={handleAddEvent}
          onClearSelection={handleClearSelection}
        />
      )}
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
          loadingMessage={isSearching ? "Searching events..." : "Loading events..."}
        />
        {!searchTerm && totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
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
        {renderListTab()}
      </div>
    </div>
  );
};

export default Eventlist;
