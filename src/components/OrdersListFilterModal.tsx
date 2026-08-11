import { useEffect, useState } from "react";
import { Dialog, DialogContent, FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";

interface Option {
  value: string;
  label: string;
}

interface OrdersListFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: string[];
  initialPaymentStatus?: string[];
  initialOrderDate?: string;
  statusOptions: Option[];
  paymentStatusOptions: Option[];
  orderDateOptions: Option[];
  onApply: (data: { status: string[]; paymentStatus: string[]; orderDate: string }) => void;
}

export const OrdersListFilterModal: React.FC<OrdersListFilterModalProps> = ({
  open,
  onOpenChange,
  initialStatus = [],
  initialPaymentStatus = [],
  initialOrderDate = "last_30_days",
  statusOptions,
  paymentStatusOptions,
  orderDateOptions,
  onApply,
}) => {
  const [status, setStatus] = useState<string[]>(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState<string[]>(initialPaymentStatus);
  const [orderDate, setOrderDate] = useState(initialOrderDate);

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
      setPaymentStatus(initialPaymentStatus);
      setOrderDate(initialOrderDate);
    }
  }, [open, initialStatus, initialPaymentStatus, initialOrderDate]);

  const handleApply = () => {
    onApply({ status, paymentStatus, orderDate });
    onOpenChange(false);
  };

  const handleReset = () => {
    setStatus([]);
    setPaymentStatus([]);
    setOrderDate("");
    onApply({ status: [], paymentStatus: [], orderDate: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-lg font-semibold">FILTER BY</h5>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Status Filter</InputLabel>
            <MuiSelect
              multiple
              value={status}
              onChange={(e) => setStatus(e.target.value as string[])}
              displayEmpty
              label="Status Filter"
              sx={fieldStyles}
              MenuProps={menuProps}
              renderValue={(selected: string[]) =>
                selected.length
                  ? selected
                      .map((value) => statusOptions.find((o) => o.value === value)?.label || value)
                      .join(', ')
                  : <em>Select Status...</em>
              }
            >
              {statusOptions.filter((opt) => opt.value !== "").map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Payment Status</InputLabel>
            <MuiSelect
              multiple
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as string[])}
              displayEmpty
              label="Payment Status"
              sx={fieldStyles}
              MenuProps={menuProps}
              renderValue={(selected: string[]) =>
                selected.length
                  ? selected
                      .map((value) => paymentStatusOptions.find((o) => o.value === value)?.label || value)
                      .join(', ')
                  : <em>Select Payment Status...</em>
              }
            >
              {paymentStatusOptions.filter((opt) => opt.value !== "").map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Order Date</InputLabel>
            <MuiSelect
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value || "last_30_days")}
              displayEmpty
              label="Order Date"
              sx={fieldStyles}
              MenuProps={menuProps}
            >
              <MenuItem value=""><em>Select Date Range...</em></MenuItem>
              {orderDateOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleApply}
variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium"           >
            Apply
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
           className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
          >
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
