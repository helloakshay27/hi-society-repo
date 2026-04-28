import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ReactSelect from "react-select";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

const reactSelectStyles = {
  control: (base: object) => ({
    ...base,
    minHeight: "40px",
    border: "1px solid #d1d5db",
    boxShadow: "none",
    borderRadius: "4px",
    "&:hover": { border: "1px solid #cbd5e1" },
  }),
  option: (base: object, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? "#dbeafe" : state.isFocused ? "#f0f9ff" : "white",
    color: state.isSelected ? "#1e40af" : "#374151",
  }),
};

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

  const selectedBlock = blocks.find(
    (b) => b.id.toString() === localFilters.society_flat_society_block_id_eq
  );
  const selectedFlat = flats.find(
    (f) => f.id.toString() === localFilters.society_flat_id_eq
  );

  const flatLabel = (f: SocietyFlat) =>
    f.flat_str || (f.block_name && f.flat_no ? `${f.block_name} - ${f.flat_no}` : f.flat_no);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Filter Parking Slots</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tower / Block */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tower / Block</Label>
            <ReactSelect
              options={blocks.map((b) => ({ value: b.id.toString(), label: b.name }))}
              value={selectedBlock ? { value: selectedBlock.id.toString(), label: selectedBlock.name } : null}
              onChange={(sel) => handleTowerChange(sel ? sel.value : "")}
              placeholder={loadingBlocks ? "Loading..." : "Select Tower / Block"}
              isLoading={loadingBlocks}
              isClearable
              styles={reactSelectStyles}
            />
          </div>

          {/* Flat */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Flat</Label>
            <ReactSelect
              options={flats.map((f) => ({ value: f.id.toString(), label: flatLabel(f) }))}
              value={
                selectedFlat
                  ? { value: selectedFlat.id.toString(), label: flatLabel(selectedFlat) }
                  : null
              }
              onChange={(sel) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  society_flat_id_eq: sel ? sel.value : undefined,
                }))
              }
              placeholder={
                loadingFlats
                  ? "Loading..."
                  : !localFilters.society_flat_society_block_id_eq
                  ? "Select tower first"
                  : "Select Flat"
              }
              isLoading={loadingFlats}
              isDisabled={!localFilters.society_flat_society_block_id_eq || loadingFlats}
              isClearable
              styles={reactSelectStyles}
            />
          </div>

          {/* Slot Name */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Slot Name</Label>
            <Input
              placeholder="Search by slot name..."
              value={localFilters.parking_slot_slot_name_cont || ""}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  parking_slot_slot_name_cont: e.target.value || undefined,
                }))
              }
              className="h-10 border-gray-300 focus:border-gray-500 focus:ring-0"
              style={{ borderRadius: "4px" }}
            />
          </div>

          {/* Sticker Number */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Sticker Number</Label>
            <Input
              placeholder="Search by sticker number..."
              value={localFilters.parking_slot_sticker_number_cont || ""}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  parking_slot_sticker_number_cont: e.target.value || undefined,
                }))
              }
              className="h-10 border-gray-300 focus:border-gray-500 focus:ring-0"
              style={{ borderRadius: "4px" }}
            />
          </div>

          {/* Vehicle Number */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Vehicle Number</Label>
            <Input
              placeholder="Enter vehicle number..."
              value={vehicleNumberInput}
              onChange={(e) => setVehicleNumberInput(e.target.value)}
              className="h-10 border-gray-300 focus:border-gray-500 focus:ring-0"
              style={{ borderRadius: "4px" }}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClear}>
            Clear Filters
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
