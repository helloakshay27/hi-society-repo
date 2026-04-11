import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';

interface StaffHistoryFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: StaffHistoryFilters) => void;
}

export interface StaffHistoryFilters {
  work_type_ids?: string;
  staff_types?: string;
  tower_id?: string;
  flat_ids?: string;
  company_name?: string;
  date_range?: string;
}

interface FilterOption {
  label: string;
  value: string | number;
}

interface StaffFiltersResponse {
  work_types: FilterOption[];
  staff_types: FilterOption[];
  towers: FilterOption[];
  flats: FilterOption[];
  current_filters: {
    work_type_ids: string | null;
    staff_types: string | null;
    tower_id: string | null;
    flat_ids: string | null;
    company_name: string | null;
    date_range: string | null;
  };
}

export const StaffHistoryFilterDialog = ({ isOpen, onClose, onApplyFilters }: StaffHistoryFilterDialogProps) => {
  const [workType, setWorkType] = useState('');
  const [staffType, setStaffType] = useState('');
  const [tower, setTower] = useState('');
  const [flat, setFlat] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [dateRange, setDateRange] = useState('');

  const [workTypes, setWorkTypes] = useState<FilterOption[]>([]);
  const [staffTypes, setStaffTypes] = useState<FilterOption[]>([]);
  const [towers, setTowers] = useState<FilterOption[]>([]);
  const [flats, setFlats] = useState<FilterOption[]>([]);
  const [isLoadingFlats, setIsLoadingFlats] = useState(false);

  // Load filter options on mount
  useEffect(() => {
    if (isOpen) {
      fetchFilterOptions();
    }
  }, [isOpen]);

  // Fetch flats when tower changes
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
      const data: StaffFiltersResponse = await res.json();
      setWorkTypes(data.work_types || []);
      setStaffTypes(data.staff_types || []);
      setTowers(data.towers || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
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
      const data: StaffFiltersResponse = await res.json();
      setFlats(data.flats || []);
    } catch (error) {
      console.error('Error loading flats:', error);
    } finally {
      setIsLoadingFlats(false);
    }
  };

  const handleApply = () => {
    const filters: StaffHistoryFilters = {};
    if (workType) filters.work_type_ids = workType;
    if (staffType) filters.staff_types = staffType;
    if (tower) filters.tower_id = tower;
    if (flat) filters.flat_ids = flat;
    if (companyName.trim()) filters.company_name = companyName.trim();
    if (dateRange.trim()) filters.date_range = dateRange.trim();

    onApplyFilters(filters);
    toast.success('Filters applied');
    onClose();
  };

  const handleReset = () => {
    setWorkType('');
    setStaffType('');
    setTower('');
    setFlat('');
    setCompanyName('');
    setDateRange('');
    onApplyFilters({});
    toast.success('Filters cleared');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Filter</DialogTitle>
        </DialogHeader>

        {/* Row 1: Work Type, Staff Type, Tower, Flat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Select value={workType} onValueChange={setWorkType}>
          <SelectTrigger className="h-9 bg-white border-gray-300">
            <SelectValue placeholder="Select Work Type" />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[250px] overflow-y-auto">
            {workTypes.map((opt) => (
              <SelectItem key={`wt-${opt.value}`} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={staffType} onValueChange={setStaffType}>
          <SelectTrigger className="h-9 bg-white border-gray-300">
            <SelectValue placeholder="Select Staff Type" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {staffTypes.map((opt) => (
              <SelectItem key={`st-${opt.value}`} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tower} onValueChange={setTower}>
          <SelectTrigger className="h-9 bg-white border-gray-300">
            <SelectValue placeholder="Select Tower" />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[250px] overflow-y-auto">
            {towers.map((opt) => (
              <SelectItem key={`tw-${opt.value}`} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={flat} onValueChange={setFlat} disabled={!tower || isLoadingFlats}>
          <SelectTrigger className="h-9 bg-white border-gray-300">
            <SelectValue
              placeholder={
                isLoadingFlats
                  ? "Loading..."
                  : tower
                    ? "Select Flat"
                    : "Select Flat"
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[250px] overflow-y-auto">
            {flats.map((opt) => (
              <SelectItem key={`fl-${opt.value}`} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Company Name, Date Range, Apply, Reset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] gap-3 items-center">
        <Input
          placeholder="Search by Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="h-9 bg-white border-gray-300"
        />

        <Input
          type="text"
          placeholder="Select Date Range"
          value={dateRange}
          onFocus={(e) => (e.target.type = "date")}
          onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
          onChange={(e) => setDateRange(e.target.value)}
          className="h-9 bg-white border-gray-300"
        />

        <Button
          onClick={handleApply}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 h-9 text-sm"
        >
          Apply
        </Button>

        <Button
          onClick={handleReset}
          className="bg-green-500 hover:bg-green-600 text-white px-5 h-9 text-sm"
        >
          Reset
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
};
