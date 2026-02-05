import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SmartSecureStaffReport: React.FC = () => {
  const [staffName, setStaffName] = useState("");
  const [staffType, setStaffType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [workType, setWorkType] = useState("");
  const [status, setStatus] = useState("");
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

    toast.success("Downloading Staff Report...");
    // Add actual download logic here
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      {/* Header */}
      <div className="bg-[#F6F4EE] rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Staff Report</h1>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-8">
          <div className="max-w-6xl space-y-6">
            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Staff Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Staff Name
                </label>
                <Select value={staffName} onValueChange={setStaffName}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder="Select Name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff1">Staff Member 1</SelectItem>
                    <SelectItem value="staff2">Staff Member 2</SelectItem>
                    <SelectItem value="staff3">Staff Member 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Staff Type
                </label>
                <Select value={staffType} onValueChange={setStaffType}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder="Select Staff Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Company Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Company Name
                </label>
                <Select value={companyName} onValueChange={setCompanyName}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company1">Company 1</SelectItem>
                    <SelectItem value="company2">Company 2</SelectItem>
                    <SelectItem value="company3">Company 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Work Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Work Type
                </label>
                <Select value={workType} onValueChange={setWorkType}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder="Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="onleave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* From Date */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  From
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
                      {fromDate ? format(fromDate, "dd/MM/yyyy") : <span>05/02/2026</span>}
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
                  To
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
                      {toDate ? format(toDate, "dd/MM/yyyy") : <span>05/02/2026</span>}
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
            <div className="flex justify-start pt-6 border-t">
              <Button
                onClick={handleDownload}
                className="bg-[#17a2b8] hover:bg-[#138496] text-white px-8 py-2.5 text-base font-medium flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSecureStaffReport;
