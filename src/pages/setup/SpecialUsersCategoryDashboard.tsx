import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
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

// Column configuration
const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false, draggable: false },
  { key: "sNo", label: "S No", sortable: true, draggable: true },
  { key: "categoryName", label: "Category Name", sortable: true, draggable: true },
];

export const SpecialUsersCategoryDashboard = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Render cell content based on column key
  const renderCell = (category: any, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleEditCategory(category.id)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
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
        <div className="bg-[#F6F4EE] rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">Special Users Category</h1>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#fafafa] rounded-lg shadow-sm">
          <EnhancedTable
            columns={columns}
            data={categories}
            onRowClick={(category) => console.log("Row clicked:", category)}
            renderCell={renderCell}
            selectedItems={selectedCategories}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectCategory}
            enableSelection={true}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search..."
            leftActions={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddCategory}
                  className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white border-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            }
          />
        </div>

        {/* Add Category Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold">Add Category</DialogTitle>
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="categoryName" className="text-sm font-medium text-gray-700">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="categoryName"
                  placeholder="Enter Category Name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowAddDialog(false)}
                  className="px-6 py-2 bg-[#F2EEE9] hover:bg-[#F2EEE9] text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitCategory}
                  disabled={isLoading}
                  className="px-6 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
                >
                  {isLoading ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold">Edit Category</DialogTitle>
                <button
                  onClick={() => {
                    setShowEditDialog(false);
                    setCategoryName("");
                    setEditingCategory(null);
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="editCategoryName" className="text-sm font-medium text-gray-700">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editCategoryName"
                  placeholder="Enter Category Name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowEditDialog(false);
                    setCategoryName("");
                    setEditingCategory(null);
                  }}
                  variant="outline"
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitEdit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
                >
                  {isLoading ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SpecialUsersCategoryDashboard;
