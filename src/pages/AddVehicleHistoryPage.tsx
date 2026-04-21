import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem, RadioGroup, FormControlLabel, Radio, FormLabel } from "@mui/material";
import { toast } from "sonner";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

// ─── Field style (matches AddStaffPage) ──────────────────────────────────────

const fieldStyles = {
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#ddd" },
    "&:hover fieldset": { borderColor: "#C72030" },
    "&.Mui-focused fieldset": { borderColor: "#C72030" },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": { color: "#C72030" },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface DropdownOption {
  id: number | string;
  name: string;
}

interface FormState {
  vehicle_type: "host" | "guest";
  host_name: string;
  guest_name: string;
  vehicle_number: string;
  parking_slot: string;
  entry_gate: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddVehicleHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    vehicle_type: "host",
    host_name: "",
    guest_name: "",
    vehicle_number: "",
    parking_slot: "",
    entry_gate: "",
  });

  const [hosts, setHosts] = useState<DropdownOption[]>([]);
  const [guests, setGuests] = useState<DropdownOption[]>([]);
  const [parkingSlots, setParkingSlots] = useState<DropdownOption[]>([]);
  const [entryGates, setEntryGates] = useState<DropdownOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load dropdown options on mount
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [filtersRes] = await Promise.all([
          fetch(getFullUrl("/crm/admin/vehicle_histories/new.json"), {
            headers: { Authorization: getAuthHeader() },
          }),
        ]);
        if (filtersRes.ok) {
          const data = await filtersRes.json();
          setHosts(data.hosts || []);
          setGuests(data.guests || []);
          setParkingSlots(data.parking_slots || []);
          setEntryGates(data.entry_gates || []);
        }
      } catch {
        // Silently ignore — fields will remain empty; user can still type
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.vehicle_number.trim()) {
      toast.error("Vehicle Number is required");
      return;
    }
    if (form.vehicle_type === "host" && !form.host_name) {
      toast.error("Host Name is required");
      return;
    }
    if (form.vehicle_type === "guest" && !form.guest_name) {
      toast.error("Guest Name is required");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("vehicle_history[vehicle_type]", form.vehicle_type);
      formData.append("vehicle_history[vehicle_number]", form.vehicle_number.toUpperCase());
      if (form.vehicle_type === "host" && form.host_name) {
        formData.append("vehicle_history[host_id]", form.host_name);
      }
      if (form.vehicle_type === "guest" && form.guest_name) {
        formData.append("vehicle_history[guest_id]", form.guest_name);
      }
      if (form.parking_slot) {
        formData.append("vehicle_history[parking_slot_id]", form.parking_slot);
      }
      if (form.entry_gate) {
        formData.append("vehicle_history[entry_gate_id]", form.entry_gate);
      }

      const res = await fetch(getFullUrl("/crm/admin/vehicle_histories.json"), {
        method: "POST",
        headers: { Authorization: getAuthHeader() },
        body: formData,
      });

      if (res.ok) {
        toast.success("Vehicle added successfully!");
        navigate("/smartsecure/vehicles/history");
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg =
          errData?.errors?.join(", ") ||
          errData?.message ||
          "Failed to add vehicle";
        toast.error(msg);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Add Vehicle</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Vehicle History &rsaquo; Add Vehicle
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-base font-medium text-gray-800">Vehicle Details</h2>
          </div>

          {loadingOptions && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#C72030]" />
            </div>
          )}

          {!loadingOptions && (
            <div className="px-6 py-6 space-y-6">
              {/* Type (Host / Guest) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <FormLabel
                  component="legend"
                  className="text-sm font-medium text-gray-700 col-span-1"
                  sx={{ color: "#374151", fontWeight: 500, fontSize: "0.875rem" }}
                >
                  Type
                </FormLabel>
                <div className="col-span-3">
                  <RadioGroup
                    row
                    value={form.vehicle_type}
                    onChange={(e) =>
                      set("vehicle_type", e.target.value as "host" | "guest")
                    }
                  >
                    <FormControlLabel
                      value="host"
                      control={
                        <Radio
                          sx={{
                            "&.Mui-checked": { color: "#1a73e8" },
                          }}
                        />
                      }
                      label="Host"
                    />
                    <FormControlLabel
                      value="guest"
                      control={
                        <Radio
                          sx={{
                            "&.Mui-checked": { color: "#1a73e8" },
                          }}
                        />
                      }
                      label="Guest"
                    />
                  </RadioGroup>
                </div>
              </div>

              {/* Host Name (shown when type = host) */}
              {form.vehicle_type === "host" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 col-span-1">
                    Host Name <span className="text-red-500">*</span>
                  </label>
                  <div className="col-span-3">
                    <FormControl fullWidth sx={fieldStyles} size="small">
                      <InputLabel>Select Host Name</InputLabel>
                      <MuiSelect
                        value={form.host_name}
                        label="Select Host Name"
                        onChange={(e) => set("host_name", e.target.value)}
                        MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                      >
                        {hosts.length === 0 ? (
                          <MenuItem disabled value="">
                            No hosts available
                          </MenuItem>
                        ) : (
                          hosts.map((h) => (
                            <MenuItem key={h.id} value={String(h.id)}>
                              {h.name}
                            </MenuItem>
                          ))
                        )}
                      </MuiSelect>
                    </FormControl>
                  </div>
                </div>
              )}

              {/* Guest Name (shown when type = guest) */}
              {form.vehicle_type === "guest" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 col-span-1">
                    Guest Name <span className="text-red-500">*</span>
                  </label>
                  <div className="col-span-3">
                    <FormControl fullWidth sx={fieldStyles} size="small">
                      <InputLabel>Select Guest Name</InputLabel>
                      <MuiSelect
                        value={form.guest_name}
                        label="Select Guest Name"
                        onChange={(e) => set("guest_name", e.target.value)}
                        MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                      >
                        {guests.length === 0 ? (
                          <MenuItem disabled value="">
                            No guests available
                          </MenuItem>
                        ) : (
                          guests.map((g) => (
                            <MenuItem key={g.id} value={String(g.id)}>
                              {g.name}
                            </MenuItem>
                          ))
                        )}
                      </MuiSelect>
                    </FormControl>
                  </div>
                </div>
              )}

              {/* Vehicle Number */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-gray-700 col-span-1">
                  Vehicle Number <span className="text-red-500">*</span>
                </label>
                <div className="col-span-3">
                  <TextField
                    fullWidth
                    size="small"
                    label="Vehicle Number"
                    placeholder="Vehicle Number"
                    value={form.vehicle_number}
                    onChange={(e) =>
                      set("vehicle_number", e.target.value.toUpperCase())
                    }
                    inputProps={{ maxLength: 20 }}
                    sx={fieldStyles}
                  />
                </div>
              </div>

              {/* Parking Slot */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-gray-700 col-span-1">
                  Parking Slot
                </label>
                <div className="col-span-3">
                  <FormControl fullWidth sx={fieldStyles} size="small">
                    <InputLabel>Select Parking Slot</InputLabel>
                    <MuiSelect
                      value={form.parking_slot}
                      label="Select Parking Slot"
                      onChange={(e) => set("parking_slot", e.target.value)}
                      MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {parkingSlots.map((s) => (
                        <MenuItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                </div>
              </div>

              {/* Entry Gate */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-gray-700 col-span-1">
                  Entry Gate
                </label>
                <div className="col-span-3">
                  <FormControl fullWidth sx={fieldStyles} size="small">
                    <InputLabel>Select Entry Gate</InputLabel>
                    <MuiSelect
                      value={form.entry_gate}
                      label="Select Entry Gate"
                      onChange={(e) => set("entry_gate", e.target.value)}
                      MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {entryGates.map((g) => (
                        <MenuItem key={g.id} value={String(g.id)}>
                          {g.name}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#C72030] hover:bg-[#C72030]/90 text-white min-w-[100px]"
              onClick={handleSubmit}
              disabled={submitting || loadingOptions}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleHistoryPage;
