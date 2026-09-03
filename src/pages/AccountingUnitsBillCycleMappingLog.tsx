import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";

interface LogEntry {
  id: number;
  [key: string]: unknown;
}

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString()}`;
};

const KNOWN_COLUMNS: ColumnConfig[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "action", label: "Action", sortable: true },
  { key: "flat_name", label: "Flat", sortable: true },
  { key: "bill_cycle_name", label: "Bill Cycle", sortable: true },
  { key: "performed_by", label: "Performed By", sortable: true },
  { key: "created_at", label: "Date", sortable: true },
];

const AccountingUnitsBillCycleMappingLog: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>(KNOWN_COLUMNS);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(
        `${baseUrl}/account/soc_flat_charges/society_flat_charge_log.json`,
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      const data = response.data;
      const list: LogEntry[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.logs)
          ? data.logs
          : Array.isArray(data?.society_flat_charge_logs)
            ? data.society_flat_charge_logs
            : [];
      setLogs(list);

      if (list.length > 0) {
        const knownKeys = new Set(KNOWN_COLUMNS.map((c) => c.key));
        const hasKnownFields = KNOWN_COLUMNS.some((c) => c.key in list[0]);
        if (!hasKnownFields) {
          const dynamicColumns: ColumnConfig[] = Object.keys(list[0])
            .filter((key) => !knownKeys.has(key))
            .map((key) => ({
              key,
              label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              sortable: true,
            }));
          setColumns(dynamicColumns.length > 0 ? dynamicColumns : KNOWN_COLUMNS);
        } else {
          setColumns(KNOWN_COLUMNS);
        }
      }
    } catch (error) {
      console.error("Error fetching audit log:", error);
      toast.error("Failed to fetch audit log");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const rows = useMemo(() => logs, [logs]);

  const renderCell = (item: LogEntry, columnKey: string) => {
    if (columnKey === "created_at") return formatDateTime(item.created_at as string | undefined);
    const value = item[columnKey];
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="bg-white p-2 sm:p-4 lg:p-6 max-w-full min-h-screen overflow-x-hidden">
      <button
        onClick={() => navigate("/accounting/units-bill-cycle-mapping")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Units &amp; Bill Cycle Mapping
      </button>

      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Bill Cycle Mapping Audit Log</h1>
      </div>

      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination
        pageSize={20}
        storageKey="units-bill-cycle-mapping-log-table"
        loading={loading}
        loadingMessage="Loading audit log..."
        emptyMessage="No log entries found"
      />
    </div>
  );
};

export default AccountingUnitsBillCycleMappingLog;
