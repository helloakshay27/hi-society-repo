
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { toast } from 'sonner';
import { StaffFilters } from '@/services/societyStaffsAPI';

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

  const commonFieldStyles = "h-10 rounded-md border border-[hsl(var(--analytics-border))] bg-white";

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
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Name / Mobile / ID</Label>
              <Input
                placeholder="Search by name, mobile or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={commonFieldStyles}
              />
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Company Name</Label>
              <Input
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={commonFieldStyles}
              />
            </div>

            {/* Work Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Work Type</Label>
              <Select value={workType} onValueChange={setWorkType}>
                <SelectTrigger className={commonFieldStyles}>
                  <SelectValue placeholder="Select Work Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                  {workTypes.map((wt) => (
                    <SelectItem key={String(wt.value)} value={String(wt.value)}>
                      {wt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Staff Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Staff Type</Label>
              <Select value={staffType} onValueChange={setStaffType}>
                <SelectTrigger className={commonFieldStyles}>
                  <SelectValue placeholder="Select Staff Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                  {staffTypes.map((st) => (
                    <SelectItem key={String(st.value)} value={String(st.value)}>
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Function */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Function</Label>
              <Select value={functionId} onValueChange={setFunctionId}>
                <SelectTrigger className={commonFieldStyles}>
                  <SelectValue placeholder="Select Function" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                  {functions.map((fn) => (
                    <SelectItem key={String(fn.value)} value={String(fn.value)}>
                      {fn.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Select Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={commonFieldStyles}>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                  {statuses.map((s, idx) => (
                    <SelectItem key={idx} value={s.value === '' ? '__empty__' : String(s.value)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Tower */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Select Tower</Label>
              <Select value={tower} onValueChange={(val) => { setTower(val); setFlat(''); }}>
                <SelectTrigger className={commonFieldStyles}>
                  <SelectValue placeholder="Select Tower" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                  {towers.map((t) => (
                    <SelectItem key={String(t.value)} value={String(t.value)}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Flat */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Select Flat</Label>
              <Select value={flat} onValueChange={setFlat} disabled={!tower || loadingFlats}>
                <SelectTrigger className={commonFieldStyles}>
                  <SelectValue placeholder={!tower ? 'Select tower first' : loadingFlats ? 'Loading...' : flats.length === 0 ? 'No flats available' : 'Select Flat'} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                  {flats.map((f) => (
                    <SelectItem key={String(f.value)} value={String(f.value)}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
