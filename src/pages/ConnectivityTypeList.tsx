import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

interface ConnectivityType {
  id: number;
  name: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

const ConnectivityTypeList: React.FC = () => {
  const { shouldShow } = useDynamicPermissions();
  const navigate = useNavigate();
  const [connectivityTypes, setConnectivityTypes] = useState<ConnectivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchConnectivityTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/connectivity_types.json`, {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      
      let allTypes = response.data && Array.isArray(response.data) ? response.data : [];

      // Client-side search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        allTypes = allTypes.filter((type: ConnectivityType) =>
          type.name?.toLowerCase().includes(query)
        );
      }

      setConnectivityTypes(allTypes);
    } catch (error) {
      console.error("Error fetching connectivity types:", error);
      toast.error("Failed to fetch connectivity types");
      setConnectivityTypes([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchConnectivityTypes();
  }, [fetchConnectivityTypes]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleAdd = () => {
    navigate("/settings/connectivity-type-create");
  };

  const handleEdit = (id: number) => {
    navigate(`/settings/connectivity-type-edit/${id}`);
  };

  const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    try {
      await axios.patch(
        `${API_CONFIG.BASE_URL}/connectivity_types/${id}.json`,
        {
          connectivity_type: {
            active: !currentStatus,
          },
        },
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      
      toast.success("Status updated successfully");
      fetchConnectivityTypes();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "name", label: "Type", sortable: true },
    { key: "status", label: "Status", sortable: false },
  ];

  const renderCell = (item: ConnectivityType, columnKey: string) => {
    const index = connectivityTypes.findIndex(t => t.id === item.id);

    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            {shouldShow("ConnectivityType", "update") && (
              <button onClick={() => handleEdit(item.id)}>
                <Pencil size={18} style={{ color: '#000000' }} />
              </button>
            )}
          </div>
        );
      case "id":
        return <span className="font-medium">{index + 1}</span>;
      case "name":
        return <span>{item.name || "-"}</span>;
      case "status":
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleStatusToggle(item.id, item.active)}
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
        return null;
    }
  };

  const renderCustomActions = () => (
    <>
      {shouldShow("ConnectivityType", "create") && (
        <Button
          onClick={handleAdd}
          className="bg-[#C72030] hover:bg-[#A01828] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      )}
    </>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="space-y-6">
        <EnhancedTable
          data={connectivityTypes}
          columns={columns}
          renderCell={renderCell}
          enableExport={false}
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          leftActions={renderCustomActions()}
          loading={loading}
          loadingMessage="Loading connectivity types..."
        />
      </div>
    </div>
  );
};

export default ConnectivityTypeList;
