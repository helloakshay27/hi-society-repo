import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import axios from 'axios';

interface Deviation {
  id: number;
  created_at: string;
  updated_at: string;
  status: string;
  user: {
    id: number;
    email: string;
  };
  fitout_request: {
    id: number;
  };
  attachments: any[];
  comments: any[];
}

interface DeviationDetail {
  flat_id: number | null;
  society_flat?: {
    id: number;
    flat_no: string;
    block_no: string | null;
  };
  deviations: Deviation[];
}

interface FitoutDeviation {
  id: number;
  tower: string;
  flat: string;
  status: string;
  deviationCount: number;
}

const FitoutDeviations: React.FC = () => {
  const navigate = useNavigate();
  const baseURL = API_CONFIG.BASE_URL;
  const [deviations, setDeviations] = useState<FitoutDeviation[]>([]);
  const [allDeviations, setAllDeviations] = useState<FitoutDeviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchDeviations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${baseURL}/crm/admin/deviation_details.json`, {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      const deviationDetails: DeviationDetail[] = response.data.deviation_details || [];
      
      // Transform the API data into table format
      const transformedData: FitoutDeviation[] = deviationDetails
        .filter((detail) => detail.flat_id !== null && detail.society_flat)
        .map((detail, index) => ({
          id: detail.flat_id || index,
          tower: detail.society_flat?.block_no || '-',
          flat: detail.society_flat?.flat_no || '-',
          status: getMostRecentStatus(detail.deviations),
          deviationCount: detail.deviations.length,
        }));
      
      setAllDeviations(transformedData);
      setTotalPages(Math.ceil(transformedData.length / itemsPerPage));
      
    } catch (err) {
      setError('Failed to fetch fitout deviations.');
      toast.error('Failed to fetch fitout deviations.');
      console.error('Error fetching fitout deviations:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL]);

  // Helper function to get the most recent deviation status
  const getMostRecentStatus = (deviations: Deviation[]): string => {
    if (deviations.length === 0) return 'Unknown';
    
    // Sort by updated_at or created_at to get the most recent
    const sortedDeviations = [...deviations].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    });
    
    return sortedDeviations[0].status || 'Pending';
  };

  useEffect(() => {
    fetchDeviations();
  }, [fetchDeviations]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const filteredDeviations = useMemo(() => {
    let filtered = allDeviations;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = allDeviations.filter((deviation) =>
        deviation.tower?.toLowerCase().includes(searchLower) ||
        deviation.flat?.toLowerCase().includes(searchLower) ||
        deviation.status?.toLowerCase().includes(searchLower)
      );
    }
    
    // Update total pages based on filtered results
    const pages = Math.ceil(filtered.length / itemsPerPage);
    if (pages !== totalPages) {
      setTotalPages(pages);
    }
    
    // Apply pagination only when not searching
    if (!searchTerm) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filtered.slice(startIndex, endIndex);
    }
    
    return filtered;
  }, [allDeviations, searchTerm, currentPage, itemsPerPage, totalPages]);
  
  const handleAddDeviation = () => {
    // TODO: Navigate to create page
    toast.info('Add Fitout Deviation - Coming soon');
  };

  const handleViewDeviation = (id: number) => {
    navigate(`/fitout/deviation-details/${id}`);
  };

  const handleEditDeviation = (id: number) => {
    // TODO: Navigate to edit page
    toast.info(`Edit Fitout Deviation #${id} - Coming soon`);
  };

  const columns = [
    { key: 'actions', label: 'Actions', sortable: false },
    { key: 'tower', label: 'Tower', sortable: true },
    { key: 'flat', label: 'Flat', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ];

  const renderCell = (item: FitoutDeviation, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleViewDeviation(item.id)} title="View">
              <Eye className="w-4 h-4 text-gray-700" />
            </Button>
          </div>
        );
      case 'tower':
        return item.tower ?? '-';
      case 'flat':
        return item.flat ?? '-';
      case 'status':
        return (
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.status === 'Complied' 
                ? 'bg-green-100 text-green-800' 
                : item.status === 'Pending'
                ? 'bg-yellow-100 text-yellow-800'
                : item.status === 'Work In Progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {item.status}
          </span>
        );
      default:
        return item[columnKey as keyof FitoutDeviation] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {/* <Button 
        onClick={handleAddDeviation}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
        Add
      </Button> */}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <>
        <EnhancedTable
          data={filteredDeviations}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="fitout-deviations"
          storageKey="fitout-deviations-table"
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search deviations (tower, flat, status)..."
          leftActions={renderCustomActions()}
          loading={loading}
        />
        {!searchTerm && totalPages > 1 && (
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
      </>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">
        {renderListTab()}
      </div>
    </div>
  );
};

export default FitoutDeviations;
