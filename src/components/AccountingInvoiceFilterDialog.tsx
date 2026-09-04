import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormControl, InputLabel, MenuItem, Select as MuiSelect, TextField } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { X } from "lucide-react";

export interface AccountingInvoiceFilters {
  tower?: string;
  billNumber?: string;
  unit?: string;
  paymentStatus?: string;
  publishStatus?: string;
}

interface AccountingInvoiceFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AccountingInvoiceFilters) => void;
  onResetFilters: () => void;
  currentFilters?: AccountingInvoiceFilters;
  towerOptions: string[];
  unitOptions: string[];
}

export const AccountingInvoiceFilterDialog: React.FC<AccountingInvoiceFilterDialogProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onResetFilters,
  currentFilters = {},
  towerOptions,
  unitOptions,
}) => {
  const [filters, setFilters] = useState<AccountingInvoiceFilters>(currentFilters);

  useEffect(() => {
    if (isOpen) setFilters(currentFilters);
  }, [isOpen, currentFilters]);

  const handleFilterChange = (key: keyof AccountingInvoiceFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    onResetFilters();
  };

  const renderSelectField = (
    label: string,
    placeholder: string,
    value: string,
    key: keyof AccountingInvoiceFilters,
    items: { label: string; value: string }[],
  ) => (
    <FormControl fullWidth variant="outlined">
      <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
        {label}
      </InputLabel>
      <MuiSelect
        value={value}
        onChange={(e) => handleFilterChange(key, e.target.value)}
        displayEmpty
        label={label}
        sx={fieldStyles}
        MenuProps={menuProps}
      >
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
        {items.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-bold text-[hsl(var(--analytics-text))]">
            FILTER BY
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {renderSelectField(
              "Select Tower",
              "All Towers",
              filters.tower || "",
              "tower",
              towerOptions.map((tower) => ({ label: tower, value: tower })),
            )}
            <TextField
              label="Bill Number Search"
              placeholder="Bill Number Search"
              value={filters.billNumber || ""}
              onChange={(e) => handleFilterChange("billNumber", e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            {renderSelectField(
              "Select Unit",
              "All Units",
              filters.unit || "",
              "unit",
              unitOptions.map((unit) => ({ label: unit, value: unit })),
            )}
            {renderSelectField(
              "Select Payment Status",
              "All",
              filters.paymentStatus || "",
              "paymentStatus",
              [
                { label: "Pending", value: "Pending" },
                { label: "Paid", value: "Paid" },
                { label: "Overdue", value: "Overdue" },
              ],
            )}
            {renderSelectField(
              "Select Publish Status",
              "All",
              filters.publishStatus || "",
              "publishStatus",
              [
                { label: "Yes", value: "Yes" },
                { label: "No", value: "No" },
              ],
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-[hsl(var(--analytics-text))] border-[hsl(var(--analytics-border))]"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#C72030] hover:bg-[#C72030]/90 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountingInvoiceFilterDialog;
