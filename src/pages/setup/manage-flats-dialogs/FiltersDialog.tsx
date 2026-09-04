import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <DialogContent className="max-w-[700px] p-0 overflow-hidden bg-white">
        <DialogHeader className="p-4 flex flex-row items-center justify-between">
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
                    : <em>Select Tower</em>
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
                    : <em>Select Flat</em>
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
                    : <em>Select Flat Type</em>
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
                    : <em>Select Status</em>
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
                <MenuItem value=""><em>Select Occupancy</em></MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </MuiSelect>
            </MuiFormControl>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-4">
            <Button
              onClick={onReset}
className="px-6 sm:px-8 w-full sm:w-auto !bg-white border !border-[#da7756] !text-[#da7756]   h-10"              >
              Reset
            </Button>
            <Button
              onClick={onApply}
              className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
