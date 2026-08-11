import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

export interface ParkingFilters {
  society_flat_society_block_id_eq?: string;
  society_flat_id_eq?: string;
  parking_slot_slot_name_cont?: string;
  parking_slot_sticker_number_cont?: string;
  vehicle_number_in?: string[];
}

interface SocietyBlock {
  id: number;
  name: string;
}

interface SocietyFlat {
  id: number;
  flat_no: string;
  block_name: string;
  flat_str?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ParkingFilters) => void;
  initialFilters?: ParkingFilters;
}

export const ParkingFilterDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters = {},
}) => {
  const [localFilters, setLocalFilters] = useState<ParkingFilters>(initialFilters);
  const [vehicleNumberInput, setVehicleNumberInput] = useState(
    initialFilters.vehicle_number_in?.[0] || ""
  );
  const [blocks, setBlocks] = useState<SocietyBlock[]>([]);
  const [flats, setFlats] = useState<SocietyFlat[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);

  const societyId =
    localStorage.getItem("selectedSocietyId") ||
    localStorage.getItem("society_id") ||
    localStorage.getItem("org_id") ||
    "";

  // Sync state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(initialFilters);
      setVehicleNumberInput(initialFilters.vehicle_number_in?.[0] || "");
      fetchBlocks();
      if (initialFilters.society_flat_society_block_id_eq) {
        fetchFlats(initialFilters.society_flat_society_block_id_eq);
      }
    }
  }, [isOpen]);

  const fetchBlocks = async () => {
    if (!societyId) return;
    setLoadingBlocks(true);
    try {
      const res = await fetch(
        getFullUrl(`/get_society_blocks.json?society_id=${societyId}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.society_blocks || []);
      }
    } finally {
      setLoadingBlocks(false);
    }
  };

  const fetchFlats = async (blockId: string) => {
    if (!blockId || !societyId) {
      setFlats([]);
      return;
    }
    setLoadingFlats(true);
    try {
      const res = await fetch(
        getFullUrl(`/get_society_flats.json?society_id=${societyId}&society_block_id=${blockId}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (res.ok) {
        const data = await res.json();
        setFlats(data.society_flats || []);
      }
    } finally {
      setLoadingFlats(false);
    }
  };

  const handleTowerChange = (blockId: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      society_flat_society_block_id_eq: blockId || undefined,
      society_flat_id_eq: undefined,
    }));
    setFlats([]);
    if (blockId) fetchFlats(blockId);
  };

  const handleApply = () => {
    const finalFilters: ParkingFilters = { ...localFilters };
    if (vehicleNumberInput.trim()) {
      finalFilters.vehicle_number_in = [vehicleNumberInput.trim()];
    } else {
      delete finalFilters.vehicle_number_in;
    }
    onApplyFilters(finalFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    setVehicleNumberInput("");
    setFlats([]);
    onApplyFilters({});
    onClose();
  };

  const flatLabel = (f: SocietyFlat) =>
    f.flat_str || (f.block_name && f.flat_no ? `${f.block_name} - ${f.flat_no}` : f.flat_no);

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Filter Parking Slots</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tower / Block */}
          <FormControl fullWidth variant="outlined" disabled={loadingBlocks}>
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Tower / Block</InputLabel>
            <MuiSelect
              value={localFilters.society_flat_society_block_id_eq || ""}
              onChange={(e) => handleTowerChange(e.target.value)}
              displayEmpty
              label="Tower / Block"
              sx={fieldStyles}
              MenuProps={menuProps}
            >
              <MenuItem value=""><em>{loadingBlocks ? "Loading..." : "Select Tower / Block"}</em></MenuItem>
              {blocks.map((b) => (
                <MenuItem key={b.id} value={b.id.toString()}>
                  {b.name}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          {/* Flat */}
          <FormControl
            fullWidth
            variant="outlined"
            disabled={!localFilters.society_flat_society_block_id_eq || loadingFlats}
          >
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Flat</InputLabel>
            <MuiSelect
              value={localFilters.society_flat_id_eq || ""}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  society_flat_id_eq: e.target.value || undefined,
                }))
              }
              displayEmpty
              label="Flat"
              sx={fieldStyles}
              MenuProps={menuProps}
            >
              <MenuItem value="">
                <em>
                  {loadingFlats
                    ? "Loading..."
                    : !localFilters.society_flat_society_block_id_eq
                    ? "Select tower first"
                    : "Select Flat"}
                </em>
              </MenuItem>
              {flats.map((f) => (
                <MenuItem key={f.id} value={f.id.toString()}>
                  {flatLabel(f)}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          {/* Slot Name */}
          <TextField
            label="Slot Name"
            placeholder="Search by slot name..."
            value={localFilters.parking_slot_slot_name_cont || ""}
            onChange={(e) =>
              setLocalFilters((prev) => ({
                ...prev,
                parking_slot_slot_name_cont: e.target.value || undefined,
              }))
            }
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />

          {/* Sticker Number */}
          <TextField
            label="Sticker Number"
            placeholder="Search by sticker number..."
            value={localFilters.parking_slot_sticker_number_cont || ""}
            onChange={(e) =>
              setLocalFilters((prev) => ({
                ...prev,
                parking_slot_sticker_number_cont: e.target.value || undefined,
              }))
            }
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />

          {/* Vehicle Number */}
          <TextField
            label="Vehicle Number"
            placeholder="Enter vehicle number..."
            value={vehicleNumberInput}
            onChange={(e) => setVehicleNumberInput(e.target.value)}
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
          />
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClear}>
            Clear Filters
          </Button>
          <div className="flex gap-2">
            <Button  className="btn-cancel h-9 px-4 text-sm font-medium !bg-white border border-[#da7756] text-[#da7756] " onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              variant="ghost"
              className="btn-primary h-9 px-4 text-sm font-medium"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
