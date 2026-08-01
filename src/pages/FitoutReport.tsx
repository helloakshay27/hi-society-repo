import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Download, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";
import axios from "axios";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import type { ColumnConfig } from "@/hooks/useEnhancedTable";

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
    { id: "Annexure", label: "Annexure" },
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

  // Fetched report data (dynamic columns driven by selectedFields)
  const [reportData, setReportData] = useState<Record<string, any>[]>([]);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // API expects dates as MM/DD/YYYY, e.g. "02/01/2026 - 07/31/2026"
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const validateSelection = () => {
    if (selectedFields.length === 0) {
      toast.error("Please select at least one field");
      return false;
    }
    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a date range");
      return false;
    }
    return true;
  };

  // Shared { q: { date_range, to } } JSON body for both the JSON view and the export
  const buildReportPayload = () => {
    const dateRangeParam = `${formatDate(dateRange.from as Date)} - ${formatDate(dateRange.to as Date)}`;
    return {
      q: {
        date_range: dateRangeParam,
        to: selectedFields.map((field) => field.id),
      },
    };
  };

  // Case/format-insensitive lookup so we can match whatever key shape the API returns
  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");

  const getFieldValue = (row: Record<string, any>, fieldId: string) => {
    if (!row) return undefined;
    if (row[fieldId] !== undefined) return row[fieldId];
    const target = normalizeKey(fieldId);
    const matchKey = Object.keys(row).find((key) => normalizeKey(key) === target);
    return matchKey ? row[matchKey] : undefined;
  };

  const fetchReportData = async () => {
    if (!validateSelection()) return;

    setIsFetchingReport(true);
    setHasSearched(true);
    try {
      const response = await axios.post(getFullUrl('/ft_reports.json'), buildReportPayload(), {
        headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
      });

      const data = response.data;
      const rows = Array.isArray(data)
        ? data
        : data?.ft_reports || data?.fitout_reports || data?.report || data?.data || data?.results || [];

      setReportData(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Fetch report error:", error);
      toast.error("Failed to load report data");
      setReportData([]);
    } finally {
      setIsFetchingReport(false);
    }
  };

  const handleExport = async () => {
    if (!validateSelection()) return;

    setIsExporting(true);
    try {
      const payload = { ...buildReportPayload(), commit: 'export' };

      const response = await axios.post(getFullUrl('/ft_reports'), payload, {
        headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
        responseType: 'blob',
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
    } finally {
      setIsExporting(false);
    }
  };

  const reportColumns: ColumnConfig[] = selectedFields.map((field) => ({
    key: field.id,
    label: field.label,
  }));

  const renderReportCell = (row: Record<string, any>, columnKey: string) => {
    const value = getFieldValue(row, columnKey);
    return value === undefined || value === null || value === "" ? "-" : String(value);
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
              className={cn(
                "bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Action Buttons */}
          <div className="mt-6 flex justify-start gap-3">
            {/* <Button
              onClick={fetchReportData}
              disabled={isFetchingReport}
              className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4 mr-2" />
              {isFetchingReport ? "Loading..." : "View Report"}
            </Button> */}
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
               className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Data */}
      {hasSearched && (
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <EnhancedTable
              data={reportData}
              columns={reportColumns}
              renderCell={renderReportCell}
              loading={isFetchingReport}
              loadingMessage="Loading report..."
              emptyMessage="No records found for the selected date range and fields"
              pagination
              pageSize={20}
              storageKey="fitout-report-table"
              getItemId={(item) => String(getFieldValue(item, "Id") ?? reportData.indexOf(item))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FitoutReport;
