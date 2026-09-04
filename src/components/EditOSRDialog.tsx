
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';

interface EditOSRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  osrDetails: any;
  onSubmit: (data: any) => void;
}

export const EditOSRDialog = ({ open, onOpenChange, osrDetails, onSubmit }: EditOSRDialogProps) => {
  const [status, setStatus] = useState(osrDetails?.status || '');
  const [assignedTo, setAssignedTo] = useState(osrDetails?.assignedTo || '');
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    onSubmit({
      status,
      assignedTo,
      comment
    });
    setComment('');
  };

  return (
    <Dialog open={open} modal={false} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between pb-0">
          <DialogTitle className="text-lg font-semibold">Edit Details</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Status</InputLabel>
            <MuiSelect
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              displayEmpty
              label="Status"
              sx={fieldStyles}
              MenuProps={menuProps}
            >
              <MenuItem value=""><em>Select Status</em></MenuItem>
              <MenuItem value="Work Pending">Work Pending</MenuItem>
              <MenuItem value="Payment Pending">Payment Pending</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </MuiSelect>
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Assigned to</InputLabel>
            <MuiSelect
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              displayEmpty
              label="Assigned to"
              sx={fieldStyles}
              MenuProps={menuProps}
            >
              <MenuItem value=""><em>Select Assignee</em></MenuItem>
              <MenuItem value="Test Test">Test Test</MenuItem>
              <MenuItem value="John Doe">John Doe</MenuItem>
              <MenuItem value="Jane Smith">Jane Smith</MenuItem>
            </MuiSelect>
          </FormControl>

          <TextField
            label="Comment"
            placeholder="Message"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleSubmit}
            className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
