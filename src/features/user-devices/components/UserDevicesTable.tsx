import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { getUserDevices, UserDevice } from "../api/userDevicesApi";

const PER_PAGE = 20;

const columns: ColumnConfig[] = [
  { key: "id", label: "ID", sortable: true, hideable: true, draggable: true },
  { key: "user_id", label: "User ID", sortable: true, hideable: true, draggable: true },
  { key: "device_type", label: "Device Type", sortable: true, hideable: true, draggable: true },
  { key: "device_name", label: "Device Name", sortable: true, hideable: true, draggable: true },
  { key: "device_os_version", label: "OS Version", sortable: true, hideable: true, draggable: true },
  { key: "device_id", label: "Device ID", sortable: true, hideable: true, draggable: true },
  { key: "app_id", label: "App ID", sortable: true, hideable: true, draggable: true },
  { key: "app_version", label: "App Version", sortable: true, hideable: true, draggable: true },
  { key: "gcm_key", label: "GCM Key", sortable: false, hideable: true, draggable: true, defaultVisible: false },
  { key: "apns_dev_cert", label: "APNS Dev Cert", sortable: false, hideable: true, draggable: true, defaultVisible: false },
  { key: "created_at", label: "Created At", sortable: true, hideable: true, draggable: true },
  { key: "updated_at", label: "Updated At", sortable: true, hideable: true, draggable: true },
];

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const display = (value: unknown) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

interface UserDevicesTableProps {
  /** When set, only devices for this user are fetched (q[user_id_eq]). */
  userId?: number | string;
  storageKey?: string;
  onTotalCountChange?: (count: number) => void;
}

export const UserDevicesTable: React.FC<UserDevicesTableProps> = ({
  userId,
  storageKey = "user-devices-table",
  onTotalCountChange,
}) => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDevices = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        const response = await getUserDevices(page, PER_PAGE, userId);
        setDevices(response?.user_devices || []);
        if (response?.pagination) {
          setTotalPages(response.pagination.total_pages || 1);
          onTotalCountChange?.(response.pagination.total_count || 0);
        }
      } catch (error) {
        console.error("Error fetching user devices:", error);
        toast.error("Failed to load user devices. Please try again.");
        setDevices([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  // Reset to the first page when the user filter changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [userId]);

  useEffect(() => {
    fetchDevices(currentPage);
  }, [currentPage, fetchDevices]);

  const renderCell = (item: UserDevice, columnKey: string) => {
    switch (columnKey) {
      case "device_type":
        return <span className="capitalize">{display(item.device_type)}</span>;
      case "gcm_key":
        return (
          <span className="block max-w-xs truncate font-mono text-xs" title={item.gcm_key || ""}>
            {display(item.gcm_key)}
          </span>
        );
      case "created_at":
      case "updated_at":
        return formatDateTime(item[columnKey]);
      default:
        return display(item[columnKey as keyof UserDevice]);
    }
  };

  return (
    <EnhancedTable
      data={devices}
      columns={columns}
      renderCell={renderCell}
      getItemId={(item) => item.id.toString()}
      loading={loading}
      loadingMessage="Loading user devices..."
      emptyMessage="No user devices found"
      hideTableSearch
      pagination
      manualPagination
      pageSize={PER_PAGE}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      storageKey={storageKey}
    />
  );
};

export default UserDevicesTable;
