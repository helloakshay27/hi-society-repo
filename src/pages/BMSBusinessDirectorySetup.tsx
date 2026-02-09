import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  category: string;
  name: string;
}

const categoryColumns = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "name", label: "Category", sortable: true },
];

const subCategoryColumns = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "category", label: "Category", sortable: true },
  { key: "name", label: "Sub Category", sortable: true },
];

const BMSBusinessDirectorySetup: React.FC = () => {
  const baseUrl = localStorage.getItem("baseUrl")
  const token = localStorage.getItem("token")

  const [activeTab, setActiveTab] = useState("category");
  const [categoryInput, setCategoryInput] = useState("");
  const [subCategoryInput, setSubCategoryInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])

  // Category Edit/Delete State
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // SubCategory Edit/Delete State
  const [isEditSubCategoryOpen, setIsEditSubCategoryOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [editSubCategoryName, setEditSubCategoryName] = useState("");
  const [editSubCategoryCategoryId, setEditSubCategoryCategoryId] = useState("");
  const [isDeleteSubCategoryOpen, setIsDeleteSubCategoryOpen] = useState(false);
  const [deletingSubCategory, setDeletingSubCategory] = useState<SubCategory | null>(null);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/bd_categories.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setCategories(response.data.bd_categories)
    } catch (error) {
      console.log(error)
    }
  }

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/bd_sub_categories.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setSubCategories(response.data.bd_sub_categories)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchSubCategories()
  }, [])

  const handleAddCategory = async () => {
    try {
      if (!categoryInput.trim()) {
        toast.error("Please enter a category name");
        return;
      }

      const payload = {
        bd_category: {
          name: categoryInput,
        }
      }

      await axios.post(`https://${baseUrl}/crm/admin/bd_categories.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success(`Category added successfully`);
      setCategoryInput("");
      fetchCategories()
    } catch (error) {
      console.log(error)
    }
  };

  const handleAddSubCategory = async () => {
    try {
      if (!selectedCategory) {
        toast.error("Please select a category");
        return;
      }
      if (!subCategoryInput.trim()) {
        toast.error("Please enter a sub category name");
        return;
      }

      const payload = {
        bd_sub_category: {
          name: subCategoryInput,
          bd_category_id: selectedCategory,
          active: true
        }
      }

      await axios.post(`https://${baseUrl}/crm/admin/bd_sub_categories.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success(`Sub Category added successfully`);
      setSelectedCategory("")
      setSubCategoryInput("");
      fetchSubCategories()
    } catch (error) {
      console.log(error)
      toast.error("Failed to add sub category")
    }
  };

  const handleEditCategory = (item: Category) => {
    setEditingCategory(item);
    setEditCategoryName(item.name);
    setIsEditCategoryOpen(true);
  };

  const handleUpdateCategory = async () => {
    try {
      if (!editingCategory) return;
      if (!editCategoryName.trim()) {
        toast.error("Please enter a category name");
        return;
      }

      const payload = {
        bd_category: {
          name: editCategoryName,
        }
      }

      await axios.put(`https://${baseUrl}/crm/admin/bd_categories/${editingCategory.id}.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success(`Category updated successfully`);
      setIsEditCategoryOpen(false);
      setEditingCategory(null);
      setEditCategoryName("");
      fetchCategories();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = (item: Category) => {
    setDeletingCategory(item);
    setIsDeleteCategoryOpen(true);
  };

  const confirmDeleteCategory = async () => {
    try {
      if (!deletingCategory) return;
      await axios.delete(`https://${baseUrl}/crm/admin/bd_categories/${deletingCategory.id}.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success(`Category deleted successfully`);
      setIsDeleteCategoryOpen(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete category");
    }
  };

  const handleEditSubCategory = (item: SubCategory) => {
    setEditingSubCategory(item);
    setEditSubCategoryName(item.name);
    // Find category ID based on category name if needed, or if item has category_id available use that.
    // Assuming item.category is the name, we might need to match it to an ID or if the API returns category_id
    // For now, let's try to match by name or assume the ID is available in a real scenario.
    // However, looking at the API response structure typically, we might need the ID.
    // If the table displays 'category' as a name string, we need to find the matching ID from 'categories' state.
    const category = categories.find((c: any) => c.name === item.category);
    if (category) {
      setEditSubCategoryCategoryId(category.id);
    } else {
      // Fallback or handle if category ID is present in item
      setEditSubCategoryCategoryId((item as any).bd_category_id || "");
    }
    setIsEditSubCategoryOpen(true);
  };

  const handleUpdateSubCategory = async () => {
    try {
      if (!editingSubCategory) return;
      if (!editSubCategoryName.trim()) {
        toast.error("Please enter a sub category name");
        return;
      }
      if (!editSubCategoryCategoryId) {
        toast.error("Please select a category");
        return;
      }

      const payload = {
        bd_sub_category: {
          name: editSubCategoryName,
          bd_category_id: editSubCategoryCategoryId,
        }
      }

      await axios.put(`https://${baseUrl}/crm/admin/bd_sub_categories/${editingSubCategory.id}.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success(`Sub Category updated successfully`);
      setIsEditSubCategoryOpen(false);
      setEditingSubCategory(null);
      setEditSubCategoryName("");
      setEditSubCategoryCategoryId("");
      fetchSubCategories();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update sub category");
    }
  };

  const handleDeleteSubCategory = (item: SubCategory) => {
    setDeletingSubCategory(item);
    setIsDeleteSubCategoryOpen(true);
  };

  const confirmDeleteSubCategory = async () => {
    try {
      if (!deletingSubCategory) return;
      await axios.delete(`https://${baseUrl}/crm/admin/bd_sub_categories/${deletingSubCategory.id}.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success(`Sub Category deleted successfully`);
      setIsDeleteSubCategoryOpen(false);
      setDeletingSubCategory(null);
      fetchSubCategories();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete sub category");
    }
  };

  const renderCategoryCell = (item: Category, columnKey: string) => {
    if (columnKey === "actions") {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditCategory(item)}
            className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteCategory(item)}
            className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    return item[columnKey as keyof Category];
  };

  const renderSubCategoryCell = (item: SubCategory, columnKey: string) => {
    if (columnKey === "actions") {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditSubCategory(item)}
            className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteSubCategory(item)}
            className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    return item[columnKey as keyof SubCategory];
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border">
          <TabsTrigger value="category" className="data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none">Category</TabsTrigger>
          <TabsTrigger value="subcategory" className="data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none">Sub Category</TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="space-y-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter Category"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>
            <Button
              onClick={handleAddCategory}
              className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          <EnhancedTable
            data={categories}
            columns={categoryColumns}
            renderCell={renderCategoryCell}
            emptyMessage="No categories found"
            pagination={true}
            pageSize={10}
          />
        </TabsContent>

        <TabsContent value="subcategory" className="space-y-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter Sub Category"
                value={subCategoryInput}
                onChange={(e) => setSubCategoryInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSubCategory()}
              />
            </div>
            <Button
              onClick={handleAddSubCategory}
              className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          <EnhancedTable
            data={[...subCategories].reverse()}
            columns={subCategoryColumns}
            renderCell={renderSubCategoryCell}
            emptyMessage="No sub categories found"
            pagination={true}
            pageSize={10}
          />
        </TabsContent>
      </Tabs>


      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Enter Category Name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Alert Dialog */}
      <AlertDialog open={isDeleteCategoryOpen} onOpenChange={setIsDeleteCategoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              "{deletingCategory?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit SubCategory Dialog */}
      <Dialog open={isEditSubCategoryOpen} onOpenChange={setIsEditSubCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editSubCategoryCategoryId} onValueChange={setEditSubCategoryCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sub Category Name</Label>
              <Input
                value={editSubCategoryName}
                onChange={(e) => setEditSubCategoryName(e.target.value)}
                placeholder="Enter Sub Category Name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSubCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubCategory} className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete SubCategory Alert Dialog */}
      <AlertDialog open={isDeleteSubCategoryOpen} onOpenChange={setIsDeleteSubCategoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sub category
              "{deletingSubCategory?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSubCategory} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BMSBusinessDirectorySetup;
