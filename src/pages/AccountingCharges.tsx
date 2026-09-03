import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { ArrowLeft, Edit, Eye, Plus } from "lucide-react";

interface ChargeSetup {
  id: number;
  name: string;
  value: number | null;
  description: string;
  charge_category: string;
  gst_applicable: boolean;
  basis: string;
  hsn_code: string;
  uom: string;
  created_by: string | number;
  created_at: string;
}

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "name", label: "Name", sortable: true },
  { key: "charge_category", label: "Category", sortable: true },
  { key: "value", label: "Value", sortable: true },
  { key: "basis", label: "Basis", sortable: true },
  { key: "hsn_code", label: "HSN Code", sortable: true },
  { key: "uom", label: "UOM", sortable: true },
  { key: "gst_applicable", label: "GST Applicable", sortable: true },
  { key: "created_by", label: "Created By", sortable: true },
  { key: "created_at", label: "Created At", sortable: true },
];

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString()}`;
};

const AccountingCharges: React.FC = () => {
  const navigate = useNavigate();
  const [charges, setCharges] = useState<ChargeSetup[]>([]);
  const [loading, setLoading] = useState(false);
  const lockAccountId = localStorage.getItem("lock_account_id");

  const fetchCharges = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/account/charge_setups.json`, {
        params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      setCharges(Array.isArray(response.data?.charge_setups) ? response.data.charge_setups : []);
    } catch (error) {
      console.error("Error fetching charges:", error);
      toast.error("Failed to fetch charges");
      setCharges([]);
    } finally {
      setLoading(false);
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  const rows = useMemo(() => charges, [charges]);

  const renderCell = (item: ChargeSetup, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="p-1"
              onClick={() => navigate(`/accounting/charges/${item.id}`)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-1"
              onClick={() => navigate(`/accounting/charges/${item.id}/edit`)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        );
      case "value":
        return item.value ?? "";
      case "gst_applicable":
        return item.gst_applicable ? (
          <span className="font-medium text-green-600">Yes</span>
        ) : (
          <span className="font-medium text-red-600">No</span>
        );
      case "created_at":
        return formatDateTime(item.created_at);
      default:
        return (item as any)[columnKey] ?? "";
    }
  };

  return (
    <div className="bg-white p-2 sm:p-4 lg:p-6 max-w-full min-h-screen overflow-x-hidden">
      {/* <button
        onClick={() => navigate("/accounting/dashboard")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Accounting
      </button> */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
          Charges
        </h1>
      </div>
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination
        pageSize={20}
        enableExport
        exportFileName="accounting-charges"
        storageKey="accounting-charges-table"
        leftActions={
          <Button
            onClick={() => navigate("/accounting/charges/add")}
            variant="ghost"
            className="btn-primary h-9 px-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        }
        loading={loading}
        loadingMessage="Loading charges..."
        emptyMessage="No matching records found"
      />
    </div>
  );
};

export default AccountingCharges;
