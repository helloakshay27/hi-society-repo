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
      const response = await axios.get(`https://${baseUrl}/`)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchCategories()
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

  const handleAddSubCategory = () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }
    if (!subCategoryInput.trim()) {
      toast.error("Please enter a sub category name");
      return;
    }
    toast.success(`Sub Category "${subCategoryInput}" added`);
    setSubCategoryInput("");
  };

  const handleEditCategory = (item: Category) => {
    toast.info(`Edit category: ${item.name}`);
  };

  const handleDeleteCategory = (item: Category) => {
    toast.success(`Category "${item.name}" deleted`);
  };

  const handleEditSubCategory = (item: SubCategory) => {
    toast.info(`Edit sub category: ${item.name}`);
  };

  const handleDeleteSubCategory = (item: SubCategory) => {
    toast.success(`Sub Category "${item.name}" deleted`);
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
            pagination={false}
            storageKey="business-categories-table"
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
                    <SelectItem key={cat.id} value={cat.name}>
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
            data={subCategories}
            columns={subCategoryColumns}
            renderCell={renderSubCategoryCell}
            emptyMessage="No sub categories found"
            pagination={false}
            storageKey="business-subcategories-table"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BMSBusinessDirectorySetup;
