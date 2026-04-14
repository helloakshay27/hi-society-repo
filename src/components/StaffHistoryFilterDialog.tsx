import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from 'lucide-react';
import { toast } from 'sonner';

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

const commonFieldStyles = "h-10 rounded-md border border-[hsl(var(--analytics-border))] bg-white";

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Select Work Type</Label>
              <Select value={workType} onValueChange={setWorkType}>
                <SelectTrigger className={commonFieldStyles}>
                  <SelectValue placeholder="Select Work Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                  {workTypes.map((opt) => (
                    <SelectItem key={`wt-${opt.value}`} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Staff Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Select Staff Type</Label>
              <Select value={staffType} onValueChange={setStaffType}>
                <SelectTrigger className={commonFieldStyles}>
                  <SelectValue placeholder="Select Staff Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                  {staffTypes.map((opt) => (
                    <SelectItem key={`st-${opt.value}`} value={String(opt.value)}>
                      {opt.label}
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
                  {towers.map((opt) => (
                    <SelectItem key={`tw-${opt.value}`} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Flat */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Select Flat</Label>
              <Select value={flat} onValueChange={setFlat} disabled={!tower || isLoadingFlats}>
                <SelectTrigger className={commonFieldStyles}>
                  <SelectValue placeholder={!tower ? 'Select tower first' : isLoadingFlats ? 'Loading...' : flats.length === 0 ? 'No flats available' : 'Select Flat'} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                  {flats.map((opt) => (
                    <SelectItem key={`fl-${opt.value}`} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Search by Company Name</Label>
              <Input
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={commonFieldStyles}
              />
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={commonFieldStyles}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={commonFieldStyles}
              />
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
