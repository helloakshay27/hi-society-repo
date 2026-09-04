import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X } from 'lucide-react';
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
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const calendarPanelRef = useRef<HTMLDivElement>(null);

  const updateCalendarPosition = () => {
    const trigger = dateTriggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = 400;
    const estimatedHeight = 280;
    const gap = 6;
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - panelWidth - 8)
    );

    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const top = openAbove
      ? Math.max(8, rect.top - estimatedHeight - gap)
      : Math.min(rect.bottom + gap, window.innerHeight - estimatedHeight - 8);

    setCalendarPos({ top, left });
  };

  const openDatePicker = () => {
    setTempDateRange(filters.dateRange);
    updateCalendarPosition();
    setIsDatePickerOpen(true);
  };

  const closeDatePicker = () => {
    setIsDatePickerOpen(false);
  };

  useEffect(() => {
    if (!isDatePickerOpen) return;

    const handleReposition = () => {
      const trigger = dateTriggerRef.current;
      const panel = calendarPanelRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const panelWidth = panel?.offsetWidth || 400;
      const panelHeight = panel?.offsetHeight || 280;
      const gap = 6;
      const left = Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - panelWidth - 8)
      );

      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;
      const top = openAbove
        ? Math.max(8, rect.top - panelHeight - gap)
        : Math.min(rect.bottom + gap, Math.max(8, window.innerHeight - panelHeight - 8));

      setCalendarPos({ top, left });
    };

    // Measure after paint so Cancel/Apply stay in viewport
    requestAnimationFrame(handleReposition);

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dateTriggerRef.current?.contains(target) ||
        calendarPanelRef.current?.contains(target)
      ) {
        return;
      }
      closeDatePicker();
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDatePickerOpen]);

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

  const handleClose = () => {
    closeDatePicker();
    onClose();
  };

  const handleDateRangeCancel = () => {
    setTempDateRange(filters.dateRange);
    closeDatePicker();
  };

  const handleDateRangeApply = () => {
    handleFilterChange('dateRange', tempDateRange);
    closeDatePicker();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }} modal={false}>
      <DialogContent className="max-w-2xl bg-white overflow-visible" aria-describedby="filter-dialog-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">FILTER BY</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Filter the OSR dashboard data by various criteria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] text-[#C72030] font-medium mb-4">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Tower</InputLabel>
                <MuiSelect
                  value={filters.tower}
                  onChange={(e) => handleFilterChange('tower', e.target.value)}
                  displayEmpty
                  label="Select Tower"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="" sx={{ backgroundColor: 'white', px: 1 }}><em>Select Tower</em></MenuItem>
                  <MenuItem value="tower-a">Tower A</MenuItem>
                  <MenuItem value="tower-b">Tower B</MenuItem>
                  <MenuItem value="tower-c">Tower C</MenuItem>
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Flats</InputLabel>
                <MuiSelect
                  value={filters.flats}
                  onChange={(e) => handleFilterChange('flats', e.target.value)}
                  displayEmpty
                  label="Select Flats"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="" sx={{ backgroundColor: 'white', px: 1 }}><em>Select Flats</em></MenuItem>
                  <MenuItem value="a-101">A-101</MenuItem>
                  <MenuItem value="a-102">A-102</MenuItem>
                  <MenuItem value="a-103">A-103</MenuItem>
                  <MenuItem value="a-104">A-104</MenuItem>
                  <MenuItem value="fm-office">FM - Office</MenuItem>
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Category</InputLabel>
                <MuiSelect
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  displayEmpty
                  label="Select Category"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="" sx={{ backgroundColor: 'white', px: 1 }}><em>Select Category</em></MenuItem>
                  <MenuItem value="pest-control">Pest Control</MenuItem>
                  <MenuItem value="deep-cleaning">Deep Cleaning</MenuItem>
                  <MenuItem value="civil-mason">Civil & Mason Works</MenuItem>
                  <MenuItem value="invisible-grill">Invisible Grill</MenuItem>
                  <MenuItem value="mosquito-mesh">Mosquito Mesh Sta...</MenuItem>
                </MuiSelect>
              </FormControl>

              <div className="w-full">
                <label className="text-sm font-medium mb-1 block">Created on</label>
                <Button
                  ref={dateTriggerRef}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isDatePickerOpen) {
                      closeDatePicker();
                    } else {
                      openDatePicker();
                    }
                  }}
                  className={cn(
                    "bg-[#C72030] hover:bg-[#B01C29] text-white h-[45px] w-full justify-start text-left font-normal"
                  )}
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
                {isDatePickerOpen &&
                  createPortal(
                    <div
                      ref={calendarPanelRef}
                      className="fixed z-[1200] w-auto rounded-md border bg-white p-1.5 shadow-lg"
                      style={{
                        top: calendarPos.top,
                        left: calendarPos.left,
                        ['--rdp-cell-size' as string]: '26px',
                        ['--rdp-caption-font-size' as string]: '13px',
                      }}
                    >
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={tempDateRange?.from || filters.dateRange?.from}
                        selected={tempDateRange}
                        onSelect={setTempDateRange}
                        numberOfMonths={2}
                        className="pointer-events-auto !p-0"
                        classNames={{
                          months: "flex flex-row gap-2 space-y-0",
                          month: "space-y-1",
                          caption: "flex justify-center pt-0 relative items-center h-6 mb-0.5",
                          caption_label: "text-[12px] font-medium",
                          nav_button: "h-5 w-5 bg-transparent p-0 opacity-50 hover:opacity-100 border-0 rounded-none shadow-none",
                          table: "w-full border-collapse",
                          head_row: "flex",
                          head_cell: "text-muted-foreground w-[26px] font-normal text-[10px] rounded-none p-0",
                          row: "flex w-full mt-0",
                          cell: "relative w-[26px] h-[26px] text-center text-[11px] p-0",
                          day: "w-[26px] h-[26px] flex items-center justify-center font-normal border-0 shadow-none rounded-full hover:bg-gray-100 text-[11px]",
                          day_selected:
                            "bg-[#C72030] text-white hover:bg-[#C72030] hover:text-white focus:bg-[#C72030] focus:text-white rounded-full w-[26px] h-[26px] flex items-center justify-center",
                          day_today: "border border-[#C72030] text-[#C72030] font-semibold rounded-full",
                        }}
                      />
                      <div className="border-t pt-1.5 mt-1 flex items-center gap-2">
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
                          className="flex-1 h-7 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDateRangeCancel}
                          className="bg-[#C72030] hover:bg-[#B01C29] text-white h-7 px-2.5 text-xs shrink-0"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleDateRangeApply}
                          className="bg-[#C72030] hover:bg-[#B01C29] text-white h-7 px-2.5 text-xs shrink-0"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>,
                    document.body
                  )}
              </div>

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Status</InputLabel>
                <MuiSelect
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  displayEmpty
                  label="Select Status"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="" sx={{ backgroundColor: 'white', px: 1 }}><em>Select Status</em></MenuItem>
                  <MenuItem value="work-pending">Work Pending</MenuItem>
                  <MenuItem value="payment-pending">Payment Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Rating</InputLabel>
                <MuiSelect
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  displayEmpty
                  label="Select Rating"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="" sx={{ backgroundColor: 'white', px: 1 }}><em>Select Rating</em></MenuItem>
                  <MenuItem value="1">1 Star</MenuItem>
                  <MenuItem value="2">2 Stars</MenuItem>
                  <MenuItem value="3">3 Stars</MenuItem>
                  <MenuItem value="4">4 Stars</MenuItem>
                  <MenuItem value="5">5 Stars</MenuItem>
                </MuiSelect>
              </FormControl>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Reset
            </Button>
            <Button
              onClick={handleApply}
              style={{ backgroundColor: '#C72030' }}
              className="text-white hover:bg-[#C72030]/90"
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
