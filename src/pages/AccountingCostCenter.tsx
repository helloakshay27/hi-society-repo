import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Eye, Edit, RotateCw, Trash2 } from "lucide-react";
import { AddCostCentreModal, CostCentre } from "@/components/AddCostCentreModal";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "name", label: "Name", sortable: true },
  { key: "yearly_budget", label: "Budget", sortable: true },
  { key: "start_date", label: "Budget Start date", sortable: true },
  { key: "end_date", label: "Budget End date", sortable: true },
];

const AccountingCostCenter: React.FC = () => {
  const [costCentres, setCostCentres] = useState<CostCentre[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCostCentre, setEditingCostCentre] = useState<CostCentre | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const fetchCostCentres = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const res = await axios.get(`${baseUrl}/cost_centres.json`, {
        params: { lock_account_id: lockAccountId },
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = res.data;
      const list: CostCentre[] = Array.isArray(data)
        ? data
        : data?.cost_centres || data?.data || [];
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
    setIsViewOnly(false);
    setIsAddOpen(true);
  };

  const handleView = (item: CostCentre) => {
    setEditingCostCentre(item);
    setIsViewOnly(true);
    setIsAddOpen(true);
  };

  const handleEdit = (item: CostCentre) => {
    setEditingCostCentre(item);
    setIsViewOnly(false);
    setIsAddOpen(true);
  };

  const handleDelete = async (item: CostCentre) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      await axios.delete(`${baseUrl}/cost_centres/${item.id}.json`, {
        params: { lock_account_id: lockAccountId },
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      toast.success("Cost Centre deleted successfully");
      fetchCostCentres();
    } catch (error) {
      console.error("Error deleting cost centre:", error);
      toast.error("Failed to delete cost centre");
    }
  };

  const renderCell = (item: CostCentre, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="p-1" onClick={() => handleView(item)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-1" onClick={() => handleEdit(item)}>
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="p-1">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Cost Centre</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    // className="!bg-red-600 hover:!bg-red-700 !text-white"
                    className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
                    onClick={() => handleDelete(item)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      case "name":
        return item.name;
      case "yearly_budget":
        return item.yearly_budget ?? "";
      case "start_date":
        return formatDate(item.start_date);
      case "end_date":
        return formatDate(item.end_date);
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
          <Button
           className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
          onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        }
        // rightActions={
        //   <Button variant="outline" size="icon" onClick={fetchCostCentres} title="Refresh">
        //     <RotateCw className="h-4 w-4" />
        //   </Button>
        // }
      />

      <AddCostCentreModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSaved={fetchCostCentres}
        editingCostCentre={editingCostCentre}
        readOnly={isViewOnly}
      />
    </div>
  );
};

export default AccountingCostCenter;
