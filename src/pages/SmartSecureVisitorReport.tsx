import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SmartSecureVisitorReport: React.FC = () => {
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const handleDownload = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From Date and To Date");
      return;
    }

    if (fromDate > toDate) {
      toast.error("From Date cannot be after To Date");
      return;
    }

    toast.success("Downloading Visitor Report...");
    // Add actual download logic here
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      {/* Header */}
      <div className="bg-[#F6F4EE] rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Visitor Report</h1>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-8">
          <div className="max-w-3xl space-y-6">
            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Date */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-[45px]",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "dd/MM/yyyy") : <span>Select From Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* To Date */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-[45px]",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "dd/MM/yyyy") : <span>Select To Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-center pt-6 border-t">
              <Button
                onClick={handleDownload}
                className="bg-[#C72030] hover:bg-[#A01828] text-white px-12 py-2.5 text-base font-medium flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSecureVisitorReport;
