import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
import { FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const fieldStyles = {
  height: '45px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-root': {
    height: '45px',
    '& fieldset': {
      borderColor: '#ddd',
    },
    '&:hover fieldset': {
      borderColor: '#C72030',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#C72030',
    },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: '#C72030',
    },
  },
};

const selectMenuProps = {
  PaperProps: {
    style: {
      maxHeight: 224,
      backgroundColor: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      zIndex: 9999,
    },
  },
  disablePortal: false,
  disableAutoFocus: true,
  disableEnforceFocus: true,
};
const PAGE_SIZE = 10;

const buildPaginationItems = (
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
) => {
  if (!totalPages || totalPages <= 0) {
    return null;
  }
  const items = [];
  const showEllipsis = totalPages > 7;

  if (showEllipsis) {
    items.push(
      <PaginationItem key={1} className="cursor-pointer">
        <PaginationLink onClick={() => onPageChange(1)} isActive={currentPage === 1}>
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
            <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
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
            <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
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
              <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
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
          <PaginationLink onClick={() => onPageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
  } else {
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <PaginationItem key={i} className="cursor-pointer">
          <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
  }

  return items;
};

const PaginationBar: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => (
  <div className="mt-4 flex justify-center">
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        {buildPaginationItems(currentPage, totalPages, onPageChange)}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>
);

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
  { key: "bd_category_name", label: "Category", sortable: true },
  { key: "name", label: "Sub Category", sortable: true },
];

const BMSBusinessDirectorySetup: React.FC = () => {
  const baseUrl = localStorage.getItem("baseUrl")
  const token = localStorage.getItem("token")
      const { shouldShow } = useDynamicPermissions();
  const [activeTab, setActiveTab] = useState("category");
  const [categoryInput, setCategoryInput] = useState("");
  const [subCategoryInput, setSubCategoryInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryPage, setCategoryPage] = useState(1)
  const [subCategoryPage, setSubCategoryPage] = useState(1)

  // Category Add/Edit/Delete State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [addCategoryName, setAddCategoryName] = useState("");
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // SubCategory Add/Edit/Delete State
  const [isAddSubCategoryOpen, setIsAddSubCategoryOpen] = useState(false);
  const [addSubCategoryName, setAddSubCategoryName] = useState("");
  const [addSubCategoryCategoryId, setAddSubCategoryCategoryId] = useState("");
  const [isEditSubCategoryOpen, setIsEditSubCategoryOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [editSubCategoryName, setEditSubCategoryName] = useState("");
  const [editSubCategoryCategoryId, setEditSubCategoryCategoryId] = useState("");
  const [isDeleteSubCategoryOpen, setIsDeleteSubCategoryOpen] = useState(false);
  const [deletingSubCategory, setDeletingSubCategory] = useState<SubCategory | null>(null);

  const fetchCategories = async () => {
    const response = await axios.get(`https://${baseUrl}/crm/admin/bd_categories.json`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    setCategories(response.data.bd_categories)
  }

  const fetchSubCategories = async () => {
    const response = await axios.get(`https://${baseUrl}/crm/admin/bd_sub_categories.json`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    setSubCategories(response.data.bd_sub_categories)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchCategories().catch(() => {}),
      fetchSubCategories().catch(() => {})
    ]).finally(() => setLoading(false))
  }, [])

  const handleOpenAddCategory = () => {
    setAddCategoryName("");
    setIsAddCategoryOpen(true);
  };

  const handleAddCategory = async () => {
    try {
      if (!addCategoryName.trim()) {
        toast.error("Please enter a category name");
        return;
      }

      const payload = {
        bd_category: {
          name: addCategoryName,
        }
      }

      await axios.post(`https://${baseUrl}/crm/admin/bd_categories.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success(`Category added successfully`);
      setIsAddCategoryOpen(false);
      setAddCategoryName("");
      fetchCategories()
    } catch (error) {
      console.log(error)
    }
  };

  const handleOpenAddSubCategory = () => {
    setAddSubCategoryName("");
    setAddSubCategoryCategoryId("");
    setIsAddSubCategoryOpen(true);
  };

  const handleAddSubCategory = async () => {
    try {
      if (!addSubCategoryCategoryId) {
        toast.error("Please select a category");
        return;
      }
      if (!addSubCategoryName.trim()) {
        toast.error("Please enter a sub category name");
        return;
      }

      const payload = {
        bd_sub_category: {
          name: addSubCategoryName,
          bd_category_id: addSubCategoryCategoryId,
          active: true
        }
      }

      await axios.post(`https://${baseUrl}/crm/admin/bd_sub_categories.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      toast.success(`Sub Category added successfully`);
      setIsAddSubCategoryOpen(false);
      setAddSubCategoryCategoryId("")
      setAddSubCategoryName("");
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
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteCategory(item)}
            className="h-8 w-8 p-0 text-red-600"
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
          {shouldShow("Setup","update")&&(
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditSubCategory(item)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>)}
          {shouldShow("Setup","destroy")&&(
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteSubCategory(item)}
            className="h-8 w-8 p-0 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>)}
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
          <div className="flex justify-start">
            {shouldShow("Setup","create")&&(
            <Button
              onClick={handleOpenAddCategory}
              variant="ghost"
              className="!bg-[var(--color-primary,#da7756)] hover:!bg-[var(--color-primary-hover,rgba(218,119,86,0.85))] !text-white [&_svg]:!text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>)}
          </div>

          <EnhancedTable
            data={categories.slice((categoryPage - 1) * PAGE_SIZE, categoryPage * PAGE_SIZE)}
            columns={categoryColumns}
            renderCell={renderCategoryCell}
            loading={loading}
            emptyMessage="No categories found"
            pagination={false}
          />
          <PaginationBar
            currentPage={categoryPage}
            totalPages={Math.ceil(categories.length / PAGE_SIZE) || 1}
            onPageChange={setCategoryPage}
          />
        </TabsContent>

        <TabsContent value="subcategory" className="space-y-6">
          <div className="flex justify-start">
            <Button
              onClick={handleOpenAddSubCategory}
              variant="ghost"
              className="!bg-[var(--color-primary,#da7756)] hover:!bg-[var(--color-primary-hover,rgba(218,119,86,0.85))] !text-white [&_svg]:!text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          <EnhancedTable
            data={[...subCategories].reverse().slice((subCategoryPage - 1) * PAGE_SIZE, subCategoryPage * PAGE_SIZE)}
            columns={subCategoryColumns}
            renderCell={renderSubCategoryCell}
            loading={loading}
            emptyMessage="No sub categories found"
            pagination={false}
          />
          <PaginationBar
            currentPage={subCategoryPage}
            totalPages={Math.ceil(subCategories.length / PAGE_SIZE) || 1}
            onPageChange={setSubCategoryPage}
          />
        </TabsContent>
      </Tabs>


      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={addCategoryName}
                onChange={(e) => setAddCategoryName(e.target.value)}
                placeholder="Enter Category Name"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white  flex items-center gap-2">
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button onClick={handleUpdateCategory} className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white  flex items-center gap-2">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sub Category Dialog */}
      <Dialog open={isAddSubCategoryOpen} onOpenChange={setIsAddSubCategoryOpen} modal={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sub Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormControl
              fullWidth
              variant="outlined"
              required
              sx={{ '& .MuiInputBase-root': fieldStyles }}
            >
              <InputLabel shrink>Category</InputLabel>
              <MuiSelect
                value={addSubCategoryCategoryId}
                onChange={(e) => setAddSubCategoryCategoryId(e.target.value)}
                label="Category"
                notched
                displayEmpty
                MenuProps={selectMenuProps}
              >
                <MenuItem value="">Select Category*</MenuItem>
                {categories.map((cat: any) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <div className="space-y-2">
              <Label>Sub Category Name</Label>
              <Input
                value={addSubCategoryName}
                onChange={(e) => setAddSubCategoryName(e.target.value)}
                placeholder="Enter Sub Category Name"
                onKeyDown={(e) => e.key === "Enter" && handleAddSubCategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSubCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubCategory} className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white  flex items-center gap-2">
              Add
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
      <Dialog open={isEditSubCategoryOpen} onOpenChange={setIsEditSubCategoryOpen} modal={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormControl
              fullWidth
              variant="outlined"
              required
              sx={{ '& .MuiInputBase-root': fieldStyles }}
            >
              <InputLabel shrink>Category</InputLabel>
              <MuiSelect
                value={editSubCategoryCategoryId}
                onChange={(e) => setEditSubCategoryCategoryId(e.target.value)}
                label="Category"
                notched
                displayEmpty
                MenuProps={selectMenuProps}
              >
                <MenuItem value="">Select Category*</MenuItem>
                {categories.map((cat: any) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
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
            <Button onClick={handleUpdateSubCategory} className="px-8 border-0 bg-[#C72030] hover:bg-[#A01828] !text-white  flex items-center gap-2">
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
