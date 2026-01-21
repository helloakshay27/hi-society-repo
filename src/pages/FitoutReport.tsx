import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import axios from "axios";

interface ReportField {
  id: string;
  label: string;
}

const FitoutReport: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // All available fields
  const allFields: ReportField[] = [
    { id: "Id", label: "Id" },
    { id: "Tower", label: "Tower" },
    { id: "Flat", label: "Flat" },
    { id: "Flat Type", label: "Flat Type" },
    { id: "Category", label: "Category" },
    { id: "Description", label: "Description" },
    { id: "Request Date", label: "Request Date" },
    { id: "Fitout Status", label: "Fitout Status" },
    { id: "Service Amount", label: "Service Amount" },
    { id: "Created On", label: "Created On" },
    { id: "Created Time", label: "Created Time" },
    { id: "Created By", label: "Created By" },
    { id: "Updated On", label: "Updated On" },
    { id: "Updated Time", label: "Updated Time" },
    { id: "Updated By", label: "Updated By" },
    { id: "Payment Method", label: "Payment Method" },
    { id: "Payment Mode", label: "Payment Mode" },
    { id: "Payment Status", label: "Payment Status" },
    { id: "Amount Paid", label: "Amount Paid" },
    { id: "Payment Reference Number", label: "Payment Reference Number" },
    { id: "Paid On Date", label: "Paid On Date" },
    { id: "Paid On Time", label: "Paid On Time" },
    { id: "Payment Notes", label: "Payment Notes" },
    { id: "Payment Updated By", label: "Payment Updated By" },
    { id: "Documents Status", label: "Documents Status" },
    { id: "Documents Uploaded On", label: "Documents Uploaded On" },
  ];

  // Selected fields (right side)
  const [selectedFields, setSelectedFields] = useState<ReportField[]>([]);

  // Available fields (left side)
  const [availableFields, setAvailableFields] = useState<ReportField[]>(allFields);

  // Move single item to selected
  const moveToSelected = (field: ReportField) => {
    setAvailableFields(availableFields.filter((f) => f.id !== field.id));
    setSelectedFields([...selectedFields, field]);
  };

  // Move all items to selected
  const moveAllToSelected = () => {
    setSelectedFields([...selectedFields, ...availableFields]);
    setAvailableFields([]);
  };

  // Move single item back to available
  const moveToAvailable = (field: ReportField) => {
    setSelectedFields(selectedFields.filter((f) => f.id !== field.id));
    setAvailableFields([...availableFields, field]);
  };

  // Move all items back to available
  const moveAllToAvailable = () => {
    setAvailableFields([...availableFields, ...selectedFields]);
    setSelectedFields([]);
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast.error("Please select at least one field to export");
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a date range");
      return;
    }

    try {
      // Format dates as DD/MM/YYYY
      const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const fromDate = formatDate(dateRange.from);
      const toDate = formatDate(dateRange.to);
      const dateRangeParam = `${fromDate} - ${toDate}`;

      // Build query parameters
      const params = new URLSearchParams();
      params.append('commit', 'export');
      params.append('q[date_range]', dateRangeParam);

      // Add selected fields as q[to][] parameters
      selectedFields.forEach((field) => {
        params.append('q[to][]', field.id);
      });

      // Get dynamic base URL
      const baseURL = API_CONFIG.baseURL || localStorage.getItem('apiBaseURL') || '';

      // Make API call to download the file
      const response = await axios.post(`${baseURL}/ft_reports`, {
        params: params,
        headers: getAuthHeader(),
        responseType: 'blob', // Important for file download
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'fitout_report.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Report exported successfully!");
    } catch (error) {
      toast.error("Failed to export report");
      console.error("Export error:", error);
    }
  };

  const formatDateRange = () => {
    if (!dateRange.from && !dateRange.to) {
      return "Select Date Range";
    }
    if (dateRange.from && !dateRange.to) {
      return format(dateRange.from, "LLL dd, y");
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`;
    }
    return "Select Date Range";
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-right" richColors closeButton />

      {/* Date Range Picker */}
      <div className="mb-6">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full md:w-[400px] justify-start text-left font-normal h-11",
                !dateRange.from && !dateRange.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                setDateRange({
                  from: range?.from,
                  to: range?.to,
                });
                if (range?.from && range?.to) {
                  setIsCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Fields Selection */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4">
            {/* All Values */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">All Values</h3>
              <div className="border border-gray-300 rounded-md bg-white min-h-[400px] max-h-[400px] overflow-y-auto">
                {availableFields.map((field) => (
                  <div
                    key={field.id}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => moveToSelected(field)}
                  >
                    {field.label}
                  </div>
                ))}
                {availableFields.length === 0 && (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    No fields available
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex lg:flex-col items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={moveAllToSelected}
                disabled={availableFields.length === 0}
                className="h-9 w-9"
                title="Move all to selected"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (availableFields.length > 0) {
                    moveToSelected(availableFields[0]);
                  }
                }}
                disabled={availableFields.length === 0}
                className="h-9 w-9"
                title="Move to selected"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (selectedFields.length > 0) {
                    moveToAvailable(selectedFields[0]);
                  }
                }}
                disabled={selectedFields.length === 0}
                className="h-9 w-9"
                title="Move to available"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={moveAllToAvailable}
                disabled={selectedFields.length === 0}
                className="h-9 w-9"
                title="Move all to available"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Values */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Selected Values</h3>
              <div className="border border-gray-300 rounded-md bg-white min-h-[400px] max-h-[400px] overflow-y-auto">
                {selectedFields.map((field) => (
                  <div
                    key={field.id}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => moveToAvailable(field)}
                  >
                    {field.label}
                  </div>
                ))}
                {selectedFields.length === 0 && (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    No fields selected
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-6 flex justify-start">
            <Button
              onClick={handleExport}
              className="bg-[#4A5568] hover:bg-[#4A5568]/90 text-white h-10 px-6"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FitoutReport;
