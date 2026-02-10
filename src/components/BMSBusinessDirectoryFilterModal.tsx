import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    IconButton,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    createTheme,
    ThemeProvider,
} from '@mui/material';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';

interface BMSBusinessDirectoryFilterModalProps {
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

export const BMSBusinessDirectoryFilterModal: React.FC<BMSBusinessDirectoryFilterModalProps> = ({
    open,
    onOpenChange,
    onApply,
}) => {
    const baseUrl = localStorage.getItem('baseUrl');
    const token = localStorage.getItem('token');

    const [filters, setFilters] = useState({
        category: '',
        subCategory: '',
        status: '',
    });

    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [allSubCategories, setAllSubCategories] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            fetchCategories();
            fetchSubCategories();
        }
    }, [open]);

    useEffect(() => {
        if (filters.category) {
            const filtered = allSubCategories.filter(
                (sub) => sub.bd_category_id === parseInt(filters.category)
            );
            setSubCategories(filtered);
        } else {
            setSubCategories([]);
            setFilters(prev => ({ ...prev, subCategory: '' }));
        }
    }, [filters.category, allSubCategories]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/crm/admin/bd_categories.json`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setCategories(response.data.bd_categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchSubCategories = async () => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/crm/admin/bd_sub_categories.json`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setAllSubCategories(response.data.bd_sub_categories || []);
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            setAllSubCategories([]);
        }
    };

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
            category: '',
            subCategory: '',
            status: '',
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
                                <InputLabel shrink>Select Category</InputLabel>
                                <Select
                                    value={filters.category}
                                    label="Select Category"
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    displayEmpty
                                    notched
                                >
                                    <MenuItem value="">Select Category</MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Select Sub Category</InputLabel>
                                <Select
                                    value={filters.subCategory}
                                    label="Select Sub Category"
                                    onChange={(e) => handleInputChange('subCategory', e.target.value)}
                                    displayEmpty
                                    notched
                                    disabled={!filters.category}
                                >
                                    <MenuItem value="">Select Sub Category</MenuItem>
                                    {subCategories.map((subCategory) => (
                                        <MenuItem key={subCategory.id} value={subCategory.id}>
                                            {subCategory.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Select Status</InputLabel>
                                <Select
                                    value={filters.status}
                                    label="Select Status"
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    displayEmpty
                                    notched
                                >
                                    <MenuItem value="">Select Status</MenuItem>
                                    <MenuItem value="true">Active</MenuItem>
                                    <MenuItem value="false">Inactive</MenuItem>
                                </Select>
                            </FormControl>

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
