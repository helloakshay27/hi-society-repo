
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { staffService, SocietyStaffDetails, StaffFormData, StaffFiltersResponse } from '@/services/staffService';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';

// Field styles for Material-UI components
const fieldStyles = {
  height: '45px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-root': {
    height: '45px',
    '& fieldset': {
      borderColor: '#ddd',
    },
    '&:hover fieldset': {
      borderColor: '#C72030',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#C72030',
    },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: '#C72030',
    },
  },
};

interface ScheduleDay {
  day: string;
  enabled: boolean;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
}

interface ScheduleDataEntry {
  checked: boolean;
  startTime: string;
  startMinute: string;
  endTime: string;
  endMinute: string;
}

interface ScheduleData {
  [key: string]: ScheduleDataEntry;
}

export const EditStaffPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // API state management
  const [staff, setStaff] = useState<SocietyStaffDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Staff filters state (from /crm/admin/staff_filters.json)
  const [staffFilters, setStaffFilters] = useState<StaffFiltersResponse | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Load staff data from API
  useEffect(() => {
    const loadStaffData = async () => {
      if (!id) {
        setError('No staff ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const staffDetails = await staffService.getStaffDetails(id);
        setStaff(staffDetails);
      } catch (err) {
        console.error('Error loading staff details:', err);
        setError('Failed to load staff details');
      } finally {
        setLoading(false);
      }
    };

    loadStaffData();
  }, [id]);

  // Fetch staff filters on component mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoadingFilters(true);
        const filters = await staffService.getStaffFilters();
        setStaffFilters(filters);
      } catch (error) {
        console.error('Failed to fetch staff filters:', error);
        toast.error('Failed to load dropdown options');
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilters();
  }, []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    mobile: '',
    staffType: '',
    workType: '',
    associateFunctionId: '',
    staffId: '',
    vendorName: '',
    validFrom: '',
    validTill: '',
    status: '',
    notes: ''
  });

  // Update form data when staff data and filters are loaded
  useEffect(() => {
    if (staff && staffFilters) {
      const nameParts = staff.full_name.split(' ');
      
      // Map staff_type from API to dropdown value
      // API returns staff_type as a label string like "Society", "Personal", "Shared"
      let staffTypeValue = '';
      if (staff.staff_type) {
        const matchingStaffType = staffFilters.staff_types?.find(
          st => st.label.toLowerCase() === staff.staff_type?.toLowerCase() ||
                String(st.value).toLowerCase() === staff.staff_type?.toLowerCase()
        );
        staffTypeValue = matchingStaffType ? String(matchingStaffType.value) : staff.staff_type || '';
      }

      // Map work type from API to dropdown value
      // API returns work_type as a label string like "House Keeping", not the numeric ID
      // So we match by label first, then fall back to type_id if available
      let workTypeValue = '';
      if (staff.work_type_name) {
        const matchingWorkType = staffFilters.work_types?.find(
          wt => wt.label.toLowerCase() === staff.work_type_name?.toLowerCase()
        );
        workTypeValue = matchingWorkType ? String(matchingWorkType.value) : '';
      }
      // Fallback: if we have a numeric type_id and didn't find by name
      if (!workTypeValue && staff.type_id && staff.type_id !== 0) {
        const matchingWorkType = staffFilters.work_types?.find(
          wt => wt.value === staff.type_id
        );
        workTypeValue = matchingWorkType ? String(matchingWorkType.value) : String(staff.type_id);
      }
      
      // Map status from API response to dropdown value
      // API returns status as { value: 1, label: "Approved" }
      let statusValue = '';
      if (staff.status_text) {
        const matchingStatus = staffFilters.statuses?.find(
          s => s.label.toLowerCase() === staff.status_text?.toLowerCase()
        );
        statusValue = matchingStatus ? String(matchingStatus.value) : '';
      }
      // Fallback: use raw status value if available
      if (!statusValue && staff.status !== undefined && staff.status !== '') {
        statusValue = String(staff.status);
      }
      
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: staff.email || '',
        password: '', // Don't populate password for security
        mobile: staff.mobile || '',
        staffType: staffTypeValue,
        workType: workTypeValue,
        associateFunctionId: '', // Will be set if available from API
        staffId: staff.soc_staff_id || '',
        vendorName: staff.vendor_name || '',
        validFrom: staff.valid_from || '',
        validTill: staff.expiry || '',
        status: statusValue,
        notes: staff.notes || ''
      });
    }
  }, [staff, staffFilters]);

  const [schedule, setSchedule] = useState<ScheduleDay[]>([
    { day: 'Monday', enabled: false, startHour: '00', startMinute: '00', endHour: '00', endMinute: '00' },
    { day: 'Tuesday', enabled: true, startHour: '13', startMinute: '00', endHour: '15', endMinute: '00' },
    { day: 'Wednesday', enabled: false, startHour: '00', startMinute: '00', endHour: '00', endMinute: '00' },
    { day: 'Thursday', enabled: false, startHour: '00', startMinute: '00', endHour: '00', endMinute: '00' },
    { day: 'Friday', enabled: false, startHour: '00', startMinute: '00', endHour: '00', endMinute: '00' },
    { day: 'Saturday', enabled: false, startHour: '00', startMinute: '00', endHour: '00', endMinute: '00' },
    { day: 'Sunday', enabled: false, startHour: '00', startMinute: '00', endHour: '00', endMinute: '00' }
  ]);

  const [attachments, setAttachments] = useState({
    profilePicture: null as File | null,
    manuals: null as File | null
  });

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-[#f6f4ee] min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading staff details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !staff) {
    return (
      <div className="p-6 bg-[#f6f4ee] min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            {error || 'Staff Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'The requested staff member could not be found.'}
          </p>
          <Button onClick={() => navigate('/smartsecure/staff')}>
            Back to Staff List
          </Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/smartsecure/staff');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScheduleChange = (dayIndex: number, field: keyof ScheduleDay, value: string | boolean) => {
    setSchedule(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, [field]: value } : day
    ));
  };

  const handleFileUpload = (type: keyof typeof attachments, file: File | null) => {
    setAttachments(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const handleSubmit = async () => {
    if (!id || !staff) {
      toast.error('Staff ID not available');
      return;
    }

    setSaving(true);
    try {
      // Convert schedule format to match staffService expectations
      const scheduleData: ScheduleData = {};
      schedule.forEach((day, index) => {
        const dayKey = day.day.toLowerCase();
        scheduleData[dayKey] = {
          checked: day.enabled,
          startTime: day.startHour,
          startMinute: day.startMinute,
          endTime: day.endHour,
          endMinute: day.endMinute
        };
      });

      const formDataToSubmit: StaffFormData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile,
        staffType: formData.staffType,
        workType: formData.workType,
        associateFunctionId: formData.associateFunctionId,
        staffId: formData.staffId,
        vendorName: formData.vendorName,
        validFrom: formData.validFrom,
        validTill: formData.validTill,
        status: formData.status,
        notes: formData.notes
      };

      await staffService.updateStaff(id, formDataToSubmit, scheduleData, {
        profilePicture: attachments.profilePicture || undefined,
        documents: [],
        capturedPhoto: undefined
      });
      
      // Navigate back to staff list after successful update
      navigate('/smartsecure/staff');
    } catch (error) {
      console.error('Error updating staff:', error);
      // Error is already handled in the service with toast
    } finally {
      setSaving(false);
    }
  };

  const generateHourOptions = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i.toString().padStart(2, '0'));
    }
    return hours;
  };

  const generateMinuteOptions = () => {
    const minutes = [];
    for (let i = 0; i < 60; i++) {
      minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">EDIT STAFF</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {/* Section 1: Staff Details */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              Staff Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField
                label="First Name*"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Last Name*"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Password"
                type="password"
                placeholder="Leave empty to keep current password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Mobile*"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              {/* Staff Type Dropdown - from staff_filters API */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ '&.Mui-focused': { color: '#C72030' } }}>
                  Staff Type
                </InputLabel>
                <MuiSelect
                  value={formData.staffType}
                  onChange={(e) => handleInputChange('staffType', e.target.value)}
                  label="Staff Type"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>
                    {loadingFilters ? "Loading..." : "Select Staff Type"}
                  </MenuItem>
                  {staffFilters?.staff_types?.map((item, index) => (
                    <MenuItem key={`staff-type-${index}`} value={String(item.value)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Work Type Dropdown - from staff_filters API */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ '&.Mui-focused': { color: '#C72030' } }}>
                  Work Type
                </InputLabel>
                <MuiSelect
                  value={formData.workType}
                  onChange={(e) => handleInputChange('workType', e.target.value)}
                  label="Work Type"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>
                    {loadingFilters ? "Loading..." : "Select Work Type"}
                  </MenuItem>
                  {staffFilters?.work_types?.map((item, index) => (
                    <MenuItem key={`work-type-${index}`} value={String(item.value)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Association Type (Function) Dropdown - from staff_filters API */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ '&.Mui-focused': { color: '#C72030' } }}>
                  Association Type
                </InputLabel>
                <MuiSelect
                  value={formData.associateFunctionId}
                  onChange={(e) => handleInputChange('associateFunctionId', e.target.value)}
                  label="Association Type"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>
                    {loadingFilters ? "Loading..." : "Select Association Type"}
                  </MenuItem>
                  {staffFilters?.functions?.map((item, index) => (
                    <MenuItem key={`function-${index}`} value={String(item.value)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
              
              <TextField
                label="Staff ID"
                placeholder="Enter Staff ID"
                value={formData.staffId}
                onChange={(e) => handleInputChange('staffId', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Vendor Name"
                placeholder="Vendor Name"
                value={formData.vendorName}
                onChange={(e) => handleInputChange('vendorName', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Valid From*"
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleInputChange('validFrom', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Valid Till*"
                type="date"
                value={formData.validTill}
                onChange={(e) => handleInputChange('validTill', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              {/* Status Dropdown - from staff_filters API */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ '&.Mui-focused': { color: '#C72030' } }}>
                  Status
                </InputLabel>
                <MuiSelect
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  label="Status"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>
                    {loadingFilters ? "Loading..." : "Select Status"}
                  </MenuItem>
                  {staffFilters?.statuses?.map((item, index) => (
                    <MenuItem key={`status-${index}`} value={String(item.value)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </div>

            {/* Notes - full width textarea */}
            <div>
              <TextField
                label="Notes"
                placeholder="Enter notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: {
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#ddd',
                    },
                    '&:hover fieldset': {
                      borderColor: '#C72030',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#C72030',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Attachments */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              Add Attachments
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Profile Picture Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('profilePicture', e.target.files?.[0] || null)}
                    className="hidden"
                    id="profile-picture-upload"
                  />
                  <label htmlFor="profile-picture-upload" className="cursor-pointer">
                    <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      Drag & Drop or <span className="text-red-500 cursor-pointer font-medium">Choose File</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </label>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Documents Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload('manuals', e.target.files?.[0] || null)}
                    className="hidden"
                    id="manuals-upload"
                  />
                  <label htmlFor="manuals-upload" className="cursor-pointer">
                    <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      Drag & Drop or <span className="text-red-500 cursor-pointer font-medium">Choose File</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC up to 10MB</p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Schedule */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              Schedule Information
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-4 text-left font-medium text-gray-700">Day</th>
                    <th className="border border-gray-200 p-4 text-center font-medium text-gray-700">Start Time</th>
                    <th className="border border-gray-200 p-4 text-center font-medium text-gray-700">End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((scheduleDay, index) => (
                    <tr key={scheduleDay.day} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            aria-label={`Enable ${scheduleDay.day}`}
                            checked={scheduleDay.enabled}
                            onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                          />
                          <span className="capitalize font-medium text-gray-700">{scheduleDay.day}</span>
                        </div>
                      </td>
                      <td className="border border-gray-200 p-4">
                        <div className="flex gap-2 justify-center">
                          <Select 
                            value={scheduleDay.startHour}
                            onValueChange={(value) => handleScheduleChange(index, 'startHour', value)}
                          >
                            <SelectTrigger className="w-16 h-8 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {generateHourOptions().map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="flex items-center text-gray-500">:</span>
                          <Select 
                            value={scheduleDay.startMinute}
                            onValueChange={(value) => handleScheduleChange(index, 'startMinute', value)}
                          >
                            <SelectTrigger className="w-16 h-8 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {generateMinuteOptions().map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="border border-gray-200 p-4">
                        <div className="flex gap-2 justify-center">
                          <Select 
                            value={scheduleDay.endHour}
                            onValueChange={(value) => handleScheduleChange(index, 'endHour', value)}
                          >
                            <SelectTrigger className="w-16 h-8 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {generateHourOptions().map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="flex items-center text-gray-500">:</span>
                          <Select 
                            value={scheduleDay.endMinute}
                            onValueChange={(value) => handleScheduleChange(index, 'endMinute', value)}
                          >
                            <SelectTrigger className="w-16 h-8 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {generateMinuteOptions().map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <Button 
            type="submit"
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              'Update Staff'
            )}
          </Button>
          <Button 
            type="button"
            variant="outline"
            onClick={handleBack}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
