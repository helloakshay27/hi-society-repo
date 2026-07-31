
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const CreateScheduleModal = ({ isOpen, onClose, onSubmit }: CreateScheduleModalProps) => {
  const [formData, setFormData] = useState({
    flat: '',
    category: '',
    subCategory: '',
    scheduleDate: '',
    paymentMethod: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between pb-4">
          <DialogTitle className="text-lg font-semibold">Create Schedule</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <X className="w-4 h-4 text-red-500" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Flat</InputLabel>
              <MuiSelect
                value={formData.flat}
                onChange={(e) => handleInputChange('flat', e.target.value)}
                displayEmpty
                label="Select Flat"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select</em></MenuItem>
                <MenuItem value="a-101">A-101</MenuItem>
                <MenuItem value="a-102">A-102</MenuItem>
                <MenuItem value="a-103">A-103</MenuItem>
                <MenuItem value="a-104">A-104</MenuItem>
              </MuiSelect>
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Category</InputLabel>
              <MuiSelect
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                displayEmpty
                label="Select Category"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Category</em></MenuItem>
                <MenuItem value="pest-control">Pest Control</MenuItem>
                <MenuItem value="deep-cleaning">Deep Cleaning</MenuItem>
                <MenuItem value="civil-mason">Civil & Mason Works</MenuItem>
                <MenuItem value="invisible-grill">Invisible Grill</MenuItem>
                <MenuItem value="mosquito-mesh">Mosquito Mesh</MenuItem>
              </MuiSelect>
            </FormControl>
          </div>

          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Sub Category</InputLabel>
            <MuiSelect
              value={formData.subCategory}
              onChange={(e) => handleInputChange('subCategory', e.target.value)}
              displayEmpty
              label="Select Sub Category"
              sx={fieldStyles}
              MenuProps={menuProps}
            >
              <MenuItem value=""><em>Select Sub Category</em></MenuItem>
              <MenuItem value="standard-cockroach">Standard Cockroach Control</MenuItem>
              <MenuItem value="4d-cockroach">4D Cockroach Control</MenuItem>
              <MenuItem value="bathroom-cleaning">Bathroom Cleaning</MenuItem>
              <MenuItem value="sofa-cleaning">Sofa Cleaning</MenuItem>
              <MenuItem value="grouting-tiles">Grouting Of Tiles</MenuItem>
              <MenuItem value="residential-apartment">Residential Apartment</MenuItem>
            </MuiSelect>
          </FormControl>

          <div>
            <Label className="text-sm font-medium text-gray-900 block mb-2">Schedule Visit</Label>
            <TextField
              label="Select Date"
              type="date"
              value={formData.scheduleDate}
              onChange={(e) => handleInputChange('scheduleDate', e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </div>

          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Payment method</InputLabel>
            <MuiSelect
              value={formData.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              displayEmpty
              label="Select Payment method"
              sx={fieldStyles}
              MenuProps={menuProps}
            >
              <MenuItem value=""><em>Select Payment method</em></MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="bank-transfer">Bank Transfer</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
            </MuiSelect>
          </FormControl>

          <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
            <strong>Disclaimer:</strong> The Services include the provision of the Platform that enables you to arrange and
            schedule different home-based services with independent third-party service provider of those
            services ("Service Professionals").
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleSubmit}
              className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
            >
              Pay {localStorage.getItem('currency')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
