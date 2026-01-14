import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { EnhancedTable } from '../enhanced-table/EnhancedTable';

interface Category {
  id: number;
  name: string;
  bhk_1_count: number;
  bhk_2_count: number;
  bhk_3_count: number;
  bhk_4_count: number;
  bhk_5_count: number;
  bhk_4_5_count: number;
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
      const response = await axios.get('/api/fitout/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
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
      const response = await axios.post('/api/fitout/categories', {
        name: categoryName
      });
      toast.success('Category added successfully');
      const newCategory = response.data;
      setCategories(Array.isArray(categories) ? [...categories, newCategory] : [newCategory]);
      setCategoryName('');
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
      await axios.put(`/api/fitout/categories/${editingId}`, {
        name: categoryName
      });
      toast.success('Category updated successfully');
      setCategories(Array.isArray(categories) ? categories.map(cat => 
        cat.id === editingId ? { ...cat, name: categoryName } : cat
      ) : []);
      setCategoryName('');
      setEditingId(null);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await axios.delete(`/api/fitout/categories/${id}`);
      toast.success('Category deleted successfully');
      setCategories(Array.isArray(categories) ? categories.filter(cat => cat.id !== id) : []);
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
        key: 'name',
        label: 'Category',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'bhk_1_count',
        label: '1 BHK',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'bhk_2_count',
        label: '2 BHK',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'bhk_3_count',
        label: '3 BHK',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'bhk_4_count',
        label: '4 BHK',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'bhk_5_count',
        label: '5 BHK',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'bhk_4_5_count',
        label: '4.5 BHK',
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
      case 'bhk_1_count':
      case 'bhk_2_count':
      case 'bhk_3_count':
      case 'bhk_4_count':
      case 'bhk_5_count':
      case 'bhk_4_5_count':
        return <div className="text-center">{item[columnKey as keyof Category] || 0}</div>;
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
