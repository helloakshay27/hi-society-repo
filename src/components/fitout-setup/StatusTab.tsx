import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
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

interface Status {
  id: number;
  society_id: number;
  name: string;
  color_code: string;
  fixed_state: string;
  active: number;
  created_at: string;
  updated_at: string;
  position: number;
  of_phase: string;
  of_atype: string;
  email: boolean;
}

// const FIXED_STATES = ['Pending', 'In Progress', 'Completed', 'On Hold', 'Rejected'];
const FIXED_STATES = ['Closed', 'Need Modification'];
const COLORS = [
  { value: '#FF0000', label: 'Red' },
  { value: '#FFA500', label: 'Orange' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#00FF00', label: 'Green' },
  { value: '#0000FF', label: 'Blue' },
  { value: '#800080', label: 'Purple' },
  { value: '#00FFFF', label: 'Cyan' },
];

export const StatusTab: React.FC = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [statusName, setStatusName] = useState('');
  const [statusOrder, setStatusOrder] = useState('');
  const [fixedState, setFixedState] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/fitout_categories/get_complaint_statuses.json?q[of_atype_eq]=fitout_category');
      const statusesData = response.data?.complaint_statuses || [];
      setStatuses(Array.isArray(statusesData) ? statusesData : []);
    } catch (error) {
      console.error('Error fetching statuses:', error);
      toast.error('Failed to load statuses');
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!statusName.trim() || !statusOrder) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.post('/crm/admin/fitout_categories/create_fitout_statuses.json', {
        complaint_status: {
          name: statusName,
          color_code: selectedColor,
          position: parseInt(statusOrder),
          fixed_state: fixedState || '',
          of_phase: 'fitout_category',
          of_atype: 'fitout_category'
        }
      });
      toast.success(response.data?.message || 'Status created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchStatuses();
    } catch (error) {
      console.error('Error adding status:', error);
      toast.error('Failed to add status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = useCallback((status: Status) => {
    setEditingId(status.id);
    setStatusName(status.name);
    setStatusOrder(status.position ? status.position.toString() : '');
    setFixedState(status.fixed_state || '');
    setSelectedColor(status.color_code || '#FF0000');
    setIsDialogOpen(true);
  }, []);

  const handleUpdate = async () => {
    if (!statusName.trim() || !statusOrder || !editingId) return;

    try {
      setIsSubmitting(true);
      const response = await apiClient.post(`/crm/admin/fitout_categories/modify_complaint_status.json?`, 
        {
       
          id: editingId,
          name: statusName,
          color_code: selectedColor,
          position: parseInt(statusOrder),
          fixed_state: fixedState || '',
          of_phase: 'fitout_category',
          of_atype: 'fitout_category',
          active: 1
       
      });
      toast.success(response.data?.message || 'Status updated successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchStatuses();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this status?')) return;

    try {
      const response = await apiClient.delete(`/crm/admin/fitout_categories/delete_fitout_statuses/${id}.json`);
      toast.success(response.data?.message || 'Status deleted successfully');
      setStatuses(Array.isArray(statuses) ? statuses.filter(stat => stat.id !== id) : []);
    } catch (error) {
      console.error('Error deleting status:', error);
      toast.error('Failed to delete status');
    }
  }, [statuses]);

  const resetForm = () => {
    setStatusName('');
    setStatusOrder('');
    setFixedState('');
    setSelectedColor('#FF0000');
    setEditingId(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
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
        key: 'position',
        label: 'Position',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'name',
        label: 'Status Name',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'fixed_state',
        label: 'Fixed State',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'color_code',
        label: 'Color',
        sortable: false,
        draggable: true,
        defaultVisible: true,
      },
    ],
    []
  );

  const renderCell = useCallback((item: Status, columnKey: string) => {
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
      case 'position':
        return <span className="font-medium">{item.position}</span>;
      case 'name':
        return <span>{item.name}</span>;
      case 'fixed_state':
        return (
          <span className="text-sm text-gray-600">
            {item.fixed_state || '—'}
          </span>
        );
      case 'color_code':
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-6 rounded border border-gray-300"
              style={{ backgroundColor: item.color_code }}
            />
            <span className="text-xs text-gray-500">{item.color_code}</span>
          </div>
        );
      default:
        return <span>{String(item[columnKey as keyof Status] || '-')}</span>;
    }
  }, [handleDelete, handleEdit]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <EnhancedTable
        data={statuses}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-statuses-table"
        enableExport={true}
        exportFileName="fitout-statuses"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search statuses..."
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

      {/* Add/Edit Status Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Status' : 'Add Status'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the status details below.' : 'Enter the status details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status-name">Status Name *</Label>
              <Input
                id="status-name"
                placeholder="Enter status name"
                value={statusName}
                onChange={(e) => setStatusName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fixed-state">Fixed State (Optional)</Label>
              <Select value={fixedState} onValueChange={setFixedState}>
                <SelectTrigger id="fixed-state">
                  <SelectValue placeholder="Select Fixed State" />
                </SelectTrigger>
                <SelectContent>
                  {FIXED_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-10 rounded border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: selectedColor }}
                    onClick={() => {
                      const colorIndex = COLORS.findIndex(c => c.value === selectedColor);
                      const nextIndex = (colorIndex + 1) % COLORS.length;
                      setSelectedColor(COLORS[nextIndex].value);
                    }}
                    title="Click to change color"
                  />
                  <span className="text-xs text-gray-600">{selectedColor}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  type="number"
                  placeholder="Position"
                  value={statusOrder}
                  onChange={(e) => setStatusOrder(e.target.value)}
                  min="1"
                />
              </div>
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
