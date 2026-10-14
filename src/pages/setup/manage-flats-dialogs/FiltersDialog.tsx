import React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormControl as MuiFormControl, InputLabel, Select as MuiSelect, MenuItem, ListItemText } from '@mui/material';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';

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
  // Map options to { label, value }
  const towerSelectOptions = towerOptions.map(t => ({ label: t.name, value: t.id.toString() }));
  const flatTypeSelectOptions = flatTypeOptions.map(ft => ({ label: ft.name, value: ft.id.toString() }));

  const statusOptions = [
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ];

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] p-0 overflow-hidden bg-white rounded-2xl border border-[rgba(26,26,24,.09)] focus:outline-none focus-visible:outline-none">
        <DialogHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0 border-b border-[rgba(26,26,24,.09)]">
          <DialogTitle className="text-lg font-semibold text-[#1A1A18]">Advance Filter</DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex items-center justify-center w-8 h-8 rounded-md text-[rgba(26,26,24,.68)] hover:bg-[#F5F4F0] hover:text-[#1A1A18] transition-colors focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* Select Tower */}
            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Tower</InputLabel>
              <MuiSelect
                multiple
                value={filters.tower}
                onChange={(e) => onFilterChange("tower", e.target.value)}
                displayEmpty
                label="Select Tower"
                sx={fieldStyles}
                MenuProps={menuProps}
                renderValue={(selected: string[]) =>
                  selected.length
                    ? towerSelectOptions.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
                    : <span className="text-gray-400">Select Tower</span>
                }
              >
                {towerSelectOptions.length === 0 ? (
                  <MenuItem disabled>
                    <ListItemText primary="No Tower Found" />
                  </MenuItem>
                ) : (
                  towerSelectOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <ListItemText primary={opt.label} />
                    </MenuItem>
                  ))
                )}
              </MuiSelect>
            </MuiFormControl>

            {/* Select Flat */}
            <MuiFormControl fullWidth variant="outlined" disabled={filters.tower.length === 0}>
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Flat</InputLabel>
              <MuiSelect
                multiple
                value={filters.flat}
                onChange={(e) => onFilterChange("flat", e.target.value)}
                displayEmpty
                label="Select Flat"
                sx={fieldStyles}
                MenuProps={menuProps}
                renderValue={(selected: string[]) =>
                  selected.length
                    ? flatOptions.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
                    : <span className="text-gray-400">Select Flat</span>
                }
              >
                {flatOptions.length === 0 ? (
                  <MenuItem disabled>
                    <ListItemText primary={filters.tower.length === 0 ? "Select a tower first" : "No Flat Found"} />
                  </MenuItem>
                ) : (
                  flatOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <ListItemText primary={opt.label} />
                    </MenuItem>
                  ))
                )}
              </MuiSelect>
            </MuiFormControl>

            {/* Select Flat Type */}
            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Flat Type</InputLabel>
              <MuiSelect
                multiple
                value={filters.flatType}
                onChange={(e) => onFilterChange("flatType", e.target.value)}
                displayEmpty
                label="Select Flat Type"
                sx={fieldStyles}
                MenuProps={menuProps}
                renderValue={(selected: string[]) =>
                  selected.length
                    ? flatTypeSelectOptions.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
                    : <span className="text-gray-400">Select Flat Type</span>
                }
              >
                {flatTypeSelectOptions.length === 0 ? (
                  <MenuItem disabled>
                    <ListItemText primary="No Flat Type Found" />
                  </MenuItem>
                ) : (
                  flatTypeSelectOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <ListItemText primary={opt.label} />
                    </MenuItem>
                  ))
                )}
              </MuiSelect>
            </MuiFormControl>

            {/* Select Status */}
            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Status</InputLabel>
              <MuiSelect
                multiple
                value={filters.status}
                onChange={(e) => onFilterChange("status", e.target.value)}
                displayEmpty
                label="Select Status"
                sx={fieldStyles}
                MenuProps={menuProps}
                renderValue={(selected: string[]) =>
                  selected.length
                    ? statusOptions.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
                    : <span className="text-gray-400">Select Status</span>
                }
              >
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <ListItemText primary={opt.label} />
                  </MenuItem>
                ))}
              </MuiSelect>
            </MuiFormControl>

            {/* Select Occupancy */}
            <MuiFormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Occupancy</InputLabel>
              <MuiSelect
                value={filters.occupancy}
                onChange={(e) => onFilterChange("occupancy", e.target.value)}
                displayEmpty
                label="Select Occupancy"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><span className="text-gray-400">Select Occupancy</span></MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </MuiSelect>
            </MuiFormControl>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onApply}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
            >
              Apply
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
