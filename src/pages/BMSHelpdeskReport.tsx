import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { HelpdeskExportDialog } from "@/components/HelpdeskExportDialog";

const BMSHelpdeskReport: React.FC = () => {
  // Page-level date filter
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2026, 3, 1),
    to: new Date(2026, 3, 23),
  });

  // Export dialog
  const [exportOpen, setExportOpen] = useState(false);

  const handleApply = () => {
    if (date?.from && date?.to) {
      toast.success(
        `Applying filter from ${format(date.from, "dd/MM/yyyy")} to ${format(date.to, "dd/MM/yyyy")}`
      );
    } else {
      toast.error("Please select a date range");
    }
  };

  const handleReset = () => {
    setDate({ from: new Date(2026, 3, 1), to: new Date(2026, 3, 23) });
    toast.info("Filters reset");
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      {/* Page header bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal !bg-white !text-[#C72030] !border !border-[#C72030] [&_svg]:text-[#C72030]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(date.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
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

      <HelpdeskExportDialog isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
};

export default BMSHelpdeskReport;
