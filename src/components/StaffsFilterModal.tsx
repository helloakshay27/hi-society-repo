
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { toast } from 'sonner';
import { StaffFilters } from '@/services/societyStaffsAPI';
import { TextField, FormControl, Select as MuiSelect, MenuItem } from '@mui/material';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';

interface FilterOption {
  label: string;
  value: string | number;
}

interface StaffsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: StaffFilters) => void;
}

export const StaffsFilterModal = ({ isOpen, onClose, onApplyFilters }: StaffsFilterModalProps) => {
  const [search, setSearch] = useState('');
  const [workType, setWorkType] = useState('');
  const [staffType, setStaffType] = useState('');
  const [functionId, setFunctionId] = useState('');
  const [tower, setTower] = useState('');
  const [flat, setFlat] = useState('');
  const [status, setStatus] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [workTypes, setWorkTypes] = useState<FilterOption[]>([]);
  const [staffTypes, setStaffTypes] = useState<FilterOption[]>([]);
  const [functions, setFunctions] = useState<FilterOption[]>([]);
  const [towers, setTowers] = useState<FilterOption[]>([]);
  const [flats, setFlats] = useState<FilterOption[]>([]);
  const [statuses, setStatuses] = useState<FilterOption[]>([]);
  const [loadingFlats, setLoadingFlats] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFilterData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (tower) {
      loadFlats(tower);
    } else {
      setFlats([]);
      setFlat('');
    }
  }, [tower]);

  const loadFilterData = async () => {
    try {
      const response = await fetch(getFullUrl('/crm/admin/staff_filters.json'), {
        headers: { Authorization: getAuthHeader() },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkTypes(data.work_types || []);
        setStaffTypes(data.staff_types || []);
        setFunctions(data.functions || []);
        setTowers(data.towers || []);
        setStatuses(data.statuses || []);
      }
    } catch {
      toast.error('Failed to load filter options');
    }
  };

  const loadFlats = async (towerId: string) => {
    setLoadingFlats(true);
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/staff_filters.json?q[society_staff_staff_workings_society_flat_society_block_id_eq]=${towerId}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (response.ok) {
        const data = await response.json();
        setFlats(data.flats || []);
      }
    } catch {
      console.error('Error loading flats');
    } finally {
      setLoadingFlats(false);
    }
  };

  const handleApply = () => {
    const filters: StaffFilters = {};
    if (search) filters.search = search;
    if (workType) filters.work_type_id = Number(workType);
    if (staffType) filters.staff_type = staffType;
    if (functionId) filters.function_id = Number(functionId);
    if (tower) filters.tower_id = Number(tower);
    if (flat) filters.flat_id = Number(flat);
    if (status !== '') filters.status = status === '__empty__' ? '' : status;
    if (companyName) filters.company_name = companyName;
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setSearch('');
    setWorkType('');
    setStaffType('');
    setFunctionId('');
    setTower('');
    setFlat('');
    setStatus('');
    setCompanyName('');
    onApplyFilters({});
  };

  const renderTextField = (
    label: string,
    placeholder: string,
    value: string,
    onChange: (value: string) => void,
  ) => (
    <div className="space-y-2">
      <label className="block text-[12.5px] font-semibold text-[rgba(26,26,24,.68)]">{label}</label>
      <TextField
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        fullWidth
        variant="outlined"
        sx={{
          ...fieldStyles,
          '& .MuiOutlinedInput-root': {
            height: 50,
            borderRadius: '12px',
            fontSize: '13.5px',
            '& fieldset': { borderColor: 'rgba(26,26,24,.10)' },
            '&:hover fieldset': { borderColor: 'rgba(26,26,24,.24)' },
            '&.Mui-focused fieldset': { borderColor: '#1A1A18', borderWidth: 1 },
          },
        }}
      />
    </div>
  );

  const renderSelectField = (
    label: string,
    placeholder: string,
    value: string,
    onChange: (value: string) => void,
    options: FilterOption[],
    disabled = false,
  ) => (
    <div className="space-y-2">
      <label className="block text-[12.5px] font-semibold text-[rgba(26,26,24,.68)]">{label}</label>
      <FormControl fullWidth variant="outlined" disabled={disabled}>
        <MuiSelect
          value={value}
          onChange={(event) => onChange(String(event.target.value))}
          displayEmpty
          sx={{
            ...fieldStyles,
            height: 50,
            borderRadius: '12px',
            color: value ? '#1A1A18' : 'rgba(26,26,24,.38)',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(26,26,24,.10)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(26,26,24,.24)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1A1A18', borderWidth: 1 },
            '& .MuiSelect-select': { padding: '14px 16px', fontSize: '13.5px' },
          }}
          MenuProps={menuProps}
        >
          <MenuItem value="">{placeholder}</MenuItem>
          {options.map((option, index) => (
            <MenuItem key={`${label}-${option.value}-${index}`} value={String(option.value)}>
              {option.label}
            </MenuItem>
          ))}
        </MuiSelect>
      </FormControl>
    </div>
  );

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl sm:rounded-2xl border border-[rgba(26,26,24,.09)] p-0 gap-0 [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-[22px] pb-4">
          <DialogTitle className="text-sm font-semibold leading-[1.4] text-[#1A1A18]">Filter By</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-md hover:bg-[#F7F6F2]"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-600" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 px-6 pb-6 sm:grid-cols-2">
          {renderTextField('Name / Mobile / ID', 'Search by name, mobile or ID', search, setSearch)}
          {renderTextField('Company Name', 'Enter company name', companyName, setCompanyName)}
          {renderSelectField('Work Type', 'Select Work Type', workType, setWorkType, workTypes)}
          {renderSelectField('Staff Type', 'Select Staff Type', staffType, setStaffType, staffTypes)}
          {renderSelectField('Function', 'Select Function', functionId, setFunctionId, functions)}
          {renderSelectField('Select Status', 'Select Status', status, setStatus, statuses.map((option) => ({
            ...option,
            value: option.value === '' ? '__empty__' : option.value,
          })))}
          {renderSelectField('Select Tower', 'Select Tower', tower, (value) => { setTower(value); setFlat(''); }, towers)}
          {renderSelectField('Select Flat', !tower ? 'Select tower first' : loadingFlats ? 'Loading...' : flats.length === 0 ? 'No flats available' : 'Select Flat', flat, setFlat, flats, !tower || loadingFlats)}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgba(26,26,24,.08)]">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E]"
          >
            Apply Filters
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
