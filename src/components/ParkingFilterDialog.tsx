import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { X } from "lucide-react";

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

const filterMenuProps = {
  ...menuProps,
  PaperProps: {
    ...menuProps.PaperProps,
    style: {
      ...menuProps.PaperProps.style,
      maxHeight: 280,
      overflowY: "auto" as const,
      zIndex: 10050,
    },
    onWheel: (e: React.WheelEvent) => e.stopPropagation(),
  },
};

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

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(initialFilters);
      setVehicleNumberInput(initialFilters.vehicle_number_in?.[0] || "");
      fetchBlocks();
      if (initialFilters.society_flat_society_block_id_eq) {
        fetchFlats(initialFilters.society_flat_society_block_id_eq);
      } else {
        setFlats([]);
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
  };

  const flatLabel = (f: SocietyFlat) =>
    f.flat_str || (f.block_name && f.flat_no ? `${f.block_name} - ${f.flat_no}` : f.flat_no);

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-bold text-[hsl(var(--analytics-text))]">
            FILTER BY
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <FormControl fullWidth variant="outlined" disabled={loadingBlocks}>
              <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                Tower / Block
              </InputLabel>
              <MuiSelect
                value={localFilters.society_flat_society_block_id_eq || ""}
                onChange={(e) => handleTowerChange(e.target.value)}
                displayEmpty
                label="Tower / Block"
                sx={fieldStyles}
                MenuProps={filterMenuProps}
              >
                <MenuItem value="">
                  <em>{loadingBlocks ? "Loading..." : "Select Tower / Block"}</em>
                </MenuItem>
                {blocks.map((b) => (
                  <MenuItem key={b.id} value={b.id.toString()}>
                    {b.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            <FormControl
              fullWidth
              variant="outlined"
              disabled={!localFilters.society_flat_society_block_id_eq || loadingFlats}
            >
              <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                Flat
              </InputLabel>
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
                MenuProps={filterMenuProps}
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
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClear}
            className="!bg-white !text-[#C72030] !border !border-[#C72030]"
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="!bg-white !text-[#C72030] !border !border-[#C72030]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParkingFilterDialog;
