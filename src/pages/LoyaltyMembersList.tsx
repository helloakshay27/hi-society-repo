import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { getFullUrl, getAuthHeader, API_CONFIG } from '@/config/apiConfig';

interface MemberStatus {
  tier_level: string;
  last_activity_date: string;
  tier_validity: string;
}

interface LoyaltyMember {
  id: number;
  firstname: string;
  lasttname: string;
  member_status?: MemberStatus;
  current_loyalty_points: number;
  tier_validity: string;
  last_sign_in: string;
}

const LoyaltyMembersList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const itemsPerPage = 10;

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
  };

  const fetchMembers = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const token = API_CONFIG.TOKEN || ""; // fallback if needed
      const url = getFullUrl(`/loyalty/members.json?token=${token}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch loyalty members: ${response.statusText}`);
      }

      const data = await response.json();
      const membersData: LoyaltyMember[] = (data || []).map((member: any) => ({
        id: member.id,
        firstname: member.firstname,
        lasttname: member.lasttname,
        member_status: member.member_status,
        current_loyalty_points: member.current_loyalty_points,
        tier_validity: member.tier_validity ? formatDate(member.tier_validity) : 'N/A',
        last_sign_in: member.last_sign_in ? formatDate(member.last_sign_in) : 'N/A',
      }));

      // Client-side search filtering
      let filteredMembers = membersData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredMembers = membersData.filter((member: LoyaltyMember) =>
          String(member.id || '').toLowerCase().includes(searchLower) ||
          `${member.firstname} ${member.lasttname}`.toLowerCase().includes(searchLower) ||
          (member.member_status?.tier_level || '').toLowerCase().includes(searchLower) ||
          String(member.current_loyalty_points || '').toLowerCase().includes(searchLower) ||
          (member.member_status?.last_activity_date || '').toLowerCase().includes(searchLower) ||
          (member.member_status?.tier_validity || '').toLowerCase().includes(searchLower)
        );
      }

      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

      setMembers(paginatedMembers);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredMembers.length / itemsPerPage));
      setTotalCount(filteredMembers.length);
    } catch (error) {
      console.error('Error fetching loyalty members:', error);
      toast.error('Failed to load loyalty members');
      setMembers([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchMembers]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleView = (id: number) => {
    navigate(`/setup-member/member-details/${id}`);
  };

  const columns = [
    { key: 'id', label: 'Member ID', sortable: true },
    { key: 'member_name', label: 'Member Name', sortable: true },
    { key: 'tier_level', label: 'Tier Level', sortable: true },
    { key: 'current_loyalty_points', label: 'Current Balance', sortable: true },
    { key: 'last_activity_date', label: 'Last Activity', sortable: true },
    { key: 'tier_validity', label: 'Tier Validity', sortable: true },
    { key: 'actions', label: 'View', sortable: false },
  ];

  const renderCell = (item: LoyaltyMember, columnKey: string) => {
    switch (columnKey) {
      case 'member_name':
        return `${item.firstname} ${item.lasttname}`;
      case 'tier_level':
        return item.member_status?.tier_level || 'N/A';
      case 'current_loyalty_points':
        return item.current_loyalty_points || '0';
      case 'last_activity_date':
        return item.member_status?.last_activity_date || 'N/A';
      case 'tier_validity':
        return item.member_status?.tier_validity || 'N/A';
      case 'actions':
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(item.id)}
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return item[columnKey as keyof LoyaltyMember] as React.ReactNode ?? '-';
    }
  };

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={members}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="loyalty-members"
        storageKey="loyalty-members-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search members (ID, name, tier, balance, activity, validity)..."
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching members..." : "Loading members..."}
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

export default LoyaltyMembersList;
