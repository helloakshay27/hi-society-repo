import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Plus, KeyRound } from "lucide-react";
import { toast } from "sonner";

// ─── Dummy Data ────────────────────────────────────────────────────────────────

interface VisitorRecord {
  id: number;
  visitor_image: string | null;
  guest_name: string;
  visitor_type: "Support Staff" | "Guest";
  status: "Approved" | "Pending" | "Rejected";
  primary_host: string;
  visit_purpose: string;
  guest_number?: string;
}

const dummyExpectedVisitors: VisitorRecord[] = [
  {
    id: 1,
    visitor_image: null,
    guest_name: "Trst6",
    visitor_type: "Support Staff",
    status: "Approved",
    primary_host: "FM/Office- Manoj Prajapati",
    visit_purpose: "Delivery Person",
    guest_number: "9876543210",
  },
  {
    id: 2,
    visitor_image: null,
    guest_name: "Deepak Kumar",
    visitor_type: "Guest",
    status: "Approved",
    primary_host: "FM/Office- Deepak Gupta",
    visit_purpose: "Guest",
    guest_number: "9876543211",
  },
  {
    id: 3,
    visitor_image: null,
    guest_name: "Rahul Sharma",
    visitor_type: "Support Staff",
    status: "Pending",
    primary_host: "FM/Office- Anita Singh",
    visit_purpose: "Maintenance",
    guest_number: "9876543212",
  },
  {
    id: 4,
    visitor_image: null,
    guest_name: "Priya Patel",
    visitor_type: "Guest",
    status: "Approved",
    primary_host: "Tower A - Flat 301",
    visit_purpose: "Personal Visit",
    guest_number: "9876543213",
  },
  {
    id: 5,
    visitor_image: null,
    guest_name: "Amit Verma",
    visitor_type: "Support Staff",
    status: "Approved",
    primary_host: "FM/Office- Ravi Kumar",
    visit_purpose: "Plumber",
    guest_number: "9876543214",
  },
];

const dummyUnexpectedVisitors: VisitorRecord[] = [
  {
    id: 101,
    visitor_image: null,
    guest_name: "Suresh Yadav",
    visitor_type: "Guest",
    status: "Pending",
    primary_host: "Tower B - Flat 202",
    visit_purpose: "Unknown",
    guest_number: "9812345670",
  },
  {
    id: 102,
    visitor_image: null,
    guest_name: "Meena Kumari",
    visitor_type: "Guest",
    status: "Pending",
    primary_host: "Tower C - Flat 105",
    visit_purpose: "Courier",
    guest_number: "9812345671",
  },
  {
    id: 103,
    visitor_image: null,
    guest_name: "Rohit Joshi",
    visitor_type: "Support Staff",
    status: "Approved",
    primary_host: "FM/Office- Sanjay Mishra",
    visit_purpose: "Electrician",
    guest_number: "9812345672",
  },
  {
    id: 104,
    visitor_image: null,
    guest_name: "Kavita Nair",
    visitor_type: "Guest",
    status: "Rejected",
    primary_host: "Tower A - Flat 401",
    visit_purpose: "Personal Visit",
    guest_number: "9812345673",
  },
];

// ─── Column Config ─────────────────────────────────────────────────────────────

const visitorInColumns: ColumnConfig[] = [
  { key: "visitor_image", label: "Photo", sortable: false, hideable: true, draggable: true },
  { key: "guest_name", label: "Visitor Name", sortable: true, hideable: true, draggable: true },
  { key: "visitor_type", label: "Type", sortable: true, hideable: true, draggable: true },
  { key: "status", label: "Status", sortable: true, hideable: true, draggable: true },
  { key: "primary_host", label: "Host", sortable: true, hideable: true, draggable: true },
  { key: "visit_purpose", label: "Purpose", sortable: true, hideable: true, draggable: true },
  { key: "check_in_action", label: "Check In", sortable: false, hideable: false, draggable: false },
  { key: "out_action", label: "OUT", sortable: false, hideable: false, draggable: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SmartSecureVisitorIn: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"expected" | "unexpected">("expected");

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback((visitor: VisitorRecord, columnKey: string) => {
    switch (columnKey) {
      case "visitor_image":
        return (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {visitor.visitor_image ? (
                <img
                  src={visitor.visitor_image}
                  alt={visitor.guest_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        );

      case "guest_name":
        return (
          <div className="flex flex-col gap-1">
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

      case "check_in_action":
        return (
          <Button
            size="sm"
            className=" hover:bg-green-600 text-white text-xs px-3 py-1"
            onClick={() => {
              toast.success(`${visitor.guest_name} checked in successfully`);
            }}
          >
            Check In
          </Button>
        );

      case "out_action":
        return (
          <Button
            size="sm"
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50 text-xs px-3 py-1"
            onClick={() => {
              toast.info(`${visitor.guest_name} marked as OUT`);
            }}
          >
            OUT
          </Button>
        );

      default: {
        const val = (visitor as unknown as Record<string, unknown>)[columnKey];
        return val ? String(val) : "--";
      }
    }
  }, []);

  // ── Shared Left Actions ────────────────────────────────────────────────────

  const leftActions = (
    <div className="flex gap-2">
      <Button
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        onClick={() => toast.info("Add visitor dialog coming soon")}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add
      </Button>
      <Button
        variant="outline"
        className="h-9 px-4 text-sm font-medium border-gray-300"
        onClick={() => toast.info("Verify OTP dialog coming soon")}
      >
        <KeyRound className="w-4 h-4 mr-2" />
        Verify OTP
      </Button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "expected" | "unexpected")}
        className="w-full"
      >
        <div className="mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
            <TabsTrigger
              value="expected"
              className="flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
            >
              Expected Visitors
            </TabsTrigger>
            <TabsTrigger
              value="unexpected"
              className="flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
            >
              Unexpected Visitors
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Expected Visitors Tab */}
        <TabsContent value="expected">
          <EnhancedTable
            data={dummyExpectedVisitors}
            columns={visitorInColumns}
            renderCell={renderCell}
            enableSearch={true}
            enableSelection={false}
            storageKey="expected-visitor-in-table"
            emptyMessage="No expected visitors available"
            searchPlaceholder="Search visitors..."
            hideTableExport={false}
            hideColumnsButton={false}
            leftActions={leftActions}
          />
        </TabsContent>

        {/* Unexpected Visitors Tab */}
        <TabsContent value="unexpected">
          <EnhancedTable
            data={dummyUnexpectedVisitors}
            columns={visitorInColumns}
            renderCell={renderCell}
            enableSearch={true}
            enableSelection={false}
            storageKey="unexpected-visitor-in-table"
            emptyMessage="No unexpected visitors available"
            searchPlaceholder="Search visitors..."
            hideTableExport={false}
            hideColumnsButton={false}
            leftActions={leftActions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartSecureVisitorIn;
