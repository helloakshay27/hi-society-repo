import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface Attachment {
  document_file_name: string;
  document_url: string;
  document_content_type: string;
}

interface Configuration {
  id: number;
  name: string;
  active: boolean;
  attachfile?: Attachment;
}

interface Permissions {
  create: string;
  update: string;
  delete: string;
  show: string;
}

const ProjectConfigurationList = () => {
  const navigate = useNavigate();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [permissions, setPermissions] = useState<Permissions>({
    create: 'false',
    update: 'false',
    delete: 'false',
    show: 'false'
  });
  const itemsPerPage = 10;

  const fetchConfigurations = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/configuration_setups.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch configurations: ${response.statusText}`);
      }

      const data = await response.json();
      const configurationsData = Array.isArray(data) ? data : [];
      
      // Client-side search filtering
      let filteredConfigurations = configurationsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredConfigurations = configurationsData.filter((config: Configuration) =>
          config.name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredConfigurations.sort((a: Configuration, b: Configuration) => b.id - a.id);
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedConfigurations = filteredConfigurations.slice(startIndex, endIndex);
      
      setConfigurations(paginatedConfigurations);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredConfigurations.length / itemsPerPage));
      setTotalCount(filteredConfigurations.length);
    } catch (err) {
      toast.error('Failed to fetch project configurations');
      console.error('Error fetching configurations:', err);
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
          setPermissions(permissions.project_config || {
            create: 'false',
            update: 'false',
            delete: 'false',
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
    fetchConfigurations(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchConfigurations]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddConfiguration = () => navigate('/setup-member/project-configuration');
  const handleEditConfiguration = (id: number) => navigate(`/setup-member/project-config-edit/${id}`);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(getFullUrl(`/configuration_setups/${id}.json`), {
        method: 'PATCH',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status updated successfully!');
      fetchConfigurations(currentPage, searchTerm);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'attachment', label: 'Attachment', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
  ];

  const renderCell = (item: Configuration, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {permissions.update === 'true' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleEditConfiguration(item.id)} 
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'attachment':
        if (item.attachfile?.document_file_name) {
          if (item.attachfile.document_content_type?.startsWith('image/')) {
            return (
              <img
                src={item.attachfile.document_url}
                alt="Attachment"
                className="rounded-lg border border-gray-200 mx-auto"
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
              />
            );
          } else {
            return (
              <a
                href={item.attachfile.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {item.attachfile.document_file_name}
              </a>
            );
          }
        }
        return <span className="text-sm text-gray-500 italic">No attachment</span>;
      case 'status':
        return (
          <div className="flex justify-center">
            {permissions.show === 'true' && (
              <button
                onClick={() => handleToggleStatus(item.id, item.active)}
                className="text-gray-600 hover:opacity-80 transition-opacity"
              >
                {item.active ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" fill="#28a745" viewBox="0 0 16 16">
                    <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" fill="#6c757d" viewBox="0 0 16 16">
                    <path d="M11 4a4 4 0 0 1 0 8H8a5 5 0 0 0 2-4 5 5 0 0 0-2-4zM5 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8M0 8a5 5 0 0 0 5 5h6a5 5 0 0 0 0-10H5a5 5 0 0 0-5 5" />
                  </svg>
                )}
              </button>
            )}
          </div>
        );
      default:
        return item[columnKey as keyof Configuration] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2">
      {permissions.create === 'true' && (
        <Button 
          onClick={handleAddConfiguration}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add Configuration
        </Button>
      )}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={configurations}
        columns={columns}
        renderCell={renderCell}
        enableExport={true}
        exportFileName="project-configurations"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search configurations..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching configurations..." : "Loading configurations..."}
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

export default ProjectConfigurationList;
