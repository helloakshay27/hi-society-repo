import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Download, Loader2 } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Badge } from "@/components/ui/badge";
import { EditRequestModal } from "@/components/EditRequestModal";
import { toast } from "sonner";
import {
  getSiteScheduleRequests,
  exportSiteRequestsData,
  updateSiteScheduleRequest,
  SiteScheduleRequest,
} from "@/services/appointmentzService";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

const AppointmentzSiteScheduling = () => {
  const [data, setData] = useState<SiteScheduleRequest[]>([]);
  const { shouldShow } = useDynamicPermissions();
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<SiteScheduleRequest | null>(null);

  // Fetch data on component mount and when page changes
  const fetchSiteScheduleRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSiteScheduleRequests(currentPage);
      setData(response.site_schedule_requests);
      setTotalPages(response.pagination.total_pages);
    } catch (error) {
      console.error("Error fetching site schedule requests:", error);
      // Defer toast to avoid setState-in-render warning
      setTimeout(() => {
        toast.error("Failed to fetch site schedule requests");
      }, 0);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchSiteScheduleRequests();
  }, [fetchSiteScheduleRequests]);

  const columns = [
    { key: "srNo", label: "Sr. No.", sortable: false },
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Request ID", sortable: true },
    { key: "tower", label: "Tower", sortable: true },
    { key: "flat", label: "Flat", sortable: true },
    { key: "scheduled_by", label: "Scheduled By", sortable: true },
    { key: "scheduled_on", label: "Scheduled On", sortable: true },
    { key: "selected_slot", label: "Selected Slot", sortable: true },
    { key: "created_at", label: "Created At", sortable: true },
    { key: "rm_assigned", label: "RM Assigned", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "meetings", label: "Meetings", sortable: false },
  ];

  const handleEditClick = (item: SiteScheduleRequest) => {
    setSelectedRequest(item);
    setIsEditModalOpen(true);
  };

  const handleExportCSV = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const blob = await exportSiteRequestsData();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `site_schedule_requests_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setTimeout(() => {
        toast.success("CSV exported successfully");
      }, 0);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setTimeout(() => {
        toast.error("Failed to export CSV");
      }, 0);
    } finally {
      setIsExporting(false);
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
        // Refresh the data after successful update
        await fetchSiteScheduleRequests();
        setTimeout(() => {
          toast.success(
            response.message ||
              `Request ${updatedData.token} updated successfully`
          );
        }, 0);
        setIsEditModalOpen(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Error updating request:", error);
      setTimeout(() => {
        toast.error("Failed to update request");
      }, 0);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const renderCell = (item: SiteScheduleRequest, columnKey: string, index: number) => {
    switch (columnKey) {
      case "srNo":
        return (currentPage - 1) * 10 + index + 1;
      case "actions":
        return (
          shouldShow("Site Visit Requests","update") &&(
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-[#C72030] text-white hover:bg-[#C72030]/90"
            disabled={isEditSubmitting}
            onClick={() => handleEditClick(item)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          )
        );
      case "tower":
        return item.society_flat?.tower?.name || "-";
      case "flat":
        return item.society_flat?.flat_no || "-";
      case "scheduled_by":
        return item.scheduled_by?.name || "-";
      case "rm_assigned":
        return item.rm_assigned?.name || "-";
      case "status":
        return (
          <Badge className="bg-[#f6f4ee] text-[#1a1a1a] border border-[#D5DbDB] hover:bg-[#DBC2A9]">
            {item.status_label || item.status}
          </Badge>
        );
      case "meetings":
        return (
          <a
            href="https://meet.lockated.com/b"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              className="bg-[#00BCD4] text-white hover:bg-[#00ACC1] h-8 px-3 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              View Meetings
            </Button>
          </a>
        );
      default:
        // @ts-expect-error: Accessing key by string
        return item[columnKey] || "-";
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="w-full">
        <EnhancedTable
          data={data}
          columns={columns}
          renderCell={renderCell}
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          enableExport={true}
          hideTableExport={true}
          exportFileName="site-visit-requests"
          rightActions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-2"
              title="Export"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          }
          storageKey="appointmentz-site-scheduling-table"
          enableGlobalSearch={true}
          searchPlaceholder="Search..."
          loading={loading}
        />
      </div>

      <EditRequestModal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isEditSubmitting) {
            setIsEditModalOpen(false);
          }
        }}
        onSubmit={handleEditSubmit}
        token={selectedRequest?.id.toString()}
        isSubmitting={isEditSubmitting}
      />
    </div>
  );
};

export default AppointmentzSiteScheduling;
