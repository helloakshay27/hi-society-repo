import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { getFullUrl } from '@/config/apiConfig';
import axios from 'axios';
import { toast } from 'sonner';

interface AddToAnotherFlatModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any;
}

const fieldStyles = {
    height: { xs: 28, sm: 36, md: 45 },
    "& .MuiInputBase-input, & .MuiSelect-select": {
        padding: { xs: "8px", sm: "10px", md: "12px" },
    },
};

export const AddToAnotherFlatModal: React.FC<AddToAnotherFlatModalProps> = ({
    isOpen,
    onClose,
    userData,
}) => {
    const baseUrl = localStorage.getItem('baseUrl');
    const token = localStorage.getItem('token');

    const getSocietyId = () => {
        return localStorage.getItem('selectedUserSociety') || '';
    };

    const [formData, setFormData] = useState({
        email: '',
        firstname: '',
        lastname: '',
        number: '',
        pan_number: '',
        gst_number: '',
        society_id: '',
        flat: '',
        ownership: '',
        lives_here: false,
        allow_fitout: false,
        is_primary: false,
        intercom: '',
        landline: '',
        agreement_start_date: '',
        agreement_expire_date: '',
        status: true,
        name_on_bill: '',
    });

    const [loading, setLoading] = useState(false);
    const [towers, setTowers] = useState<any[]>([]);
    const [flats, setFlats] = useState<any[]>([]);
    const [selectedTower, setSelectedTower] = useState('');

    // Populate form with user data on mount
    useEffect(() => {
        if (userData && isOpen) {
            setFormData(prev => ({
                ...prev,
                email: userData.email || '',
                firstname: userData.firstname || userData.full_name?.split(' ')[0] || '',
                lastname: userData.lastname || userData.full_name?.split(' ')[1] || '',
                number: userData.mobile_number || userData.number || '',
                pan_number: userData.pan_number || '',
                gst_number: userData.gst_number || '',
                name_on_bill: userData.full_name || '',
                society_id: userData.society_id || '',
                lives_here: userData.lives_here !== false,
                allow_fitout: userData.allow_fitout !== false,
                status: userData.status !== false,
            }));
        }
    }, [userData, isOpen]);

    // Fetch towers when modal opens
    useEffect(() => {
        if (isOpen && token) {
            fetchTowers();
        }
    }, [isOpen, token]);

    const fetchTowers = async () => {
        try {
            const societyId = getSocietyId();
            if (!societyId || !token) {
                setTowers([]);
                return;
            }
            const url = getFullUrl(`/get_society_blocks.json?token=${token}&society_id=${societyId}`);
            const response = await axios.get(url);
            setTowers(Array.isArray(response.data.society_blocks) ? response.data.society_blocks : []);
        } catch (error) {
            console.error('Error fetching towers:', error);
            toast.error('Failed to load towers');
            setTowers([]);
        }
    };

    const handleTowerChange = async (towerId: string) => {
        setSelectedTower(towerId);
        if (towerId && token) {
            try {
                const societyId = getSocietyId();
                if (!societyId) {
                    setFlats([]);
                    return;
                }
                const url = getFullUrl(`/get_society_flats.json?token=${token}&society_id=${societyId}&society_block_id=${towerId}`);
                const response = await axios.get(url);
                setFlats(Array.isArray(response.data.society_flats) ? response.data.society_flats : []);
                setFormData(prev => ({ ...prev, flat: '' }));
            } catch (error) {
                console.error('Error fetching flats:', error);
                toast.error('Failed to load flats');
                setFlats([]);
            }
        } else {
            setFlats([]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as any;

        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: (e.target as HTMLInputElement).checked,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSelectChange = (name: string, value: any) => {
        if (name === 'tower') {
            handleTowerChange(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleClose = () => {
        setFormData({
            email: '',
            firstname: '',
            lastname: '',
            number: '',
            pan_number: '',
            gst_number: '',
            society_id: '',
            flat: '',
            ownership: '',
            lives_here: false,
            allow_fitout: false,
            is_primary: false,
            intercom: '',
            landline: '',
            agreement_start_date: '',
            agreement_expire_date: '',
            status: true,
            name_on_bill: '',
        });
        setSelectedTower('');
        setFlats([]);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.flat || !formData.ownership || !selectedTower) {
            toast.error('Please fill in all required fields (Tower, Flat, Resident Type)');
            return;
        }

        setLoading(true);

        try {
            const societyId = getSocietyId();
            const payload = {
                email: formData.email,
                firstname: formData.firstname,
                lastname: formData.lastname,
                number: formData.number,
                pan_number: formData.pan_number,
                gst_number: formData.gst_number,
                society_id: parseInt(societyId),
                flat: parseInt(formData.flat),
                ownership: formData.ownership,
                lives_here: formData.lives_here,
                allow_fitout: formData.allow_fitout,
                intercom: formData.intercom,
                landline: formData.landline,
                agreement_start_date: formData.agreement_start_date,
                agreement_expire_date: formData.agreement_expire_date,
                status: formData.status,
                name_on_bill: formData.name_on_bill,
            };

            const url = getFullUrl(`/crm/admin/add_to_another.json?token=${token}`);
            const response = await axios.post(url, payload);

            toast.success('User added to another flat successfully!');
            handleClose();
        } catch (error: any) {
            console.error('Error adding to another flat:', error);
            const errorMessage = error.response?.data?.message || 'Failed to add user to another flat';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Add to Another Flat
                </Typography>
                <IconButton size="small" onClick={handleClose}>
                    <Close />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        {/* Tower Selection */}
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tower</InputLabel>
                                <Select
                                    name="tower"
                                    value={selectedTower}
                                    onChange={(e) => handleTowerChange(e.target.value)}
                                    label="Tower"
                                    sx={fieldStyles}
                                >
                                    <MenuItem value="">Select Tower</MenuItem>
                                    {towers.map((tower: any) => (
                                        <MenuItem key={tower.id} value={tower.id}>
                                            {tower.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Flat Number Selection */}
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel>Flat Number</InputLabel>
                                <Select
                                    name="flat"
                                    value={formData.flat}
                                    onChange={(e) => handleSelectChange('flat', e.target.value)}
                                    label="Flat Number"
                                    sx={fieldStyles}
                                    disabled={!selectedTower}
                                >
                                    <MenuItem value="">Select Flat</MenuItem>
                                    {flats.map((flat: any) => (
                                        <MenuItem key={flat.id} value={flat.id}>
                                            {flat.flat_no}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Resident Type */}
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel>Resident Type</InputLabel>
                                <Select
                                    name="ownership"
                                    value={formData.ownership}
                                    onChange={(e) => handleSelectChange('ownership', e.target.value)}
                                    label="Resident Type"
                                    sx={fieldStyles}
                                >
                                    <MenuItem value="">Select</MenuItem>
                                    <MenuItem value="Owner">Owner</MenuItem>
                                    <MenuItem value="Tenant">Tenant</MenuItem>                                    <MenuItem value="caretaker">Caretaker</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Lives Here */}
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel>Lives Here</InputLabel>
                                <Select
                                    name="lives_here"
                                    value={formData.lives_here ? 'yes' : 'no'}
                                    onChange={(e) => handleSelectChange('lives_here', e.target.value === 'yes')}
                                    label="Lives Here"
                                    sx={fieldStyles}
                                >
                                    <MenuItem value="yes">Yes</MenuItem>
                                    <MenuItem value="no">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Allow Fitout */}
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel>Allow Fitout</InputLabel>
                                <Select
                                    name="allow_fitout"
                                    value={formData.allow_fitout ? '1' : '0'}
                                    onChange={(e) => handleSelectChange('allow_fitout', e.target.value === '1')}
                                    label="Allow Fitout"
                                    sx={fieldStyles}
                                >
                                    <MenuItem value="1">Yes</MenuItem>
                                    <MenuItem value="0">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Status */}
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status ? '1' : '0'}
                                    onChange={(e) => handleSelectChange('status', e.target.value === '1')}
                                    label="Status"
                                    sx={fieldStyles}
                                >
                                    <MenuItem value="1">Approved</MenuItem>
                                    <MenuItem value="0">Rejected</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Is Primary */}
                        <Box>
                            <FormControl fullWidth size="small">
                                <InputLabel>Is Primary</InputLabel>
                                <Select
                                    name="is_primary"
                                    value={formData.is_primary ? '1' : '0'}
                                    onChange={(e) => handleSelectChange('is_primary', e.target.value === '1')}
                                    label="Is Primary"
                                    sx={fieldStyles}
                                >
                                    <MenuItem value="1">Yes</MenuItem>
                                    <MenuItem value="0">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Landline Number */}
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                name="landline"
                                label="Landline Number"
                                value={formData.landline}
                                onChange={handleInputChange}
                                placeholder="0712-123456"
                                sx={fieldStyles}
                            />
                        </Box>

                        {/* Intercom Number */}
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                name="intercom"
                                label="Intercom Number"
                                value={formData.intercom}
                                onChange={handleInputChange}
                                placeholder="101"
                                sx={fieldStyles}
                            />
                        </Box>

                        {/* GST Number */}
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                name="gst_number"
                                label="GST Number"
                                value={formData.gst_number}
                                onChange={handleInputChange}
                                placeholder="Gst Number"
                                sx={fieldStyles}
                            />
                        </Box>

                        {/* PAN Number */}
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                name="pan_number"
                                label="PAN Number"
                                value={formData.pan_number}
                                onChange={handleInputChange}
                                placeholder="Pan Number"
                                sx={fieldStyles}
                            />
                        </Box>

                        {/* Agreement Start Date - Only for Tenant */}
                        {formData.ownership === 'Tenant' && (
                            <Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="agreement_start_date"
                                    label="Agreement Start Date"
                                    type="date"
                                    value={formData.agreement_start_date}
                                    onChange={handleInputChange}
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldStyles}
                                />
                            </Box>
                        )}

                        {/* Agreement Expire Date - Only for Tenant */}
                        {formData.ownership === 'Tenant' && (
                            <Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="agreement_expire_date"
                                    label="Agreement Expire Date"
                                    type="date"
                                    value={formData.agreement_expire_date}
                                    onChange={handleInputChange}
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldStyles}
                                />
                            </Box>
                        )}

                        {/* Name on Bill */}
                        <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                            <TextField
                                fullWidth
                                size="small"
                                name="name_on_bill"
                                label="Name on Bill"
                                value={formData.name_on_bill}
                                onChange={handleInputChange}
                                placeholder="Enter name on bill"
                                sx={fieldStyles}
                            />
                        </Box>

                        {/* Submit Button */}
                        <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' }, display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit'}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddToAnotherFlatModal;
