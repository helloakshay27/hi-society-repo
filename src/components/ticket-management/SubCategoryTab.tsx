import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Edit, Trash2, Plus } from 'lucide-react';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { fieldStyles, menuProps } from './fieldStyles';

interface SubCategoryItem {
  id: number;
  issue_type_id: number;
  issue_type: string;
  category_id: number;
  category_type: string;
  sub_category: string;
  helpdesk_text: string;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 20;
  const [loadingCategories, setLoadingCategories] = useState(false);

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
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Fetch categories filtered by issue type
  const fetchCategoriesByIssueType = useCallback(async (issueTypeId: string) => {
    if (!issueTypeId) {
      setCategories([]);
      return;
    }
    setLoadingCategories(true);
    try {
      const res = await fetch(
        getFullUrl(`/dropdown/categories.json?q[issue_type_id_eq]=${issueTypeId}`),
        { headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' } },
      );
      if (res.ok) {
        const data = await res.json();
        const cats = Array.isArray(data) ? data : (data.categories || []);
        setCategories(cats.map((cat: { id: number; name: string }) => ({ id: cat.id, name: cat.name })));
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch all data from separate APIs
  const fetchSubCategories = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const subCategoriesRes = await fetch(
        getFullUrl(`/crm/admin/helpdesk_sub_categories.json?page=${page}&per_page=${perPage}`),
        { headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' } },
      );
      if (subCategoriesRes.ok) {
        const data = await subCategoriesRes.json();
        const subCats = data.helpdesk_sub_categories ?? (Array.isArray(data) ? data : []);
        setSubCategories(subCats);
        if (data.pagination) {
          setCurrentPage(data.pagination.current_page);
          setTotalPages(data.pagination.total_pages);
          setTotalCount(data.pagination.total_count);
        }
      } else {
        toast.error('Failed to fetch sub-categories');
      }
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      toast.error('Failed to fetch sub-categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const issueTypesRes = await fetch(getFullUrl('/user/issue_type.json'), {
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
      });

      if (issueTypesRes.ok) {
        const data = await issueTypesRes.json();
        setIssueTypes(
          (data.data || []).map((it: { id: number; name: string }) => ({
            id: it.id,
            name: it.name,
          }))
        );
      } else {
        toast.error('Failed to fetch issue types');
      }
    } catch (error) {
      console.error('Error fetching issue types:', error);
      toast.error('Failed to fetch issue types');
    }
  }, []);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchSubCategories(page);
  };

  useEffect(() => {
    fetchAllData();
    fetchSubCategories(1);
  }, [fetchAllData, fetchSubCategories]);

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
      const formData = new FormData();
      formData.append('helpdesk_sub_category[issue_type_id]', selectedIssueType);
      formData.append('helpdesk_sub_category[name]', subCategoryName.trim());
      formData.append('helpdesk_sub_category[helpdesk_category_id]', selectedCategory);

      if (helpdeskText.trim()) {
        formData.append('helpdesk_sub_category[helpdesk_text]', helpdeskText.trim());
      }

      const response = await fetch(
        getFullUrl('/crm/admin/create_helpdesk_sub_category.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success('Sub-category created successfully!');
        setSelectedIssueType('');
        setSelectedCategory('');
        setSubCategoryName('');
        setHelpdeskText('');
        setAddDialogOpen(false);
        fetchSubCategories(1);
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
    const issueTypeId = subCategory.issue_type_id?.toString() || '';
    setEditingSubCategory(subCategory);
    setEditIssueType(issueTypeId);
    setEditCategory(subCategory.category_id?.toString() || '');
    setEditSubCategoryName(subCategory.sub_category || '');
    setEditHelpdeskText(subCategory.helpdesk_text || '');
    if (issueTypeId) fetchCategoriesByIssueType(issueTypeId);
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
      const formData = new FormData();
      formData.append('id', editingSubCategory.id.toString());
      formData.append('name', editSubCategoryName.trim());
      formData.append('issue_type_id', editIssueType);
      formData.append('helpdesk_category_id', editCategory);
      formData.append('active', '1');

      if (editHelpdeskText.trim()) {
        formData.append('helpdesk_text', editHelpdeskText.trim());
      }

      const response = await fetch(
        getFullUrl('/crm/admin/modify_helpdesk_sub_category.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success('Sub-category updated successfully!');
        setIsEditModalOpen(false);
        setEditingSubCategory(null);
        fetchSubCategories(currentPage);
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
      const formData = new FormData();
      formData.append('id', subCategory.id.toString());
      formData.append('name', subCategory.sub_category || '');
      formData.append('issue_type_id', subCategory.issue_type_id?.toString() || '');
      formData.append('helpdesk_category_id', subCategory.category_id?.toString() || '');
      formData.append('active', '0');

      const response = await fetch(
        getFullUrl('/crm/admin/modify_helpdesk_sub_category.json'),
        {
          method: 'POST',
          headers: { 'Authorization': getAuthHeader() },
          body: formData,
        }
      );

      if (response.ok) {
        setSubCategories(subCategories.filter(sc => sc.id !== subCategory.id));
        toast.success('Sub-category deleted successfully!');
        fetchSubCategories(currentPage);
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
        return item.issue_type || '--';
      case 'category':
        return item.category_type || '--';
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
      {/* Add Sub-Category Dialog */}
      <Dialog open={addDialogOpen} modal={false} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) {
          setSelectedIssueType('');
          setSelectedCategory('');
          setSubCategoryName('');
          setHelpdeskText('');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Sub-Category</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                Select Issue Type <span style={{ color: '#ef4444' }}>*</span>
              </InputLabel>
              <MuiSelect
                label="Select Issue Type *"
                displayEmpty
                value={selectedIssueType}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedIssueType(val);
                  setSelectedCategory('');
                  fetchCategoriesByIssueType(val);
                }}
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" disabled><em>Select Issue Type</em></MenuItem>
                {issueTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id.toString()}>{type.name}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                Select Category <span style={{ color: '#ef4444' }}>*</span>
              </InputLabel>
              <MuiSelect
                label="Select Category *"
                displayEmpty
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!selectedIssueType || loadingCategories}
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" disabled>
                  <em>{loadingCategories ? 'Loading...' : !selectedIssueType ? 'Select issue type first' : 'Select Category'}</em>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id.toString()}>{cat.name}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <TextField
              label="Sub-category Name"
              placeholder="Enter Sub-category"
              value={subCategoryName}
              onChange={(e) => setSubCategoryName(e.target.value)}
              fullWidth
              variant="outlined"
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <TextField
              label="Text"
              placeholder="Enter text"
              value={helpdeskText}
              onChange={(e) => setHelpdeskText(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EnhancedTable
          data={subCategories}
          columns={columns}
          renderCell={renderCell}
          renderActions={renderActions}
          storageKey="sub-categories-table"
          enableSearch={true}
          searchPlaceholder="Search sub-categories..."
          leftActions={
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          }
        />
        {/* Pagination */}
        {subCategories.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {totalCount > 0 ? (currentPage - 1) * perPage + 1 : 0}–{Math.min(currentPage * perPage, totalCount || subCategories.length)} of {totalCount || subCategories.length} sub-categories
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        «
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        ‹
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .reduce((acc: Array<number | 'ellipsis'>, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) =>
                          p === 'ellipsis' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                          ) : (
                            <Button
                              key={p}
                              variant={p === currentPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(p as number)}
                              className="w-8"
                            >
                              {p}
                            </Button>
                          )
                        )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        ›
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        »
                      </Button>
                    </div>
                  )}
                </div>
              )}
      </div>

      {/* Edit Sub-Category Modal */}
      <Dialog open={isEditModalOpen} modal={false} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Sub-Category</DialogTitle>
          </DialogHeader>
          {editingSubCategory && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Issue Type Dropdown */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                    Select Issue Type <span style={{ color: '#ef4444' }}>*</span>
                  </InputLabel>
                  <MuiSelect
                    label="Select Issue Type *"
                    displayEmpty
                    value={editIssueType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditIssueType(val);
                      setEditCategory('');
                      fetchCategoriesByIssueType(val);
                    }}
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="" disabled><em>Select Issue Type</em></MenuItem>
                    {issueTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id.toString()}>{type.name}</MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>

                {/* Category Dropdown */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                    Select Category <span style={{ color: '#ef4444' }}>*</span>
                  </InputLabel>
                  <MuiSelect
                    label="Select Category *"
                    displayEmpty
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    disabled={!editIssueType || loadingCategories}
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="" disabled>
                      <em>{loadingCategories ? 'Loading...' : !editIssueType ? 'Select issue type first' : 'Select Category'}</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id.toString()}>{cat.name}</MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>

                {/* Sub-category Name */}
                <TextField
                  label="Sub-category Name"
                  placeholder="Enter Sub-category"
                  value={editSubCategoryName}
                  onChange={(e) => setEditSubCategoryName(e.target.value)}
                  fullWidth
                  variant="outlined"
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                />

                {/* Helpdesk Text */}
                <TextField
                  label="Text"
                  placeholder="Enter text"
                  value={editHelpdeskText}
                  onChange={(e) => setEditHelpdeskText(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                />
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
                  className="bg-[#C72030] hover:bg-[#a01828] text-white px-8"
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
