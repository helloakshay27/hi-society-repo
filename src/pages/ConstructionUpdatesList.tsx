import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { API_CONFIG } from '@/config/apiConfig';

interface Attachment {
  document_url?: string;
  document_content_type?: string;
}

interface ConstructionUpdate {
  id: number;
  title: string;
  description: string;
  on_date: string;
  project_name: string;
  site_name: string;
  building_name: string;
  status: string;
  attachment?: Attachment;
}

interface Permissions {
  create: string;
  update: string;
  delete: string;
  show: string;
}

const ConstructionUpdatesList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [constructionUpdates, setConstructionUpdates] = useState<ConstructionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [constructionPermissions, setConstructionPermissions] = useState<Permissions>({
    create: "false",
    update: "false",
    delete: "false",
    show: "false"
  });
  const itemsPerPage = 10;

  const fetchConstructionUpdates = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}/construction_updates.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const updates = Array.isArray(response.data.construction_updates)
        ? response.data.construction_updates
        : Array.isArray(response.data)
        ? response.data
        : [];

      // Client-side search filtering
      let filteredUpdates = updates;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUpdates = updates.filter((update: ConstructionUpdate) =>
          update.title?.toLowerCase().includes(searchLower) ||
          update.description?.toLowerCase().includes(searchLower) ||
          update.project_name?.toLowerCase().includes(searchLower) ||
          update.site_name?.toLowerCase().includes(searchLower) ||
          update.building_name?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by ID descending
      filteredUpdates.sort((a: ConstructionUpdate, b: ConstructionUpdate) => b.id - a.id);

      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedUpdates = filteredUpdates.slice(startIndex, endIndex);

      setConstructionUpdates(paginatedUpdates);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredUpdates.length / itemsPerPage));
      setTotalCount(filteredUpdates.length);
    } catch (error) {
      console.error("Error fetching construction updates:", error);
      toast.error("Failed to fetch construction updates");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, itemsPerPage]);

  useEffect(() => {
    const getConstructionPermissions = () => {
      try {
        const lockRolePermissions = localStorage.getItem("lock_role_permissions");
        if (!lockRolePermissions) return { create: "false", update: "false", delete: "false", show: "false" };
        const permissions = JSON.parse(lockRolePermissions);
        return permissions.construction_updates || { create: "false", update: "false", delete: "false", show: "false" };
      } catch (e) {
        console.error("Error parsing lock_role_permissions:", e);
        return { create: "false", update: "false", delete: "false", show: "false" };
      }
    };
    const permissions = getConstructionPermissions();
    setConstructionPermissions(permissions);
  }, []);

  useEffect(() => {
    fetchConstructionUpdates(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchConstructionUpdates]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddUpdate = () => navigate("/setup-member/construction-updates-create");
  const handleEditUpdate = (id: number) => navigate(`/setup-member/construction-updates-edit/${id}`);

  const handleToggle = async (id: number, currentStatus: string) => {
    const updatedStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await axios.put(
        `${baseURL}/construction_updates/${id}.json`,
        { construction_update: { status: updatedStatus } },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Status updated successfully!");
      fetchConstructionUpdates(currentPage, searchTerm);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this construction update?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${baseURL}/construction_updates/${id}.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      toast.success("Construction update deleted successfully!");
      fetchConstructionUpdates(currentPage, searchTerm);
    } catch (error) {
      console.error("Error deleting construction update:", error);
      toast.error("Error deleting construction update. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'on_date', label: 'Date', sortable: true },
    { key: 'project_name', label: 'Project', sortable: true },
    { key: 'site_name', label: 'Site', sortable: true },
    { key: 'building_name', label: 'Building', sortable: true },
    { key: 'attachment', label: 'Attachment', sortable: false },
  ];

  const renderCell = (item: ConstructionUpdate, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {constructionPermissions.update === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleEditUpdate(item.id)} title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <button
              onClick={() => handleToggle(item.id, item.status)}
              className="text-gray-600 hover:opacity-80 transition-opacity p-1"
            >
              {item.status === "active" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" fill="#28a745" viewBox="0 0 16 16">
                  <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" fill="#6c757d" viewBox="0 0 16 16">
                  <path d="M11 4a4 4 0 0 1 0 8H8a5 5 0 0 0 2-4 5 5 0 0 0-2-4zM5 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8M0 8a5 5 0 0 0 5 5h6a5 5 0 0 0 0-10H5a5 5 0 0 0-5 5" />
                </svg>
              )}
            </button>
            {constructionPermissions.delete === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} title="Delete" className="text-red-600 hover:text-red-800">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'description':
        return (
          <div style={{ maxWidth: "250px", wordWrap: "break-word", whiteSpace: "normal", lineHeight: "1.5" }}>
            {item.description || "-"}
          </div>
        );
      case 'on_date':
        return formatDate(item.on_date);
      case 'attachment':
        if (item.attachment?.document_url) {
          const contentType = item.attachment.document_content_type || '';
          const isVideo = contentType.startsWith('video/');
          const isImage = contentType.startsWith('image/');
          
          if (isVideo) {
            return (
              <video width="80" height="80" autoPlay muted loop playsInline className="rounded-lg border border-gray-200" style={{ objectFit: "cover" }}>
                <source src={item.attachment.document_url} type={contentType} />
              </video>
            );
          } else if (isImage) {
            return (
              <img src={item.attachment.document_url} alt="Attachment" className="rounded-lg border border-gray-200" style={{ width: "80px", height: "80px", objectFit: "cover" }} />
            );
          } else {
            return <span className="text-sm text-gray-500 italic">File</span>;
          }
        }
        return <span className="text-sm text-gray-500 italic">No attachment</span>;
      default:
        return item[columnKey as keyof ConstructionUpdate] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {constructionPermissions.create === "true" && (
        <Button 
          onClick={handleAddUpdate}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add Update
        </Button>
      )}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Construction Updates List</h3>
        </div>
        <div className="p-6">
          <EnhancedTable
            data={constructionUpdates}
            columns={columns}
            renderCell={renderCell}
            enableExport={true}
            exportFileName="construction-updates"
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            searchPlaceholder="Search by title, description, project, site, or building..."
            leftActions={renderCustomActions()}
            loading={isSearching || loading}
            loadingMessage={isSearching ? "Searching updates..." : "Loading updates..."}
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
      </div>
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

export default ConstructionUpdatesList;