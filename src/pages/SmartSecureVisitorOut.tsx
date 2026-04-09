import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Plus } from "lucide-react";
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VisitorOutRecord {
  id: number;
  visitor_image: string | null;
  guest_name: string;
  visitor_type: "Support Staff" | "Guest";
  status: "Approved" | "Pending" | "Rejected";
  is_overdue: boolean;
  primary_host: string;
  visit_purpose: string;
  guest_number?: string;
  checked_in_at: string;
}

// ─── Dummy Data ────────────────────────────────────────────────────────────────

const ALL_DUMMY_DATA: VisitorOutRecord[] = [
  {
    id: 1,
    visitor_image: null,
    guest_name: "Trst6",
    visitor_type: "Support Staff",
    status: "Approved",
    is_overdue: false,
    primary_host: "FM/Office- Manoj Prajapati",
    visit_purpose: "Delivery Person",
    guest_number: "9876543210",
    checked_in_at: "09 Apr 2026, 10:15 AM",
  },
  {
    id: 2,
    visitor_image: null,
    guest_name: "Anil 31",
    visitor_type: "Support Staff",
    status: "Approved",
    is_overdue: true,
    primary_host: "FM/Office- Manoj Prajapati",
    visit_purpose: "Vegetable Parcel",
    guest_number: "9876543211",
    checked_in_at: "09 Apr 2026, 08:00 AM",
  },
  {
    id: 3,
    visitor_image: null,
    guest_name: "Deepak",
    visitor_type: "Guest",
    status: "Approved",
    is_overdue: false,
    primary_host: "FM/Office- Deepak Gupta",
    visit_purpose: "Guest",
    guest_number: "9876543212",
    checked_in_at: "09 Apr 2026, 11:30 AM",
  },
  {
    id: 4,
    visitor_image: null,
    guest_name: "Deepak",
    visitor_type: "Guest",
    status: "Approved",
    is_overdue: false,
    primary_host: "A/104- Deepak Gupta",
    visit_purpose: "Guest",
    guest_number: "9876543213",
    checked_in_at: "09 Apr 2026, 12:00 PM",
  },
  {
    id: 5,
    visitor_image: null,
    guest_name: "Priya Sharma",
    visitor_type: "Guest",
    status: "Approved",
    is_overdue: false,
    primary_host: "Tower A - Flat 301",
    visit_purpose: "Personal Visit",
    guest_number: "9876543214",
    checked_in_at: "09 Apr 2026, 01:00 PM",
  },
  {
    id: 6,
    visitor_image: null,
    guest_name: "Rahul Verma",
    visitor_type: "Support Staff",
    status: "Approved",
    is_overdue: true,
    primary_host: "FM/Office- Ravi Kumar",
    visit_purpose: "Plumber",
    guest_number: "9876543215",
    checked_in_at: "09 Apr 2026, 07:45 AM",
  },
  {
    id: 7,
    visitor_image: null,
    guest_name: "Sunita Patel",
    visitor_type: "Guest",
    status: "Pending",
    is_overdue: false,
    primary_host: "Tower B - Flat 202",
    visit_purpose: "Courier",
    guest_number: "9876543216",
    checked_in_at: "09 Apr 2026, 02:15 PM",
  },
  {
    id: 8,
    visitor_image: null,
    guest_name: "Mohan Das",
    visitor_type: "Support Staff",
    status: "Approved",
    is_overdue: false,
    primary_host: "FM/Office- Sanjay Mishra",
    visit_purpose: "Electrician",
    guest_number: "9876543217",
    checked_in_at: "09 Apr 2026, 03:00 PM",
  },
  {
    id: 9,
    visitor_image: null,
    guest_name: "Kavita Nair",
    visitor_type: "Guest",
    status: "Approved",
    is_overdue: true,
    primary_host: "Tower C - Flat 105",
    visit_purpose: "Personal Visit",
    guest_number: "9876543218",
    checked_in_at: "09 Apr 2026, 06:30 AM",
  },
  {
    id: 10,
    visitor_image: null,
    guest_name: "Arjun Singh",
    visitor_type: "Support Staff",
    status: "Approved",
    is_overdue: false,
    primary_host: "FM/Office- Anita Singh",
    visit_purpose: "Maintenance",
    guest_number: "9876543219",
    checked_in_at: "09 Apr 2026, 09:45 AM",
  },
  {
    id: 11,
    visitor_image: null,
    guest_name: "Meena Kumari",
    visitor_type: "Guest",
    status: "Approved",
    is_overdue: false,
    primary_host: "A/205- Ramesh Gupta",
    visit_purpose: "Guest",
    guest_number: "9876543220",
    checked_in_at: "09 Apr 2026, 10:30 AM",
  },
  {
    id: 12,
    visitor_image: null,
    guest_name: "Vikram Rao",
    visitor_type: "Support Staff",
    status: "Pending",
    is_overdue: false,
    primary_host: "FM/Office- Manoj Prajapati",
    visit_purpose: "AC Repair",
    guest_number: "9876543221",
    checked_in_at: "09 Apr 2026, 11:00 AM",
  },
];

const PER_PAGE = 5;

// ─── Column Config ─────────────────────────────────────────────────────────────

const visitorOutColumns: ColumnConfig[] = [
  { key: "visitor_image", label: "Photo", sortable: false, hideable: true, draggable: true },
  { key: "guest_name", label: "Visitor Name", sortable: true, hideable: true, draggable: true },
  { key: "visitor_type", label: "Type", sortable: true, hideable: true, draggable: true },
  { key: "status", label: "Status", sortable: true, hideable: true, draggable: true },
  { key: "primary_host", label: "Host", sortable: true, hideable: true, draggable: true },
  { key: "visit_purpose", label: "Purpose", sortable: true, hideable: true, draggable: true },
  { key: "checked_in_at", label: "Checked In At", sortable: true, hideable: true, draggable: true },
  { key: "check_in_action", label: "Check In", sortable: false, hideable: false, draggable: false },
  { key: "out_action", label: "OUT", sortable: false, hideable: false, draggable: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SmartSecureVisitorOut: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(ALL_DUMMY_DATA.length / PER_PAGE);
  const pagedData = ALL_DUMMY_DATA.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback((visitor: VisitorOutRecord, columnKey: string) => {
    switch (columnKey) {
      case "visitor_image":
        return (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {visitor.visitor_image ? (
                <img
                  src={visitor.visitor_image}
                  alt={visitor.guest_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
          </div>
        );

      case "guest_name":
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-gray-900">{visitor.guest_name || "--"}</span>
            {visitor.guest_number && (
              <span className="text-xs text-gray-500">{visitor.guest_number}</span>
            )}
          </div>
        );

      case "visitor_type":
        return (
          <span
            className={`px-2 py-1 text-xs rounded font-medium ${
              visitor.visitor_type === "Support Staff"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {visitor.visitor_type}
          </span>
        );

      case "status":
        return (
          <Badge
            className={
              visitor.status === "Approved"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : visitor.status === "Pending"
                ? "bg-orange-100 text-orange-800 hover:bg-orange-100"
                : "bg-red-100 text-red-800 hover:bg-red-100"
            }
          >
            {visitor.status}
          </Badge>
        );

      case "primary_host":
        return <span className="text-sm text-gray-700">{visitor.primary_host || "--"}</span>;

      case "visit_purpose":
        return (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
            {visitor.visit_purpose || "--"}
          </span>
        );

      case "checked_in_at":
        return <span className="text-sm text-gray-600">{visitor.checked_in_at || "--"}</span>;

      case "check_in_action":
        return (
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1"
            onClick={() => toast.success(`${visitor.guest_name} checked in successfully`)}
          >
            Check In
          </Button>
        );

      case "out_action":
        return (
          <div className="flex flex-col items-center gap-1">
            {visitor.is_overdue && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-500 text-white rounded">
                Overdue
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50 text-xs px-3 py-1"
              onClick={() => toast.info(`${visitor.guest_name} marked as OUT`)}
            >
              OUT
            </Button>
          </div>
        );

      default: {
        const val = (visitor as unknown as Record<string, unknown>)[columnKey];
        return val ? String(val) : "--";
      }
    }
  }, []);

  // ── Pagination helpers ─────────────────────────────────────────────────────

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        totalPages <= 7 ||
        i === 1 ||
        i === totalPages ||
        Math.abs(i - currentPage) <= 1
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              className="cursor-pointer"
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (
        (i === 2 && currentPage > 4) ||
        (i === totalPages - 1 && currentPage < totalPages - 3)
      ) {
        items.push(
          <PaginationItem key={`ellipsis-${i}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return items;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <EnhancedTable
        data={pagedData}
        columns={visitorOutColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="visitor-out-table"
        emptyMessage="No visitors to check out"
        searchPlaceholder="Search visitors..."
        hideTableExport={false}
        hideColumnsButton={false}
        leftActions={
          <div className="flex gap-2">
            <Button
              className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
              onClick={() => toast.info("Add visitor dialog coming soon")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        }
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PER_PAGE + 1}–
            {Math.min(currentPage * PER_PAGE, ALL_DUMMY_DATA.length)} of{" "}
            {ALL_DUMMY_DATA.length} records
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default SmartSecureVisitorOut;
