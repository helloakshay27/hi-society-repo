import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StaffHistoryFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: StaffHistoryFilters) => void;
}

export interface StaffHistoryFilters {
  date_range?: string;
  staff_name_cont?: string;
  mobile_number_cont?: string;
  staff_type?: string;
  work_type?: string;
  tower_id_eq?: number;
  flat_id_eq?: number;
  company_name_cont?: string;
  in_gate_cont?: string;
  out_gate_cont?: string;
  marked_in_by_cont?: string;
  marked_out_by_cont?: string;
}

interface TowerOption {
  id: number;
  name: string;
}

interface FlatOption {
  id: number;
  flat_no: string;
}

const staffTypeOptions = [
  { value: 'personal', label: 'Personal' },
  { value: 'contract', label: 'Contract' },
  { value: 'vendor', label: 'Vendor' },
];

const workTypeOptions = [
  { value: 'contractor', label: 'Contractor' },
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'driver', label: 'Driver' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'security', label: 'Security' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const StaffHistoryFilterDialog = ({ isOpen, onClose, onApplyFilters }: StaffHistoryFilterDialogProps) => {
  const { toast } = useToast();
  
  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [staffName, setStaffName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [staffType, setStaffType] = useState('');
  const [workType, setWorkType] = useState('');
  const [tower, setTower] = useState('');
  const [flat, setFlat] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inGate, setInGate] = useState('');
  const [outGate, setOutGate] = useState('');
  const [markedInBy, setMarkedInBy] = useState('');
  const [markedOutBy, setMarkedOutBy] = useState('');
  
  // Data state
  const [towers, setTowers] = useState<TowerOption[]>([]);
  const [flats, setFlats] = useState<FlatOption[]>([]);
  const [filtersCleared, setFiltersCleared] = useState(false);

  // Common field styles
  const commonFieldStyles = "h-10 rounded-md border border-gray-300 bg-white";

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadFilterData();
      setFiltersCleared(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Check if all filters are empty
  useEffect(() => {
    const allFiltersEmpty = !dateFrom && !dateTo && !staffName && !mobileNumber && 
                           !staffType && !workType && !tower && !flat && 
                           !companyName && !inGate && !outGate && 
                           !markedInBy && !markedOutBy;
    
    setFiltersCleared(allFiltersEmpty);
  }, [dateFrom, dateTo, staffName, mobileNumber, staffType, workType, tower, flat, companyName, inGate, outGate, markedInBy, markedOutBy]);

  // Load flats when tower changes
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
      await loadTowers();
    } catch (error) {
      console.error('❌ Error loading filter data:', error);
      toast({
        title: "Error",
        description: "Failed to load filter options.",
        variant: "destructive",
      });
    }
  };

  const loadTowers = async () => {
    try {
      const response = await fetch(getFullUrl('/crm/admin/society_blocks.json'), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setTowers(data.society_blocks || []);
      }
    } catch (error) {
      console.error('Error loading towers:', error);
    }
  };

  const loadFlats = async (towerId: string) => {
    try {
      const response = await fetch(getFullUrl(`/crm/admin/society_flats.json?q[society_block_id_eq]=${towerId}`), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setFlats(data.society_flats || []);
      }
    } catch (error) {
      console.error('Error loading flats:', error);
    }
  };

  const handleSubmit = () => {
    // Validate date range
    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
      toast({
        title: "Validation Error",
        description: "Please select both 'Date From' and 'Date To' for the date range.",
        variant: "destructive",
      });
      return;
    }

    const filters: StaffHistoryFilters = {};

    // Build date range in MM/DD/YYYY - MM/DD/YYYY format
    if (dateFrom && dateTo) {
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };
      
      const formattedDateFrom = formatDate(dateFrom);
      const formattedDateTo = formatDate(dateTo);
      filters.date_range = `${formattedDateFrom} - ${formattedDateTo}`;
    }

    // Add other filters
    if (staffName) filters.staff_name_cont = staffName;
    if (mobileNumber) filters.mobile_number_cont = mobileNumber;
    if (staffType) filters.staff_type = staffType;
    if (workType) filters.work_type = workType;
    if (tower) filters.tower_id_eq = Number(tower);
    if (flat) filters.flat_id_eq = Number(flat);
    if (companyName) filters.company_name_cont = companyName;
    if (inGate) filters.in_gate_cont = inGate;
    if (outGate) filters.out_gate_cont = outGate;
    if (markedInBy) filters.marked_in_by_cont = markedInBy;
    if (markedOutBy) filters.marked_out_by_cont = markedOutBy;

    onApplyFilters(filters);
    toast({
      title: "Success",
      description: "Filters applied successfully!",
    });
    onClose();
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setStaffName('');
    setMobileNumber('');
    setStaffType('');
    setWorkType('');
    setTower('');
    setFlat('');
    setCompanyName('');
    setInGate('');
    setOutGate('');
    setMarkedInBy('');
    setMarkedOutBy('');
    
    onApplyFilters({});
    
    toast({
      title: "Filters Cleared",
      description: "All filters have been cleared.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-semibold">Filter Staff History</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">
                  Date From
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-sm font-medium text-gray-700">
                  Date To
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
            </div>
          </div>

          {/* Staff Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Staff Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffName" className="text-sm font-medium text-gray-700">
                  Staff Name
                </Label>
                <Input
                  id="staffName"
                  type="text"
                  placeholder="Search by name"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">
                  Mobile Number
                </Label>
                <Input
                  id="mobileNumber"
                  type="text"
                  placeholder="Search by mobile"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffType" className="text-sm font-medium text-gray-700">
                  Staff Type
                </Label>
                <Select value={staffType} onValueChange={setStaffType}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select staff type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {staffTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workType" className="text-sm font-medium text-gray-700">
                  Work Type
                </Label>
                <Select value={workType} onValueChange={setWorkType}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select work type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {workTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tower" className="text-sm font-medium text-gray-700">
                  Tower
                </Label>
                <Select value={tower} onValueChange={setTower}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select tower" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px] overflow-y-auto">
                    {towers.map((towerOption) => (
                      <SelectItem key={towerOption.id} value={towerOption.id.toString()}>
                        {towerOption.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flat" className="text-sm font-medium text-gray-700">
                  Associated Flat
                </Label>
                <Select value={flat} onValueChange={setFlat} disabled={!tower}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder={tower ? "Select flat" : "Select tower first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px] overflow-y-auto">
                    {flats.map((flatOption) => (
                      <SelectItem key={flatOption.id} value={flatOption.id.toString()}>
                        {flatOption.flat_no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Company & Gate Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Search by company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inGate" className="text-sm font-medium text-gray-700">
                  In Gate
                </Label>
                <Input
                  id="inGate"
                  type="text"
                  placeholder="Search by in gate"
                  value={inGate}
                  onChange={(e) => setInGate(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outGate" className="text-sm font-medium text-gray-700">
                  Out Gate
                </Label>
                <Input
                  id="outGate"
                  type="text"
                  placeholder="Search by out gate"
                  value={outGate}
                  onChange={(e) => setOutGate(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markedInBy" className="text-sm font-medium text-gray-700">
                  Marked In By
                </Label>
                <Input
                  id="markedInBy"
                  type="text"
                  placeholder="Search by marked in by"
                  value={markedInBy}
                  onChange={(e) => setMarkedInBy(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="markedOutBy" className="text-sm font-medium text-gray-700">
                  Marked Out By
                </Label>
                <Input
                  id="markedOutBy"
                  type="text"
                  placeholder="Search by marked out by"
                  value={markedOutBy}
                  onChange={(e) => setMarkedOutBy(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="px-6"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="px-6 bg-purple-600 hover:bg-purple-700 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
