import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface OffersFilterParams {
    offerType?: string;
    startDateFrom?: string;
    startDateTo?: string;
    endDateFrom?: string;
    endDateTo?: string;
    status?: string;
    showOnHome?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
}

interface OffersFilterDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: OffersFilterParams) => void;
    initialFilters?: OffersFilterParams;
}

const OffersFilterDialog: React.FC<OffersFilterDialogProps> = ({
    isOpen,
    onClose,
    onApply,
    initialFilters = {}
}) => {
    const [filters, setFilters] = useState<OffersFilterParams>(initialFilters);

    useEffect(() => {
        if (isOpen) {
            setFilters(initialFilters);
        }
    }, [isOpen, initialFilters]);

    const hasFilters = Object.values(filters).some(value => value && value !== '');

    const handleFilterChange = (key: keyof OffersFilterParams, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        const emptyFilters: OffersFilterParams = {
            offerType: '',
            status: '',
            startDateFrom: '',
            startDateTo: '',
            endDateFrom: '',
            endDateTo: '',
            showOnHome: '',
            createdAtFrom: '',
            createdAtTo: ''
        };
        setFilters(emptyFilters);
        onApply(emptyFilters);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 600,
                    fontSize: '1.125rem'
                }}
            >
                FILTER BY
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-6 w-6 p-0 cursor-pointer"
                >
                    <X className="h-4 w-4" />
                </Button>
            </DialogTitle>
            <DialogContent dividers>
                <div className="space-y-4">

                    {/* Start Date Range */}
                    {/* <div className="grid grid-cols-2 gap-3">
                        <TextField
                            label="Start Date From"
                            type="date"
                            value={filters.startDateFrom || ''}
                            onChange={(e) => handleFilterChange('startDateFrom', e.target.value)}
                            fullWidth
                            size="small"
                            margin="dense"
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Start Date To"
                            type="date"
                            value={filters.startDateTo || ''}
                            onChange={(e) => handleFilterChange('startDateTo', e.target.value)}
                            fullWidth
                            size="small"
                            margin="dense"
                            InputLabelProps={{ shrink: true }}
                        />
                    </div> */}

                    {/* End Date Range */}
                    {/* <div className="grid grid-cols-2 gap-3">
                        <TextField
                            label="End Date From"
                            type="date"
                            value={filters.endDateFrom || ''}
                            onChange={(e) => handleFilterChange('endDateFrom', e.target.value)}
                            fullWidth
                            size="small"
                            margin="dense"
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="End Date To"
                            type="date"
                            value={filters.endDateTo || ''}
                            onChange={(e) => handleFilterChange('endDateTo', e.target.value)}
                            fullWidth
                            size="small"
                            margin="dense"
                            InputLabelProps={{ shrink: true }}
                        />
                    </div> */}

                    {/* Status */}
                    <FormControl fullWidth size="small" margin="dense">
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select
                            labelId="status-label"
                            id="status-select"
                            value={filters.status || ''}
                            label="Status"
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <MenuItem value="">Select</MenuItem>
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Inactive">Inactive</MenuItem>
                            <MenuItem value="Expired">Expired</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Show on Home */}
                    <FormControl fullWidth size="small" margin="dense">
                        <InputLabel id="show-on-home-label">Show on Home</InputLabel>
                        <Select
                            labelId="show-on-home-label"
                            id="show-on-home-select"
                            value={filters.showOnHome || ''}
                            label="Show on Home"
                            onChange={(e) => handleFilterChange('showOnHome', e.target.value)}
                        >
                            <MenuItem value="">Select</MenuItem>
                            <MenuItem value="true">Yes</MenuItem>
                            <MenuItem value="false">No</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Created At Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <TextField
                            label="Created From"
                            type="date"
                            value={filters.createdAtFrom || ''}
                            onChange={(e) => handleFilterChange('createdAtFrom', e.target.value)}
                            fullWidth
                            size="small"
                            margin="dense"
                            InputLabelProps={{ shrink: true }}
                        />
                        {/* <TextField
                            label="Created To"
                            type="date"
                            value={filters.createdAtTo || ''}
                            onChange={(e) => handleFilterChange('createdAtTo', e.target.value)}
                            fullWidth
                            size="small"
                            margin="dense"
                            InputLabelProps={{ shrink: true }}
                        /> */}
                    </div>

                    <p className="text-xs text-muted-foreground leading-snug">
                        Apply filters to narrow down the offers list.
                    </p>
                </div>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
                <Button
                    onClick={handleApply}
                    className="flex-1 text-white cursor-pointer disabled:opacity-60"
                    style={{ backgroundColor: '#C72030' }}
                    disabled={!hasFilters}
                >
                    Apply
                </Button>
                <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 cursor-pointer"
                    disabled={!hasFilters}
                >
                    Reset
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default OffersFilterDialog;
