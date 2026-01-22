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

interface FitoutFlatRate {
  id: number;
  fitout_category_id: number;
  flat_type_id: number;
  amount: number;
  convenience_charge: number;
  deposit: number;
  active: boolean;
  fitout_type: string;
  created_at: string;
  updated_at: string;
  fitout_category_name?: string;
  flat_type_name?: string;
}

interface FitoutCategory {
  id: number;
  name: string;
}

interface FlatType {
  id: number;
  name: string;
}

export const FitoutCategoryRateTab: React.FC = () => {
  const [rates, setRates] = useState<FitoutFlatRate[]>([]);
  const [categories, setCategories] = useState<FitoutCategory[]>([]);
  const [fitoutCategoryId, setFitoutCategoryId] = useState('');
  const [categoryType, setCategoryType] = useState('');
  const [amount, setAmount] = useState('');
  const [convenienceCharge, setConvenienceCharge] = useState('');
  const [deposit, setDeposit] = useState('');
  const [fitoutType, setFitoutType] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRates();
    fetchCategories();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/admin/fitout_flat_rates.json');
      const ratesData = response.data?.fitout_flat_rates || [];
      setRates(Array.isArray(ratesData) ? ratesData : []);
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to load rates');
      setRates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/crm/admin/fitout_categories.json');
      const categoriesData = response.data?.fitout_categories || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    }
  };

  const handleAdd = async () => {
    // if (!fitoutCategoryId) {
    //   toast.error('Please select fitout category');
    //   return;
    // }

    if (!amount) {
      toast.error('Please enter amount');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post('/crm/admin/fitout_flat_rates.json', {
        fitout_flat_rate: {
          fitout_category_id: parseInt(fitoutCategoryId),
          fitout_type: categoryType,
          amount: parseFloat(amount),
          convenience_charge: convenienceCharge ? parseFloat(convenienceCharge) : 0,
          deposit: deposit ? parseFloat(deposit) : 0,
          active: true,
        }
      });
      toast.success('Rate added successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchRates();
    } catch (error) {
      console.error('Error adding rate:', error);
      toast.error('Failed to add rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (rate: FitoutFlatRate) => {
    setEditingId(rate.id);
    setFitoutCategoryId(rate.fitout_category_id?.toString() || '');
    setCategoryType(rate.fitout_type || '');
    setAmount(rate.amount?.toString() || '');
    setConvenienceCharge(rate.convenience_charge?.toString() || '');
    setDeposit(rate.deposit?.toString() || '');
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!amount || !editingId) {
      toast.error('Please enter amount');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.put(`/crm/admin/fitout_flat_rates/${editingId}.json`, {
        fitout_flat_rate: {
          fitout_type: categoryType,
          amount: parseFloat(amount),
          convenience_charge: convenienceCharge ? parseFloat(convenienceCharge) : 0,
          deposit: deposit ? parseFloat(deposit) : 0,
          active: true,
        }
      });
      toast.success('Rate updated successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchRates();
    } catch (error) {
      console.error('Error updating rate:', error);
      toast.error('Failed to update rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rate?')) return;

    try {
      await apiClient.delete(`/crm/admin/fitout_flat_rates/${id}.json`);
      toast.success('Rate deleted successfully');
      fetchRates();
    } catch (error) {
      console.error('Error deleting rate:', error);
      toast.error('Failed to delete rate');
    }
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await apiClient.put(`/crm/admin/fitout_flat_rates/${id}.json`, {
        fitout_flat_rate: {
          active: !currentStatus,
        }
      });
      toast.success(`Rate ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchRates(); // Refresh the list
    } catch (error) {
      console.error('Error toggling rate status:', error);
      toast.error('Failed to update rate status');
    }
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFitoutCategoryId('');
    setCategoryType('');
    setAmount('');
    setConvenienceCharge('');
    setDeposit('');
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
        key: 'fitout_type',
        label: 'Type',
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
        key: 'convenience_charge',
        label: 'Convenience Charge',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'deposit',
        label: 'Security Deposit',
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

  const renderCell = useCallback((item: FitoutFlatRate, columnKey: string) => {
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
      case 'id':
        return <span>{item.id}</span>;
      case 'fitout_category_name':
        return <span>{item.fitout_category_name || categories.find(c => c.id === item.fitout_category_id)?.name || '-'}</span>;
      case 'amount':
        return <span>₹{Number(item.amount || 0).toFixed(2)}</span>;
      case 'convenience_charge':
        return <span>₹{Number(item.convenience_charge || 0).toFixed(2)}</span>;
      case 'deposit':
        return <span>₹{Number(item.deposit || 0).toFixed(2)}</span>;
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
        return <span>{String(item[columnKey as keyof FitoutFlatRate] || '-')}</span>;
    }
  }, [categories]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <EnhancedTable
        data={rates}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-category-rate-table"
        enableExport={true}
        exportFileName="fitout-category-rates"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search rates..."
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

      {/* Add/Edit Rate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Rate' : 'Add Rate'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the rate details below.' : 'Enter the rate details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* <div className="grid gap-2">
              <Label htmlFor="fitout-category">Fitout Category *</Label>
              <Select value={fitoutCategoryId} onValueChange={setFitoutCategoryId}>
                <SelectTrigger id="fitout-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

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

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="convenience-charge">Convenience Charge</Label>
              <Input
                id="convenience-charge"
                type="number"
                placeholder="Enter convenience charge"
                value={convenienceCharge}
                onChange={(e) => setConvenienceCharge(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deposit">Security Deposit</Label>
              <Input
                id="deposit"
                type="number"
                placeholder="Enter security deposit"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
              />
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
