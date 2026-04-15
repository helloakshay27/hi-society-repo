import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Edit, Trash2, Plus } from 'lucide-react';

interface SubCategoryItem {
  id: number;
  issue_type_id: number | null;
  issue_type: string | null;
  category_id: number;
  category_type: string | null;
  sub_category: string;
  helpdesk_text: string;
  active: number | null;
}

interface IssueType {
  id: number;
  name: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

export const SubCategoryTab: React.FC = () => {
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create form state
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [helpdeskText, setHelpdeskText] = useState('');

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryItem | null>(null);
  const [editIssueType, setEditIssueType] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubCategoryName, setEditSubCategoryName] = useState('');
  const [editHelpdeskText, setEditHelpdeskText] = useState('');

  // Fetch all data from separate APIs
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [issueTypesRes, categoriesRes, subCategoriesRes] = await Promise.all([
        fetch(getFullUrl('/user/issue_type.json'), {
          headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        }),
        fetch(getFullUrl('/crm/admin/helpdesk_categories.json'), {
          headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        }),
        fetch(getFullUrl('/crm/admin/helpdesk_sub_categories.json'), {
          headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        }),
      ]);

      if (issueTypesRes.ok) {
        const data = await issueTypesRes.json();
        setIssueTypes(
          (data.data || []).map((it: { id: number; name: string }) => ({
            id: it.id,
            name: it.name,
          }))
        );
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        const cats = Array.isArray(data) ? data : (data.helpdesk_categories || []);
        setCategories(
          cats.map((cat: { id: number; name: string }) => ({
            id: cat.id,
            name: cat.name,
          }))
        );
      }

      if (subCategoriesRes.ok) {
        const data = await subCategoriesRes.json();
        setSubCategories(data.helpdesk_sub_categories || []);
      }

      if (!issueTypesRes.ok || !categoriesRes.ok || !subCategoriesRes.ok) {
        toast.error('Failed to fetch some data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Get issue type name by ID
  const getIssueTypeName = (issueTypeId: number | null) => {
    if (!issueTypeId) return '--';
    const issueType = issueTypes.find(it => it.id === issueTypeId);
    return issueType?.name || '--';
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || '--';
  };

  // Handle create submit
  const handleCreateSubmit = async () => {
    if (!selectedIssueType) {
      toast.error('Please select issue type');
      return;
    }
    if (!selectedCategory) {
      toast.error('Please select category');
      return;
    }
    if (!subCategoryName.trim()) {
      toast.error('Please enter sub-category name');
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        helpdesk_sub_category: {
          issue_type_id: selectedIssueType,
          helpdesk_category_id: selectedCategory,
          name: subCategoryName.trim(),
        },
      };

      if (helpdeskText.trim()) {
        (body.helpdesk_sub_category as Record<string, unknown>).helpdesk_text = helpdeskText.trim();
      }

      const response = await fetch(
        getFullUrl('/crm/admin/create_helpdesk_sub_category.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toast.success('Sub-category created successfully!');
        setSelectedIssueType('');
        setSelectedCategory('');
        setSubCategoryName('');
        setHelpdeskText('');
        fetchAllData();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to create sub-category');
      }
    } catch (error) {
      console.error('Error creating sub-category:', error);
      toast.error('Failed to create sub-category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (subCategory: SubCategoryItem) => {
    setEditingSubCategory(subCategory);
    setEditIssueType(subCategory.issue_type_id?.toString() || '');
    setEditCategory(subCategory.category_id?.toString() || '');
    setEditSubCategoryName(subCategory.sub_category || '');
    setEditHelpdeskText(subCategory.helpdesk_text || '');
    setIsEditModalOpen(true);
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!editingSubCategory) return;

    if (!editIssueType) {
      toast.error('Please select issue type');
      return;
    }
    if (!editCategory) {
      toast.error('Please select category');
      return;
    }
    if (!editSubCategoryName.trim()) {
      toast.error('Please enter sub-category name');
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        id: editingSubCategory.id,
        name: editSubCategoryName.trim(),
        issue_type_id: editIssueType,
        helpdesk_category_id: editCategory,
        active: 1,
      };

      if (editHelpdeskText.trim()) {
        body.helpdesk_text = editHelpdeskText.trim();
      }

      const response = await fetch(
        getFullUrl('/crm/admin/modify_helpdesk_sub_category.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toast.success('Sub-category updated successfully!');
        setIsEditModalOpen(false);
        setEditingSubCategory(null);
        fetchAllData();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to update sub-category');
      }
    } catch (error) {
      console.error('Error updating sub-category:', error);
      toast.error('Failed to update sub-category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (subCategory: SubCategoryItem) => {
    if (!confirm('Are you sure you want to delete this sub-category?')) {
      return;
    }

    try {
      const response = await fetch(
        getFullUrl('/crm/admin/modify_helpdesk_sub_category.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: subCategory.id,
            name: subCategory.sub_category,
            issue_type_id: subCategory.issue_type_id?.toString() || '',
            helpdesk_category_id: subCategory.category_id.toString(),
            active: 0,
          }),
        }
      );

      if (response.ok) {
        setSubCategories(subCategories.filter(sc => sc.id !== subCategory.id));
        toast.success('Sub-category deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to delete sub-category');
      }
    } catch (error) {
      console.error('Error deleting sub-category:', error);
      toast.error('Failed to delete sub-category');
    }
  };

  // Table columns
  const columns = [
    { key: 'srno', label: 'S.No.', sortable: false },
    { key: 'issue_type', label: 'Issue Type', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'name', label: 'Sub Category', sortable: true },
    { key: 'helpdesk_text', label: 'Text', sortable: false },
  ];

  const renderCell = (item: SubCategoryItem, columnKey: string) => {
    const index = subCategories.findIndex(sc => sc.id === item.id);

    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'issue_type':
        return item.issue_type || getIssueTypeName(item.issue_type_id);
      case 'category':
        return item.category_type || getCategoryName(item.category_id);
      case 'name':
        return item.sub_category || '--';
      case 'helpdesk_text':
        return item.helpdesk_text || '--';
      default:
        return '--';
    }
  };

  const renderActions = (item: SubCategoryItem) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Sub-Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            {/* Issue Type Dropdown */}
            <div className="flex-1">
              <Select value={selectedIssueType} onValueChange={setSelectedIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Issue Type" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Dropdown */}
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-category Name */}
            <div className="flex-1">
              <Input
                placeholder="Enter Sub-category"
                value={subCategoryName}
                onChange={(e) => setSubCategoryName(e.target.value)}
              />
            </div>

            {/* Helpdesk Text */}
            <div className="flex-1">
              <Input
                placeholder="Enter text"
                value={helpdeskText}
                onChange={(e) => setHelpdeskText(e.target.value)}
              />
            </div>

            {/* Add Button */}
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              <Plus className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sub Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading sub-categories...</div>
            </div>
          ) : (
            <EnhancedTable
              data={subCategories}
              columns={columns}
              renderCell={renderCell}
              renderActions={renderActions}
              storageKey="sub-categories-table"
              enableSearch={true}
              searchPlaceholder="Search sub-categories..."
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Sub-Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Sub-Category</DialogTitle>
          </DialogHeader>
          {editingSubCategory && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Issue Type Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Select Issue Type <span className="text-red-500">*</span>
                  </label>
                  <Select value={editIssueType} onValueChange={setEditIssueType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Issue Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Select Category <span className="text-red-500">*</span>
                  </label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub-category Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Sub-category Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editSubCategoryName}
                    onChange={(e) => setEditSubCategoryName(e.target.value)}
                    placeholder="Enter Sub-category"
                  />
                </div>

                {/* Helpdesk Text */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Text
                  </label>
                  <Input
                    value={editHelpdeskText}
                    onChange={(e) => setEditHelpdeskText(e.target.value)}
                    placeholder="Enter text"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingSubCategory(null);
                  }}
                  variant="outline"
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSubmit}
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  {isSubmitting ? 'Updating...' : 'Submit'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
