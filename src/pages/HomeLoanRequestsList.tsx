import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';

interface HomeLoanRequest {
  id: number;
  loan_type: string;
  employment_type: string;
  monthly_income: number;
  birth_date: string;
  dob: string;
  preferred_time: string;
  preffered_time: string;
  bank_name: string;
  amount: number;
  required_loan_amt: number;
  tenure: number;
  customer_code: string;
  booking_number: string;
  status: string;
}

const HomeLoanRequestsList = () => {
  const [homeLoans, setHomeLoans] = useState<HomeLoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchHomeLoans = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/home_loans_request'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch home loan requests: ${response.statusText}`);
      }

      const data = await response.json();
      const loansData = Array.isArray(data) ? data : (data.home_loans || []);

      // Client-side search filtering
      let filteredLoans = loansData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredLoans = loansData.filter((loan: HomeLoanRequest) =>
          loan.loan_type?.toLowerCase().includes(searchLower) ||
          loan.employment_type?.toLowerCase().includes(searchLower) ||
          loan.monthly_income?.toString().toLowerCase().includes(searchLower) ||
          loan.birth_date?.toLowerCase().includes(searchLower) ||
          loan.dob?.toLowerCase().includes(searchLower) ||
          loan.preferred_time?.toLowerCase().includes(searchLower) ||
          loan.preffered_time?.toLowerCase().includes(searchLower) ||
          loan.bank_name?.toLowerCase().includes(searchLower) ||
          loan.amount?.toString().toLowerCase().includes(searchLower) ||
          loan.required_loan_amt?.toString().toLowerCase().includes(searchLower) ||
          loan.tenure?.toString().toLowerCase().includes(searchLower) ||
          loan.customer_code?.toLowerCase().includes(searchLower) ||
          loan.booking_number?.toLowerCase().includes(searchLower) ||
          loan.status?.toLowerCase().includes(searchLower)
        );
      }

      // Client-side pagination
      const itemsPerPage = 10;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedLoans = filteredLoans.slice(startIndex, endIndex);

      setHomeLoans(paginatedLoans);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredLoans.length / itemsPerPage));
      setTotalCount(filteredLoans.length);
    } catch (error) {
      toast.error('Failed to fetch home loan requests');
      console.error('Error fetching home loan requests:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeLoans(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchHomeLoans]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '-';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const columns = [
    { key: 'sr_no', label: 'Sr No', sortable: false },
    { key: 'loan_type', label: 'Loan Type', sortable: true },
    { key: 'employment_type', label: 'Employment', sortable: true },
    { key: 'monthly_income', label: 'Monthly Income', sortable: true },
    { key: 'birth_date', label: 'Birth Date', sortable: true },
    { key: 'preferred_time', label: 'Preferred Time', sortable: false },
    { key: 'bank_name', label: 'Bank Name', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'tenure', label: 'Tenure', sortable: true },
    { key: 'customer_code', label: 'Customer Code', sortable: true },
    { key: 'booking_number', label: 'Booking Number', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ];

  const renderCell = (item: HomeLoanRequest, columnKey: string) => {
    switch (columnKey) {
      case 'sr_no':
        const index = homeLoans.indexOf(item);
        const startIndex = (currentPage - 1) * 10;
        return startIndex + index + 1;
      case 'loan_type':
        return item.loan_type || '-';
      case 'employment_type':
        return item.employment_type || '-';
      case 'monthly_income':
        return formatCurrency(item.monthly_income);
      case 'birth_date':
        return formatDate(item.birth_date || item.dob);
      case 'preferred_time':
        return item.preferred_time || item.preffered_time || '-';
      case 'bank_name':
        return item.bank_name || '-';
      case 'amount':
        return formatCurrency(item.amount || item.required_loan_amt);
      case 'tenure':
        return item.tenure ? `${item.tenure} yrs` : '-';
      case 'customer_code':
        return item.customer_code || '-';
      case 'booking_number':
        return item.booking_number || '-';
      case 'status':
        const status = item.status || 'N/A';
        const statusClass = 
          status === 'approved' || status === 'completed'
            ? 'bg-green-100 text-green-800'
            : status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : status === 'rejected'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {status}
          </span>
        );
      default:
        return item[columnKey as keyof HomeLoanRequest] as React.ReactNode ?? '-';
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
        exportFileName="home-loan-requests"
        storageKey="home-loan-requests-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search loan requests (type, employment, bank, status...)..."
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching loan requests..." : "Loading loan requests..."}
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

export default HomeLoanRequestsList;
