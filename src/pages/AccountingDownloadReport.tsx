import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const AccountingDownloadReport: React.FC = () => {
  const [form, setForm] = useState<DownloadForm>(defaultForm);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.reportType) newErrors.reportType = "Please select a report type";
    if (!form.fromDate) newErrors.fromDate = "From date is required";
    if (!form.toDate) newErrors.toDate = "To date is required";
    if (form.fromDate && form.toDate && form.fromDate > form.toDate) {
      newErrors.toDate = "To date must be after from date";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all required fields.");
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
    setErrors({});
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="mb-4">
        <h1 className="text-brand-h2 font-semibold text-brand-text">Download Report</h1>
        <p className="mt-1 text-brand-body-4 text-brand-text-light">
          Select a report, date range, and format to generate a download.
        </p>
      </div>

      <div className="rounded-lg border border-brand-card-border bg-brand-card p-6 shadow-brand-card">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="report-type">
              Report Type <span className="text-brand-danger">*</span>
            </Label>
            <Select
              value={form.reportType}
              onValueChange={(value) => setForm((prev) => ({ ...prev, reportType: value }))}
            >
              <SelectTrigger
                id="report-type"
                className={errors.reportType ? "border-brand-danger" : ""}
              >
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {REPORT_TYPES.map((report) => (
                  <SelectItem key={report.value} value={report.value}>
                    {report.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reportType && (
              <p className="text-xs text-brand-danger">{errors.reportType}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="from-date">
              From Date <span className="text-brand-danger">*</span>
            </Label>
            <Input
              id="from-date"
              type="date"
              value={form.fromDate}
              onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))}
              className={errors.fromDate ? "border-brand-danger" : ""}
            />
            {errors.fromDate && <p className="text-xs text-brand-danger">{errors.fromDate}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="to-date">
              To Date <span className="text-brand-danger">*</span>
            </Label>
            <Input
              id="to-date"
              type="date"
              value={form.toDate}
              onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))}
              className={errors.toDate ? "border-brand-danger" : ""}
            />
            {errors.toDate && <p className="text-xs text-brand-danger">{errors.toDate}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Format</Label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, format: f.value }))}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    form.format === f.value
                      ? "border-brand bg-brand-light text-brand"
                      : "border-brand-card-border text-brand-text-light hover:bg-brand-selected"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-brand text-white hover:bg-brand-hover"
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading ? "Preparing..." : "Download"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={downloading}
            className="border-brand-card-border text-brand-text hover:bg-brand-selected"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountingDownloadReport;
