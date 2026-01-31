import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';

interface Referral {
  id: number;
  name: string;
  email: string;
  mobile: string;
  referral_code: string;
  project_name: string;
}

const LoyaltyReferralList = () => {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const itemsPerPage = 10;

  const fetchReferrals = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/referrals/get_all_referrals'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch referrals: ${response.statusText}`);
      }

      const data = await response.json();
      const referralsData = data?.referrals || [];
      
      // Client-side search filtering
      let filteredReferrals = referralsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredReferrals = referralsData.filter((referral: Referral) =>
          referral.name?.toLowerCase().includes(searchLower) ||
          referral.email?.toLowerCase().includes(searchLower) ||
          referral.mobile?.toLowerCase().includes(searchLower) ||
          referral.referral_code?.toLowerCase().includes(searchLower) ||
          referral.project_name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedReferrals = filteredReferrals.slice(startIndex, endIndex);
      
      setReferrals(paginatedReferrals);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredReferrals.length / itemsPerPage));
      setTotalCount(filteredReferrals.length);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to fetch referrals.');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchReferrals]);

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
    { key: 'id', label: 'Sr No', sortable: true },
    { key: 'ref_name', label: 'Name', sortable: true },
    { key: 'client_email', label: 'Email', sortable: true },
    { key: 'ref_phone', label: 'Mobile No', sortable: true },
    { key: 'referral_code', label: 'Referral Code', sortable: true },
    { key: 'project_name', label: 'Project Name', sortable: true },
  ];

  const renderCell = (item: Referral, columnKey: string) => {
    switch (columnKey) {
      case 'referral_code':
        return item.referral_code || 'N/A';
      default:
        return item[columnKey as keyof Referral] as React.ReactNode ?? '-';
    }
  };

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={referrals}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="loyalty-referrals"
        storageKey="loyalty-referrals-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search referrals (name, email, mobile, code, project)..."
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching referrals..." : "Loading referrals..."}
        // --- Bind pagination state to table ---
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
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

export default LoyaltyReferralList;

