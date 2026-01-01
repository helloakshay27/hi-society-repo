import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

const BMSHelpdeskReport: React.FC = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2026, 0, 1),
    to: new Date(2026, 0, 1),
  });

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
    setDate({
      from: new Date(2026, 0, 1),
      to: new Date(2026, 0, 1),
    });
    toast.info("Filters reset");
  };

  const handleExport = () => {
    toast.success("Exporting helpdesk report...");
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
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
            <Button
              onClick={handleApply}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              Apply
            </Button>
            <Button onClick={handleReset} className="bg-cyan-400 hover:bg-cyan-500 text-white">
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={handleExport}
            className="bg-cyan-400 hover:bg-cyan-500 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BMSHelpdeskReport;
