import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Button as MuiButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { getFullUrl } from '@/config/apiConfig';

const SectionCard = styled(Paper)(() => ({
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '24px',
    border: '1px solid #E5E5E5',
}));

const SectionBody = styled(Box)(() => ({
    backgroundColor: '#FAFAF8',
    padding: '24px',
}));

const SectionHeader = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    backgroundColor: '#F6F4EE',
    padding: '12px 16px',
    border: '1px solid #D9D9D9',
}));

const IconWrapper = styled(Box)(() => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E0D3',
}));

const RedButton = styled(MuiButton)(() => ({
    backgroundColor: '#e7e3d9',
    color: '#B8252F',
    borderRadius: 0,
    textTransform: 'none',
    padding: '8px 16px',
    fontFamily: 'Work Sans, sans-serif',
    fontWeight: 500,
    boxShadow: '0 2px 4px rgba(199, 32, 48, 0.2)',
}));

const CancelButton = styled(MuiButton)(() => ({
    backgroundColor: '#e7e3d9',
    color: '#C72030',
    borderRadius: 0,
    textTransform: 'none',
    padding: '8px 16px',
    fontFamily: 'Work Sans, sans-serif',
    fontWeight: 500,
    '&:hover': {
        backgroundColor: '#e7e3d9',
    },
}));

const fieldStyles = {
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
        fontSize: '14px',
        '& fieldset': {
            borderColor: '#ddd',
        },
        '&:hover fieldset': {
            borderColor: '#C72030',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#C72030',
        },
    },
    '& .MuiInputLabel-root': {
        fontSize: '14px',
        '&.Mui-focused': {
            color: '#C72030',
        },
    },
    '& .MuiInputBase-input': {
        fontSize: '14px',
        fontFamily: 'Work Sans, sans-serif',
    },
};

interface TemplateFormData {
    title: string;
    description: string;
    externalUrl: string;
    status: string;
}

export default function AddTemplatePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [formData, setFormData] = useState<TemplateFormData>({
        title: '',
        description: '',
        externalUrl: '',
        status: 'Active',
    });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchTemplateDetails();
        }
    }, [id]);

    const fetchTemplateDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                getFullUrl(`/offer_templates/${id}.json`),
                {
                    params: {
                        token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
                    }
                }
            );
            const template = response.data;
            setFormData({
                title: template.title || '',
                description: template.description || '',
                externalUrl: template.external_url || '',
                status: template.active === null || template.active ? 'Active' : 'Inactive',
            });
        } catch (error) {
            console.error('Error fetching template:', error);
            toast.error('Failed to load template details');
            navigate('/settings/template-list');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.title.trim()) {
            toast.error('Please enter template title');
            return false;
        }
        if (!formData.description.trim() && !formData.externalUrl.trim()) {
            toast.error('Please enter either description or external URL');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                offer_template: {
                    title: formData.title,
                    description: formData.description || null,
                    external_url: formData.externalUrl || null,
                }
            };

            if (isEditMode) {
                await axios.put(
                    getFullUrl(`/offer_templates/${id}.json`),
                    payload,
                    {
                        params: {
                            token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
                        }
                    }
                );
                toast.success('Template updated successfully!');
            } else {
                await axios.post(
                    getFullUrl('/offer_templates.json'),
                    payload,
                    {
                        params: {
                            token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
                        }
                    }
                );
                toast.success('Template created successfully!');
            }

            setTimeout(() => {
                navigate('/settings/template-list');
            }, 1000);
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} template. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/settings/template-list');
    };

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, sm: 4, lg: 6 }, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Typography>Loading template...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 4, lg: 6 }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Toaster position="top-right" richColors closeButton />

            {/* Breadcrumb */}
            <Typography variant="body2" sx={{ mb: 3, color: '#666', fontFamily: 'Work Sans, sans-serif' }}>
                Template &gt; {isEditMode ? 'Edit' : 'Create'}
            </Typography>

            {/* Template Form */}
            <SectionCard>
                <SectionHeader>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <IconWrapper>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C72030" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </IconWrapper>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Work Sans, sans-serif', textTransform: 'uppercase', fontSize: '18px' }}>
                            Template
                        </Typography>
                    </Box>
                </SectionHeader>
                <SectionBody>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <TextField
                            label="Title"
                            required
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Enter Title"
                            sx={fieldStyles}
                            fullWidth
                        />
                        <FormControl fullWidth sx={fieldStyles}>
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select
                                labelId="status-label"
                                value={formData.status}
                                label="Status"
                                onChange={(e) => handleInputChange('status', e.target.value)}
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ mt: 3, width: "100%" }}>
                          <TextField
                           label="Description"
                            required={!formData.externalUrl}
                            value={formData.description}
                            onChange={(e) =>
                        handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter Description"
                    fullWidth
                    multiline
                    minRows={6}
                    maxRows={12}
                    sx={{
                          ...fieldStyles,

                        "& .MuiOutlinedInput-root": {
                         alignItems: "flex-start", // 🔑 VERY IMPORTANT

                         "& textarea": {
                         resize: "vertical",
                         overflow: "hidden", // 🔑 remove middle scrollbar
                         padding: "16.5px 14px",
                      },

                        "& fieldset": {
                        borderColor: "#ddd",
                     },
                         "&.Mui-focused fieldset": {
                        borderColor: "#C72030",
                     },
                   },
                 }}
                 />
            </Box>

                       
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Work Sans, sans-serif' }}>
                            Or
                        </Typography>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                        <TextField
                            label="External URL"
                            value={formData.externalUrl}
                            onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                            placeholder="Enter URL"
                            sx={fieldStyles}
                            fullWidth
                        />
                    </Box>
                </SectionBody>
            </SectionCard>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                <RedButton onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit'}
                </RedButton>
                <CancelButton onClick={handleCancel} disabled={submitting}>
                    Cancel
                </CancelButton>
            </Box>
        </Box>
    );
}