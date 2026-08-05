import React, { useState } from 'react';
import { Dialog, DialogContent, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';

interface BillingInvoicesFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (month: string) => void;
  selectedMonth?: string;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BillingInvoicesFilterModal: React.FC<BillingInvoicesFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  selectedMonth = 'January',
}) => {
  const [month, setMonth] = useState(selectedMonth);

  const handleApply = () => {
    onApply(month);
    onClose();
  };

  const handleReset = () => {
    setMonth(selectedMonth);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="md">
      <DialogContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-lg font-semibold">FILTER BY</h5>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Billing Period</InputLabel>
            <MuiSelect
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              displayEmpty
              label="Billing Period"
              sx={fieldStyles}
              MenuProps={menuProps}
            >
              {months.map((monthItem) => (
                <MenuItem key={monthItem} value={monthItem}>
                  {monthItem}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleApply}
            className="flex-1 text-white"
            style={{ backgroundColor: '#C72030' }}
          >
            Apply
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1"
          >
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingInvoicesFilterModal;
