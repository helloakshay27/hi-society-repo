import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedTable } from "../components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

interface FitoutRequestItem {
  id: number;
  fitout_category_id: number;
  description: string;
  society_id: number;
  user_society_id: number;
  active: boolean | null;
  status_id: number;
  amount: number;
  created_at: string;
  updated_at: string;
  category_name: string;
  status_name: string;
  start_date: string;
  end_date: string;
  osr_logs: any[];
  lock_payment: any | null;
}

const FitoutRequests: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [fitoutRequests, setFitoutRequests] = useState<FitoutRequestItem[]>([]);
  const [allRequests, setAllRequests] = useState<FitoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchFitoutRequestsData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        getFullUrl("/crm/admin/fitout_requests.json"),
        {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log("Fitout Requests response:", response.data);
      const requestsData = response.data.fitout_requests || [];

      setAllRequests(requestsData);
      setTotalPages(Math.ceil(requestsData.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching Fitout Requests data:", error);
      setAllRequests([]);
      setFitoutRequests([]);
      toast({
        title: "Error",
        description: "Failed to fetch Fitout Requests data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, itemsPerPage]);

  useEffect(() => {
    fetchFitoutRequestsData();
  }, [fetchFitoutRequestsData]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddRequest = () => {
    navigate(`/fitout/requests/add`);
  };

  const handleExportRequests = useCallback(async () => {
    try {
      const response = await axios.get(
        getFullUrl("/crm/admin/fitout_requests.xlsx?export=true"),
        {
          headers: {
            Authorization: getAuthHeader(),
          },
          responseType: "blob",
        }
      );
      
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
      navigate(`/fitout/requests/edit/${requestId}`);
    } else if (action === "View") {
      navigate(`/fitout/requests/details/${requestId}`);
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
      // {
      //   key: "category_name",
      //   label: "Category",
      //   sortable: true,
      //   draggable: true,
      //   defaultVisible: true,
      // },
      {
        key: "description",
        label: "Description",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "status_name",
        label: "Status",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "start_date",
        label: "Start Date",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      // {
      //   key: "end_date",
      //   label: "End Date",
      //   sortable: true,
      //   draggable: true,
      //   defaultVisible: true,
      // },
      {
        key: "amount",
        label: "Amount",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "created_at",
        label: "Created At",
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
            <div className="flex justify-center items-center gap-2 mb-2">
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
        case "category_name":
          return <span>{item.category_name || "-"}</span>;
        case "description":
          return <span>{item.description || "-"}</span>;
        case "status_name":
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.status_name === "Assigned to Worker"
                ? "bg-blue-100 text-blue-800"
                : item.status_name === "Completed"
                ? "bg-green-100 text-green-800"
                : item.status_name === "Pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}>
              {item.status_name || "-"}
            </span>
          );
        case "start_date":
          return <span>{item.start_date || "-"}</span>;
        case "end_date":
          return <span>{item.end_date || "-"}</span>;
        case "amount":
          return (
            <span>
              {item.amount 
                ? `₹${item.amount.toLocaleString("en-IN")}`
                : "₹0"}
            </span>
          );
        case "created_at":
          return (
            <span>
              {item.created_at
                ? new Date(item.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
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
    let filtered = allRequests;
    
    // Apply search filter
    if (searchTerm) {
      filtered = allRequests.filter((request) => {
        const matchesSearch =
          request.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.status_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.id?.toString().includes(searchTerm);
        return matchesSearch;
      });
    }
    
    // Update total pages based on filtered results
    const pages = Math.ceil(filtered.length / itemsPerPage);
    if (pages !== totalPages) {
      setTotalPages(pages);
    }
    
    // Apply pagination only when not searching
    if (!searchTerm) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filtered.slice(startIndex, endIndex);
    }
    
    return filtered;
  }, [allRequests, searchTerm, currentPage, itemsPerPage, totalPages]);

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
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search requests..."
          pagination={false}
          leftActions={
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <Button
                onClick={handleAddRequest}
                className="flex items-center gap-2 bg-[#F2EEE9] text-[#BF213E] border-0 hover:bg-[#F2EEE9]/80"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
              {/* <Button
                onClick={() => navigate('/fitout/categories-subcategories')}
                className="flex items-center gap-2 bg-[#F2EEE9] text-[#BF213E] border-0 hover:bg-[#F2EEE9]/80"
              >
                <Settings className="w-4 h-4" />
                Add Categories & Subcategories
              </Button> */}
            </div>
          }
          handleExport={handleExportRequests}
          loading={loading}
        />
        {!searchTerm && totalPages > 1 && (
          <div className="mt-3 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default FitoutRequests;
