import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { X } from "lucide-react";

// ── Static options ────────────────────────────────────────────────────────────
const NOTICE_TYPE_OPTIONS = [
  { value: "0", label: "General" },
  { value: "1", label: "Personal" },
];

const STATUS_OPTIONS = [
  { value: "1", label: "Published" },
  { value: "2", label: "Disabled" },
  { value: "0", label: "Rejected" },
];

export interface NoticeFilters {
  shared_in: string[];
  date_range: string;
  publish_in: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: NoticeFilters) => void;
}

const empty: NoticeFilters = {
  shared_in: [],
  date_range: "",
  publish_in: [],
};

// ── Component ─────────────────────────────────────────────────────────────────
export const NoticeFilterDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyFilters,
}) => {
  const [selectedNoticeType, setSelectedNoticeType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSelectedNoticeType("");
    setSelectedStatus("");
    setDateFrom("");
    setDateTo("");
    onApplyFilters(empty);
    onClose();
  };

  // ── Apply ─────────────────────────────────────────────────────────────────
  const handleApply = () => {
    const filters: NoticeFilters = { ...empty };

    if (selectedNoticeType !== "") {
      filters.shared_in = [selectedNoticeType];
    }
    if (dateFrom && dateTo) {
      // Format: DD/MM/YYYY - DD/MM/YYYY  (adjust if your API needs another format)
      const fmt = (s: string) => {
        const [y, m, d] = s.split("-");
        return `${d}/${m}/${y}`;
      };
      filters.date_range = `${fmt(dateFrom)} - ${fmt(dateTo)}`;
    }
    if (selectedStatus !== "") {
      filters.publish_in = [selectedStatus];
    }

    onApplyFilters(filters);
    onClose();
  };

  const hasFilters =
    selectedNoticeType || selectedStatus || dateFrom || dateTo;

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[440px] bg-white rounded-2xl shadow-xl p-6 gap-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <DialogTitle className="text-base font-semibold text-gray-900 tracking-wide uppercase">
            Filter By
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 rounded-md hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </Button>
        </div>

        {/* Body */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Notice Type */}
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Notice Type</InputLabel>
              <MuiSelect
                value={selectedNoticeType}
                onChange={(e) => setSelectedNoticeType(e.target.value)}
                displayEmpty
                label="Notice Type"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Type</em></MenuItem>
                <MenuItem value="__all__">All Types</MenuItem>
                {NOTICE_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Status */}
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Status</InputLabel>
              <MuiSelect
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                displayEmpty
                label="Status"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Status</em></MenuItem>
                <MenuItem value="__all__">All Statuses</MenuItem>
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              inputProps={{ max: dateTo || undefined }}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <TextField
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              inputProps={{ min: dateFrom || undefined }}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="h-9 px-5 bg-white border border-brand text-brand text-sm"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="h-9 px-5 bg-[#C72030] hover:bg-[#a01828] text-white text-sm"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
