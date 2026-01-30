import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { EditRequestModal } from "@/components/EditRequestModal";
import { toast } from "sonner";

interface AppointmentRequest {
  id: number;
  token: string;
  tower: string;
  flat: string;
  scheduledBy: string;
  scheduledOn: string;
  selectedSlot: string;
  createdAt: string;
  rmAssigned: string;
  status: string;
}

const AppointmentzSiteScheduling = () => {
  const [data, setData] = useState<AppointmentRequest[]>([
    {
      id: 1,
      token: "2185",
      tower: "FM",
      flat: "101",
      scheduledBy: "Deepak Gupta",
      scheduledOn: "23/03/2023",
      selectedSlot: "10:00 AM To 12:00 PM",
      createdAt: "20/03/2023 4:16 PM",
      rmAssigned: "Lockated RM",
      status: "Scheduled",
    },
  ]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<AppointmentRequest | null>(null);

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "token", label: "Token", sortable: true },
    { key: "tower", label: "Tower", sortable: true },
    { key: "flat", label: "Flat", sortable: true },
    { key: "scheduledBy", label: "Scheduled By", sortable: true },
    { key: "scheduledOn", label: "Scheduled On", sortable: true },
    { key: "selectedSlot", label: "Selected Slot", sortable: true },
    { key: "createdAt", label: "Created At", sortable: true },
    { key: "rmAssigned", label: "RM Assigned", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "meetings", label: "Meetings", sortable: false },
  ];

  const handleEditClick = (item: AppointmentRequest) => {
    setSelectedRequest(item);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (updatedData: {
    status: string;
    reason: string;
    token?: string;
  }) => {
    // Update local data for demo purposes
    setData((prev) =>
      prev.map((item) =>
        item.token === updatedData.token
          ? { ...item, status: updatedData.status }
          : item
      )
    );
    toast.success(`Request ${updatedData.token} updated successfully`);
  };

  const renderCell = (item: AppointmentRequest, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEditClick(item)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        );
      case "status":
        return (
          <Badge className="bg-[#f6f4ee] text-[#1a1a1a] border border-[#D5DbDB] hover:bg-[#DBC2A9]">
            {item.status}
          </Badge>
        );
      case "meetings":
        return (
          <Button
            className="bg-[#00BCD4] text-white hover:bg-[#00ACC1] h-8 px-3 text-xs"
            onClick={() => {}}
          >
            Start Meeting
          </Button>
        );
      default:
        return (
          (item[columnKey as keyof AppointmentRequest] as React.ReactNode) ??
          "-"
        );
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">
        <EnhancedTable
          data={data}
          columns={columns}
          renderCell={renderCell}
          pagination={true}
          enableExport={true}
          exportFileName="site-visit-requests"
          storageKey="appointmentz-site-scheduling-table"
          enableGlobalSearch={true}
          searchPlaceholder="Search..."
          loading={false}
        />
      </div>

      <EditRequestModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        token={selectedRequest?.token}
      />
    </div>
  );
};

export default AppointmentzSiteScheduling;
