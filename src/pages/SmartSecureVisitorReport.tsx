import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@mui/material";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": { borderColor: "#ddd" },
    "&:hover fieldset": { borderColor: "#C72030" },
    "&.Mui-focused fieldset": { borderColor: "#C72030" },
  },
};

const toInputValue = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : "");
const fromInputValue = (v: string) => (v ? new Date(`${v}T00:00:00`) : undefined);

const SmartSecureVisitorReport: React.FC = () => {
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [downloading, setDownloading] = useState(false);

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
      const body = {
        q: {
          created_at_gteq: format(fromDate, "dd/MM/yyyy"),
          created_at_lteq: format(toDate, "dd/MM/yyyy"),
        },
      };

      const url = getFullUrl("/gk_stream_reports.csv");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `visitor_report_${format(fromDate, "ddMMyyy")}_to_${format(toDate, "ddMMyyyy")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Visitor Report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading visitor report:", error);
      toast.error("Failed to download report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="px-6">
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
              <TextField
                label="From Date"
                type="date"
                value={toInputValue(fromDate)}
                onChange={(e) => setFromDate(fromInputValue(e.target.value))}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* To Date */}
              <TextField
                label="To Date"
                type="date"
                value={toInputValue(toDate)}
                onChange={(e) => setToDate(fromInputValue(e.target.value))}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>

            {/* Download Button */}
            <div className="flex justify-center pt-6 border-t">
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-[#C72030] hover:bg-[#A01828] text-white px-12 py-2.5 text-base font-medium flex items-center gap-2 disabled:opacity-70"
              >
                <Download className="w-5 h-5" />
                {downloading ? "Downloading..." : "Download Report"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSecureVisitorReport;
