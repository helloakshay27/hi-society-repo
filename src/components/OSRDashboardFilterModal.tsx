
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';

interface OSRDashboardFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
}

export const OSRDashboardFilterModal = ({ isOpen, onClose, onApply, onReset }: OSRDashboardFilterModalProps) => {
  const [filters, setFilters] = useState({
    tower: '',
    flats: '',
    category: '',
    dateRange: undefined as DateRange | undefined,
    status: '',
    rating: ''
  });

  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(filters.dateRange);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleFilterChange = (field: string, value: string | DateRange | undefined) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      tower: '',
      flats: '',
      category: '',
      dateRange: undefined,
      status: '',
      rating: ''
    });
    setTempDateRange(undefined);
    onReset();
  };

  const handleDateRangeCancel = () => {
    setTempDateRange(filters.dateRange);
    setIsDatePickerOpen(false);
  };

  const handleDateRangeApply = () => {
    handleFilterChange('dateRange', tempDateRange);
    setIsDatePickerOpen(false);
  };

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Filter</DialogTitle>
          <DialogDescription className="sr-only">
            Filter the OSR dashboard data by various criteria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4">
          <div className="flex items-end gap-4 flex-wrap">
            <FormControl className="min-w-[150px]" variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Tower</InputLabel>
              <MuiSelect
                value={filters.tower}
                onChange={(e) => handleFilterChange('tower', e.target.value)}
                displayEmpty
                label="Select Tower"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Tower</em></MenuItem>
                <MenuItem value="tower-a">Tower A</MenuItem>
                <MenuItem value="tower-b">Tower B</MenuItem>
                <MenuItem value="tower-c">Tower C</MenuItem>
              </MuiSelect>
            </FormControl>

            <FormControl className="min-w-[150px]" variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Flats</InputLabel>
              <MuiSelect
                value={filters.flats}
                onChange={(e) => handleFilterChange('flats', e.target.value)}
                displayEmpty
                label="Select Flats"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Flats</em></MenuItem>
                <MenuItem value="a-101">A-101</MenuItem>
                <MenuItem value="a-102">A-102</MenuItem>
                <MenuItem value="a-103">A-103</MenuItem>
                <MenuItem value="a-104">A-104</MenuItem>
                <MenuItem value="fm-office">FM - Office</MenuItem>
              </MuiSelect>
            </FormControl>

            <FormControl className="min-w-[200px]" variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Category</InputLabel>
              <MuiSelect
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                displayEmpty
                label="Select Category"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Category</em></MenuItem>
                <MenuItem value="pest-control">Pest Control</MenuItem>
                <MenuItem value="deep-cleaning">Deep Cleaning</MenuItem>
                <MenuItem value="civil-mason">Civil & Mason Works</MenuItem>
                <MenuItem value="invisible-grill">Invisible Grill</MenuItem>
                <MenuItem value="mosquito-mesh">Mosquito Mesh Sta...</MenuItem>
              </MuiSelect>
            </FormControl>

            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Created on</label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed h-9 w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(filters.dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "01/01/2025 - 12/31/2025"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={filters.dateRange?.from}
                      selected={tempDateRange}
                      onSelect={setTempDateRange}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          placeholder="01/01/2025 - 12/31/2025"
                          value={
                            tempDateRange?.from
                              ? tempDateRange.to
                                ? `${format(tempDateRange.from, "dd/MM/yyyy")} - ${format(tempDateRange.to, "dd/MM/yyyy")}`
                                : format(tempDateRange.from, "dd/MM/yyyy")
                              : ""
                          }
                          readOnly
                          className="flex-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDateRangeCancel}
                          className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleDateRangeApply}
                          className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <FormControl className="min-w-[150px]" variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Status</InputLabel>
              <MuiSelect
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                displayEmpty
                label="Select Status"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Status</em></MenuItem>
                <MenuItem value="work-pending">Work Pending</MenuItem>
                <MenuItem value="payment-pending">Payment Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </MuiSelect>
            </FormControl>

            <FormControl className="min-w-[150px]" variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Rating</InputLabel>
              <MuiSelect
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                displayEmpty
                label="Select Rating"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Rating</em></MenuItem>
                <MenuItem value="1">1 Star</MenuItem>
                <MenuItem value="2">2 Stars</MenuItem>
                <MenuItem value="3">3 Stars</MenuItem>
                <MenuItem value="4">4 Stars</MenuItem>
                <MenuItem value="5">5 Stars</MenuItem>
              </MuiSelect>
            </FormControl>

            <div className="flex gap-2 ml-auto">
              <Button 
                onClick={handleApply}
                className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </Button>
              <Button 
                onClick={handleReset}
                className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
