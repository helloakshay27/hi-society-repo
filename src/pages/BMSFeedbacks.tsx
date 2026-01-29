import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Eye, Download, Filter, RefreshCw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { API_CONFIG, getFullUrl } from "@/config/apiConfig";

interface Feedback {
  id: string;
  tower: string;
  flat: string;
  qualityOfApartment: string;
  timelinessOfPossession: string;
  servicesAndInfrastructure: string;
  easeOfPossessionProcess: string;
  serviceQualityFromBooking: string;
  comment: string;
  submittedOn: string;
  submittedBy: string;
}

const BMSFeedbacks: React.FC = () => {
  const navigate = useNavigate();
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

  // Mock data query (replace with actual API call)
  const {
    data: feedbacksData,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["feedbacks", debouncedSearchQuery, currentPage, pageSize],
    queryFn: async () => {
      const token = API_CONFIG.TOKEN || ""; // or get from storage/context if needed
      const url = getFullUrl(
        `/crm/feedbacks.json?token=${token}&page=${currentPage}&per_page=${pageSize}&search=${encodeURIComponent(debouncedSearchQuery)}`
      );
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch feedbacks");
      const data = await response.json();

      // Map API response to Feedback[]
      const feedbacks: Feedback[] = (data.lead_project_feedbacks || []).map((item: any) => ({
        id: item.id?.toString() || "",
        tower: item.tower || "-",
        flat: item.flat || "-",
        qualityOfApartment: item.quality_of_apartment || "-",
        timelinessOfPossession: item.timeliness_of_possession || "-",
        servicesAndInfrastructure: item.services_and_infrastructure || "-",
        easeOfPossessionProcess: item.ease_of_possession_process || "-",
        serviceQualityFromBooking: item.service_quality_from_booking || "-",
        comment: item.comment || "",
        submittedOn: item.submitted_on || "-",
        submittedBy: item.submitted_by || "-",
      }));

      return {
        feedbacks,
        pagination: {
          total_count: data.count || feedbacks.length,
          total_pages: data.total_pages || 1,
          current_page: data.current_page || 1,
        },
      };
    },
    retry: 2,
    staleTime: 30000,
    gcTime: 60000,
  });

  const feedbacks: Feedback[] = feedbacksData?.feedbacks || [];
  const totalCount = feedbacksData?.pagination?.total_count || 0;
  const totalPages = feedbacksData?.pagination?.total_pages || 1;

  const columns = [
    { key: "tower", label: "Tower", sortable: true },
    { key: "flat", label: "Flat", sortable: true },
    { key: "qualityOfApartment", label: "Quality Of Apartment Offered For Possession", sortable: true },
    { key: "timelinessOfPossession", label: "Timeliness Of Possession", sortable: true },
    { key: "servicesAndInfrastructure", label: "Services & Infrastructure (Driveway, Parking, Lifts, Electricity, Water And Security)", sortable: true },
    { key: "easeOfPossessionProcess", label: "Ease Of Possession Process", sortable: true },
    { key: "serviceQualityFromBooking", label: "Service Quality From Booking Till Possession", sortable: true },
    { key: "comment", label: "Comment", sortable: true },
    { key: "submittedOn", label: "Submitted On", sortable: true },
    { key: "submittedBy", label: "Submitted By", sortable: true },
  ];

  const handleViewFeedback = (item: Feedback) => {
    navigate(`/feedbacks/view/${item.id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Feedbacks refreshed");
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success("Exporting feedbacks...");
  };

  const renderCell = (item: Feedback, columnKey: string) => {
    switch (columnKey) {
      case "tower":
        return <span className="font-medium">{item.tower}</span>;
      case "flat":
        return <span>{item.flat}</span>;
      case "qualityOfApartment":
      case "timelinessOfPossession":
      case "servicesAndInfrastructure":
      case "easeOfPossessionProcess":
      case "serviceQualityFromBooking":
        return (
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded bg-gray-100 font-medium text-sm">
            {item[columnKey as keyof Feedback]}
          </span>
        );
      case "comment":
        return <span className="text-sm text-gray-600">{item.comment || "-"}</span>;
      case "submittedOn":
        return <span className="text-sm">{item.submittedOn}</span>;
      case "submittedBy":
        return <span className="text-sm font-medium">{item.submittedBy}</span>;
      default:
        return item[columnKey as keyof Feedback];
    }
  };

  // Render pagination items
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
      // Always show first page
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

      // Show ellipsis or middle pages
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

      // Always show last page
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

  // Render custom right actions
  const renderRightActions = () => (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isLoading}
        className="h-9"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="h-9"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Feedbacks</h1>
      </div>

      <EnhancedTable
        data={feedbacks}
        columns={columns}
        renderCell={renderCell}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search feedbacks..."
        enableSearch={true}
        rightActions={renderRightActions()}
        emptyMessage="No feedbacks found"
        loading={isLoading}
        pagination={false}
        storageKey="bms-feedbacks-table"
      />

      {/* Custom Pagination */}
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

      {/* Loading state overlay */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading feedbacks...</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading feedbacks</p>
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

export default BMSFeedbacks;
