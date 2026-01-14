import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EnhancedTable } from '../enhanced-table/EnhancedTable';

interface DeviationStatus {
  id: number;
  order: number;
  status: string;
  fixed_state: string;
  color: string;
}

const FIXED_STATES = ['Pending', 'Complied'];
const COLORS = [
  { value: '#00FF00', label: 'Green' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#FFA500', label: 'Orange' },
  { value: '#FF0000', label: 'Red' },
  { value: '#0000FF', label: 'Blue' },
  { value: '#00FFFF', label: 'Cyan' },
  { value: '#800080', label: 'Purple' },
];

export const DeviationStatusTab: React.FC = () => {
  const [statuses, setStatuses] = useState<DeviationStatus[]>([]);
  const [statusName, setStatusName] = useState('');
  const [statusOrder, setStatusOrder] = useState('');
  const [fixedState, setFixedState] = useState('');
  const [selectedColor, setSelectedColor] = useState('#00FF00');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/fitout/deviation-statuses');
      setStatuses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching deviation statuses:', error);
      toast.error('Failed to load deviation statuses');
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!statusName.trim() || !statusOrder || !fixedState) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await axios.post('/api/fitout/deviation-statuses', {
        status: statusName,
        order: parseInt(statusOrder),
        fixed_state: fixedState,
        color: selectedColor
      });
      toast.success('Deviation status added successfully');
      const newStatus = response.data;
      setStatuses(Array.isArray(statuses) ? [...statuses, newStatus] : [newStatus]);
      resetForm();
    } catch (error) {
      console.error('Error adding deviation status:', error);
      toast.error('Failed to add deviation status');
    }
  };

  const handleEdit = (status: DeviationStatus) => {
    setEditingId(status.id);
    setStatusName(status.status);
    setStatusOrder(status.order.toString());
    setFixedState(status.fixed_state);
    setSelectedColor(status.color);
  };

  const handleUpdate = async () => {
    if (!statusName.trim() || !statusOrder || !fixedState || !editingId) return;

    try {
      await axios.put(`/api/fitout/deviation-statuses/${editingId}`, {
        status: statusName,
        order: parseInt(statusOrder),
        fixed_state: fixedState,
        color: selectedColor
      });
      toast.success('Deviation status updated successfully');
      setStatuses(Array.isArray(statuses) ? statuses.map(stat => 
        stat.id === editingId 
          ? { ...stat, status: statusName, order: parseInt(statusOrder), fixed_state: fixedState, color: selectedColor }
          : stat
      ) : []);
      resetForm();
    } catch (error) {
      console.error('Error updating deviation status:', error);
      toast.error('Failed to update deviation status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this deviation status?')) return;

    try {
      await axios.delete(`/api/fitout/deviation-statuses/${id}`);
      toast.success('Deviation status deleted successfully');
      setStatuses(Array.isArray(statuses) ? statuses.filter(stat => stat.id !== id) : []);
    } catch (error) {
      console.error('Error deleting deviation status:', error);
      toast.error('Failed to delete deviation status');
    }
  };

  const resetForm = () => {
    setStatusName('');
    setStatusOrder('');
    setFixedState('');
    setSelectedColor('#00FF00');
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
        key: 'order',
        label: 'Order',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'status',
        label: 'Status',
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
        key: 'color',
        label: 'Color',
        sortable: false,
        draggable: true,
        defaultVisible: true,
      },
    ],
    []
  );

  const renderCell = useCallback((item: DeviationStatus, columnKey: string) => {
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
      case 'order':
        return <span>{item.order}</span>;
      case 'status':
        return <span>{item.status}</span>;
      case 'fixed_state':
        return (
          <Select value={item.fixed_state} disabled>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
          </Select>
        );
      case 'color':
        return (
          <div
            className="w-10 h-6 rounded border border-gray-300"
            style={{ backgroundColor: item.color }}
          />
        );
      default:
        return <span>{String(item[columnKey as keyof DeviationStatus] || '-')}</span>;
    }
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter status
          </label>
          <Input
            placeholder="Enter status"
            value={statusName}
            onChange={(e) => setStatusName(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Fixed State
          </label>
          <Select value={fixedState} onValueChange={setFixedState}>
            <SelectTrigger>
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
        <div className="w-16">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div
            className="w-12 h-10 rounded border-2 border-gray-300 cursor-pointer"
            style={{ backgroundColor: selectedColor }}
            onClick={() => {
              const colorIndex = COLORS.findIndex(c => c.value === selectedColor);
              const nextIndex = (colorIndex + 1) % COLORS.length;
              setSelectedColor(COLORS[nextIndex].value);
            }}
          />
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter status order
          </label>
          <Input
            type="number"
            placeholder="Order"
            value={statusOrder}
            onChange={(e) => setStatusOrder(e.target.value)}
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
        data={statuses}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-deviation-statuses-table"
        enableExport={true}
        exportFileName="fitout-deviation-statuses"
        searchTerm=""
        onSearchChange={() => {}}
        searchPlaceholder="Search deviation statuses..."
        pagination={true}
        pageSize={10}
      />
    </div>
  );
};
