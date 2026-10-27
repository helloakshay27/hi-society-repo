import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarIcon,
  Download,
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronDown,
  Check,
} from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

type ExportType = "all" | "open" | "completed" | "updated";

interface TowerOption {
  id: number;
  name: string;
}
interface FlatOption {
  id: number;
  flat_no: string;
  society_block_id: number;
}
interface CategoryOption {
  id: number;
  name: string;
}
interface StatusOption {
  id: number;
  name: string;
  color_code: string;
}

interface StreamReportResponse {
  status: string;
  report_id?: number | string;
  message?: string;
  download_url?: string;
}

const isStreamReportResponse = (
  value: unknown
): value is StreamReportResponse => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("status" in value) ||
    typeof value.status !== "string"
  ) {
    return false;
  }

  return (
    (!("report_id" in value) ||
      typeof value.report_id === "string" ||
      typeof value.report_id === "number") &&
    (!("message" in value) || typeof value.message === "string") &&
    (!("download_url" in value) || typeof value.download_url === "string")
  );
};

// Matches the date fields on the Helpdesk Report page
const dateTriggerClass =
  "w-full h-11 flex items-center gap-2.5 px-3.5 text-left text-[13.5px] font-medium text-[#1A1A18] bg-white border border-[rgba(26,26,24,0.08)] rounded-xl transition-[border-color,box-shadow] hover:border-[rgba(26,26,24,0.28)] data-[state=open]:border-[#1A1A18] data-[state=open]:shadow-[0_0_0_4px_rgba(26,26,24,0.1)]";

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
  options,
  selected,
  onChange,
  placeholder,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val]
    );
  };

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? placeholder)
        : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "w-full h-[40px] flex items-center justify-between border border-gray-200 rounded-md px-3 text-sm bg-white",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-gray-400 cursor-pointer"
        )}
      >
        <span
          className={selected.length === 0 ? "text-gray-400" : "text-gray-800"}
        >
          {label}
        </span>
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
              <div
                className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center shrink-0",
                  selected.includes(opt.value)
                    ? "bg-[#1a1a18] border-[#1a1a18]"
                    : "border-gray-300"
                )}
              >
                {selected.includes(opt.value) && (
                  <Check className="w-3 h-3 text-white" />
                )}
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

interface HelpdeskExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
}

export const HelpdeskExportDialog: React.FC<HelpdeskExportDialogProps> = ({
  isOpen,
  onClose,
  defaultStartDate,
  defaultEndDate,
}) => {
  const [exportType, setExportType] = useState<ExportType>("all");
  const [exportDate, setExportDate] = useState<DateRange | undefined>({
    from: defaultStartDate ?? startOfMonth(new Date()),
    to: defaultEndDate ?? new Date(),
  });

  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  // Sync date range with the parent's applied dates each time the dialog opens
  useEffect(() => {
    if (isOpen && defaultStartDate && defaultEndDate) {
      setExportDate({ from: defaultStartDate, to: defaultEndDate });
    }
  }, [isOpen, defaultStartDate, defaultEndDate]);

  // Advanced filter state — status & category are multi-select
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterTower, setFilterTower] = useState<string[]>([]); // tower (society_block) ids
  const [filterFlat, setFilterFlat] = useState<string[]>([]); // flat (society_flat) ids

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

  const showAdvancedFilter = exportType === "all" || exportType === "updated";

  // Fetch towers, categories, statuses when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchFilters = async () => {
      setLoadingFilters(true);
      try {
        const token = localStorage.getItem("token") || "";
        const societyId = localStorage.getItem("selectedSocietyId") || "";
        const headers = { Authorization: getAuthHeader() };

        const [towersRes, categoriesRes, statusesRes] = await Promise.all([
          fetch(
            getFullUrl(
              `/get_society_blocks.json?token=${token}&society_id=${societyId}`
            ),
            { headers }
          ),
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
  }, [isOpen]);

  // Fetch flats for every selected tower; drop selected flats whose tower was deselected
  useEffect(() => {
    if (filterTower.length === 0) {
      setFlats([]);
      setFilterFlat([]);
      return;
    }
    let cancelled = false;
    const fetchFlats = async () => {
      setLoadingFlats(true);
      try {
        const token = localStorage.getItem("token") || "";
        const societyId = localStorage.getItem("selectedSocietyId") || "";
        const results = await Promise.all(
          filterTower.map(async (towerId) => {
            const res = await fetch(
              getFullUrl(
                `/get_society_flats.json?token=${token}&society_id=${societyId}&society_block_id=${towerId}`
              ),
              { headers: { Authorization: getAuthHeader() } }
            );
            if (!res.ok) return [];
            const data = await res.json();
            return ((data.society_flats || []) as FlatOption[]).map((f) => ({
              ...f,
              society_block_id: Number(towerId),
            }));
          })
        );
        if (cancelled) return;
        const allFlats = results.flat();
        setFlats(allFlats);
        const validIds = new Set(allFlats.map((f) => String(f.id)));
        setFilterFlat((prev) => prev.filter((id) => validIds.has(id)));
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching flats:", err);
        toast.error("Failed to load flats");
      } finally {
        if (!cancelled) setLoadingFlats(false);
      }
    };
    fetchFlats();
    return () => {
      cancelled = true;
    };
  }, [filterTower]);

  const moveAllToSelected = () => {
    setSelectedCols([...selectedCols, ...availableCols]);
    setAvailableCols([]);
    setAvailableHighlight([]);
  };

  const moveOneToSelected = () => {
    if (availableHighlight.length === 0) return;
    setSelectedCols([...selectedCols, ...availableHighlight]);
    setAvailableCols(
      availableCols.filter((c) => !availableHighlight.includes(c))
    );
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

      if (dateRange) q.date_range = dateRange;
      if (showAdvancedFilter) {
        if (filterStatus.length > 0) q.issue_status_in = filterStatus;
        if (filterCategory.length > 0) q.category_type_id_in = filterCategory;

        // Tower/flat can be linked either on the ticket itself or via the user's flat, so OR both paths
        const g: Record<string, unknown>[] = [];
        if (filterTower.length > 0) {
          const towerIds = filterTower.map(Number);
          g.push({
            m: "or",
            society_flat_society_block_id_in: towerIds,
            user_society_user_flat_society_flat_society_block_id_in: towerIds,
          });
        }
        if (filterFlat.length > 0) {
          const flatIds = filterFlat.map(Number);
          g.push({
            m: "or",
            society_flat_id_in: flatIds,
            user_society_user_flat_society_flat_id_in: flatIds,
          });
        }
        if (g.length > 0) q.g = g;
      }

      const response = await fetch(getFullUrl("/stream_reports"), {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const fileName = `helpdesk_report_${format(new Date(), "ddMMyyyy")}.csv`;
      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("json")) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Helpdesk report exported successfully!");
        onClose();
        return;
      }

      const responseData: unknown = await response.json();
      if (!isStreamReportResponse(responseData)) {
        throw new Error("Invalid report response");
      }

      let report = responseData;
      if (report.status === "processing") {
        const reportId = report.report_id;
        if (reportId === undefined || reportId === "") {
          throw new Error("Missing report ID in processing response");
        }

        toast.info(
          report.message ??
            "The report is still being generated, it will download automatically once it is ready."
        );

        do {
          await new Promise((resolve) => window.setTimeout(resolve, 5000));
          const statusResponse = await fetch(
            getFullUrl(
              `/stream_report_status?report_id=${encodeURIComponent(reportId)}`
            ),
            {
              headers: { Authorization: getAuthHeader() },
            }
          );

          if (!statusResponse.ok) {
            throw new Error(`HTTP ${statusResponse.status}`);
          }

          const statusData: unknown = await statusResponse.json();
          if (!isStreamReportResponse(statusData)) {
            throw new Error("Invalid report status response");
          }

          report = statusData;
        } while (report.status === "processing");
      }

      if (report.status === "completed") {
        if (!report.download_url) {
          throw new Error("Missing download URL in completed response");
        }

        const link = document.createElement("a");
        link.href = report.download_url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(report.message ?? "Helpdesk report exported successfully!");
        onClose();
      } else if (report.status === "failed" || report.status === "not_started") {
        toast.error(report.message ?? "Failed to export report. Please try again.");
      } else {
        throw new Error(`Unexpected report status: ${report.status}`);
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-center text-base font-semibold">
            Export
          </DialogTitle>
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
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
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

          {/* Start / End date — same fields as the Helpdesk Report page */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-xs font-semibold text-[rgba(26,26,24,0.68)]">
                Start Date
              </label>
              <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      dateTriggerClass,
                      !exportDate?.from && "text-[rgba(26,26,24,0.3)]"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-[rgba(26,26,24,0.48)] shrink-0" />
                    {exportDate?.from
                      ? format(exportDate.from, "dd/MM/yyyy")
                      : "Pick start date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    defaultMonth={exportDate?.from}
                    selected={exportDate?.from}
                    onSelect={(day) => {
                      setExportDate((prev) => ({ from: day, to: prev?.to }));
                      setStartPickerOpen(false);
                    }}
                    disabled={(day) =>
                      exportDate?.to ? day > exportDate.to : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block mb-2 text-xs font-semibold text-[rgba(26,26,24,0.68)]">
                End Date
              </label>
              <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      dateTriggerClass,
                      !exportDate?.to && "text-[rgba(26,26,24,0.3)]"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-[rgba(26,26,24,0.48)] shrink-0" />
                    {exportDate?.to
                      ? format(exportDate.to, "dd/MM/yyyy")
                      : "Pick end date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    defaultMonth={exportDate?.to ?? exportDate?.from}
                    selected={exportDate?.to}
                    onSelect={(day) => {
                      setExportDate((prev) => ({ from: prev?.from, to: day }));
                      setEndPickerOpen(false);
                    }}
                    disabled={(day) =>
                      exportDate?.from ? day < exportDate.from : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Advanced Filter */}
          {showAdvancedFilter && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">
                Advanced Filter
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Status — multi-select */}
                <MultiSelectDropdown
                  options={statuses.map((s) => ({
                    label: s.name,
                    value: String(s.id),
                  }))}
                  selected={filterStatus}
                  onChange={setFilterStatus}
                  placeholder={loadingFilters ? "Loading..." : "Select Status"}
                  disabled={loadingFilters}
                />

                {/* Category — multi-select */}
                <MultiSelectDropdown
                  options={categories.map((c) => ({
                    label: c.name,
                    value: String(c.id),
                  }))}
                  selected={filterCategory}
                  onChange={setFilterCategory}
                  placeholder={
                    loadingFilters ? "Loading..." : "Select Category"
                  }
                  disabled={loadingFilters}
                />

                {/* Tower — multi-select */}
                <MultiSelectDropdown
                  options={towers.map((t) => ({
                    label: t.name,
                    value: String(t.id),
                  }))}
                  selected={filterTower}
                  onChange={setFilterTower}
                  placeholder={loadingFilters ? "Loading..." : "All Tower"}
                  disabled={loadingFilters}
                />

                {/* Flat — multi-select, options come from all selected towers */}
                <MultiSelectDropdown
                  options={flats.map((f) => ({
                    label:
                      filterTower.length > 1
                        ? `${towers.find((t) => t.id === f.society_block_id)?.name ?? ""} - ${f.flat_no}`
                        : f.flat_no,
                    value: String(f.id),
                  }))}
                  selected={filterFlat}
                  onChange={setFilterFlat}
                  placeholder={
                    filterTower.length === 0
                      ? "Select Tower first"
                      : loadingFlats
                        ? "Loading..."
                        : "Select Flat"
                  }
                  disabled={filterTower.length === 0 || loadingFlats}
                />
              </div>
            </div>
          )}

          {/* Dual listbox */}
          <div className="flex gap-3 items-start">
            {/* All Values */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 mb-1">
                All Values
              </p>
              <select
                title="All Values"
                multiple
                className="w-full h-48 border border-gray-300 rounded text-sm p-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                value={availableHighlight}
                onChange={(e) =>
                  setAvailableHighlight(
                    Array.from(e.target.selectedOptions, (o) => o.value)
                  )
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
              <p className="text-sm font-medium text-gray-700 mb-1">
                Selected Values
              </p>
              <select
                title="Selected Values"
                multiple
                className="w-full h-48 border border-gray-300 rounded text-sm p-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                value={selectedHighlight}
                onChange={(e) =>
                  setSelectedHighlight(
                    Array.from(e.target.selectedOptions, (o) => o.value)
                  )
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
            className="px-8 bg-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpdeskExportDialog;
