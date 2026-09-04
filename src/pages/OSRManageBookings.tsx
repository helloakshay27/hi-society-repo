import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Eye,
  FileText,
  Plus,
  Filter,
  Search,
  Download,
  Loader2,
} from "lucide-react";
import { CreateScheduleModal } from "@/components/CreateScheduleModal";
import { OSRDashboardFilterModal } from "@/components/OSRDashboardFilterModal";
import { ColumnVisibilityDropdown } from "@/components/ColumnVisibilityDropdown";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

const OSRManageBookings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const loadingStartRef = useRef<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadingStartRef.current = Date.now();
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const [columns, setColumns] = useState([
    { key: "actions", label: "Actions", visible: true },
    { key: "id", label: "ID", visible: true },
    { key: "schedule", label: "Schedule", visible: true },
    { key: "amountPaid", label: "Amount Paid", visible: true },
    { key: "paymentStatus", label: "Payment Status", visible: true },
    { key: "paymentMode", label: "Payment Mode", visible: true },
    { key: "createdBy", label: "Created By", visible: true },
    { key: "flat", label: "Flat", visible: true },
    { key: "category", label: "Category", visible: true },
    { key: "subCategory", label: "Sub Category", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "rating", label: "Rating", visible: true },
    { key: "createdOn", label: "Created On", visible: true },
  ]);
 
  const osrData = [
    {
      id: "1265",
      schedule: "16/04/2026 10:00 To 11:00",
      amountPaid: 0,
      paymentStatus: "Payment Pending",
      paymentMode: "",
      createdBy: "Godrej Living",
      flat: "FM - Office",
      category: "Pets Spa",
      subCategory: "Full Body Bath",
      status: "Payment Pending",
      rating: "",
      createdOn: "15/04/2026",
    },
    {
      id: "1264",
      schedule: "31/12/2025 10:00 To 11:00",
      amountPaid: 1500.0,
      paymentStatus: "Success",
      paymentMode: "Card",
      createdBy: "Godrej Living",
      flat: "FM - Office",
      category: "Pets Spa",
      subCategory: "Clam Massage",
      status: "Closed",
      rating: "",
      createdOn: "30/12/2025",
    },
    {
      id: "1263",
      schedule: "05/12/2025 10:00 To 11:00",
      amountPaid: 0,
      paymentStatus: "Payment Pending",
      paymentMode: "",
      createdBy: "Godrej Living",
      flat: "FM - Office",
      category: "Pets Spa",
      subCategory: "Full Body Bath",
      status: "Payment Pending",
      rating: "",
      createdOn: "04/12/2025",
    },
    {
      id: "1262",
      schedule: "24/11/2025 15:00 To 16:00",
      amountPaid: 0,
      paymentStatus: "Payment Pending",
      paymentMode: "",
      createdBy: "Deepak Gupta",
      flat: "FM - Office",
      category: "Pets Spa",
      subCategory: "Full Body Bath",
      status: "Payment Pending",
      rating: "",
      createdOn: "24/11/2025",
    },
    {
      id: "1260",
      schedule: "17/10/2025 10:00 To 12:00",
      amountPaid: 0,
      paymentStatus: "Payment Pending",
      paymentMode: "",
      createdBy: "Godrej Living",
      flat: "FM - Office",
      category: "Pest Control",
      subCategory: "Residential Apart...",
      status: "Payment Pending",
      rating: "",
      createdOn: "16/10/2025",
    },
    {
      id: "1259",
      schedule: "01/10/2025 10:00 To 13:00",
      amountPaid: 0,
      paymentStatus: "Payment Pending",
      paymentMode: "",
      createdBy: "Godrej Living",
      flat: "FM - Office",
      category: "Invisible Grill",
      subCategory: "Residential Apart...",
      status: "Payment Pending",
      rating: "",
      createdOn: "30/09/2025",
    },
    {
      id: "1258",
      schedule: "30/09/2025 16:00 To 19:00",
      amountPaid: 0,
      paymentStatus: "Payment Pending",
      paymentMode: "",
      createdBy: "Godrej Living",
      flat: "FM - Office",
      category: "Invisible Grill S...",
      subCategory: "Residential Apart...",
      status: "Payment Pending",
      rating: "",
      createdOn: "30/09/2025",
    },
    {
      id: "1257",
      schedule: "30/09/2025 16:00 To 19:00",
      amountPaid: 0,
      paymentStatus: "Payment Pending",
      paymentMode: "",
      createdBy: "Godrej Living",
      flat: "FM - Office",
      category: "Invisible Grill S...",
      subCategory: "Residential Apart...",
      status: "Payment Pending",
      rating: "",
      createdOn: "30/09/2025",
    },
    {
      id: "1256",
      schedule: "30/09/2025 16:00 To 19:00",
      amountPaid: 0,
      paymentStatus: "Payment Pending",
      paymentMode: "",
      createdBy: "Godrej Living",
      flat: "FM - Office",
      category: "Invisible Grill S...",
      subCategory: "Residential Apart...",
      status: "Payment Pending",
      rating: "",
      createdOn: "30/09/2025",
    },
  ];

  const filteredData = osrData.filter((entry) =>
    Object.values(entry).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
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

  const handleViewDetails = (id: string) => navigate(`/vas/osr/details/${id}`);

  const handleColumnToggle = (columnKey: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === columnKey ? { ...col, visible } : col))
    );
  };

  const handleMoreActions = () => toast.info("More actions menu");

  const getPaymentStatusBadge = (status: string) => {
    if (status === "Success") {
      return "bg-green-100 text-green-800";
    }
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Work Pending":
        return "bg-orange-100 text-orange-800";
      case "Closed":
        return "bg-gray-100 text-gray-700";
      case "Payment Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isColumnVisible = (key: string) =>
    columns.find((c) => c.key === key)?.visible ?? true;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header with Action Buttons */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="flex items-center gap-2 border-0 h-auto px-3 py-2 bg-[#C72030] text-white hover:bg-[#C72030]/90"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>

              <Button
                onClick={() => toast.info("Generate Receipt")}
                size="sm"
                className="flex items-center gap-2 border-0 h-auto px-3 py-2 bg-[#C72030] text-white hover:bg-[#C72030]/90"
              >
                <FileText className="w-4 h-4" />
                Generate Receipt
              </Button>
            </div>

            {/* Right: Search + Icon Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-56 border-gray-300"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                title="Filter"
                aria-label="Filter"
                className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10 rounded-lg"
                onClick={() => setShowFilterModal(true)}
              >
                <Filter className="w-4 h-4" />
              </Button>
              <ColumnVisibilityDropdown
                columns={columns}
                onColumnToggle={handleColumnToggle}
              />
              <Button
                variant="outline"
                size="sm"
                title="Export"
                aria-label="Export"
                className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10 rounded-lg"
                onClick={handleMoreActions}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {isColumnVisible("actions") && (
                  <TableHead className="text-left font-semibold">Actions</TableHead>
                )}
                {isColumnVisible("id") && (
                  <TableHead className="text-left font-semibold">ID</TableHead>
                )}
                {isColumnVisible("schedule") && (
                  <TableHead className="text-left font-semibold">Schedule</TableHead>
                )}
                {isColumnVisible("amountPaid") && (
                  <TableHead className="text-left font-semibold">Amount Paid</TableHead>
                )}
                {isColumnVisible("paymentStatus") && (
                  <TableHead className="text-left font-semibold">Payment Status</TableHead>
                )}
                {isColumnVisible("paymentMode") && (
                  <TableHead className="text-left font-semibold">Payment Mode</TableHead>
                )}
                {isColumnVisible("createdBy") && (
                  <TableHead className="text-left font-semibold">Created By</TableHead>
                )}
                {isColumnVisible("flat") && (
                  <TableHead className="text-left font-semibold">Flat</TableHead>
                )}
                {isColumnVisible("category") && (
                  <TableHead className="text-left font-semibold">Category</TableHead>
                )}
                {isColumnVisible("subCategory") && (
                  <TableHead className="text-left font-semibold">Sub Category</TableHead>
                )}
                {isColumnVisible("status") && (
                  <TableHead className="text-left font-semibold">Status</TableHead>
                )}
                {isColumnVisible("rating") && (
                  <TableHead className="text-left font-semibold">Rating</TableHead>
                )}
                {isColumnVisible("createdOn") && (
                  <TableHead className="text-left font-semibold">Created On</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.filter((c) => c.visible).length}
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center gap-2 text-black">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading bookings...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.filter((c) => c.visible).length}
                    className="text-center py-8 text-gray-500"
                  >
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-gray-50">
                  {isColumnVisible("actions") && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(entry.id)}
                        className="p-1"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  )}
                  {isColumnVisible("id") && (
                    <TableCell className="font-medium text-blue-600">
                      <button
                        onClick={() => handleViewDetails(entry.id)}
                        className="text-blue-600 hover:underline"
                      >
                        {entry.id}
                      </button>
                    </TableCell>
                  )}
                  {isColumnVisible("schedule") && (
                    <TableCell>{entry.schedule}</TableCell>
                  )}
                  {isColumnVisible("amountPaid") && (
                    <TableCell>{entry.amountPaid}</TableCell>
                  )}
                  {isColumnVisible("paymentStatus") && (
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(entry.paymentStatus)}`}
                      >
                        {entry.paymentStatus}
                      </span>
                    </TableCell>
                  )}
                  {isColumnVisible("paymentMode") && (
                    <TableCell>{entry.paymentMode}</TableCell>
                  )}
                  {isColumnVisible("createdBy") && (
                    <TableCell>{entry.createdBy}</TableCell>
                  )}
                  {isColumnVisible("flat") && (
                    <TableCell>{entry.flat}</TableCell>
                  )}
                  {isColumnVisible("category") && (
                    <TableCell>{entry.category}</TableCell>
                  )}
                  {isColumnVisible("subCategory") && (
                    <TableCell>{entry.subCategory}</TableCell>
                  )}
                  {isColumnVisible("status") && (
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(entry.status)}`}
                      >
                        {entry.status}
                      </span>
                    </TableCell>
                  )}
                  {isColumnVisible("rating") && (
                    <TableCell>{entry.rating}</TableCell>
                  )}
                  {isColumnVisible("createdOn") && (
                    <TableCell>{entry.createdOn}</TableCell>
                  )}
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-center">
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
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <CreateScheduleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={() => {
          toast.success("Schedule created successfully!");
        }}
      />
      <OSRDashboardFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={() => {
          toast.success("Filters applied!");
        }}
        onReset={() => toast.success("Filters reset")}
      />
    </div>
  );
};

export default OSRManageBookings;
