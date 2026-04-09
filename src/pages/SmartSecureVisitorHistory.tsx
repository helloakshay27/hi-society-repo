import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisitorHistoryRecord {
  id: number;
  visitor_image: string | null;
  guest_name: string;
  guest_number: string;
  building: string;
  tower: string;
  flat: string;
  visited_to: string;
  vehicle_number: string;
  visitor_type: "Support Staff" | "Guest" | "Delivery" | "Contractor";
  visit_purpose: string;
  other_purpose: string;
  service_provider: string;
  master_status: "Checked In" | "Checked Out" | "Expected" | "Rejected";
  host_status: "Approved" | "Pending" | "Rejected";
  mode_of_approval: string;
  created_date: string;
  created_time: string;
  in_date: string;
  in_time: string;
  in_gate: string;
  marked_in_by: string;
  out_date: string;
  out_time: string;
  out_gate: string;
  marked_out_by: string;
  checkin_date: string;
  checkin_time: string;
  checkout_date: string;
  checkout_time: string;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const ALL_DATA: VisitorHistoryRecord[] = [
  {
    id: 1,
    visitor_image: null,
    guest_name: "Trst6",
    guest_number: "9876543210",
    building: "Block A",
    tower: "Tower 1",
    flat: "A/101",
    visited_to: "Manoj Prajapati",
    vehicle_number: "MH12AB1234",
    visitor_type: "Support Staff",
    visit_purpose: "Delivery Person",
    other_purpose: "--",
    service_provider: "Swiggy",
    master_status: "Checked Out",
    host_status: "Approved",
    mode_of_approval: "OTP",
    created_date: "09 Apr 2026",
    created_time: "10:00 AM",
    in_date: "09 Apr 2026",
    in_time: "10:15 AM",
    in_gate: "Gate 1",
    marked_in_by: "Guard Ramesh",
    out_date: "09 Apr 2026",
    out_time: "11:00 AM",
    out_gate: "Gate 1",
    marked_out_by: "Guard Ramesh",
    checkin_date: "09 Apr 2026",
    checkin_time: "10:15 AM",
    checkout_date: "09 Apr 2026",
    checkout_time: "11:00 AM",
  },
  {
    id: 2,
    visitor_image: null,
    guest_name: "Anil Kumar",
    guest_number: "9876543211",
    building: "Block A",
    tower: "Tower 1",
    flat: "A/102",
    visited_to: "Manoj Prajapati",
    vehicle_number: "--",
    visitor_type: "Support Staff",
    visit_purpose: "Vegetable Parcel",
    other_purpose: "--",
    service_provider: "Zomato",
    master_status: "Checked In",
    host_status: "Approved",
    mode_of_approval: "OTP",
    created_date: "09 Apr 2026",
    created_time: "08:00 AM",
    in_date: "09 Apr 2026",
    in_time: "08:10 AM",
    in_gate: "Gate 2",
    marked_in_by: "Guard Suresh",
    out_date: "--",
    out_time: "--",
    out_gate: "--",
    marked_out_by: "--",
    checkin_date: "09 Apr 2026",
    checkin_time: "08:10 AM",
    checkout_date: "--",
    checkout_time: "--",
  },
  {
    id: 3,
    visitor_image: null,
    guest_name: "Deepak Gupta",
    guest_number: "9876543212",
    building: "Block B",
    tower: "Tower 2",
    flat: "B/201",
    visited_to: "Deepak Gupta",
    vehicle_number: "MH14CD5678",
    visitor_type: "Guest",
    visit_purpose: "Guest",
    other_purpose: "--",
    service_provider: "--",
    master_status: "Checked Out",
    host_status: "Approved",
    mode_of_approval: "Host App",
    created_date: "09 Apr 2026",
    created_time: "11:30 AM",
    in_date: "09 Apr 2026",
    in_time: "11:45 AM",
    in_gate: "Gate 1",
    marked_in_by: "Guard Mohan",
    out_date: "09 Apr 2026",
    out_time: "01:00 PM",
    out_gate: "Gate 1",
    marked_out_by: "Guard Mohan",
    checkin_date: "09 Apr 2026",
    checkin_time: "11:45 AM",
    checkout_date: "09 Apr 2026",
    checkout_time: "01:00 PM",
  },
  {
    id: 4,
    visitor_image: null,
    guest_name: "Priya Patel",
    guest_number: "9876543213",
    building: "Block A",
    tower: "Tower 1",
    flat: "A/301",
    visited_to: "Raj Patel",
    vehicle_number: "--",
    visitor_type: "Guest",
    visit_purpose: "Personal Visit",
    other_purpose: "--",
    service_provider: "--",
    master_status: "Checked Out",
    host_status: "Approved",
    mode_of_approval: "OTP",
    created_date: "09 Apr 2026",
    created_time: "01:00 PM",
    in_date: "09 Apr 2026",
    in_time: "01:15 PM",
    in_gate: "Gate 2",
    marked_in_by: "Guard Ramesh",
    out_date: "09 Apr 2026",
    out_time: "03:00 PM",
    out_gate: "Gate 2",
    marked_out_by: "Guard Ramesh",
    checkin_date: "09 Apr 2026",
    checkin_time: "01:15 PM",
    checkout_date: "09 Apr 2026",
    checkout_time: "03:00 PM",
  },
  {
    id: 5,
    visitor_image: null,
    guest_name: "Rahul Verma",
    guest_number: "9876543214",
    building: "Block C",
    tower: "Tower 3",
    flat: "C/401",
    visited_to: "Sanjay Verma",
    vehicle_number: "MH01EF9012",
    visitor_type: "Contractor",
    visit_purpose: "Maintenance",
    other_purpose: "Plumbing Work",
    service_provider: "FixIt Co.",
    master_status: "Checked Out",
    host_status: "Approved",
    mode_of_approval: "Admin",
    created_date: "08 Apr 2026",
    created_time: "09:00 AM",
    in_date: "08 Apr 2026",
    in_time: "09:30 AM",
    in_gate: "Gate 1",
    marked_in_by: "Guard Suresh",
    out_date: "08 Apr 2026",
    out_time: "12:00 PM",
    out_gate: "Gate 1",
    marked_out_by: "Guard Suresh",
    checkin_date: "08 Apr 2026",
    checkin_time: "09:30 AM",
    checkout_date: "08 Apr 2026",
    checkout_time: "12:00 PM",
  },
  {
    id: 6,
    visitor_image: null,
    guest_name: "Sunita Sharma",
    guest_number: "9876543215",
    building: "Block B",
    tower: "Tower 2",
    flat: "B/105",
    visited_to: "Anita Sharma",
    vehicle_number: "--",
    visitor_type: "Guest",
    visit_purpose: "Guest",
    other_purpose: "--",
    service_provider: "--",
    master_status: "Expected",
    host_status: "Pending",
    mode_of_approval: "OTP",
    created_date: "09 Apr 2026",
    created_time: "02:00 PM",
    in_date: "--",
    in_time: "--",
    in_gate: "--",
    marked_in_by: "--",
    out_date: "--",
    out_time: "--",
    out_gate: "--",
    marked_out_by: "--",
    checkin_date: "--",
    checkin_time: "--",
    checkout_date: "--",
    checkout_time: "--",
  },
  {
    id: 7,
    visitor_image: null,
    guest_name: "Mohan Das",
    guest_number: "9876543216",
    building: "Block A",
    tower: "Tower 1",
    flat: "A/204",
    visited_to: "Ravi Das",
    vehicle_number: "MH02GH3456",
    visitor_type: "Delivery",
    visit_purpose: "Courier",
    other_purpose: "--",
    service_provider: "Blue Dart",
    master_status: "Checked Out",
    host_status: "Approved",
    mode_of_approval: "OTP",
    created_date: "08 Apr 2026",
    created_time: "03:00 PM",
    in_date: "08 Apr 2026",
    in_time: "03:15 PM",
    in_gate: "Gate 1",
    marked_in_by: "Guard Mohan",
    out_date: "08 Apr 2026",
    out_time: "03:45 PM",
    out_gate: "Gate 1",
    marked_out_by: "Guard Mohan",
    checkin_date: "08 Apr 2026",
    checkin_time: "03:15 PM",
    checkout_date: "08 Apr 2026",
    checkout_time: "03:45 PM",
  },
  {
    id: 8,
    visitor_image: null,
    guest_name: "Kavita Nair",
    guest_number: "9876543217",
    building: "Block C",
    tower: "Tower 3",
    flat: "C/105",
    visited_to: "Meena Nair",
    vehicle_number: "--",
    visitor_type: "Guest",
    visit_purpose: "Personal Visit",
    other_purpose: "--",
    service_provider: "--",
    master_status: "Checked Out",
    host_status: "Rejected",
    mode_of_approval: "Admin",
    created_date: "07 Apr 2026",
    created_time: "06:30 AM",
    in_date: "07 Apr 2026",
    in_time: "06:45 AM",
    in_gate: "Gate 2",
    marked_in_by: "Guard Ramesh",
    out_date: "07 Apr 2026",
    out_time: "08:00 AM",
    out_gate: "Gate 2",
    marked_out_by: "Guard Ramesh",
    checkin_date: "07 Apr 2026",
    checkin_time: "06:45 AM",
    checkout_date: "07 Apr 2026",
    checkout_time: "08:00 AM",
  },
  {
    id: 9,
    visitor_image: null,
    guest_name: "Arjun Singh",
    guest_number: "9876543218",
    building: "Block B",
    tower: "Tower 2",
    flat: "B/302",
    visited_to: "Harjit Singh",
    vehicle_number: "MH04IJ7890",
    visitor_type: "Contractor",
    visit_purpose: "Maintenance",
    other_purpose: "AC Repair",
    service_provider: "CoolAir Pvt.",
    master_status: "Checked Out",
    host_status: "Approved",
    mode_of_approval: "OTP",
    created_date: "07 Apr 2026",
    created_time: "09:45 AM",
    in_date: "07 Apr 2026",
    in_time: "10:00 AM",
    in_gate: "Gate 1",
    marked_in_by: "Guard Suresh",
    out_date: "07 Apr 2026",
    out_time: "01:00 PM",
    out_gate: "Gate 1",
    marked_out_by: "Guard Suresh",
    checkin_date: "07 Apr 2026",
    checkin_time: "10:00 AM",
    checkout_date: "07 Apr 2026",
    checkout_time: "01:00 PM",
  },
  {
    id: 10,
    visitor_image: null,
    guest_name: "Meena Kumari",
    guest_number: "9876543219",
    building: "Block A",
    tower: "Tower 1",
    flat: "A/205",
    visited_to: "Ramesh Gupta",
    vehicle_number: "--",
    visitor_type: "Guest",
    visit_purpose: "Guest",
    other_purpose: "--",
    service_provider: "--",
    master_status: "Checked Out",
    host_status: "Approved",
    mode_of_approval: "Host App",
    created_date: "07 Apr 2026",
    created_time: "10:30 AM",
    in_date: "07 Apr 2026",
    in_time: "10:45 AM",
    in_gate: "Gate 2",
    marked_in_by: "Guard Mohan",
    out_date: "07 Apr 2026",
    out_time: "12:30 PM",
    out_gate: "Gate 2",
    marked_out_by: "Guard Mohan",
    checkin_date: "07 Apr 2026",
    checkin_time: "10:45 AM",
    checkout_date: "07 Apr 2026",
    checkout_time: "12:30 PM",
  },
  {
    id: 11,
    visitor_image: null,
    guest_name: "Vikram Rao",
    guest_number: "9876543220",
    building: "Block C",
    tower: "Tower 3",
    flat: "C/501",
    visited_to: "Suresh Rao",
    vehicle_number: "MH06KL1234",
    visitor_type: "Support Staff",
    visit_purpose: "Maintenance",
    other_purpose: "Electrician",
    service_provider: "PowerFix",
    master_status: "Checked Out",
    host_status: "Approved",
    mode_of_approval: "OTP",
    created_date: "06 Apr 2026",
    created_time: "11:00 AM",
    in_date: "06 Apr 2026",
    in_time: "11:15 AM",
    in_gate: "Gate 1",
    marked_in_by: "Guard Ramesh",
    out_date: "06 Apr 2026",
    out_time: "02:00 PM",
    out_gate: "Gate 1",
    marked_out_by: "Guard Ramesh",
    checkin_date: "06 Apr 2026",
    checkin_time: "11:15 AM",
    checkout_date: "06 Apr 2026",
    checkout_time: "02:00 PM",
  },
  {
    id: 12,
    visitor_image: null,
    guest_name: "Geeta Mishra",
    guest_number: "9876543221",
    building: "Block B",
    tower: "Tower 2",
    flat: "B/401",
    visited_to: "Ashok Mishra",
    vehicle_number: "--",
    visitor_type: "Guest",
    visit_purpose: "Personal Visit",
    other_purpose: "--",
    service_provider: "--",
    master_status: "Checked Out",
    host_status: "Approved",
    mode_of_approval: "Host App",
    created_date: "06 Apr 2026",
    created_time: "04:00 PM",
    in_date: "06 Apr 2026",
    in_time: "04:15 PM",
    in_gate: "Gate 2",
    marked_in_by: "Guard Suresh",
    out_date: "06 Apr 2026",
    out_time: "06:00 PM",
    out_gate: "Gate 2",
    marked_out_by: "Guard Suresh",
    checkin_date: "06 Apr 2026",
    checkin_time: "04:15 PM",
    checkout_date: "06 Apr 2026",
    checkout_time: "06:00 PM",
  },
];

const BUILDINGS = ["All", "Block A", "Block B", "Block C"];
const TOWERS: Record<string, string[]> = {
  All: ["All", "Tower 1", "Tower 2", "Tower 3"],
  "Block A": ["All", "Tower 1"],
  "Block B": ["All", "Tower 2"],
  "Block C": ["All", "Tower 3"],
};
const FLATS: Record<string, string[]> = {
  "Tower 1": ["All", "A/101", "A/102", "A/204", "A/205", "A/301"],
  "Tower 2": ["All", "B/105", "B/201", "B/302", "B/401"],
  "Tower 3": ["All", "C/105", "C/401", "C/501"],
  All: ["All"],
};

const PER_PAGE = 5;

// ─── Column Config ────────────────────────────────────────────────────────────

const historyColumns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false, hideable: false, draggable: false },
  { key: "id", label: "Id", sortable: true, hideable: true, draggable: true },
  { key: "guest_name", label: "Name", sortable: true, hideable: true, draggable: true },
  { key: "guest_number", label: "Mobile Number", sortable: true, hideable: true, draggable: true },
  { key: "building", label: "Building", sortable: true, hideable: true, draggable: true },
  { key: "tower", label: "Tower", sortable: true, hideable: true, draggable: true },
  { key: "flat", label: "Flat", sortable: true, hideable: true, draggable: true },
  { key: "visited_to", label: "Visited To", sortable: true, hideable: true, draggable: true },
  { key: "vehicle_number", label: "Vehicle Number", sortable: true, hideable: true, draggable: true },
  { key: "visitor_type", label: "Visitor Type", sortable: true, hideable: true, draggable: true },
  { key: "visit_purpose", label: "Purpose", sortable: true, hideable: true, draggable: true },
  { key: "other_purpose", label: "Other Purpose", sortable: true, hideable: true, draggable: true },
  { key: "service_provider", label: "Service Provider", sortable: true, hideable: true, draggable: true },
  { key: "master_status", label: "Master Status", sortable: true, hideable: true, draggable: true },
  { key: "host_status", label: "Host Status", sortable: true, hideable: true, draggable: true },
  { key: "mode_of_approval", label: "Mode of Approval", sortable: true, hideable: true, draggable: true },
  { key: "created_date", label: "Created Date", sortable: true, hideable: true, draggable: true },
  { key: "created_time", label: "Created Time", sortable: true, hideable: true, draggable: true },
  { key: "in_date", label: "In Date", sortable: true, hideable: true, draggable: true },
  { key: "in_time", label: "In Time", sortable: true, hideable: true, draggable: true },
  { key: "in_gate", label: "In Gate", sortable: true, hideable: true, draggable: true },
  { key: "marked_in_by", label: "Marked In By", sortable: true, hideable: true, draggable: true },
  { key: "out_date", label: "Out Date", sortable: true, hideable: true, draggable: true },
  { key: "out_time", label: "Out Time", sortable: true, hideable: true, draggable: true },
  { key: "out_gate", label: "Out Gate", sortable: true, hideable: true, draggable: true },
  { key: "marked_out_by", label: "Marked Out By", sortable: true, hideable: true, draggable: true },
  { key: "checkin_date", label: "Checkin Date", sortable: true, hideable: true, draggable: true },
  { key: "checkin_time", label: "Checkin Time", sortable: true, hideable: true, draggable: true },
  { key: "checkout_date", label: "Checkout Date", sortable: true, hideable: true, draggable: true },
  { key: "checkout_time", label: "Checkout Time", sortable: true, hideable: true, draggable: true },
];

// ─── Filter Dialog ────────────────────────────────────────────────────────────

interface FilterState {
  building: string;
  tower: string;
  flat: string;
  from_date: string;
  to_date: string;
}

interface FilterDialogProps {
  open: boolean;
  filters: FilterState;
  onClose: () => void;
  onApply: (f: FilterState) => void;
  onReset: () => void;
}

const defaultFilters: FilterState = {
  building: "All",
  tower: "All",
  flat: "All",
  from_date: "",
  to_date: "",
};

const FilterDialog: React.FC<FilterDialogProps> = ({
  open, filters, onClose, onApply, onReset,
}) => {
  const [local, setLocal] = useState<FilterState>(filters);

  const towerOptions = TOWERS[local.building] ?? TOWERS["All"];
  const flatOptions = FLATS[local.tower] ?? FLATS["All"];

  const set = (key: keyof FilterState, val: string) =>
    setLocal((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "building") { next.tower = "All"; next.flat = "All"; }
      if (key === "tower") { next.flat = "All"; }
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Visitor History</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Building */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Building</label>
            <Select value={local.building} onValueChange={(v) => set("building", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUILDINGS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Tower */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tower</label>
            <Select value={local.tower} onValueChange={(v) => set("tower", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {towerOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Flat */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Flat</label>
            <Select value={local.flat} onValueChange={(v) => set("flat", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {flatOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-gray-700">From Date</label>
              <input
                type="date"
                title="From Date"
                placeholder="From Date"
                value={local.from_date}
                onChange={(e) => set("from_date", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-gray-700">To Date</label>
              <input
                type="date"
                title="To Date"
                placeholder="To Date"
                value={local.to_date}
                onChange={(e) => set("to_date", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setLocal(defaultFilters); onReset(); }}>
            Reset
          </Button>
          <Button className="bg-[#C72030] text-white hover:bg-[#C72030]/90" onClick={() => onApply(local)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const SmartSecureVisitorHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(defaultFilters);

  // Apply filters
  const filteredData = ALL_DATA.filter((r) => {
    if (activeFilters.building !== "All" && r.building !== activeFilters.building) return false;
    if (activeFilters.tower !== "All" && r.tower !== activeFilters.tower) return false;
    if (activeFilters.flat !== "All" && r.flat !== activeFilters.flat) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / PER_PAGE);
  const pagedData = filteredData.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleApplyFilter = (f: FilterState) => {
    setActiveFilters(f);
    setFilters(f);
    setCurrentPage(1);
    setFilterOpen(false);
    toast.success("Filters applied");
  };

  const handleResetFilter = () => {
    setActiveFilters(defaultFilters);
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback((row: VisitorHistoryRecord, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <button
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="View"
              onClick={() => toast.info(`Viewing visitor: ${row.guest_name}`)}
            >
              <svg className="w-4 h-4 text-gray-600 hover:text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Flag"
              onClick={() => toast.info(`Flagged: ${row.guest_name}`)}
            >
              <svg className="w-4 h-4 text-gray-600 hover:text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </button>
          </div>
        );
      case "guest_name":
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-gray-900">{row.guest_name || "--"}</span>
          </div>
        );
      case "visitor_type":
        return (
          <span className={`px-2 py-1 text-xs rounded font-medium ${
            row.visitor_type === "Support Staff" ? "bg-purple-100 text-purple-700" :
            row.visitor_type === "Guest" ? "bg-blue-100 text-blue-700" :
            row.visitor_type === "Delivery" ? "bg-yellow-100 text-yellow-700" :
            "bg-orange-100 text-orange-700"
          }`}>
            {row.visitor_type}
          </span>
        );
      case "master_status":
        return (
          <Badge className={
            row.master_status === "Checked In" ? "bg-green-100 text-green-800 hover:bg-green-100" :
            row.master_status === "Checked Out" ? "bg-gray-100 text-gray-800 hover:bg-gray-100" :
            row.master_status === "Expected" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
            "bg-red-100 text-red-800 hover:bg-red-100"
          }>
            {row.master_status}
          </Badge>
        );
      case "host_status":
        return (
          <Badge className={
            row.host_status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-100" :
            row.host_status === "Pending" ? "bg-orange-100 text-orange-800 hover:bg-orange-100" :
            "bg-red-100 text-red-800 hover:bg-red-100"
          }>
            {row.host_status}
          </Badge>
        );
      case "visit_purpose":
        return (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
            {row.visit_purpose || "--"}
          </span>
        );
      default: {
        const val = (row as unknown as Record<string, unknown>)[columnKey];
        return val ? String(val) : "--";
      }
    }
  }, []);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages <= 7 || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink className="cursor-pointer" onClick={() => setCurrentPage(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if ((i === 2 && currentPage > 4) || (i === totalPages - 1 && currentPage < totalPages - 3)) {
        items.push(<PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>);
      }
    }
    return items;
  };

  // ── Active filter count ────────────────────────────────────────────────────
  const activeFilterCount = [
    activeFilters.building !== "All",
    activeFilters.tower !== "All",
    activeFilters.flat !== "All",
    activeFilters.from_date !== "",
    activeFilters.to_date !== "",
  ].filter(Boolean).length;

  return (
    <div className="p-6">
      <EnhancedTable
        data={pagedData}
        columns={historyColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="visitor-history-list-table"
        emptyMessage="No visitor history available"
        searchPlaceholder="Search visitors..."
        hideTableExport={false}
        hideColumnsButton={false}
        leftActions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-9 px-4 text-sm font-medium border-gray-300 relative"
              onClick={() => setFilterOpen(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-[#C72030] text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        }
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PER_PAGE + 1}–
            {Math.min(currentPage * PER_PAGE, filteredData.length)} of{" "}
            {filteredData.length} records
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

      {/* Filter Dialog */}
      <FilterDialog
        open={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />
    </div>
  );
};

export default SmartSecureVisitorHistory;
