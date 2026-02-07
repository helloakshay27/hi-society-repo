
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
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
} from '@mui/material';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';

interface CMSClubMembersFilterModalProps {
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
                    height: '45px',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1A1A1A',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#C72030',
                    },
                    '@media (max-width: 768px)': {
                        height: '36px',
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

export const CMSClubMembersFilterModal: React.FC<CMSClubMembersFilterModalProps> = ({
    open,
    onOpenChange,
    onApply,
}) => {
    const baseUrl = localStorage.getItem("baseUrl");
    const token = localStorage.getItem("token");
    const societyId = localStorage.getItem("selectedUserSociety");

    const [towers, setTowers] = useState([]);
    const [flats, setFlats] = useState([]);

    const [filters, setFilters] = useState({
        search: '',
        towerId: '',
        flatId: '',
        residentType: '',
        status: '',
        cardAllocated: '',
        expired: ''
    });

    useEffect(() => {
        if (open) {
            fetchTowers();
        }
    }, [open]);

    useEffect(() => {
        if (filters.towerId) {
            fetchFlats(filters.towerId);
        } else {
            setFlats([]);
        }
    }, [filters.towerId]);

    const fetchTowers = async () => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/crm/admin/society_blocks.json?society_id=${societyId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setTowers(response.data.society_blocks || []);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchFlats = async (towerId: string) => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/crm/admin/society_blocks/${towerId}/flats.json?q[active_eq]=true`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setFlats(response.data || []);
        } catch (error) {
            console.log(error);
        }
    };

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
        setFilters({
            search: '',
            towerId: '',
            flatId: '',
            residentType: '',
            status: '',
            cardAllocated: '',
            expired: ''
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
                    }
                }}
            >
                <DialogContent sx={{ p: 4 }}>
                    <Box>
                        <div className="flex flex-row items-center justify-between space-y-0 pb-6">
                            <Typography variant="h6" fontWeight="600">FILTER BY</Typography>
                            <IconButton
                                onClick={() => onOpenChange(false)}
                                sx={{ color: (theme) => theme.palette.grey[500], p: 0 }}
                            >
                                <X size={20} />
                            </IconButton>
                        </div>

                        <div className="space-y-6">
                            <TextField
                                fullWidth
                                label="Mobile/Email/Name search"
                                value={filters.search}
                                onChange={(e) => handleInputChange('search', e.target.value)}
                                size="small"
                                placeholder="Search..."
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormControl fullWidth size="small">
                                    <InputLabel shrink>Select Tower</InputLabel>
                                    <Select
                                        value={filters.towerId}
                                        label="Select Tower"
                                        onChange={(e) => handleInputChange('towerId', (e.target.value as string))}
                                        displayEmpty
                                        notched
                                    >
                                        <MenuItem value="">Select Tower</MenuItem>
                                        {towers.map((t: any) => (
                                            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth size="small" disabled={!filters.towerId}>
                                    <InputLabel shrink>Select Flat</InputLabel>
                                    <Select
                                        value={filters.flatId}
                                        label="Select Flat"
                                        onChange={(e) => handleInputChange('flatId', (e.target.value as string))}
                                        displayEmpty
                                        notched
                                    >
                                        <MenuItem value="">Select Flat</MenuItem>
                                        {flats.map((f: any) => (
                                            <MenuItem key={f.id} value={f.id}>{f.flat_no}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormControl fullWidth size="small">
                                    <InputLabel shrink>Select Resident Type</InputLabel>
                                    <Select
                                        value={filters.residentType}
                                        label="Select Resident Type"
                                        onChange={(e) => handleInputChange('residentType', (e.target.value as string))}
                                        displayEmpty
                                        notched
                                    >
                                        <MenuItem value="">Select Resident Type</MenuItem>
                                        <MenuItem value="Owner">Owner</MenuItem>
                                        <MenuItem value="Tenant">Tenant</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth size="small">
                                    <InputLabel shrink>Membership Status</InputLabel>
                                    <Select
                                        value={filters.status}
                                        label="Membership Status"
                                        onChange={(e) => handleInputChange('status', (e.target.value as string))}
                                        displayEmpty
                                        notched
                                    >
                                        <MenuItem value="">Select Status</MenuItem>
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormControl fullWidth size="small">
                                    <InputLabel shrink>Card Allocated</InputLabel>
                                    <Select
                                        value={filters.cardAllocated}
                                        label="Card Allocated"
                                        onChange={(e) => handleInputChange('cardAllocated', (e.target.value as string))}
                                        displayEmpty
                                        notched
                                    >
                                        <MenuItem value="">Select Options</MenuItem>
                                        <MenuItem value="true">Yes</MenuItem>
                                        <MenuItem value="false">No</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth size="small">
                                    <InputLabel shrink>Expired</InputLabel>
                                    <Select
                                        value={filters.expired}
                                        label="Expired"
                                        onChange={(e) => handleInputChange('expired', (e.target.value as string))}
                                        displayEmpty
                                        notched
                                    >
                                        <MenuItem value="">Select Options</MenuItem>
                                        <MenuItem value="true">Yes</MenuItem>
                                        <MenuItem value="false">No</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" className="flex-1" onClick={handleReset}>Reset</Button>
                                <Button className="flex-1 bg-[#8B4B8C] hover:bg-[#7A3F7B] text-white" onClick={handleApply}>Apply</Button>
                            </div>
                        </div>
                    </Box>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
};
