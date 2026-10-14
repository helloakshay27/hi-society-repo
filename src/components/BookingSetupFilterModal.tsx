
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  createTheme,
  ThemeProvider,
  IconButton,
  Typography,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button as MuiButton
} from '@mui/material';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface BookingSetupFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: {
    fromDate: string;
    toDate: string;
    facilityType: string;
    bookingMethod: string;
  }) => void;
}

const INK = '#1A1A18';

const muiTheme = createTheme({
  palette: {
    primary: {
      main: INK,
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          height: '44px',
          borderRadius: '12px',
          backgroundColor: '#FFFFFF',
          fontSize: '13.5px',
          fontWeight: 500,
          color: INK,
          transition: 'box-shadow 0.16s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(26, 26, 24, 0.08)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(26, 26, 24, 0.28)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: INK,
            borderWidth: '1px',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 4px rgba(26, 26, 24, 0.1)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: 'rgba(26, 26, 24, 0.45)',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(26, 26, 24, 0.68)',
          fontWeight: 600,
          fontSize: '14px',
          '&.Mui-focused': {
            color: 'rgba(26, 26, 24, 0.68)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.MuiMenu-paper, &.MuiPopover-paper': {
            marginTop: '6px',
            borderRadius: '12px',
            border: '1px solid rgba(26, 26, 24, 0.09)',
            boxShadow: '0 12px 32px rgba(26, 26, 24, 0.08)',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        list: {
          padding: '6px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: '38px',
          borderRadius: '8px',
          fontSize: '13.5px',
          fontWeight: 500,
          color: INK,
          '&:hover': {
            backgroundColor: '#F5F4F0',
          },
          '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
            backgroundColor: '#F5F4F0',
            fontWeight: 600,
          },
        },
      },
    },
  },
});

export const BookingSetupFilterModal: React.FC<BookingSetupFilterModalProps> = ({
  open,
  onOpenChange,
  onApply,
}) => {
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    facilityType: '',
    bookingMethod: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters = {
      fromDate: '',
      toDate: '',
      facilityType: '',
      bookingMethod: ''
    };
    setFilters(resetFilters);
    onApply(resetFilters);
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <Dialog
        open={open}
        onClose={() => onOpenChange(false)}
        fullWidth
        PaperProps={{
          style: {
            maxWidth: '440px',
            borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(26, 26, 24, 0.12)',
          }
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Box>
            <div className="flex flex-row items-center justify-between space-y-0 mb-5">
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: INK, textTransform: 'uppercase', letterSpacing: '0.025em' }}>Filter By</Typography>
              <IconButton
                aria-label="close"
                onClick={() => onOpenChange(false)}
                sx={{
                  color: 'rgba(26, 26, 24, 0.55)',
                  width: 28,
                  height: 28,
                  p: 0,
                  borderRadius: '6px',
                  '&:hover': { backgroundColor: '#F5F4F0' },
                }}
              >
                <X size={16} />
              </IconButton>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="From Date"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleInputChange('fromDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleInputChange('toDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormControl fullWidth>
                  <InputLabel id="facility-type-label" shrink>Facility Type</InputLabel>
                  <Select
                    labelId="facility-type-label"
                    value={filters.facilityType}
                    label="Facility Type"
                    onChange={(e) => handleInputChange('facilityType', e.target.value)}
                    displayEmpty
                    notched
                    renderValue={(selected) =>
                      selected
                        ? selected === 'bookable' ? 'Bookable' : 'Request'
                        : <span style={{ color: 'rgba(26, 26, 24, 0.3)' }}>Select Facility Type</span>
                    }
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="bookable">Bookable</MenuItem>
                    <MenuItem value="request">Request</MenuItem>
                  </Select>
                </FormControl>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  className="btn-cancel h-9 px-5 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
                  variant="outline"
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  className="btn-primary h-9 px-5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleApply}
                >
                  Apply
                </Button>
            </div>
          </Box>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};
