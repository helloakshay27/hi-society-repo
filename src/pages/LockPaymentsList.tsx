import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
// import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { getAuthHeader } from '@/config/apiConfig';

interface LockPayment {
  id: number;
  order_number?: string;
  payment_date: string;
  payment_mode: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  pg_transaction_id: string;
  payment_gateway: string;
  created_at?: string;
  updated_at?: string;
}

const LockPaymentsList = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<LockPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const itemsPerPage = 10;

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
  };

  const fetchPayments = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      // const response = await fetch(getFullUrl('/lock_payments'), {
      const response = await fetch('https://runwal-api.lockated.com/lock_payments?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ', {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lock payments: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Ensure we always have an array
      let paymentsData: LockPayment[] = [];
      if (Array.isArray(data)) {
        paymentsData = data;
      } else if (data?.payments && Array.isArray(data.payments)) {
        paymentsData = data.payments;
      } else if (data?.lock_payments && Array.isArray(data.lock_payments)) {
        paymentsData = data.lock_payments;
      }
      
      // Client-side search filtering
      let filteredPayments = paymentsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredPayments = paymentsData.filter((payment: LockPayment) =>
          payment.id?.toString().includes(searchLower) ||
          payment.order_number?.toLowerCase().includes(searchLower) ||
          payment.payment_date?.toLowerCase().includes(searchLower) ||
          payment.payment_mode?.toLowerCase().includes(searchLower) ||
          payment.total_amount?.toString().includes(searchLower) ||
          payment.paid_amount?.toString().includes(searchLower) ||
          payment.payment_status?.toLowerCase().includes(searchLower) ||
          payment.pg_transaction_id?.toLowerCase().includes(searchLower) ||
          payment.payment_gateway?.toLowerCase().includes(searchLower)
        );
      }
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
      
      setPayments(paginatedPayments);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredPayments.length / itemsPerPage));
      setTotalCount(filteredPayments.length);
    } catch (error) {
      console.error('Error fetching lock payments:', error);
      toast.error('Failed to fetch lock payments');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchPayments]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'payment_date', label: 'Payment Date', sortable: true },
    { key: 'payment_mode', label: 'Payment Mode', sortable: true },
    { key: 'total_amount', label: 'Total Amount', sortable: true },
    { key: 'paid_amount', label: 'Paid Amount', sortable: true },
    { key: 'payment_status', label: 'Status', sortable: true },
    { key: 'pg_transaction_id', label: 'Transaction ID', sortable: true },
    { key: 'payment_gateway', label: 'Gateway', sortable: true },
  ];

  const renderCell = (item: LockPayment, columnKey: string) => {
    switch (columnKey) {
      case 'payment_date':
        return formatDate(item.payment_date);
      case 'payment_mode':
        return item.payment_mode || 'N/A';
      case 'total_amount':
        return `₹${item.total_amount?.toLocaleString() || '0'}`;
      case 'paid_amount':
        return item.paid_amount ? `₹${item.paid_amount.toLocaleString()}` : 'N/A';
      case 'payment_status':
        const status = item.payment_status || 'N/A';
        const statusClass = 
          status === 'success' || status === 'completed'
            ? 'bg-green-100 text-green-800'
            : status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {status}
          </span>
        );
      case 'pg_transaction_id':
        return item.pg_transaction_id || 'N/A';
      case 'payment_gateway':
        return item.payment_gateway || 'N/A';
      default:
        return item[columnKey as keyof LockPayment] as React.ReactNode ?? '-';
    }
  };

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={payments}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="lock-payments"
        storageKey="lock-payments-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search payments (ID, date, mode, amount, status, transaction ID, gateway)..."
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching payments..." : "Loading payments..."}
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
      <Toaster />
      {renderListTab()}
    </div>
  );
};

export default LockPaymentsList;
