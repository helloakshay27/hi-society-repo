
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { toast } from 'sonner';
import { StaffFilters } from '@/services/societyStaffsAPI';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
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

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-bold text-[hsl(var(--analytics-text))]">FILTER BY</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name / Mobile / ID */}
            <TextField
              label="Name / Mobile / ID"
              placeholder="Search by name, mobile or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            {/* Company Name */}
            <TextField
              label="Company Name"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            {/* Work Type */}
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Work Type</InputLabel>
              <MuiSelect
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                displayEmpty
                label="Work Type"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Work Type</em></MenuItem>
                {workTypes.map((wt) => (
                  <MenuItem key={String(wt.value)} value={String(wt.value)}>
                    {wt.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Staff Type */}
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Staff Type</InputLabel>
              <MuiSelect
                value={staffType}
                onChange={(e) => setStaffType(e.target.value)}
                displayEmpty
                label="Staff Type"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Staff Type</em></MenuItem>
                {staffTypes.map((st) => (
                  <MenuItem key={String(st.value)} value={String(st.value)}>
                    {st.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Function */}
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Function</InputLabel>
              <MuiSelect
                value={functionId}
                onChange={(e) => setFunctionId(e.target.value)}
                displayEmpty
                label="Function"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Function</em></MenuItem>
                {functions.map((fn) => (
                  <MenuItem key={String(fn.value)} value={String(fn.value)}>
                    {fn.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Status */}
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Status</InputLabel>
              <MuiSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                displayEmpty
                label="Select Status"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Status</em></MenuItem>
                {statuses.map((s, idx) => (
                  <MenuItem key={idx} value={s.value === '' ? '__empty__' : String(s.value)}>
                    {s.label}
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
                {towers.map((t) => (
                  <MenuItem key={String(t.value)} value={String(t.value)}>
                    {t.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Select Flat */}
            <FormControl fullWidth variant="outlined" disabled={!tower || loadingFlats}>
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Flat</InputLabel>
              <MuiSelect
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                displayEmpty
                label="Select Flat"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>{!tower ? 'Select tower first' : loadingFlats ? 'Loading...' : flats.length === 0 ? 'No flats available' : 'Select Flat'}</em></MenuItem>
                {flats.map((f) => (
                  <MenuItem key={String(f.value)} value={String(f.value)}>
                    {f.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
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
