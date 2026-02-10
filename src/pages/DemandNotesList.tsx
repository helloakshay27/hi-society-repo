import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
// import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { getAuthHeader } from '@/config/apiConfig';

interface DemandNote {
  id: number;
  project_id: string | number;
  booking_number: string;
  customer_code: string;
  demand_number: string;
  percentage: number;
  amount: number;
  raised_date: string;
  expected_date: string;
  cgst: number;
  sgst: number;
  total_tax_amount: number;
  total_amount: number;
}

const DemandNotesList = () => {
  const [demandNotes, setDemandNotes] = useState<DemandNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchDemandNotes = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      // const response = await fetch(getFullUrl('/demand_notes'), {
      const response = await fetch('https://runwal-api.lockated.com/demand_notes?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ', {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch demand notes: ${response.statusText}`);
      }

      const data = await response.json();
      const notesData = Array.isArray(data) ? data : (data.demand_notes || []);

      // Client-side search filtering
      let filteredNotes = notesData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredNotes = notesData.filter((note: DemandNote) =>
          note.booking_number?.toLowerCase().includes(searchLower) ||
          note.customer_code?.toLowerCase().includes(searchLower) ||
          note.demand_number?.toLowerCase().includes(searchLower) ||
          note.project_id?.toString().toLowerCase().includes(searchLower) ||
          note.raised_date?.toLowerCase().includes(searchLower) ||
          note.expected_date?.toLowerCase().includes(searchLower)
        );
      }

      // Client-side pagination
      const itemsPerPage = 10;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedNotes = filteredNotes.slice(startIndex, endIndex);

      setDemandNotes(paginatedNotes);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredNotes.length / itemsPerPage));
      setTotalCount(filteredNotes.length);
    } catch (error) {
      toast.error('Failed to fetch demand notes');
      console.error('Error fetching demand notes:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandNotes(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchDemandNotes]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const columns = [
    { key: 'sr_no', label: 'Sr No', sortable: false },
    { key: 'project_id', label: 'Project ID', sortable: true },
    { key: 'booking_number', label: 'Booking Number', sortable: true },
    { key: 'customer_code', label: 'Customer Code', sortable: true },
    { key: 'demand_number', label: 'Demand Number', sortable: true },
    { key: 'percentage', label: 'Percentage', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'raised_date', label: 'Raised Date', sortable: true },
    { key: 'expected_date', label: 'Expected Date', sortable: true },
    { key: 'cgst', label: 'CGST', sortable: true },
    { key: 'sgst', label: 'SGST', sortable: true },
    { key: 'total_tax_amount', label: 'Total Tax', sortable: true },
    { key: 'total_amount', label: 'Total Amount', sortable: true },
  ];

  const renderCell = (item: DemandNote, columnKey: string) => {
    switch (columnKey) {
      case 'sr_no':
        const index = demandNotes.indexOf(item);
        const startIndex = (currentPage - 1) * 10;
        return startIndex + index + 1;
      case 'project_id':
        return item.project_id || '-';
      case 'booking_number':
        return item.booking_number || '-';
      case 'customer_code':
        return item.customer_code || '-';
      case 'demand_number':
        return item.demand_number || '-';
      case 'percentage':
        return item.percentage ? `${item.percentage}%` : '-';
      case 'amount':
        return formatCurrency(item.amount);
      case 'raised_date':
        return item.raised_date || '-';
      case 'expected_date':
        return item.expected_date || '-';
      case 'cgst':
        return formatCurrency(item.cgst);
      case 'sgst':
        return formatCurrency(item.sgst);
      case 'total_tax_amount':
        return formatCurrency(item.total_tax_amount);
      case 'total_amount':
        return (
          <span className="font-semibold text-[#c72030]">
            {formatCurrency(item.total_amount)}
          </span>
        );
      default:
        return item[columnKey as keyof DemandNote] as React.ReactNode ?? '-';
    }
  };

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={demandNotes}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="demand-notes"
        storageKey="demand-notes-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search demand notes (booking, customer code, demand number...)..."
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching demand notes..." : "Loading demand notes..."}
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
              
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(1); }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {currentPage > 4 && (
                    <PaginationItem>
                      <span className="px-3 py-2 text-gray-500">...</span>
                    </PaginationItem>
                  )}
                </>
              )}
              
              {/* Pages around current */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (page === currentPage) return true;
                  if (page === currentPage - 1 || page === currentPage - 2) return true;
                  if (page === currentPage + 1 || page === currentPage + 2) return true;
                  if (totalPages <= 7 && page <= totalPages) return true;
                  return false;
                })
                .map(page => (
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
              
              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <PaginationItem>
                      <span className="px-3 py-2 text-gray-500">...</span>
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
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

export default DemandNotesList;
