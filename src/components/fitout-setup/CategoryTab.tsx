import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedTable } from '../enhanced-table/EnhancedTable';
import { apiClient } from '@/utils/apiClient';

interface Category {
  id: number;
  name: string;
  active: boolean;
  society_id: string | number;
  amount: number | null;
  conv_charge: number;
  created_at: string;
  updated_at: string;
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
          active: true,
          society_id: idSociety,
        }
      });
      toast.success('Category added successfully');
      const newCategory = response.data;
      setCategories(Array.isArray(categories) ? [...categories, newCategory] : [newCategory]);
      setCategoryName('');
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setCategoryName(category.name);
  };
  const handleUpdate = async () => {
    if (!categoryName.trim() || !editingId) return;

    try {
      await apiClient.put(`/crm/admin/fitout_categories/${editingId}.json`, {
        fitout_category: {
          name: categoryName,
          active: true,
        }
      });
      toast.success('Category updated successfully');
      setCategoryName('');
      setEditingId(null);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
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
        key: 'active',
        label: 'Status',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'conv_charge',
        label: 'Convenience Charge',
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
              className="text-blue-600 hover:text-blue-800"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      case 'name':
        return <span>{item.name}</span>;
      case 'id':
        return <span>{item.id}</span>;
      case 'active':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {item.active ? 'Active' : 'Inactive'}
          </span>
        );
      case 'amount':
        return <span>{item.amount !== null ? `₹${item.amount}` : '-'}</span>;
      case 'conv_charge':
        return <span>₹{item.conv_charge || 0}</span>;
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
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <Input
            placeholder="Enter Category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Button
          onClick={editingId ? handleUpdate : handleAdd}
          className="bg-[#2C3F87] hover:bg-[#1e2a5e] text-white"
        >
          {editingId ? 'Update' : '+ Add'}
        </Button>
      </div>

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
      />
    </div>
  );
};
