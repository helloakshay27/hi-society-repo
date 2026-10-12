import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, X, Eye, Pencil } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

// Column configuration
const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false, draggable: false },
  { key: "sNo", label: "S No", sortable: true, draggable: true },
  { key: "categoryName", label: "Category Name", sortable: true, draggable: true },
];

export const SpecialUsersCategoryDashboard = () => {
  const { shouldShow } = useDynamicPermissions();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories from API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${HI_SOCIETY_CONFIG.BASE_URL}${HI_SOCIETY_CONFIG.ENDPOINTS.USER_CATEGORIES}?token=${HI_SOCIETY_CONFIG.TOKEN}`);
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      
      // Transform API data to match our table format
      const transformedData = data.map((category: any, index: number) => ({
        id: category.id.toString(),
        sNo: index + 1,
        categoryName: category.name,
      }));
      
      setCategories(transformedData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    setShowAddDialog(true);
  };

  const handleSubmitCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${HI_SOCIETY_CONFIG.BASE_URL}${HI_SOCIETY_CONFIG.ENDPOINTS.USER_CATEGORIES}?token=${HI_SOCIETY_CONFIG.TOKEN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_category: {
            name: categoryName,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add category");
      }

      toast.success("Category added successfully!");
      setCategoryName("");
      setShowAddDialog(false);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(categories.map((c) => c.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    }
  };

  const handleEditCategory = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.categoryName);
      setShowEditDialog(true);
    }
  };

  const handleSubmitEdit = async () => {
    if (!categoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${HI_SOCIETY_CONFIG.BASE_URL}${HI_SOCIETY_CONFIG.ENDPOINTS.USER_CATEGORY_DETAILS}/${editingCategory.id}.json?token=${HI_SOCIETY_CONFIG.TOKEN}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_category: {
              name: categoryName,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      toast.success("Category updated successfully!");
      setCategoryName("");
      setEditingCategory(null);
      setShowEditDialog(false);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${HI_SOCIETY_CONFIG.BASE_URL}${HI_SOCIETY_CONFIG.ENDPOINTS.USER_CATEGORY_DETAILS}/${categoryId}.json?token=${HI_SOCIETY_CONFIG.TOKEN}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      toast.success("Category deleted successfully!");
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(categories.length / PAGE_SIZE) || 1;
  const paginatedCategories = categories.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 5;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  // Render cell content based on column key
  const renderCell = (category: any, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center gap-2">
            {shouldShow("Special Users Category", "show") && (
              <button
                onClick={() => navigate(`/setup/special-users-category/${category.id}`)}
                className="p-1 hover:bg-gray-100 rounded"
                title="View"
              >
                <Eye className="w-4 h-4 text-gray-700" />
              </button>
            )}
            {shouldShow("Special Users Category", "update") && (
              <button
                onClick={() => handleEditCategory(category.id)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDeleteCategory(category.id)}
              className="p-1 hover:bg-gray-100 rounded text-red-600"
              title="Delete"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      case "sNo":
        return (
          <div className="text-center">
            <span className="text-sm text-gray-900">{category.sNo}</span>
          </div>
        );
      case "categoryName":
        return (
          <div className="text-center">
            <span className="text-sm text-gray-900">{category.categoryName || "-"}</span>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <span className="text-sm text-gray-900">{category[columnKey] || "-"}</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-3">
          <div className="py-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Special Users Category
            </h1>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#fafafa] rounded-lg">
          <EnhancedTable
            storageKey="special-users-category-dashboard-table"
            columns={columns}
            data={paginatedCategories}
            onRowClick={(category) => console.log("Row clicked:", category)}
            renderCell={renderCell}
            selectedItems={selectedCategories}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectCategory}
            enableSelection={true}
            searchTerm={searchTerm}
            onSearchChange={(term) => {
              setSearchTerm(term);
              setCurrentPage(1);
            }}
            searchPlaceholder="Search..."
            loading={isLoading}
            leftActions={
              <div className="flex gap-2">
                {shouldShow("Special Users Category", "create") && (
                  <Button
                    size="sm"
                    onClick={handleAddCategory}
variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium"                   >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                )}
              </div>
            }
          />

          {categories.length > 0 && (
            <div className="p-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* Add Category Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md bg-white rounded-2xl border border-[rgba(26,26,24,.09)] focus:outline-none focus-visible:outline-none">
            <DialogHeader className="border-b border-[rgba(26,26,24,.09)] pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold text-[#1A1A18]">Add Category</DialogTitle>
                <button
                  onClick={() => setShowAddDialog(false)}
                  type="button"
                  aria-label="Close"
                  className="flex items-center justify-center w-8 h-8 rounded-md text-[rgba(26,26,24,.68)] hover:bg-[#F5F4F0] hover:text-[#1A1A18] transition-colors focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="pt-2 space-y-6">
              <div className="relative">
                <Label
                  htmlFor="categoryName"
                  className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10"
                >
                  Category Name <span className="text-[#1A1A18]">*</span>
                </Label>
                <Input
                  id="categoryName"
                  placeholder="Enter Category Name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full h-12 rounded-md border-[#ddd] hover:border-[#1A1A18] focus-visible:border-[#1A1A18] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                
                  className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCategory}
                  disabled={isLoading}
                
                  className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
                >
                  {isLoading ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md bg-white rounded-2xl border border-[rgba(26,26,24,.09)] focus:outline-none focus-visible:outline-none">
            <DialogHeader className="border-b border-[rgba(26,26,24,.09)] pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold text-[#1A1A18]">Edit Category</DialogTitle>
                <button
                  onClick={() => {
                    setShowEditDialog(false);
                    setCategoryName("");
                    setEditingCategory(null);
                  }}
                  type="button"
                  aria-label="Close"
                  className="flex items-center justify-center w-8 h-8 rounded-md text-[rgba(26,26,24,.68)] hover:bg-[#F5F4F0] hover:text-[#1A1A18] transition-colors focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="pt-2 space-y-6">
              <div className="relative">
                <Label
                  htmlFor="editCategoryName"
                  className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10"
                >
                  Category Name <span className="text-[#1A1A18]">*</span>
                </Label>
                <Input
                  id="editCategoryName"
                  placeholder="Enter Category Name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full h-12 rounded-md border-[#ddd] hover:border-[#1A1A18] focus-visible:border-[#1A1A18] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDialog(false);
                    setCategoryName("");
                    setEditingCategory(null);
                  }}
                
                  className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitEdit}
                  disabled={isLoading}
                
                  className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
                >
                  {isLoading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SpecialUsersCategoryDashboard;
