import React, { useState, useEffect } from "react";
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
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

interface FilterOption {
  label: string;
  value: string | number;
}

interface StaffFilters {
  work_types: FilterOption[];
  staff_types: FilterOption[];
  towers: FilterOption[];
  staff_names: FilterOption[];
  company_names: FilterOption[];
}

const SmartSecureStaffReport: React.FC = () => {
  const [staffType, setStaffType] = useState("");
  const [staffName, setStaffName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [workType, setWorkType] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [downloading, setDownloading] = useState(false);

  const [filters, setFilters] = useState<StaffFilters>({
    work_types: [],
    staff_types: [],
    towers: [],
    staff_names: [],
    company_names: [],
  });
  const [loadingFilters, setLoadingFilters] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      setLoadingFilters(true);
      try {
        const headers = { Authorization: getAuthHeader() };
        const [res1, res2] = await Promise.all([
          fetch(getFullUrl("/crm/admin/staff_filters.json"), { method: "GET", headers }),
          fetch(getFullUrl("/crm/admin/staff_and_company_filters.json"), { method: "GET", headers }),
        ]);
        if (!res1.ok) throw new Error(`HTTP ${res1.status}`);
        if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
        const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
        setFilters({
          work_types: data1.work_types || [],
          staff_types: data1.staff_types || [],
          towers: data1.towers || [],
          staff_names: data2.staff_names || [],
          company_names: data2.company_names || [],
        });
      } catch (error) {
        console.error("Error fetching staff filters:", error);
        toast.error("Failed to load filter options");
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilters();
  }, []);

  const handleDownload = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From Date and To Date");
      return;
    }

    if (fromDate > toDate) {
      toast.error("From Date cannot be after To Date");
      return;
    }

    setDownloading(true);
    try {
      // Get auth header with proper error handling
      let authHeader;
      try {
        authHeader = getAuthHeader();
      } catch (error) {
        console.error('Error getting auth header:', error);
        toast.error('Authentication error. Please log in again.');
        setDownloading(false);
        return;
      }

      const body: Record<string, string | number | string[] | number[]> = {
        from_date: format(fromDate, "yyyy-MM-dd"),
        to_date: format(toDate, "yyyy-MM-dd"),
      };

      if (staffType) body.staff_types = [staffType];
      if (staffName) body.staff_ids = [Number(staffName)];
      if (workType) body.type_ids = [Number(workType)];
      if (companyName) body.company_name = companyName;
      if (status && status.trim() !== "") body.status = status.trim();

      const url = getFullUrl("/st_reports.csv");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `staff_report_${format(fromDate, "ddMMyyyy")}_to_${format(toDate, "ddMMyyyy")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Staff Report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading staff report:", error);
      
      // Handle different types of errors
      if (error.response) {
        // API responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || error.response.statusText || 'Unknown error';
        
        if (status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (status === 403) {
          toast.error("Access denied. You don't have permission to download staff reports.");
        } else if (status >= 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error(`Failed to download report: ${message}`);
        }
      } else if (error.request) {
        // Network error
        toast.error("Network error. Please check your connection and try again.");
      } else {
        // Other error
        toast.error("Failed to download report. Please try again.");
      }
    } finally {
      setDownloading(false);
    }
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
              {/* Staff Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Staff Type
                </label>
                <Select value={staffType} onValueChange={setStaffType} disabled={loadingFilters}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder={loadingFilters ? "Loading..." : "Select Staff Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.staff_types.map((item) => (
                      <SelectItem key={String(item.value)} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Work Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Work Type
                </label>
                <Select value={workType} onValueChange={setWorkType} disabled={loadingFilters}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder={loadingFilters ? "Loading..." : "Work Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.work_types.map((item) => (
                      <SelectItem key={String(item.value)} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
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
                    <SelectItem value=" ">All</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Staff Name
                </label>
                <Select value={staffName} onValueChange={setStaffName} disabled={loadingFilters}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder={loadingFilters ? "Loading..." : "Select Staff Name"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.staff_names.map((item) => {
                      const val = String(item.value);
                      if (val === "") return null;
                      return (
                        <SelectItem key={val} value={val}>
                          {item.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Company Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Company Name
                </label>
                <Select value={companyName} onValueChange={setCompanyName} disabled={loadingFilters}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder={loadingFilters ? "Loading..." : "Select Company"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.company_names.map((item) => {
                      const val = String(item.value);
                      if (val === "") return null;
                      return (
                        <SelectItem key={val} value={val}>
                          {item.label}
                        </SelectItem>
                      );
                    })}
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
                      className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed w-full"
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
                  To
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed w-full"
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
            <div className="flex justify-start pt-6 border-t">
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                {downloading ? "Downloading..." : "Download"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSecureStaffReport;

