import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, Settings, Mail, Users, UserCheck, Clock } from "lucide-react";
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

interface FitoutCards {
  total: number;
  pending: number;
  work_in_progress: number;
  closed: number;
}

const FitoutRequests: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [allRequests, setAllRequests] = useState<FitoutRequestItem[]>([]);
  const [cards, setCards] = useState<FitoutCards | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchFitoutRequestsData = useCallback(async (page: number = 1, statusFilter: string | null = null) => {
    try {
      setLoading(true);

      let url = `/crm/admin/fitout_requests.json?page=${page}`;
      if (statusFilter) {
        url += `&status_filter=${encodeURIComponent(statusFilter)}`;
      }

      const response = await axios.get(
        getFullUrl(url),
        {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Fitout Requests response:", response.data);
      const requestsData = response.data.fitout_requests || [];
      setCards(response.data?.cards || null);
      setTotalPages(response.data?.total_pages ?? 1);
      setTotalEntries(response.data?.total_entries ?? 0);

      const enrichedRequests = requestsData.map((request: any) => ({
        ...request,
        flat_no: request.flat || request.flat_no || '',
        tower: request.tower || '',
        user_name: request.user_name || '',
      }));

      setAllRequests(enrichedRequests);
    } catch (error) {
      console.error("Error fetching Fitout Requests data:", error);
      setAllRequests([]);
      setCards(null);
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
  }, []);

  useEffect(() => {
    fetchFitoutRequestsData(currentPage, activeFilter);
  }, [fetchFitoutRequestsData, currentPage, activeFilter]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCardFilter = (statusFilter: string | null) => {
    if (statusFilter === null) {
      // Total card always clears the filter
      setActiveFilter(null);
    } else {
      // Non-total card: toggle off if already active, else activate
      setActiveFilter(prev => prev === statusFilter ? null : statusFilter);
    }
    setCurrentPage(1);
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

  const handleResendEmail = async (requestId: number) => {
    try {
      const response = await axios.post(
        getFullUrl(`/fitout_requests/${requestId}/retrigger_email.json`),
        {},
        {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );
      
      toast.success("Email resent successfully", {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    } catch (error) {
      console.error("Error resending email:", error);
      toast.error("Failed to resend email. Please try again.", {
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
        key: "created_at",
        label: "Request Date",
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
        key: "status_name",
        label: "Status",
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
        key: "resend_email",
        label: "Resend Email",
        sortable: false,
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
        case "resend_email":
          return (
            <div className="flex justify-center items-center">
              <button
                onClick={() => handleResendEmail(item.id)}
                className="flex items-center gap-2 bg-[#F2EEE9] text-[#BF213E] border-0 hover:bg-[#F2EEE9]/80"
                title="Resend Email"
              >
                <Mail className="w-4 h-4" />Resend Email
                
              </button>
            </div>
          );
        case "id":
          return <div className="text-center">{item.id}</div>;
        case "category_name":
          return <span>{item.category_name || "-"}</span>;
        case "description":
          const description = item.description || "-";
          const words = description.split(' ');
          const truncatedDescription = words.length > 10 
            ? words.slice(0, 10).join(' ') + '...' 
            : description;
          return (
            <span title={description} className="cursor-pointer">
              {truncatedDescription}
            </span>
          );
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
    if (!searchTerm) return allRequests;
    const term = searchTerm.toLowerCase();
    return allRequests.filter((request) =>
      request.category_name?.toLowerCase().includes(term) ||
      request.description?.toLowerCase().includes(term) ||
      request.status_name?.toLowerCase().includes(term) ||
      request.fitout_type?.toLowerCase().includes(term) ||
      request.contactor_name?.toLowerCase().includes(term) ||
      request.contactor_no?.includes(searchTerm) ||
      request.user_name?.toLowerCase().includes(term) ||
      request.tower?.toLowerCase().includes(term) ||
      request.flat_no?.toLowerCase().includes(term) ||
      request.id?.toString().includes(searchTerm)
    );
  }, [allRequests, searchTerm]);

  const fitoutStats = {
    total: cards?.total ?? 0,
    pending: cards?.pending ?? 0,
    work_in_progress: cards?.work_in_progress ?? 0,
    closed: cards?.closed ?? 0,
  };

  const statCards = [
    {
      label: "Total",
      value: fitoutStats.total,
      icon: Users,
      filterKey: null as string | null,
    },
    {
      label: "Pending",
      value: fitoutStats.pending,
      icon: Clock,
      filterKey: "Pending" as string | null,
    },
    {
      label: "Work In Progress",
      value: fitoutStats.work_in_progress,
      icon: Clock,
      filterKey: "Work In Progress" as string | null,
    },
    {
      label: "Closed",
      value: fitoutStats.closed,
      icon: UserCheck,
      filterKey: "Closed" as string | null,
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">

      {/* Fitout Request Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((item, i) => {
          const IconComponent = item.icon;
          const isActive = activeFilter === item.filterKey;
          return (
            <div
              key={i}
              onClick={() => handleCardFilter(item.filterKey)}
              className={`p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4 cursor-pointer transition-all ${
                isActive
                  ? "bg-[#F6F4EE] text-black"
                  : "bg-[#F6F4EE] hover:shadow-lg"
              }`}
            >
              <div className="w-14 h-14 flex items-center justify-center rounded bg-[#C4B89D54]">
                <IconComponent className={`w-6 h-6 ${isActive ? "text-[#C72030]" : "text-[#C72030]"}`} />
              </div>
              <div>
                <div className={`text-2xl font-semibold ${isActive ? "text-black" : "text-[#1A1A1A]"}`}>
                  {item.value.toLocaleString()}
                </div>
                <div className={`text-sm font-medium ${isActive ? "text-black" : "text-[#1A1A1A]"}`}>
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
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
        {totalPages > 1 && (
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
                {(() => {
                  const pages: number[] = [];
                  const delta = 2;
                  const left = Math.max(1, currentPage - delta);
                  const right = Math.min(totalPages, currentPage + delta);
                  if (left > 1) pages.push(1);
                  if (left > 2) pages.push(-1); // ellipsis
                  for (let p = left; p <= right; p++) pages.push(p);
                  if (right < totalPages - 1) pages.push(-2); // ellipsis
                  if (right < totalPages) pages.push(totalPages);
                  return pages.map((page, idx) =>
                    page < 0 ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <span className="px-2 text-gray-400">…</span>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  );
                })()}
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
