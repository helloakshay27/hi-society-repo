import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_CONFIG } from "@/config/apiConfig";
import axios from "axios";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

const HomeLoanList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [homeLoans, setHomeLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchHomeLoans = useCallback(async () => {
    setLoading(true);
    setIsSearching(!!searchTerm);
    try {
      const response = await axios.get(`${baseURL}/home_loans.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const loansData = response.data.home_loans || [];

      // Client-side search filtering
      let filteredLoans = loansData;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        filteredLoans = loansData.filter((loan) =>
          loan.project?.Project_Name?.toLowerCase().includes(query) ||
          loan.project?.project_address?.toLowerCase().includes(query) ||
          loan.required_loan_amt?.toString().includes(query)
        );
      }

      // Sort by ID descending
      filteredLoans.sort((a, b) => (b.id || 0) - (a.id || 0));

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage);
      
      setHomeLoans(paginatedLoans);
      setTotalCount(filteredLoans.length);
      setTotalPages(Math.ceil(filteredLoans.length / itemsPerPage) || 1);
    } catch (error) {
      console.error("Error fetching home loans:", error);
      toast.error("Failed to fetch home loans");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, searchTerm, currentPage]);

  useEffect(() => {
    fetchHomeLoans();
  }, [fetchHomeLoans]);

  const handleGlobalSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns = [
    { key: "id", label: "Sr No", sortable: true },
    { key: "project_name", label: "Project Name", sortable: true },
    { key: "project_address", label: "Project Address", sortable: false },
    { key: "required_loan_amt", label: "Loan Amount", sortable: true },
    { key: "tenure", label: "Tenure (Years)", sortable: true },
    { key: "preffered_banks", label: "Preferred Banks", sortable: false },
    { key: "created_at", label: "Created Date", sortable: true },
  ];

  const renderCell = (item, columnKey) => {
    const index = homeLoans.findIndex(l => l.id === item.id);
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "id":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "project_name":
        return <span>{item.project?.Project_Name || "-"}</span>;
      case "project_address":
        return (
          <div style={{ maxWidth: "300px", wordWrap: "break-word", whiteSpace: "normal", lineHeight: "1.5" }}>
            {item.project?.project_address || "-"}
          </div>
        );
      case "required_loan_amt":
        return <span>{formatCurrency(item.required_loan_amt)}</span>;
      case "tenure":
        return <span>{item.tenure || "-"}</span>;
      case "preffered_banks":
        return (
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {item.preffered_banks && item.preffered_banks.length > 0 ? (
              item.preffered_banks.map((bank, bankIndex) => (
                <span key={bankIndex} className="text-sm">
                  {bank.bank_name}
                  {bankIndex !== item.preffered_banks.length - 1 && ","}
                </span>
              ))
            ) : (
              "-"
            )}
          </div>
        );
      case "created_at":
        return <span>{formatDate(item.created_at)}</span>;
      default:
        return null;
    }
  };

  const renderListTab = () => (
    <div className="space-y-6">
          <EnhancedTable
            data={homeLoans}
            columns={columns}
            renderCell={renderCell}
            enableExport={false}
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            searchPlaceholder="Search by project name, address, or loan amount..."
            loading={loading}
            loadingMessage="Loading home loans..."
          />
          {!loading && homeLoans.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center mt-6">
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
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      {renderListTab()}
    </div>
  );
};

export default HomeLoanList;