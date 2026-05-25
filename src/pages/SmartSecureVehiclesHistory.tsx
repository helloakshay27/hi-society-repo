import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Plus, Loader2 } from "lucide-react";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";

// ─── API Types ────────────────────────────────────────────────────────────────

interface ApiVehicleHistory {
  id: number;
  in_time: string | null;
  out_time: string | null;
  vehicle_number: string | null;
  vehicle_type: string | null;
  parking_slot: string | null;
  move_in_status: {
    is_moved_in: boolean;
    moved_in_at: string | null;
    moved_in_by: string | null;
  };
  move_out_status: {
    is_moved_out: boolean;
    moved_out_at: string | null;
    exit_gate_id: number | null;
  };
  user_society?: {
    id: number;
    user_name: string;
    user_mobile: string;
    flat_no: string;
    block_no: string;
    building_name: string;
    flat_id: number;
  } | null;
  gatekeeper?: {
    id: number;
    guest_name: string;
    guest_number: string;
    visit_purpose: string | null;
    guest_type: string | null;
  } | null;
  created_by_user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: ApiVehicleHistory[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
  message?: string;
}

// ─── Filter State ─────────────────────────────────────────────────────────────

interface FilterState {
  building: string;
  tower: string;
  flat: string;
  from_date: string;
  to_date: string;
}

const defaultFilters: FilterState = {
  building: "",
  tower: "",
  flat: "",
  from_date: "",
  to_date: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Times from API are already formatted strings (e.g. "21/04/2026 09:57 AM")
const formatDateTime = (val: string | null | undefined): string => {
  if (!val) return "--";
  return val;
};

const toFilterDate = (isoDate: string): string => {
  // Convert YYYY-MM-DD → DD/MM/YYYY for the API date_range param
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
};

const buildQueryString = (page: number, filters: FilterState): string => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", "20");
  if (filters.building)
    params.append("q[user_society_id_society_in][]", filters.building);
  if (filters.tower)
    params.append("q[user_society_user_flat_society_flat_society_block_id_in][]", filters.tower);
  if (filters.flat)
    params.append("q[user_society_user_flat_society_flat_id_in][]", filters.flat);
  if (filters.from_date && filters.to_date)
    params.set("q[date_range]", `${toFilterDate(filters.from_date)} - ${toFilterDate(filters.to_date)}`);
  return params.toString();
};

// ─── Column Config ────────────────────────────────────────────────────────────

const vehicleHistoryColumns: ColumnConfig[] = [
  { key: "sr_no",         label: "Sr. No.",       sortable: false, hideable: true,  draggable: true },
  { key: "name",          label: "Name",          sortable: true,  hideable: true,  draggable: true },
  { key: "vehicle_number", label: "Vehicle Number", sortable: true,  hideable: true,  draggable: true },
  { key: "mobile_number", label: "Mobile Number", sortable: true,  hideable: true,  draggable: true },
  { key: "building",      label: "Building",      sortable: true,  hideable: true,  draggable: true },
  { key: "tower",         label: "Tower",         sortable: true,  hideable: true,  draggable: true },
  { key: "flat",          label: "Flat",          sortable: true,  hideable: true,  draggable: true },
  { key: "purpose",       label: "Purpose",       sortable: true,  hideable: true,  draggable: true },
  { key: "slot_number",   label: "Slot Number",   sortable: true,  hideable: true,  draggable: true },
  { key: "in_time",       label: "In",            sortable: true,  hideable: true,  draggable: true },
  { key: "out_time",      label: "Out",           sortable: true,  hideable: true,  draggable: true },
];

// ─── Add Vehicle dropdown option ──────────────────────────────────────────────

interface DropdownOption { id: number | string; name: string; }

interface AddVehicleFormState {
  vehicle_type: "host" | "guest";
  host_name: string;
  guest_name: string;
  vehicle_number: string;
  parking_slot: string;
  entry_gate: string;
}

const defaultAddForm: AddVehicleFormState = {
  vehicle_type: "host",
  host_name: "",
  guest_name: "",
  vehicle_number: "",
  parking_slot: "",
  entry_gate: "",
};

// ─── Add Vehicle Modal ────────────────────────────────────────────────────────

interface AddVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState<AddVehicleFormState>(defaultAddForm);
  const [hosts, setHosts] = useState<DropdownOption[]>([]);
  const [guests, setGuests] = useState<DropdownOption[]>([]);
  const [parkingSlots, setParkingSlots] = useState<DropdownOption[]>([]);
  const [entryGates, setEntryGates] = useState<DropdownOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(defaultAddForm);
    const load = async () => {
      setLoadingOptions(true);
      try {
        const res = await fetch(getFullUrl("/crm/admin/visitors_vehicle_history_filters.json"), {
          headers: { Authorization: getAuthHeader() },
        });
        if (res.ok) {
          const json = await res.json();
          const d = json.data || {};
          setHosts((d.host_names || []).map((h: { id: number; name: string }) => ({ id: h.id, name: h.name })));
          setGuests((d.guest_names || []).map((g: { id: number; name: string }) => ({ id: g.id, name: g.name })));
          setParkingSlots((d.parking_slots || []).map((p: { id: number; number: string; vehicle_type: string }) => ({ id: p.id, name: `${p.number} (${p.vehicle_type})` })));
          setEntryGates((d.entry_gates || []).map((e: { id: number; name: string }) => ({ id: e.id, name: e.name })));
        }
      } catch { /* silently ignore — dropdowns stay empty */ }
      finally { setLoadingOptions(false); }
    };
    load();
  }, [open]);

  const set = <K extends keyof AddVehicleFormState>(key: K, val: AddVehicleFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.vehicle_number.trim()) { toast.error("Vehicle Number is required"); return; }
    if (form.vehicle_type === "host" && !form.host_name) { toast.error("Host Name is required"); return; }
    if (form.vehicle_type === "guest" && !form.guest_name) { toast.error("Guest Name is required"); return; }

    setSubmitting(true);
    try {
      const payload = {
        visitor_type: form.vehicle_type,
        visitor_vehicle_in_out: {
          user_society_id: form.vehicle_type === "host" ? form.host_name : "",
          gatekeeper_id: form.vehicle_type === "guest" ? form.guest_name : "",
          vehicle_number: form.vehicle_number.toUpperCase(),
          visitor_parking_slot_id: form.parking_slot || "",
          entry_gate_id: form.entry_gate || "",
        },
      };

      const res = await fetch(getFullUrl("/crm/admin/visitor_vehicle_in_outs.json"), {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Vehicle added successfully!");
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.errors?.join(", ") || err?.message || "Failed to add vehicle");
      }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} modal={false} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Vehicle</DialogTitle>
        </DialogHeader>

        {loadingOptions ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#C72030]" />
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Type */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <RadioGroup
                row
                value={form.vehicle_type}
                onChange={(e) => set("vehicle_type", e.target.value as "host" | "guest")}
              >
                <FormControlLabel value="host" control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#1a73e8" } }} />} label="Host" />
                <FormControlLabel value="guest" control={<Radio size="small" sx={{ "&.Mui-checked": { color: "#1a73e8" } }} />} label="Guest" />
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Host Name */}
              {form.vehicle_type === "host" && (
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                    Select Host Name <span style={{ color: '#ef4444' }}>*</span>
                  </InputLabel>
                  <MuiSelect
                    label="Select Host Name *"
                    displayEmpty
                    value={form.host_name}
                    onChange={(e) => set("host_name", e.target.value)}
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="" disabled><em>Select Host Name</em></MenuItem>
                    {hosts.length === 0
                      ? <MenuItem disabled value="__none">No hosts available</MenuItem>
                      : hosts.map((h) => <MenuItem key={h.id} value={String(h.id)}>{h.name}</MenuItem>)
                    }
                  </MuiSelect>
                </FormControl>
              )}

              {/* Guest Name */}
              {form.vehicle_type === "guest" && (
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                    Select Guest Name <span style={{ color: '#ef4444' }}>*</span>
                  </InputLabel>
                  <MuiSelect
                    label="Select Guest Name *"
                    displayEmpty
                    value={form.guest_name}
                    onChange={(e) => set("guest_name", e.target.value)}
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="" disabled><em>Select Guest Name</em></MenuItem>
                    {guests.length === 0
                      ? <MenuItem disabled value="__none">No guests available</MenuItem>
                      : guests.map((g) => <MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>)
                    }
                  </MuiSelect>
                </FormControl>
              )}

              {/* Vehicle Number */}
              <TextField
                label="Vehicle Number"
                placeholder="Enter Vehicle Number"
                value={form.vehicle_number}
                onChange={(e) => set("vehicle_number", e.target.value.toUpperCase())}
                fullWidth
                variant="outlined"
                required
                inputProps={{ maxLength: 20 }}
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Parking Slot */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                  Select Parking Slot
                </InputLabel>
                <MuiSelect
                  label="Select Parking Slot"
                  displayEmpty
                  value={form.parking_slot}
                  onChange={(e) => set("parking_slot", e.target.value)}
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {parkingSlots.map((s) => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
                </MuiSelect>
              </FormControl>

              {/* Entry Gate */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                  Select Entry Gate
                </InputLabel>
                <MuiSelect
                  label="Select Entry Gate"
                  displayEmpty
                  value={form.entry_gate}
                  onChange={(e) => set("entry_gate", e.target.value)}
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {entryGates.map((g) => <MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>)}
                </MuiSelect>
              </FormControl>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            className="bg-[#C72030] hover:bg-[#C72030]/90 text-white min-w-[100px]"
            onClick={handleSubmit}
            disabled={submitting || loadingOptions}
          >
            {submitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Submitting...</span> : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Filter Dialog ────────────────────────────────────────────────────────────

interface FilterOption {
  label: string;
  value: number | string;
}

interface FilterDialogProps {
  open: boolean;
  filters: FilterState;
  options: { buildings?: FilterOption[]; towers?: FilterOption[]; flats?: FilterOption[] } | null;
  loadingOptions?: boolean;
  onClose: () => void;
  onApply: (f: FilterState) => void;
  onReset: () => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  open, filters, options, loadingOptions, onClose, onApply, onReset,
}) => {
  const [local, setLocal] = useState<FilterState>(filters);

  // Sync local state whenever the dialog opens with latest active filters
  useEffect(() => {
    if (open) setLocal(filters);
  }, [open, filters]);

  const set = (key: keyof FilterState, val: string) =>
    setLocal((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Vehicle History</DialogTitle>
        </DialogHeader>

        {loadingOptions ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-[#C72030]" />
          </div>
        ) : (
        <div className="grid gap-4 py-2">
          {/* Building */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Building</label>
            <Select
              value={local.building || "__all__"}
              onValueChange={(v) => set("building", v === "__all__" ? "" : v)}
            >
              <SelectTrigger><SelectValue placeholder="All Buildings" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {options?.buildings?.map((b) => (
                  <SelectItem key={b.value} value={String(b.value)}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tower */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tower</label>
            <Select
              value={local.tower || "__all__"}
              onValueChange={(v) => set("tower", v === "__all__" ? "" : v)}
            >
              <SelectTrigger><SelectValue placeholder="All Towers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {options?.towers?.map((t) => (
                  <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flat */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Flat</label>
            <Select
              value={local.flat || "__all__"}
              onValueChange={(v) => set("flat", v === "__all__" ? "" : v)}
            >
              <SelectTrigger><SelectValue placeholder="All Flats" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {options?.flats?.map((f) => (
                  <SelectItem key={f.value} value={String(f.value)}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-gray-700">From Date</label>
              <input
                type="date"
                title="From Date"
                value={local.from_date}
                onChange={(e) => set("from_date", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-gray-700">To Date</label>
              <input
                type="date"
                title="To Date"
                value={local.to_date}
                onChange={(e) => set("to_date", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => { setLocal(defaultFilters); onReset(); }}
          >
            Reset
          </Button>
          <Button
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
            onClick={() => onApply(local)}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

interface FilterOptions {
  buildings: FilterOption[];
  towers: FilterOption[];
  flats: FilterOption[];
}

const SmartSecureVehiclesHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);

  // Fetch filter dropdown options once on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingFilterOptions(true);
      try {
        const res = await fetch(
          getFullUrl("/crm/admin/visitors_vehicle_history_filters.json"),
          { headers: { Authorization: getAuthHeader() } }
        );
        if (res.ok) {
          const json = await res.json();
          const d = json.data || {};
          setFilterOptions({
            buildings: (d.buildings || []).map((b: { id: number; name: string }) => ({ label: b.name, value: b.id })),
            towers:    (d.blocks    || []).map((b: { id: number; name: string }) => ({ label: b.name, value: b.id })),
            flats:     (d.flats     || []).map((f: { id: number; flat_no: string }) => ({ label: f.flat_no, value: f.id })),
          });
        }
      } catch { /* silently ignore — filters will stay empty */ }
      finally { setLoadingFilterOptions(false); }
    };
    loadFilterOptions();
  }, []);

  const { data: apiData, isLoading, isError, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["vehicle-history-list", currentPage, activeFilters],    queryFn: async () => {
      const qs = buildQueryString(currentPage, activeFilters);
      const res = await fetch(
        getFullUrl(`/crm/admin/visitors_vehicle_history.json?${qs}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      return res.json();
    },
    staleTime: 30000,
  });

  const rows = useMemo(() => apiData?.data ?? [], [apiData]);
  const pagination = apiData?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const totalCount = pagination?.total_count ?? 0;
  const perPage = pagination?.per_page ?? 20;

  const handleApplyFilter = (f: FilterState) => {
    setActiveFilters(f);
    setCurrentPage(1);
    setFilterOpen(false);
    toast.success("Filters applied");
  };

  const handleResetFilter = () => {
    setActiveFilters(defaultFilters);
    setCurrentPage(1);
  };

  // ── Export Handler ─────────────────────────────────────────────────────────

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilters.building)
        params.append("q[user_society_id_society_in][]", activeFilters.building);
      if (activeFilters.tower)
        params.append("q[user_society_user_flat_society_flat_society_block_id_in][]", activeFilters.tower);
      if (activeFilters.flat)
        params.append("q[user_society_user_flat_society_flat_id_in][]", activeFilters.flat);
      params.set(
        "q[date_range]",
        activeFilters.from_date && activeFilters.to_date
          ? `${toFilterDate(activeFilters.from_date)} - ${toFilterDate(activeFilters.to_date)}`
          : ""
      );
      params.set("format", "xlsx");

      const res = await fetch(
        getFullUrl(`/crm/admin/visitors_vehicle_history?${params.toString()}`),
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

  // ── Cell Renderer ──────────────────────────────────────────────────────────

  const renderCell = useCallback(
    (row: ApiVehicleHistory, columnKey: string, index: number) => {
      // Resolve name and mobile from host (user_society) or guest (gatekeeper)
      const name = row.user_society?.user_name || row.gatekeeper?.guest_name || "--";
      const mobile = row.user_society?.user_mobile || row.gatekeeper?.guest_number || "--";

      switch (columnKey) {
        case "sr_no":
          return (
            <span className="text-sm text-gray-500 font-medium">
              {(currentPage - 1) * perPage + index + 1}
            </span>
          );

        case "name":
          return <span className="font-medium text-gray-900">{name}</span>;

        case "mobile_number":
          return <span className="text-sm text-gray-700">{mobile}</span>;

        case "building":
          return <span className="text-sm text-gray-700">{row.user_society?.building_name || "--"}</span>;

        case "tower":
          return <span className="text-sm text-gray-700">{row.user_society?.block_no || "--"}</span>;

        case "flat":
          return <span className="text-sm text-gray-700">{row.user_society?.flat_no || "--"}</span>;

        case "purpose":
          return (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              {row.gatekeeper?.visit_purpose || "--"}
            </span>
          );

        case "slot_number":
          return <span className="text-sm text-gray-700">{row.parking_slot || "--"}</span>;

        case "in_time":
          return <span className="text-sm text-gray-600">{formatDateTime(row.in_time)}</span>;

        case "out_time":
          return <span className="text-sm text-gray-600">{formatDateTime(row.out_time)}</span>;

        default: {
          const val = (row as unknown as Record<string, unknown>)[columnKey];
          return val ? String(val) : "--";
        }
      }
    },
    [currentPage, perPage]
  );

  // ── Pagination ─────────────────────────────────────────────────────────────

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        totalPages <= 7 ||
        i === 1 ||
        i === totalPages ||
        Math.abs(i - currentPage) <= 1
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              className="cursor-pointer"
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (
        (i === 2 && currentPage > 4) ||
        (i === totalPages - 1 && currentPage < totalPages - 3)
      ) {
        items.push(
          <PaginationItem key={`e-${i}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return items;
  };

  // ── Error State ────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="p-6 text-center py-24">
        <p className="text-red-600 font-medium">Error loading vehicle history</p>
        <p className="text-sm text-gray-500 mt-1">{(error as Error)?.message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <EnhancedTable
        data={rows}
        columns={vehicleHistoryColumns}
        renderCell={renderCell}
        enableSearch={true}
        enableSelection={false}
        storageKey="vehicle-history-list-table"
        emptyMessage="No vehicle history available"
        searchPlaceholder="Search vehicle history..."
        hideTableExport={false}
        hideColumnsButton={false}
        enableExport={true}
        handleExport={handleExport}
        loading={isLoading}
        onFilterClick={() => setFilterOpen(true)}
        leftActions={
          <Button
            size="sm"
            className="bg-[#C72030] hover:bg-[#C72030]/90 text-white flex items-center gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        }
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-gray-500">
            Showing {(currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, totalCount)} of {totalCount} records
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Filter Dialog */}
      <FilterDialog
        open={filterOpen}
        filters={activeFilters}
        options={filterOptions}
        loadingOptions={loadingFilterOptions}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default SmartSecureVehiclesHistory;
