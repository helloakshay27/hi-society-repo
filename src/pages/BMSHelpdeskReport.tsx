import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HelpdeskExportDialog } from "@/components/HelpdeskExportDialog";

const BMSHelpdeskReport: React.FC = () => {
  // Page-level date filter
  const DEFAULT_START_DATE = new Date(2026, 3, 1);
  const DEFAULT_END_DATE = new Date(2026, 3, 23);
  const [startDate, setStartDate] = useState<Date | undefined>(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState<Date | undefined>(DEFAULT_END_DATE);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  // Dates committed via Apply — passed to the export dialog
  const [appliedStartDate, setAppliedStartDate] = useState<Date>(DEFAULT_START_DATE);
  const [appliedEndDate, setAppliedEndDate] = useState<Date>(DEFAULT_END_DATE);

  // Export dialog
  const [exportOpen, setExportOpen] = useState(false);

  const handleApply = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start date and end date");
      return;
    }
    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    toast.success(
      `Applying filter from ${format(startDate, "dd/MM/yyyy")} to ${format(endDate, "dd/MM/yyyy")}`
    );
  };

  const handleReset = () => {
    setStartDate(DEFAULT_START_DATE);
    setEndDate(DEFAULT_END_DATE);
    setAppliedStartDate(DEFAULT_START_DATE);
    setAppliedEndDate(DEFAULT_END_DATE);
    toast.info("Filters reset");
  };

  const triggerClassName = (value?: Date) =>
    cn(
      "w-full justify-start text-left font-normal !bg-white !text-[#C72030] !border !border-[#C72030] [&_svg]:text-[#C72030]",
      !value && "text-muted-foreground"
    );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      {/* Page header bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={triggerClassName(startDate)}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  defaultMonth={startDate}
                  selected={startDate}
                  onSelect={(day) => {
                    setStartDate(day);
                    setStartOpen(false);
                  }}
                  disabled={(day) => (endDate ? day > endDate : false)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={triggerClassName(endDate)}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  defaultMonth={endDate ?? startDate}
                  selected={endDate}
                  onSelect={(day) => {
                    setEndDate(day);
                    setEndOpen(false);
                  }}
                  disabled={(day) => (startDate ? day < startDate : false)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApply} className="bg-[#C72030] hover:bg-[#A01828] !text-white">
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-[#C72030] text-[#C72030] hover:bg-[#FDEFF1]"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={() => setExportOpen(true)}
            className="bg-[#C72030] hover:bg-[#A01828] !text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <HelpdeskExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        defaultStartDate={appliedStartDate}
        defaultEndDate={appliedEndDate}
      />
    </div>
  );
};

export default BMSHelpdeskReport;
