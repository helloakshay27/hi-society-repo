import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, SlidersHorizontal } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HelpdeskExportDialog } from "@/components/HelpdeskExportDialog";

const BMSHelpdeskReport: React.FC = () => {
  // Page-level date filter — defaults to the current month so far (1st → today)
  const [DEFAULT_START_DATE] = useState(() => startOfMonth(new Date()));
  const [DEFAULT_END_DATE] = useState(() => new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState<Date | undefined>(DEFAULT_END_DATE);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  // Dates committed via Apply — passed to the export dialog
  const [appliedStartDate, setAppliedStartDate] = useState<Date>(DEFAULT_START_DATE);
  const [appliedEndDate, setAppliedEndDate] = useState<Date>(DEFAULT_END_DATE);

  // Export dialog
  const [exportOpen, setExportOpen] = useState(false);

  const handleApply = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start date and end date");
      return;
    }
    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    toast.success(
      `Applying filter from ${format(startDate, "dd/MM/yyyy")} to ${format(endDate, "dd/MM/yyyy")}`
    );
  };

  const handleReset = () => {
    setStartDate(DEFAULT_START_DATE);
    setEndDate(DEFAULT_END_DATE);
    setAppliedStartDate(DEFAULT_START_DATE);
    setAppliedEndDate(DEFAULT_END_DATE);
    toast.info("Filters reset");
  };

  const triggerClassName = (value?: Date) =>
    cn(
      "ref-date-trigger w-full justify-start text-left",
      !value && "is-empty"
    );

  return (
    <div className="p-6 min-h-screen helpdesk-report-page">
      <style>{`
        html body #root .helpdesk-report-page {
          background-color: #FDFDFB !important;
        }
        html body #root .helpdesk-report-page .ref-card {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 24, 0.09);
          border-radius: 16px;
          overflow: hidden;
        }
        html body #root .helpdesk-report-page .ref-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 22px 24px 0;
        }
        html body #root .helpdesk-report-page .ref-card-head h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A18;
        }
        html body #root .helpdesk-report-page .ref-chip {
          width: 32px;
          height: 32px;
          flex: none;
          border-radius: 9999px;
          background: #F5F4F0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        html body #root .helpdesk-report-page .ref-chip svg {
          width: 14px;
          height: 14px;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .helpdesk-report-page .ref-card-body {
          padding: 20px 24px 22px;
        }
        html body #root .helpdesk-report-page .ref-label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(26, 26, 24, 0.68);
        }
        html body #root .helpdesk-report-page .ref-date-trigger {
          height: 44px !important;
          padding: 0 14px !important;
          gap: 10px;
          font-size: 13.5px !important;
          font-weight: 500 !important;
          color: #1A1A18 !important;
          background: #FFFFFF !important;
          border: 1px solid rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
          box-shadow: none !important;
          transition: border-color 0.16s, box-shadow 0.16s;
        }
        html body #root .helpdesk-report-page .ref-date-trigger:hover {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .helpdesk-report-page .ref-date-trigger[data-state="open"],
        html body #root .helpdesk-report-page .ref-date-trigger:focus-visible {
          border-color: #1A1A18 !important;
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .helpdesk-report-page .ref-date-trigger.is-empty {
          color: rgba(26, 26, 24, 0.3) !important;
        }
        html body #root .helpdesk-report-page .ref-date-trigger svg {
          color: rgba(26, 26, 24, 0.48) !important;
        }
        html body #root .helpdesk-report-page .btn-primary svg {
          color: #FFFFFF !important;
          stroke: #FFFFFF !important;
        }
      `}</style>

      <div className="mb-6">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
          Helpdesk Report
        </h1>
        <p className="mt-1 text-[13px] text-[rgba(26,26,24,0.55)]">
          Pick a date range, then export helpdesk tickets for that period
        </p>
      </div>

      <div className="space-y-6">
        <div className="ref-card">
          <div className="ref-card-head">
            <span className="ref-chip">
              <SlidersHorizontal />
            </span>
            <h2>Report Filters</h2>
          </div>
          <div className="ref-card-body flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="ref-label">Start Date</label>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={triggerClassName(startDate)}>
                    <CalendarIcon className="h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : <span>Pick start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    defaultMonth={startDate}
                    selected={startDate}
                    onSelect={(day) => {
                      setStartDate(day);
                      setStartOpen(false);
                    }}
                    disabled={(day) => (endDate ? day > endDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="ref-label">End Date</label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={triggerClassName(endDate)}>
                    <CalendarIcon className="h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : <span>Pick end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    defaultMonth={endDate ?? startDate}
                    selected={endDate}
                    onSelect={(day) => {
                      setEndDate(day);
                      setEndOpen(false);
                    }}
                    disabled={(day) => (startDate ? day < startDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="btn-cancel h-11 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
              >
                Reset
              </Button>
              <Button onClick={handleApply} className="btn-primary h-11 px-5 text-sm font-medium">
                Apply
              </Button>
            </div>
          </div>
        </div>

        <div className="ref-card">
          <div className="ref-card-head">
            <span className="ref-chip">
              <Download />
            </span>
            <h2>Export Report</h2>
          </div>
          <div className="ref-card-body flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13px] text-[rgba(26,26,24,0.55)]">
              Applied range:{" "}
              <span className="font-semibold text-[#1A1A18]">
                {format(appliedStartDate, "dd/MM/yyyy")} – {format(appliedEndDate, "dd/MM/yyyy")}
              </span>
            </p>
            <Button
              onClick={() => setExportOpen(true)}
              className="btn-primary h-9 px-4 text-sm font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <HelpdeskExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        defaultStartDate={appliedStartDate}
        defaultEndDate={appliedEndDate}
      />
    </div>
  );
};

export default BMSHelpdeskReport;
