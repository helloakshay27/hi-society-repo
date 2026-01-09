import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';

interface FaqSubCategory {
  id: number;
  name: string;
  faq_category_id: number;
  active: boolean;
}

interface Permissions {
  create: string;
  update: string;
  destroy: string;
  delete: string;
  show: string;
}

const FaqSubCategoryList = () => {
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState<FaqSubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [permissions, setPermissions] = useState<Permissions>({
    create: '',
    update: '',
    destroy: '',
    delete: '',
    show: ''
  });
  
  const itemsPerPage = 10;

  useEffect(() => {
    try {
      const lockRolePermissions = localStorage.getItem('lock_role_permissions');
      if (lockRolePermissions) {
        const parsedPermissions = JSON.parse(lockRolePermissions);
        setPermissions(parsedPermissions.faq_sub_category || {
          create: '',
          update: '',
          destroy: '',
          delete: '',
          show: ''
        });
      }
    } catch (error) {
      console.error('Error parsing permissions:', error);
    }
  }, []);

  const fetchSubCategories = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/faq_sub_categories.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sub categories: ${response.statusText}`);
      }

      const data = await response.json();
      let subCategoriesData: FaqSubCategory[] = [];
      
      if (Array.isArray(data)) {
        subCategoriesData = data;
      } else if (data?.faq_sub_categories && Array.isArray(data.faq_sub_categories)) {
        subCategoriesData = data.faq_sub_categories;
      } else if (data?.data && Array.isArray(data.data)) {
        subCategoriesData = data.data;
      }
      
      // Client-side search filtering
      let filteredSubCategories = subCategoriesData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredSubCategories = subCategoriesData.filter((subCategory: FaqSubCategory) =>
          subCategory.name?.toLowerCase().includes(searchLower) ||
          String(subCategory.faq_category_id || '').toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredSubCategories.sort((a, b) => b.id - a.id);
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedSubCategories = filteredSubCategories.slice(startIndex, endIndex);
      
      setSubCategories(paginatedSubCategories);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredSubCategories.length / itemsPerPage));
      setTotalCount(filteredSubCategories.length);
    } catch (error) {
      console.error('Error fetching sub categories:', error);
      toast.error('Failed to load FAQ sub categories.');
      setSubCategories([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchSubCategories(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchSubCategories]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/settings/faq-subcategory/${id}`);
  };

  const handleAdd = () => {
    navigate('/settings/faq-subcategory');
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      const updatedStatus = !currentStatus;
      const response = await fetch(getFullUrl(`/faq_sub_categories/${id}.json`), {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ faq_sub_category: { active: updatedStatus } }),
      });

      if (!response.ok) {
        throw new Error('Failed to update sub category status');
      }

      toast.success('Sub category status updated successfully!');
      fetchSubCategories(currentPage, searchTerm);
    } catch (error) {
      console.error('Error updating sub category status:', error);
      toast.error('Failed to update sub category status.');
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'Sr No', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'faq_category_id', label: 'FAQ Category ID', sortable: true },
    { key: 'active', label: 'Status', sortable: true },
  ];

  const renderCell = (item: FaqSubCategory, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(item.id)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        );
      case 'active':
        return (
          <div className="flex justify-center">
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
      case 'faq_category_id':
        return item.faq_category_id || '-';
      default:
        return item[columnKey as keyof FaqSubCategory] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {/* {permissions.create === 'true' && ( */}
        <Button
          onClick={handleAdd}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Add
        </Button>
      {/* )} */}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={subCategories}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="faq-sub-categories"
        storageKey="faq-sub-categories-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search sub categories (name, category ID)..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching sub categories..." : "Loading sub categories..."}
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

export default FaqSubCategoryList;