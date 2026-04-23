import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Download, ChevronsRight, ChevronRight, ChevronLeft, ChevronsLeft, ChevronDown, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

type ExportType = "all" | "open" | "completed" | "updated";

interface TowerOption { id: number; name: string; }
interface FlatOption { id: number; flat_no: string; }
interface CategoryOption { id: number; name: string; }
interface StatusOption { id: number; name: string; color_code: string; }

const ALL_COLUMNS = [
  "Id",
  "Ticket ID",
  "Created Date",
  "Created Time",
  "Complaint Title",
  "Status",
  "Category",
  "Subcategory",
  "Issue Type",
  "Severity",
  "Service Type",
  "Complaint Type",
  "Complaint Mode",
  "Urgency",
  "Proactive/Reactive",
  "Created By",
  "Tower",
  "Flat",
  "Location Level 1",
  "Location Level 2",
  "Location Level 3",
  "Updated Date",
  "Updated Time",
  "Updated By",
  "Assigned To",
  "Comment",
  "Priority",
  "Response TAT (Min)",
  "Resolution TAT (Min)",
  "Response Time (Min)",
  "Resolution Time (Min)",
  "Response Escalation Level",
  "Response Escalated To",
  "Resolution Escalation Level",
  "Resolution Escalated To",
  "Preventive Action",
  "Root Cause",
  "Impact",
  "Correction",
  "Corrective Action",
  "Issue Related To (FM/Project)",
  "Responsible Person Name",
  "Review (Tracking)",
  "Agency",
  "Rating",
  "Feedback",
  "Aging",
];

const TICKET_STATUS_MAP: Record<ExportType, string> = {
  all: "All",
  open: "Open",
  completed: "Completed",
  updated: "Updated At",
};

// ─── Multi-select checkbox dropdown ─────────────────────────────────────────
interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectProps> = ({
  options, selected, onChange, placeholder, disabled,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  };

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label ?? placeholder
      : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "w-full h-[40px] flex items-center justify-between border border-gray-200 rounded-md px-3 text-sm bg-white",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400 cursor-pointer"
        )}
      >
        <span className={selected.length === 0 ? "text-gray-400" : "text-gray-800"}>{label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
            >
              <div className={cn(
                "w-4 h-4 border rounded flex items-center justify-center shrink-0",
                selected.includes(opt.value) ? "bg-cyan-500 border-cyan-500" : "border-gray-300"
              )}>
                {selected.includes(opt.value) && <Check className="w-3 h-3 text-white" />}
              </div>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const BMSHelpdeskReport: React.FC = () => {
  // Page-level date filter
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2026, 3, 1),
    to: new Date(2026, 3, 23),
  });

  // Export dialog
  const [exportOpen, setExportOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>("all");
  const [exportDate, setExportDate] = useState<DateRange | undefined>({
    from: new Date(2026, 3, 1),
    to: new Date(2026, 3, 23),
  });

  // Advanced filter state — status & category are multi-select
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterTower, setFilterTower] = useState("");
  const [filterFlat, setFilterFlat] = useState("");  // stores flat_no

  // API data
  const [towers, setTowers] = useState<TowerOption[]>([]);
  const [flats, setFlats] = useState<FlatOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Dual listbox state
  const [availableCols, setAvailableCols] = useState<string[]>(ALL_COLUMNS);
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [availableHighlight, setAvailableHighlight] = useState<string[]>([]);
  const [selectedHighlight, setSelectedHighlight] = useState<string[]>([]);

  const showDateRange = exportType !== "open";
  const showAdvancedFilter = exportType === "all" || exportType === "updated";

  // Fetch towers, categories, statuses when dialog opens
  useEffect(() => {
    if (!exportOpen) return;
    const fetchFilters = async () => {
      setLoadingFilters(true);
      try {
        const token = localStorage.getItem("token") || "";
        const societyId = localStorage.getItem("selectedUserSociety") || "";
        const headers = { Authorization: getAuthHeader() };

        const [towersRes, categoriesRes, statusesRes] = await Promise.all([
          fetch(getFullUrl(`/get_society_blocks.json?token=${token}&society_id=${societyId}`), { headers }),
          fetch(getFullUrl("/dropdown/categories"), { headers }),
          fetch(getFullUrl("/crm/admin/complaint_statuses.json"), { headers }),
        ]);

        if (towersRes.ok) {
          const data = await towersRes.json();
          setTowers(data.society_blocks || []);
        }
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories || []);
        }
        if (statusesRes.ok) {
          const data = await statusesRes.json();
          setStatuses(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching filter data:", err);
        toast.error("Failed to load filter options");
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilters();
  }, [exportOpen]);

  // Fetch flats when tower changes
  useEffect(() => {
    if (!filterTower) {
      setFlats([]);
      setFilterFlat("");
      return;
    }
    const fetchFlats = async () => {
      setLoadingFlats(true);
      setFilterFlat("");
      try {
        const token = localStorage.getItem("token") || "";
        const societyId = localStorage.getItem("selectedUserSociety") || "";
        const res = await fetch(
          getFullUrl(`/get_society_flats.json?token=${token}&society_id=${societyId}&society_block_id=${filterTower}`),
          { headers: { Authorization: getAuthHeader() } }
        );
        if (res.ok) {
          const data = await res.json();
          setFlats(data.society_flats || []);
        }
      } catch (err) {
        console.error("Error fetching flats:", err);
        toast.error("Failed to load flats");
      } finally {
        setLoadingFlats(false);
      }
    };
    fetchFlats();
  }, [filterTower]);

  const moveAllToSelected = () => {
    setSelectedCols([...selectedCols, ...availableCols]);
    setAvailableCols([]);
    setAvailableHighlight([]);
  };

  const moveOneToSelected = () => {
    if (availableHighlight.length === 0) return;
    setSelectedCols([...selectedCols, ...availableHighlight]);
    setAvailableCols(availableCols.filter((c) => !availableHighlight.includes(c)));
    setAvailableHighlight([]);
  };

  const moveOneToAvailable = () => {
    if (selectedHighlight.length === 0) return;
    setAvailableCols([...availableCols, ...selectedHighlight]);
    setSelectedCols(selectedCols.filter((c) => !selectedHighlight.includes(c)));
    setSelectedHighlight([]);
  };

  const moveAllToAvailable = () => {
    setAvailableCols([...availableCols, ...selectedCols]);
    setSelectedCols([]);
    setSelectedHighlight([]);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const dateRange =
        exportDate?.from && exportDate?.to
          ? `${format(exportDate.from, "MM/dd/yyyy")} - ${format(exportDate.to, "MM/dd/yyyy")}`
          : "";

      const q: Record<string, unknown> = {
        ticket_status: TICKET_STATUS_MAP[exportType],
        to: selectedCols.length > 0 ? selectedCols : ALL_COLUMNS,
      };

      if (showDateRange && dateRange) q.date_range = dateRange;
      if (showAdvancedFilter) {
        if (filterStatus.length > 0) q.issue_status_in = filterStatus;
        if (filterCategory.length > 0) q.category_type_id_in = filterCategory;
        if (filterTower) q.user_society_user_flat_society_flat_society_block_id_eq = filterTower;
        if (filterFlat) q.user_society_user_flat_society_flat_flat_no_eq = filterFlat;
      }

      const response = await fetch(getFullUrl("/stream_reports.csv"), {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `helpdesk_report_${format(new Date(), "ddMMyyyy")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Helpdesk report exported successfully!");
      setExportOpen(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleApply = () => {
    if (date?.from && date?.to) {
      toast.success(
        `Applying filter from ${format(date.from, "dd/MM/yyyy")} to ${format(date.to, "dd/MM/yyyy")}`
      );
    } else {
      toast.error("Please select a date range");
    }
  };

  const handleReset = () => {
    setDate({ from: new Date(2026, 3, 1), to: new Date(2026, 3, 23) });
    toast.info("Filters reset");
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      {/* Page header bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(date.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApply} className="bg-teal-500 hover:bg-teal-600 text-white">
              Apply
            </Button>
            <Button onClick={handleReset} className="bg-cyan-400 hover:bg-cyan-500 text-white">
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={() => setExportOpen(true)}
            className="bg-cyan-400 hover:bg-cyan-500 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-center text-base font-semibold">Export</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5">
            {/* Radio options */}
            <div className="flex flex-wrap gap-6">
              {(
                [
                  { value: "all", label: "All" },
                  { value: "open", label: "Open" },
                  { value: "completed", label: "Completed & Closed" },
                  { value: "updated", label: "Updated At" },
                ] as { value: ExportType; label: string }[]
              ).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="exportType"
                    value={opt.value}
                    checked={exportType === opt.value}
                    onChange={() => setExportType(opt.value)}
                    className="accent-blue-500 w-4 h-4"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {/* Date range picker */}
            {showDateRange && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center gap-3 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 hover:border-gray-400 text-left">
                    <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                    {exportDate?.from && exportDate?.to
                      ? `${format(exportDate.from, "MM/dd/yyyy")} - ${format(exportDate.to, "MM/dd/yyyy")}`
                      : "Pick a date range"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={exportDate?.from}
                    selected={exportDate}
                    onSelect={setExportDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Advanced Filter */}
            {showAdvancedFilter && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">Advanced Filter</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Status — multi-select */}
                  <MultiSelectDropdown
                    options={statuses.map((s) => ({ label: s.name, value: String(s.id) }))}
                    selected={filterStatus}
                    onChange={setFilterStatus}
                    placeholder={loadingFilters ? "Loading..." : "Select Status"}
                    disabled={loadingFilters}
                  />

                  {/* Category — multi-select */}
                  <MultiSelectDropdown
                    options={categories.map((c) => ({ label: c.name, value: String(c.id) }))}
                    selected={filterCategory}
                    onChange={setFilterCategory}
                    placeholder={loadingFilters ? "Loading..." : "Select Category"}
                    disabled={loadingFilters}
                  />

                  {/* Tower */}
                  <Select value={filterTower} onValueChange={setFilterTower} disabled={loadingFilters}>
                    <SelectTrigger className="h-[40px] text-sm">
                      <SelectValue placeholder={loadingFilters ? "Loading..." : "All Tower"} />
                    </SelectTrigger>
                    <SelectContent>
                      {towers.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Flat — stores flat_no */}
                  <Select
                    value={filterFlat}
                    onValueChange={setFilterFlat}
                    disabled={!filterTower || loadingFlats}
                  >
                    <SelectTrigger className="h-[40px] text-sm">
                      <SelectValue
                        placeholder={
                          !filterTower
                            ? "Select Tower first"
                            : loadingFlats
                            ? "Loading..."
                            : "Select Flat"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {flats.map((f) => (
                        <SelectItem key={f.id} value={f.flat_no}>
                          {f.flat_no}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Dual listbox */}
            <div className="flex gap-3 items-start">
              {/* All Values */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 mb-1">All Values</p>
                <select
                  title="All Values"
                  multiple
                  className="w-full h-48 border border-gray-300 rounded text-sm p-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  value={availableHighlight}
                  onChange={(e) =>
                    setAvailableHighlight(Array.from(e.target.selectedOptions, (o) => o.value))
                  }
                >
                  {availableCols.map((col) => (
                    <option key={col} value={col} className="px-2 py-0.5">
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer buttons */}
              <div className="flex flex-col justify-center gap-2 pt-6">
                <button
                  onClick={moveAllToSelected}
                  className="border border-gray-300 rounded p-1.5 hover:bg-gray-100"
                  title="Move all to selected"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
                <button
                  onClick={moveOneToSelected}
                  className="border border-gray-300 rounded p-1.5 hover:bg-gray-100"
                  title="Move selected to right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={moveOneToAvailable}
                  className="border border-gray-300 rounded p-1.5 hover:bg-gray-100"
                  title="Move selected to left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={moveAllToAvailable}
                  className="border border-gray-300 rounded p-1.5 hover:bg-gray-100"
                  title="Move all to available"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Selected Values */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 mb-1">Selected Values</p>
                <select
                  title="Selected Values"
                  multiple
                  className="w-full h-48 border border-gray-300 rounded text-sm p-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  value={selectedHighlight}
                  onChange={(e) =>
                    setSelectedHighlight(Array.from(e.target.selectedOptions, (o) => o.value))
                  }
                >
                  {selectedCols.map((col) => (
                    <option key={col} value={col} className="px-2 py-0.5">
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Export button */}
          <div className="border-t px-6 py-4 flex justify-center">
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-cyan-400 hover:bg-cyan-500 text-white px-8 disabled:opacity-70"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BMSHelpdeskReport;
