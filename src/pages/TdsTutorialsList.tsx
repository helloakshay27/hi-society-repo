import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface Attachment {
  document_url: string;
  document_content_type: string;
}

interface Tutorial {
  id: number;
  name?: string;
  title?: string;
  description?: string;
  attachment?: Attachment;
}

interface Permissions {
  create: string;
  update: string;
  destroy: string;
  show: string;
}

const TdsTutorialList = () => {
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [permissions, setPermissions] = useState<Permissions>({
    create: 'false',
    update: 'false',
    destroy: 'false',
    show: 'false'
  });
  const itemsPerPage = 10;

  const fetchTutorials = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/tds_tutorials.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tutorials: ${response.statusText}`);
      }

      const data = await response.json();
      const tutorialsData = data.tds_tutorials || data || [];
      
      // Client-side search filtering
      let filteredTutorials = tutorialsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredTutorials = tutorialsData.filter((tutorial: Tutorial) =>
          tutorial.name?.toLowerCase().includes(searchLower) ||
          tutorial.title?.toLowerCase().includes(searchLower) ||
          tutorial.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredTutorials.sort((a: Tutorial, b: Tutorial) => b.id - a.id);
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedTutorials = filteredTutorials.slice(startIndex, endIndex);
      
      setTutorials(paginatedTutorials);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredTutorials.length / itemsPerPage));
      setTotalCount(filteredTutorials.length);
    } catch (err) {
      toast.error('Failed to fetch TDS tutorials');
      console.error('Error fetching tutorials:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const getPermissions = () => {
      try {
        const lockRolePermissions = localStorage.getItem('lock_role_permissions');
        if (lockRolePermissions) {
          const permissions = JSON.parse(lockRolePermissions);
          setPermissions(permissions.tds_tutorials || {
            create: 'false',
            update: 'false',
            destroy: 'false',
            show: 'false'
          });
        }
      } catch (e) {
        console.error('Error parsing lock_role_permissions:', e);
      }
    };
    getPermissions();
  }, []);

  useEffect(() => {
    fetchTutorials(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchTutorials]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddTutorial = () => navigate('/setup-member/tds-tutorials-create');

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this tutorial?')) {
      return;
    }

    try {
      const response = await fetch(getFullUrl(`/tds_tutorials/${id}.json`), {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete tutorial');
      }

      toast.success('Tutorial deleted successfully!');
      fetchTutorials(currentPage, searchTerm);
    } catch (err) {
      console.error('Error deleting tutorial:', err);
      toast.error('Failed to delete tutorial.');
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'attachment', label: 'Attachment', sortable: false },
  ];

  const renderCell = (item: Tutorial, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex justify-center">
            {permissions.destroy === 'true' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:text-red-800"
                title="Delete Tutorial"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'name':
        return item.name || item.title || '-';
      case 'attachment':
        return (
          <div className="flex justify-center items-center">
            {item.attachment?.document_url ? (
              item.attachment.document_content_type?.startsWith('video/') ? (
                <video
                  width="100"
                  height="65"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="rounded-lg border border-gray-200"
                  style={{ objectFit: 'cover' }}
                >
                  <source
                    src={item.attachment.document_url}
                    type={item.attachment.document_content_type}
                  />
                </video>
              ) : item.attachment.document_content_type?.startsWith('image/') ? (
                <img
                  src={item.attachment.document_url}
                  alt="Tutorial"
                  className="rounded-lg border border-gray-200"
                  style={{
                    maxWidth: '100px',
                    maxHeight: '100px',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <a
                  href={item.attachment.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      stroke="#1C1B1F"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )
            ) : (
              <span className="text-sm text-gray-500 italic">No attachment</span>
            )}
          </div>
        );
      default:
        return item[columnKey as keyof Tutorial] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2">
      {totalCount < 1 && permissions.create === 'true' && (
        <Button 
          onClick={handleAddTutorial}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add Tutorial
        </Button>
      )}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={tutorials}
        columns={columns}
        renderCell={renderCell}
        enableExport={true}
        exportFileName="tds-tutorials"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search tutorials..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching tutorials..." : "Loading tutorials..."}
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
      <div className="w-full">
        {renderListTab()}
      </div>
    </div>
  );
};

export default TdsTutorialList;

