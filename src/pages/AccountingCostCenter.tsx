import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Pencil, RotateCw } from "lucide-react";
import { AddCostCentreModal, CostCentre } from "@/components/AddCostCentreModal";

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "name", label: "Name", sortable: true },
  { key: "budget", label: "Budget", sortable: true },
  { key: "budget_start_date", label: "Budget Start date", sortable: true },
  { key: "budget_end_date", label: "Budget End date", sortable: true },
];

const AccountingCostCenter: React.FC = () => {
  const [costCentres, setCostCentres] = useState<CostCentre[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCostCentre, setEditingCostCentre] = useState<CostCentre | null>(null);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const fetchCostCentres = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const res = await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/lock_account_cost_centres.json`,
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      const data = res.data;
      const list: CostCentre[] = Array.isArray(data)
        ? data
        : data?.lock_account_cost_centres || data?.data || [];
      setCostCentres(list);
    } catch (error) {
      console.error("Error fetching cost centres:", error);
      setCostCentres([]);
    } finally {
      setLoading(false);
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchCostCentres();
  }, [fetchCostCentres]);

  const handleAdd = () => {
    setEditingCostCentre(null);
    setIsAddOpen(true);
  };

  const handleEdit = (item: CostCentre) => {
    setEditingCostCentre(item);
    setIsAddOpen(true);
  };

  const renderCell = (item: CostCentre, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <Pencil
            className="h-4 w-4 cursor-pointer text-[#3b82c4] hover:text-[#C72030]"
            onClick={() => handleEdit(item)}
          />
        );
      case "name":
        return item.name;
      case "budget":
        return item.budget ?? "";
      case "budget_start_date":
        return item.budget_start_date || "";
      case "budget_end_date":
        return item.budget_end_date || "";
      default:
        return "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <EnhancedTable
        data={costCentres}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination
        pageSize={20}
        enableGlobalSearch
        searchPlaceholder="Search"
        enableExport
        exportFileName="cost-centres"
        storageKey="cost-centres-table"
        loading={loading}
        loadingMessage="Loading cost centres..."
        emptyMessage="No matching records found"
        leftActions={
          <Button className="bg-[#1A2B4C] text-white hover:bg-[#1A2B4C]/90" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        }
        rightActions={
          <Button variant="outline" size="icon" onClick={fetchCostCentres} title="Refresh">
            <RotateCw className="h-4 w-4" />
          </Button>
        }
      />

      <AddCostCentreModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSaved={fetchCostCentres}
        editingCostCentre={editingCostCentre}
      />
    </div>
  );
};

export default AccountingCostCenter;
