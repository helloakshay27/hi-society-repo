import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const REPORT_TYPES = [
  { value: "balance-sheet", label: "Balance Sheet" },
  { value: "profit-loss", label: "Profit & Loss" },
  { value: "gst-payable", label: "GST Payable" },
  { value: "gst-receivable", label: "GST Receivable" },
  { value: "tax-summary", label: "Tax Summary" },
  { value: "invoices", label: "Invoices Report" },
  { value: "transactions", label: "Transactions" },
];

const FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "csv", label: "CSV" },
];

interface DownloadForm {
  reportType: string;
  fromDate: string;
  toDate: string;
  format: string;
}

const defaultForm: DownloadForm = {
  reportType: "",
  fromDate: "",
  toDate: "",
  format: "pdf",
};

const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": {
      borderColor: "#ddd",
    },
    "&:hover fieldset": {
      borderColor: "#C72030",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#C72030",
    },
  },
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
      <h2 className="text-lg font-medium text-gray-900 flex items-center">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
          style={{ backgroundColor: "#E5E0D3" }}
        >
          <Download size={16} color="var(--color-primary,#da7756)" />
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </div>
);

const AccountingDownloadReport: React.FC = () => {
  const [form, setForm] = useState<DownloadForm>(defaultForm);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    if (!form.reportType) {
      toast.error("Please select a report type");
      return;
    }
    if (!form.fromDate) {
      toast.error("From date is required");
      return;
    }
    if (!form.toDate) {
      toast.error("To date is required");
      return;
    }
    if (form.fromDate > form.toDate) {
      toast.error("To date must be after from date");
      return;
    }

    setDownloading(true);
    const reportLabel = REPORT_TYPES.find((r) => r.value === form.reportType)?.label;
    window.setTimeout(() => {
      toast.success(
        `${reportLabel} report (${form.format.toUpperCase()}) download will begin shortly.`
      );
      setDownloading(false);
    }, 600);
  };

  const handleReset = () => {
    setForm(defaultForm);
  };

  return (
    <div className="bg-white p-6 max-w-full min-h-screen overflow-x-hidden download-report-page">
      <style>{`.download-report-page .MuiFormLabel-asterisk { color: #da7756 !important; }`}</style>

      <SectionCard title="Download Report">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormControl fullWidth required sx={{ "& .MuiInputBase-root": fieldStyles }}>
              <InputLabel shrink>Report Type</InputLabel>
              <Select
                value={form.reportType}
                onChange={(e) => setForm((prev) => ({ ...prev, reportType: e.target.value as string }))}
                label="Report Type"
                notched
                displayEmpty
              >
                <MenuItem value="">Select</MenuItem>
                {REPORT_TYPES.map((report) => (
                  <MenuItem key={report.value} value={report.value}>
                    {report.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <TextField
            label="From Date"
            required
            type="date"
            value={form.fromDate}
            onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))}
            variant="outlined"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ notched: true }}
            sx={{ "& .MuiInputBase-root": fieldStyles }}
          />

          <TextField
            label="To Date"
            required
            type="date"
            value={form.toDate}
            onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))}
            variant="outlined"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ notched: true }}
            sx={{ "& .MuiInputBase-root": fieldStyles }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Format</label>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, format: f.value }))}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  form.format === f.value
                    ? "border-[#da7756] bg-[#da7756]/10 text-[#da7756]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="mt-6 flex gap-3">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="min-w-[140px] bg-[#C72030] text-white hover:bg-[#A01020]"
        >
          <Download className="mr-2 h-4 w-4" />
          {downloading ? "Preparing..." : "Download"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={downloading}
          className="min-w-[100px]"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default AccountingDownloadReport;
