"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
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

// Correct shadcn/ui AlertDialog imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeviationStatus {
  id: number;
  society_id: number;
  name: string;
  color_code: string;
  fixed_state: string;
  active: number;
  created_at: string;
  updated_at: string;
  position: number;
  of_phase: string | null;
  of_atype: string;
  email: boolean;
}

interface ApiResponse {
  complaint_statuses: DeviationStatus[];
}

const FIXED_STATES = [
  { value: 'closed', label: 'Closed' },
  // { value: 'false', label: 'False' },
];

const COLORS = [
  { value: '#22C55E', label: 'Green' },
  { value: '#EAB308', label: 'Yellow' },
  { value: '#FF9800', label: 'Orange' },
  { value: '#EF4444', label: 'Red' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#A855F7', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
];

export const DeviationStatusTab: React.FC = () => {
  const [statuses, setStatuses] = useState<DeviationStatus[]>([]);
  const [statusName, setStatusName] = useState('');
  const [statusPosition, setStatusPosition] = useState('');
  const [fixedState, setFixedState] = useState('false');
  const [selectedColor, setSelectedColor] = useState('#22C55E');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse>(
        `${API_CONFIG.BASE_URL}/fitout_categories/get_complaint_statuses.json?q[of_atype_eq]=deviation_details`,
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      setStatuses(response.data.complaint_statuses || []);
    } catch (error: any) {
      console.error('Error fetching deviation statuses:', error);
      toast.error('Failed to load deviation statuses');
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 422) {
        if (data?.message) return data.message;
        if (data?.errors) {
          if (typeof data.errors === 'object' && !Array.isArray(data.errors)) {
            return Object.entries(data.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
          }
          if (Array.isArray(data.errors)) return data.errors.join('; ');
          return JSON.stringify(data.errors);
        }
      }
      if (data?.message) return data.message;
      if (data?.error) return data.error;
    }
    if (error.message?.includes('Network')) return 'Network error - please check your connection';
    return error.message || 'An unexpected error occurred';
  };

  const handleAdd = async () => {
    if (!statusName.trim() || !statusPosition || !fixedState) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        `${API_CONFIG.BASE_URL}/fitout_categories/create_fitout_statuses.json`,
        {
          complaint_status: {
            name: statusName,
            color_code: selectedColor,
            position: parseInt(statusPosition),
            fixed_state: fixedState,
            of_atype: 'deviation_details'
          }
        },
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      toast.success('Deviation status added successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchStatuses();
    } catch (error: any) {
      console.error('Error adding deviation status:', error);
      const msg = getErrorMessage(error);
      toast.error(`Failed to add: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (status: DeviationStatus) => {
    setEditingId(status.id);
    setStatusName(status.name);
    setStatusPosition(status.position.toString());
    setFixedState(status.fixed_state);
    setSelectedColor(status.color_code);
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!statusName.trim() || !statusPosition || !fixedState || !editingId) return;

    try {
      setIsSubmitting(true);
      await axios.put(
        `${API_CONFIG.BASE_URL}/fitout_categories/modify_complaint_status.json`,
        {
          id: editingId,
          name: statusName,
          color_code: selectedColor,
          position: parseInt(statusPosition),
          fixed_state: fixedState,
          of_atype: 'deviation_details'
        },
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      toast.success('Deviation status updated successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchStatuses();
    } catch (error: any) {
      console.error('Error updating deviation status:', error);
      const msg = getErrorMessage(error);
      toast.error(`Failed to update: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;

    try {
      await axios.delete(
        `${API_CONFIG.BASE_URL}/fitout_categories/delete_fitout_statuses/${idToDelete}.json`,
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      toast.success('Deviation status deleted successfully');
      setStatuses((prev) => prev.filter((stat) => stat.id !== idToDelete));
    } catch (error: any) {
      console.error('Error deleting deviation status:', error);
      const msg = getErrorMessage(error);
      toast.error(`Failed to delete: ${msg}`);
    } finally {
      setShowDeleteConfirm(false);
      setIdToDelete(null);
    }
  };

  const resetForm = () => {
    setStatusName('');
    setStatusPosition('');
    setFixedState('false');
    setSelectedColor('#22C55E');
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
    (item: DeviationStatus, columnKey: string) => {
      switch (columnKey) {
        case 'actions':
          return (
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="text-black hover:text-black"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-black hover:text-black"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        case 'position':
          return <span className="font-medium">{item.position}</span>;
        case 'name':
          return <span className="font-medium">{item.name}</span>;
        case 'fixed_state':
          return (
            <span className="font-medium">
              {item.fixed_state
                ? item.fixed_state.charAt(0).toUpperCase() + item.fixed_state.slice(1)
                : ''}
            </span>
          );
        case 'color_code':
          return (
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-6 rounded border border-gray-300"
                style={{ backgroundColor: item.color_code }}
              />
              <span className="text-xs text-gray-600">{item.color_code}</span>
            </div>
          );
        case 'created_at':
          return (
            <span className="text-sm text-gray-600">
              {new Date(item.created_at).toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          );
        default:
          return <span>{String(item[columnKey as keyof DeviationStatus] || '-')}</span>;
      }
    },
    [] // No need for statuses dependency here unless you use it inside
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
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

      {/* Custom Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deviation Status?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the status. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Deviation Status' : 'Add Deviation Status'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the deviation status details below.'
                : 'Enter the deviation status details below.'}
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
              <Label htmlFor="fixed-state">Fixed State *</Label>
              <Select value={fixedState} onValueChange={setFixedState}>
                <SelectTrigger id="fixed-state">
                  <SelectValue placeholder="Select Fixed State" />
                </SelectTrigger>
                <SelectContent>
                  {FIXED_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">Color *</Label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Select Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  type="number"
                  placeholder="Position"
                  value={statusPosition}
                  onChange={(e) => setStatusPosition(e.target.value)}
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