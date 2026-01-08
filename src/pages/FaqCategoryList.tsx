import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

interface FaqCategory {
  id: number;
  name: string;
  site_id: string;
  active: boolean;
}

interface Permissions {
  create: string;
  update: string;
  destroy: string;
  delete: string;
  show: string;
}

const FaqCategoryList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<FaqCategory[]>([]);
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
        const faqCategoryPerms = parsedPermissions.faq_category || {};
        setPermissions(faqCategoryPerms);
      }
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
    }
  }, []);

  const fetchCategories = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/faq_categories.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch FAQ categories: ${response.statusText}`);
      }

      const data = await response.json();
      let categoriesData = [];
      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data.faq_categories) {
        categoriesData = data.faq_categories;
      } else if (Array.isArray(data.data)) {
        categoriesData = data.data;
      }
      
      // Client-side search filtering
      let filteredCategories = categoriesData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredCategories = categoriesData.filter((category: FaqCategory) =>
          category.name?.toLowerCase().includes(searchLower) ||
          category.site_id?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredCategories.sort((a: FaqCategory, b: FaqCategory) => (b.id || 0) - (a.id || 0));
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedCategories = filteredCategories.slice(startIndex, endIndex);
      
      setCategories(paginatedCategories);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredCategories.length / itemsPerPage));
      setTotalCount(filteredCategories.length);
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      toast.error('Failed to load FAQ categories.');
      setCategories([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchCategories]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEdit = (id: number) => navigate(`/settings/faq-category-form/${id}`);
  const handleAdd = () => navigate('/settings/faq-category-form');

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    const updatedStatus = !currentStatus;

    try {
      const response = await fetch(getFullUrl(`/faq_categories/${id}.json`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(),
        },
        body: JSON.stringify({ faq_category: { active: updatedStatus } }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category status');
      }

      setCategories((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, active: updatedStatus } : item
        )
      );

      toast.success('Category status updated successfully!');
      fetchCategories(currentPage, searchTerm);
    } catch (error) {
      console.error('Error updating category status:', error);
      toast.error('Failed to update category status.');
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'Sr No', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'site_id', label: 'Site ID', sortable: true },
    { key: 'active', label: 'Status', sortable: false },
  ];

  const renderCell = (item: FaqCategory, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {/* {permissions.update === "true" && ( */}
              <Button variant="ghost" size="sm" onClick={() => handleEdit(item.id)} title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            {/* )} */}
          </div>
        );
      case 'id':
        return item.id;
      case 'name':
        return item.name || '-';
      case 'site_id':
        return item.site_id || '-';
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
      default:
        return item[columnKey as keyof FaqCategory] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {/* {permissions.create === "true" && ( */}
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
        data={categories}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="faq-categories"
        storageKey="faq-categories-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search categories (name, site ID)..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching categories..." : "Loading categories..."}
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

export default FaqCategoryList;