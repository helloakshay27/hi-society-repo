"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { FormControl as MuiFormControl, InputLabel, Select as MuiSelect, MenuItem, TextField } from '@mui/material';
import { fieldStyles, menuProps } from '../ticket-management/fieldStyles';
import { EnhancedTable } from '../enhanced-table/EnhancedTable';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    if (!statusName.trim() || !statusPosition ) {
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
        `${API_CONFIG.BASE_URL}/fitout_categories/modify_complaint_status/${editingId}.json`,
        {
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

  const filteredStatuses = useMemo(() => {
    if (!searchTerm.trim()) return statuses;
    const query = searchTerm.toLowerCase();
    return statuses.filter((item) =>
      Object.values(item).some((v) => String(v ?? '').toLowerCase().includes(query))
    );
  }, [statuses, searchTerm]);

  const totalCount = filteredStatuses.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStatuses = filteredStatuses.slice(startIndex, startIndex + itemsPerPage);

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
        draggable: true,
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
    (item: DeviationStatus, columnKey: string, index: number) => {
      switch (columnKey) {
        case 'sr_no':
          return <span>{startIndex + index + 1}</span>;
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
    [startIndex]
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <EnhancedTable
        data={paginatedStatuses}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-deviation-statuses-table"
        enableExport={true}
        exportFileName="fitout-deviation-statuses"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search deviation statuses..."
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
      <Dialog modal={false} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <TextField
              label={<>Status Name <span style={{ color: 'red' }}>*</span></>}
              placeholder="Enter status name"
              value={statusName}
              onChange={(e) => setStatusName(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Fixed State</InputLabel>
              <MuiSelect
                value={fixedState}
                onChange={(e) => setFixedState(e.target.value)}
                displayEmpty
                label="Fixed State"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Fixed State</em></MenuItem>
                {FIXED_STATES.map((state) => (
                  <MenuItem key={state.value} value={state.value}>
                    {state.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </MuiFormControl>

            <div className="grid grid-cols-2 gap-4">
              <MuiFormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Color <span style={{ color: 'red' }}>*</span></InputLabel>
                <MuiSelect
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  displayEmpty
                  label="Color *"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                  renderValue={(value) => {
                    const color = COLORS.find((c) => c.value === value);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: value as string }} />
                        {color?.label}
                      </div>
                    );
                  }}
                >
                  {COLORS.map((color) => (
                    <MenuItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: color.value }} />
                        {color.label}
                      </div>
                    </MenuItem>
                  ))}
                </MuiSelect>
              </MuiFormControl>

              <TextField
                label={<>Position <span style={{ color: 'red' }}>*</span></>}
                type="number"
                placeholder="Position"
                value={statusPosition}
                onChange={(e) => setStatusPosition(e.target.value)}
                inputProps={{ min: 1 }}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
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