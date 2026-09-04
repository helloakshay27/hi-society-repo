import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  TextField,
} from "@mui/material";
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

const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": { borderColor: "#ddd" },
    "&:hover fieldset": { borderColor: "#4d494aff" },
    "&.Mui-focused fieldset": { borderColor: "#C72030" },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": { color: "#201f20ff" },
    "& .MuiInputLabel-asterisk": {
      color: "#C72030 !important",
    },
  },
  "& .MuiFormLabel-asterisk": {
    color: "#C72030 !important",
  },
};

const SmartSecureStaffReport: React.FC = () => {
  const [staffType, setStaffType] = useState("");
  const [staffName, setStaffName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [workType, setWorkType] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [downloading, setDownloading] = useState(false);
  const pollTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const REPORT_STATUS_POLL_INTERVAL = 10000;
  const REPORT_STATUS_MAX_ATTEMPTS = 60;

  const pollReportStatus = (
    reportId: number,
    authHeader: string,
    attempt: number = 1
  ) => {
    pollTimeoutRef.current = window.setTimeout(async () => {
      try {
        const statusUrl = getFullUrl(`/st_report_status?report_id=${reportId}`);
        const response = await axios.get(statusUrl, {
          headers: { Authorization: authHeader },
        });
        const data = response.data;
        const reportStatus = (data?.status || "").toLowerCase();

        if (reportStatus === "completed") {
          if (data.download_url) {
            window.location.href = data.download_url;
            toast.success("Staff Report downloaded successfully!");
          } else {
            toast.error("Report generation completed but no file was returned.");
          }
          setDownloading(false);
          return;
        }

        if (reportStatus === "failed" || reportStatus === "error") {
          toast.error(data?.message || "Failed to generate the staff report.");
          setDownloading(false);
          return;
        }

        if (attempt >= REPORT_STATUS_MAX_ATTEMPTS) {
          toast.error("Report is taking longer than expected. Please try again later.");
          setDownloading(false);
          return;
        }

        pollReportStatus(reportId, authHeader, attempt + 1);
      } catch (error) {
        console.error("Error checking staff report status:", error);
        toast.error("Failed to check staff report status.");
        setDownloading(false);
      }
    }, REPORT_STATUS_POLL_INTERVAL);
  };

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
      const response = await axios.post(url, body, {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      });

      const data = response.data;

      if (data?.status === "processing" && data?.report_id) {
        toast.info(
          data.message ||
          "This report is too big to download right now. It is being generated and will download automatically in some time."
        );
        pollReportStatus(data.report_id, authHeader);
        return;
      }

      if (data?.download_url) {
        window.location.href = data.download_url;
        toast.success("Staff Report downloaded successfully!");
        setDownloading(false);
        return;
      }

      toast.success("Staff Report downloaded successfully!");
      setDownloading(false);
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
              <FormControl fullWidth variant="outlined" sx={fieldStyles}>
                <InputLabel shrink>Staff Type</InputLabel>
                <MuiSelect
                  value={staffType}
                  onChange={(e) => setStaffType(e.target.value)}
                  label="Staff Type"
                  notched
                  disabled={loadingFilters}
                  displayEmpty
                >
                  <MenuItem value="">
                    {loadingFilters ? "Loading..." : "Select Staff Type"}
                  </MenuItem>
                  {filters.staff_types.map((item) => (
                    <MenuItem key={String(item.value)} value={String(item.value)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Work Type */}
              <FormControl fullWidth variant="outlined" sx={fieldStyles}>
                <InputLabel shrink>Work Type</InputLabel>
                <MuiSelect
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  label="Work Type"
                  notched
                  disabled={loadingFilters}
                  displayEmpty
                >
                  <MenuItem value="">
                    {loadingFilters ? "Loading..." : "Select Work Type"}
                  </MenuItem>
                  {filters.work_types.map((item) => (
                    <MenuItem key={String(item.value)} value={String(item.value)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Status */}
              <FormControl fullWidth variant="outlined" sx={fieldStyles}>
                <InputLabel shrink>Status</InputLabel>
                <MuiSelect
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  label="Status"
                  notched
                  displayEmpty
                >
                  <MenuItem value="">Select Status</MenuItem>
                  <MenuItem value=" ">All</MenuItem>
                  <MenuItem value="1">Active</MenuItem>
                  <MenuItem value="0">Inactive</MenuItem>
                </MuiSelect>
              </FormControl>

              {/* Staff Name */}
              <FormControl fullWidth variant="outlined" sx={fieldStyles}>
                <InputLabel shrink>Staff Name</InputLabel>
                <MuiSelect
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  label="Staff Name"
                  notched
                  disabled={loadingFilters}
                  displayEmpty
                >
                  <MenuItem value="">
                    {loadingFilters ? "Loading..." : "Select Staff Name"}
                  </MenuItem>
                  {filters.staff_names.map((item) => {
                    const val = String(item.value);
                    if (val === "") return null;
                    return (
                      <MenuItem key={val} value={val}>
                        {item.label}
                      </MenuItem>
                    );
                  })}
                </MuiSelect>
              </FormControl>

              {/* Company Name */}
              <FormControl fullWidth variant="outlined" sx={fieldStyles}>
                <InputLabel shrink>Company Name</InputLabel>
                <MuiSelect
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  label="Company Name"
                  notched
                  disabled={loadingFilters}
                  displayEmpty
                >
                  <MenuItem value="">
                    {loadingFilters ? "Loading..." : "Select Company"}
                  </MenuItem>
                  {filters.company_names.map((item) => {
                    const val = String(item.value);
                    if (val === "") return null;
                    return (
                      <MenuItem key={val} value={val}>
                        {item.label}
                      </MenuItem>
                    );
                  })}
                </MuiSelect>
              </FormControl>

              {/* From Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <TextField
                    label="From"
                    placeholder="Select From Date"
                    value={fromDate ? format(fromDate, "dd/MM/yyyy") : ""}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={fieldStyles}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      ),
                    }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* To Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <TextField
                    label="To"
                    placeholder="Select To Date"
                    value={toDate ? format(toDate, "dd/MM/yyyy") : ""}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={fieldStyles}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      ),
                    }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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

