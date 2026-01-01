import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Tower
            </label>
            <Select value={selectedTower} onValueChange={setSelectedTower}>
              <SelectTrigger>
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
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Flat</label>
            <Select value={selectedFlat} onValueChange={setSelectedFlat}>
              <SelectTrigger>
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
            <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Due Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Created on</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !createdOn && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {createdOn ? format(createdOn, "dd/MM/yyyy") : <span>Created on</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={createdOn}
                  onSelect={setCreatedOn}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Billing Period
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !billingPeriod && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {billingPeriod ? (
                    format(billingPeriod, "dd/MM/yyyy")
                  ) : (
                    <span>Billing Period</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={billingPeriod}
                  onSelect={setBillingPeriod}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleApply} className="bg-teal-500 hover:bg-teal-600 text-white">
            Apply
          </Button>
          <Button onClick={handleReset} className="bg-cyan-400 hover:bg-cyan-500 text-white">
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BMSInvoiceReport;
