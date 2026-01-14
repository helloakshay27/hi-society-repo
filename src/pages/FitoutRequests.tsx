import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedTable } from "../components/enhanced-table/EnhancedTable";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/utils/apiClient";

interface FitoutRequestItem {
  id: number;
  annexure: string;
  description: string;
  tower: string;
  flat: string;
  master_status: string;
  created_on: string;
  created_by: string;
  total_amount: number;
  amount_paid: number;
  created_at: string;
  updated_at: string;
}

const FitoutRequests: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [fitoutRequests, setFitoutRequests] = useState<FitoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFitoutRequestsData();
  }, []);

  const fetchFitoutRequestsData = useCallback(async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const url = `/crm/admin/fitout_requests.json`;
      
      const response = await apiClient.get(url);
      console.log("Fitout Requests response:", response.data);
      const requestsData = response.data.data || [];

      setFitoutRequests((prevRequests) => {
        if (JSON.stringify(prevRequests) === JSON.stringify(requestsData)) {
          return prevRequests;
        }
        return requestsData;
      });
    } catch (error) {
      console.error("Error fetching Fitout Requests data:", error);
      setFitoutRequests([]);
      toast({
        title: "Error",
        description: "Failed to fetch Fitout Requests data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleAddRequest = () => {
    navigate(`/master/fitout-requests/add`);
  };

  const handleExportRequests = useCallback(async () => {
    try {
      const url = `/crm/admin/fitout_requests.xlsx?export=true`;

      const response = await apiClient.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "fitout-requests-data.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Export Successful",
        description: "Fitout Requests data has been exported successfully",
      });
    } catch (error) {
      console.error("Error exporting requests:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export requests data",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRowAction = (action: string, requestId: number) => {
    console.log(`${action} action for Request ${requestId}`);
    if (action === "Edit") {
      navigate(`/master/fitout-requests/edit/${requestId}`);
    } else if (action === "View") {
      navigate(`/master/fitout-requests/details/${requestId}`);
    } else {
      toast({
        title: `${action} Action`,
        description: `${action} action performed for Request ${requestId}`,
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        draggable: false,
        defaultVisible: true,
      },
      {
        key: "id",
        label: "ID",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "annexure",
        label: "Annexure",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "description",
        label: "Description",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "tower",
        label: "Tower",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "flat",
        label: "Flat",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "master_status",
        label: "Master Status",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "created_on",
        label: "Created on",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "created_by",
        label: "Created by",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "total_amount",
        label: "Total Amount",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "amount_paid",
        label: "Amount Paid",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
    ],
    []
  );

  const renderCell = useCallback(
    (item: FitoutRequestItem, columnKey: string) => {
      switch (columnKey) {
        case "actions":
          return (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handleRowAction("View", item.id)}
                className="p-1 text-black-600 hover:text-black-800"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRowAction("Edit", item.id)}
                className="p-1 text-black-600 hover:text-black-800"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          );
        case "id":
          return <div className="text-center">{item.id}</div>;
        case "annexure":
          return <span>{item.annexure || "-"}</span>;
        case "description":
          return <span>{item.description || "-"}</span>;
        case "tower":
          return <span>{item.tower || "-"}</span>;
        case "flat":
          return <span>{item.flat || "-"}</span>;
        case "master_status":
          return (
            <span className={`font-medium capitalize`}>
              {item.master_status || "-"}
            </span>
          );
        case "created_on":
          return (
            <span>
              {item.created_on
                ? new Date(item.created_on).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </span>
          );
        case "created_by":
          return <span>{item.created_by || "-"}</span>;
        case "total_amount":
          return (
            <span>
              {item.total_amount 
                ? `₹${item.total_amount.toLocaleString("en-IN")}`
                : "₹0"}
            </span>
          );
        case "amount_paid":
          return (
            <span>
              {item.amount_paid 
                ? `₹${item.amount_paid.toLocaleString("en-IN")}`
                : "₹0"}
            </span>
          );
        default:
          const value = item[columnKey as keyof FitoutRequestItem];
          return (
            <span>
              {value !== null && value !== undefined ? String(value) : "-"}
            </span>
          );
      }
    },
    [navigate, toast]
  );

  const filteredRequests = useMemo(() => {
    return fitoutRequests.filter((request) => {
      const matchesSearch =
        request.annexure?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.tower?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.flat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.master_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.created_by?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [fitoutRequests, searchTerm]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">Loading fitout requests...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Heading level="h1" variant="default">
            Fitout Requests
          </Heading>
        </div>
      </div>

      <div>
        <EnhancedTable
          data={filteredRequests}
          columns={columns}
          selectable={false}
          getItemId={(item) => item.id.toString()}
          renderCell={renderCell}
          storageKey="fitout-requests-table-v1"
          enableExport={true}
          exportFileName="fitout-requests-data"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search requests..."
          pagination={true}
          pageSize={10}
          leftActions={
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <Button
                onClick={handleAddRequest}
                className="flex items-center gap-2 bg-[#F2EEE9] text-[#BF213E] border-0 hover:bg-[#F2EEE9]/80"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          }
          handleExport={handleExportRequests}
        />
      </div>
    </div>
  );
};

export default FitoutRequests;
