
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { EditComplaintModeModal } from './modals/EditComplaintModeModal';
import { ticketManagementAPI, UserAccountResponse } from '@/services/ticketManagementAPI';
import { toast } from 'sonner';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { API_CONFIG, getAuthHeader, getFullUrl } from '@/config/apiConfig';
import {
  createComplaintMode,
  fetchComplaintModes,
  updateComplaintMode,
  deleteComplaintMode,
  fetchAccounts
} from '@/store/slices/complaintModeSlice';

const complaintModeSchema = z.object({
  complaintMode: z.string().min(1, 'Complaint mode is required'),
});

type ComplaintModeFormData = z.infer<typeof complaintModeSchema>;


interface ComplaintModeType {
  id: number;
  name: string;
  of_phase: string;
  society_id: number;
}

export const ComplaintModeTab: React.FC = () => {
  const dispatch = useDispatch<any>();
  const complaintModesState = useSelector((state: any) => state.complaintModes) || {};
  const { data: complaintModess = [], loading, fetchLoading, error, accounts } = complaintModesState;
  const [complaintModes, setComplaintModes] = useState<ComplaintModeType[]>(complaintModess);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingComplaintMode, setEditingComplaintMode] = useState<any>(null);
  const [userAccount, setUserAccount] = useState<UserAccountResponse | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const form = useForm<ComplaintModeFormData>({
    resolver: zodResolver(complaintModeSchema),
    defaultValues: {
      complaintMode: '',
    },
  });

  useEffect(() => {
    fetchComplaintModes();
    loadUserAccount();
  }, []);

  const loadUserAccount = async () => {
    try {
      const account = await ticketManagementAPI.getUserAccount();
      setUserAccount(account);
    } catch (error) {
      console.error('Error loading user account:', error);
      toast.error('Failed to load user account');
    }
  };

  const fetchComplaintModes = async () => {
    setIsLoading(true);
    try {
      const data = await ticketManagementAPI.getComplaintModes();
      const list = data?.complaint_modes ?? (Array.isArray(data) ? data : []);
      setComplaintModes(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error('Failed to fetch complaint modes');
      console.error('Error fetching complaint modes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async () => {
    // Check for required fields with specific messages like CategoryTypeTab
    if (!form.getValues('complaintMode')?.trim()) {
      toast.error('Please enter complaint mode');
      return;
    }

    // Get the form data
    const data: ComplaintModeFormData = {
      complaintMode: form.getValues('complaintMode'),
    };

    // Continue with the rest of the validation and submission logic
    await handleSubmit(data);
  };

  const handleSubmit = async (data: ComplaintModeFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('complaint_mode[name]', data.complaintMode.trim());

      const response = await fetch(
        getFullUrl('/crm/admin/helpdesk_categories/create_complaint_modes.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 422 && errorData?.name?.includes('has already been taken')) {
          toast.error('Complaint mode name has already been taken');
          return;
        }
        throw new Error(errorData?.message || 'Failed to create complaint mode');
      }

      toast.success('Complaint mode created successfully!');
      form.reset();
      setAddDialogOpen(false);
      fetchComplaintModes();
    } catch (error: any) {
      console.error('Error creating complaint mode:', error);
      toast.error(error.message || 'Failed to create complaint mode');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (complaintMode: any) => {
    setEditingComplaintMode(complaintMode);
    setEditModalOpen(true);
  };

  const handleUpdate = (updatedComplaintMode: ComplaintModeType) => {
    setComplaintModes(complaintModes.map(mode => 
      mode.id === updatedComplaintMode.id ? updatedComplaintMode : mode
    ));
  };

  const handleDelete = async (complaintMode: ComplaintModeType) => {
    if (!confirm('Are you sure you want to delete this complaint mode?')) {
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('id', complaintMode.id.toString());
      formData.append('complaint_mode[active]', '0');

      const response = await fetch(
        getFullUrl('/crm/admin/helpdesk_categories/update_complaint_mode.json?id=' + complaintMode.id),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete complaint mode');
      }

      setComplaintModes(complaintModes.filter(mode => mode.id !== complaintMode.id));
      toast.success('Complaint mode deleted successfully!');
    } catch (error) {
      console.error('Error deleting complaint mode:', error);
      toast.error('Failed to delete complaint mode');
    }
  };

  const columns = [
    { key: 'id', label: 'Sr.No', sortable: true },
    { key: 'name', label: 'Complaint Mode', sortable: true },
  ];

  const renderCell = (item: any, columnKey: string) => {
    if (columnKey === 'srNo') return item.srNo || '';
    return item[columnKey];
  };

  const renderActions = (item: any) => (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add Complaint Mode Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) form.reset();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Complaint Mode</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <div className="py-2">
              <FormField
                control={form.control}
                name="complaintMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complaint Mode <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter complaint mode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setAddDialogOpen(false); form.reset(); }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => { await handleCreateSubmit(); if (!isSubmitting) setAddDialogOpen(false); }}
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              {isSubmitting ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EnhancedTable
          data={complaintModes}
          columns={columns}
          renderCell={renderCell}
          renderActions={renderActions}
          storageKey="complaint-modes-table"
          enableSearch={true}
          searchPlaceholder="Search complaint modes..."
          leftActions={
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          }
        />
      </div>

      <EditComplaintModeModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        complaintMode={editingComplaintMode ? {
          id: editingComplaintMode.id.toString(),
          srNo: editingComplaintMode.id,
          complaintMode: editingComplaintMode.name
        } : null}
        onUpdate={(updatedMode) => {
          if (editingComplaintMode) {
            const updated = {
              ...editingComplaintMode,
              name: updatedMode.complaintMode
            };
            handleUpdate(updated);
          }
        }}
      />
    </div>
  );
};