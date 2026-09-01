import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Edit, Eye, Plus } from "lucide-react";

interface SocietyBillCycle {
  id: number;
  name: string;
  start_month: string;
  end_month: string;
  payment_due_in: number;
  frequency: string;
  interest_rate?: number;
  interest_type?: string;
  fine_rate?: number;
  fine_type?: string;
  created_at: string;
  created_by?: string | number;
  active: number;
}

const isPercentageType = (value?: string) => !!value && /percent/i.test(value);

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
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
  // API returns start_month/end_month as DD/MM/YYYY — display as-is rather than
  // re-parsing with `new Date()`, which would misread it as MM/DD/YYYY.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
};

const AccountingBillCycles: React.FC = () => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<SocietyBillCycle[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    const nextActive = isActive ? 0 : 1;
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.put(
        `${baseUrl}/account/society_bill_cycles/${id}.json`,
        { society_bill_cycle: { active: nextActive } },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      toast.success("Status updated successfully");
      setCycles((prev) => prev.map((c) => (c.id === id ? { ...c, active: nextActive } : c)));
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const renderCell = (item: SocietyBillCycle, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="p-1"
              onClick={() => navigate(`/accounting/bill-cycles/${item.id}`)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-1"
              onClick={() => navigate(`/accounting/bill-cycles/${item.id}/edit`)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        );
      case "start_month":
      case "end_month":
      case "created_at":
        return formatDate(item[columnKey as "start_month"]);
      case "frequency":
        return item.frequency ? item.frequency.replace("_", " ") : "";
      case "payment_due_in":
        return item.payment_due_in ? `${item.payment_due_in} days` : "";
      case "interest_rate":
        return item.interest_rate
          ? `${item.interest_rate}${isPercentageType(item.interest_type) ? "%" : ""}`
          : "";
      case "fine_rate":
        return item.fine_rate ? `${item.fine_rate}${isPercentageType(item.fine_type) ? "%" : ""}` : "";
      case "active":
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleToggleStatus(item.id, !!item.active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                item.active ? "bg-[#C72030]" : "bg-gray-300"
              }`}
            >
              <div
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  item.active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        );
      default:
        return (item as any)[columnKey] ?? "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
       {/* <div className="mb-4 sm:mb-6"> */}
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
          Bill Cycles
        </h1>
      {/* </div> */}
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination
        pageSize={20}
        // enableExport
        exportFileName="bill-cycles"
        storageKey="accounting-bill-cycles-table"
        leftActions={
          <Button
            variant="ghost"
            className="btn-primary h-9 px-4 text-sm font-medium"
            onClick={() => navigate("/accounting/bill-cycles/add")}
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        }
        loading={loading}
        loadingMessage="Loading bill cycles..."
        emptyMessage="No matching records found"
      />
    </div>
  );
};

export default AccountingBillCycles;
