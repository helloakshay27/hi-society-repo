import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/apiClient';
import { EnhancedTable } from '../enhanced-table/EnhancedTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';

interface Subcategory {
  id: number;
  name: string;
  description?: string;
  snag_audit_category_id: number;
  category_name?: string;
  active: boolean;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export const SubcategoryManagement: React.FC = () => {
  const { toast } = useToast();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    snag_audit_category_id: '',
  });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('/snag_audit_categories.json?q[resource_type_eq]=FitoutCategory');
      console.log('Categories API Response:', response.data);
      
      // Handle if response is array directly or wrapped in object
      let categoriesData = [];
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data?.snag_audit_categories) {
        categoriesData = response.data.snag_audit_categories;
      } else if (response.data?.data) {
        categoriesData = response.data.data;
      }
      
      console.log('Extracted Categories Data:', categoriesData);
      console.log('Categories Count:', categoriesData.length);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchSubcategories = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all subcategories with fitout filter
      const response = await apiClient.get('/snag_audit_sub_categories.json?q[category_type_eq]=fitout');
      console.log('Subcategories API Response:', response.data);
      
      // Handle if response is array directly or wrapped in object
      let subcategoriesData = [];
      if (Array.isArray(response.data)) {
        subcategoriesData = response.data;
      } else if (response.data?.snag_audit_sub_categories) {
        subcategoriesData = response.data.snag_audit_sub_categories;
      }
      
      subcategoriesData = subcategoriesData || [];
      
      // Enrich with category names
      const enrichedData = subcategoriesData.map((sub: Subcategory) => {
        const category = categories.find((cat) => cat.id === sub.snag_audit_category_id);
        return {
          ...sub,
          category_name: category?.name || 'Unknown',
        };
      });
      
      setSubcategories(enrichedData);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subcategories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [categories, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchSubcategories();
    }
  }, [categories, fetchSubcategories]);

  const handleAdd = () => {
    setFormData({ name: '', description: '', snag_audit_category_id: '' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({
      name: subcategory.name,
      description: subcategory.description || '',
      snag_audit_category_id: subcategory.snag_audit_category_id.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (subcategoryId: number) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      await apiClient.delete(`/snag_audit_sub_categories/${subcategoryId}.json`);
      toast({
        title: 'Success',
        description: 'Subcategory deleted successfully',
      });
      fetchSubcategories();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subcategory',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitAdd = async () => {
    if (!formData.name.trim() || !formData.snag_audit_category_id) {
      toast({
        title: 'Validation Error',
        description: 'Subcategory name and category are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiClient.post('/snag_audit_sub_categories.json', {
        snag_audit_sub_category: {
          name: formData.name,
          description: formData.description,
          snag_audit_category_id: formData.snag_audit_category_id,
          category_type: 'fitout',
        },
      });
      toast({
        title: 'Success',
        description: 'Subcategory added successfully',
      });
      setIsAddDialogOpen(false);
      fetchSubcategories();
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast({
        title: 'Error',
        description: 'Failed to add subcategory',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingSubcategory || !formData.name.trim() || !formData.snag_audit_category_id) return;

    try {
      await apiClient.put(`/snag_audit_sub_categories/${editingSubcategory.id}.json`, {
        snag_audit_sub_category: {
          name: formData.name,
          description: formData.description,
          snag_audit_category_id: formData.snag_audit_category_id,
          category_type: 'fitout',
        },
      });
      toast({
        title: 'Success',
        description: 'Subcategory updated successfully',
      });
      setIsEditDialogOpen(false);
      fetchSubcategories();
    } catch (error) {
      console.error('Error updating subcategory:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subcategory',
        variant: 'destructive',
      });
    }
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
        label: 'Name',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'category_name',
        label: 'Category',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'description',
        label: 'Description',
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

  const renderCell = useCallback(
    (item: Subcategory, columnKey: string) => {
      switch (columnKey) {
        case 'actions':
          return (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="p-1 text-black-600 hover:text-black-800"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        case 'id':
          return <div className="text-center">{item.id}</div>;
        case 'name':
          return <span>{item.name}</span>;
        case 'category_name':
          return <span>{item.category_name || '-'}</span>;
        case 'description':
          return <span>{item.description || '-'}</span>;
        case 'created_at':
          return (
            <span>
              {item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-'}
            </span>
          );
        default:
          return <span>-</span>;
      }
    },
    []
  );

  const filteredSubcategories = useMemo(() => {
    return subcategories.filter(
      (subcategory) =>
        subcategory.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subcategory.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subcategories, searchTerm]);

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

  return (
    <div className="space-y-4">
      <EnhancedTable
        data={filteredSubcategories}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-subcategories-table-v1"
        enableExport={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search subcategories..."
        pagination={true}
        pageSize={10}
        leftActions={
          <Button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-[#F2EEE9] text-[#BF213E] border-0 hover:bg-[#F2EEE9]/80"
          >
            <Plus className="w-4 h-4" />
            Add Subcategory
          </Button>
        }
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Add New Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink>Category *</InputLabel>
              <MuiSelect
                value={formData.snag_audit_category_id}
                onChange={(e) =>
                  setFormData({ ...formData, snag_audit_category_id: e.target.value })
                }
                label="Category *"
                displayEmpty
                sx={fieldStyles}
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <TextField
              label="Subcategory Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              className="bg-[#C72030] text-white hover:bg-[#A01B28]"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink>Category *</InputLabel>
              <MuiSelect
                value={formData.snag_audit_category_id}
                onChange={(e) =>
                  setFormData({ ...formData, snag_audit_category_id: e.target.value })
                }
                label="Category *"
                displayEmpty
                sx={fieldStyles}
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <TextField
              label="Subcategory Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              className="bg-[#C72030] text-white hover:bg-[#A01B28]"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
