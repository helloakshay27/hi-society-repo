import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';

interface Bank {
  bank_name: string;
}

interface Project {
  Project_Name: string;
  project_address: string;
}

interface HomeLoan {
  id: number;
  project?: Project;
  required_loan_amt: number;
  tenure: number;
  preffered_banks?: Bank[];
  created_at: string;
}

const HomeLoanList = () => {
  const navigate = useNavigate();
  const [homeLoans, setHomeLoans] = useState<HomeLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchHomeLoans = useCallback(async () => {
    setLoading(true);
    setIsSearching(!!searchTerm);
    try {
      // const response = await fetch(getFullUrl('/home_loans.json'), {
      const response = await fetch('https://runwal-api.lockated.com/home_loans.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ', {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch home loans: ${response.statusText}`);
      }

      const data = await response.json();
      const loansData = data.home_loans || [];

      // Client-side search filtering
      let filteredLoans = loansData;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        filteredLoans = loansData.filter((loan: HomeLoan) =>
          loan.project?.Project_Name?.toLowerCase().includes(query) ||
          loan.project?.project_address?.toLowerCase().includes(query) ||
          loan.required_loan_amt?.toString().includes(query)
        );
      }

      // Sort by ID descending
      filteredLoans.sort((a: HomeLoan, b: HomeLoan) => (b.id || 0) - (a.id || 0));

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage);
      
      setHomeLoans(paginatedLoans);
      setTotalCount(filteredLoans.length);
      setTotalPages(Math.ceil(filteredLoans.length / itemsPerPage) || 1);
    } catch (error) {
      console.error('Error fetching home loans:', error);
      toast.error('Failed to fetch home loans');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [searchTerm, currentPage]);

  useEffect(() => {
    fetchHomeLoans();
  }, [fetchHomeLoans]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
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

  const renderCell = (item: HomeLoan, columnKey: string) => {
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
                  {bankIndex !== item.preffered_banks!.length - 1 && ","}
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
    <div className="space-y-4">
      <EnhancedTable
        data={homeLoans}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="home-loans"
        storageKey="home-loans-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search by project name, address, or loan amount..."
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching home loans..." : "Loading home loans..."}
      />
      {!searchTerm && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
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