import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import MultiSelectBox from "@/components/ui/multi-selector";

interface FiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    tower: string[];
    flat: string[];
    flatType: string[];
    status: string[];
    occupancy: string;
  };
  onFilterChange: (field: string, value: any) => void;
  onApply: () => void;
  onReset: () => void;
  towerOptions: { id: number; name: string }[];
  flatTypeOptions: { id: number; name: string }[];
  flatOptions: { label: string; value: string }[];
}

export const FiltersDialog: React.FC<FiltersDialogProps> = ({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  onApply,
  onReset,
  towerOptions,
  flatTypeOptions,
  flatOptions,
}) => {
  // Map options to MultiSelectBox format { label, value }
  const towerSelectOptions = towerOptions.map(t => ({ label: t.name, value: t.id.toString() }));
  const flatTypeSelectOptions = flatTypeOptions.map(ft => ({ label: ft.name, value: ft.id.toString() }));

  const statusOptions = [
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] p-0 overflow-hidden bg-white">
        <DialogHeader className="bg-[#EAEAEA] p-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold">Advance Filter</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* Select Tower */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Select Tower
              </Label>
              <MultiSelectBox
                options={towerSelectOptions}
                value={filters.tower}
                onChange={(value) => onFilterChange("tower", value)}
                placeholder="Select Tower"
              />
            </div>

            {/* Select Flat */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Select Flat
              </Label>
              <MultiSelectBox
                options={flatOptions}
                value={filters.flat}
                onChange={(value) => onFilterChange("flat", value)}
                placeholder="Select Flat"
                disabled={filters.tower.length === 0}
              />
            </div>

            {/* Select Flat Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Select Flat Type
              </Label>
              <MultiSelectBox
                options={flatTypeSelectOptions}
                value={filters.flatType}
                onChange={(value) => onFilterChange("flatType", value)}
                placeholder="Select Flat Type"
              />
            </div>

            {/* Select Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Select Status
              </Label>
              <MultiSelectBox
                options={statusOptions}
                value={filters.status}
                onChange={(value) => onFilterChange("status", value)}
                placeholder="Select Status"
              />
            </div>

            {/* Select Occupancy */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Select Occupancy
              </Label>
              <Select
                value={filters.occupancy}
                onValueChange={(value) => onFilterChange("occupancy", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Occupancy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-4">
            <Button
              onClick={onReset}
              className="px-8 py-2 bg-[#00A65A] hover:bg-[#008d4c] text-white"
            >
              Reset
            </Button>
            <Button
              onClick={onApply}
              className="px-8 py-2 bg-[#00A65A] hover:bg-[#008d4c] text-white"
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
