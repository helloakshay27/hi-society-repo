import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Eye, FileClock, Plus, Trash2 } from "lucide-react";

interface FlatChargeMapping {
  id: number;
  bill_cycle_name?: string;
  tower_name?: string;
  possession_status?: string;
  flat_names?: string[];
  created_at?: string;
}

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "id", label: "ID", sortable: true },
  { key: "bill_cycle_name", label: "Bill Cycle", sortable: true },
  { key: "tower_name", label: "Tower", sortable: true },
  { key: "possession_status", label: "Possession Status", sortable: true },
  { key: "flat_names", label: "Flats", sortable: false },
  { key: "created_at", label: "Created On", sortable: true },
];

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString()}`;
};

const AccountingUnitsBillCycleMapping: React.FC = () => {
  const navigate = useNavigate();
  const [mappings, setMappings] = useState<FlatChargeMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/account/soc_flat_charges.json`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.soc_flat_charges)
          ? data.soc_flat_charges
          : [];
      setMappings(list);
    } catch (error) {
      console.error("Error fetching bill cycle mappings:", error);
      toast.error("Failed to fetch bill cycle mappings");
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const rows = useMemo(() => mappings, [mappings]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this bill cycle mapping?")) return;
    setDeletingId(id);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.delete(`${baseUrl}/account/soc_flat_charges/${id}.json`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      toast.success("Mapping deleted successfully");
      setMappings((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting mapping:", error);
      toast.error("Failed to delete mapping");
    } finally {
      setDeletingId(null);
    }
  };

  const renderCell = (item: FlatChargeMapping, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="p-1"
              onClick={() => navigate(`/accounting/units-bill-cycle-mapping/${item.id}`, { state: { mapping: item } })}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-1"
              disabled={deletingId === item.id}
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      case "flat_names":
        return item.flat_names && item.flat_names.length > 0 ? item.flat_names.join(", ") : "";
      case "created_at":
        return formatDateTime(item.created_at);
      default:
        return (item as any)[columnKey] ?? "";
    }
  };

  return (
    <div className="bg-white p-2 sm:p-4 lg:p-6 max-w-full min-h-screen overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Units &amp; Bill Cycle Mapping</h1>
      </div>
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination
        pageSize={20}
        storageKey="units-bill-cycle-mapping-table"
        leftActions={
          <Button
            variant="ghost"
            className="btn-primary h-9 px-4 text-sm font-medium"
            onClick={() => navigate("/accounting/units-bill-cycle-mapping/add")}
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        }
        rightActions={
          <Button
            variant="outline"
            className="h-9 px-4 text-sm font-medium"
            onClick={() => navigate("/accounting/units-bill-cycle-mapping/log")}
          >
            <FileClock className="w-4 h-4 mr-2" /> Audit Log
          </Button>
        }
        loading={loading}
        loadingMessage="Loading mappings..."
        emptyMessage="No mappings found"
      />
    </div>
  );
};

export default AccountingUnitsBillCycleMapping;
