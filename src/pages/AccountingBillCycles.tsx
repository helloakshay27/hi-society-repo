import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus } from "lucide-react";
import { AddBillCycleModal } from "@/components/AddBillCycleModal";

interface SocietyBillCycle {
  id: number;
  name: string;
  start_month: string;
  end_month: string;
  payment_due_in: number;
  frequency: string;
  interest_rate?: number;
  fine_rate?: number;
  created_at: string;
  created_by?: string | number;
  active: number;
}

const columns: ColumnConfig[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Bill Cycle Name", sortable: true },
  { key: "start_month", label: "Start Date", sortable: true },
  { key: "end_month", label: "End Date", sortable: true },
  { key: "frequency", label: "Frequency", sortable: true },
  { key: "payment_due_in", label: "Payment Due In", sortable: true },
  { key: "interest_rate", label: "Interest", sortable: true },
  { key: "fine_rate", label: "Fine", sortable: true },
  { key: "created_at", label: "Created On", sortable: true },
  { key: "active", label: "Status", sortable: true },
];

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
};

const AccountingBillCycles: React.FC = () => {
  const [cycles, setCycles] = useState<SocietyBillCycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/account/society_bill_cycles.json`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      setCycles(response.data?.society_bill_cycles || []);
    } catch (error) {
      console.error("Error fetching bill cycles:", error);
      toast.error("Failed to fetch bill cycles");
      setCycles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const rows = useMemo(() => cycles, [cycles]);

  const renderCell = (item: SocietyBillCycle, columnKey: string) => {
    switch (columnKey) {
      case "start_month":
      case "end_month":
      case "created_at":
        return formatDate(item[columnKey as "start_month"]);
      case "frequency":
        return item.frequency ? item.frequency.replace("_", " ") : "";
      case "payment_due_in":
        return item.payment_due_in ? `${item.payment_due_in} days` : "";
      case "interest_rate":
        return item.interest_rate ? `${item.interest_rate}%` : "";
      case "fine_rate":
        return item.fine_rate ? `${item.fine_rate}%` : "";
      case "active":
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              item.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {item.active ? "Active" : "Inactive"}
          </span>
        );
      default:
        return (item as any)[columnKey] ?? "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination
        pageSize={20}
        enableExport
        exportFileName="bill-cycles"
        storageKey="accounting-bill-cycles-table"
        leftActions={
          <Button className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        }
        loading={loading}
        loadingMessage="Loading bill cycles..."
        emptyMessage="No matching records found"
      />

      <AddBillCycleModal open={isAddOpen} onOpenChange={setIsAddOpen} onSaved={fetchCycles} />
    </div>
  );
};

export default AccountingBillCycles;
