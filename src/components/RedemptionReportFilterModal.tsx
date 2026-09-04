import { useEffect, useState } from "react";
import { Dialog, DialogContent, TextField } from "@mui/material";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const fieldStyles = {
  '& .MuiInputBase-input': {
    padding: '10px 14px',
  },
};

interface RedemptionReportFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  onApply: (data: { startDate: string; endDate: string }) => void;
}

export const RedemptionReportFilterModal: React.FC<RedemptionReportFilterModalProps> = ({
  open,
  onOpenChange,
  initialStartDate = "",
  initialEndDate = "",
  onApply,
}) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  useEffect(() => {
    if (open) {
      setStartDate(initialStartDate);
      setEndDate(initialEndDate);
    }
  }, [open, initialStartDate, initialEndDate]);

  const handleApply = () => {
    onApply({ startDate, endDate });
    onOpenChange(false);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    onApply({ startDate: "", endDate: "" });
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
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            variant="outlined"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            placeholder="DD/MM/YYYY"
            inputProps={{ placeholder: 'DD/MM/YYYY' }}
            sx={fieldStyles}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            variant="outlined"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            placeholder="DD/MM/YYYY"
            inputProps={{ placeholder: 'DD/MM/YYYY' }}
            sx={fieldStyles}
          />
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
  className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"          >
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
