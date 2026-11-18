import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { TextField, FormControl, Select as MuiSelect, MenuItem } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ApiVehicleHistory {
  id: number;
  in_time: string | null;
  out_time: string | null;
  vehicle_number: string | null;
  vehicle_type: string | null;
  parking_slot: string | null;
  gatekeeper?: {
    guest_name?: string | null;
    guest_number?: string | null;
    visit_purpose?: string | null;
  } | null;
  user_society?: {
    user_name?: string | null;
    user_mobile?: string | null;
    block_no?: string | null;
    flat_no?: string | null;
    building_name?: string | null;
  } | null;
}

interface ApiResponse {
  data: ApiVehicleHistory[];
  pagination?: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

interface HistoryRow {
  id: number;
  name: string;
  mobile: string;
  building: string;
  tower: string;
  flat: string;
  purpose: string;
  slot: string;
  inTime: string;
  outTime: string;
}

interface FilterOption {
  label: string;
  value: number | string;
}

interface FilterOptions {
  buildings: FilterOption[];
  towers: FilterOption[];
  flats: FilterOption[];
}

interface FilterState {
  building: string;
  tower: string;
  flat: string;
  from_date: string; // YYYY-MM-DD (input value)
  to_date: string;
  vehicle_number: string;
}

const PER_PAGE = 20;

const defaultFilters: FilterState = {
  building: "",
  tower: "",
  flat: "",
  from_date: "",
  to_date: "",
  vehicle_number: "",
};

const historyColumns: ColumnConfig[] = [
  { key: "sr_no",    label: "Sr. No.",       sortable: false, hideable: true, draggable: true },
  { key: "name",     label: "Name",          sortable: true,  hideable: true, draggable: true },
  { key: "mobile",   label: "Mobile Number", sortable: true,  hideable: true, draggable: true },
  { key: "building", label: "Building",      sortable: true,  hideable: true, draggable: true },
  { key: "tower",    label: "Tower",         sortable: true,  hideable: true, draggable: true },
  { key: "flat",     label: "Flat",          sortable: true,  hideable: true, draggable: true },
  { key: "purpose",  label: "Purpose",       sortable: true,  hideable: true, draggable: true },
  { key: "slot",     label: "Slot Number",   sortable: true,  hideable: true, draggable: true },
  { key: "inTime",   label: "In",            sortable: true,  hideable: true, draggable: true },
  { key: "outTime",  label: "Out",           sortable: true,  hideable: true, draggable: true },
];

const dash = (v?: string | null) => (v && String(v).trim() ? String(v) : "-");

const toRow = (r: ApiVehicleHistory): HistoryRow => ({
  id: r.id,
  // Guest visitors carry their own name/number; otherwise fall back to the host.
  name: dash(r.gatekeeper?.guest_name || r.user_society?.user_name),
  mobile: dash(r.gatekeeper?.guest_number || r.user_society?.user_mobile),
  building: dash(r.user_society?.building_name),
  tower: dash(r.user_society?.block_no),
  flat: dash(r.user_society?.flat_no),
  purpose: dash(r.gatekeeper?.visit_purpose),
  slot: dash(r.parking_slot),
  inTime: dash(r.in_time),
  outTime: dash(r.out_time),
});

// YYYY-MM-DD -> DD/MM/YYYY (format the API expects in q[date_range])
const toApiDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Shared by the list request and the Excel export so both use the same filters.
const appendFilterParams = (params: URLSearchParams, f: FilterState) => {
  if (f.building) params.append("q[user_society_id_society_in][]", f.building);
  if (f.tower) params.append("q[user_society_user_flat_society_flat_society_block_id_in][]", f.tower);
  if (f.flat) params.append("q[user_society_user_flat_society_flat_id_in][]", f.flat);
  if (f.from_date && f.to_date)
    params.set("q[date_range]", `${toApiDate(f.from_date)} - ${toApiDate(f.to_date)}`);
  if (f.vehicle_number.trim()) params.set("q[vehicle_number_cont]", f.vehicle_number.trim());
};

const SmartSecureVehicleInHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(defaultFilters);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Building / Block / Flat dropdown options
  const { data: filterOptions, isLoading: loadingOptions } = useQuery<FilterOptions>({
    queryKey: ["vehicle-history-filter-options"],
    queryFn: async () => {
      const res = await fetch(getFullUrl("/crm/admin/visitors_vehicle_history_filters.json"), {
        headers: { Authorization: getAuthHeader() },
      });
      if (!res.ok) throw new Error(`Failed to fetch filters: ${res.status}`);
      const d = (await res.json()).data || {};
      return {
        buildings: (d.buildings || []).map((b: { id: number; name: string }) => ({ label: b.name, value: b.id })),
        towers: (d.blocks || []).map((b: { id: number; name: string }) => ({ label: b.name, value: b.id })),
        flats: (d.flats || []).map((f: { id: number; flat_no: string }) => ({ label: f.flat_no, value: f.id })),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError, error } = useQuery<ApiResponse>({
    queryKey: ["vehicle-in-history", currentPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("per_page", String(PER_PAGE));
      appendFilterParams(params, filters);
      const res = await fetch(
        getFullUrl(`/crm/admin/visitors_vehicle_history.json?${params.toString()}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      return res.json();
    },
    staleTime: 30000,
  });

  const rows = useMemo(() => (data?.data ?? []).map(toRow), [data]);
  // Server-side paging when the API reports pagination meta; otherwise fall back to
  // paging the returned rows on the client so 20 records per page always applies.
  const serverPaged = Boolean(data?.pagination);
  const totalPages =
    data?.pagination?.total_pages ?? Math.max(1, Math.ceil(rows.length / PER_PAGE));

  const setDraftField = (key: keyof FilterState, val: string) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  const handleApply = () => {
    if (!!draft.from_date !== !!draft.to_date) {
      toast.error("Select both From and To date");
      return;
    }
    if (draft.from_date && draft.to_date && draft.from_date > draft.to_date) {
      toast.error("From date cannot be after To date");
      return;
    }
    setFilters(draft);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  const handleReset = () => {
    setDraft(defaultFilters);
    setFilters(defaultFilters);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  // Exports everything matching the applied filters (not just the current page)
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      appendFilterParams(params, filters);
      const qs = params.toString();
      const res = await fetch(
        getFullUrl(`/crm/admin/visitors_vehicle_history.xlsx${qs ? `?${qs}` : ""}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vehicle_history_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded successfully");
    } catch (e) {
      toast.error((e as Error)?.message || "Failed to export");
    }
  };

  const renderSelect = (
    label: string,
    key: "building" | "tower" | "flat",
    items: FilterOption[] = []
  ) => (
    <div className="space-y-2">
      <label className="block text-[12.5px] font-semibold text-[rgba(26,26,24,.68)]">{label}</label>
      <FormControl fullWidth variant="outlined">
        <MuiSelect
          value={draft[key]}
          onChange={(e) => setDraftField(key, e.target.value as string)}
          displayEmpty
          disabled={loadingOptions}
          sx={{
            ...fieldStyles,
            height: 50,
            borderRadius: "12px",
            color: draft[key] ? "#1A1A18" : "rgba(26,26,24,.38)",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(26,26,24,.10)" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(26,26,24,.24)" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1A1A18", borderWidth: 1 },
            "& .MuiSelect-select": { padding: "14px 16px", fontSize: "13.5px" },
          }}
          MenuProps={menuProps}
        >
          <MenuItem value="">Select {label}</MenuItem>
          {items.map((item) => (
            <MenuItem key={`${key}-${item.value}`} value={String(item.value)}>
              {item.label}
            </MenuItem>
          ))}
        </MuiSelect>
      </FormControl>
    </div>
  );

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      height: 50,
      borderRadius: "12px",
      fontSize: "13.5px",
      "& fieldset": { borderColor: "rgba(26,26,24,.10)" },
      "&:hover fieldset": { borderColor: "rgba(26,26,24,.24)" },
      "&.Mui-focused fieldset": { borderColor: "#1A1A18" },
    },
  };

  const renderCell = (item: HistoryRow, columnKey: string, index: number) => {
    switch (columnKey) {
      case "sr_no":
        // Continues across pages (page 2 starts at 21)
        return (
          <span className="text-sm text-gray-500 font-medium">
            {(currentPage - 1) * PER_PAGE + index + 1}
          </span>
        );
      case "name":
        return <span className="font-semibold text-gray-900">{item.name}</span>;
      case "mobile":
      case "building":
      case "tower":
      case "flat":
      case "purpose":
      case "slot":
      case "inTime":
      case "outTime":
        return (
          <span className="text-sm text-gray-700">
            {item[columnKey as keyof HistoryRow]}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {isError && (
        <div className="mb-3 text-sm text-red-600">
          {error instanceof Error ? error.message : "Failed to load vehicle history"}
        </div>
      )}
      <EnhancedTable
        data={rows}
        columns={historyColumns}
        renderCell={renderCell}
        storageKey="vehicles-in-history-table"
        enableSearch={true}
        searchPlaceholder="Search by name, mobile, flat or slot..."
        emptyMessage="No vehicle history found"
        loading={isLoading}
        enableExport={true}
        handleExport={handleExport}
        pagination={true}
        manualPagination={serverPaged}
        pageSize={PER_PAGE}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onFilterClick={() => {
          setDraft(filters);
          setFilterOpen(true);
        }}
      />

      <Dialog open={filterOpen} modal={false} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl sm:rounded-2xl border border-[rgba(26,26,24,.09)] p-0 gap-0 [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-[22px] pb-4">
            <DialogTitle className="text-sm font-semibold leading-[1.4] text-[#1A1A18]">Filter By</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterOpen(false)}
              className="h-8 w-8 p-0 rounded-md hover:bg-[#F7F6F2]"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </DialogHeader>

          <div className="space-y-5 px-6 pb-6">
            <div>
              <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.09em] text-[rgba(26,26,24,.48)]">Vehicle Details</div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                {renderSelect("Building", "building", filterOptions?.buildings)}
                {renderSelect("Block", "tower", filterOptions?.towers)}
                {renderSelect("Flat", "flat", filterOptions?.flats)}
                <div className="space-y-2">
                  <label className="block text-[12.5px] font-semibold text-[rgba(26,26,24,.68)]">Vehicle Number</label>
                  <TextField
                    placeholder="e.g. MH12"
                    value={draft.vehicle_number}
                    onChange={(e) => setDraftField("vehicle_number", e.target.value.toUpperCase())}
                    fullWidth
                    variant="outlined"
                    sx={inputSx}
                    inputProps={{ "aria-label": "Vehicle Number" }}
                  />
                </div>
              </div>
            </div>
            <div className="pt-1">
              <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.09em] text-[rgba(26,26,24,.48)]">In Date Range</div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-[12.5px] font-semibold text-[rgba(26,26,24,.68)]">From Date</label>
                  <TextField
                    type="date"
                    value={draft.from_date}
                    onChange={(e) => setDraftField("from_date", e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={inputSx}
                    inputProps={{ "aria-label": "From Date" }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[12.5px] font-semibold text-[rgba(26,26,24,.68)]">To Date</label>
                  <TextField
                    type="date"
                    value={draft.to_date}
                    onChange={(e) => setDraftField("to_date", e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={inputSx}
                    inputProps={{ "aria-label": "To Date" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgba(26,26,24,.08)]">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E]"
            >
              Apply Filters
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartSecureVehicleInHistory;
