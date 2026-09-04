import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { FormControl as MuiFormControl, InputLabel, Select as MuiSelect, MenuItem, TextField } from '@mui/material';
import { fieldStyles, menuProps } from '../ticket-management/fieldStyles';
import { EnhancedTable } from '../enhanced-table/EnhancedTable';
import { apiClient } from '@/utils/apiClient';
import { StatusToggle } from './StatusToggle';
import { fetchCategories } from '@/services/wasteGenerationAPI';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    } catch (error: any) {
      console.error('Error adding status:', error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        'Failed to add status';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

   const handleToggle = async (id: number, currentStatus: boolean) => {
      try {
        await apiClient.put(`/crm/admin/fitout_categories/modify_complaint_status.json`, {
          complaint_statuses: {
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
    } catch (error: any) {
      console.error('Error updating status:', error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        'Failed to update status';
      toast.error(msg);
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
        key: 'active',
        label: 'Status',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      }
    ],
    []
  );

  const renderCell = useCallback((item: Status, columnKey: string, index: number) => {
    switch (columnKey) {
      case 'sr_no':
        return <span>{startIndex + index + 1}</span>;
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
      case 'active':
        return (
          <StatusToggle
            checked={item.active || false}
            onChange={() => handleToggle(item.id, item.active)}
          />
        );
      default:
        return <span>{String(item[columnKey as keyof Status] || '-')}</span>;
    }
  }, [handleDelete, handleEdit, startIndex]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <EnhancedTable
        data={paginatedStatuses}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-statuses-table"
        enableExport={true}
        exportFileName="fitout-statuses"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search statuses..."
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

      {/* Add/Edit Status Dialog */}
      <Dialog modal={false} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Status' : 'Add Status'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the status details below.' : 'Enter the status details below.'}
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
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Fixed State (Optional)</InputLabel>
              <MuiSelect
                value={fixedState}
                onChange={(e) => setFixedState(e.target.value)}
                displayEmpty
                label="Fixed State (Optional)"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Fixed State</em></MenuItem>
                {FIXED_STATES.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </MuiSelect>
            </MuiFormControl>

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
              <TextField
                label={<>Position <span style={{ color: 'red' }}>*</span></>}
                type="number"
                placeholder="Position"
                value={statusOrder}
                onChange={(e) => setStatusOrder(e.target.value)}
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
              type="submit"
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
