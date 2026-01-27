import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@mui/material';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EnhancedTable } from '../enhanced-table/EnhancedTable';
import { apiClient } from '@/utils/apiClient';

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
      // Get society_id from localStorage
      const selectedUserSocietyId = localStorage.getItem('selectedUserSociety') || '';
      
      // First, get the selected user society to extract id_society
      let idSociety = '';
      if (selectedUserSocietyId) {
        const selectedSocietyResponse = await apiClient.get(`/crm/admin/user_societies.json`);
        const userSocieties = selectedSocietyResponse.data || [];
        const selectedSociety = userSocieties.find((us: any) => us.id.toString() === selectedUserSocietyId);
        idSociety = selectedSociety?.id_society || '';
      }
      
      if (!idSociety) {
        toast.error('Society information not found. Please select a society.');
        return;
      }

      const response = await apiClient.post('/crm/admin/fitout_categories.json', {
        fitout_category: {
          name: categoryName,
          category_type: categoryType,
          active: true,
          society_id: idSociety,
        }
      });
      toast.success('Category added successfully');
      setIsDialogOpen(false);
      setCategoryName('');
      setCategoryType('');
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
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

  const renderCell = useCallback((item: Category, columnKey: string) => {
    switch (columnKey) {
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
          <Switch
            checked={item.active || false}
            onChange={() => handleToggle(item.id, item.active)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#C72030",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#C72030",
              },
            }}
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
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <EnhancedTable
        data={categories}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-categories-table"
        enableExport={true}
        exportFileName="fitout-categories"
        searchTerm=""
        onSearchChange={() => {}}
        searchPlaceholder="Search categories..."
        pagination={true}
        pageSize={10}
        leftActions={
          <Button
            onClick={handleOpenAddDialog}
            className="bg-[#2C3F87] hover:bg-[#1e2a5e] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
      />

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the category details below.' : 'Enter the category details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                placeholder="Enter category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-type">Type</Label>
              <Select value={categoryType} onValueChange={setCategoryType}>
                <SelectTrigger id="category-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Move In">Move In</SelectItem>
                  <SelectItem value="Fitout">Fitout</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              className="bg-[#2C3F87] hover:bg-[#1e2a5e] text-white"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
