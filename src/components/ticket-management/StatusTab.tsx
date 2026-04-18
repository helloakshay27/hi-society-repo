
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ticketManagementAPI, UserAccountResponse } from '@/services/ticketManagementAPI';
import { EditStatusModal } from './modals/EditStatusModal';
import { toast } from 'sonner';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStatuses, createStatus, updateStatus, deleteStatus, fetchAccounts } from '@/store/slices/statusesSlice';
import { API_CONFIG, getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { TextField, FormControl as MuiFormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { fieldStyles, menuProps } from './fieldStyles';

const statusSchema = z.object({
  name: z.string().min(1, 'Status is required'),
  fixedState: z.enum(['closed', 'reopen', 'complete']).optional(),
  colorCode: z.string().min(1, 'Color code is required'),
  position: z.number().min(1, 'Order must be positive'),
});

type StatusFormData = z.infer<typeof statusSchema>;

interface StatusType {
  id: number;
  name: string;
  fixed_state: string;
  color_code: string;
  position: number;
  email: boolean;
}

const fixedStates = [
  { value: 'closed', label: 'Closed' },
  { value: 'reopen', label: 'Reopen' },
  { value: 'complete', label: 'Complete' },
  { value: 'customer action pending', label: 'Customer Action Pending' },
];

export const StatusTab: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { data: statusess = [], loading, fetchLoading, error } = useSelector((state: any) => state.statuses) || {};
  const { accounts = [] } = useSelector((state: any) => state.complaintModes) || {}; // adjust if you have a separate accounts slice
  const [statuses, setStatuses] = useState<StatusType[]>(statusess);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allowReopen, setAllowReopen] = useState(false);
  const [periodType, setPeriodType] = useState<'days' | 'hours' | 'minutes'>('days');
  const [timePeriod, setTimePeriod] = useState('');
  const [userAccount, setUserAccount] = useState<UserAccountResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusType | null>(null);
  const [closeByUser, setCloseByUser] = useState(false);
  const [autoComplaintClose, setAutoComplaintClose] = useState(false);
  const [isSavingTicketSettings, setIsSavingTicketSettings] = useState(false);
  const [settingsSocietyId, setSettingsSocietyId] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const currentSiteId =
    accounts && accounts.length > 0
      ? accounts[0].site_id || accounts[0].society_id || '15'
      : '15';

  const form = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      name: '',
      fixedState: '' as any,
      colorCode: '#000000',
      position: 1,
    },
  });

  useEffect(() => {
    fetchStatuses();
    loadUserAccount();
    fetchComplaintSettings();
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

  const handleSaveTicketSettings = async () => {
    const societyId = settingsSocietyId || userAccount?.company_id;
    if (!societyId) {
      toast.error('Unable to determine society ID. Please refresh and try again.');
      return;
    }
    setIsSavingTicketSettings(true);
    try {
      const url = getFullUrl(`/societies/${societyId}.json`);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          society: {
            auto_complaint_close: autoComplaintClose,
            close_by_user: closeByUser,
          },
        }),
      });
      if (response.ok) {
        toast.success('Ticket settings updated successfully!');
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || errorData?.error || 'Failed to update ticket settings');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Failed to update ticket settings';
      console.error('Error saving ticket settings:', error);
      toast.error(msg);
    } finally {
      setIsSavingTicketSettings(false);
    }
  };

  const fetchComplaintSettings = async () => {
    try {
      const url = getFullUrl('/crm/admin/complaint_settings_index.json');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();

        // Populate reopen settings
        const reopen = data.reopen_status;
        if (reopen && reopen.period_type && reopen.time_period) {
          setAllowReopen(true);
          setPeriodType(reopen.period_type as 'days' | 'hours' | 'minutes');
          setTimePeriod(reopen.time_period.toString());
        } else {
          setAllowReopen(false);
        }

        // Populate society ticket settings
        const societySettings = data.society_settings;
        if (societySettings) {
          setCloseByUser(societySettings.close_by_user || false);
          setAutoComplaintClose(societySettings.auto_complaint_close || false);
          if (societySettings.society_id) {
            setSettingsSocietyId(societySettings.society_id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching complaint settings:', error);
    }
  };

  const fetchStatuses = async () => {
    setIsLoading(true);
    try {
      const data = await ticketManagementAPI.getStatuses();
      const list = data?.complaint_statuses ?? (Array.isArray(data) ? data : []);
      setStatuses(Array.isArray(list) ? list : []);
    } catch (error: any) {
      const msg = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Failed to fetch statuses';
      toast.error(msg);
      console.error('Error fetching statuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async () => {
    const values = form.getValues();

    if (!values.name?.trim()) {
      toast.error('Please enter a status name');
      return;
    }

    if (!values.colorCode?.trim()) {
      toast.error('Please enter a color code');
      return;
    }

    if (!values.position) {
      toast.error('Please enter an order number');
      return;
    }

    const data: StatusFormData = {
      name: values.name.trim(),
      fixedState: values.fixedState as 'closed' | 'reopen' | 'complete' | '',
      colorCode: values.colorCode.trim(),
      position: values.position,
    };

    await handleSubmit(data);
  };

  const handleSubmit = async (data: StatusFormData) => {
    if (!userAccount?.company_id) {
      toast.error('Unable to determine company ID. Please refresh and try again.');
      return;
    }

    // Check if position already exists
    const positionExists = statuses.some(status => status.position === data.position);
    if (positionExists) {
      toast.error('Order already exists. Please enter a different order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const statusData = {
        name: data.name,
        fixed_state: data.fixedState,
        color_code: data.colorCode,
        position: data.position,
        // of_phase: 'pms',
        // society_id: userAccount.company_id.toString(),
      };

      await ticketManagementAPI.createStatus(statusData);
      toast.success('Status created successfully!');
      form.reset();
      setAddDialogOpen(false);
      fetchStatuses();
    } catch (error: any) {
      const msg = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Failed to create status';
      toast.error(msg);
      console.error('Error creating status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAllowReopenChange = async (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setAllowReopen(isChecked);

    // If unchecking, clear the period values
    if (!isChecked) {
      setPeriodType('days');
      setTimePeriod('');
    }
  };

  const handleSaveReopen = async () => {
    if (!timePeriod || parseInt(timePeriod) <= 0) {
      toast.error('Please enter a valid time period');
      return;
    }

    try {
      const url = getFullUrl('/crm/admin/create_reopen.json');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period_type: periodType,
          time_period: timePeriod,
        }),
      });

      if (response.ok) {
        toast.success('Reopen settings saved successfully!');
        await fetchComplaintSettings();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || errorData?.error || 'Failed to save reopen settings');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Failed to save reopen settings';
      console.error('Error saving reopen settings:', error);
      toast.error(msg);
    }
  };

  const handleEdit = (status: StatusType) => {
    setSelectedStatus(status);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedStatus(null);
  };

  const handleStatusUpdated = () => {
    fetchStatuses();
    handleEditModalClose();
  };

  const handleDelete = async (status: StatusType) => {
    if (!confirm('Are you sure you want to delete this status?')) {
      return;
    }

    try {
      // Use apiConfig for baseURL and token
      const url = getFullUrl('/pms/admin/modify_complaint_status.json');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: status.id,
          active: 0
        }),
      });

      if (response.ok) {
        setStatuses(statuses.filter(s => s.id !== status.id));
        toast.success('Status deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || errorData?.error || 'Failed to delete status');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Failed to delete status';
      console.error('Error deleting status:', error);
      toast.error(msg);
    }
  };


  const columns = [
    { key: 'position', label: 'Order', sortable: true },
    { key: 'name', label: 'Status', sortable: true },
    { key: 'fixed_state', label: 'Fixed State', sortable: true },
    { key: 'color_code', label: 'Color', sortable: false },
    // { key: 'email', label: 'Email', sortable: true },
  ];

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'color_code':
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: item.color_code }}
            />
            <span>{item.color_code}</span>
          </div>
        );
      case 'email':
        return item.email ? 'Yes' : 'No';
      case 'fixed_state':
        return fixedStates.find(state => state.value === item.fixed_state)?.label || item.fixed_state;
      default:
        return item[columnKey];
    }
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
    <div className="space-y-6">
      {/* Add Status Dialog */}
      <Dialog open={addDialogOpen} modal={false} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) form.reset();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Status</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TextField
                        label={<>Status <span style={{ color: 'red' }}>*</span></>}
                        placeholder="Enter status"
                        value={field.value}
                        onChange={field.onChange}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: fieldStyles }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fixedState"
                render={({ field }) => (
                  <FormItem>
                    <MuiFormControl fullWidth variant="outlined">
                      <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Fixed State</InputLabel>
                      <MuiSelect
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        displayEmpty
                        label="Fixed State"
                        sx={fieldStyles}
                        MenuProps={menuProps}
                      >
                        <MenuItem value=""><em>Select fixed state</em></MenuItem>
                        {fixedStates.map((state) => (
                          <MenuItem key={state.value} value={state.value}>
                            {state.label}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </MuiFormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="colorCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex gap-2">
                        <input type="color" className="w-16 h-10 p-1 border rounded" value={field.value} onChange={field.onChange} />
                        <TextField
                          placeholder="#000000"
                          value={field.value}
                          onChange={field.onChange}
                          fullWidth
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ sx: fieldStyles }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TextField
                        label={<>Order <span style={{ color: 'red' }}>*</span></>}
                        type="number"
                        placeholder="Enter order"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: fieldStyles }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); form.reset(); }} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={async () => { await handleCreateSubmit(); }}
              disabled={isSubmitting || loading}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              {isSubmitting || loading ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EnhancedTable
          data={statuses}
          columns={columns}
          renderCell={renderCell}
          renderActions={renderActions}
          storageKey="status-table"
          enableSearch={true}
          searchPlaceholder="Search statuses..."
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

      {/* Reopen & Ticket Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowReopen"
                checked={allowReopen}
                onCheckedChange={handleAllowReopenChange}
              />
              <label htmlFor="allowReopen" className="text-sm font-medium">
                Allow User to reopen ticket after closure
              </label>
            </div>

            {allowReopen && (
              <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Period Type <span className="text-red-500">*</span>
                    </label>
                    <Select value={periodType} onValueChange={(value: 'days' | 'hours' | 'minutes') => {
                      setPeriodType(value);
                      setTimePeriod('');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Time Period <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter time period"
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveReopen} className="bg-[#C72030] hover:bg-[#a01828] text-white">
                    Save Reopen Settings
                  </Button>
                </div>
                {timePeriod && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm">
                      <span className="font-semibold">Selected Time Period:</span> {timePeriod} {periodType}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="closeByUser"
                  checked={closeByUser}
                  onCheckedChange={(checked) => setCloseByUser(checked === true)}
                />
                <label htmlFor="closeByUser" className="text-sm font-medium">
                  Close Tickets by User
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoComplaintClose"
                  checked={autoComplaintClose}
                  onCheckedChange={(checked) => setAutoComplaintClose(checked === true)}
                />
                <label htmlFor="autoComplaintClose" className="text-sm font-medium">
                  Auto Close Tickets
                </label>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveTicketSettings}
                  disabled={isSavingTicketSettings}
                  className="bg-[#C72030] hover:bg-[#a01828] text-white"
                >
                  {isSavingTicketSettings ? 'Saving...' : 'Update'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditStatusModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        status={selectedStatus}
        onUpdate={handleStatusUpdated}
      />
    </div>
  );
};