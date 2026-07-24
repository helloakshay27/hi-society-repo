import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye, Edit, Trash2, RefreshCw, Loader2, Link, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

interface Offer {
  id: number;
  society_id: number;
  start_date: string;
  end_date: string;
  url: string;
  description: string;
  user_id: number;
  status: "Active" | "Inactive" | "Expired" | "Scheduled";
  created_at: string;
  updated_at: string;
}

const BMSOffers: React.FC = () => {
  const navigate = useNavigate();
  const { shouldShow } = useDynamicPermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const {
    data: offers = [],
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery<Offer[]>({
    queryKey: ["offers", debouncedSearchQuery, currentPage, pageSize],
    queryFn: async () => {
      const baseUrl = localStorage.getItem("baseUrl") || "";
      const token = localStorage.getItem("token") || "";
      const response = await axios.get(`https://${baseUrl}/log_offers.json`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as Offer[];
    },
    retry: 2,
    staleTime: 30000,
    gcTime: 60000,
  });

  const totalCount = offers.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const paginatedOffers = offers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "start_date", label: "Start Date", sortable: true },
    { key: "end_date", label: "End Date", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "url", label: "URL", sortable: false },
    { key: "description", label: "Description", sortable: false },
    { key: "created_at", label: "Created At", sortable: true },
  ];

  const handleAddOffer = () => {
    navigate("/bms/offers/add");
  };

  const handleViewOffer = (item: Offer) => {
    navigate(`/bms/offers/view/${item.id}`);
  };

  const handleEditOffer = (item: Offer) => {
    navigate(`/bms/offers/edit/${item.id}`);
  };

  const handleDeleteOffer = (item: Offer) => {
    toast.success(`Offer deleted`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Offers refreshed");
  };

  const getStatusColor = (status: Offer["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700 border-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Expired":
        return "bg-red-100 text-red-700 border-red-200";
      case "Scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const renderCell = (item: Offer, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-1">
            {shouldShow("Offers","show")&&(
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewOffer(item)}
              className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
            >
              <Eye className="h-4 w-4" />
            </Button>)}
            {shouldShow("Offers","update")&&(
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditOffer(item)}
              className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
            >
              <Edit className="h-4 w-4" />
            </Button>)}
            {/* <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteOffer(item)}
              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button> */}
          </div>
        );
      case "start_date":
      case "end_date":
        return (
          <span className="text-sm flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            {item[columnKey as keyof Offer] || "-"}
          </span>
        );
      case "status":
        return (
          <Badge variant="outline" className={`${getStatusColor(item.status)} border`}>
            {item.status}
          </Badge>
        );
      case "url":
        return item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            <Link className="w-3 h-3" />
            View URL
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        );
      case "description":
        return (
          <span className="text-sm text-gray-600 max-w-xs truncate block" title={item.description}>
            {item.description || "-"}
          </span>
        );
      case "created_at":
        return (
          <span className="text-sm text-gray-600">
            {item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN") : "-"}
          </span>
        );
      default:
        return <span className="text-sm">{String(item[columnKey as keyof Offer] ?? "-")}</span>;
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={isLoading}
              className={isLoading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            aria-disabled={isLoading}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={isLoading}
              className={isLoading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            aria-disabled={isLoading}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const renderLeftActions = () => (
    shouldShow("Offers","create")&&(
    <Button
      onClick={handleAddOffer}
      className="bg-[#C72030] hover:bg-[#A01828] !text-white h-9 px-4 text-sm font-medium"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add
    </Button>
    )
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Offers</h1>
      </div>

      <EnhancedTable
        data={paginatedOffers}
        columns={columns}
        renderCell={renderCell}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search offers..."
        enableSearch={true}
        leftActions={renderLeftActions()}
        emptyMessage="No Matching Records Found"
        loading={isLoading}
        pagination={false}
        storageKey="bms-offers-table"
      />

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={
                    currentPage === totalPages || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading offers...</span>
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading offers</p>
            <p className="text-sm text-gray-500 mt-1">{error?.message || "Please try again"}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BMSOffers;
