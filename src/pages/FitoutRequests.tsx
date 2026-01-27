import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedTable } from "../components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { toast } from "sonner";
import axios from "axios";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

interface FitoutRequestItem {
  id: number;
  fitout_category_id: number;
  description: string;
  society_id: number;
  user_society_id: number;
  user_id: number;
  site_id: number;
  unit_id: number;
  active: boolean | null;
  status_id: number;
  amount: number;
  created_at: string;
  updated_at: string;
  category_name: string;
  status_name: string;
  start_date: string;
  end_date: string;
  contactor_name: string | null;
  contactor_no: string | null;
  expiry_date: string | null;
  refund_date: string | null;
  fitout_type: string | null;
  deposit: string;
  convenience_charge: string;
  osr_logs: any[];
  lock_payment: any | null;
  user_name?: string;
  tower?: string;
  flat_no?: string;
}

const FitoutRequests: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
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

      // Get society ID for fetching blocks and flats
      const selectedUserSocietyId = localStorage.getItem('selectedUserSociety') || '';
      let idSociety = '';
      
      if (selectedUserSocietyId) {
        try {
          const userSocietiesResponse = await axios.get(
            getFullUrl("/crm/admin/user_societies.json"),
            {
              headers: {
                Authorization: getAuthHeader(),
                "Content-Type": "application/json",
              },
            }
          );
          const userSocieties = userSocietiesResponse.data || [];
          const selectedSociety = userSocieties.find((us: any) => us.id.toString() === selectedUserSocietyId);
          idSociety = selectedSociety?.id_society || '';
        } catch (error) {
          console.error('Error fetching user societies:', error);
        }
      }

      // Fetch all blocks, flats, and users in parallel
      let blocks: any[] = [];
      let users: any[] = [];
      
      try {
        const [blocksResponse, usersResponse] = await Promise.all([
          idSociety ? axios.get(
            getFullUrl(`/get_society_blocks.json?society_id=${idSociety}`),
            {
              headers: {
                Authorization: getAuthHeader(),
              },
            }
          ) : Promise.resolve({ data: { society_blocks: [] } }),
          axios.get(
            getFullUrl("/crm/admin/users.json"),
            {
              headers: {
                Authorization: getAuthHeader(),
                "Content-Type": "application/json",
              },
            }
          )
        ]);
        
        blocks = blocksResponse.data?.society_blocks || [];
        users = usersResponse.data || [];
      } catch (error) {
        console.error('Error fetching blocks or users:', error);
      }

      // Enrich requests with tower, flat, and user information
      const enrichedRequests = await Promise.all(
        requestsData.map(async (request: any) => {
          let towerName = '';
          let flatNumber = '';
          let userName = '';
          
          // Get tower name
          if (request.site_id) {
            const tower = blocks.find((b: any) => b.id === request.site_id);
            towerName = tower?.name || '';
          }
          
          // Get flat number
          if (request.unit_id && request.site_id && idSociety) {
            try {
              const flatsResponse = await axios.get(
                getFullUrl(`/get_society_flats.json?society_block_id=${request.site_id}&society_id=${idSociety}`),
                {
                  headers: {
                    Authorization: getAuthHeader(),
                  },
                }
              );
              const flats = flatsResponse.data?.society_flats || [];
              const flat = flats.find((f: any) => f.id === request.unit_id);
              flatNumber = flat?.flat_no || '';
            } catch (error) {
              console.error('Error fetching flats:', error);
            }
          }
          
          // Get user name
          if (request.user_id) {
            const user = users.find((u: any) => u.id === request.user_id);
            userName = user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : '';
          }
          
          return {
            ...request,
            tower: towerName,
            flat_no: flatNumber,
            user_name: userName,
          };
        })
      );

      setAllRequests(enrichedRequests);
      setTotalPages(Math.ceil(enrichedRequests.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching Fitout Requests data:", error);
      setAllRequests([]);
      setFitoutRequests([]);
      toast.error("Failed to fetch Fitout Requests data", {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
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
      // Import xlsx library dynamically
      const XLSX = await import('xlsx');
      
      // Prepare data for export
      const exportData = allRequests.map((request) => ({
        'ID': request.id,
        'Description': request.description || '-',
        'Fitout Type': request.fitout_type || '-',
        'Contractor Name': request.contactor_name || '-',
        'Contractor Mobile': request.contactor_no || '-',
        'User Name': request.user_name || '-',
        'Tower': request.tower || '-',
        'Flat No': request.flat_no || '-',
        'Status': request.status_name || '-',
        'Requested Date': request.start_date || '-',
        'Expiry Date': request.expiry_date 
          ? new Date(request.expiry_date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : '-',
        'Refund Date': request.refund_date
          ? new Date(request.refund_date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : '-',
        'Amount': request.amount ? `₹${request.amount.toLocaleString("en-IN")}` : '₹0',
        'Deposit': request.deposit ? `₹${parseFloat(request.deposit).toLocaleString("en-IN")}` : '₹0',
        'Convenience Charge': request.convenience_charge ? `₹${parseFloat(request.convenience_charge).toLocaleString("en-IN")}` : '₹0',
        'Request Date': request.created_at
          ? new Date(request.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : '-',
      }));

      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Fitout Requests');

      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, 'fitout-requests-data.xlsx');

      toast.success("Fitout Requests data has been exported successfully", {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    } catch (error) {
      console.error("Error exporting requests:", error);
      toast.error("Failed to export requests data. Please try again.", {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    }
  }, [allRequests, toast]);

  const handleRowAction = (action: string, requestId: number) => {
    console.log(`${action} action for Request ${requestId}`);
    if (action === "Edit") {
      navigate(`/fitout/requests/edit/${requestId}`);
    } else if (action === "View") {
      navigate(`/fitout/requests/details/${requestId}`);
    } else {
      toast.info(`${action} action performed for Request ${requestId}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
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
        key: "description",
        label: "Description",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "fitout_type",
        label: "Fitout Type",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "contactor_name",
        label: "Contractor Name",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "contactor_no",
        label: "Contractor Mobile",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "user_name",
        label: "User Name",
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
        key: "flat_no",
        label: "Flat No",
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
        label: "Requested Date",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "expiry_date",
        label: "Expiry Date",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "refund_date",
        label: "Refund Date",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "amount",
        label: "Amount",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "created_at",
        label: "Request Date",
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
        case "fitout_type":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {item.fitout_type || "-"}
            </span>
          );
        case "contactor_name":
          return <span>{item.contactor_name || "-"}</span>;
        case "contactor_no":
          return <span>{item.contactor_no || "-"}</span>;
        case "user_name":
          return <span>{item.user_name || "-"}</span>;
        case "tower":
          return <span>{item.tower || "-"}</span>;
        case "flat_no":
          return <span>{item.flat_no || "-"}</span>;
        case "start_date":
          return <span>{item.start_date || "-"}</span>;
        case "expiry_date":
          return (
            <span>
              {item.expiry_date
                ? new Date(item.expiry_date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </span>
          );
        case "refund_date":
          return (
            <span>
              {item.refund_date
                ? new Date(item.refund_date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </span>
          );
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
          request.fitout_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.contactor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.contactor_no?.includes(searchTerm) ||
          request.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.tower?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.flat_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
