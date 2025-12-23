import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

interface Attachment {
  document_url: string;
  document_content_type: string;
}

interface PlusService {
  id: number;
  name: string;
  description: string;
  active: boolean;
  attachment?: Attachment;
}

interface Permissions {
  create: string;
  update: string;
  destroy: string;
  delete: string;
  show: string;
}

const PlusServicesList = () => {
  const navigate = useNavigate();
  const [plusServices, setPlusServices] = useState<PlusService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [permissions, setPermissions] = useState<Permissions>({
    create: "false",
    update: "false",
    destroy: "false",
    delete: "false",
    show: "false"
  });
  const itemsPerPage = 10;

  useEffect(() => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (lockRolePermissions) {
        const parsedPermissions = JSON.parse(lockRolePermissions);
        const plusServicesPerms = parsedPermissions.plus_services || {};
        setPermissions(plusServicesPerms);
      }
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
    }
  }, []);

  const fetchPlusServices = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/plus_services.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plus services: ${response.statusText}`);
      }

      const data = await response.json();
      const servicesData = data?.plus_services || data || [];
      
      // Client-side search filtering
      let filteredServices = servicesData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredServices = servicesData.filter((service: PlusService) =>
          service.name?.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredServices.sort((a: PlusService, b: PlusService) => b.id - a.id);
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedServices = filteredServices.slice(startIndex, endIndex);
      
      setPlusServices(paginatedServices);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredServices.length / itemsPerPage));
      setTotalCount(filteredServices.length);
    } catch (error) {
      console.error('Error fetching plus services:', error);
      toast.error('Failed to fetch plus services');
      setPlusServices([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchPlusServices(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchPlusServices]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddService = () => navigate('/setup-member/plus-services-create');
  const handleEditService = (id: number) => navigate(`/setup-member/plus-services-edit/${id}`);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    const updatedStatus = !currentStatus;

    try {
      const response = await fetch(getFullUrl(`/plus_services/${id}.json`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(),
        },
        body: JSON.stringify({ plus_service: { active: updatedStatus } }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setPlusServices((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, active: updatedStatus } : item
        )
      );

      toast.success('Status updated successfully!');
      fetchPlusServices(currentPage, searchTerm);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status.');
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'Sr No', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'attachment', label: 'Attachment', sortable: false },
  ];

  const renderCell = (item: PlusService, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            {permissions.update === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleEditService(item.id)} title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <button
              onClick={() => handleToggle(item.id, item.active)}
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
          </div>
        );
      case 'id':
        return item.id;
      case 'name':
        return item.name || '-';
      case 'description':
        return item.description || '-';
      case 'attachment':
        if (item.attachment?.document_url) {
          if (item.attachment.document_content_type?.startsWith('video/')) {
            return (
              <video
                width="80"
                height="80"
                autoPlay
                muted
                loop
                playsInline
                className="rounded-lg border border-gray-200"
                style={{ objectFit: 'cover' }}
              >
                <source src={item.attachment.document_url} type={item.attachment.document_content_type} />
              </video>
            );
          } else if (item.attachment.document_content_type?.startsWith('image/')) {
            return (
              <img
                src={item.attachment.document_url}
                alt="Service"
                className="rounded-lg border border-gray-200"
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
              />
            );
          } else {
            return (
              <a
                href={item.attachment.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Download
              </a>
            );
          }
        }
        return <span className="text-sm text-gray-500 italic">No attachment</span>;
      default:
        return item[columnKey as keyof PlusService] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {permissions.create === "true" && (
        <Button 
          onClick={handleAddService}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add Service
        </Button>
      )}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={plusServices}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="plus-services"
        storageKey="plus-services-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search services (name, description)..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching services..." : "Loading services..."}
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

export default PlusServicesList;
