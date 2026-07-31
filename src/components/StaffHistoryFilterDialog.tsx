import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';

export interface StaffHistoryFilters {
  work_type_id?: string;
  staff_type?: string;
  tower_id?: string;
  flat_id?: string;
  company_name?: string;
  date_from?: string;
  date_to?: string;
}

interface StaffHistoryFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: StaffHistoryFilters) => void;
}

interface FilterOption {
  label: string;
  value: string | number;
}

export const StaffHistoryFilterDialog = ({ isOpen, onClose, onApplyFilters }: StaffHistoryFilterDialogProps) => {
  const [workType, setWorkType] = useState('');
  const [staffType, setStaffType] = useState('');
  const [tower, setTower] = useState('');
  const [flat, setFlat] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [workTypes, setWorkTypes] = useState<FilterOption[]>([]);
  const [staffTypes, setStaffTypes] = useState<FilterOption[]>([]);
  const [towers, setTowers] = useState<FilterOption[]>([]);
  const [flats, setFlats] = useState<FilterOption[]>([]);
  const [isLoadingFlats, setIsLoadingFlats] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFilterOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (tower) {
      fetchFlatsForTower(tower);
    } else {
      setFlats([]);
      setFlat('');
    }
  }, [tower]);

  const fetchFilterOptions = async () => {
    try {
      const res = await fetch(getFullUrl('/crm/admin/staff_filters.json'), {
        headers: { Authorization: getAuthHeader() },
      });
      if (!res.ok) return;
      const data = await res.json();
      setWorkTypes(data.work_types || []);
      setStaffTypes(data.staff_types || []);
      setTowers(data.towers || []);
    } catch {
      toast.error('Failed to load filter options');
    }
  };

  const fetchFlatsForTower = async (towerId: string) => {
    setIsLoadingFlats(true);
    setFlat('');
    try {
      const res = await fetch(
        getFullUrl(`/crm/admin/staff_filters.json?q[society_staff_staff_workings_society_flat_society_block_id_eq]=${towerId}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setFlats(data.flats || []);
    } catch {
      console.error('Error loading flats');
    } finally {
      setIsLoadingFlats(false);
    }
  };

  const handleApply = () => {
    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
      toast.error('Please select both Date From and Date To');
      return;
    }
    const filters: StaffHistoryFilters = {};
    if (workType) filters.work_type_id = workType;
    if (staffType) filters.staff_type = staffType;
    if (tower) filters.tower_id = tower;
    if (flat) filters.flat_id = flat;
    if (companyName.trim()) filters.company_name = companyName.trim();
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setWorkType('');
    setStaffType('');
    setTower('');
    setFlat('');
    setCompanyName('');
    setDateFrom('');
    setDateTo('');
    onApplyFilters({});
  };

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-bold text-[hsl(var(--analytics-text))]">FILTER BY</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">

            {/* Work Type */}
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Work Type</InputLabel>
              <MuiSelect
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                displayEmpty
                label="Select Work Type"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Work Type</em></MenuItem>
                {workTypes.map((opt) => (
                  <MenuItem key={`wt-${opt.value}`} value={String(opt.value)}>
                    {opt.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Staff Type */}
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Staff Type</InputLabel>
              <MuiSelect
                value={staffType}
                onChange={(e) => setStaffType(e.target.value)}
                displayEmpty
                label="Select Staff Type"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Staff Type</em></MenuItem>
                {staffTypes.map((opt) => (
                  <MenuItem key={`st-${opt.value}`} value={String(opt.value)}>
                    {opt.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Select Tower */}
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Tower</InputLabel>
              <MuiSelect
                value={tower}
                onChange={(e) => { setTower(e.target.value); setFlat(''); }}
                displayEmpty
                label="Select Tower"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Tower</em></MenuItem>
                {towers.map((opt) => (
                  <MenuItem key={`tw-${opt.value}`} value={String(opt.value)}>
                    {opt.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Select Flat */}
            <FormControl fullWidth variant="outlined" disabled={!tower || isLoadingFlats}>
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Flat</InputLabel>
              <MuiSelect
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                displayEmpty
                label="Select Flat"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>{!tower ? 'Select tower first' : isLoadingFlats ? 'Loading...' : flats.length === 0 ? 'No flats available' : 'Select Flat'}</em></MenuItem>
                {flats.map((opt) => (
                  <MenuItem key={`fl-${opt.value}`} value={String(opt.value)}>
                    {opt.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Company Name */}
            <TextField
              label="Search by Company Name"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            {/* Date From */}
            <TextField
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            {/* Date To */}
            <TextField
              label="Date To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-[hsl(var(--analytics-text))] border-[hsl(var(--analytics-border))]"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#C72030] hover:bg-[#C72030]/90 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
