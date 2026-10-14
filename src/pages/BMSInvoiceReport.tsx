import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, SlidersHorizontal } from "lucide-react";
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

const BMSInvoiceReport: React.FC = () => {
  const [selectedTower, setSelectedTower] = useState("");
  const [selectedFlat, setSelectedFlat] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [createdOn, setCreatedOn] = useState<Date>();
  const [billingPeriod, setBillingPeriod] = useState<Date>();

  const towers = ["A", "B", "C", "D", "FM", "GL"];
  const flats = ["101", "102", "103", "104", "105", "Office", "Team"];

  const handleApply = () => {
    toast.success("Applying filters...");
  };

  const handleReset = () => {
    setSelectedTower("");
    setSelectedFlat("");
    setDueDate(undefined);
    setCreatedOn(undefined);
    setBillingPeriod(undefined);
    toast.info("Filters reset");
  };

  return (
    <div className="p-6 min-h-screen invoice-report-page">
      <style>{`
        html body #root .invoice-report-page {
          background-color: #FDFDFB !important;
        }
        html body #root .invoice-report-page .ref-card {
          background: #FFFFFF;
          border: 1px solid rgba(26, 26, 24, 0.09);
          border-radius: 16px;
          overflow: hidden;
        }
        html body #root .invoice-report-page .ref-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 22px 24px 0;
        }
        html body #root .invoice-report-page .ref-card-head h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A18;
        }
        html body #root .invoice-report-page .ref-chip {
          width: 32px;
          height: 32px;
          flex: none;
          border-radius: 9999px;
          background: #F5F4F0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        html body #root .invoice-report-page .ref-chip svg {
          width: 14px;
          height: 14px;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .invoice-report-page .ref-card-body {
          padding: 20px 24px 22px;
        }
        html body #root .invoice-report-page .ref-label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(26, 26, 24, 0.68);
        }
        html body #root .invoice-report-page .ref-field {
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
        html body #root .invoice-report-page .ref-field:hover {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .invoice-report-page .ref-field[data-state="open"],
        html body #root .invoice-report-page .ref-field:focus-visible {
          border-color: #1A1A18 !important;
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .invoice-report-page .ref-field.is-empty,
        html body #root .invoice-report-page .ref-field [data-placeholder],
        html body #root .invoice-report-page .ref-field[data-placeholder] {
          color: rgba(26, 26, 24, 0.3) !important;
        }
        html body #root .invoice-report-page .ref-field svg {
          color: rgba(26, 26, 24, 0.48) !important;
        }
      `}</style>

      <div className="mb-6">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
          Invoice Report
        </h1>
        <p className="mt-1 text-[13px] text-[rgba(26,26,24,0.55)]">
          Filter invoices by flat, due date, creation date or billing period
        </p>
      </div>

      <div className="ref-card">
        <div className="ref-card-head">
          <span className="ref-chip">
            <SlidersHorizontal />
          </span>
          <h2>Report Filters</h2>
        </div>

        <div className="ref-card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="ref-label">Select Tower</label>
              <Select value={selectedTower} onValueChange={setSelectedTower}>
                <SelectTrigger className="ref-field">
                  <SelectValue placeholder="Select Tower" />
                </SelectTrigger>
                <SelectContent>
                  {towers.map((tower) => (
                    <SelectItem key={tower} value={tower}>
                      {tower}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="ref-label">Select Flat</label>
              <Select value={selectedFlat} onValueChange={setSelectedFlat}>
                <SelectTrigger className="ref-field">
                  <SelectValue placeholder="Select Flat" />
                </SelectTrigger>
                <SelectContent>
                  {flats.map((flat) => (
                    <SelectItem key={flat} value={flat}>
                      {flat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="ref-label">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("ref-field w-full justify-start text-left", !dueDate && "is-empty")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Select due date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="ref-label">Created on</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("ref-field w-full justify-start text-left", !createdOn && "is-empty")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {createdOn ? format(createdOn, "dd/MM/yyyy") : <span>Select created date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={createdOn} onSelect={setCreatedOn} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="ref-label">Billing Period</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("ref-field w-full justify-start text-left", !billingPeriod && "is-empty")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {billingPeriod ? format(billingPeriod, "dd/MM/yyyy") : <span>Select billing period</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={billingPeriod} onSelect={setBillingPeriod} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button
          variant="outline"
          onClick={handleReset}
          className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
        >
          Reset
        </Button>
        <Button onClick={handleApply} className="btn-primary h-9 px-4 text-sm font-medium">
          Apply
        </Button>
      </div>
    </div>
  );
};

export default BMSInvoiceReport;
