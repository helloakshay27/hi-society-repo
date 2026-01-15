import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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

const FIXED_STATES = ['Pending', 'In Progress', 'Completed', 'On Hold', 'Rejected'];
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

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/admin/fitout_requests/fitout_statuses.json');
      const statusesData = response.data?.data || [];
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
      const newStatus = response.data?.complaint_status;
      if (newStatus) {
        setStatuses(Array.isArray(statuses) ? [...statuses, newStatus] : [newStatus]);
      }
      resetForm();
    } catch (error) {
      console.error('Error adding status:', error);
      toast.error('Failed to add status');
    }
  };

  const handleEdit = useCallback((status: Status) => {
    setEditingId(status.id);
    setStatusName(status.name);
    setStatusOrder(status.position.toString());
    setFixedState(status.fixed_state || '');
    setSelectedColor(status.color_code);
  }, []);

  const handleUpdate = async () => {
    if (!statusName.trim() || !statusOrder || !editingId) return;

    try {
      const response = await apiClient.put(`/crm/admin/fitout_categories/update_fitout_statuses/${editingId}.json`, {
        complaint_status: {
          name: statusName,
          color_code: selectedColor,
          position: parseInt(statusOrder),
          fixed_state: fixedState || '',
          of_phase: 'fitout_category',
          of_atype: 'fitout_category'
        }
      });
      toast.success(response.data?.message || 'Status updated successfully');
      setStatuses(Array.isArray(statuses) ? statuses.map(stat => 
        stat.id === editingId 
          ? { ...stat, name: statusName, position: parseInt(statusOrder), fixed_state: fixedState || '', color_code: selectedColor }
          : stat
      ) : []);
      resetForm();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Name <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Enter status name"
            value={statusName}
            onChange={(e) => setStatusName(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fixed State <span className="text-gray-400 text-xs">(Optional)</span>
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
        <div className="w-20">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
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
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            placeholder="Position"
            value={statusOrder}
            onChange={(e) => setStatusOrder(e.target.value)}
            min="1"
          />
        </div>
        <Button
          onClick={editingId ? handleUpdate : handleAdd}
          className="bg-[#2C3F87] hover:bg-[#1e2a5e] text-white"
          disabled={loading}
        >
          {editingId ? 'Update' : '+ Add'}
        </Button>
        {editingId && (
          <Button
            onClick={resetForm}
            variant="outline"
            className="border-gray-300"
          >
            Cancel
          </Button>
        )}
      </div>

      <EnhancedTable
        data={statuses}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-statuses-table"
        enableExport={true}
        exportFileName="fitout-statuses"
        searchTerm=""
        onSearchChange={() => {}}
        searchPlaceholder="Search statuses..."
        pagination={true}
        pageSize={10}
      />
    </div>
  );
};
