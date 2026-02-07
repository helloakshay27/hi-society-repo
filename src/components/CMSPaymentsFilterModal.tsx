
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    IconButton,
    FormControl,
    Select,
    MenuItem,
    TextField,
    InputLabel,
    createTheme,
    ThemeProvider,
} from '@mui/material';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface CMSPaymentsFilterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApply: (filters: any) => void;
}

const muiTheme = createTheme({
    palette: {
        primary: {
            main: '#C72030',
        },
    },
    components: {
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        '& fieldset': {
                            borderColor: '#E0E0E0',
                        },
                        '&:hover fieldset': {
                            borderColor: '#1A1A1A',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#C72030',
                        },
                    },
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    height: '40px',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1A1A1A',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#C72030',
                    },
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: '#1A1A1A',
                    fontWeight: 500,
                    fontSize: '14px',
                    '&.Mui-focused': {
                        color: '#C72030',
                    },
                },
            },
        },
    },
});

export const CMSPaymentsFilterModal: React.FC<CMSPaymentsFilterModalProps> = ({
    open,
    onOpenChange,
    onApply,
}) => {
    const [filters, setFilters] = useState({
        status: '',
        fromDate: '',
        toDate: '',
    });

    const handleInputChange = (field: string, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleApply = () => {
        onApply(filters);
        onOpenChange(false);
    };

    const handleReset = () => {
        setFilters({
            status: '',
            fromDate: '',
            toDate: '',
        });
    };

    return (
        <ThemeProvider theme={muiTheme}>
            <Dialog
                open={open}
                onClose={() => onOpenChange(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '8px',
                    },
                }}
            >
                <DialogContent sx={{ p: 4 }}>
                    <Box>
                        <div className="flex flex-row items-center justify-between space-y-0 pb-6">
                            <Typography variant="h6" fontWeight="600">
                                FILTER BY
                            </Typography>
                            <IconButton
                                onClick={() => onOpenChange(false)}
                                sx={{ color: (theme) => theme.palette.grey[500], p: 0 }}
                            >
                                <X size={20} />
                            </IconButton>
                        </div>

                        <div className="space-y-6">
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Select Payment Status</InputLabel>
                                <Select
                                    value={filters.status}
                                    label="Select Payment Status"
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    displayEmpty
                                    notched
                                >
                                    <MenuItem value="">Select Payment Status</MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                                </Select>
                            </FormControl>

                            <div className="flex items-center gap-3">
                                <TextField
                                    fullWidth
                                    label="From Date"
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={(e) => handleInputChange('fromDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                />
                                <span className="text-gray-500">–</span>
                                <TextField
                                    fullWidth
                                    label="To Date"
                                    type="date"
                                    value={filters.toDate}
                                    onChange={(e) => handleInputChange('toDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" className="flex-1" onClick={handleReset}>
                                    Reset
                                </Button>
                                <Button
                                    className="flex-1 bg-[#8B4B8C] hover:bg-[#7A3F7B] text-white"
                                    onClick={handleApply}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </Box>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
};
