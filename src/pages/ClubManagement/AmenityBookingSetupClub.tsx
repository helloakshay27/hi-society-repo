import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import { BookingSetupFilterModal } from "@/components/BookingSetupFilterModal";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { editFacilityBookingSetup } from "@/store/slices/facilityBookingsSlice";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface BookingSetup {
  id: string;
  name: string;
  type: string;
  department: string;
  bookBy: string;
  bookBefore: string;
  advanceBooking: string;
  createdOn: string;
  createdBy: string;
  status: boolean;
}

const columns: ColumnConfig[] = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    draggable: true,
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    draggable: true,
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
    draggable: true,
  },
  {
    key: 'bookBefore',
    label: 'Book before',
    sortable: true,
    draggable: true,
  },
  {
    key: 'createdOn',
    label: 'Created On',
    sortable: true,
    draggable: true,
  },
  {
    key: 'createdBy',
    label: 'Created by',
    sortable: true,
    draggable: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    draggable: true,
  },
];

export const BookingSetupClubDashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bookingSetupData, setBookingSetupData] = useState<BookingSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_count: 0,
    total_pages: 0,
  });
  const pageSize = 10;

  const handleFilterApply = (filters: any) => {
    console.log("Applied booking setup filters:", filters);
  };

  // Format dhm object to string like "0D • 0H • 4M"
  const formatDHM = (dhm: { d: number; h: number; m: number } | null) => {
    if (!dhm) return "0 DD • 0 HH • 0 MM";
    return `${dhm.d ?? 0} DD • ${dhm.h ?? 0} HH • ${dhm.m ?? 0} MM`;
  };

  // Format date string to "22-11-2022" format
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";

    try {
      const isoFormatted = dateString.replace(" ", "T");
      const date = new Date(isoFormatted);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  };

  // Fetch booking setup data from API
  const fetchBookingSetupData = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await apiClient.get("/crm/admin/facility_setups.json", {
        params: {
          page,
          per_page: pageSize,
        }
      });
      if (response.data && response.data.data) {
        const formattedData = response.data.data.map(
          (item: any) => ({
            id: item.id.toString(),
            name: item.fac_name || "",
            type: item.fac_type || "",
            department: item.department_name || "",
            bookBy: item.book_by || "",
            bookBefore: formatDHM(item.bb_dhm),
            createdOn: item?.created_at?.split("T")[0],
            createdBy: item.created_by.name || "",
            status: item.active || false,
          })
        );
        setBookingSetupData(formattedData);
        setPagination({
          current_page: response.data.meta.current_page || page,
          total_count: response.data.meta.total_count || 0,
          total_pages: response.data.meta.total_pages || 1,
        });
      }
    } catch (error) {
      console.error("Error fetching booking setup data:", error);
      toast.error("Failed to fetch booking setup data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingSetupData();
  }, []);

  const handleAddBooking = () => {
    navigate("/cms/facility-setup/add");
  };

  const handleStatusToggle = async (id: string) => {
    const bookingToUpdate = bookingSetupData.find(
      (booking) => booking.id === id
    );
    if (!bookingToUpdate) return;

    const updatedBooking = !bookingToUpdate.status;

    const dataToSubmit = {
      facility_setup: {
        active: updatedBooking,
      },
    };

    try {
      await dispatch(
        editFacilityBookingSetup({
          token,
          baseUrl,
          id: id.toString(),
          data: dataToSubmit,
        })
      ).unwrap();

      toast.success("Booking status updated successfully!");
      setBookingSetupData((prevData) =>
        prevData.map((booking) =>
          booking.id === id
            ? { ...booking, status: updatedBooking }
            : booking
        )
      );
    } catch (error) {
      console.error("Failed to update booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/cms/facility-setup/${id}`);
  };

  const renderCell = (item: BookingSetup, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return item.id || '';
      case 'name':
        return item.name || '';
      case 'type':
        return item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : '';
      case 'department':
        return item.department || 'All';
      case 'bookBy':
        return item.bookBy || '';
      case 'bookBefore':
        return item.bookBefore || '';
      case 'createdOn': {
        if (!item.createdOn) return '';
        // If format is YYYY-MM-DD, convert to DD/MM/YYYY directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(item.createdOn)) {
          const [year, month, day] = item.createdOn.split('-');
          return `${day}/${month}/${year}`;
        }
        return item.createdOn;
      }
      case 'createdBy':
        return item.createdBy || '';
      case 'status':
        return (
          <div className="flex items-center justify-center">
            <div
              className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${item.status ? 'bg-green-500' : 'bg-gray-300'
                }`}
              onClick={() => handleStatusToggle(item.id)}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${item.status ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </div>
          </div>
        );
      default:
        return item[columnKey as keyof BookingSetup]?.toString() || '';
    }
  };

  // const handdleEditDetails = (id: string) => {
  //   navigate(`/settings/vas/booking/setup/edit/${id}`);
  // }

  const renderActions = (booking: BookingSetup) => (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleViewDetails(booking.id)}
      >
        <Eye className="w-4 h-4" />
      </Button>
      {/* <Button
        size="sm"
        variant="ghost"
        onClick={() => handdleEditDetails(booking.id)}
      >
        <Pencil className="w-4 h-4" />
      </Button> */}
    </div>
  );

  const leftActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => setShowActionPanel(true)}
        className="bg-[#C72030] hover:bg-[#C72030]/90 text-white px-4 py-2 rounded-md flex items-center gap-2 border-0"
      >
        <Plus className="w-4 h-4" />
        Action
      </Button>
      {/* <Button
        variant="outline"
        onClick={() => setIsFilterOpen(true)}
        className="flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        Filter
      </Button> */}
    </div>
  );

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > pagination.total_pages || page === pagination.current_page || loading) {
      return;
    }

    try {
      setPagination((prev) => ({ ...prev, current_page: page }));
      await fetchBookingSetupData(page);
    } catch (error) {
      console.error("Error changing page:", error);
      toast.error("Failed to load page data. Please try again.");
    }
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

  return (
    <div className="p-6 bg-white">
      {showActionPanel && (
        <SelectionPanel
          // actions={selectionActions}
          onAdd={handleAddBooking}
          onClearSelection={() => setShowActionPanel(false)}
        />
      )}
      <div className="rounded-lg shadow-sm p-1 bg-transparent">
        <EnhancedTable
          data={bookingSetupData}
          columns={columns}
          renderCell={renderCell}
          renderActions={renderActions}
          storageKey="booking-setup-table"
          className="min-w-full"
          emptyMessage={loading ? "Loading booking data..." : "No booking data found"}
          leftActions={leftActions}
          enableSearch={true}
          // onFilterClick={() => setIsFilterOpen(true)}
          enableSelection={false}
          hideTableExport={true}
        />

        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                  className={pagination.current_page === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(pagination.total_pages, pagination.current_page + 1))}
                  className={pagination.current_page === pagination.total_pages || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <BookingSetupFilterModal
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          onApply={handleFilterApply}
        />
      </div>
    </div>
  );
};