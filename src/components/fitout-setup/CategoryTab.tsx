import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { StatusToggle } from './StatusToggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormControl as MuiFormControl, InputLabel, Select as MuiSelect, MenuItem, TextField } from '@mui/material';
import { fieldStyles, menuProps } from '../ticket-management/fieldStyles';
import { EnhancedTable } from '../enhanced-table/EnhancedTable';
import { apiClient } from '@/utils/apiClient';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const CATEGORY_TYPE_OPTIONS = ['Move In', 'Move Out', 'Fitout', 'Refund Initiate'];

interface Category {
  id: number;
  name: string;
  active: boolean;
  society_id: string | number;
  amount: number | null;
  convenience_charge: number;
  created_at: string;
  updated_at: string;
  category_type?: string;
  bhk_1_count?: number;
  bhk_2_count?: number;
  bhk_3_count?: number;
  bhk_4_count?: number;
  bhk_5_count?: number;
  bhk_4_5_count?: number;
}

export const CategoryTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/admin/fitout_categories.json');
      // Extract fitout_categories array from the response
      const categoriesData = response.data?.fitout_categories || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!categoryName.trim()) {
      toast.error('Please enter category name');
      return;
    }

    try {
      setIsSubmitting(true);

      // Read the society ID directly — set by HiSocietyHeader as 'selectedSocietyId'
      const societyIdRaw = localStorage.getItem('selectedSocietyId') || '';

      if (!societyIdRaw) {
        toast.error('Please select a society from the header dropdown.');
        return;
      }

      const societyId = parseInt(societyIdRaw);

      const response = await apiClient.post('/crm/admin/fitout_categories.json', {
        fitout_category: {
          name: categoryName,
          category_type: categoryType,
          active: true,
          society_id: societyId,
        }
      });
      
      toast.success('Category added successfully');
      setIsDialogOpen(false);
      setCategoryName('');
      setCategoryType('');
      fetchCategories(); // Refresh the list
    } catch (error: any) {
      console.error('Error adding category:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add category';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setCategoryName(category.name);
    setCategoryType(category.category_type || '');
    setIsDialogOpen(true);
  };
  const handleUpdate = async () => {
    if (!categoryName.trim() || !editingId) return;

    try {
      setIsSubmitting(true);
      await apiClient.put(`/crm/admin/fitout_categories/${editingId}.json`, {
        fitout_category: {
          name: categoryName,
          category_type: categoryType,
          active: true,
        }
      });
      toast.success('Category updated successfully');
      setIsDialogOpen(false);
      setCategoryName('');
      setCategoryType('');
      setEditingId(null);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await apiClient.delete(`/crm/admin/fitout_categories/${id}.json`);
      toast.success('Category deleted successfully');
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await apiClient.put(`/crm/admin/fitout_categories/${id}.json`, {
        fitout_category: {
          active: !currentStatus,
        }
      });
      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error('Failed to update category status');
    }
  };

  const handleOpenAddDialog = () => {
    setEditingId(null);
    setCategoryName('');
    setCategoryType('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCategoryName('');
    setCategoryType('');
    setEditingId(null);
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const query = searchTerm.toLowerCase();
    return categories.filter((item) =>
      Object.values(item).some((v) => String(v ?? '').toLowerCase().includes(query))
    );
  }, [categories, searchTerm]);

  const totalCount = filteredCategories.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

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
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>1</PaginationLink>
        </PaginationItem>
      );
      if (currentPage > 4) {
        items.push(<PaginationItem key="ellipsis1"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (currentPage < totalPages - 3) {
        items.push(<PaginationItem key="ellipsis2"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
              </PaginationItem>
            );
          }
        }
      }
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>{totalPages}</PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
          </PaginationItem>
        );
      }
    }
    return items;
  };

  const columns = useMemo(
    () => [
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        draggable: false,
        defaultVisible: true,
      },
      {
        key: 'sr_no',
        label: 'Sr. No.',
        sortable: false,
        draggable: false,
        defaultVisible: true,
      },
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'name',
        label: 'Category',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'category_type',
        label: 'Type',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'active',
        label: 'Status',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'created_at',
        label: 'Created At',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
    ],
    []
  );

  const renderCell = useCallback((item: Category, columnKey: string, index: number) => {
    switch (columnKey) {
      case 'sr_no':
        return <span>{startIndex + index + 1}</span>;
      case 'actions':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(item)}
              className="text-black-600 hover:text-black-800"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-black-600 hover:text-black-800"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      case 'name':
        return <span>{item.name}</span>;
      case 'id':
        return <span>{item.id}</span>;
      case 'category_type':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.category_type === 'Move In' 
              ? 'bg-blue-100 text-blue-800' 
              : item.category_type === 'Fitout'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {item.category_type || '-'}
          </span>
        );
      case 'active':
        return (
          <StatusToggle
            checked={item.active || false}
            onChange={() => handleToggle(item.id, item.active)}
          />
        );
      case 'created_at':
        return <span>{new Date(item.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</span>;
      default:
        return <span>{String(item[columnKey as keyof Category] || '-')}</span>;
    }
  }, [startIndex]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <EnhancedTable
        data={paginatedCategories}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-categories-table"
        enableExport={true}
        exportFileName="fitout-categories"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search categories..."
        pagination={false}
        leftActions={
          <Button
            onClick={handleOpenAddDialog}
            className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
      />

      {totalCount > 0 && (
        <div className="flex items-center justify-center mt-6">
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

      {/* Add/Edit Category Dialog */}
      <Dialog modal={false} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the category details below.' : 'Enter the category details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Issue Type <span style={{ color: 'red' }}>*</span></InputLabel>
              <MuiSelect
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
                displayEmpty
                label="Select Issue Type *"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" disabled><em>Select Issue Type</em></MenuItem>
                {CATEGORY_TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </MuiSelect>
            </MuiFormControl>

            <TextField
              label={<>Enter category <span style={{ color: 'red' }}>*</span></>}
              placeholder="Enter category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
