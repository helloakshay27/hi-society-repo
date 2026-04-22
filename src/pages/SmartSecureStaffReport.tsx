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
  statuses: FilterOption[];
  towers: FilterOption[];
  staffs: FilterOption[];
  companies: FilterOption[];
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
    statuses: [],
    towers: [],
    staffs: [],
    companies: [],
  });
  const [loadingFilters, setLoadingFilters] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      setLoadingFilters(true);
      try {
        const url = getFullUrl("/crm/admin/staff_filters.json");
        const response = await fetch(url, {
          method: "GET",
          headers: { Authorization: getAuthHeader() },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setFilters({
          work_types: data.work_types || [],
          staff_types: data.staff_types || [],
          statuses: data.statuses || [],
          towers: data.towers || [],
          staffs: data.staffs || [],
          companies: data.companies || [],
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
      const body: Record<string, string | number | string[] | number[]> = {
        from_date: format(fromDate, "yyyy-MM-dd"),
        to_date: format(toDate, "yyyy-MM-dd"),
      };

      if (staffType) body.staff_types = [staffType];
      if (staffName) body.staff_ids = [Number(staffName)];
      if (workType) body.type_ids = [Number(workType)];
      if (companyName) body.company_name = companyName;
      if (status !== "") body.status = status;

      const url = getFullUrl("/st_reports.csv");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
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
      toast.error("Failed to download report. Please try again.");
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
                <Select value={status} onValueChange={setStatus} disabled={loadingFilters}>
                  <SelectTrigger className="h-[45px]">
                    <SelectValue placeholder={loadingFilters ? "Loading..." : "Select Status"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.statuses.map((item, idx) => {
                      const val = String(item.value);
                      if (val === "") return null;
                      return (
                        <SelectItem key={idx} value={val}>
                          {item.label}
                        </SelectItem>
                      );
                    })}
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
                    {filters.staffs.map((item) => {
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
                    {filters.companies.map((item) => {
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
                className="bg-[#17a2b8] hover:bg-[#138496] text-white px-8 py-2.5 text-base font-medium flex items-center gap-2 disabled:opacity-70"
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

